<template>
  <div class="sql-editor">
    <div class="sql-editor__toolbar">
      <div class="sql-editor__actions">
        <el-tooltip content="F8" placement="top" :open-delay="400">
          <el-button size="small" type="primary" @click="run()">
            <i class="fa fa-play sql-editor__btn-icon" /> {{ $t('queryExecution.Execute Query') }}
          </el-button>
        </el-tooltip>
        <el-tooltip content="F9" placement="top" :open-delay="400">
          <el-button size="small" plain @click="run('schedule')">
            {{ $t('queryExecution.Execute Explain') }}
          </el-button>
        </el-tooltip>
        <el-tooltip content="F10" placement="top" :open-delay="400">
          <el-button size="small" plain @click="format">
            {{ $t('queryExecution.Format') }}
          </el-button>
        </el-tooltip>
      </div>
      <div class="sql-editor__node">
        <label class="sql-editor__node-label">{{ $t('queryExecution.Node') }}</label>
        <el-select
          v-model="selectHost"
          size="small"
          :placeholder="$t('queryExecution.Random')"
          clearable
          class="sql-editor__node-select"
        >
          <el-option v-for="host in hosts" :key="host" :label="host" :value="host" />
        </el-select>
      </div>
    </div>
    <div class="sql-editor__main">
      <sql-code-mirror v-model="sql" ref="sqlCodeEditor" :read-only="false" />
    </div>
  </div>
</template>

<script>
import { SqlCodeMirror } from '@/components/';
import { SqlQueryApi, ClusterApi } from '@/apis';
import store from '@/store';
import { $message } from '@/services';

export default {
  components: { SqlCodeMirror },
  data() {
    return {
      sql: '',
      clusterName: '',
      hosts: [],
      selectHost: '',
    };
  },
  created() {
    const { id: clusterName } = this.$route.params;
    this.clusterName = clusterName;
    this.fetchNodeList();
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    async run(type) {
      const selectSql = this.$refs.sqlCodeEditor.sqlEditor.getSelection();
      const { sql, clusterName, selectHost } = this;
      const raw = (selectSql || sql || '').trim();
      if (!raw) {
        $message.warning(this.$t('queryExecution.No Sql'));
        return;
      }
      const stmts = raw
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
      if (stmts.length === 0) {
        $message.warning(this.$t('queryExecution.No Sql'));
        return;
      }

      this.$emit('startRun');
      store.commit('sqlSelect/clear');
      stmts.forEach((s) => store.commit('sqlSelect/addTab', { sql: s }));

      const apiKey = type === 'schedule' ? 'queryExplain' : 'query';
      const tabs = store.state.sqlSelect.tabs.slice();

      for (const tab of tabs) {
        const start = Date.now();
        try {
          const { data: { entity } } = await SqlQueryApi[apiKey]({
            clusterName,
            query: tab.sql,
            host: selectHost,
          });
          store.commit('sqlSelect/setTabResult', {
            id: tab.id,
            data: entity,
            duration: Date.now() - start,
          });
        } catch (e) {
          const msg =
            (e && e.response && e.response.data && e.response.data.msg) ||
            (e && e.message) ||
            String(e);
          store.commit('sqlSelect/setTabError', {
            id: tab.id,
            error: msg,
            duration: Date.now() - start,
          });
        }
      }

      store.dispatch('sqlSelect/retrieveHistory', clusterName);
    },
    format() {
      this.$refs.sqlCodeEditor?.format();
    },
    handleKeydown(e) {
      switch (e.key) {
        case 'F8':  this.run(); break;
        case 'F9':  this.run('schedule'); break;
        case 'F10': this.format(); break;
      }
    },
    addSql(str) {
      this.$refs.sqlCodeEditor.sqlEditor.setValue(this.sql + (this.sql ? '\n\n' : '') + str);
    },
    async fetchNodeList() {
      const { clusterName } = this;
      const { data: { entity } } = await ClusterApi.getClusterByName(clusterName);
      this.hosts = entity.hosts || [];
    },
  },
};
</script>

<style lang="scss" scoped>
.sql-editor {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__toolbar {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-3);
    padding: var(--s-2) var(--s-3);
    background: var(--c-surface-0);
    border-bottom: 1px solid var(--c-surface-3);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--s-2);
  }

  &__btn-icon {
    margin-right: var(--s-1);
  }

  &__node {
    display: flex;
    align-items: center;
    gap: var(--s-2);
  }

  &__node-label {
    font-size: var(--fs-sm);
    color: var(--c-text-secondary);
  }

  &__node-select {
    width: 180px;
  }

  &__main {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
}

::v-deep .CodeMirror {
  height: 100%;
}
</style>
