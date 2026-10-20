<template>
  <main class="session-page">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console'), $route.params.id, $t('home.Session')]"
      :title="$t(tabs[active].label)"
    />
    <div class="session-page__body">
      <OpenSessions v-show="active === 0" ref="open" />
      <DdlQueue v-show="active === 1" ref="ddl" />
      <SlowSessions v-show="active === 2" ref="slow" />
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
  mounted() {
    // 进页面只拉当前 tab，其余 tab 切过去再拉
    this.fetchActive();
  },
  watch: {
    active() {
      this.fetchActive();
    },
  },
  methods: {
    fetchActive() {
      const child = [this.$refs.open, this.$refs.ddl, this.$refs.slow][this.active];
      // 切换 tab 是路由跳转，全局拦截器会 cancel 掉仍在 pending 的请求；
      // 若该 tab 因此没拿到数据（列表为空），切过去时补拉一次
      if (child && !child.list.length) child.fetchData();
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
