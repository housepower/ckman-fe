import axios from 'axios';

const url = '/api/v1/ck';

export const SqlQueryApi =  {
  query(params) {
    return axios.get(`${url}/query/${params.clusterName}`, { params });
  },
  getTableLists(clusterName) {
    return axios.get(`${url}/table_lists/${clusterName}`);
  },
  queryExplain(params) {
    return axios.get(`${url}/query_explain/${params.clusterName}`, { params });
  },
  getHistory(clusterName) {
    return axios.get(`${url}/query_history/${clusterName}`);
  },
  deleteHistory({clusterName, checksum}) {
    return axios.delete(`${url}/query_history/${clusterName}?checksum=${checksum}`);
  },
};
