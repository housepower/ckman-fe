<template>
  <div class="table-merges pb-20">
    <div class="title flex flex-between flex-vcenter ptb-10 pull-left">
      <span class="fs-20 font-bold mr-10">{{$t('tables.Table Replication Status')}}</span>
      <time-filter v-model="timeFilter"
          ref="timeFilter"
          localKey="tableMetricsTimeFilter"
          :refreshDuration.sync="refresh"
          @input="timeFilterChange"
          @on-refresh="timeFilterRefresh" />
    </div>
    <vxe-toolbar zoom custom class="pull-right">
      <template #buttons>
        <el-input size="medium" :placeholder="$t('common.keyword search')" v-model="searchKey" class="width-250 mr-10" suffix-icon="el-icon-search"></el-input>
        <el-button size="mini" @click="fetchData()" circle icon="el-icon-refresh" class="fs-16 fc-black" style="border-color: #dcdfe6;"></el-button>
      </template>
    </vxe-toolbar>

    <vxe-table
      style="clear: both;"
      ref="xTable"
      v-bind="gridOptions"
      :columns="columns"
      :data="currentPageData"
      @sort-change="sortChangeEvent"
    >
      <vxe-column
        v-for="{ prop, label, minWidth, fixed, filters } of columns"
        :key="prop"
        :fixed="fixed"
        sortable
        :field="prop"
        :title="label"
        :filters="filters || null"
        :min-width="minWidth || 140">
        
        <template slot-scope="{ row, column }">
          <span v-if="column.property === 'progress'" :class="getProgressClass(row[column.property])">{{ formatProgress(row[column.property]) }}</span>
          <span v-else-if="['queue_size', 'merges', 'inserts', 'log_pointer'].includes(column.property)">
            {{ percentiles(row[column.property]) }}
            <el-button 
              v-if="column.property === 'queue_size' && row[column.property] > 0"
              class="ml-4" 
              type="text"
              @click="handleViewQueue(row)">
              {{$t('tables.View')}}
            </el-button>
          </span>
          <span v-else>{{ row[column.property] }}</span>
        </template>
      </vxe-column>
    </vxe-table>

    <vxe-pager
      :current-page="pagination.currentPage"
      :page-size.sync="pagination.pageSize"
      :page-sizes="pagination.pageSizes"
      :total="pagination.total"
      :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']"
      @page-change="handlePageChange">
    </vxe-pager>
  </div>

</template>
<script>

import { $modal } from "@/services";
import { TablesApi } from "@/apis";
import { byteConvert } from '@/helpers/';
import { percentiles } from '@/helpers/';
import ReplicatedQueueComponent from "./replicatedQueue.vue";

export default {
  data() {
    return {
      clusterName: '',
      timeFilter: null,
      refresh: null,
      loading: false,
      searchKey: '',
      sort: {},
      tableData:[],
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
        toolbarConfig: {
          zoom: true,
          custom: true
        },
        sortConfig: {
          trigger: 'cell',
        },
        filterConfig: {
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
      let columns = [
        {
          prop: "table",
          label: this.$t('tables.Table Name'),
          minWidth: 300,
          fixed: 'left',
          sortable: true
        },
        {
          prop: "node",
          label: this.$t('session.Node Host'),
          width: 100,
          sortable: true
        },
        {
          prop: "shard_replica",
          label: this.$t('tables.Shard Replica'),
          width: 80,
          sortable: true
        },
        {
          prop: "queue_size",
          label: this.$t('tables.QueueSize'),
          width: 120,
          sortable: true
        },
        {
          prop: "inserts",
          label: this.$t('tables.Inserts In Queue'),
          width: 120,
          sortable: true
        },
        {
          prop: "merges",
          label: this.$t('tables.Merges In Queue'),
          minWidth: 120,
          sortable: true
        },
        {
          prop: "log_pointer",
          label: this.$t('tables.Log Pointer'),
          minWidth: 120,
          sortable: true
        },
        {
          prop: "progress",
          label: this.$t('tables.Progress'),
          minWidth: 80,
          sortable: true
        },
      ];
      return columns
    },
    listData() {
      const { searchKey, sort: { property, order } } = this;
      const result = this.tableData
        ?.filter(x => {
          let flag = true;
          if (!x.table?.includes(searchKey)) {
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
            if(prev[property].length === next[property].length){
              flag = prev[property].localeCompare(next[property]);
            } else{
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
      return this.listData?.slice((currentPage - 1)*pageSize, currentPage*pageSize);
    },
  },
  created() {
    const { id: clusterName } = this.$route.params;
    this.clusterName = clusterName;
    this.fetchData();
  },
  methods: {
    byteConvert: byteConvert,
    percentiles: percentiles,
    handleViewQueue(row){
      console.log("row", row)
      const { clusterName } = this;
      const { table, node, last_exception } = row;
      console.log("lastException", last_exception)
      $modal({
        component: ReplicatedQueueComponent,
        props: {
          title: this.$t("tables.Replicated Queue"),
          width: 800,
          cancelText: null,
          okText: null,
        },
        data: {
          clusterName, 
          table, 
          node,
          last_exception,
        },
      });
    },
    formatProgress(value) {
      let valueStr = value.toString();
      let decimalIndex = valueStr.indexOf('.');
      if (decimalIndex !== -1) {
       valueStr = valueStr.substring(0, decimalIndex + 3);
      }
      return valueStr + '%';
    },
    getProgressClass(value) {
      if (value < 60) {
        return 'progress-red';
      } else if (value >= 60 && value < 90) {
        return 'progress-yellow';
      } else {
        return 'progress-green';
      }
    },
    async fetchData() {
      this.loading = true;
      const { clusterName } = this;
      const {
        data: { entity },
      } = await TablesApi.replicationStatus(clusterName).finally(() => this.loading = false);
      
      this.tableData = Object.freeze(entity);
      if (!$.isEmptyObject(this.tableData)) {
        this.pagination.total = this.tableData.length;
      }
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

    timeFilterChange() {
      this.fetchData();
    },
    timeFilterRefresh() {
      this.fetchData();
    },
  },
};
</script>

<style lang="scss">
.table-metric {
  border-bottom: 1px solid var(--color-gray);
}

.sql-code-mirror-modal .el-dialog__body {
  padding: 0 5px 8px 5px !important;

  .CodeMirror {
    height: 400px;
  }
}


.progress-red {
  color: red;
}

.progress-yellow {
  color: #d4b433;
}

.progress-green {
  color: green;
}
</style>
