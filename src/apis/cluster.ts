import axios from 'axios';

const url = '/api/v1/ck';
const createUrl = '/api/v1/deploy/ck';

export const ClusterApi = {
  getCluster() {
    return axios.get(`${url}/cluster`);
  },
  getClusterByName(clusterName: string) {
    return axios.get(`${url}/cluster/${ clusterName }`);
  },
  getClusterConfig(clusterName: string) {
    return axios.get(`${url}/config/${clusterName}`);
  },
  saveClusterConfig(clusterName: string, data) {
    return axios.post(`${url}/config/${clusterName}`, data);
  },
  getClusterCreateFormSchema() {
    return axios.get(`/api/v1/ui/schema?type=deploy`);
  },
  getClusterUpdateFormSchema() {
    return axios.get(`/api/v1/ui/schema?type=config`);
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
    return axios.put(`${url}/node/start/${ clusterName }?ip=${ ip }&password=${ password || ''}`);
  },
  offlineClusterNode(clusterName, ip, password?) {
    return axios.put(`${url}/node/stop/${ clusterName }?ip=${ ip }&password=${ password || ''}`);
  },
  getNodeLog({ clusterName, ip, logType, lines = 1000, tail = true }) {
    return axios.post(`${url}/node/log/${ clusterName }?ip=${ ip }`, {
      lines,
      logType,
      tail,
    });
  },
};
