<template>
  <main class="session-page">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console'), $route.params.id]"
      :title="$t('home.Session')"
    />
    <div class="session-page__tabs">
      <button
        v-for="(tab, idx) in tabs"
        :key="tab.key"
        class="session-page__tab"
        :class="{ 'session-page__tab--active': active === idx }"
        @click="active = idx"
      >
        {{ $t(tab.label) }}
      </button>
    </div>
    <div class="session-page__body">
      <OpenSessions v-show="active === 0" />
      <DdlQueue v-show="active === 1" />
      <SlowSessions v-show="active === 2" />
    </div>
  </main>
</template>

<script>
import OpenSessions from './component/openSessions.vue';
import DdlQueue from './component/ddlQueue.vue';
import SlowSessions from './component/slowSessions.vue';

export default {
  name: 'Session',
  components: { OpenSessions, DdlQueue, SlowSessions },
  data() {
    return {
      active: 0,
      tabs: [
        { key: 'open',  label: 'session.Open Sessions' },
        { key: 'ddl',   label: 'session.DDL Queue' },
        { key: 'slow',  label: 'session.Slow Sessions' },
      ],
    };
  },
};
</script>

<style lang="scss" scoped>
.session-page {
  padding-bottom: var(--s-8);

  &__tabs {
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

  &__tab {
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

  &__body {
    margin-top: var(--s-3);
  }
}
</style>
