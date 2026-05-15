<template>
  <div class="view-schema">
    <sql-code-mirror
      :sql="sql"
      :read-only="true"
      class="view-schema__editor"
    />
    <button class="view-schema__copy" @click="copy" :title="$t('queryExecution.Copy')">
      <i class="el-icon-document-copy" />
    </button>
  </div>
</template>

<script>
import { SqlCodeMirror } from '@/components/';

export default {
  name: 'ViewSchemaDialog',
  components: { SqlCodeMirror },
  props: {
    sql: { type: String, default: '' },
    tableName: { type: String, default: '' },
  },
  methods: {
    copy() {
      const input = document.createElement('textarea');
      input.value = this.sql || '';
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        this.$message.success(this.$t('queryExecution.Copy Success'));
      } finally {
        document.body.removeChild(input);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.view-schema {
  position: relative;

  &__editor {
    border: 1px solid var(--c-surface-3);
    border-radius: var(--r-sm);
    overflow: hidden;
  }

  &__copy {
    position: absolute;
    top: var(--s-2);
    right: var(--s-2);
    z-index: 2;
    appearance: none;
    border: 0;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.75);
    cursor: pointer;
    padding: 0;
    width: 28px;
    height: 28px;
    border-radius: var(--r-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: var(--fs-md);
    transition: background-color var(--du-fast) var(--ease-out),
                color var(--du-fast) var(--ease-out);

    &:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #fff;
    }
  }
}

::v-deep .view-schema__editor .CodeMirror {
  height: 480px;
  font-size: var(--fs-sm);
}
</style>
