<template>
  <div>
    <div class="mb-10 flex flex-vcenter flex-between">
      <div class="flex flex-vcenter flex-between">
        <el-radio-group v-model="logType" class="mr-10" size="small" @change="getLogs">
          <el-radio-button label="normal">{{ $t('manage.Normal Log') }}</el-radio-button>
          <el-radio-button label="error">{{ $t('manage.Error Log') }}</el-radio-button>
        </el-radio-group>

        <el-checkbox v-model="tail" class="mr-10" @change="getLogs">{{ $t('manage.Latest log') }}</el-checkbox>
      </div>

      <div class="pull-right flex flex-vcenter">
        <label>{{ $t('manage.Log Count') }}：</label>
        <el-input v-model="lines" @change="getLogs" :placeholder="$t('manage.Default: 1000')" size="small"
          class="width-150 mr-10" />
        <i class="el-icon-refresh fs-18 fc-primary pointer" v-if="!loading" @click="getLogs"
          :title="$t('common.Refresh')"></i>
        <i class="el-icon-loading" v-else></i>
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
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/dialog/dialog.css';
export default {
  props: {
    clusterName: String,
    ip: String,
    password: String,
  },
  data() {
    return {
      logs: null,
      logType: 'normal',
      tail: true,
      lines: 1000,
      codeMirror: null,
      loading: false,
      searchKey: '',
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
      mode: 'text/plain',
      theme: 'darcula',
      readOnly: this.readOnly,
      indentWithTabs: true,
      smartIndent: true,
      lineNumbers: true,
      lineWrapping: true,
      matchBrackets: true,
      autofocus: true,
      hintOptions: {
        completeSingle: false,
      },
      extraKeys: {
        "Ctrl-F": (cm) => {
          cm.execCommand("findPersistent");
        },
      },
    });
  },
  methods: {
    doSearch() {
      if (!this.searchKey) return;

      // 获取当前搜索光标实例
      const cursor = this.codeMirror.getSearchCursor(this.searchKey);

      // 查找下一个匹配项
      if (!cursor.findNext()) {
        // 如果到达文档末尾，回到开头继续搜索
        cursor.pos({ line: 0, ch: 0 });
        if (cursor.findNext()) {
          this.$message.info(this.$t('common.Reached end, restarting from top'));
        } else {
          this.$message.warning(this.$t('common.No matches found'));
        }
      }

      // 高亮匹配项并滚动到视图
      if (cursor.from()) {
        this.codeMirror.setSelection(cursor.from(), cursor.to());
        this.codeMirror.scrollIntoView(cursor.to(), 200);
      }
    },
    async getLogs() {
        if (this.loading) return;
        this.loading = true;
        const { clusterName, ip, password, logType, tail, lines } = this;
        const { data: { entity } } = await ClusterApi.getNodeLog(clusterName, ip, logType, tail, lines, password)
          .finally(() => {
            this.loading = false;
          });
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