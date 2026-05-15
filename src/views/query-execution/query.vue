<template>
  <main class="query-page">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console'), $route.params.id]"
      :title="$t('home.Query Execution')"
    />
    <div class="query-page__body">
      <SqlSelectTool />
    </div>
  </main>
</template>

<script>
import SqlSelectTool from '@/components/sql-select-tool/index.vue';

export default {
  name: 'QueryExecution',
  components: { SqlSelectTool },
};
</script>

<style lang="scss" scoped>
.query-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: var(--s-4);

  &__body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}
</style>
