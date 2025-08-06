<template>
  <div class="history pb-20">
    <div class="title flex flex-between flex-vcenter ptb-10 pull-left">
      <span class="fs-20 font-bold mr-10">{{ $t('history.Backup History') }}</span>
    </div>

    <vxe-toolbar custom class="pull-right">
      <template #buttons>
        <el-input size="medium" :placeholder="$t('history.Keyword Search')" v-model="searchKey" class="width-250 mr-10"
          suffix-icon="el-icon-search" @keyup.enter.native="handleSearch">
        </el-input>
        <el-button size="mini" @click="fetchBackupHistory" circle icon="el-icon-refresh" class="fs-16 fc-black"
          :title="$t('history.Refresh')" style="border-color: #dcdfe6;"></el-button>
      </template>
    </vxe-toolbar>

    <vxe-table style="clear: both;" ref="xTable" v-bind="gridOptions" :columns="columns" :data="currentPageData"
      v-loading="loading" @sort-change="sortChangeEvent">
      <vxe-column v-for="{ field, title, width, fixed } of columns" :key="field" :field="field" :title="title"
        :width="width" :fixed="fixed" sortable>
        <template #default="{ row }" v-if="field === 'partitionCount'">
          <span>{{ row.partitions ? row.partitions.length : 0 }}</span>
        </template>
        <template #default="{ row }" v-else-if="field === 'status'">
          <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
        </template>

        <template #default="{ row }" v-else-if="field === 'create_time'">
          <span>{{ formatDate(row[field]) }}</span>
        </template>

        <template #default="{ row }" v-else-if="field === 'action'">
          <el-button type="text" size="mini" @click="viewDetail(row)">{{ $t('history.View Details') }}</el-button>
          <el-button type="text" size="mini" @click="deleteBackup(row)">{{ $t('history.Delete') }}</el-button>
        </template>

        <template #default="{ row }" v-else>
          <span>{{ row[field] }}</span>
        </template>
      </vxe-column>
    </vxe-table>

    <vxe-pager :current-page="pagination.currentPage" :page-size.sync="pagination.pageSize"
      :page-sizes="pagination.pageSizes" :total="pagination.total"
      :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']" @page-change="handlePageChange">
    </vxe-pager>

    <!-- 详情弹窗 -->
    <el-dialog :title="$t('history.Backup Details')" :visible.sync="detailVisible" width="800px" :before-close="handleDetailClose">
      <div class="detail-modal">
        <!-- 操作栏 -->
        <div class="action-bar flex flex-between">
          <div class="flex flex-vcenter">
            <el-input size="small" :placeholder="$t('history.Partition Name Search')" v-model="partitionSearchKey" class="width-200 mr-10"
              suffix-icon="el-icon-search" @keyup.enter.native="handlePartitionSearch" clearable
              @clear="clearPartitionSearch">
            </el-input>
          </div>
          <div class="flex flex-vcenter">
            <el-button type="text" @click="refreshPartitionData" circle icon="el-icon-refresh"
              class="fs-16 fc-black mr-10" :title="$t('history.Refresh')" style="border-color: #dcdfe6; padding: 4px;">
            </el-button>
            <el-button type="primary" @click="handleRestore" :disabled="selectedPartitions.length === 0">
              {{ $t('history.Restore Selected Partitions') }} ({{ selectedPartitions.length }})
            </el-button>
          </div>
        </div>


        <!-- 分区详情表格 -->
        <vxe-table ref="partitionTable" :data="filteredPartitions"
          :checkbox-config="{ reserve: true, checkMethod: checkPartitionSelectable }" @checkbox-change="onSelectChange"
          @checkbox-all="onSelectChange">
          <vxe-column type="checkbox" width="50"></vxe-column>
          <vxe-column field="partition" :title="$t('history.Partition')" width="100"></vxe-column>
          <vxe-column field="size" :title="$t('history.Disk Size')" width="100">
            <template #default="{ row }">
              <span>{{ formatSize(row.size) }}</span>
            </template>
          </vxe-column>
          <vxe-column field="rows" :title="$t('history.Rows')" width="100">
            <template #default="{ row }">
              <span>{{ row.rows !== undefined ? row.rows.toLocaleString() : '-' }}</span>
            </template>
          </vxe-column>
          <vxe-column field="fileNum" :title="$t('history.File Count')" width="100">
            <template #default="{ row }">
              <span>{{ row.fileNum !== undefined ? row.fileNum.toLocaleString() : '-' }}</span>
            </template>
          </vxe-column>
          <vxe-column field="elapsed" :title="$t('history.Execution Time')" width="100">
            <template #default="{ row }">
              <span>{{ `${row.elapsed}s` }}</span>
            </template>
          </vxe-column>
          <vxe-column field="status" :title="$t('history.Status')" width="80" :filters="statusFilters" :filter-method="statusFilterMethod"
            :filter-panel-width="150">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
            </template>
          </vxe-column>
          <vxe-column field="msg" :title="$t('history.Error Message')" min-width="150">
            <template #default="{ row }">
              <el-tooltip v-if="row.msg && row.msg.length > 20" :content="row.msg" placement="top">
                <span class="error-msg" @dblclick="copyErrorMsg(row.msg)"
                  v-text="row.msg.substring(0, 20) + '...'"></span>
              </el-tooltip>
              <span v-else class="error-msg" @dblclick="copyErrorMsg(row.msg)" v-text="row.msg || '-'"></span>
            </template>
          </vxe-column>
        </vxe-table>

        <!-- 分区表格分页 -->
        <vxe-pager :current-page="partitionPagination.currentPage" :page-size.sync="partitionPagination.pageSize"
          :page-sizes="partitionPagination.pageSizes" :total="partitionPagination.total"
          :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'Sizes', 'Total']" @page-change="handlePartitionPageChange">
        </vxe-pager>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="detailVisible = false">{{ $t('history.Close') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { DataManageApi } from '@/apis';

export default {
  name: 'History',
  data() {
    return {
      searchKey: '',
      backupHistory: [],
      detailVisible: false,
      selectedRecord: null,
      selectedPartitions: [],
      sort: {},
      partitionSearchKey: '',
      partitionPagination: {  // 添加分区表格的分页配置
        total: 0,
        pageSize: 5,
        pageSizes: [5, 10, 20, 50, 100],
        currentPage: 1
      },
      pagination: {
        total: 0,
        pageSize: 10,
        pageSizes: [10, 15, 20, 50, 100, 200, 500, 1000],
        currentPage: 1
      },
      gridOptions: {
        border: true,
        resizable: true,
        showHeaderOverflow: true,
        showOverflow: true,
        highlightHoverRow: true,
        height: 550,
        rowId: 'backup_id',
        toolbarConfig: {
          custom: true
        },
        sortConfig: {
          trigger: 'cell',
        }
      },
      statusFilters: [
        { label: 'waiting', value: 'waiting' },
        { label: 'running', value: 'running' },
        { label: 'success', value: 'success' },
        { label: 'failed', value: 'failed' },
        { label: 'init', value: 'init' },
        { label: 'prepare', value: 'prepare' },
        { label: 'backup', value: 'backup' },
        { label: 'restore', value: 'restore' },
        { label: 'check', value: 'check' },
        { label: 'close', value: 'close' },
      ]
    };
  },
  computed: {
    columns() {
      return [
        {
          field: "table",
          title: this.$t('history.Table Name'),
          width: 200,
          fixed: 'left'
        },
        {
          field: "partitionCount",
          title: this.$t('history.Partition Count'),
          width: 100
        },
        {
          field: "operation",
          title: this.$t('history.Operation Type'),
          width: 100
        },
        {
          field: "schedule_type",
          title: this.$t('history.Backup Type'),
          width: 100
        },
        {
          field: "target_type",
          title: this.$t('history.Backup Target'),
          width: 100
        },
        {
          field: "status",
          title: this.$t('history.Status'),
          width: 100
        },
        {
          field: "create_time",
          title: this.$t('history.Creation Time'),
          width: 180
        },
        {
          field: "action",
          title: this.$t('history.Actions'),
          width: 150,
          fixed: 'right'
        }
      ];
    },
    listData() {
      const { sort: { property, order } } = this;
      let result = (this.backupHistory || []).map(item => ({
        ...item,
        table: `${item.database}.${item.table}` // 合并数据库名和表名
      }));

      if (this.searchKey) {
        result = result.filter(item =>
          item.table.includes(this.searchKey) ||
          item.operation.includes(this.searchKey) ||
          item.schedule_type.includes(this.searchKey) ||
          item.target_type.includes(this.searchKey)
        );
      }

      if (property && order) {
        result.sort((prev, next) => {
          const type = typeof prev[property];
          if (type === 'number') {
            const flag = prev[property] - next[property];
            if (order === 'asc') {
              return flag;
            } else if (order === 'desc') {
              return -flag;
            }
          } else if (type === 'string') {
            let flag;
            if (prev[property].length === next[property].length) {
              flag = prev[property].localeCompare(next[property]);
            } else {
              flag = prev[property].length - next[property].length;
            }
            if (order === 'asc') {
              return flag;
            } else if (order === 'desc') {
              return -flag;
            }
          }
          return 0;
        });
      }

      return result;
    },
    currentPageData() {
      const { pagination: { currentPage, pageSize }, listData } = this;
      // 确保在数据更新后同步分页总数
      this.$nextTick(() => {
        if (this.pagination.total !== listData.length) {
          this.pagination.total = listData.length;
        }
      });
      return listData?.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    },
    filteredPartitionsData() {
      let result = [...this.partitions];

      // 根据 partition 字段进行筛选
      if (this.partitionSearchKey) {
        result = result.filter(item =>
          item.partition && item.partition.includes(this.partitionSearchKey)
        );
      }

      return result;
    },
    partitions() {
      return (this.selectedRecord && this.selectedRecord.partitions) || [];
    },
    sortedPartitions() {
      // 对分区按 partition 字段从大到小排序
      const sortedPartitions = [...this.filteredPartitionsData].sort((a, b) => {
        // 如果是字符串，按字典序倒序排列
        if (typeof a.partition === 'string' && typeof b.partition === 'string') {
          return b.partition.localeCompare(a.partition);
        }
        // 如果是数字或其他类型，按数值倒序排列
        return b.partition - a.partition;
      });

      return sortedPartitions;
    },

    paginatedPartitions() {
      const { partitionPagination: { currentPage, pageSize }, sortedPartitions } = this;
      const start = (currentPage - 1) * pageSize;
      const end = currentPage * pageSize;

      // 更新总条数
      this.partitionPagination.total = sortedPartitions.length;

      return sortedPartitions.slice(start, end);
    },
    filteredPartitions() {
      // 这里可以添加筛选逻辑（如果需要）
      return this.paginatedPartitions;
    }
  },
  watch: {
    'listData.length'(len) {
      this.pagination.currentPage = 1;
      this.pagination.total = len;
    }
  },
  methods: {
    handleSearch() {
      // 触发重新加载数据或在前端过滤
      this.fetchBackupHistory();
    },
    async fetchBackupHistory() {
      const res = await DataManageApi.getBackupHistory(this.$route.params.id);
      if (res.data.retCode === '0000') {
        this.backupHistory = res.data.entity || [];
      } else {
        this.$message.error(res.data.retMsg || '获取备份历史失败');
      }
    },

    sortChangeEvent(ctx) {
      const { property, order } = ctx;
      this.sort = {
        property,
        order
      };
    },

    copyErrorMsg(msg) {
      if (!msg) return;

      const textarea = document.createElement('textarea');
      textarea.value = msg;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      this.$message.success('已复制');
    },

    handlePageChange(pager) {
      this.pagination.currentPage = pager.currentPage;
    },
    handlePartitionPageChange(pager) {
      this.partitionPagination.currentPage = pager.currentPage;
      this.partitionPagination.pageSize = pager.pageSize;

      // 清空已选择项
      this.selectedPartitions = [];

      // 清空表格的选择状态
      this.$nextTick(() => {
        if (this.$refs.partitionTable) {
          this.$refs.partitionTable.clearCheckboxRow();
        }
      });
    },
    checkPartitionSelectable({ row }) {
      return row.status === 'success' && this.selectedRecord.operation === 'backup';
    },

    viewDetail(record) {
      this.selectedRecord = record;
      this.detailVisible = true;
    },

    async deleteBackup(record) {
      // 实现删除逻辑
      console.log('删除备份:', record);
      const res = await DataManageApi.deleteBackupHistory(record.backup_id);
      console.log('API返回数据:', res.data); // 调试用
      console.log('code:', res.data.retCode)
      if (res.data.retCode === '0000') {
        this.$message.success('删除成功');
        // 刷新数据
        this.fetchBackupHistory();
      } else {
        this.$message.error(res.data.retMsg || '删除备份历史失败');
      }
    },

    async refreshPartitionData() {
      const res = await DataManageApi.getBackupById(this.selectedRecord.backup_id);
      if (res.data.retCode === '0000') {
        // 更新 selectedRecord 中的 partitions 数据
        this.$set(this.selectedRecord, 'partitions', res.data.entity.partitions || []);
        // 重置分页到第一页，但保持筛选条件
        this.partitionPagination.currentPage = 1;
      } else {
        this.$message.error(res.data.retMsg || '刷新失败');
      }
    },

    handleDetailClose() {
      this.detailVisible = false;
      this.selectedPartitions = [];
    },

    onSelectChange({ records }) {
      this.selectedPartitions = records;
    },

    getStatusType(status) {
      switch (status) {
        case 'waiting':
          return '';
        case 'running', "init", "prepare", "backup", "restore", "check", "close":
          return 'primary';
        case 'success':
          return 'success';
        case 'failed':
          return 'danger';
        default:
          return '';
      }
    },
    /**
    * 处理分区筛选
    */
    handlePartitionSearch() {
      // 重置到第一页
      this.partitionPagination.currentPage = 1;

      // 清空已选择项
      this.selectedPartitions = [];

      // 清空表格的选择状态
      this.$nextTick(() => {
        if (this.$refs.partitionTable) {
          this.$refs.partitionTable.clearCheckboxRow();
        }
      });
    },
    handleDetailClose() {
      this.detailVisible = false;
      this.selectedPartitions = [];
      // 重置分页
      this.partitionPagination.currentPage = 1;
      this.partitionPagination.pageSize = 10;
      // 重置筛选
      this.partitionSearchKey = '';
    },

    /**
     * 清空分区筛选
     */
    clearPartitionSearch() {
      this.partitionSearchKey = '';
      this.handlePartitionSearch();
    },

    formatSize(size) {
      if (size === null || size === undefined || size === 0) {
        return '-';
      }
      if (size < 1024) {
        return size + ' B';
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB';
      } else if (size < 1024 * 1024 * 1024) {
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
      } else {
        return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
      }
    },

    formatDate(dateStr) {
      if (!dateStr || dateStr === '0001-01-01T00:00:00Z') {
        return '-';
      }
      // 尝试解析日期
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          return dateStr; // 如果无法解析，直接返回原字符串
        }
        return date.toLocaleString('zh-CN');
      } catch (e) {
        return dateStr; // 出错时返回原字符串
      }
    },

    async handleRestore() {
      // 检查是否有选中的记录和选中的分区
      if (!this.selectedRecord) {
        this.$message.warning('没有选择有效的备份记录');
        return;
      }

      if (this.selectedPartitions.length === 0) {
        this.$message.warning('请先选择要恢复的分区');
        return;
      }

      try {
        // 构造恢复请求参数
        const restoreRequest = {
          backup_id: this.selectedRecord.backup_id,
          partition: this.selectedPartitions.map(p => p.partition) // 提取选中分区的名称
        };

        console.log('恢复数据请求:', restoreRequest);
        const res = await DataManageApi.restoreData(this.$route.params.id, restoreRequest);
        console.log('API返回数据:', res.data);
        console.log('code:', res.data.retCode);
        if (res.data.retCode === '0000') {
          this.$message.success('恢复操作已提交');
          // 关闭详情弹窗
          this.detailVisible = false;
          // 清空选中项
          this.selectedPartitions = [];
          // 刷新备份历史数据
          this.fetchBackupHistory();
        } else {
          this.$message.error(res.data.retMsg || '恢复数据失败');
        }
      } catch (error) {
        this.$message.error('恢复数据失败: ' + error.message);
      }
    },
    statusFilterMethod({ value, row, column }) {
      return row.status === value;
    },
    handleStatusFilterChange(value) {
      this.statusFilter = value;
      // 清空已选择项，因为数据集可能已改变
      this.selectedPartitions = [];
      this.$nextTick(() => {
        // 清空表格的选择状态
        if (this.$refs.partitionTable) {
          this.$refs.partitionTable.clearCheckboxRow();
        }
      });
    }
  },

  mounted() {
    console.log('组件挂载，开始获取数据'); // 调试用
    this.fetchBackupHistory();
  }
};
</script>

<style scoped>
.history {
  padding: 20px;
}

.detail-modal {
  padding: 20px;
}

.action-bar {
  margin-bottom: 16px;
  text-align: right;
}

/* .error-msg:hover {
  text-decoration: underline;
} */
</style>