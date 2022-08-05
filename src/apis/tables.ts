import axios from 'axios';

const url = '/api/v1';

export const TablesApi = {
  zkStatus(name: string) {
    return axios.get(`${url}/zk/status/${name}`);
  },
  tableMetrics(name: string) {
    return axios.get(`${url}/ck/table_metric/${name}`);
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
};
