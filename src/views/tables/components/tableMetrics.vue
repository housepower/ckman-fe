<template>
  <div class="table-metric pb-20">
    <div class="title flex flex-between flex-vcenter ptb-10 pull-left">
      <span class="fs-20 font-bold mr-10">{{$t('tables.Table Metrics')}}</span>
      <time-filter v-model="timeFilter"
          ref="timeFilter"
          :refreshDuration.sync="refresh"
          @input="timeFilterChange"
          @on-refresh="timeFilterRefresh" />
    </div>
    <vxe-toolbar zoom custom class="pull-right">
      <template #buttons>
        <el-input size="medium" :placeholder="$t('common.keyword search')" v-model="searchKey" class="width-250 mr-10" suffix-icon="el-icon-search"></el-input>
        <el-button size="mini" @click="fetchData" circle icon="el-icon-refresh" class="fs-16 fc-black" style="border-color: #dcdfe6;"></el-button>
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
          <span v-else>{{ row[column.property] }}</span>
        </template>
      </vxe-column>
      <vxe-column
        fixed="right"
        align="center"
        :title="$t('tables.Action')"
        width="140">
        <template slot-scope="scope">
          <el-button @click="viewSql(scope.row.tableName)" type="text" size="small">{{ $t('tables.Schema') }}</el-button>
          <el-button type="text" size="small" @click="onDelete(scope.row.tableName)">{{ $t('tables.Delete') }}</el-button>
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
import { $modal } from "@/services";
import { SqlCodeMirror } from '@/components/';
import { byteConvert } from '@/helpers/';
export default {
  data() {
    return {
      timeFilter: null,
      refresh: '',
      loading: false,
      tableData: [],
      searchKey: '',
      sort: {},
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
          prop: "tableName",
          label: this.$t('tables.Table Name'),
          minWidth: 250,
          fixed: 'left',
          sortable: true
        },
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
            {label: 'TRUE', value: 'TRUE'},
            {label: 'FALSE', value: 'FALSE'}
          ],
          minWidth: 120,
          sortable: true
        },
        {
          prop: "completedQueries",
          label: this.$t('tables.Completed Queries in last 24h'),
          minWidth: 250,
          sortable: true
        },
        {
          prop: "failedQueries",
          label: this.$t('tables.Failed Queries in last 24h'),
          minWidth: 220,
          sortable: true
        },
        {
          prop: "queryCost",
          label: this.$t('tables.Last 7 days info'),
          minWidth: 340,
          sortable: true
        },
      ];
      return columns
    },
    listData() {
      const { searchKey, sort: { property, order } } = this;
      const result = this.tableData
        .filter(x => {
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
    }
  },
  created() {
    this.fetchData();
  },
  mounted() {
    this.$refs.timeFilter.setRefresh('5s');
  },
  methods: {
    byteConvert: byteConvert,
    async fetchData() {
      this.loading = true;
      const {
        data: { entity },
      } = await TablesApi.tableMetrics(this.$route.params.id).finally(() => this.loading = false);
      this.tableData =  Object.freeze(Object.entries(entity).map(([key, values]) => {
        values.readwrite_status = values.readwrite_status.toString().toUpperCase();
        values.queryCost = Object.values(values.queryCost).join(',');
        values.tableName = key;
        return values;
      }));
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

    // 删除
    async onDelete(key) {
      await this.$confirm(this.$t("common.Confirm Delete"), this.$t("common.tips"), {
        confirmButtonText: this.$t("common.Delete"),
        cancelButtonText: this.$t("common.Cancel"),
        text: "warning",
      });
      const [ database, tableName ] = key.split('.');
      const { id } = this.$route.params;
      await TablesApi.deleteTable(id, {
        database,
        tableName,
      });
      this.$message.success(`Table ${ key } ${ this.$t("common.Delete") }${ this.$t("common.Success") }`);
      this.fetchData();
    },

    // 查看SQL
    async viewSql(key) {
      const [ database, tableName ] = key.split('.');
      const { id } = this.$route.params;
      const { data: { entity: { create_table_query } } } = await TablesApi.viewTableCreateSql(id, {
        database,
        tableName,
      });

      await $modal({
        component: SqlCodeMirror,
        props: {
          title: this.$t("tables.Schema"),
          width: 800,
          customClass: 'sql-code-mirror-modal',
          cancelText: this.$t("common.Cancel"),
          okText: this.$t("common.Confirm"),
        },
        data: {
          sql: create_table_query,
        },
      });
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
