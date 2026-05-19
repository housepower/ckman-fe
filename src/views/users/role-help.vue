<template>
  <el-tooltip effect="dark" placement="top">
    <div slot="content" class="role-help-tip">
      <p class="role-help-tip__title">{{ $t('user.RoleHelp.Title') }}</p>
      <p v-for="key in roles" :key="key" class="role-help-tip__line">
        <strong>{{ $t('user.Policy.' + key) }}</strong> — {{ $t('user.RoleHelp.' + key) }}
      </p>
    </div>
    <i class="fa fa-question-circle role-help__trigger" />
  </el-tooltip>
</template>

<script>
export default {
  name: 'RoleHelp',
  data() {
    return { roles: ['admin', 'ordinary', 'guest'] };
  },
};
</script>

<style lang="scss" scoped>
.role-help__trigger {
  margin-left: 4px;
  color: var(--c-text-tertiary, #909399);
  cursor: help;
}
</style>

<style lang="scss">
.role-help-tip {
  max-width: 360px;
  line-height: 1.7;

  &__title {
    margin: 0 0 4px;
    font-weight: 600;
  }

  &__line {
    margin: 0;
  }
}
</style>
