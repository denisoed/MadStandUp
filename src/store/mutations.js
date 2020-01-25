import * as types from './mutation-types';

export default {
  [types.PROJECTS_SUCCESS](state, payload) {
    state.projects = payload;
  },
};
