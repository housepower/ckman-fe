<template>
  <section class="zk-table">
    <div class="zk-table__head">
      <h3 class="zk-table__title">{{ $t('tables.Zookeeper Status') }}</h3>
      <el-button
        size="small"
        plain
        icon="el-icon-refresh"
        @click="fetchData"
      >{{ $t('common.Refresh') }}</el-button>
    </div>

    <div class="zk-table__board">
      <table class="zk-table__grid">
        <thead>
          <tr>
            <th class="zk-table__field-head"></th>
            <th v-for="item in columns" :key="item.field" class="zk-table__col-head">
              {{ item.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="field in fields" :key="field">
            <td class="zk-table__field-cell">{{ field }}</td>
            <td
              v-for="column in columns"
              :key="column.field + field"
              class="zk-table__cell"
              :class="{
                'zk-table__cell--warning': isAvgLatency(field, data[column.field][field]) === 1,
                'zk-table__cell--danger':  isAvgLatency(field, data[column.field][field]) === 2,
              }"
            >
              {{ data[column.field][field] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script>
import { pull } from 'lodash-es';
import { TablesApi } from '@/apis';

export default {
  data() {
    return { tableData: [] };
  },
  computed: {
    data() {
      const newData = {};
      this.tableData.forEach((item) => {
        newData[item.host] = item;
      });
      return newData;
    },
    fields() {
      if (this.tableData.length === 0) return [];
      return pull(Object.keys(this.tableData[0]), 'host');
    },
    columns() {
      return this.tableData.map(({ host }) => ({ field: host, label: host }));
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      const { data: { entity } } = await TablesApi.zkStatus(this.$route.params.id);
      this.tableData = Object.freeze(entity || []);
    },
    isAvgLatency(field, value) {
      if (field !== 'avg_latency') return 0;
      const num = Number(value);
      if (num > 30) return 2;
      if (num > 10) return 1;
      return 0;
    },
  },
};
</script>

<style lang="scss" scoped>
.zk-table {
  padding: var(--s-3) 0 var(--s-6);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-3);
    margin-bottom: var(--s-3);
  }

  &__title {
    font-size: var(--fs-md);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    margin: 0;
    line-height: var(--lh-tight);
  }

  &__board {
    background: var(--c-surface-0);
    border: 1px solid var(--c-surface-3);
    border-radius: var(--r-lg);
    overflow-x: auto;
  }

  &__grid {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
  }

  &__col-head,
  &__field-head {
    padding: var(--s-2) var(--s-3);
    font-size: var(--fs-sm);
    font-weight: var(--fw-semibold);
    color: var(--c-text-secondary);
    text-align: center;
    background: var(--c-surface-1);
    border-bottom: 1px solid var(--c-surface-3);
    white-space: nowrap;
  }

  &__field-cell {
    padding: var(--s-2) var(--s-3);
    font-size: var(--fs-sm);
    color: var(--c-text-secondary);
    background: var(--c-surface-1);
    border-bottom: 1px solid var(--c-surface-3);
    white-space: nowrap;
  }

  &__cell {
    padding: var(--s-2) var(--s-3);
    font-size: var(--fs-sm);
    color: var(--c-text-primary);
    text-align: center;
    border-bottom: 1px solid var(--c-surface-3);

    &--warning {
      background-color: var(--c-warning-bg);
      color: var(--c-warning-fg);
    }

    &--danger {
      background-color: var(--c-danger-bg);
      color: var(--c-danger-fg);
    }
  }

  &__grid tr:last-child &__cell,
  &__grid tr:last-child &__field-cell {
    border-bottom: 0;
  }
}
</style>
