<template>
  <section class="breadcrum">
    <el-breadcrumb separator="›">
      <el-breadcrumb-item>
        <router-link to="/"><i class="fa fa-home"></i></router-link>
      </el-breadcrumb-item>
      <el-breadcrumb-item
        v-for="(item, index) of data"
        :key="index"
        :class="{ active: index === data.length - 1 }"
      >
        {{ index !== 1 ? $t('common.' + item) : item }}
      </el-breadcrumb-item>
    </el-breadcrumb>
    <div class="slot">
      <slot></slot>
    </div>
  </section>
</template>

<script>
export default {
  name: 'Breadcrumb',
  props: {
    data: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style lang="scss" scoped>
.breadcrum {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 var(--s-3);
  margin-bottom: var(--s-2);
  background: var(--c-surface-0);
  border: 1px solid var(--c-surface-3);
  border-radius: var(--r-md);

  ::v-deep .el-breadcrumb__inner {
    font-size: var(--fs-sm);
    color: var(--c-text-secondary);
  }

  ::v-deep .el-breadcrumb__separator {
    color: var(--c-text-tertiary);
    margin: 0 var(--s-2);
  }

  .active {
    ::v-deep .el-breadcrumb__inner {
      color: var(--c-text-primary);
      font-weight: var(--fw-semibold);
    }
  }
}
</style>
