$(document).ready(function() {

    var servers = ['https://kickico4.atlassian.net', 'https://nappyclub.atlassian.net', 'https://pm.maddevs.co'];

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
        $('#valid-server').addClass('block--hide');
        $('#userAvatar').attr("src", data['issues'][0]['fields']['assignee']['avatarUrls']['48x48']);
        $('#userName').text(data['issues'][0]['fields']['assignee']['displayName']);
        $('#userMail').text(data['issues'][0]['fields']['assignee']['emailAddress']);
        return userName;
    }

    function showAuthError() {
        $('#popup-container').text('Please, Login to jira!')
    }
    
    function checkValidation(server) {
        var theUrl = server + '/rest/api/2/search?jql=assignee=currentuser()';
        httpGet('GET', theUrl).then(function (data) {
            var r = JSON.parse(data.target.response);
            return setUserInfo(r);
        }, function (e) {
            showAuthError();
        });
    }

    $('#checkConnectJira').on('click', function () {
        var serverUrl = $('#server-url').val();
        checkValidation(serverUrl);
    });
    

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
            // var theUrl = 'https://kickico4.atlassian.net/rest/api/2/search?jql=worklogDate=' + '"' + get_yesterday() + '"' + ' AND worklogAuthor=currentuser()&fields=worklog&maxResults';
            var theUrl = 'https://nappyclub.atlassian.net/rest/api/2/search?jql=worklogDate=' + '"' + get_yesterday() + '"' + ' AND worklogAuthor=currentuser()&fields=worklog&maxResults';
            // var theUrl = 'https://pm.maddevs.co/rest/api/2/search?jql=worklogDate=2019-01-09%20AND%20worklogAuthor=currentuser()&fields=worklog';
            httpGet('GET', theUrl).then(function(data) {
                var issuesWithLogs = JSON.parse(data.target.response);
                console.log(issuesWithLogs);
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
                    comment.forEach(function(text) {
                        comments.push(text);
                    });
                });
            });
            setTimeout(() => {
                console.log(comments);
                resolve(comments);
            }, 2000);
        });
    }

    function get_worklogs_comments_from_issue(issueKey) {
        var theUrl = 'https://nappyclub.atlassian.net/rest/api/2/issue/' + issueKey + '/worklog';
        // var theUrl = 'https://kickico4.atlassian.net/rest/api/2/issue/' + issueKey + '/worklog';
        return new Promise(resolve => {
            httpGet('GET', theUrl).then(function (data) {
                var r = JSON.parse(data.target.response);
                get_comments(r).then(function(comment) {
                    resolve(comment);
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
                if (log['created'].slice(0, 10) == get_yesterday()) {
                    array.push(log['comment']);
                    resolve(array);
                }
            });
        });
    }

    function showStandUp(arrayText) {
        var standup = '';
        for (let i = 0; i < arrayText.length; i++) {
            standup += '- ' + arrayText[i] + '\n'
        }
        $('#standup-text').text(
            'Доброе утро! @comedian\n\n*Вчера*\n' + standup +
            '\n\n*Сегодня*\n -' +
            '\n\n*Проблемы*\n -'
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
        copyAll();
    });

    function copyAll() {
        var copyText = document.getElementById('standup-text');
        copyText.select();
        document.execCommand('copy');
        alert('Text Copied');
    }
});
