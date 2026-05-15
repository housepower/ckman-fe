<template>
  <header class="page-header" v-if="items.length || $slots.actions">
    <nav class="page-header__crumb" v-if="items.length">
      <router-link
        v-if="showHome"
        to="/"
        class="page-header__home"
        :title="items[0]"
      >
        <i class="fa fa-home"></i>
      </router-link>
      <template v-for="(item, i) in rest">
        <span
          v-if="showHome || i > 0"
          :key="`s${i}`"
          class="sep"
        >›</span>
        <span
          :key="`t${i}`"
          class="crumb-item"
          :class="{ 'crumb-item--last': i === rest.length - 1 }"
        >{{ item }}</span>
      </template>
    </nav>
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
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
  },
  computed: {
    items() {
      const list = Array.isArray(this.crumb) ? this.crumb.filter(Boolean) : [];
      if (this.title) list.push(this.title);
      return list;
    },
    rest() {
      if (this.showHome) return this.items.slice(1);
      return this.items.length > 1 ? this.items.slice(1) : this.items;
    },
    showHome() {
      if (this.items.length <= 1) return false;
      const r = this.$route;
      if (!r) return true;
      return r.name !== 'Home' && r.path !== '/' && r.path !== '/home';
    },
  },
};
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-3) 0;
  margin-bottom: var(--s-2);

  &__crumb {
    display: flex;
    align-items: center;
    font-size: var(--fs-md);
    color: var(--c-text-tertiary);
    line-height: var(--lh-tight);
    min-width: 0;
  }

  &__home {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--c-text-tertiary);
    text-decoration: none;
    font-size: var(--fs-lg);
    transition: color var(--du-fast) var(--ease-out);

    &:hover {
      color: var(--c-primary-fg);
    }
  }

  .crumb-item {
    &--last {
      color: var(--c-text-primary);
      font-weight: var(--fw-semibold);
    }
  }

  .sep {
    margin: 0 var(--s-2);
    color: var(--c-surface-3);
  }

  &__actions {
    display: flex;
    gap: var(--s-2);
    align-items: center;
    flex-shrink: 0;
  }
}
</style>
