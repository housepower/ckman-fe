import { cloneDeep } from 'lodash-es';
export const clusterTable = {
  namespaced: true,
  state: () => ({
    list: [],
  }),
  mutations: {
    setTableData(state, { clusterName, tableData }) {
      const cluster = state.list.find(x => x.clusterName === clusterName);
      if (cluster) {
        cluster.tableData = cloneDeep(tableData);
      } else {
        state.list.push({
          clusterName,
          tableData: cloneDeep(tableData),
          replicationStatus: null,
        });
      }
    },
    setReplicationStatus(state, { clusterName, tableData, header }) {
      const cluster = state.list.find(x => x.clusterName === clusterName);
      if (cluster) {
        cluster.replicationStatus = {
          tableData: cloneDeep(tableData),
          header: cloneDeep(header)
        };
      } else {
        state.list.push({
          clusterName,
          tableData: null,
          replicationStatus: {
            tableData: cloneDeep(tableData),
            header: cloneDeep(header)
          },
        });
      }
    },
  },
  actions: {
    //
  },
  getters: {
    getTableDataByClusterName(state) {
      return clusterName => state.list.find(x => x.clusterName === clusterName)?.tableData;
    },
    getReplicationStatusByClusterName(state) {
      return clusterName => {
        return state.list.find(x => x.clusterName === clusterName)?.replicationStatus
      };
    },
  },
};
