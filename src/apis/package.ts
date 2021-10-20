import axios from 'axios';

const url = '/api/v1';

export const PackageApi = {
  getList() {
    return axios.get(`${url}/package`);
  },
  upload(params, opt) {
    return axios.post(`${url}/package`, params, opt);
  },
  deletePackage(params) {
    return axios.delete(`${url}/package`, { params });
  },
  getVersion() {
    return axios.get(`${url}/version`);
  },
};
