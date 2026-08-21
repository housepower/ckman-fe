<template>
  <main class="session-page">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console'), $route.params.id, $t('home.Session')]"
      :title="$t(tabs[active].label)"
    />
    <div class="session-page__body">
      <OpenSessions v-show="active === 0" />
      <DdlQueue v-show="active === 1" />
      <SlowSessions v-show="active === 2" />
    </div>
  </main>
</template>

<script>
import { ClusterTabs, tabIndexOf } from '@/constants';

import OpenSessions from './component/openSessions.vue';
import DdlQueue from './component/ddlQueue.vue';
import SlowSessions from './component/slowSessions.vue';

export default {
  name: 'Session',
  components: { OpenSessions, DdlQueue, SlowSessions },
  data() {
    return {
      tabs: ClusterTabs.session,
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
.session-page {
  padding-bottom: var(--s-8);

  &__body {
    margin-top: var(--s-3);
  }
}
</style>
