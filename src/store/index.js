import Vue from 'vue';
import Vuex from 'vuex';
import { sqlSelect } from './modules/sqlSelect';

Vue.use(Vuex);
const store = new Vuex.Store({ /* 选项 */ });

store.registerModule('sqlSelect', sqlSelect);

export default store;
