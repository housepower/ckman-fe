<template>
  <div class="table-metric pb-20">
    <div class="title flex flex-between flex-vcenter ptb-10">
      <span class="fs-20 font-bold">{{$t('tables.Table Metrics')}}</span>
      <el-input size="medium" :placeholder="$t('common.keyword search')" v-model="searchKey" class="width-250"></el-input>
    </div>
    <el-table :data="currentPageData" center border>
      <template v-for="{ prop, label } of columns">
        <el-table-column :prop="prop"
          :label="label"
          :key="prop"
          :sortable="filters[prop].sortable"
          show-overflow-tooltip>
          <template slot="header" slot-scope="scope">
            <span>{{label}}</span>
          </template>
          <template slot-scope="{ row, column }">
            <span v-if="column.property.endsWith('compressed')">{{ byteConvert(row[column.property]) }}</span>
            <span v-else>{{ row[column.property] }}</span>
          </template>
        </el-table-column>
      </template>
      <el-table-column
        fixed="right"
        :label="$t('tables.Action')"
        width="140">
        <template slot-scope="scope">
          <el-button @click="viewSql(scope.row.tableName)" type="text" size="small">{{ $t('tables.Schema') }}</el-button>
          <el-button type="text" size="small" @click="onDelete(scope.row.tableName)">{{ $t('tables.Delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 前端分页 -->
    <div class="text-center">
      <el-pagination v-if="listData.length > 0"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[5, 10, 20, 40]"
        :page-size="pageSize"
        layout="sizes, prev, pager, next, jumper"
        :total="listData.length">
      </el-pagination>
    </div>
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
      tableData: [],
      currentPage: 1,
      pageSize: 10,
      searchKey: '',
      filters: {
        tableName: {
          type: 'string',
          value: [],
          search: true,
          sortable: true,
        },
        columns: {
          type: 'number',
          value: [],
          sortable: true,
        },
        rows: {
          type: 'number',
          value: [],
          sortable: true,
        },
        partitions: {
          type: 'number',
          value: [],
          sortable: true,
        },
        parts: {
          type: 'number',
          value: [],
          sortable: true,
        },
        uncompressed: {
          type: 'number',
          value: [],
          sortable: true,
        },
        compressed: {
          type: 'number',
          value: [],
          sortable: true,
        },
        readwrite_status: {
          type: 'number',
          value: [],
          sortable: false,
        },
        completedQueries: {
          type: 'number',
          value: [],
          sortable: true,
        },
        failedQueries: {
          type: 'number',
          value: [],
          sortable: true,
        },
        queryCost: {
          type: 'number',
          value: [],
          sortable: false,
        },
      },
    };
  },
  computed: {
    columns() {
      let columns = [
        {
          prop: "tableName",
          label: this.$t('tables.Table Name'),
        },
        {
          prop: "columns",
          label: this.$t('tables.Columns'),
        },
        {
          prop: "rows",
          label: this.$t('tables.Rows'),
        },
        {
          prop: "partitions",
          label: this.$t('tables.Partitions'),
        },
        {
          prop: "parts",
          label: this.$t('tables.Parts'),
        },
        {
          prop: "uncompressed",
          label: this.$t('tables.UnCompressed'),
        },
        {
          prop: "compressed",
          label: this.$t('tables.Compressed'),
        },
        {
          prop: "readwrite_status",
          label: this.$t('tables.RWStatus'),
          filters: [
            {text: 'TRUE', value: 'TRUE'},
            {text: 'FALSE', value: 'FALSE'}
          ]
        },
        {
          prop: "completedQueries",
          label: this.$t('tables.Completed Queries in last 24h'),
        },
        {
          prop: "failedQueries",
          label: this.$t('tables.Failed Queries in last 24h'),
        },
        {
          prop: "queryCost",
          label: this.$t('tables.Last 7 days info'),
        },
      ];
      return columns
    },
    listData() {
      const { searchKey, filters } = this;
      this.currentPage = 1;
      return this.tableData
        .filter(x => {
          let flag = true;
          if (!x.tableName?.includes(searchKey)) {
            flag = false;
          }
          Object.entries(filters).forEach(([key, item]) => {
            if (item.filter && item.value.length > 0 && !item.value.includes(x[key])) {
              flag = false;
            }
          });
          return flag;
        })
    },
    currentPageData() {
      const { currentPage, pageSize } = this;
      return this.listData?.slice((currentPage - 1)*pageSize, currentPage*pageSize);
    }
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    byteConvert: byteConvert,
    async fetchData() {
      const {
        data: { entity },
      } = await TablesApi.tableMetrics(this.$route.params.id);
      this.tableData =  Object.entries(entity).map(([key, values]) => {
        values.readwrite_status = values.readwrite_status.toString().toUpperCase();
        values.queryCost = Object.values(values.queryCost).join(',');
        values.tableName = key;
        return values;
      });
    },
    // 前端分页
    handleSizeChange(size) {
      this.pageSize = size;
    },
    handleCurrentChange(currentPage) {
      this.currentPage = currentPage;
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
