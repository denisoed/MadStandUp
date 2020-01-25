import * as types from './mutation-types';
import httpClient from '../axios';

export const getProjects = ({ commit }) => {
  return new Promise((resolve, reject) => {
    httpClient.get('/rest/api/2/project').then(resp => {
      commit(types.GET_PROJECTS, resp.data);
      resolve(resp);
    }).catch(err => {
      reject(err);
    });
  });
};

export const setActiveProject = ({ commit }, project) => {
  commit(types.SET_ACTIVE_PROJECTS, project);
  localStorage.setItem('active-server-url', project);
};
