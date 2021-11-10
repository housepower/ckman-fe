<template>
  <div class="sql-editor pl-5 pr-5 height-full flex flex-column">
    <div class="sql-editor-toolbar mb-5">
      <el-button size="mini" type="primary" @click="run()">{{$t('queryExecution.Execute Query')}}( F8 )</el-button>
      <el-button size="mini" type="primary" @click="run('schedule')">{{$t('queryExecution.Execute Explain')}}( F9 )</el-button>
      <el-button size="mini" type="primary" @click="format">{{$t('queryExecution.Format')}}( F10 )</el-button>
    </div>
    <div class="sql-editor-main flex-1">
      <sql-code-mirror v-model="sql" ref="sqlCodeEditor" :read-only="false" style="height: 100%;"></sql-code-mirror>
    </div>
  </div>
</template>
<script>
import { SqlCodeMirror } from '@/components/';
import { SqlQueryApi } from '@/apis';
import store from '@/store';
import moment from 'moment';
import { $message } from '@/services';
export default {
  components: {
    SqlCodeMirror
  },

  data() {
    return {
      sql: ''
    }
  },

  created() {
    //
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
      const { id: clusterName } = this.$route.params;
      const { sql } = this;
      if (!selectSql && !sql) {
        $message.warning(this.$t('queryExecution.No Sql'));
        return;
      }
      this.$emit('startRun');
      store.commit('sqlSelect/setStatus', 'loading');
      store.dispatch('sqlSelect/retrieveHistory', clusterName);
      const { data: { entity } } = await SqlQueryApi[type === 'schedule' ? 'queryExplain' : 'query']({
        clusterName,
         query: selectSql || sql,
      }).finally(() => {
        store.commit('sqlSelect/setStatus', '');
      });
      store.commit('sqlSelect/setResult', entity);
    },

    format() {
      this.$refs.sqlCodeEditor?.format();
    },

    handleKeydown(e) {
      switch(e.key) {
        case 'F8':
          this.run();
          break;
        case 'F9':
          this.run('schedule');
          break;
        case 'F10':
          this.format();
          break;
      }
    },

    addSql(str) {
      this.$refs.sqlCodeEditor.sqlEditor.setValue(this.sql + (this.sql ? '\n\n' : '') + str);
    }
  }
}
</script>
<style lang="scss">
.sql-editor-main {
  .CodeMirror {
    height: 100%;
  }
}
.el-tabs__nav-scroll {
  background-color: #fcfcfc;
}
</style>
