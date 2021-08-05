import axios from 'axios';

const url = '/api/v1/ck';
const createUrl = '/api/v1/deploy/ck';

export const ClusterApi = {
  getCluster() {
    return axios.get(`${url}/cluster`);
  },
  getClusterCreateFormSchema() {
    return axios.get(`/api/v1/ui/schema?type=create`);
  },
  importCluster(params) {
    return axios.post(`${url}/cluster`, params);
  },
  createCluster(params) {
    return axios.post(`${createUrl}/`, params);
  },
  updateCluster(params) {
    return axios.put(`${url}/cluster`, params);
  },
  deleteCluster(id) {
    return axios.delete(`${url}/cluster/${id}`);
  },
  manageCluster(type, params, password?) {
    const { clusterName, packageVersion, skip, policy } = params;
    if(!packageVersion) {
      return axios.put(`${url}/${type}/${clusterName}?password=${ password || '' }`);
    } else {
      return axios.put(`${url}/${type}/${clusterName}?password=${ password || '' }`,{ packageVersion, skip, policy });
    }
  },
  getClusterInfo(id) {
    return axios.get(`${url}/get/${id}`);
  },
  addClusterNode(id, params, password?) {
    return axios.post(`${url}/node/${id}?password=${password || ''}`, params);
  },
  deleteClusterNode(id, params, password?) {
    return axios.delete(`${url}/node/${id}?password=${ password || '' }`, { params });
  },
  onlineClusterNode(clusterName, ip, password?) {
    return axios.put(`${url}/node/start/${clusterName}?ip=${ ip }&password=${ password || ''}`);
  },
  offlineClusterNode(clusterName, ip, password?) {
    return axios.put(`${url}/node/stop/${clusterName}?ip=${ ip }&password=${ password || ''}`);
  },
};
