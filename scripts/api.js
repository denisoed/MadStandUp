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

export function checkUserAuth(url) {
    var theUrl = url + '/rest/api/2/search?jql=assignee=currentuser()';
    return new Promise(function (resolve, reject) {
        httpGet('GET', theUrl).then(function (response) {
            resolve(response);
        });
    });
}

export function getWorklogs(url) {
    return new Promise(resolve => {
        var theUrl = url + '/rest/api/2/search?jql=worklogDate=' + '"' + get_yesterday() + '"' + ' AND worklogAuthor=currentuser()&fields=worklog&maxResults';
        
        checkUserAuth(url).then(function (data) {
            var response = JSON.parse(data.target.response);
            userInfo = response['issues'][0]['fields']['assignee'];
        });

        httpGet('GET', theUrl).then(async function (data) {
            var issuesWithLogs = JSON.parse(data.target.response);
            var r = get_worklogs_from_issues(issuesWithLogs['issues'], url).then(function (data) {
                return data;
            });
            resolve(r);
        }, function (e) {
            alert(e);
        });
    });
}

function get_worklogs_from_issues(issues, url) {
    return new Promise(resolve => {
        var comments = [];
        issues.forEach(async function(issue) {
            get_worklogs_comments_from_issue(issue['key'], url).then(function (comment) {
                comments.push(comment);
            });
        });
        setTimeout(() => {
            resolve(comments);
        }, 5000);
    });
}

function get_worklogs_comments_from_issue(issueKey, url) {
    var theUrl = url + '/rest/api/2/issue/' + issueKey + '/worklog';
    var issueLink = url + '/browse/' + issueKey;
    return new Promise(resolve => {
        httpGet('GET', theUrl).then(function (data) {
            var r = JSON.parse(data.target.response);
            get_comments(r).then(function (comment) {
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