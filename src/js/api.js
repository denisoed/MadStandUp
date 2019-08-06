import handlers from './modules/handlers';
import msg from './modules/msg';
import $ from 'jquery';

// here we use SHARED message handlers, so all the contexts support the same
// commands. but this is NOT typical messaging system usage, since you usually
// want each context to handle different commands. for this you don't need
// handlers factory as used below. simply create individual `handlers` object
// for each context and pass it to msg.init() call. in case you don't need the
// context to support any commands, but want the context to cooperate with the
// rest of the extension via messaging system (you want to know when new
// instance of given context is created / destroyed, or you want to be able to
// issue command requests from this context), you may simply omit the
// `handlers` parameter for good when invoking msg.init()

var userInfo = {};
var serverData = window.localStorage.getItem('active-server-url');

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
    var server = JSON.parse(window.localStorage.getItem('active-server-url'));
    var theUrl = server.url + '/rest/api/2/search?jql=project=' + server.key + ' AND assignee=currentuser()';
    return new Promise(function (resolve, reject) {
        httpGet('GET', theUrl).then(function (data) {
            var response = JSON.parse(data.target.response);
            userInfo = response['issues'][0]['fields']['assignee'];
            resolve(response);
        }).catch(function (e) {
            reject(e);
        });
    });
}

export async function generateStandUp(date) {
    await checkUserAuth(serverData.url);
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
    var server = JSON.parse(window.localStorage.getItem('active-server-url'));
    var theUrl = server.url + '/rest/api/2/search?jql=project=' + server.key + ' AND worklogDate=' + '"' + get_date(date) + '"' + ' AND worklogAuthor=currentuser()&fields=worklog&maxResults';
    return new Promise(resolve => {
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
    var server = JSON.parse(window.localStorage.getItem('active-server-url'));
    return new Promise(resolve => {
        var theUrl = server.url + '/rest/api/2/search?jql=project=' + server.key + ' AND worklogDate=' + '"' + get_date(date) + '"' + ' AND worklogAuthor=currentuser()&fields=worklog&maxResults=1000';
        httpGet('GET', theUrl).then(async function (data) {
            var issuesWithLogs = JSON.parse(data.target.response);
            if (issuesWithLogs.total == 0) {
                resolve(secondsToHms(0));
            }
            var todayLogs = 0;
            var keys = await get_issues_keys(issuesWithLogs['issues']);
            for (const key of keys) {
                var theUrl = server.url + '/rest/api/2/issue/' + key + '/worklog?maxResults=1000';
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

export function get_issues_by_key(key) {
    return new Promise((resolve, reject) => {
        var server = JSON.parse(window.localStorage.getItem('active-server-url'));
        var theUrl = server.url + '/rest/api/2/search?jql=project=' + server.key + ' AND issue=' + key;
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
};

export function get_issue_status(key) {
    return new Promise((resolve, reject) => {
        var server = JSON.parse(window.localStorage.getItem('active-server-url'));
        var theUrl = server.url + '/rest/api/2/issue/' + key + '?fields=status';
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
};

export function get_issue_statuses(key) {
    return new Promise((resolve, reject) => {
        var server = JSON.parse(window.localStorage.getItem('active-server-url'));
        var theUrl = server.url + '/rest/api/2/issue/' + key + '/transitions';
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
};

function get_worklogs_comments_from_issues(key) {
    return new Promise(resolve => {
        var server = JSON.parse(window.localStorage.getItem('active-server-url'));
        var theUrl = server.url + '/rest/api/2/issue/' + key + '/worklog';
        var issueLink = server.url + '/browse/' + key;
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

export function get_projects(url) {
    return new Promise(resolve => {
        var theUrl = url + '/rest/api/2/project';
        httpGet('GET', theUrl).then(function (data) {
            resolve(JSON.parse(data.target.response));
        }, function (e) {
            console.log(e);
        });
    });
}

export function add_worklog(response) {
    var server = JSON.parse(window.localStorage.getItem('active-server-url'));
    var theUrl = server.url + '/rest/api/2/issue/' + response.issue + '/worklog';
    var data = {
        "timeSpent": response.time,
        "comment": response.comment
    };
    return new Promise(function (resolve, reject) {
        $.ajax({
            type: 'POST',
            url: theUrl,
            type: 'POST',
            data: JSON.stringify(data),
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            contentType: "application/json; charset=utf-8",
            success: function () {
                resolve(true);
            },
            error: function (e) {
                reject(e);
            }
        });
    });
};

export function update_issue_status(response) {
    var server = JSON.parse(window.localStorage.getItem('active-server-url'));
    var theUrl = server.url + '/rest/api/2/issue/' + response.issueKey + '/transitions?expand=transitions.fields';
    var data = {
        transition: {
            id: 101
        }
    };
    return new Promise(function (resolve, reject) {
        $.ajax({
            type: 'POST',
            url: theUrl,
            type: 'POST',
            data: JSON.stringify(data),
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            contentType: "application/json; charset=utf-8",
            success: function () {
                resolve(true);
            },
            error: function (e) {
                reject(e);
            }
        });
    });
};

msg.init('api', handlers.create('api'));