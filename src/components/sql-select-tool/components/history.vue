<template>
  <el-table
    class="sql-history"
    :data="historyList"
    :empty-text="$t('queryExecution.No Data')"
    height="100%"
    size="small"
    :border="false"
  >
    <el-table-column
      v-for="(column, index) in columns"
      :key="index"
      :prop="column.prop"
      :label="column.label"
      :width="column.width"
      show-overflow-tooltip
    >
      <template slot-scope="scope">
        <span
          class="sql-history__cell"
          :class="{ 'sql-history__cell--sql': column.prop === 'QuerySql' }"
          :title="scope.row[column.prop]"
          @dblclick="onClickCell(scope)"
        >{{ scope.row[column.prop] }}</span>
      </template>
    </el-table-column>
    <el-table-column :label="$t('common.Action')" width="140">
      <template slot-scope="scope">
        <el-button type="text" size="small" @click="copyItem(scope.row)">
          {{ $t('queryExecution.Copy') }}
        </el-button>
        <el-button type="text" size="small" @click="deleteItem(scope.row)">
          {{ $t('common.Delete') }}
        </el-button>
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
        { prop: 'QuerySql',   label: this.$t('queryExecution.SQL') },
        { prop: 'CreateTime', label: this.$t('queryExecution.CreateTime'), width: 180 },
      ];
    },
  },
  created() {
    const { id: clusterName } = this.$route.params;
    store.dispatch('sqlSelect/retrieveHistory', clusterName);
  },
  methods: {
    copyItem(item) {
      const input = document.createElement('textarea');
      input.value = item.QuerySql;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        $message.success(this.$t('queryExecution.Copy Success'));
      } finally {
        document.body.removeChild(input);
      }
    },
    deleteItem({ CheckSum }) {
      const { id: clusterName } = this.$route.params;
      store.dispatch('sqlSelect/deleteHistory', { checksum: CheckSum, clusterName });
    },
    onClickCell({ row, column }) {
      if (column.property === 'QuerySql') {
        this.$emit('addSql', row.QuerySql);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.sql-history {
  width: 100%;

  &__cell {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--sql {
      font-family: var(--f-mono);
      font-size: var(--fs-sm);
      cursor: pointer;
    }
  }
}
</style>
