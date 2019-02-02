$(document).ready(function() {

    var servers = ['https://kickico4.atlassian.net', 'https://nappyclub.atlassian.net', 'https://pm.maddevs.co'];
    var serverUrl = window.localStorage.getItem('active-server-url');
    var userInfo = {};

    function httpGet(method, url) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.onload = resolve;
            xhr.onerror = reject;
            xhr.send();
        });
    }

    window.onbeforeunload = function () {
        return false;
    };

    // ---------- Check Validation User ---------- //
    function setUserInfo(data) {
        $('#valid-user').removeClass('block--hide');
        $('#wrap-no-valid').addClass('block--hide');
        $('#userAvatar').attr("src", data['issues'][0]['fields']['assignee']['avatarUrls']['48x48']);
        $('#userName').text(data['issues'][0]['fields']['assignee']['displayName']);
        $('#userMail').text(data['issues'][0]['fields']['assignee']['emailAddress']);
        return userName;
    }

    function getUserInfo(url) {
        var theUrl = url + '/rest/api/2/search?jql=assignee=currentuser()';
        httpGet('GET', theUrl).then(function (data) {
            var r = JSON.parse(data.target.response);
            userInfo = r['issues'][0]['fields']['assignee'];
        });
    }

    function showAuthError(el) {
        $(el).removeClass('block--hide');
    }

    function hideAuthError(el) {
        $(el).addClass('block--hide');
    }
    
    function checkValidation(url) {
        var theUrl = url + '/rest/api/2/search?jql=assignee=currentuser()';
        httpGet('GET', theUrl).then(function (data) {
            hideAuthError('.not-link');
            var r = JSON.parse(data.target.response);
            if (data.target.status == 400) {
                showAuthError('.not-auth');
            } else {
                hideAuthError('.not-auth');
                localStorage.setItem('active-server-url', url);
                return setUserInfo(r);
            }
        }, function (e) {
            showAuthError('.not-link');
        });
    }

    $('#checkConnectJira').on('click', function () {
        var serverUrl = $('#server-url').val();
        checkValidation(serverUrl);
    });
    
    getUserInfo(serverUrl);
    // ---------- END: Check Validation User ---------- //

    // -------------- Generate StandUp ---------------- //
    $('#getStandup').on('click', function () {
        generateStandUp();
    });

    function get_yesterday() {
        var today = new Date();
        if (today.getDay() == 1) {
            return today.getUTCFullYear() + '-' + ('0' + (today.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + (today.getDate() - 3)).slice(-2);
        } else if (today.getDay() == 0) {
            return today.getUTCFullYear() + '-' + ('0' + (today.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + (today.getDate() - 2)).slice(-2);
        } else if (today.getDate() == 1) {
            var prevMonth =  today.setDate(today.getDate() - 1);
            var yesterday = new Date(prevMonth);
            return yesterday.getUTCFullYear() + '-' + ('0' + (yesterday.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + (yesterday.getDate())).slice(-2);
        } else {
            return today.getUTCFullYear() + '-' + ('0' + (today.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + (today.getDate() - 1)).slice(-2);
        }
    }

    function showStandUp(arrayText) {
        
        var texts = arrayText.reverse();
        var yesterday = '';
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

    async function generateStandUp() {
        var issues = await get_issues_with_worklogs();
        var keys = await get_issues_keys(issues);
        var worklogs = await get_worklogs_comments_from_issues(keys);
        var comments = await get_currentUser_comments(worklogs);
        var d = await done();
        showStandUp(comments);
    }

    function get_issues_with_worklogs() {
        return new Promise(resolve => {
            var theUrl = serverUrl + '/rest/api/2/search?jql=worklogDate=' + '"' + get_yesterday() + '"' + ' AND worklogAuthor=currentuser()&fields=worklog&maxResults';
            httpGet('GET', theUrl).then(function(data) {
                var issuesWithLogs = JSON.parse(data.target.response);
                resolve(issuesWithLogs['issues']);
            }, function (e) {
                alert(e);
            });
        });
    };

    function get_issues_keys(issues) {
        return new Promise(resolve => {
            var comments = [];
            issues.forEach(function (issue) {
                comments.push(issue['key']);
                resolve(comments);
            });
        });
    };

    function get_worklogs_comments_from_issues(issueKey) {
        return new Promise(resolve => {
            var comments = [];
            issueKey.forEach(function (key) {
                var theUrl = serverUrl + '/rest/api/2/issue/' + key + '/worklog';               
                var issueLink = serverUrl + '/browse/' + key;
                $.ajax({
                    url: theUrl,
                    async: false,
                    success: function (data) {
                        var commentObj = {
                            comments: data['worklogs'],
                            link: issueLink
                        }
                        comments.push(commentObj);
                        resolve(comments);
                    }
                });
            });
        });
    };

    function get_currentUser_comments(listLogs) {
        return new Promise(resolve => {
            var array = [];
            listLogs.forEach(logs => {
                var obj = {
                    comments: [],
                    link: logs.link
                }
                logs.comments.forEach(function (log) {
                    if (log['created'].slice(0, 10) == get_yesterday() &&
                        userInfo['name'] == log['author']['name']) {
                        obj.comments.push(log['comment']);
                    }
                });
                array.push(obj);
                resolve(array);
            });
        });
    };
    
    function done() {
        return new Promise(resolve => {
            setTimeout(function () {
                resolve('DONE!');
            }, 0);
        });
    };

    // ---------- END: Generate StandUp ---------- //

    // ------------ Main Function ----------- //
    $('#copyAll').on('click', function () {
        $(this).text('Copied');
        copyAll();
    });

    function copyAll() {
        var copyText = document.getElementById('standup-text');
        copyText.select();
        document.execCommand('copy');
    }

    $('#rememberJiraUrl').on('click', function () {
        $(this).text('Saved!');
        var insertedUrl = $('#server-url').val();
        rememberJiraUrl(insertedUrl);
    });

    function rememberJiraUrl(url) {
        var jiraServers = JSON.parse(window.localStorage.getItem('jira-servers'));
        var server = {};

        if (jiraServers == null) {
            server = {
                0: url
            };
            window.localStorage.setItem('jira-servers', JSON.stringify(server));
        } else {
            var keys = Object.keys(jiraServers);
            var values = Object.values(jiraServers);
            for (let i = 0; i < values.length; i++) {
                if (jiraServers[i] != url) {
                    jiraServers[Number(keys[keys.length-1]) + 1] = url;
                    window.localStorage.setItem('jira-servers', JSON.stringify(jiraServers));
                    break;
                } else {
                    alert('Url exist');
                }
            }
        }
    }

    function getSavedJiraUrl() {
        var jiraServers = JSON.parse(window.localStorage.getItem('jira-servers'));
        return Object.values(jiraServers);
    }

    function showSavedJiraUrl() {
        var servers = getSavedJiraUrl();
        for (let i = 0; i < servers.length; i++) {
            $('#saved-servers').append(
                '<button class="saved-servers__btn check-connect-jira" value="' + servers[i] + '">' + servers[i] + '</button>'
            );
        }
    }

    $('#saved-servers').on('click', function (e) {
        if (e.target.nodeName == 'BUTTON') {
            checkValidation(e.target.value);
        }
    });
    // -------------- INIT ---------------- //
    function init() {
        showSavedJiraUrl();
    }
    init();
});
