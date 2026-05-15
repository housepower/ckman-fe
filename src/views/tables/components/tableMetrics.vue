<template>
  <section class="table-metric">
    <div class="table-metric__head">
      <div class="table-metric__title-group">
        <div class="metric-toggle">
          <button
            class="metric-toggle__item"
            :class="{ 'metric-toggle__item--active': activeTab === 'table' }"
            @click="switchTab('table')"
          >{{ $t('tables.Table Metrics') }}</button>
          <button
            class="metric-toggle__item"
            :class="{ 'metric-toggle__item--active': activeTab === 'vm' }"
            @click="switchTab('vm')"
          >{{ $t('tables.Vm Metrics') }}</button>
        </div>
        <time-filter v-model="timeFilter" ref="timeFilter" localKey="tableMetricsTimeFilter"
          :refreshDuration.sync="refresh" @input="timeFilterChange" @on-refresh="timeFilterRefresh" />
      </div>
      <div class="table-metric__controls">
        <el-input
          v-model="searchKey"
          size="small"
          :placeholder="$t('common.keyword search')"
          suffix-icon="el-icon-search"
          class="table-metric__search"
        />
        <el-button
          size="small"
          plain
          icon="el-icon-refresh"
          @click="fetchData(true)"
        >{{ $t('common.Refresh') }}</el-button>
      </div>
    </div>

    <vxe-table ref="xTable" v-bind="gridOptions" :columns="columns" :data="currentPageData"
      @sort-change="sortChangeEvent">
      <vxe-column v-for="{ prop, label, minWidth, fixed, filters } of columns" :key="prop" :fixed="fixed" sortable
        :field="prop" :title="label" :filters="filters || null" :min-width="minWidth || 140">

        <template slot-scope="{ row, column }">
          <span v-if="column.property.endsWith('compressed')">{{ byteConvert(row[column.property]) }}</span>
          <span v-else-if="column.property === 'rows'">{{ percentiles(row[column.property]) }}</span>
          <span v-else-if="column.property === 'partitions'" class="flex flex-between flex-vcenter">
            <span>{{ row[column.property] }}</span>
            <el-button type="text" @click="viewPartitions(row)">{{ $t('tables.View') }}</el-button>
          </span>
          <span v-else-if="column.property === 'readwrite_status'">
            <span>{{ row[column.property] }}</span>
            <el-button class="ml-4" v-if="row[column.property] === 'FALSE'" type="text"
              @click="resumeTable(row.tableName)">{{ $t('tables.Resume') }}</el-button>
          </span>
          <span v-else>{{ row[column.property] }}</span>
        </template>
      </vxe-column>
      <vxe-column fixed="right" align="center" :title="$t('tables.Action')" width="200">
        <template slot-scope="scope">
          <el-button @click="viewSql(scope.row.tableName)" type="text" size="small">{{ $t('tables.Schema')
            }}</el-button>
          <!-- <el-button v-if="activeTab === 'table'" type="text" size="small" @click="archiveTable(scope.row.tableName)">{{ $t('tables.Archive')
            }}</el-button> -->
          <el-button v-if="activeTab === 'table'" type="text" size="small" @click="onDelete(scope.row.tableName)">{{ $t('tables.Delete')
            }}</el-button>
        </template>
      </vxe-column>
    </vxe-table>

    <vxe-pager :current-page="pagination.currentPage" :page-size.sync="pagination.pageSize"
      :page-sizes="pagination.pageSizes" :total="pagination.total"
      :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']" @page-change="handlePageChange">
    </vxe-pager>
  </section>
</template>
<script>
import { TablesApi } from "@/apis";
import { $modal } from "@/services";
import { byteConvert } from '@/helpers/';
import { percentiles } from '@/helpers/';
import TablePartitionsComponent from './tablePartitions.vue';
import ViewSchemaDialog from './viewSchemaDialog.vue';
import ArchiveModal from './ArchiveModal.vue';
import TaskDetail from '@/views/task/components/TaskDetail.vue';
import store from '@/store';
export default {
  data() {
    return {
      activeTab: 'table',
      clusterName: '',
      timeFilter: null,
      refresh: null,
      localeKey: 'TABLE_METRICS',
      loading: false,
      searchKey: '',
      sort: {},
      pagination: {
        total: 0,
        pageSize: 10,
        pageSizes: [10, 15, 20, 50, 100, 200, 500, 1000],
        currentPage: 1
      },
      gridOptions: {
        border: false,
        resizable: true,
        showHeaderOverflow: true,
        showOverflow: true,
        highlightHoverRow: true,
        height: 550,
        rowId: 'tableName',
        sortConfig: {
          trigger: 'cell',
        },
      }
    };
  },
  watch: {
    'listData.length'(len) {
      this.pagination.currentPage = 1;
      this.pagination.total = len;
    }
  },
  computed: {
    columns() {
      const baseColumns = [
        {
          prop: "tableName",
          label: this.$t('tables.Table Name'),
          minWidth: 250,
          fixed: 'left',
          sortable: true
        }
      ];
      if (this.activeTab === 'table') {
        return [
          ...baseColumns,
          {
            prop: "columns",
            label: this.$t('tables.Columns'),
            width: 140,
            sortable: true
          },
          {
            prop: "rows",
            label: this.$t('tables.Rows'),
            width: 140,
            sortable: true
          },
          {
            prop: "partitions",
            label: this.$t('tables.Partitions'),
            width: 140,
            sortable: true
          },
          {
            prop: "parts",
            label: this.$t('tables.Parts'),
            width: 140,
            sortable: true
          },
          {
            prop: "uncompressed",
            label: this.$t('tables.UnCompressed'),
            minWidth: 220,
            sortable: true
          },
          {
            prop: "compressed",
            label: this.$t('tables.Compressed'),
            minWidth: 200,
            sortable: true
          },
          {
            prop: "readwrite_status",
            label: this.$t('tables.RWStatus'),
            filters: [
              { label: 'TRUE', value: 'TRUE' },
              { label: 'FALSE', value: 'FALSE' }
            ],
            minWidth: 120,
            sortable: true
          },
        ]
      } else {
        return [
          ...baseColumns,
          {
            prop: "rows",
            label: this.$t('tables.Rows'),
            width: 80,
            sortable: true
          },
          {
            prop: "uncompressed",
            label: this.$t('tables.UnCompressed'),
            minWidth: 120,
            sortable: true
          },
          {
            prop: "compressed",
            label: this.$t('tables.Compressed'),
            minWidth: 120,
            sortable: true
          },
          {
            prop: "sourceTable",
            label: this.$t('tables.Source Table'),
            minWidth: 180,
            sortable: false
          },
          {
            prop: "querySQL",
            label: this.$t('tables.As Select'),
            minWidth: 300,
            sortable: false
          }
        ]
      }
    },
    listData() {
      const { searchKey, sort: { property, order } } = this;
      const result = this.tableData
        ?.filter(x => {
          let flag = true;
          if (!x.tableName?.includes(searchKey)) {
            flag = false;
          }
          return flag;
        }).sort((prev, next) => {
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
        })
      return result;
    },
    currentPageData() {
      const { pagination: { currentPage, pageSize } } = this;
      return this.listData?.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    },
    tableData() {
      const { clusterName } = this;
      return store.getters['clusterTable/getTableDataByClusterName'](clusterName);
    }
  },
  created() {
    const { id: clusterName } = this.$route.params;
    this.clusterName = clusterName;
    this.fetchData();
  },
  methods: {
    byteConvert: byteConvert,
    percentiles: percentiles,
    switchTab(tab) {
      this.activeTab = tab
      this.fetchData(true)
    },
    async fetchData(forceRefresh = false) {
      if (!this.tableData || forceRefresh) {
        this.loading = true;
        const { clusterName } = this;
        const apiMethod = this.activeTab === 'table' ? TablesApi.tableMetrics : TablesApi.vmMetrics;
        const {
          data: { entity },
        } = await apiMethod(clusterName).finally(() => this.loading = false);
        const tableData = (Object.freeze(Object.entries(entity) || []).map(([key, values]) => {
          return this.activeTab == 'table' ? {
            tableName: key,
            columns: values.columns,
            rows: values.rows,
            partitions: values.partitions,
            parts: values.parts,
            uncompressed: values.uncompressed,
            compressed: values.compressed,
            readwrite_status: values.readwrite_status.toString().toUpperCase(),
          } :{
            tableName: key,
            rows: values.rows,
            uncompressed: values.uncompressed,
            compressed: values.compressed,
            sourceTable: values.source_table,
            querySQL: values.as_select,
          }
        }));

        store.commit('clusterTable/setTableData', {
          clusterName,
          tableData,
        });
      }

      this.pagination.total = this.tableData.length;
    },

    sortChangeEvent(ctx) {
      const { property, order } = ctx;
      this.sort = {
        property,
        order
      };
    },

    handlePageChange(pager) {
      this.pagination.currentPage = pager.currentPage;
    },

    // 恢复表
    async resumeTable(table) {
      const { id: clusterName } = this.$route.params;
      const { data: { retCode, retMsg } } = await TablesApi.resumeTable(clusterName, table);
      if (retCode !== '0000') {
        this.$message.error(retMsg);
      } else {
        this.$message.success(this.$t('common.Action Success'));
      }
    },

    // 删除
    async onDelete(key) {
      await this.$confirm(this.$t("common.Confirm Delete"), this.$t("common.tips"), {
        confirmButtonText: this.$t("common.Delete"),
        cancelButtonText: this.$t("common.Cancel"),
        text: "warning",
      });
      const [database, tableName] = key.split('.');
      const { id } = this.$route.params;
      await TablesApi.deleteTable(id, {
        database,
        tableName,
      });
      this.$message.success(`Table ${key} ${this.$t("common.Delete")}${this.$t("common.Success")}`);
      this.fetchData(true);
    },

    // 查看SQL
    async viewSql(key) {
      const [database, tableName] = key.split('.');
      const { id } = this.$route.params;
      const { data: { entity: { create_table_query } } } = await TablesApi.viewTableCreateSql(id, {
        database,
        tableName,
      });

      await $modal({
        component: ViewSchemaDialog,
        props: {
          title: `${this.$t("tables.Schema")} · ${key}`,
          width: 880,
          customClass: 'sql-code-mirror-modal',
          cancelText: null,
          okText: this.$t("common.Close"),
        },
        data: {
          sql: create_table_query,
          tableName: key,
        },
      });
    },
    // 备份表
    async archiveTable(key) {
      const [database, tableName] = key.split('.');
      const { id: clusterName } = this.$route.params;

      await $modal({
        component: ArchiveModal,
        props: {
          title: this.$t("tables.Archive"),
          width: 800,
          cancelText: this.$t("common.Cancel"),
          okText: this.$t("common.Confirm"),
        },
        data: {
          database,
          tables: [tableName],
          clusterName,
        },
      }).then(async (taskId) => {

        await $modal({
          component: TaskDetail,
          props: {
            title: this.$t('task.View Task'),
            width: 800,
            cancelText: this.$t("task.Close"),
            okText: this.$t("common.Close"),
            cancelText: null
          },
          data: {
            taskId: taskId,
            refresh: true
          },
        })
      });
    },
    timeFilterChange() {
      this.fetchData(true);
    },
    timeFilterRefresh() {
      this.fetchData(true);
    },
    // 查看分区数
    viewPartitions(row) {
      const { tableName } = row;
      const clusterName = this.$route.params.id;
      $modal({
        component: TablePartitionsComponent,
        props: {
          title: this.$t("tables.Partition Management"),
          width: 800,
          cancelText: null,
          okText: null,
        },
        data: {
          clusterName,
          tableName,
        },
      }).finally(() => {
        this.fetchData(true);
      });
    },
  },
};
</script>

<style lang="scss">
.table-metric {
  padding: var(--s-3) 0 var(--s-6);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-3);
    margin-bottom: var(--s-3);
    flex-wrap: wrap;
  }

  &__title-group {
    display: flex;
    align-items: center;
    gap: var(--s-3);
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: var(--s-2);
  }

  &__search {
    width: 240px;
  }
}

.sql-code-mirror-modal .el-dialog__body {
  padding: 0 5px 8px 5px !important;

  .CodeMirror {
    height: 400px;
  }
}

.metric-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--s-4);
  margin-right: var(--s-4);
  border-bottom: 1px solid transparent;

  &__item {
    appearance: none;
    background: none;
    border: 0;
    cursor: pointer;
    padding: var(--s-2) var(--s-1);
    font-size: var(--fs-md);
    color: var(--c-text-secondary);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color var(--du-fast) var(--ease-out),
                border-color var(--du-fast) var(--ease-out);

    &:hover {
      color: var(--c-text-primary);
    }

    &--active {
      color: var(--c-text-primary);
      font-weight: var(--fw-semibold);
      border-bottom-color: var(--c-primary-solid);
    }
  }
}
</style>
