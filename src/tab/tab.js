import Vue from 'vue';
import App from './App';
import Buefy from 'buefy';
import 'buefy/dist/buefy.css';
import store from '../store';
import router from './router';
import '../assets/scss/index.scss';

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
