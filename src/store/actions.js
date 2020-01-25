import * as types from './mutation-types';
import httpClient from '../axios';

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
