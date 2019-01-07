$(document).ready(function() {

    var servers = ['https://nappyclub.atlassian.net', 'https://pm.maddevs.co'];

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
        $('#userAvatar').attr("src", data['issues'][0]['fields']['assignee']['avatarUrls']['48x48']);
        $('#userName').text(data['issues'][0]['fields']['assignee']['displayName']);
        $('#userMail').text(data['issues'][0]['fields']['assignee']['emailAddress']);
        return userName;
    }

    function showAuthError() {
        $('#popup-container').text('Please, Login to jira!')
    }
    
    function checkValidation() {
        servers.forEach(function(server) {
            var theUrl = server + '/rest/api/2/search?jql=assignee=currentuser()';
            httpGet('GET', theUrl).then(function (data) {
                var r = JSON.parse(data.target.response);
                return setUserInfo(r);
            }, function (e) {
                var stop = true;
                if (stop) {
                    checkValidation();
                    stop = false;  
                } else {
                    showAuthError();
                }
            });
        });
    }
    
    checkValidation();

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
    
    function get_yesterday_worklog_issues() {
        var theUrl = 'https://nappyclub.atlassian.net/rest/api/2/search?jql=worklogDate=' + '"' + get_yesterday() + '"' + ' AND worklogAuthor=currentuser()&fields=worklog';
        httpGet('GET', theUrl).then(function (data) {
            var allLogs = JSON.parse(data.target.response);
            var logComments = [];
            for (let i = 0; i < allLogs['issues'].length; i++) {
                logComments.push(allLogs['issues'][i]['fields']['worklog']['worklogs'][0]['comment'])
            }
            showStandUp(logComments);
            return logComments;
        }, function (e) {
            alert(e);
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

    function generateStandUp() {
        get_yesterday_worklog_issues();
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
