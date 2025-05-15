import axios from 'axios';

const url = '/api/v1';

export const TablesApi = {
  zkStatus(name: string) {
    return axios.get(`${url}/zk/status/${name}`);
  },
  tableMetrics(name: string) {
    return axios.get(`${url}/ck/table_metric/${name}`);
  },
  vmMetrics(name: string) {
    return axios.get(`${url}/ck/vm/${name}`);
  },
  tableMerges(name: string) {
    return axios.get(`${url}/ck/table_merges/${name}`);
  },
  deleteTable(name: string, params: { tableName: string; database: string }) {
    return axios.delete(`${url}/ck/table/${name}`, {
      params,
    });
  },
  viewTableCreateSql(name: string, params: { tableName: string; database: string }) {
    return axios.get(`${url}/ck/table_schema/${name}`, {
      params,
    });
  },
  replicationStatus(name: string) {
    return axios.get(`${url}/zk/replicated_table/${name}`);
  },
  replicatedQueue(name, tableName, node) {
    return axios.get(`${url}/zk/replicated_queue/${name}?table=${tableName}&node=${node}`);
  },
  getPartitions(clusterName, table) {
    return axios.get(`${url}/ck/partition/${clusterName}?table=${table}`);
  },
  deletePartition(clusterName, { database, tables, begin, end }) {
    return axios.post(`${url}/ck/purge_tables/${clusterName}`, {
      database,
      tables,
      begin,
      end,
    });
  },
  archiveTables(clusterName, params) {
    return axios.post(`${url}/ck/archive/${clusterName}`, params);
  },
  resumeTable(clusterName, table) {
    return axios.put(`${url}/ck/table/readonly/${clusterName}?table=${table}`);
  },
  backgroundpool(clusterName) {
    return axios.get(`${url}/ck/backgroundpool/${clusterName}`);
  },
};
