import handlers from './modules/handlers';
import msg from './modules/msg';
import form from './modules/form';
import runner from './modules/runner';
import $ from 'jquery';
import {
    get_projects,
    get_issues_with_today_worklogs,
    get_issues_by_key,
    get_issue_status,
    get_issue_statuses,
    update_issue_status,
    add_worklog
} from './api';

// here we use SHARED message handlers, so all the contexts support the same
// commands. but this is NOT typical messaging system usage, since you usually
// want each context to handle different commands. for this you don't need
// handlers factory as used below. simply create individual `handlers` object
// for each context and pass it to msg.init() call. in case you don't need the
// context to support any commands, but want the context to cooperate with the
// rest of the extension via messaging system (you want to know when new
// instance of given context is created / destroyed, or you want to be able to
// issue command requests from this context), you may simply omit the
// `handlers` parameter for good when invoking msg.init()

$(document).ready(function() {

    var serverUrl = window.localStorage.getItem('active-server-url');
    var jiraInfo = {};
    var selectedIssue = null;
    var selectProject = true;
    var openProject = true;
    var openWorklogs = true;
    var addWorklog = true;

    window.onbeforeunload = function () {
        return false;
    };

    // ---------- Check Validation User ---------- //
    function setUserInfo(data) {
        $('#work-logged').text('');
        showLoaderDot();
        get_issues_with_today_worklogs().then(function (timeLogged) {
            $('#work-logged').text(timeLogged);
            hideLoaderDot();
        });
        $('#valid-user').removeClass('block--hide');
        $('#first-step').addClass('block--hide');
        $('#userAvatar').attr("src", data['issues'][0]['fields']['assignee']['avatarUrls']['48x48']);
        $('#userName').text(data['issues'][0]['fields']['assignee']['displayName']);
        $('#userMail').text(data['issues'][0]['fields']['assignee']['emailAddress']);
        $('#jira-key').text(data['issues'][0]['key'].replace(/[^a-zA-Z]+/g, ''));
        $('#jira-key').attr('href', JSON.parse(window.localStorage.getItem('active-server-url')).url);
        return userName;
    }

    function showAuthError(el) {
        $(el).removeClass('block--hide');
    }

    function hideAuthError(el) {
        $(el).addClass('block--hide');
    }
    
    async function checkValidation(data) {
        var theUrl = data.url + '/rest/api/2/search?jql=project=' + data.key + ' AND assignee=currentuser()';
        return new Promise(function (resolve, reject) {
            $.ajax({
                url: theUrl,
                success: function (data) {
                    resolve(data);
                },
                error: function (error) {
                    reject(error);
                }
            });
        });
    }
    // ---------- END: Check Validation User ---------- //

    // ------------ Main Function ----------- //
    function showLoader() {
        $('#loading').show();
    }

    function hideLoader() {
        $('#loading').hide();
    }

    function showLoaderDot() {
        $('#loaderDot').show();
    }

    function hideLoaderDot() {
        $('#loaderDot').hide();
    }

    function copyAll() {
        var copyText = document.getElementById('standup-text');
        copyText.select();
        document.execCommand('copy');
    }

    function rememberJiraUrl(data) {
        var jiraServers = JSON.parse(window.localStorage.getItem('jira-servers'));
        var server = {};
        var isValid = checkValidation(data).then(function (response) {
            if (response.total != 0) {
                if (jiraServers == null || Object.keys(jiraServers).length == 0) {
                    server = {
                        0: data
                    };
                    window.localStorage.setItem('jira-servers', JSON.stringify(server));
                    return response;
                } else {
                    var keys = Object.keys(jiraServers);
                    var values = Object.values(jiraServers);
                    var duplicate = values.some(item => {
                        return item.key == data.key;
                    });
                    if (duplicate) {
                        hideLoader();
                        hideAuthError('.http-error');
                        showAuthError('.project-exist');                        
                        return false;
                    } else {
                        jiraServers[Number(keys[keys.length - 1]) + 1] = data;
                        window.localStorage.setItem('jira-servers', JSON.stringify(jiraServers));
                        return true;
                    }
                }
            } else {
                hideLoader();
                hideAuthError('.http-error');
                showAuthError('.not-data');
            }
        }).catch(function (error) {
            return error;
        });
        return isValid;
    }
    
    function removeSavedServer(projectKey) {
        var jiraServers = JSON.parse(window.localStorage.getItem('jira-servers'));
        var project = Object.keys(jiraServers).find(key => jiraServers[key].key === projectKey);
        delete jiraServers[project];
        window.localStorage.setItem('jira-servers', JSON.stringify(jiraServers));
        window.localStorage.setItem('active-server-url', '');
        showSavedJiraUrl();
    }

    function getSavedJiraUrl() {
        var jiraServers = JSON.parse(window.localStorage.getItem('jira-servers'));
        if (jiraServers == null) {
            return [];
        }
        return Object.values(jiraServers);
    }

    function showSavedJiraUrl() {
        var servers = getSavedJiraUrl();
        $('#saved-servers').empty();
        if (servers.length > 0) {
            for (let i = 0; i < servers.length; i++) {
                $('#saved-servers').append(
                    "<p class='http-error please-auth block--hide'>Please, login to the link!</p>" +
                    "<div class='servers-btn'>" +
                        "<button class='saved-servers__btn' value='" + JSON.stringify({ url: servers[i].url, key: servers[i].key }) + "'>"
                            + servers[i].name +
                        "</button>" +
                        "<button class='remove-servers-btn' value='"
                            + servers[i].key + "'>" +
                            "<img src='../images/bucket.svg' alt='Remove'>" +
                        "</button>" +
                    "</div>"
                );
            }
        } else {
            $('#saved-servers').html(
                '<h5 class="saved-servers--empty">Server list is empty</h5>'
            );
            window.localStorage.setItem('active-server-url', '');
            return false;
        }
    }

    $('#saved-servers').on('click', function (e) {
        if (openProject) {
            openProject = false;
            if (e.target.className == 'saved-servers__btn') {
                var value = JSON.parse(e.target.value);
                showLoader();
                checkValidation(value).then(function (data) {
                    openProject = true;
                    hideLoader();
                    window.localStorage.setItem('active-server-url', JSON.stringify(value));
                    setUserInfo(data);
                }).catch(function (error) {
                    openProject = true;
                    hideLoader();
                    $(e.target).parent().prev().removeClass('block--hide');
                });
            } else if (e.target.className == 'remove-servers-btn') {
                openProject = true;
                removeSavedServer(e.target.value);
            }
        }
    });

    $('#copyAll').on('click', function () {
        $(this).text('Copied');
        copyAll();
    });

    $('#go-auth-step').on('click', function () {
        $('#valid-user').addClass('block--hide');
        $('#projects').addClass('block--hide');
        $('#first-step').removeClass('block--hide');
        $('.add-server__desc').removeClass('block--hide');
        showSavedJiraUrl();
    });

    $('#rememberJiraUrl').on('click', function () {
        $(this).text('Saved!');
        var insertedUrl = $('#server-url').val();
        rememberJiraUrl(insertedUrl);
    });

    $('#add-server').on('click', function () {
        $('#add-server-wrap').removeClass('add-server-wrap--disable');
        $('#add-server-wrap input').focus();
        $(document).on('keyup', function(e) {
            if (e.keyCode == 13 && $('#add-server-wrap input').val() != '') {
                addNewProject();
            }
        });
    });

    $('#add-server__close').on('click', function () {
        hideAuthError('.http-error');
        $('#saved-servers').removeClass('block--hide');
        $('#projects').addClass('block--hide');
        $('.add-server__desc').removeClass('block--hide');
        $('#add-server-wrap').addClass('add-server-wrap--disable');
    });

    $('#add-server__btn').on('click', function () {
        addNewProject();
    });
    
    // ------------------ //

    $(document).on('click', function (e) {
        if (e.target.className == 'projects_item') {
            var value = JSON.parse(e.target.value);
            saveNewProject(value);
        }
    });

    function validateUrl(url) {
        if (url.includes('https://pm.maddevs.co')) {
            return 'https://pm.maddevs.co';
        }
        if (url.includes('atlassian.net')) {
            var positionKey = url.indexOf('atlassian.net');
            return url.substring(0, positionKey + 'atlassian.net'.length);
        }
        return false;
    }
    
    function addNewProject() {
        var inputUrl = $('#server-url').val();
        var resultUrl = validateUrl(inputUrl);
        showLoader(); 
        if (resultUrl != false) {
            get_projects(resultUrl).then(res => {
                if (res.length != 0) {
                    hideLoader();
                    hideAuthError('.not-auth');
                    $('#saved-servers').addClass('block--hide');
                    $('.add-server__desc').addClass('block--hide');
                    $('#projects').removeClass('block--hide');
                    $('#projects').empty();
                    for (let i = 0; i < res.length; i++) {
                        $('#projects').append(
                            "<button class='projects_item' value='" + JSON.stringify({
                                url: resultUrl,
                                name: res[i].name,
                                key: res[i].key
                            }) + "'>" + res[i].key + ' - ' + res[i].name + "</button>"
                        );
                    }
                } else {
                    hideLoader();
                    showAuthError('.not-auth');
                }
            });
        } else {
            hideLoader();
            showAuthError('.incorrect-link');
        }
    }

    function saveNewProject(data) {
        if (selectProject) {
            selectProject = false;
            showLoader();
            rememberJiraUrl(data).then(function (res) {
                selectProject = true;
                if (res != false && res != undefined) {
                    hideAuthError('.http-error');
                    window.localStorage.setItem('active-server-url', JSON.stringify(data));
                    showUserInfoSection(data);
                }
            }).catch(function (error) {
                selectProject = true;
                hideLoader();
                if (error.status == 403 || error.status == 400) {
                    hideAuthError('.http-error');
                    showAuthError('.not-auth');
                } else {
                    hideAuthError('.http-error');
                    showAuthError('.incorrect-link');
                }
            });
        }
    }

    function showUserInfoSection(data) {
        checkValidation(data).then(function (res) {
            hideLoader();
            setUserInfo(res);
            jiraInfo = res;
            $('#add-server-wrap input').val('');
            $('#saved-servers').removeClass('block--hide');
        }).catch(function (error) {
            hideLoader();
            $('#first-step').removeClass('block--hide');
            showSavedJiraUrl();
        });
    }

    // -------------- Worklogs ------------------ //
    $('#worklogs-open').on('click', function () {
        if (openWorklogs) {
            openWorklogs = false;
            showLoader();
            $('#issue-key_title').text('');
            $('#worklogs-issuekey').val('')
            var data = JSON.parse(window.localStorage.getItem('active-server-url'));
            checkValidation(data).then(function (res) {
                openWorklogs = true;
                hideLoader();
                jiraInfo = res;
                $('#worklogs').removeClass('block--hide');
                $('#valid-user').addClass('block--hide');
                $('#worklogs-issuekey_label').text(jiraInfo['issues'][0]['key'].replace(/[^a-zA-Z]+/g, '') + '-');
            }).catch(function (error) {
                openWorklogs = true;
                hideLoader();
                console.log(error);
            });
        }
    });

    function getIssueStatuses(issueKey) {
        get_issue_statuses(issueKey).then(async statuses => {
            $('#listStatuses').empty();
            var currentStatus = await get_issue_status(issueKey);
            var select = $('#listStatuses');
            $('.worklogs_taskinfo').show();
            if (statuses.transitions.length) {
                $('#select').removeClass('listStatuses-ready');
                statuses.transitions.forEach(val => {
                    select.append($("<button class='statuses-button'></button>").attr("value", val.id).text(val.name));
                });
            } else {
                $('#select').addClass('listStatuses-ready');
            }
            $('#carrentStatus').text(currentStatus.fields.status.name);
        });
    }

    var timeout = null;
    $('#worklogs-issuekey').on('keyup', function () {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(function () {
            showLoader();
            var issueKey = jiraInfo['issues'][0]['key'].replace(/[^a-zA-Z]+/g, '') + '-' + $('#worklogs-issuekey').val();
            selectedIssue = issueKey;
            get_issues_by_key(issueKey).then(data => {
                hideLoader();
                $('#issue-key_title--error').addClass('block--hide');
                $('#select').removeClass('listStatuses-show');
                $('#issue-key_title').text(data.issues[0].fields.summary);
                getIssueStatuses(issueKey);
            }).catch(e => {
                hideLoader();
                $('.worklogs_taskinfo').hide();
                $('#issue-key_title').text('');
                $('#issue-key_title--error').removeClass('block--hide');
            });
        }, 500);
    });

    $(document).on('click', function (e) {
        if (e.target.className.includes('statuses-button')) {
            var request = {
                issueKey: selectedIssue,
                status_id: e.target.value
            }
            update_issue_status(request).then(res => {
                getIssueStatuses(selectedIssue);
            }).catch(function (e) {
                $('#select').removeClass('listStatuses-show');
            });
        }
    });

    $('#carrentStatus').on('click', function() {
        $('#select').toggleClass('listStatuses-show');
    });

    $('#worklogs-send').on('click', function () {
        if (addWorklog) {
            addWorklog = false;
            var data = {
                issue: $('#worklogs-issuekey_label').text() + $('#worklogs-issuekey').val(),
                time: $('#worklogs-time').val() == '' ? '1m' : $('#worklogs-time').val(),
                comment: $('#worklogs-comment').val()
            };
    
            hideAuthError('.http-error');
    
            if (data.comment != '') {
                showLoader();
                add_worklog(data).then(function (res) {
                    if (res == true) {
                        addWorklog = true;
                        hideLoader();
                        hideAuthError('.invalid-timespent');
                        hideAuthError('.invalid-comment');
                        $('#work-logged').addClass('block--hide');
                        showLoaderDot();
                        get_issues_with_today_worklogs().then(function (timeLogged) {
                            hideLoaderDot();
                            $('#work-logged').text(timeLogged);
                            $('#work-logged').removeClass('block--hide');
                        }).catch(function (e) {
                            console.log(e);
                        });
                        $('#worklogs').addClass('block--hide');
                        $('#valid-user').removeClass('block--hide');
                    }
                }).catch(function (e) {
                    addWorklog = true;
                    hideLoader();
                    showAuthError('.incorrect-data');
                });
            } else {
                addWorklog = true;
                hideLoader();
                showAuthError('.invalid-comment');
            }
        }
    });

    $('#go-info-step').on('click', function () {
        $('#valid-user').removeClass('block--hide');
        $('#worklogs').addClass('block--hide');
    });

    // -------------- INIT ---------------- //
    (function init() {
        showLoader();
        if (serverUrl != '') {
            showUserInfoSection(JSON.parse(serverUrl));
        } else {
            hideLoader();
            $('#first-step').removeClass('block--hide');
            showSavedJiraUrl();
        }
    })();
});

form.init(runner.go.bind(runner, msg.init('popup', handlers.create('popup'))));
