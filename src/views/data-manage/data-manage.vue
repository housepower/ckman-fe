<template>
  <main class="data-manage">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console'), $route.params.id]"
      :title="$t('home.data-manage')"
    />
    <div class="data-manage__tabs">
      <button
        v-for="(tab, idx) in tabs"
        :key="tab.key"
        class="data-manage__tab"
        :class="{ 'data-manage__tab--active': active === idx }"
        @click="active = idx"
      >
        {{ $t(tab.label) }}
      </button>
    </div>
    <div class="data-manage__body">
      <HistoryComponent v-show="active === 0" />
      <RebalanceComponent v-show="active === 1" />
    </div>
  </main>
</template>

<script>
import HistoryComponent from './component/history.vue';
import RebalanceComponent from './component/rebalance.vue';

export default {
  name: 'DataManage',
  components: { HistoryComponent, RebalanceComponent },
  data() {
    return {
      active: 0,
      tabs: [
        { key: 'backup',    label: 'dataManage.backupManagement' },
        { key: 'rebalance', label: 'dataManage.dataBalancing' },
      ],
    };
  },
};
</script>

<style lang="scss" scoped>
.data-manage {
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
