import {
    checkUserAuth,
    generateStandUp
} from './api.js';


$(document).ready(function() {

    var serverUrl = window.localStorage.getItem('active-server-url');

    window.onbeforeunload = function () {
        return false;
    };

    // ---------- Check Validation User ---------- //
    function setUserInfo(data) {
        $('#valid-user').removeClass('block--hide');
        $('#first-step').addClass('block--hide');
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
    
    async function checkValidation(url) {
        var theUrl = url + '/rest/api/2/search?jql=assignee=currentuser()';
        $.ajax({
            url: theUrl,
            success: function (data) {
                hideLoader();
                hideAuthError('.not-link');
                window.localStorage.setItem('active-server-url', url);
                setUserInfo(data);
            },
            error: function (error) {
                hideLoader();
                if (error.status == 403 || error.status == 400) {
                    showAuthError('.not-auth');
                } else {
                    showAuthError('.not-link');
                }
            }
        });
    }

    $('#add-server').on('click', function () {
        $('#add-server-wrap').removeClass('add-server-wrap--disable');
        $('#add-server-wrap input').focus();
    });

    $('#add-server__close').on('click', function () {
        hideAuthError('.not-link');
        hideAuthError('.not-auth');
        $('#add-server-wrap').addClass('add-server-wrap--disable');
    });

    $('#add-server__btn').on('click', function () {
        var serverUrl = $('#server-url').val();
        showLoader();
        checkValidation(serverUrl);
    });

    function showLoader() {
        $('#loading').show();
    }

    function hideLoader() {
        $('#loading').hide();
    }
    
    // ---------- END: Check Validation User ---------- //

    // -------------- Generate StandUp ---------------- //
    $('#getStandup').on('click', function () {
        getStandUp();
    });

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

    async function getStandUp() {
        var standup = await generateStandUp();
        showStandUp(standup);
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
        $(this).text('Saved!');
        var insertedUrl = $('#server-url').val();
        rememberJiraUrl(insertedUrl);
    });

    function rememberJiraUrl(url) {
        var jiraServers = JSON.parse(window.localStorage.getItem('jira-servers'));
        var server = {};

        if (Object.keys(jiraServers).length == 0) {
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
    
    function removeSavedServer(url) {
        var jiraServers = JSON.parse(window.localStorage.getItem('jira-servers'));
        var values = Object.values(jiraServers);
        delete jiraServers[values.indexOf(url)];
        window.localStorage.setItem('jira-servers', JSON.stringify(jiraServers));
        showSavedJiraUrl();
    }

    function getSavedJiraUrl() {
        var jiraServers = JSON.parse(window.localStorage.getItem('jira-servers'));
        return Object.values(jiraServers);
    }

    function showSavedJiraUrl() {
        var servers = getSavedJiraUrl();
        $('#saved-servers').empty();
        for (let i = 0; i < servers.length; i++) {
            $('#saved-servers').append(
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
    }

    $('#saved-servers').on('click', function (e) {
        if (e.target.className == 'saved-servers__btn') {
            checkValidation(e.target.value);
        } else if (e.target.className == 'remove-servers-btn') {
            removeSavedServer(e.target.value);
        }
    });

    // -------------- INIT ---------------- //
    function init() {
        showSavedJiraUrl();
    }
    init();
});
