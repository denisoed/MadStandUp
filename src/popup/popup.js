import Vue from 'vue';
import Buefy from 'buefy';
import 'buefy/dist/buefy.css';
import App from './App';
import store from '../store';
import router from './router';

global.browser = require('webextension-polyfill');

Vue.prototype.$browser = global.browser;

Vue.use(Buefy);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  render: (h) => h(App),
});
