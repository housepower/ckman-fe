<template>
  <div
    class="skeleton"
    :class="[`skeleton--${variant}`]"
    :style="{ '--skeleton-cols': columns }"
    :aria-busy="true"
  >
    <template v-if="variant === 'line'">
      <div
        v-for="i in rows"
        :key="i"
        class="skeleton__line"
        :style="lineStyle(i)"
      ></div>
    </template>

    <template v-else-if="variant === 'block'">
      <div class="skeleton__block" :style="{ height: blockHeight }"></div>
    </template>

    <template v-else-if="variant === 'table'">
      <div class="skeleton__table">
        <div class="skeleton__row skeleton__row--head">
          <div
            v-for="c in columns"
            :key="`h-${c}`"
            class="skeleton__cell"
          ></div>
        </div>
        <div
          v-for="r in rows"
          :key="`r-${r}`"
          class="skeleton__row"
        >
          <div
            v-for="c in columns"
            :key="`c-${r}-${c}`"
            class="skeleton__cell"
          ></div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'Skeleton',
  props: {
    variant: {
      type: String,
      default: 'line',
      validator: (v) => ['line', 'block', 'table'].includes(v),
    },
    rows: { type: Number, default: 4 },
    columns: { type: Number, default: 4 },
    blockHeight: { type: String, default: '160px' },
  },
  methods: {
    lineStyle(index) {
      const widths = ['100%', '92%', '78%', '85%', '64%', '88%'];
      return { width: widths[(index - 1) % widths.length] };
    },
  },
};
</script>

<style lang="scss" scoped>
.skeleton {
  width: 100%;

  &__line,
  &__block,
  &__cell {
    background: linear-gradient(
      90deg,
      var(--c-surface-2) 0%,
      var(--c-surface-1) 50%,
      var(--c-surface-2) 100%
    );
    background-size: 200% 100%;
    border-radius: var(--r-sm);
    animation: skeleton-shimmer 1.4s ease-in-out infinite;
  }

  &__line {
    height: 12px;
    margin-bottom: var(--s-2);

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__block {
    width: 100%;
  }

  &__table {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
  }

  &__row {
    display: grid;
    grid-template-columns: repeat(var(--skeleton-cols, 4), minmax(0, 1fr));
    gap: var(--s-2);

    &--head .skeleton__cell {
      height: 14px;
      opacity: 0.7;
    }
  }

  &__cell {
    height: 16px;
  }
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
