import {
    generateStandUp,
    get_issues_with_today_worklogs
} from './api.js';


$(document).ready(function() {

    var serverUrl = window.localStorage.getItem('active-server-url');

    window.onbeforeunload = function () {
        return false;
    };

    // ---------- Check Validation User ---------- //
    function setUserInfo(data) {
        get_issues_with_today_worklogs().then(function (timeLogged) {
            $('#work-logged').text(timeLogged);
            $('#valid-user').removeClass('block--hide');
            $('#first-step').addClass('block--hide');
            $('#userAvatar').attr("src", data['issues'][0]['fields']['assignee']['avatarUrls']['48x48']);
            $('#userName').text(data['issues'][0]['fields']['assignee']['displayName']);
            $('#userMail').text(data['issues'][0]['fields']['assignee']['emailAddress']);
            $('#jira-key').text(data['issues'][0]['key'].replace(/[^a-zA-Z]+/g, ''));
        });
        return userName;
    }

    function showAuthError(el) {
        $(el).removeClass('block--hide');
    }

    function hideAuthError(el) {
        $(el).addClass('block--hide');
    }
    
    async function checkValidation(url) {
        var theUrl = url + '/rest/api/2/search?jql=assignee=currentuser()';
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

    // -------------- Generate StandUp ---------------- //
    $('#getStandup').on('click', function () {
        getStandUp();
    });

    function showStandUp(arrayText) {
        var texts = arrayText.reverse();
        var yesterday = '';
        hideLoader();
        for (let i = 0; i < texts.length; i++) {
            var comment = '';
            for (let j = 0; j < texts[i]['comments'].length; j++) {
                comment += texts[i]['comments'][j] + ' ';
            }
            yesterday += '- ' + comment.trim() + ' ' + texts[i]['link'] + '\n';
        }
        $('#standup-text').text(
            'Доброе утро! @comedian\n\n*Вчера*\n' + yesterday +
            '\n*Сегодня*\n -' +
            '\n\n*Проблемы*\n - Нет проблем!'
        );
    }

    async function getStandUp() {
        showLoader();
        var standup = await generateStandUp();
        showStandUp(standup);
    }
    // ---------- END: Generate StandUp ---------- //

    // ------------ Main Function ----------- //
    function showLoader() {
        $('#loading').show();
    }

    function hideLoader() {
        $('#loading').hide();
    }

    function copyAll() {
        var copyText = document.getElementById('standup-text');
        copyText.select();
        document.execCommand('copy');
    }

    function rememberJiraUrl(url) {
        var jiraServers = JSON.parse(window.localStorage.getItem('jira-servers'));
        var server = {};
        var isValid = checkValidation(url).then(function (response) {
            if (jiraServers == null || Object.keys(jiraServers).length == 0) {
                server = {
                    0: url
                };
                window.localStorage.setItem('jira-servers', JSON.stringify(server));
                return response;
            } else {
                var keys = Object.keys(jiraServers);
                var values = Object.values(jiraServers);
                if (values.includes(url)) {
                    return false;
                }
                jiraServers[Number(keys[keys.length - 1]) + 1] = url;
                window.localStorage.setItem('jira-servers', JSON.stringify(jiraServers));
                return true;
            }
        }).catch(function (error) {
            return error;
        });
        return isValid;
    }
    
    function removeSavedServer(url) {
        var jiraServers = JSON.parse(window.localStorage.getItem('jira-servers'));
        var urlID = Object.keys(jiraServers).find(key => jiraServers[key] === url);
        delete jiraServers[urlID];
        window.localStorage.setItem('jira-servers', JSON.stringify(jiraServers));
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
                    '<p class="http-error please-auth block--hide">Please, login to the link!</p>' +
                    '<div class="servers-btn">' +
                        '<button class="saved-servers__btn" value="' + servers[i] + '">'
                            + servers[i] +
                        '</button>' +
                        '<button class="remove-servers-btn" value="'
                            + servers[i] + '">' +
                            '<img src="img/bucket.svg" alt="Remove">' +
                        '</button>' +
                    '</div>'
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
        if (e.target.className == 'saved-servers__btn') {
            showLoader();
            checkValidation(e.target.value).then(function (data) {
                hideLoader();
                window.localStorage.setItem('active-server-url', e.target.value);
                setUserInfo(data);
            }).catch(function (error) {
                hideLoader();
                $(e.target).parent().prev().removeClass('block--hide');
            });
        } else if (e.target.className == 'remove-servers-btn') {
            removeSavedServer(e.target.value);
        }
    });

    $('#copyAll').on('click', function () {
        $(this).text('Copied');
        copyAll();
    });

    $('#go-auth-step').on('click', function () {
        $('#valid-user').addClass('block--hide');
        $('#first-step').removeClass('block--hide');
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
                addNewJira();
            }
        });
    });

    $('#add-server__close').on('click', function () {
        hideAuthError('.http-error');
        $('#add-server-wrap').addClass('add-server-wrap--disable');
    });

    $('#add-server__btn').on('click', function () {
        addNewJira();
    });
    
    function addNewJira() {
        var serverUrl = $('#server-url').val();
        showLoader();
        if (serverUrl != '') {
            rememberJiraUrl(serverUrl).then(function(res) {
                if (res != false && res != undefined) {
                    hideLoader();
                    hideAuthError('.http-error');
                    window.localStorage.setItem('active-server-url', serverUrl);
                    $('#add-server-wrap input').val('');
                    setUserInfo(res);
                } else {
                    hideLoader();
                    showAuthError('.url-exist');
                }
            }).catch(function (error) {
                hideLoader();
                if (error.status == 403 || error.status == 400) {
                    showAuthError('.not-auth');
                } else {
                    hideAuthError('.not-link');
                    showAuthError('.incorrect-link');
                }
            });
        } else {
            hideLoader();
            showAuthError('.not-link');
        }
    }

    // -------------- INIT ---------------- //
    (function init() {
        showLoader();
        checkValidation(serverUrl).then(function (data) {
            hideLoader();
            setUserInfo(data);
        }).catch(function (error) {
            hideLoader();
            $('#first-step').removeClass('block--hide');
            showSavedJiraUrl();
        });
    })();
});
