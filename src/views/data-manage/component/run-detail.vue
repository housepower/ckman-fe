<template>
  <el-dialog
    :visible.sync="visible"
    :title="$t('history.Run Detail')"
    width="800px"
    @closed="onClosed"
  >
    <div v-if="loading" class="text-center muted">{{ $t('history.Loading') }}</div>
    <div v-else-if="run">
      <!-- 1. Meta grid (3 columns) -->
      <div class="meta-grid">
        <div class="meta-field">
          <span class="label">RUN ID</span>
          <span class="value mono">{{ run.run_id }}</span>
        </div>
        <div class="meta-field">
          <span class="label">{{ $t('history.Policy') }}</span>
          <span class="value">{{ run.policy_id || '—' }}</span>
        </div>
        <div class="meta-field">
          <span class="label">{{ $t('history.Trigger Type') }}</span>
          <span class="value">{{ triggerTypeLabel(run.trigger_type) }}</span>
        </div>
        <div class="meta-field">
          <span class="label">{{ $t('history.Operation') }}</span>
          <span class="value">{{ run.operation || '—' }}</span>
        </div>
        <div class="meta-field">
          <span class="label">{{ $t('history.Instance') }}</span>
          <span class="value">{{ run.instance || '—' }}</span>
        </div>
        <div class="meta-field">
          <span class="label">{{ $t('history.Status') }}</span>
          <span class="value">
            <el-tag :type="statusTagType(run.status)" size="small">
              {{ statusLabel(run.status) }}
            </el-tag>
            <span v-if="run.status_reason" class="muted"> · {{ run.status_reason }}</span>
          </span>
        </div>
        <div class="meta-field">
          <span class="label">{{ $t('history.Start Time') }}</span>
          <span class="value">{{ formatDate(run.start_time) }}</span>
        </div>
        <div class="meta-field">
          <span class="label">{{ $t('history.Finish Time') }}</span>
          <span class="value">{{ formatDate(run.finished_at) }}</span>
        </div>
        <div class="meta-field">
          <span class="label">{{ $t('history.Elapsed') }}</span>
          <span class="value">{{ elapsedText }}</span>
        </div>
      </div>

      <!-- 2. Partition detail table -->
      <div class="section-title">
        {{ $t('history.Partition Detail', { done: succPartCount, total: run.partitions ? run.partitions.length : 0 }) }}
      </div>
      <el-table :data="run.partitions || []" size="small" border>
        <el-table-column prop="partition" :label="$t('history.Partition')" width="120" />
        <el-table-column :label="$t('history.Status')" width="100">
          <template #default="{ row }">
            <el-tag size="mini" :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
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

      <!-- 3. Error log (only for failed/skipped) -->
      <template v-if="run.message">
        <div class="section-title">{{ $t('history.Error Log') }}</div>
        <pre class="err-msg">{{ run.message }}</pre>
      </template>

      <!-- 4. Actions -->
      <div class="section-title">{{ $t('history.Actions') }}</div>
      <div class="actions">
        <el-button
          v-if="run.operation === 'backup' && run.status === 'success'"
          size="small"
          @click="onRestoreFromRun"
        >
          {{ $t('history.Restore From Run') }}
        </el-button>
        <el-button
          v-if="run.policy_id"
          size="small"
          @click="onRerunPolicy"
        >
          {{ $t('history.Rerun Policy') }}
        </el-button>
        <span v-if="isPolling" class="polling-hint muted">
          <i class="el-icon-loading" /> {{ $t('history.Loading') }}
        </span>
      </div>
    </div>
    <span slot="footer">
      <el-button @click="visible = false">{{ $t('history.Close') }}</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { DataManageApi } from '@/apis';

const FINAL_STATUSES = new Set(['success', 'failed', 'skipped', 'interrupted']);
const POLL_INTERVAL_MS = 5000;

export default {
  name: 'RunDetail',
  model: {
    prop: 'value',
    event: 'input',
  },
  props: {
    runId: {
      type: String,
      default: '',
    },
    value: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      run: null,
      loading: false,
      isPolling: false,
      pollTimer: null,
    };
  },
  computed: {
    visible: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit('input', val);
      },
    },
    elapsedText() {
      if (!this.run) return '—';
      const start = this.run.start_time && this.run.start_time !== '0001-01-01T00:00:00Z'
        ? new Date(this.run.start_time)
        : null;
      if (!start) return '—';
      const end = this.run.finished_at && this.run.finished_at !== '0001-01-01T00:00:00Z'
        ? new Date(this.run.finished_at)
        : new Date();
      const secs = Math.floor((end - start) / 1000);
      if (isNaN(secs) || secs < 0) return '—';
      if (secs < 60) return `${secs}s`;
      if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    },
    succPartCount() {
      if (!this.run || !this.run.partitions) return 0;
      return this.run.partitions.filter(p => p.status === 'success').length;
    },
    cluster() {
      return this.$route.params.id;
    },
  },
  watch: {
    value(newVal) {
      if (newVal) {
        this.run = null;
        if (this.runId) {
          this.fetchRun();
        }
      } else {
        this.clearPollTimer();
      }
    },
    runId(newId) {
      if (newId && this.value) {
        this.run = null;
        this.fetchRun();
      }
    },
  },
  destroyed() {
    this.clearPollTimer();
  },
  methods: {
    clearPollTimer() {
      if (this.pollTimer !== null) {
        clearTimeout(this.pollTimer);
        this.pollTimer = null;
      }
      this.isPolling = false;
    },

    async fetchRun() {
      if (!this.runId) return;
      this.loading = !this.run; // only show loading spinner on first load
      try {
        const res = await DataManageApi.getRun(this.runId);
        if (res.data.retCode === '0000') {
          this.run = res.data.entity;
          // schedule next poll if status is non-final
          if (this.run && !FINAL_STATUSES.has(this.run.status) && this.value) {
            this.isPolling = true;
            this.pollTimer = setTimeout(() => {
              this.pollTimer = null;
              this.fetchRun();
            }, POLL_INTERVAL_MS);
          } else {
            this.isPolling = false;
          }
        } else {
          this.$message.error(res.data.retMsg || 'Failed to load run');
        }
      } catch (e) {
        this.$message.error('Error loading run: ' + e.message);
      } finally {
        this.loading = false;
      }
    },

    onClosed() {
      this.clearPollTimer();
      this.run = null;
    },

    async onRestoreFromRun() {
      if (!this.run) return;
      const successPartitions = (this.run.partitions || [])
        .filter(p => p.status === 'success')
        .map(p => p.partition);

      try {
        await this.$confirm(
          `确定从此 run 恢复 ${successPartitions.length} 个 success 分区？`,
          '确认恢复',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );
      } catch {
        return;
      }

      try {
        const res = await DataManageApi.restoreData(this.cluster, {
          source_run_id: this.run.run_id,
          partitions: successPartitions,
        });
        if (res.data.retCode === '0000') {
          this.$message.success(this.$t('history.Restore Success'));
          this.visible = false;
        } else {
          this.$message.error(res.data.retMsg || '恢复请求失败');
        }
      } catch (e) {
        this.$message.error('恢复异常: ' + e.message);
      }
    },

    async onRerunPolicy() {
      if (!this.run || !this.run.policy_id) return;
      try {
        await this.$confirm(
          '确定重新触发该 policy？',
          '确认触发',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );
      } catch {
        return;
      }

      try {
        const res = await DataManageApi.triggerPolicy(this.run.policy_id);
        if (res.data.retCode === '0000') {
          this.$message.success(this.$t('history.Trigger Success'));
          this.visible = false;
        } else {
          this.$message.error(res.data.retMsg || '触发失败');
        }
      } catch (e) {
        this.$message.error('触发异常: ' + e.message);
      }
    },

    statusTagType(status) {
      switch (status) {
        case 'success': return 'success';
        case 'failed': return 'danger';
        case 'running': return 'primary';
        case 'queued': return 'info';
        case 'skipped': return 'warning';
        case 'interrupted': return 'warning';
        default: return 'info';
      }
    },

    statusLabel(status) {
      const map = {
        success: this.$t('history.Status Success'),
        failed: this.$t('history.Status Failed'),
        running: this.$t('history.Status Running'),
        queued: this.$t('history.Status Queued'),
        skipped: this.$t('history.Status Skipped'),
        interrupted: this.$t('history.Status Interrupted'),
        waiting: this.$t('history.Status Waiting'),
      };
      return map[status] || status;
    },

    triggerTypeLabel(type) {
      const map = {
        cron: this.$t('history.Trigger cron'),
        manual_immediate: this.$t('history.Trigger manual_immediate'),
        manual_restore: this.$t('history.Trigger manual_restore'),
        manual_retry: this.$t('history.Trigger manual_retry'),
      };
      return map[type] || type || '—';
    },

    formatDate(dateStr) {
      if (!dateStr || dateStr === '0001-01-01T00:00:00Z') return '—';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const Y = d.getFullYear();
        const M = String(d.getMonth() + 1).padStart(2, '0');
        const D = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${Y}-${M}-${D} ${hh}:${mm}`;
      } catch {
        return dateStr;
      }
    },

    formatBytes(bytes) {
      if (!bytes || bytes === 0) return '—';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    },
  },
};
</script>

<style scoped>
.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px 16px;
  margin-bottom: 20px;
  padding: 14px 16px;
  background: #FAFAFA;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
}

.meta-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-field .label {
  font-size: 11px;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.meta-field .value {
  font-size: 13px;
  color: #303133;
  word-break: break-all;
}

.mono {
  font-family: monospace;
  font-size: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  margin: 18px 0 8px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #EBEEF5;
}

.err-msg {
  background: #FEF0F0;
  border: 1px solid #FBC4C4;
  border-radius: 4px;
  padding: 10px 14px;
  font-size: 12px;
  color: #F56C6C;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 0 4px 0;
}

.polling-hint {
  font-size: 12px;
}

.muted {
  color: #909399;
}

.text-center {
  text-align: center;
  padding: 40px 0;
}
</style>
