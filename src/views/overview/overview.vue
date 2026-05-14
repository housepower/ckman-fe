<template>
  <div class="overview-page">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console'), clusterName, $t('home.Overview')]"
      :title="clusterName"
      :subtitle="$t('home.Overview')"
    >
      <template #actions>
        <time-filter
          v-model="timeFilter"
          localKey="overviewBaseTimeFilter"
          :refreshDuration.sync="refresh"
        />
      </template>
    </PageHeader>
    <overview-base
      :metrics="metrics"
      :time-filter="timeFilter"
      :refresh-duration="refresh"
    />
  </div>
</template>

<script>
import { Metrics } from "@/constants";

export default {
  name: 'Overview',
  data() {
    return {
      metrics: Metrics,
      timeFilter: ["now-1h", "now"],
      refresh: null,
    };
  },
  computed: {
    clusterName() {
      return this.$route.params.id || '';
    },
  },
};
</script>

<style lang="scss" scoped>
.overview-page {
  padding-bottom: var(--s-8);
}
</style>
