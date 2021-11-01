<template>
  <div class="height-full flex flex-column">
    <div class="flex flex-reverse flex-1">
      <vxe-toolbar zoom custom class="pull-right fs-0 vxe-toolbar-custom" size="mini"></vxe-toolbar>
      <vxe-table
        class="flex-1 vxe-table-custom"
        v-loading="loading"
        border
        size="mini"
        show-overflow
        :empty-text="$t('queryExecution.No Data')"
        :data="currentPageData"
        v-bind="gridOptions"
        @sort-change="sortChangeEvent"
        height="100%">
        <vxe-column
          v-for="(column, index) in columns"
          :field="column.prop"
          :title="column.label"
          :min-width="180"
          :key="index"
          sortable>
          <template slot-scope="{row, column}">
            <span class="text-ellipsis">{{row[column.property]}}</span>
          </template>
        </vxe-column>
      </vxe-table>
    </div>
    
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
import store from '@/store';
export default {
  data() {
    return {
      loading: false,
      sort: {},
      gridOptions: {
        border: true,
        resizable: true,
        showHeaderOverflow: true,
        showOverflow: true,
        highlightHoverRow: true,
        rowId: 'tableName',
        sortConfig: {
          trigger: 'cell',
        },
        filterConfig: {
        },
      }
    }
  },
  computed: {
    columns() {
      return store.getters['sqlSelect/getResultColumn'];
    },
    datas() {
      const data = store.getters['sqlSelect/getResultData'];
      const { property, order } = this.sort;
      return data.sort((prev, next) => {
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
    },
    currentPageData() {
      const { currentPage, pageSize } = this.pagination;
      return this.datas.slice((currentPage - 1)*pageSize, currentPage*pageSize);
    },
    pagination() {
      return store.state.sqlSelect.pagination;
    },
    status() {
      return store.state.sqlSelect.status;
    }
  },
  watch: {
    status(newStatus) {
      if (newStatus === 'loading') {
        this.loading = true;
      } else {
        this.loading = false;
      }
    }
  },
  methods: {
    handleSizeChange(val) {
      store.commit('sqlSelect/changePageSize', val);
    },
    handleCurrentChange(val) {
      store.commit('sqlSelect/changeCurrentPage', val);
    },
    handlePageChange({ currentPage }) {
      this.pagination.currentPage = currentPage;
    },
    sortChangeEvent(ctx) {
      const { property, order } = ctx;
      this.sort = {
        property,
        order
      };
    },
  }
}
</script>
<style lang="scss">
.vxe-toolbar-custom {
  background: #f2f2f2;
  height: 100% !important;
  align-items: start;
  .vxe-custom--wrapper {
    margin-left: 0;
    padding: 3px;
    margin-top: 5px;
  }
}

.vxe-table-custom.vxe-table--render-default.size--mini .vxe-body--column.col--ellipsis, .vxe-table--render-default.size--mini .vxe-footer--column.col--ellipsis, .vxe-table--render-default.size--mini .vxe-header--column.col--ellipsis, .vxe-table--render-default.vxe-editable.size--mini .vxe-body--column {
  height: 25px;
}

.vxe-table-custom {
  .vxe-table--empty-placeholder {
    height: 100% !important;
  }
}
</style>
