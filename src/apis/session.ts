import axios from 'axios';

const url = '/api/v1/ck';

export const SessionApi = {
  open(name: string) {
    return axios.get(`${url}/open_sessions/${name}`);
  },
  close(name: string, params: { limit: number; start: number; end: number }) {
    return axios.get(`${url}/slow_sessions/${name}`, {
      params,
    });
  },
  kill(clusterName, params: { host: string; query_id: string }) {
    return axios.put(`${url}/open_sessions/${clusterName}`, {
      params,
    });
  },
};
