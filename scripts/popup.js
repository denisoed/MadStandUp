import {
    checkUserAuth,
    getWorklogs
} from './api.js';


$(document).ready(function() {

    var serverUrl = window.localStorage.getItem('active-server-url');

    // ---------- Check Validation User ---------- //
    function setUserInfo(data) {
        $('#valid-user').removeClass('block--hide');
        $('#wrap-no-valid').addClass('block--hide');
        $('#userAvatar').attr("src", data['issues'][0]['fields']['assignee']['avatarUrls']['48x48']);
        $('#userName').text(data['issues'][0]['fields']['assignee']['displayName']);
        $('#userMail').text(data['issues'][0]['fields']['assignee']['emailAddress']);
        return userName;
    }

    function showAuthError(el) {
        $(el).removeClass('block--hide');
    }

    function hideAuthError(el) {
        $(el).addClass('block--hide');
    }
    
    function checkValidation(url) {
        checkUserAuth(url).then(function (data) {
            hideAuthError('.not-link');
            var r = JSON.parse(data.target.response);
            if (data.status == 400) {
                showAuthError('.not-auth');
            } else {
                hideAuthError('.not-auth');
                window.localStorage.setItem('active-server-url', url);
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
    
    // ---------- END: Check Validation User ---------- //

    // -------------- Generate StandUp ---------------- //
    $('#getStandup').on('click', function () {
        generateStandUp();
    });

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

    function generateStandUp() {
        getWorklogs(serverUrl).then(function (data) {
            console.log(data);
            showStandUp(data);
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
