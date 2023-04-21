import axios from 'axios';

const url = '/api/v1/task';

export const TaskApi = {
  // 任务列表
  getLists() {
    return axios.get(`${url}/lists`);
  },
  // 正在执行的任务列表
  getRunningLists() {
    return axios.get(`${url}/running`);
  },
  // 任务状态
  getTaskStatus(taskId) {
    return axios.get(`${url}/${taskId}`);
  },
  // 删除任务
  deleteTask(taskId) {
    return axios.delete(`${url}/${taskId}`);
  },
  // 任务详情
  getTaskDetail(taskId) {
    return axios.get(`${url}/${taskId}`);
  },
  // 停止任务
  stopTask(taskId) {
    return axios.put(`${url}/${taskId}`);
  },
};
