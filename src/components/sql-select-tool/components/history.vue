<template>
<el-table
  style="width: 100%;"
  class="history-list"
  border
  :empty-text="$t('queryExecution.No Data')"
  size="mini"
  :data="historyList"
  height="100%">
  <el-table-column
    v-for="(column, index) in columns"
    :prop="column.prop"
    :label="column.label"
    :width="column.width"
    :key="index">
      <template slot-scope="scope">
        <span class="text-ellipsis" :title="scope.row[column.prop]" @dblclick="onClickCell(scope)">{{scope.row[column.prop]}}</span>
      </template>
  </el-table-column>
  <el-table-column
      :label="$t('common.Action')"
      width="100">
      <template slot-scope="scope">
        <el-button @click="copyItem(scope.row)" type="text" size="mini">{{$t('queryExecution.Copy')}}</el-button>
        <el-button @click="deleteItem(scope.row)" type="text" size="mini">{{$t('common.Delete')}}</el-button>
      </template>
    </el-table-column>
</el-table>
</template>
<script>
import store from '@/store';
import { $message } from '@/services';
export default {
  computed: {
    historyList() {
      return store.state.sqlSelect.history;
    },
    columns() {
      return [
        {
          prop: 'QuerySql',
          label: this.$t('queryExecution.SQL'),
        },
        {
          prop: 'CreateTime',
          label: this.$t('queryExecution.CreateTime'),
        },
      ]
    }
  },
  created() {
    const { id: clusterName } = this.$route.params;
    store.dispatch('sqlSelect/retrieveHistory', clusterName);
  },
  methods: {
    copyItem(item) {
      try {
        let input = document.createElement('textarea');
        input.value = item.sql;
        input.style.border = '0';
        input.style.padding = '0';
        input.style.margin  = '0';
        input.style.right = '999999em';
        input.style.position = 'absolute';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        $message.success(this.$t('queryExecution.Copy Success'));
        input = null;
      } catch (e) {
        //
      }
    },
    deleteItem({ CheckSum }) {
      const { id: clusterName } = this.$route.params;
      store.dispatch('sqlSelect/deleteHistory', {
        checksum: CheckSum,
        clusterName
      });
    },
    onClickCell(scope) {
      const { row, column } = scope;
      if (column.property === 'QuerySql') {
        this.$emit('addSql', row.QuerySql);
      }
    }
  }
}
</script>
<style lang="scss">
.el-table--mini th, .el-table--mini td {
  padding: 0;
}
</style>
