<template>
  <section class="partitions">
    <div class="partitions__toolbar">
      <div class="partitions__filters">
        <el-input
          v-model="searchKey"
          size="small"
          :placeholder="$t('tables.Partition Name Search')"
          suffix-icon="el-icon-search"
          clearable
          class="partitions__search"
        />
        <el-select
          v-model="statusFilter"
          size="small"
          :placeholder="$t('tables.Status Filter')"
          class="partitions__status-select"
        >
          <el-option :label="$t('tables.All')" value="all" />
          <el-option :label="$t('tables.Active')" :value="true" />
          <el-option :label="$t('tables.Detached')" :value="false" />
        </el-select>
        <el-button
          size="small"
          plain
          icon="el-icon-refresh"
          @click="getList()"
        >{{ $t('common.Refresh') }}</el-button>
      </div>

      <transition name="el-fade-in">
        <div v-if="selectedPartitions.length > 0" class="partitions__batch">
          <span class="partitions__selected-count">
            {{ $t('tables.Selected') }} {{ selectedPartitions.length }}
          </span>
          <el-button size="small" @click="batchOperate(1)">
            {{ $t('tables.Batch Detach') }}
          </el-button>
          <el-button size="small" @click="batchOperate(2)">
            {{ $t('tables.Batch Attach') }}
          </el-button>
          <el-button size="small" type="danger" plain @click="batchOperate(3)">
            {{ $t('tables.Batch Delete') }}
          </el-button>
        </div>
      </transition>
    </div>

    <el-table
      ref="partitionTable"
      class="partitions__table"
      :data="currentPageData"
      :row-class-name="tableRowClassName"
      height="480"
      :border="false"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="48" fixed="left" />
      <el-table-column
        fixed="left"
        prop="partition_id"
        :label="$t('tables.Partition')"
        width="120"
        show-overflow-tooltip
      />
      <el-table-column prop="parts" :label="$t('tables.Parts')" show-overflow-tooltip />
      <el-table-column prop="rows" :label="$t('tables.Rows')" show-overflow-tooltip />
      <el-table-column
        prop="uncompressed"
        :label="$t('tables.UnCompressed')"
        show-overflow-tooltip
      >
        <template slot-scope="{ row }">{{ byteConvert(row.uncompressed) }}</template>
      </el-table-column>
      <el-table-column
        prop="compressed"
        :label="$t('tables.Compressed')"
        show-overflow-tooltip
      >
        <template slot-scope="{ row }">{{ byteConvert(row.compressed) }}</template>
      </el-table-column>
      <el-table-column
        prop="min_time"
        :label="$t('tables.Min Time')"
        width="160"
        show-overflow-tooltip
      />
      <el-table-column
        prop="max_time"
        :label="$t('tables.Max Time')"
        width="160"
        show-overflow-tooltip
      />
      <el-table-column prop="disk_name" :label="$t('tables.Disk Name')" show-overflow-tooltip />
      <el-table-column
        fixed="right"
        align="center"
        :label="$t('tables.Action')"
        width="160"
      >
        <template slot-scope="{ row }">
          <el-button
            type="text"
            size="small"
            class="partitions__action"
            :class="row.status ? 'partitions__action--warning' : 'partitions__action--success'"
            @click="operatePartition(row, row.status ? 1 : 2)"
          >{{ row.status ? $t('tables.Detach') : $t('tables.Attach') }}</el-button>
          <el-button
            type="text"
            size="small"
            class="partitions__action partitions__action--danger"
            @click="operatePartition(row, 3)"
          >{{ $t('tables.Delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="partitions__pager"
      :current-page="pagination.currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pagination.pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </section>
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
      pagination: { currentPage: 1, pageSize: 10, total: 0 },
    };
  },
  computed: {
    filteredList() {
      const { searchKey, statusFilter, list } = this;
      return list.filter((item) => {
        const partitionId = item.partition_id || '';
        const name = item.name || '';
        const k = searchKey.toLowerCase();
        const matchSearch = !searchKey ||
          partitionId.toString().toLowerCase().includes(k) ||
          name.toString().toLowerCase().includes(k);
        const matchStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchSearch && matchStatus;
      });
    },
    currentPageData() {
      const { currentPage, pageSize } = this.pagination;
      return this.filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    },
  },
  watch: {
    filteredList(newVal) {
      this.pagination.currentPage = 1;
      this.pagination.total = newVal.length;
    },
  },
  created() {
    this.getList();
  },
  methods: {
    byteConvert,
    tableRowClassName({ row }) {
      return row.status === false ? 'partitions__row--disabled' : '';
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
        this.$t('tables.Confirm Batch Operation', {
          op: this.$t(`tables.${opText}`),
          count: selectedPartitions.length,
        }),
        this.$t('common.tips'),
        {
          confirmButtonText: this.$t('common.Confirm'),
          cancelButtonText: this.$t('common.Cancel'),
          type: 'warning',
        },
      );

      try {
        await Promise.all(
          selectedPartitions.map((row) =>
            TablesApi.operatePartition(clusterName, {
              op,
              database: row.database,
              table: row.table,
              partitionId: row.partition_id,
              status: row.status,
            }),
          ),
        );
        this.$message.success(this.$t('common.Action Success'));
        this.$refs.partitionTable.clearSelection();
      } catch (error) {
        const msg =
          error.response?.data?.retMsg ||
          error.response?.data?.message ||
          error.message ||
          'Unknown error';
        this.$message.error(msg);
      }
      this.getList();
    },
    async getList() {
      const { clusterName, tableName } = this;
      const { data: { entity } } = await TablesApi.getPartitions(clusterName, tableName);

      this.list = (Object.freeze(Object.entries(entity) || [])).map(
        ([key, values]: [string, Partition]) => {
          values.max_time = moment(values.max_time).format('YYYY-MM-DD HH:mm:SS');
          values.min_time = moment(values.min_time).format('YYYY-MM-DD HH:mm:SS');
          values.rows = values.rows.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          values.name = key;
          values.status = values.status ?? true;
          return values;
        },
      );
      this.list.sort((a, b) => b.name - a.name);
      this.pagination.total = this.list.length;
    },
    async operatePartition(row, op) {
      const { clusterName } = this;
      const { table, database, partition_id } = row;

      try {
        await TablesApi.operatePartition(clusterName, {
          op,
          database,
          table,
          partitionId: partition_id,
          status: row.status,
        });
        this.$message.success(this.$t('common.Action Success'));
      } catch (error) {
        const msg =
          error.response?.data?.retMsg ||
          error.response?.data?.message ||
          error.message ||
          'Unknown error';
        this.$message.error(msg);
      }
      this.getList();
    },
  },
};
</script>

<style lang="scss" scoped>
.partitions {
  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-3);
    margin-bottom: var(--s-3);
    flex-wrap: wrap;
  }

  &__filters {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    flex-wrap: wrap;
  }

  &__search {
    width: 220px;
  }

  &__status-select {
    width: 140px;
  }

  &__batch {
    display: flex;
    align-items: center;
    gap: var(--s-2);
  }

  &__selected-count {
    font-size: var(--fs-sm);
    color: var(--c-text-tertiary);
    font-variant-numeric: tabular-nums;
    margin-right: var(--s-1);
  }

  &__pager {
    margin-top: var(--s-3);
  }

  &__action {
    padding: 0 var(--s-1);

    &--warning {
      color: var(--c-warning-fg) !important;

      &:hover {
        color: var(--c-warning-solid) !important;
      }
    }

    &--success {
      color: var(--c-success-fg) !important;

      &:hover {
        color: var(--c-success-solid) !important;
      }
    }

    &--danger {
      color: var(--c-danger-fg) !important;

      &:hover {
        color: var(--c-danger-solid) !important;
      }
    }
  }
}
</style>

<style>
.partitions__row--disabled td {
  background-color: var(--c-surface-1) !important;
  color: var(--c-text-tertiary) !important;
}
</style>
