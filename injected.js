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

    function generateStandUp() {
        alert('Coming soon...');
    }
});
