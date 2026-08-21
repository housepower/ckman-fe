<template>
  <main class="data-manage">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console'), $route.params.id, $t('home.data-manage')]"
      :title="$t(tabs[active].label)"
    />
    <div class="data-manage__body">
      <HistoryComponent v-show="active === 0" />
      <RebalanceComponent v-show="active === 1" />
    </div>
  </main>
</template>

<script>
import { ClusterTabs, tabIndexOf } from '@/constants';

import HistoryComponent from './component/history.vue';
import RebalanceComponent from './component/rebalance.vue';

export default {
  name: 'DataManage',
  components: { HistoryComponent, RebalanceComponent },
  data() {
    return {
      tabs: ClusterTabs['data-manage'],
    };
  },
  computed: {
    // 二级导航在侧边栏，选中项由 URL 的 ?tab= 决定
    active() {
      return tabIndexOf(this.tabs, this.$route.query.tab);
    },
  },
};
</script>

<style lang="scss" scoped>
.data-manage {
  padding-bottom: var(--s-8);

  &__body {
    margin-top: var(--s-3);
  }
}
</style>
