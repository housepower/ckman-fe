import Vue from 'vue';
import Vuex from 'vuex';
import { sqlSelect } from './modules/sqlSelect';
import { clusterTable } from './modules/clusterTable';

Vue.use(Vuex);
const store = new Vuex.Store({ /* 选项 */ });

store.registerModule('sqlSelect', sqlSelect);
store.registerModule('clusterTable', clusterTable);

export default store;
