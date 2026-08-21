<template>
  <main class="tables-page">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console'), $route.params.id, $t('home.Tables')]"
      :title="$t(tabs[active].label)"
    />
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
import { ClusterTabs, tabIndexOf } from "@/constants";

import ZkTable from "./components/zkTable";
import ReplicationTable from "./components/replicationStatus";
import TableMerges from "./components/tableMerges";
import TableMetric from "./components/tableMetrics";
import BackgroundPool from "./components/backgroundPool";

export default {
  name: 'Tables',
  data() {
    return {
      tabs: ClusterTabs.tables,
    };
  },
  computed: {
    // 二级导航在侧边栏，选中项由 URL 的 ?tab= 决定
    active() {
      return tabIndexOf(this.tabs, this.$route.query.tab);
    },
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

.tables-body {
  margin-top: var(--s-3);
}
</style>
