import { cloneDeep } from 'lodash-es';
export const sqlSelect = {
  namespaced: true,
  state: () => ({
    result: [],
    pagination: {
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
    deleteHistory(state, index) {
      state.history.splice(index, 1);
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
      const { result, pagination: { total, currentPage, pageSize } } = state;
      if (result.length <= 1) return [];
      const rows = [];
      const columns = result[0];
      const len = currentPage * pageSize;
      let i = (currentPage - 1) * pageSize + 1;
      while(i <= len) {
        if (result[i]) {
          const item = {};
          columns.forEach((column, index) => {
            item[column] = result[i][index];
          })
          rows.push(item);
        }
        i++;
      }
      return rows;
    }
  }
}