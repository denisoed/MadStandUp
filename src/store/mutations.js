import * as types from './mutation-types';

export default {
  [types.GET_PROJECTS](state, payload) {
    state.projects = payload;
  },
  [types.SET_ACTIVE_PROJECTS](state, payload) {
    state.project = payload;
  },
};
