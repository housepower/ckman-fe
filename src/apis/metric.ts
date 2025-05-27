import axios from 'axios';

const url = '/api/v1/metric';

export const MetricApi = {
  querymetric(params) {
    return axios.get(`${url}/query`, { params });
  },
  queryRangeMetric(id, params) {
    return axios.get(`${url}/query_range/${id}`, { params });
  },
  queryMetric(id, params) {
    return axios.get(`${url}/query_metric/${id}`, { params });
  },
};
