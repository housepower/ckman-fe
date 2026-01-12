import axios from 'axios';

const url = '/api/v1';

export const ConfigApi = {
  getVersion() {
    return axios.get(`${url}/version`);
  },
  getInstances() {
    return axios.get(`${url}/instances`);
  },
};
