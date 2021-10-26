<template>
  <div class="replication-status pb-20">
    <div class="title flex flex-between flex-vcenter ptb-10">
      <span class="fs-20 font-bold">{{$t('tables.Table Replication Status')}}</span>
      <el-input size="medium" :placeholder="$t('common.keyword search')" v-model="searchKey" class="width-250"></el-input>
    </div>
    <el-table class="tb-edit"
      v-loading="loading"
      :data="queryList.slice((currentPage - 1)*pageSize, currentPage*pageSize)"
      border
      style="width: 100%">
      <el-table-column v-for="(col, index) in cols"
        :key="index"
        :label="col.label"
        :prop="col.prop || null"
        ref="tableColumn"
        width="auto"
        :sortable="!!col.prop"
        align="center">
        <el-table-column
          v-for="(subItem, subItemIndex) in col.children"
          :label="subItem.label"
          :prop="subItem.prop"
          width="auto"
          align="center"
          sortable
          :key="subItemIndex">
          <template slot-scope="{ row, column }">
            <div :class="getClassName(row, column.property)">{{ row[column.property] }}</div>
          </template>
        </el-table-column>
      </el-table-column>
    </el-table>
    <!-- 前端分页 -->
    <div class="text-center">
      <el-pagination v-if="queryList.length > 0"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[5, 10, 20, 40]"
        :page-size="pageSize"
        layout="sizes, prev, pager, next, jumper"
        :total="queryList.length">
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
      loading: false,
      searchKey: '',
    };
  },
  computed: {
    queryList() {
      const { searchKey, tableData } = this;
      this.currentPage = 1;
      return tableData.filter(row => {
        return row.name.includes(searchKey)
          || row.shard1_0.includes(searchKey)
          || row.shard1_1.includes(searchKey)
          || row.shard2_0.includes(searchKey)
          || row.shard2_1.includes(searchKey);
      });
    }
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      const {
        data: {
          entity: { header = [], tables = [] },
        },
      } = await TablesApi.replicationStatus(this.$route.params.id)
        .finally(() => this.loading = false);
      const cols = [{ prop: "name", label: this.$t('tables.Table Name'), children: [] }];
      this.headerData = cloneDeep(header);
      this.tableData = [];
      header.forEach((item, index) => {
        const shard = `shard${index + 1}`;
        const col = {
          label: shard,
          children: item.map((v, index) => {
            return {
              prop: `${shard}_${index}`,
              label: v,
            };
          })
        };
        cols.push(col);
      });
      this.cols = cols;
      const tableData = [];
      tables.forEach(({ name, values }) => {
        let tableItem = {
          name
        };
        values.forEach((val, index) => {
          const shard = `shard${index + 1}`;
          val.forEach((v, index) => {
            tableItem[`${shard}_${index}`] = v;
          });
        });
        tableData.push(tableItem);
      });
      this.tableData = uniqWith(tableData, isEqual);
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
    getClassName(row, property) {
      const [ name, order ] = property.split('_');
      const value = row[property];
      let nextOrder = order === '0' ? '1' : '0';
      const nextValue = row[name + '_' + nextOrder];
      if (!nextValue) return;
      if (name.indexOf('F') === '-1') {
        return;
      }
      const num = parseInt(value.replace('F', ''), 10);
      if (!nextValue) return;
      const nextNum = parseInt(nextValue.replace('L', ''), 10);
      if (num < nextNum) {
        return 'yellow'
      }
    }
  },
};
</script>

<style lang="scss" scoped>
.replication-status {
  border-bottom: 1px solid var(--color-gray);
}

.yellow {
  color: #fff;
  background: #d4b433;
}
</style>
