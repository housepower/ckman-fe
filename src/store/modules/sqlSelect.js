import { cloneDeep } from 'lodash-es';
import { SqlQueryApi } from '@/apis';
export const sqlSelect = {
  namespaced: true,
  state: () => ({
    result: [],
    pagination: {
      pageSizes: [10, 15, 20, 50, 100, 200, 500, 1000],
      pageSize: 100,
      total: 0,
      currentPage: 1,
    },
    history: [],
    sql: '',
    status: '',
  }),
  mutations: {
    setResult(state, data) {
      state.result = cloneDeep(data);
      state.pagination.total = data.length - 1;
      data = null;
    },
    changePageSize(state, pageSize) {
      state.pagination.pageSize = pageSize;
    },
    changeCurrentPage(state, currentPage) {
      state.pagination.currentPage = currentPage;
    },
    setSql(state, sql) {
      state.sql = sql;
    },
    addHistory(state, item) {
      const { history } = state;
      if (history.length > 100) {
        history.pop();
      }
      history.unshift(item);
    },
    deleteHistory(state, { clusterName, checksum }) {
      const index = state.history.findIndex(x => x.Cluster === clusterName && x.CheckSum === checksum);
      if (index !== -1) {
        state.history.splice(index, 1);
      }
    },
    setHistory(state, list) {
      state.history = cloneDeep(list);
    },
    setStatus(state, status) {
      state.status = status;
    },
    clear(state) {
      state.result = [];
      state.pagination = {
        pageSize: 100,
        total: 0,
        currentPage: 1,
      };
    }
  },
  actions: {
    async retrieveHistory({ commit }, clusterName) {
      const { data: { entity } } = await SqlQueryApi.getHistory(clusterName);
      commit('setHistory', entity);
    },
    async deleteHistory({ commit }, params) {
      const result = await SqlQueryApi.deleteHistory(params);
      commit('deleteHistory', params);
    }
  },
  getters: {
    getResultColumn: state => {
      const { result } = state;
      if (result.length === 0) return [];
      return result[0].map(x => {
        return {
          label: x,
          prop: x,
        };
      });
    },
    getResultData: state => {
      const { result } = state;
      if (result.length <= 1) return [];
      const rows = [];
      const columns = result[0];
      result.forEach((x, index) => {
        if (index > 0) {
          const item = {};
          columns.forEach((column, index) => {
            item[column] = x[index];
          });
          rows.push(item);
        }
      })
      return rows;
    }
  }
}