import Vue from 'vue';
import Vuex from 'vuex';
import VuexPersistence from 'vuex-persist';
import { sqlSelect } from './modules/sqlSelect';
import { clusterTable } from './modules/clusterTable';

const vuexLocal = new VuexPersistence({
  storage: window.sessionStorage,
});

Vue.use(Vuex);
const store = new Vuex.Store({
  plugins: [vuexLocal.plugin]
});

store.registerModule('sqlSelect', sqlSelect);
store.registerModule('clusterTable', clusterTable);

export default store;
