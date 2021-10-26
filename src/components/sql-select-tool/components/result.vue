<template>
  <div class="height-full flex flex-column">
    <el-table
      class="flex-2"
      v-loading="loading"
      border
      size="mini"
      :empty-text="$t('queryExecution.No Data')"
      :data="datas"
      height="100%">
      <el-table-column
        v-for="(column, index) in columns"
        :prop="column.prop"
        :label="column.label"
        :min-width="180"
        :key="index">
         <template slot-scope="scope">
          <span class="text-ellipsis">{{scope.row[column.prop]}}</span>
        </template>
      </el-table-column>
    </el-table>
    <div class="text-center">
      <el-pagination
        size="mini"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page.sync="pagination.currentPage"
        :page-sizes="[100, 200, 300, 400]"
        :page-size="pagination.pageSize"
        layout="prev, pager, next"
        :total="pagination.total">
      </el-pagination>
    </div>
  </div>
</template>
<script>
import store from '@/store';
export default {
  data() {
    return {
      loading: false,
    }
  },
  computed: {
    columns() {
      return store.getters['sqlSelect/getResultColumn'];
    },
    datas() {
      return store.getters['sqlSelect/getResultData'];
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
    }
  }
}
</script>
