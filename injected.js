$(document).ready(function() {

    function httpGet(url) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", url, false);
        xmlHttp.send(null);
        return xmlHttp;
    }

    // ---------- Check Validation User ---------- //
    function setUserInfo(data) {
        $('#userAvatar').attr("src", data['issues'][0]['fields']['assignee']['avatarUrls']['48x48']);
        $('#userName').text(data['issues'][0]['fields']['assignee']['displayName']);
        $('#userMail').text(data['issues'][0]['fields']['assignee']['emailAddress']);
        return userName;
    }

    function showAuthError() {
        $('#user_info').text('Please, Login to jira!')
    }
    
    function checkValidation() {
        var theUrl = 'https://nappyclub.atlassian.net/rest/api/2/search?jql=assignee=currentuser()';
        var response = httpGet(theUrl);
        if (response.status != 200) {
            showAuthError();
            return response.status;
        } else {
            var data = JSON.parse(response.responseText);
            return setUserInfo(data);
        }
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
            return today.getUTCFullYear() + '-' + ('0' + (today.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + (today.getUTCDate() - 3)).slice(-2);
        } else if (today.getDay() == 0) {
            return today.getUTCFullYear() + '-' + ('0' + (today.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + (today.getUTCDate() - 2)).slice(-2);
        } else {
            return today.getUTCFullYear() + '-' + ('0' + (today.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + (today.getUTCDate() - 1)).slice(-2);
        }
    }
    
    function get_yesterday_worklog_issues() {
        var theUrl = 'https://nappyclub.atlassian.net/rest/api/2/search?jql=worklogDate=' + '"' + get_yesterday() + '"' + ' AND worklogAuthor=currentuser()&fields=worklog';
        var response = httpGet(theUrl);
        var allLogs = JSON.parse(response.responseText);
        var logComments = [];
        alert(theUrl);
        for (let i = 0; i < allLogs['issues'].length; i++) {
            logComments.push(allLogs['issues'][i]['fields']['worklog']['worklogs'][0]['comment'])
        }
        return logComments;
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
        var allComments = get_yesterday_worklog_issues();
        showStandUp(allComments);
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
