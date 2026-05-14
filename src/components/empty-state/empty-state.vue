<template>
  <div class="empty-state" :class="{ 'empty-state--compact': compact }">
    <div class="empty-state__icon">
      <i :class="iconClass"></i>
    </div>
    <p class="empty-state__title">{{ title }}</p>
    <p class="empty-state__desc" v-if="description">{{ description }}</p>
    <div class="empty-state__action" v-if="$slots.default">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    iconClass: { type: String, default: 'el-icon-document' },
    compact: { type: Boolean, default: false },
  },
};
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--s-12) var(--s-6);
  text-align: center;
  color: var(--c-text-secondary);

  &--compact {
    padding: var(--s-6) var(--s-4);
  }

  &__icon {
    font-size: 48px;
    color: var(--c-text-tertiary);
    margin-bottom: var(--s-3);

    .empty-state--compact & {
      font-size: 32px;
      margin-bottom: var(--s-2);
    }
  }

  &__title {
    font-size: var(--fs-md);
    font-weight: var(--fw-medium);
    color: var(--c-text-primary);
    margin: 0 0 var(--s-1);
  }

  &__desc {
    font-size: var(--fs-sm);
    color: var(--c-text-tertiary);
    margin: 0 0 var(--s-4);
    max-width: 360px;
  }

  &__action {
    margin-top: var(--s-2);
  }
}
</style>
