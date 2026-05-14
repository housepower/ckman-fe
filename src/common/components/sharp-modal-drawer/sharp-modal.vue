<template>
  <el-dialog :modal-append-to-body="false"
             :close-on-click-modal="false"
             v-bind="props"
             :visible.sync="visible"
             :class="classes"
             @closed="onHidden"
             :before-close="onBeforeClose"
             ref="modal">
    <component :is="childComponent"
               v-bind="data"
               ref="body"
               :modalInstance="this" />
    <template slot="footer" v-if="props.cancelText !== null || props.okText !== null">
      <el-button v-if="props.cancelText !== null"
                 @click="onCancel">{{ props.cancelText }}</el-button>
      <el-button v-if="props.okText !== null"
                 type="primary"
                 :loading="loading"
                 @click="onOk">{{ props.okText }}</el-button>
    </template>
  </el-dialog>
</template>
<script>
  import ModalDrawerMixin from './modal-drawer-mixin';

  export default {
    name: 'SharpModal',
    mixins: [ModalDrawerMixin],
  };
</script>
<style lang="scss" scoped>
::v-deep .el-dialog {
  border-radius: var(--r-lg);
  box-shadow: var(--sh-lg);
  overflow: hidden;
}

::v-deep .el-dialog__header {
  padding: var(--s-4) var(--s-5);
  border-bottom: 1px solid var(--c-surface-3);
  background: var(--c-surface-0);

  .el-dialog__title {
    font-size: var(--fs-md);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
  }

  .el-dialog__headerbtn {
    top: var(--s-4);
    right: var(--s-5);
  }
}

::v-deep .el-dialog__body {
  padding: var(--s-5);
  color: var(--c-text-primary);
  font-size: var(--fs-base);
}

::v-deep .el-dialog__footer {
  padding: var(--s-3) var(--s-5);
  border-top: 1px solid var(--c-surface-3);
  background: var(--c-surface-1);
}
</style>
