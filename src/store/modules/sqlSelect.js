import { cloneDeep } from 'lodash-es';
import { SqlQueryApi } from '@/apis';

let nextTabId = 1;

const defaultPagination = () => ({
  pageSizes: [10, 15, 20, 50, 100, 200, 500, 1000],
  pageSize: 100,
  total: 0,
  currentPage: 1,
});

export const sqlSelect = {
  namespaced: true,
  state: () => ({
    tabs: [],
    activeTabId: null,
    history: [],
    sql: '',
  }),
  mutations: {
    addTab(state, { sql }) {
      const tab = {
        id: nextTabId++,
        sql,
        result: [],
        queryDuration: 0,
        status: 'loading',
        error: '',
        pagination: defaultPagination(),
      };
      state.tabs.push(tab);
      if (state.activeTabId == null) state.activeTabId = tab.id;
    },
    setActiveTab(state, id) {
      state.activeTabId = id;
    },
    closeTab(state, id) {
      const idx = state.tabs.findIndex((t) => t.id === id);
      if (idx === -1) return;
      state.tabs.splice(idx, 1);
      if (state.activeTabId === id) {
        const next = state.tabs[idx] || state.tabs[idx - 1] || null;
        state.activeTabId = next ? next.id : null;
      }
    },
    setTabResult(state, { id, data, duration }) {
      const tab = state.tabs.find((t) => t.id === id);
      if (!tab) return;
      tab.result = cloneDeep(data || []);
      tab.queryDuration = duration;
      tab.pagination.total = Math.max(0, tab.result.length - 1);
      tab.pagination.currentPage = 1;
      tab.status = '';
      tab.error = '';
    },
    setTabError(state, { id, error, duration }) {
      const tab = state.tabs.find((t) => t.id === id);
      if (!tab) return;
      tab.status = 'error';
      tab.error = error || '';
      tab.queryDuration = duration ?? tab.queryDuration;
    },
    setTabPage(state, { id, currentPage }) {
      const tab = state.tabs.find((t) => t.id === id);
      if (tab) tab.pagination.currentPage = currentPage;
    },
    setTabPageSize(state, { id, pageSize }) {
      const tab = state.tabs.find((t) => t.id === id);
      if (tab) tab.pagination.pageSize = pageSize;
    },
    setSql(state, sql) {
      state.sql = sql;
    },
    addHistory(state, item) {
      const { history } = state;
      if (history.length > 100) history.pop();
      history.unshift(item);
    },
    deleteHistory(state, { clusterName, checksum }) {
      const index = state.history.findIndex(
        (x) => x.Cluster === clusterName && x.CheckSum === checksum,
      );
      if (index !== -1) state.history.splice(index, 1);
    },
    setHistory(state, list) {
      state.history = cloneDeep(list);
    },
    clear(state) {
      state.tabs = [];
      state.activeTabId = null;
    },
  },
  actions: {
    async retrieveHistory({ commit }, clusterName) {
      const { data: { entity } } = await SqlQueryApi.getHistory(clusterName);
      commit('setHistory', entity);
    },
    async deleteHistory({ commit }, params) {
      await SqlQueryApi.deleteHistory(params);
      commit('deleteHistory', params);
    },
  },
  getters: {
    activeTab(state) {
      return state.tabs.find((t) => t.id === state.activeTabId) || null;
    },
    activeColumns(state, getters) {
      const tab = getters.activeTab;
      if (!tab || tab.result.length === 0) return [];
      return tab.result[0].map((x) => ({ label: x, prop: x }));
    },
    activeRows(state, getters) {
      const tab = getters.activeTab;
      if (!tab || tab.result.length <= 1) return [];
      const columns = tab.result[0];
      return tab.result.slice(1).map((row) => {
        const item = {};
        columns.forEach((column, index) => {
          item[column] = row[index];
        });
        return item;
      });
    },
  },
};
