import Vue from 'vue';
import Vuex from 'vuex';

import * as getters from './getters';
import mutations from './mutations';
import * as actions from './actions';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    projects: [],
    project: {},
    authUser: {},
    yesterdayWorklogs: []
  },
  getters,
  mutations,
  actions,
});
