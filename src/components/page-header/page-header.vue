<template>
  <header class="page-header">
    <div class="page-header__main">
      <nav class="page-header__crumb" v-if="crumb && crumb.length">
        <span
          v-for="(item, i) in crumb"
          :key="i"
          class="crumb-item"
          :class="{ 'crumb-item--last': i === crumb.length - 1 }"
        >
          {{ item }}<span v-if="i < crumb.length - 1" class="sep">›</span>
        </span>
      </nav>
      <h1 class="page-header__title">{{ title }}</h1>
      <p class="page-header__subtitle" v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div class="page-header__actions" v-if="$slots.actions">
      <slot name="actions"></slot>
    </div>
  </header>
</template>

<script>
export default {
  name: 'PageHeader',
  props: {
    crumb: { type: Array, default: () => [] },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
  },
};
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-5) 0 var(--s-4);

  &__crumb {
    font-size: var(--fs-xs);
    color: var(--c-text-tertiary);
    margin-bottom: var(--s-1);

    .crumb-item {
      &.crumb-item--last {
        color: var(--c-text-secondary);
        font-weight: var(--fw-medium);
      }
    }
    .sep {
      margin: 0 var(--s-1);
      color: var(--c-text-tertiary);
    }
  }

  &__title {
    font-size: var(--fs-2xl);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    line-height: var(--lh-tight);
    margin: 0;
  }

  &__subtitle {
    font-size: var(--fs-base);
    color: var(--c-text-secondary);
    margin: var(--s-1) 0 0;
  }

  &__actions {
    display: flex;
    gap: var(--s-2);
    align-items: center;
  }
}
</style>
