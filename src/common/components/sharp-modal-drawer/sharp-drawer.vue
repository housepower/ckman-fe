<template>
  <el-drawer :modal-append-to-body="false"
             :focus-first="false"
             v-bind="props"
             :visible.sync="visible"
             :class="classes"
             @closed="onHidden"
             :before-close="onBeforeClose"
             ref="modal">
    <div class="sharp-drawer__body">
      <component :is="childComponent"
                 v-bind="data"
                 ref="body"
                 :modalInstance="this" />
    </div>
    <div class="footer" v-if="props.cancelText !== null || props.okText !== null">
      <el-button v-if="props.cancelText !== null"
                 @click="onCancel">{{ props.cancelText }}</el-button>
      <el-button v-if="props.okText !== null"
                 type="primary"
                 :loading="loading"
                 @click="onOk">{{ props.okText }}</el-button>
    </div>
  </el-drawer>
</template>
<script>
  import ModalDrawerMixin from './modal-drawer-mixin';

  export default {
    name: 'SharpDrawer',
    mixins: [ModalDrawerMixin],
  };
</script>
<style lang="scss" scoped>
::v-deep .el-drawer {
  box-shadow: var(--sh-lg);
}

::v-deep .el-drawer__header {
  font-size: var(--fs-md);
  font-weight: var(--fw-semibold);
  color: var(--c-text-primary);
  padding: var(--s-4) var(--s-5);
  margin-bottom: 0;
  border-bottom: 1px solid var(--c-surface-3);
  background: var(--c-surface-0);
}

::v-deep .el-drawer__body {
  display: flex;
  flex-direction: column;
}

.sharp-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--s-5);
  color: var(--c-text-primary);
  font-size: var(--fs-base);
}

.footer {
  background: var(--c-surface-1);
  border-top: 1px solid var(--c-surface-3);
  padding: var(--s-3) var(--s-5);
  text-align: right;
}
</style>
