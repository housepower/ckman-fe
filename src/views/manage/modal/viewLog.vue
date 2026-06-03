<template>
  <div class="view-log" :class="{ 'view-log--fullscreen': fullscreen }">
    <div class="view-log__toolbar">
      <div class="view-log__filters">
        <el-radio-group v-model="logType" size="small" @change="getLogs">
          <el-radio-button label="normal">{{ $t('manage.Normal Log') }}</el-radio-button>
          <el-radio-button label="error">{{ $t('manage.Error Log') }}</el-radio-button>
        </el-radio-group>
        <el-checkbox v-model="tail" @change="getLogs">
          {{ $t('manage.Latest log') }}
        </el-checkbox>
      </div>
      <div class="view-log__controls">
        <el-input
          v-model="searchKey"
          size="small"
          :placeholder="$t('common.keyword search')"
          prefix-icon="el-icon-search"
          clearable
          class="view-log__search"
          @keyup.enter.native="jumpNext"
        />
        <span v-if="searchKey" class="view-log__hits">
          {{ matchTotal > 0 ? `${matchIndex}/${matchTotal}` : '0' }}
        </span>
        <el-button-group v-if="searchKey">
          <el-button
            size="small"
            icon="el-icon-arrow-up"
            :disabled="matchTotal === 0"
            @click="jumpPrev"
          />
          <el-button
            size="small"
            icon="el-icon-arrow-down"
            :disabled="matchTotal === 0"
            @click="jumpNext"
          />
        </el-button-group>
        <span class="view-log__divider"></span>
        <label class="view-log__lines-label">{{ $t('manage.Log Count') }}</label>
        <el-input
          v-model="lines"
          size="small"
          :placeholder="$t('manage.Default: 1000')"
          class="view-log__lines-input"
          @change="getLogs"
        />
        <el-button
          size="small"
          plain
          icon="el-icon-refresh"
          :loading="loading"
          @click="getLogs"
        >{{ $t('common.Refresh') }}</el-button>
        <el-button
          size="small"
          plain
          :icon="fullscreen ? 'el-icon-close' : 'el-icon-full-screen'"
          :title="fullscreen ? $t('common.Exit Fullscreen') : $t('common.Fullscreen')"
          @click="toggleFullscreen"
        />
      </div>
    </div>

    <div class="view-log__editor-wrap">
      <textarea ref="code" name="code"></textarea>
      <button
        class="view-log__copy"
        :title="$t('queryExecution.Copy')"
        @click="copy"
      >
        <i class="el-icon-document-copy" />
      </button>
    </div>
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
      searchOverlay: null,
      matchTotal: 0,
      matchIndex: 0,
      fullscreen: false,
    };
  },
  watch: {
    logs(newLogs) {
      if (newLogs == null) return;
      this.codeMirror?.setValue(newLogs);
      if (this.searchKey) {
        this.applySearch();
      } else {
        this.scrollToBottom();
      }
    },
    searchKey() {
      this.applySearch();
    },
  },
  created() {
    this.getLogs();
  },
  mounted() {
    this.codeMirror = CodeMirror.fromTextArea(this.$refs.code, {
      mode: 'text/plain',
      theme: 'darcula',
      readOnly: true,
      indentWithTabs: true,
      smartIndent: true,
      lineNumbers: true,
      lineWrapping: true,
      matchBrackets: true,
      autofocus: true,
      extraKeys: {
        'Ctrl-F': (cm) => cm.execCommand('findPersistent'),
      },
    });
  },
  beforeDestroy() {
    if (this.codeMirror && this.searchOverlay) {
      this.codeMirror.removeOverlay(this.searchOverlay);
    }
    document.removeEventListener('keydown', this.onKeydown, true);
  },
  methods: {
    toggleFullscreen() {
      this.fullscreen = !this.fullscreen;
      if (this.fullscreen) {
        document.addEventListener('keydown', this.onKeydown, true);
      } else {
        document.removeEventListener('keydown', this.onKeydown, true);
      }
      this.$nextTick(() => this.codeMirror?.refresh());
    },
    onKeydown(e) {
      if (e.key === 'Escape' && this.fullscreen) {
        e.stopPropagation();
        this.toggleFullscreen();
      }
    },
    scrollToBottom() {
      const cm = this.codeMirror;
      if (!cm) return;
      this.$nextTick(() => {
        const last = cm.lastLine();
        cm.setCursor({ line: last, ch: cm.getLine(last).length });
        cm.scrollIntoView({ line: last, ch: 0 });
      });
    },
    async getLogs() {
      if (this.loading) return;
      this.loading = true;
      const { clusterName, ip, password, logType, tail, lines } = this;
      const { data: { entity } } = await ClusterApi
        .getNodeLog(clusterName, ip, logType, tail, lines, password)
        .finally(() => {
          this.loading = false;
        });
      this.logs = entity;
    },
    applySearch() {
      const cm = this.codeMirror;
      if (!cm) return;

      if (this.searchOverlay) {
        cm.removeOverlay(this.searchOverlay);
        this.searchOverlay = null;
      }

      const keyword = this.searchKey || '';
      if (!keyword) {
        this.matchTotal = 0;
        this.matchIndex = 0;
        return;
      }

      const needle = keyword.toLowerCase();
      this.searchOverlay = {
        token(stream) {
          const lower = stream.string.toLowerCase();
          const idx = lower.indexOf(needle, stream.pos);
          if (idx === stream.pos) {
            for (let i = 0; i < needle.length; i++) stream.next();
            return 'log-search-hit';
          }
          if (idx === -1) {
            stream.skipToEnd();
          } else {
            stream.pos = idx;
          }
          return null;
        },
      };
      cm.addOverlay(this.searchOverlay);

      const haystack = cm.getValue().toLowerCase();
      let count = 0;
      let pos = 0;
      while ((pos = haystack.indexOf(needle, pos)) !== -1) {
        count++;
        pos += needle.length;
      }
      this.matchTotal = count;
      this.matchIndex = count > 0 ? 1 : 0;

      if (count > 0) {
        const cursor = cm.getSearchCursor(keyword, { line: 0, ch: 0 }, { caseFold: true });
        if (cursor.findNext()) {
          cm.setSelection(cursor.from(), cursor.to());
          cm.scrollIntoView({ from: cursor.from(), to: cursor.to() }, 200);
        }
      }
    },
    jumpNext() {
      const cm = this.codeMirror;
      if (!cm || !this.searchKey || this.matchTotal === 0) return;
      let cursor = cm.getSearchCursor(this.searchKey, cm.getCursor('to'), { caseFold: true });
      if (!cursor.findNext()) {
        cursor = cm.getSearchCursor(this.searchKey, { line: 0, ch: 0 }, { caseFold: true });
        if (!cursor.findNext()) return;
        this.matchIndex = 1;
      } else {
        this.matchIndex = this.matchIndex >= this.matchTotal ? 1 : this.matchIndex + 1;
      }
      cm.setSelection(cursor.from(), cursor.to());
      cm.scrollIntoView({ from: cursor.from(), to: cursor.to() }, 200);
    },
    jumpPrev() {
      const cm = this.codeMirror;
      if (!cm || !this.searchKey || this.matchTotal === 0) return;
      let cursor = cm.getSearchCursor(this.searchKey, cm.getCursor('from'), { caseFold: true });
      if (!cursor.findPrevious()) {
        const end = { line: cm.lastLine(), ch: cm.getLine(cm.lastLine()).length };
        cursor = cm.getSearchCursor(this.searchKey, end, { caseFold: true });
        if (!cursor.findPrevious()) return;
        this.matchIndex = this.matchTotal;
      } else {
        this.matchIndex = this.matchIndex <= 1 ? this.matchTotal : this.matchIndex - 1;
      }
      cm.setSelection(cursor.from(), cursor.to());
      cm.scrollIntoView({ from: cursor.from(), to: cursor.to() }, 200);
    },
    copy() {
      const input = document.createElement('textarea');
      input.value = this.logs || '';
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
.view-log {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);

  &--fullscreen {
    position: fixed;
    inset: 0;
    z-index: 3000;
    margin: 0;
    padding: var(--s-4);
    background: var(--c-surface-1);
    box-sizing: border-box;

    .view-log__editor-wrap {
      flex: 1;
      min-height: 0;
    }

    ::v-deep .CodeMirror {
      height: 100%;
    }
  }

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-3);
    flex-wrap: wrap;
  }

  &__filters {
    display: flex;
    align-items: center;
    gap: var(--s-3);
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    flex-wrap: wrap;
  }

  &__search {
    width: 200px;
  }

  &__hits {
    font-size: var(--fs-xs);
    color: var(--c-text-tertiary);
    font-variant-numeric: tabular-nums;
    min-width: 32px;
    text-align: right;
  }

  &__divider {
    width: 1px;
    height: 16px;
    background: var(--c-surface-3);
    margin: 0 var(--s-1);
  }

  &__lines-label {
    font-size: var(--fs-sm);
    color: var(--c-text-secondary);
  }

  &__lines-input {
    width: 110px;
  }

  &__editor-wrap {
    position: relative;
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

::v-deep .CodeMirror {
  height: 520px;
  font-size: var(--fs-sm);
}

::v-deep .cm-log-search-hit {
  background: #FFE066;
  color: #1A1D23;
  border-radius: 2px;
}
</style>
