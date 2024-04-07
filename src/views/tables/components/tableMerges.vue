<template>
    <div class="table-merges pb-20">
      <div class="title flex flex-between flex-vcenter ptb-10 pull-left">
        <span class="fs-20 font-bold mr-10">{{$t('tables.Table Merges')}}</span>
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
            <span v-if="column.property.endsWith('compressed')">{{ byteConvert(row[column.property]) }}</span>
            <span v-else-if="column.property === 'rows' || column.property === 'elapsed'">{{ percentiles(row[column.property]) }}</span>
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
  import { TablesApi } from "@/apis";
  import { byteConvert } from '@/helpers/';
  import { percentiles } from '@/helpers/';
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
          rowId: 'tableName',
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
            minWidth: 150,
            fixed: 'left',
            sortable: true
          },
          {
            prop: "host",
            label: this.$t('session.Node Host'),
            width: 100,
            sortable: true
          },
          {
            prop: "elapsed",
            label: this.$t('tables.Elapsed'),
            width: 100,
            sortable: true
          },
          {
            prop: "merge_start",
            label: this.$t('tables.MergeStart'),
            width: 140,
            sortable: true
          },
          {
            prop: "progress",
            label: this.$t('tables.Progress'),
            width: 100,
            sortable: true
          },
          {
            prop: "memory_usage",
            label: this.$t('tables.MemUsage'),
            minWidth: 100,
            sortable: true
          },
          {
            prop: "num_parts",
            label: this.$t('tables.NumParts'),
            minWidth: 100,
            sortable: true
          },
          {
            prop: "rows",
            label: this.$t('tables.Rows'),
            minWidth: 100,
            sortable: true
          },
          {
            prop: "compressed",
            label: this.$t('tables.Compressed'),
            minWidth: 150,
            sortable: true
          },
          {
            prop: "uncompressed",
            label: this.$t('tables.UnCompressed'),
            minWidth: 150,
            sortable: true
          },
          {
            prop: "result_part_name",
            label: this.$t('tables.ResultPartName'),
            minWidth: 120,
            sortable: true
          },
          {
            prop: "source_part_names",
            label: this.$t('tables.SourcePartNames'),
            minWidth: 200,
          },
          {
            prop: "merge_algorithm",
            label: this.$t('tables.Algorithm'),
            minWidth: 100,
            sortable: true
          },
        ];
        return columns
      },
      listData() {
        console.log("listData", this.tableData)
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
        console.log("result", result)
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
      async fetchData() {
        this.loading = true;
        const { clusterName } = this;
        const {
          data: { entity },
        } = await TablesApi.tableMerges(clusterName).finally(() => this.loading = false);
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
  </style>
  