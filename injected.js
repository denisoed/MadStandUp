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
        } else {
            return today.getUTCFullYear() + '-' + ('0' + (today.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + (today.getDate() - 1)).slice(-2);
        }
    }
    
    function get_yesterday_issues_with_worklogs() {
        return new Promise(resolve => {
            var theUrl = serverUrl + '/rest/api/2/search?jql=worklogDate=' + '"' + get_yesterday() + '"' + ' AND worklogAuthor=currentuser()&fields=worklog&maxResults';
            httpGet('GET', theUrl).then(function(data) {
                var issuesWithLogs = JSON.parse(data.target.response);
                get_worklogs_from_issues(issuesWithLogs['issues']).then(function(data) {
                    resolve(data);
                });
            }, function (e) {
                alert(e);
            });
        });
    }

    function get_worklogs_from_issues(issues) {
        return new Promise(async resolve => {
            var comments = [];
            issues.forEach(function(issue) {
                get_worklogs_comments_from_issue(issue['key']).then(function(comment) {
                    comments.push(comment);
                });
            });
            setTimeout(() => {
                resolve(comments);
            }, 2000);
        });
    }

    function get_worklogs_comments_from_issue(issueKey) {
        var theUrl = serverUrl + '/rest/api/2/issue/' + issueKey + '/worklog';
        var issueLink = serverUrl + '/browse/' + issueKey;
        return new Promise(resolve => {
            httpGet('GET', theUrl).then(function (data) {
                var r = JSON.parse(data.target.response);
                get_comments(r).then(function(comment) {
                    var commentObj = {
                        texts: comment,
                        issueLink: issueLink
                    }
                    resolve(commentObj);
                });
            }, function (e) {
                alert('Error: ' + e);
            });
        });
    }

    function get_comments(worklogs) {
        var issuesWorklogList = worklogs['worklogs'];
        return new Promise(resolve => {
            var array = [];
            issuesWorklogList.forEach(function (log) {
                if (log['created'].slice(0, 10) == get_yesterday() &&
                    userInfo['name'] == log['author']['name']) {
                    array.push(log['comment']);
                    resolve(array);
                }
            });
        });
    }

    function showStandUp(arrayText) {
        var texts = arrayText;
        var yesterday = '';
        for (let i = 0; i < texts.length; i++) {
            var comment = '';
            for (let j = 0; j < texts[i]['texts'].length; j++) {
                comment += texts[i]['texts'][j] + ' ';
            }
            yesterday += '- ' + comment.trim() + ' ' + texts[i]['issueLink'] + '\n';
        }
        $('#standup-text').text(
            'Доброе утро! @comedian\n\n*Вчера*\n' + yesterday +
            '\n*Сегодня*\n -' +
            '\n\n*Проблемы*\n - Нет проблем!'
        );
    }

    async function generateStandUp() {
        await get_yesterday_issues_with_worklogs().then(function(data) {
            showStandUp(data);
        });
    }
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

    function setSavedJiraUrl() {
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
        setSavedJiraUrl();
    }
    init();
});
