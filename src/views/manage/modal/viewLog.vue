<template>
<div>
  <div class="mb-10">
    <el-radio-group v-model="logType" class="mr-10" size="small" @change="getLogs">
      <el-radio-button label="normal">{{ $t('manage.Normal Log') }}</el-radio-button>
      <el-radio-button label="error">{{$t('manage.Error Log')}}</el-radio-button>
    </el-radio-group>
    
    <el-checkbox v-model="tail" class="mr-10" @change="getLogs">{{$t('manage.Latest log')}}</el-checkbox>

    <div class="pull-right">
      <label>{{$t('manage.Log Count')}}：</label>
      <el-input v-model="lines" @change="getLogs" :placeholder="$t('manage.Default: 1000')" size="small" class="width-150 mr-10" />
    </div>
  </div>
  <textarea ref="code" name="code" style="border: none;"></textarea>
</div>

</template>

<script lang="ts">
import { ClusterApi } from '@/apis';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/darcula.css';
export default {
  props: {
    clusterName: String,
    ip: String,
  },
  data() {
    return {
      logs: null,
      logType: 'normal',
      tail: true,
      lines: 1000,
      codeMirror: null,
    };
  },
  watch: {
    logs(newLogs) {
      if (!newLogs) return;
      this.codeMirror?.setValue(newLogs);
    },
  },
  created() {
    this.getLogs();
  },
   mounted() {
    this.codeMirror = CodeMirror.fromTextArea(this.$refs.code, {
      mode: 'text/x-verilog',
      theme: 'darcula',
      readOnly: this.readOnly,
      indentWithTabs: true,
      smartIndent: true,
      lineNumbers: true,
      matchBrackets : true,
      autofocus: true,
      hintOptions: {
        completeSingle: false,
      },
    });
  },
  methods: {
    async getLogs() {
      const { clusterName, ip, logType, tail, lines } = this;
      const { data: { entity } } = await ClusterApi.getNodeLog({clusterName, ip, logType, tail, lines});
      this.logs = entity;
    }
  }
}
</script>

<style scoped lang="scss">
::v-deep .CodeMirror {
  height: 400px;
}
</style>