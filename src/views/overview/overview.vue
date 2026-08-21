<template>
  <div class="overview-page">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console'), clusterName, $t('home.Overview')]"
      :title="$t(activeTab.label)"
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
import { ClusterTabs, Metrics, tabIndexOf } from "@/constants";

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
    // 指标分组的切换入口在侧边栏二级菜单，这里只用来显示当前分组名
    activeTab() {
      const tabs = ClusterTabs.overview;
      return tabs[tabIndexOf(tabs, this.$route.query.tab)];
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
