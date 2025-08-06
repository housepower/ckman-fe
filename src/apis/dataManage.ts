import axios from 'axios';

const url = '/api/v1/data_manage';
  
export const DataManageApi = {
    importData(clusterName:string, params, opt) {
      return axios.post(`${url}/import/${clusterName}`, params, opt);
    },
    exportData(clusterName:string, params) {
      return axios.post(`${url}/export/${clusterName}`, params);
    },
    backupData(clusterName:string, params) {
      return axios.post(`${url}/backup/${clusterName}`, params);
    },
    restoreData(clusterName:string, params) {
      return axios.post(`${url}/restore/${clusterName}`, params);
    },
    getBackupHistory(clusterName:string) {
      return axios.get(`${url}/backup/${clusterName}`);
    },
    getBackupById(backupId:string) {
      return axios.get(`${url}/backup_history/${backupId}`);
    },
    deleteBackupHistory(backupId:string) {
      return axios.delete(`${url}/backup/${backupId}`);
    },
  };
  