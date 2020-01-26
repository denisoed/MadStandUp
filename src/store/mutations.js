import * as types from './mutation-types';

export default {
  [types.GET_PROJECTS](state, payload) {
    state.projects = payload;
  },
  [types.SET_ACTIVE_PROJECTS](state, payload) {
    state.project = payload;
  },
  [types.SET_AUTH_USER](state, payload) {
    state.authUser = payload;
  },
  [types.SET_YESTERDAY_WORKLOGS](state, payload) {
    state.yesterdayWorklogs = payload;
  },
};
