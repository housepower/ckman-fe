<template>
  <main class="settings">
    <breadcrumb :data="['Clusters', $route.params.id, 'tables']"></breadcrumb>
    <section class="mb-20">
      <table-metric />
      <table-merges />
      <replication-table />
      <zk-table />
    </section>
  </main>
</template>
<script>
import ZkTable from "./components/zkTable";
import ReplicationTable from "./components/replicationStatus";
import TableMerges from "./components/tableMerges";
import TableMetric from "./components/tableMetrics";
export default {
  data() {
    return {};
  },
  mounted() {},
  methods: {},
  components: {
    ZkTable,
    ReplicationTable,
    TableMerges,
    TableMetric,
  },
};
</script>

<style lang="scss" scoped></style>
