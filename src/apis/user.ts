import axios from 'axios';

const url = '/api/v1';

export const UserApi = {
  me() {
    return axios.get(`${url}/user/me`);
  },
  changeMyPassword(params: { old_password: string; new_password: string }) {
    return axios.put(`${url}/user/password`, params);
  },
  list() {
    return axios.get(`${url}/users`);
  },
  create(params: { username: string; password: string; policy: string; enabled: boolean }) {
    return axios.post(`${url}/users`, params);
  },
  update(username: string, params: { policy?: string; enabled?: boolean }) {
    return axios.put(`${url}/users/${encodeURIComponent(username)}`, params);
  },
  delete(username: string) {
    return axios.delete(`${url}/users/${encodeURIComponent(username)}`);
  },
  resetPassword(username: string, params: { new_password: string }) {
    return axios.put(`${url}/users/${encodeURIComponent(username)}/password`, params);
  },
};
