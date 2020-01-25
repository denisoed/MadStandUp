import * as types from './mutation-types';
import httpClient from '../axios';
import LocalStorageService from './localStorageService';

// const localStorageService = LocalStorageService.getService();

export const getProjects = ({ commit }) => {
  return new Promise((resolve, reject) => {
    httpClient.get('/rest/api/2/project').then(resp => {
      commit(types.PROJECTS_SUCCESS, resp.data);
      resolve(resp);
    }).catch(err => {
      reject(err);
    });
  });
};