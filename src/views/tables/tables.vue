<template>
  <main class="tables-page">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console'), $route.params.id]"
      :title="$t('home.Tables')"
    />
    <div class="metric-tabs">
      <button
        v-for="(tab, idx) in tabs"
        :key="tab.key"
        class="metric-tab"
        :class="{ 'metric-tab--active': active === idx }"
        @click="active = idx"
      >
        {{ $t(tab.label) }}
      </button>
    </div>
    <div class="tables-body">
      <table-metric v-show="active === 0" />
      <table-merges v-show="active === 1" />
      <replication-table v-show="active === 2" />
      <background-pool v-show="active === 3" />
      <zk-table v-show="active === 4" />
    </div>
  </main>
</template>
<script>
import ZkTable from "./components/zkTable";
import ReplicationTable from "./components/replicationStatus";
import TableMerges from "./components/tableMerges";
import TableMetric from "./components/tableMetrics";
import BackgroundPool from "./components/backgroundPool";

export default {
  name: 'Tables',
  data() {
    return {
      active: 0,
      tabs: [
        { key: 'metric',      label: 'tables.Table Metrics' },
        { key: 'merges',      label: 'tables.Table Merges' },
        { key: 'replication', label: 'tables.Table Replication Status' },
        { key: 'background',  label: 'tables.Background Pool' },
        { key: 'zookeeper',   label: 'tables.Zookeeper Status' },
      ],
    };
  },
  components: {
    ZkTable,
    ReplicationTable,
    TableMerges,
    TableMetric,
    BackgroundPool,
  },
};
</script>

<style lang="scss" scoped>
.tables-page {
  padding-bottom: var(--s-8);
}

.metric-tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  gap: var(--s-5);
  border-bottom: 1px solid var(--c-surface-3);
  background: var(--c-surface-1);
  margin: 0 calc(-1 * var(--s-5));
  padding: 0 var(--s-5);
}

.metric-tab {
  appearance: none;
  background: none;
  border: 0;
  cursor: pointer;
  padding: var(--s-2) var(--s-1);
  font-size: var(--fs-md);
  color: var(--c-text-secondary);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color var(--du-fast) var(--ease-out),
              border-color var(--du-fast) var(--ease-out);

  &:hover {
    color: var(--c-text-primary);
  }

  &--active {
    color: var(--c-text-primary);
    font-weight: var(--fw-semibold);
    border-bottom-color: var(--c-primary-solid);
  }
}

.tables-body {
  margin-top: var(--s-3);
}
</style>
