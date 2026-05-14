<template>
  <div class="overview-page">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console'), clusterName]"
      :title="$t('home.Overview')"
    >
      <template #actions>
        <time-filter
          v-model="timeFilter"
          localKey="overviewBaseTimeFilter"
          :refreshDuration.sync="refresh"
          @on-refresh="onRefreshTick"
        />
      </template>
    </PageHeader>
    <overview-base
      :metrics="metrics"
      :time-filter="timeFilter"
      :refresh-duration="refresh"
      :refresh-tick="refreshTick"
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
      refreshTick: 0,
    };
  },
  computed: {
    clusterName() {
      return this.$route.params.id || '';
    },
  },
  methods: {
    onRefreshTick() {
      this.refreshTick++;
    },
  },
};
</script>

<style lang="scss" scoped>
.overview-page {
  padding-bottom: var(--s-8);
}
</style>
