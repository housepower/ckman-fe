<template>
  <div>
    <div class="filter-container mb-10">
      <el-input
        size="small"
        :placeholder="$t('tables.Partition Name Search')"
        v-model="searchKey"
        class="width-200 mr-10"
        suffix-icon="el-icon-search"
        clearable>
      </el-input>
      <el-select
        size="small"
        v-model="statusFilter"
        :placeholder="$t('tables.Status Filter')"
        class="width-150 mr-10">
        <el-option
          :label="$t('tables.All')"
          value="all">
        </el-option>
        <el-option
          :label="$t('tables.Active')"
          :value="true">
        </el-option>
        <el-option
          :label="$t('tables.Detached')"
          :value="false">
        </el-option>
      </el-select>
      <el-button size="mini" @click="getList()" circle icon="el-icon-refresh" class="fs-16 fc-black" style="border-color: #dcdfe6;"></el-button>
      <el-button
        size="mini"
        type="warning"
        :disabled="selectedPartitions.length === 0"
        @click="batchOperate(1)">
        {{$t('tables.Batch Detach')}}
      </el-button>
      <el-button
        size="mini"
        type="success"
        :disabled="selectedPartitions.length === 0"
        @click="batchOperate(2)">
        {{$t('tables.Batch Attach')}}
      </el-button>
      <el-button
        size="mini"
        type="danger"
        :disabled="selectedPartitions.length === 0"
        @click="batchOperate(3)">
        {{$t('tables.Batch Delete')}}
      </el-button>
      <span v-if="selectedPartitions.length > 0" class="ml-10 fc-gray">
        {{$t('tables.Selected')}}: {{selectedPartitions.length}}
      </span>
    </div>
    <el-table
      ref="partitionTable"
      :data="currentPageData"
      style="width: 100%;"
      :row-class-name="tableRowClassName"
      height="500"
      @selection-change="handleSelectionChange">
      <el-table-column
        type="selection"
        width="55"
        fixed="left">
      </el-table-column>
      <el-table-column
        fixed="left"
        prop="partition_id"
        width="100"
        :label="$t('tables.Partition')"
        show-overflow-tooltip>
      </el-table-column>
      <el-table-column
        prop="parts"
        :label="$t('tables.Parts')"
        show-overflow-tooltip>
      </el-table-column>
      <el-table-column
        prop="rows"
        :label="$t('tables.Rows')"
        show-overflow-tooltip>
      </el-table-column>
      <el-table-column
        prop="uncompressed"
        :label="$t('tables.UnCompressed')"
        show-overflow-tooltip>
        <template slot-scope="{ row }">
          {{byteConvert(row.uncompressed)}}
        </template>
      </el-table-column>
      <el-table-column
        prop="compressed"
        :label="$t('tables.Compressed')"
        show-overflow-tooltip>
        <template slot-scope="{ row }">
          {{byteConvert(row.compressed)}}
        </template>
      </el-table-column>
      <el-table-column
        prop="min_time"
        width="150"
        :label="$t('tables.Min Time')"
        show-overflow-tooltip>
      </el-table-column>
      <el-table-column
        prop="max_time"
        width="150"
        :label="$t('tables.Max Time')"
        show-overflow-tooltip>
      </el-table-column>
      <el-table-column
        prop="disk_name"
        :label="$t('tables.Disk Name')"
        show-overflow-tooltip>
      </el-table-column>
      <el-table-column
        fixed="right"
        align="center"
        prop=""
        :label="$t('tables.Action')"
        :width="150">
        <template slot-scope="{ row }">
          <el-button
            type="text"
            :class="row.status ? 'fc-warning' : 'fc-success'"
            @click="operatePartition(row, row.status ? 1 : 2)">
            {{ row.status ? $t('tables.Detach') : $t('tables.Attach') }}
          </el-button>
          <el-button type="text" class="fc-danger" @click="operatePartition(row, 3)">{{$t('tables.Delete')}}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      class="mt-10"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="pagination.currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pagination.pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total">
    </el-pagination>
  </div>
</template>

<script lang="ts">
import { TablesApi } from '@/apis';
import { byteConvert } from '@/helpers/';
import moment from 'moment';
interface Partition {
  name: string;
  database: string;
  table: string;
  rows: Number | string;
  compressed: Number;
  uncompressed: Number;
  min_time: string;
  max_time: string;
  disk_name: string;
  status: boolean;
}
export default {
  props: {
    tableName: String,
    clusterName: String,
  },
  data() {
    return {
      list: [],
      searchKey: '',
      statusFilter: 'all',
      selectedPartitions: [],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0,
      },
    };
  },
  computed: {
    filteredList() {
      const { searchKey, statusFilter, list } = this;
      return list.filter(item => {
        // 分区名模糊搜索
        const partitionId = item.partition_id || '';
        const name = item.name || '';
        const matchSearch = !searchKey ||
          partitionId.toString().toLowerCase().includes(searchKey.toLowerCase()) ||
          name.toString().toLowerCase().includes(searchKey.toLowerCase());
        
        // 状态筛选
        const matchStatus = statusFilter === 'all' || item.status === statusFilter;
        
        return matchSearch && matchStatus;
      });
    },
    currentPageData() {
      const { pagination: { currentPage, pageSize }, filteredList } = this;
      return filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }
  },
  watch: {
    filteredList(newVal) {
      // 筛选条件变化时重置到第一页
      this.pagination.currentPage = 1;
      this.pagination.total = newVal.length;
    }
  },
  created() {
    this.getList();
  },
  methods: {
    byteConvert,
    tableRowClassName({ row }) {
      if (row.status === false) {
        return 'disabled-row'; // 返回灰色样式的类名
      }
      return ''; // 正常显示时不添加特殊类名
    },
    handleSelectionChange(selection) {
      this.selectedPartitions = selection;
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.currentPage = 1;
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val;
    },
    async batchOperate(op) {
      const { selectedPartitions, clusterName } = this;
      const opText = op === 1 ? 'Detach' : (op === 2 ? 'Attach' : 'Delete');
      
      await this.$confirm(
        this.$t('tables.Confirm Batch Operation', { op: this.$t(`tables.${opText}`), count: selectedPartitions.length }),
        this.$t('common.tips'),
        {
          confirmButtonText: this.$t('common.Confirm'),
          cancelButtonText: this.$t('common.Cancel'),
          type: 'warning',
        }
      );

      try {
        // 并行执行所有操作
        const promises = selectedPartitions.map(row => {
          return TablesApi.operatePartition(clusterName, {
            op,
            database: row.database,
            table: row.table,
            partitionId: row.partition_id,
            status: row.status
          });
        });
        
        await Promise.all(promises);
        this.$message.success(this.$t('common.Action Success'));
        // 清空选择
        this.$refs.partitionTable.clearSelection();
      } catch (error) {
        const errorMsg = error.response?.data?.retMsg || error.response?.data?.message || error.message || 'Unknown error';
        this.$message.error(errorMsg);
      }
      // 重新获取列表以刷新数据
      this.getList();
    },
    async getList() {
      const { clusterName, tableName } = this;
      const { data: { entity } } = await TablesApi.getPartitions(clusterName, tableName);
      
      this.list = (Object.freeze(Object.entries(entity)||[])).map(([key, values]: [string, Partition]) => {
        values.max_time = moment(values.max_time).format('YYYY-MM-DD HH:mm:SS');
        values.min_time = moment(values.min_time).format('YYYY-MM-DD HH:mm:SS');
        values.rows = values.rows.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); // 加入数字千分位分隔符
        values.name = key;
        values.status = values.status ?? true; // 默认值为 true
        return values;
      });
      this.list.sort(function (a, b) {
        return b.name - a.name;
      })
      this.pagination.total = this.list.length;
    },
    async deleteItem(row) {
      await this.$confirm(this.$t("common.Confirm Delete"), this.$t("common.tips"), {
        confirmButtonText: this.$t("common.Delete"),
        cancelButtonText: this.$t("common.Cancel"),
        text: "warning",
      });
      const { clusterName } = this;
      const { table, database, partition_id } = row;
      await TablesApi.deletePartition(clusterName, {
        database,
        table: [table],
        partitionId: partition_id
      });

      this.getList();
    },
    async operatePartition(row, op) {
      const { clusterName } = this;
      const { table, database, partition_id } = row;

      // 调用 API 更新状态（假设有一个更新分区状态的接口）
      try {
        await TablesApi.operatePartition(clusterName, {
          op,
          database,
          table: table,
          partitionId: partition_id,
          status: row.status
        });
        this.$message.success(this.$t('common.Action Success'));
      } catch (error) {
        const errorMsg = error.response?.data?.retMsg || error.response?.data?.message || error.message || 'Unknown error';
        this.$message.error(errorMsg);
      }
      // 重新获取列表以刷新数据
      this.getList();
    }
  },
}
</script>

<style>
.disabled-row td {
  background-color: #f5f7fa !important; /* 灰色背景 */
  color: #909399 !important; /* 灰色字体 */
}
.fc-warning {
  color: #E6A23C;
}
.fc-success {
  color: #67C23A;
}
.fc-danger {
  color: #F56C6C;
}
</style>