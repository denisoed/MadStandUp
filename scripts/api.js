var userInfo = {};
var serverUrl = window.localStorage.getItem('active-server-url');

function httpGet(method, url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = resolve;
        xhr.onerror = reject;
        xhr.send();
    });
}

function secondsToHms(sec) {
    sec = Number(sec);
    var h = Math.floor(sec / 3600);
    var m = Math.floor(sec % 3600 / 60);
    var s = Math.floor(sec % 3600 % 60);

    var hDisplay = h > 0 ? h + 'h ' : '';
    var mDisplay = m > 0 ? m + 'm ' : '';
    var sDisplay = s > 0 ? s + 's' : '';
    if (hDisplay == '' && mDisplay == '' && sDisplay == '') {
        return '0h';
    }
    return hDisplay + mDisplay + sDisplay;
}

export function get_date(date = '') {
    var today = new Date();
    if (date != '') {
        return date;
    } else {
        if (today.getDay() == 1) {
            return today.getUTCFullYear() + '-' + ('0' + (today.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + (today.getDate() - 3)).slice(-2);
        } else if (today.getDay() == 0) {
            return today.getUTCFullYear() + '-' + ('0' + (today.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + (today.getDate() - 2)).slice(-2);
        } else if (today.getDate() == 1) {
            var prevMonth = today.setDate(today.getDate() - 1);
            var yesterday = new Date(prevMonth);
            return yesterday.getUTCFullYear() + '-' + ('0' + (yesterday.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + (yesterday.getDate())).slice(-2);
        } else {
            return today.getUTCFullYear() + '-' + ('0' + (today.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + (today.getDate() - 1)).slice(-2);
        }
    }
}

export function checkUserAuth(url) {
    var theUrl = url + '/rest/api/2/search?jql=assignee=currentuser()';
    return new Promise(function (resolve, reject) {
        httpGet('GET', theUrl).then(function (data) {
            var response = JSON.parse(data.target.response);
            userInfo = response['issues'][0]['fields']['assignee'];
            resolve(response);
        }).catch(function(e) {
            reject(e);
        });
    });
}

export async function generateStandUp(date) {
    await checkUserAuth(serverUrl);
    var issues = await get_issues_with_worklogs(date);
    if (issues !== undefined && issues.length !== 0) {
        var keys = await get_issues_keys(issues);
        var worklogs = [];
        for (const key of keys) {
            worklogs.push(await get_worklogs_comments_from_issues(key));
        }
        var comments = await get_currentUser_comments(worklogs, date);
        return comments;
    }
    return [];
}

function get_issues_with_worklogs(date) {
    return new Promise(resolve => {
        var theUrl = serverUrl + '/rest/api/2/search?jql=worklogDate=' + '"' + get_date(date) + '"' + ' AND worklogAuthor=currentuser()&fields=worklog&maxResults';
        httpGet('GET', theUrl).then(function (data) {
            var issuesWithLogs = JSON.parse(data.target.response);
            resolve(issuesWithLogs['issues']);
        }, function (e) {
            console.log(e);
        });
    });
};

export function get_issues_with_today_worklogs() {
    var today = new Date();
    var date = today.getUTCFullYear() + '-' + ('0' + (today.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
    return new Promise(resolve => {
        var theUrl = window.localStorage.getItem('active-server-url') + '/rest/api/2/search?jql=worklogDate=' + '"' + get_date(date) + '"' + ' AND worklogAuthor=currentuser()&fields=worklog&maxResults=1000';
        httpGet('GET', theUrl).then(async function (data) {
            var issuesWithLogs = JSON.parse(data.target.response);
            if (issuesWithLogs.total == 0) {
                resolve(secondsToHms(0));
            }
            var todayLogs = 0;
            var keys = await get_issues_keys(issuesWithLogs['issues']);
            for (const key of keys) {
                var theUrl = window.localStorage.getItem('active-server-url') + '/rest/api/2/issue/' + key + '/worklog?maxResults=1000';
                await httpGet('GET', theUrl).then(function (data) {
                    var issueWithLogs = JSON.parse(data.target.response);
                    issueWithLogs.worklogs.forEach(worklog => {
                        if (worklog.updated.slice(0, 10) == get_date(date)) {
                            todayLogs += Number(worklog.timeSpentSeconds);
                        }
                    });
                }, function (e) {
                    console.log(e);
                });
            }
            resolve(secondsToHms(todayLogs));
        }, function (e) {
            console.log(e);
        });
    });
};

function get_issues_keys(issues) {
    return new Promise(resolve => {
        var keys = [];
        issues.forEach(issue => {
            keys.push(issue['key']);
            resolve(keys);
        });
    });
};

function get_worklogs_comments_from_issues(key) {
    return new Promise(resolve => {
        var theUrl = serverUrl + '/rest/api/2/issue/' + key + '/worklog';
        var issueLink = serverUrl + '/browse/' + key;
        $.ajax({
            url: theUrl,
            success: function (data) {
                var commentObj = {
                    comments: data['worklogs'],
                    link: issueLink
                }
                resolve(commentObj);
            }
        });
    });
};

function get_currentUser_comments(listLogs, date) {
    return new Promise(resolve => {
        var array = [];
        listLogs.forEach(logs => {
            var obj = {
                comments: [],
                link: logs.link
            }
            logs.comments.forEach(function (log) {
                if (log['created'].slice(0, 10) == get_date(date) &&
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
        resolve('DONE!');
    });
};