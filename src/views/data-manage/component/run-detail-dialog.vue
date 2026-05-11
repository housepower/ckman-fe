<template>
  <el-dialog
    :visible="value"
    :title="$t('history.Run Detail')"
    width="800px"
    @update:visible="$emit('input', $event)"
    @closed="onClosed"
    :close-on-click-modal="false"
  >
    <div v-if="loading" class="text-center" style="padding:30px 0;color:#909399">
      <i class="el-icon-loading" /> {{ $t('history.Loading') }}
    </div>
    <div v-else-if="run">
      <!-- 元数据 3 列 grid -->
      <div class="meta-grid">
        <div class="meta-field"><span class="label">RUN ID</span><span class="value mono">{{ run.run_id }}</span></div>
        <div class="meta-field"><span class="label">{{ $t('history.Policy') }}</span><span class="value mono">{{ run.policy_id || '—' }}</span></div>
        <div class="meta-field"><span class="label">{{ $t('history.Trigger Type') }}</span><span class="value">{{ triggerLabel(run.trigger_type) }}</span></div>
        <div class="meta-field"><span class="label">{{ $t('history.Operation') }}</span><span class="value">
          <el-tag size="mini" :type="run.operation === 'backup' ? 'primary' : 'info'" v-if="run.operation">
            {{ run.operation === 'backup' ? $t('history.Op Backup') : $t('history.Op Restore') }}
          </el-tag>
          <span v-else>—</span>
        </span></div>
        <div class="meta-field"><span class="label">{{ $t('history.Instance') }}</span><span class="value">{{ run.instance || '—' }}</span></div>
        <div class="meta-field"><span class="label">{{ $t('history.Status') }}</span><span class="value">
          <el-tag :type="statusType(run.status)" size="mini" v-if="run.status !== 'interrupted'">
            {{ $t('history.Status ' + capitalize(run.status)) }}
          </el-tag>
          <el-tag v-else size="mini" color="#ED8936" style="color:white;border-color:#ED8936">
            {{ $t('history.Status Interrupted') }}
          </el-tag>
          <span v-if="run.status_reason" class="muted" style="margin-left:6px">· {{ run.status_reason }}</span>
        </span></div>
        <div class="meta-field"><span class="label">{{ $t('history.Start Time') }}</span><span class="value">{{ formatDate(run.started_at) }}</span></div>
        <div class="meta-field"><span class="label">{{ $t('history.Finish Time') }}</span><span class="value">{{ formatDate(run.finished_at) }}</span></div>
        <div class="meta-field"><span class="label">{{ $t('history.Elapsed') }}</span><span class="value">{{ elapsedText }}</span></div>
      </div>

      <!-- 分区明细 -->
      <div class="section-title">{{ $t('history.Partition Detail', { done: succCount, total: (run.partitions || []).length }) }}</div>
      <el-table :data="run.partitions || []" size="small" border>
        <el-table-column prop="partition" :label="$t('history.Partition')" width="120" />
        <el-table-column :label="$t('history.Status')" width="100">
          <template #default="{ row }">
            <el-tag size="mini" :type="statusType(row.status)" v-if="row.status !== 'interrupted'">
              {{ $t('history.Status ' + capitalize(row.status)) }}
            </el-tag>
            <el-tag v-else size="mini" color="#ED8936" style="color:white;border-color:#ED8936">
              {{ $t('history.Status Interrupted') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('history.Disk Size')" width="100">
          <template #default="{ row }">{{ formatBytes(row.size) }}</template>
        </el-table-column>
        <el-table-column :label="$t('history.Rows')" width="100">
          <template #default="{ row }">{{ row.rows ? row.rows.toLocaleString() : '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('history.File Count')" width="80">
          <template #default="{ row }">{{ row.file_num ? row.file_num.toLocaleString() : '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('history.Elapsed')" width="80">
          <template #default="{ row }">{{ row.elapsed ? row.elapsed + 's' : '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('history.Error')" min-width="150">
          <template #default="{ row }">
            <el-tooltip v-if="row.msg && row.msg.length > 30" :content="row.msg" placement="top">
              <span class="muted">{{ row.msg.substring(0, 30) }}…</span>
            </el-tooltip>
            <span v-else class="muted">{{ row.msg || '—' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 错误日志 -->
      <template v-if="run.error_msg || run.message">
        <div class="section-title">{{ $t('history.Error Log') }}</div>
        <pre class="err-msg">{{ run.error_msg || run.message }}</pre>
      </template>
    </div>

    <span slot="footer">
      <el-button @click="$emit('input', false)">{{ $t('history.Close') }}</el-button>
      <el-button
        v-if="canRestoreFromRun"
        type="primary"
        @click="onRestoreFromRun"
      >
        {{ $t('history.Restore From Run') }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { DataManageApi } from '@/apis';

export default {
  name: 'RunDetailDialog',
  model: { prop: 'value', event: 'input' },
  props: {
    value: { type: Boolean, default: false },
    runId: { type: String, default: '' },
  },
  data() {
    return { run: null, loading: false, pollTimer: null };
  },
  computed: {
    succCount() {
      if (!this.run || !this.run.partitions) return 0;
      return this.run.partitions.filter(p => p.status === 'success').length;
    },
    canRestoreFromRun() {
      return this.run && this.run.operation === 'backup' && this.run.status === 'success';
    },
    elapsedText() {
      if (!this.run || !this.run.elapsed) return '—';
      const s = this.run.elapsed;
      if (s < 60) return s + 's';
      const m = Math.floor(s / 60), sec = s % 60;
      if (m < 60) return m + 'm ' + sec + 's';
      const h = Math.floor(m / 60);
      return h + 'h ' + (m % 60) + 'm';
    },
  },
  watch: {
    value(visible) {
      if (visible && this.runId) {
        this.run = null;
        this.fetchRun();
      } else {
        this.stopPoll();
      }
    },
    runId(newId) {
      if (this.value && newId) {
        this.run = null;
        this.fetchRun();
      }
    },
  },
  methods: {
    async fetchRun() {
      this.loading = true;
      try {
        const res = await DataManageApi.getRun(this.runId);
        if (res.data.retCode === '0000') {
          this.run = res.data.entity;
          this.maybeStartPoll();
        }
      } catch (e) {
        this.$message.error(this.$t('history.Fetch Run Failed') + ': ' + e.message);
      } finally {
        this.loading = false;
      }
    },
    maybeStartPoll() {
      this.stopPoll();
      if (!this.run) return;
      const inProgress = this.run.status === 'queued' || this.run.status === 'running';
      if (inProgress) {
        this.pollTimer = setTimeout(() => this.fetchRun(), 5000);
      }
    },
    stopPoll() {
      if (this.pollTimer) {
        clearTimeout(this.pollTimer);
        this.pollTimer = null;
      }
    },
    onClosed() {
      this.stopPoll();
      this.run = null;
    },
    onRestoreFromRun() {
      this.$emit('restore-from-run', {
        cluster: this.run.cluster_name,
        run_id: this.run.run_id,
        database: this.run.database,
        table: this.run.table,
      });
      this.$emit('input', false);
    },
    capitalize(s) {
      if (!s) return '';
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
    statusType(status) {
      switch (status) {
        case 'success': return 'success';
        case 'failed': return 'danger';
        case 'running': return 'primary';
        case 'queued': return 'info';
        case 'skipped': return 'warning';
        default: return 'info';
      }
    },
    triggerLabel(t) {
      if (!t) return '—';
      const key = 'history.Trigger ' + t;
      const label = this.$t(key);
      return label === key ? t : label;
    },
    formatDate(s) {
      if (!s || s === '0001-01-01T00:00:00Z') return '—';
      const d = new Date(s);
      if (isNaN(d.getTime())) return s;
      return d.toLocaleString('zh-CN', { hour12: false });
    },
    formatBytes(b) {
      if (!b || b === 0) return '—';
      if (b < 1024) return b + ' B';
      if (b < 1048576) return (b / 1024).toFixed(2) + ' KB';
      if (b < 1073741824) return (b / 1048576).toFixed(2) + ' MB';
      return (b / 1073741824).toFixed(2) + ' GB';
    },
  },
  beforeDestroy() {
    this.stopPoll();
  },
};
</script>

<style scoped>
.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.meta-field { padding: 6px 0; }
.meta-field .label { color: #909399; font-size: 11px; display: block; margin-bottom: 4px; }
.meta-field .value { color: #303133; font-size: 13px; }
.value.mono { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; }
.section-title { font-size: 14px; font-weight: 500; margin: 16px 0 8px; color: #303133; }
.err-msg {
  background: #fef0f0; border: 1px solid #fbc4c4; border-radius: 3px;
  padding: 8px 10px; font-size: 12px; color: #F56C6C;
  font-family: ui-monospace, Menlo, Consolas, monospace; white-space: pre-wrap; margin: 0;
}
.muted { color: #909399; }
</style>
