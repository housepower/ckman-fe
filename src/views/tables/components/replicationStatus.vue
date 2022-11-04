<template>
  <div class="replication-status pb-20">
    <div class="title flex flex-between flex-vcenter ptb-10 pull-left">
      <span class="fs-20 font-bold">{{$t('tables.Table Replication Status')}}</span>
    </div>

    <vxe-toolbar zoom custom class="pull-right">
      <template #buttons>
        <el-input size="medium" :placeholder="$t('common.keyword search')" v-model="searchKey" class="width-250 mr-10" suffix-icon="el-icon-search"></el-input>
        <el-button size="mini" @click="fetchData(true)" circle icon="el-icon-refresh" class="fs-16 fc-black" style="border-color: #dcdfe6;"></el-button>
      </template>
    </vxe-toolbar>

    <vxe-table
      style="clear: both;"
      ref="xTable"
      v-bind="gridOptions"
      v-loading="loading"
      :columns="cols"
      :data="currentPageData"
      @sort-change="sortChangeEvent"
    >
      <div
        :is="col.prop ? 'vxe-column' : 'vxe-colgroup'"
        v-for="(col, index) of cols"
        :key="index"
        :sortable="!!col.prop"
        :field="col.prop"
        :title="col.label"
        align="center"
        :min-width="col.minWidth || 140">
        <vxe-column
          v-for="(subItem, subItemIndex) in col.children"
          :title="subItem.label"
          :field="subItem.prop"
          width="auto"
          align="center"
          sortable
          :sortConfig="{ trigger: 'cell' }"
          :key="subItemIndex">
          <template slot-scope="{ row, column }">
            <div :class="getClassName(row, column.property)">{{ row[column.property] }}</div>
          </template>
        </vxe-column>
      </div>
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
import { uniqWith, isEqual, cloneDeep } from "lodash-es";
import { TablesApi } from "@/apis";
import store from '@/store';
export default {
  data() {
    return {
      clusterName: '',
      timeFilter: null,
      refresh: null,
      currentPage: 1,
      pageSize: 10,
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
        border: true,
        resizable: true,
        showHeaderOverflow: true,
        showOverflow: true,
        highlightHoverRow: true,
        height: 576,
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
    'queryList.length'(len) {
      this.pagination.currentPage = 1;
      this.pagination.total = len;
    }
  },
  computed: {
    queryList() {
      const { searchKey, tableData, sort: { property, order } } = this;
      const result = tableData?.filter(row => {
        return row.name.includes(searchKey)
          || row.shard1_0.includes(searchKey)
          || row.shard1_1.includes(searchKey)
          || row.shard2_0.includes(searchKey)
          || row.shard2_1.includes(searchKey);
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
      });
      return result || [];
    },
    cols() {
      const cols = [{ prop: "name", label: this.$t('tables.Table Name'), children: [] }];
      const { headerData } = this;
      headerData?.forEach((item, index) => {
        const shard = `shard${index + 1}`;
        const col = {
          label: shard,
          children: (item||[]).map((v, index) => {
            return {
              prop: `${shard}_${index}`,
              label: v,
            };
          })
        };
        cols.push(col);
      });
      return cols;
    },
    currentPageData() {
      const { pagination: { currentPage, pageSize }, queryList } = this;
      return this.queryList.slice((currentPage - 1)*pageSize, currentPage*pageSize);
    },
    replicationStatusEntity() {
      const { clusterName } = this;
      return store.getters['clusterTable/getReplicationStatusByClusterName'](clusterName);
    },
    tableData() {
      return this.replicationStatusEntity?.tableData;
    },
    headerData() {
      return this.replicationStatusEntity?.header || [];
    }
  },
  created() {
    const { id: clusterName } = this.$route.params;
    this.clusterName = clusterName;
  },
  mounted() {
    this.fetchData();
  },
  methods: {
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
    async fetchData(forceRefresh = false) {
      if (!this.tableData || forceRefresh) {
        const { clusterName } = this;
        this.loading = true;
        const {
          data: {
            entity: { header = [], tables = [] },
          },
        } = await TablesApi.replicationStatus(clusterName)
          .finally(() => this.loading = false);

        let tableData = [];
        (tables || []).forEach(({ name, values }) => {
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
        tableData = uniqWith(tableData, isEqual);
        store.commit('clusterTable/setReplicationStatus', {
          clusterName,
          tableData,
          header,
        });
      }
    },

    getClassName(row, property) {
      const [ name, order ] = property?.split('_') || ['', ''];
      const value = row[property];
      let nextOrder = order === '0' ? '1' : '0';
      const nextValue = row[name + '_' + nextOrder];
      if (!nextValue) return;
      if (value.indexOf('F') == '-1') {
        return;
      }

      const num = parseInt(value.match(/F\[(\d+)\]/)[1], 10);
      if (!nextValue) return;
      const nextNum = parseInt(nextValue.match(/[M]L\[(\d+)\]/)[1], 10);
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
