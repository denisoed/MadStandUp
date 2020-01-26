import * as types from './mutation-types';
import httpClient from '../axios';

function get_date(date = '') {
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

function get_issues_with_worklogs() {
  var server = JSON.parse(window.localStorage.getItem('active-server-url'));
  var theUrl = server.url + '/rest/api/2/search?jql=project=' + server.key + ' AND worklogAuthor=currentuser()&fields=worklog&maxResults';
  return new Promise((resolve, reject) => {
    httpClient.get(theUrl).then(resp => {
      var issuesWithLogs = resp.data.issues;
      resolve(issuesWithLogs);
    }, function (e) {
      reject(e);
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

function get_worklogs_from_issues(key) {
  return new Promise(resolve => {
    const server = JSON.parse(window.localStorage.getItem('active-server-url'));
    const theUrl = server.url + '/rest/api/2/issue/' + key + '/worklog';
    const issueLink = server.url + '/browse/' + key;
    httpClient.get(theUrl).then(resp => {
      const worklogsObj = {
        list: resp.data['worklogs'],
        link: issueLink
      }
      resolve(worklogsObj);
    });
  });
};

function get_currentUser_worklogs(listLogs) {
  return new Promise(resolve => {
    const userInfo = JSON.parse(window.localStorage.getItem('auth-user'));
    let array = [];
    listLogs.forEach(logs => {
      let obj = {
        list: [],
        link: logs.link,
      }
      logs.list.forEach(function (log) {
        if (userInfo['name'] == log['author']['name']) {
          obj.list.push(log);
        }
      });
      array.push(obj);
      resolve(array);
    });
  });
};

export const setAuthUser = ({ commit }) => {
  var server = JSON.parse(window.localStorage.getItem('active-server-url'));
  var theUrl = server.url + '/rest/api/2/search?jql=project=' + server.key + ' AND assignee=currentuser()';
  return new Promise(function (resolve, reject) {
    httpClient(theUrl).then(resp => {
      commit(types.SET_AUTH_USER, resp.data['issues'][0]['fields']['assignee']);
      localStorage.setItem('auth-user', JSON.stringify(resp.data['issues'][0]['fields']['assignee']));
      resolve(resp);
    }).catch(function (e) {
      reject(e);
    });
  });
};

export const getProjects = ({ commit }, url) => {
  return new Promise((resolve, reject) => {
    httpClient.get(`${url}/rest/api/2/project`).then(resp => {
      commit(types.GET_PROJECTS, resp.data);
      resolve(resp);
    }).catch(err => {
      reject(err);
    });
  });
};

export const setActiveProject = ({ commit }, data) => {
  commit(types.SET_ACTIVE_PROJECTS, data.project);
  localStorage.setItem('active-server-url', JSON.stringify({
    url: data.baseUrl,
    name: data.project.name,
    key: data.project.key
  }));
};

export const getWorklogs = async ({ commit }) => {
  const issues = await get_issues_with_worklogs();
  if (issues !== undefined && issues.length !== 0) {
    var keys = await get_issues_keys(issues);
    var worklogs = [];
    for (const key of keys) {
      worklogs.push(await get_worklogs_from_issues(key));
    }
    const userWorklogs = await get_currentUser_worklogs(worklogs);
    commit(types.SET_YESTERDAY_WORKLOGS, userWorklogs);
  }
};
