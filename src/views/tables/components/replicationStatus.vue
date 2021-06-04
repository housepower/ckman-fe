<template>
  <div class="replication-status pb-20">
    <div class="title flex flex-between flex-vcenter ptb-10">
      <span class="fs-20 font-bold">{{$t('tables.Table Replication Status')}}</span>
    </div>
    <el-table class="tb-edit"
              :data="tableData.slice((currentPage - 1)*pageSize, currentPage*pageSize)"
              :header-cell-style="mergeTableHeader"
              border
              style="width: 100%">
      <el-table-column v-for="(col, index) in cols"
                       :key="index"
                       :label="col.label"
                       :prop="col.prop"
                       ref="tableColumn"
                       width="auto"
                       align="center">
        <template slot="header"
                  slot-scope="{ column }">
          <span>{{ column.label }}</span>
        </template>
        <template slot-scope="{ row, column }">
          <span v-if="index === 0">{{ Object.keys(row)[0] === "Table Name" ? $t('common.' + Object.keys(row)[0]) : Object.keys(row)[0] }}</span>
          <span v-else>{{ Object.values(row)[0][column.property] }}</span>
        </template>
      </el-table-column>
    </el-table>
    <!-- 前端分页 -->
    <div class="text-center">
      <el-pagination v-if="tableData.length > 0"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[5, 10, 20, 40]"
        :page-size="pageSize"
        layout="sizes, prev, pager, next, jumper"
        :total="tableData.length">
      </el-pagination>
    </div>
  </div>
</template>
<script>
import { uniqWith, isEqual, cloneDeep } from "lodash-es";
import { TablesApi } from "@/apis";
export default {
  data() {
    return {
      cols: [],
      tableData: [],
      headerData: [],
      timeFilter: null,
      refresh: null,
      currentPage: 1,
      pageSize: 10,
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      const {
        data: {
          entity: { header = [], tables = [] },
        },
      } = await TablesApi.replicationStatus(this.$route.params.id);
      this.cols = [{ prop: "", label: "" }];
      this.headerData = cloneDeep(header);
      this.tableData = [];
      let tableNameItem = {};
      header.forEach((item, index) => {
        const shard = `shard${index + 1}`;
        item.forEach((v, index) => {
          tableNameItem[`${shard}_${index}`] = v;
          this.cols.push({
            prop: `${shard}_${index}`,
            label: shard,
          });
        });
      });
      this.tableData.push({
        ["Table Name"]: tableNameItem,
      });
      tables.forEach(({ name, values }) => {
        let tableItem = {};
        values.forEach((val, index) => {
          const shard = `shard${index + 1}`;
          val.forEach((v, index) => {
            tableItem[`${shard}_${index}`] = v;
          });
        });
        this.tableData.push({
          [name]: tableItem,
        });
        this.tableData = uniqWith(this.tableData, isEqual);
      });
    },
    mergeTableHeader({ row, column, rowIndex, columnIndex }) {
      const [len] = new Set(this.headerData.map((item) => item.length));
      if (rowIndex === 0) {
        if (columnIndex != 0) {
          if (columnIndex % len === 0) {
            return {
              display: "none",
            };
          } else {
            this.$nextTick(() => {
              const trList = document.querySelector(
                ".replication-status thead>tr"
              ).children;
              trList[columnIndex] && (trList[columnIndex].colSpan = 2);
            });
          }
        }
      }
    },
    timeFilterChange() {
      this.fetchData();
    },
    timeFilterRefresh() {
      this.fetchData();
    },
    // 前端分页
    handleSizeChange(size) {
      this.pageSize = size;
    },
    handleCurrentChange(currentPage) {
      this.currentPage = currentPage;
    },
  },
};
</script>

<style lang="scss" scoped>
.replication-status {
  border-bottom: 1px solid var(--color-gray);
}
</style>
