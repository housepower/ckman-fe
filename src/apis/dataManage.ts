import axios from 'axios';

const url = '/api/v1/data_manage';

export const DataManageApi = {
  // ============ 不变 ============
  importData(clusterName: string, params: any, opt?: any) {
    return axios.post(`${url}/import/${clusterName}`, params, opt);
  },
  exportData(clusterName: string, params: any) {
    return axios.post(`${url}/export/${clusterName}`, params);
  },

  // ============ Backup / Restore 主流程 ============
  // 提交立即/定时备份；返回 { run_ids: string[] }（定时备份返回空数组）
  backupData(clusterName: string, params: any) {
    return axios.post(`${url}/backup/${clusterName}`, params);
  },
  // 提交恢复；body: { source_run_id, partitions[] }；返回 { run_id }
  restoreData(clusterName: string, params: { source_run_id: string; partitions: string[] }) {
    return axios.post(`${url}/restore/${clusterName}`, params);
  },

  // ============ Policy 列表 / 详情 / 编辑 / 删除 ============
  // 返回 cluster 下 policy 列表
  listPolicies(clusterName: string) {
    return axios.get(`${url}/backup/${clusterName}`);
  },
  getPolicy(policyId: string) {
    return axios.get(`${url}/backup/policy/${policyId}`);
  },
  updatePolicy(policyId: string, params: any) {
    return axios.put(`${url}/backup/policy/${policyId}`, params);
  },
  deletePolicy(policyId: string) {
    return axios.delete(`${url}/backup/policy/${policyId}`);
  },
  triggerPolicy(policyId: string) {
    return axios.post(`${url}/backup/policy/${policyId}/trigger`);
  },

  // ============ Run 详情 + 台账 ============
  getRun(runId: string) {
    return axios.get(`${url}/backup/run/${runId}`);
  },
  // 任务维度：某 policy 下的 run 历史
  listRunsByPolicy(policyId: string, params?: { limit?: number; before?: string }) {
    return axios.get(`${url}/backup/policy/${policyId}/runs`, { params });
  },
  // 表维度：cluster.database.table 过去 days 天的 run
  listRunsByTable(clusterName: string, database: string, table: string, days?: number) {
    return axios.get(`${url}/backup/table/${clusterName}/${database}/${table}/runs`, {
      params: { days: days ?? 30 },
    });
  },

  // ============ 表分区信息（前端选表用，缓存几分钟）============
  getTableSummary(clusterName: string, database: string) {
    return axios.get(`${url}/tables/${clusterName}/${database}/summary`);
  },
};
