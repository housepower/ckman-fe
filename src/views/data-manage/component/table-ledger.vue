<template>
  <div class="table-ledger">
    <!-- Toolbar -->
    <div class="toolbar">
      <el-select v-model="selectedDatabase" size="small" style="width: 140px" :placeholder="$t('backup.Database')" clearable @change="onDatabaseChange">
        <el-option v-for="db in databaseList" :key="db" :label="db" :value="db" />
      </el-select>
      <el-input
        v-model="selectedTable"
        size="small"
        style="width: 180px"
        placeholder="table"
        clearable
      />
      <el-select v-model="selectedDays" size="small" style="width: 130px">
        <el-option :label="$t('history.Days 7')" :value="7" />
        <el-option :label="$t('history.Days 14')" :value="14" />
        <el-option :label="$t('history.Days 30')" :value="30" />
      </el-select>
      <el-button type="primary" size="small" @click="fetchLedger" :loading="loading">
        查询
      </el-button>
    </div>

    <template v-if="hasQueried">
      <h3 class="ledger-title">
        {{ selectedDatabase }} · {{ selectedTable }} · 过去 {{ selectedDays }} 天备份情况
        <span class="ledger-hint">（{{ $t('history.Calendar Hover Hint') }}）</span>
      </h3>

      <div class="cal-wrap">
        <!-- Calendar Grid -->
        <div class="cal-grid">
          <div class="cal-header" v-for="h in weekHeaders" :key="h">{{ h }}</div>

          <!-- empty cells for start-of-week offset -->
          <div
            v-for="n in startOffset"
            :key="'empty-' + n"
            class="cal-cell cell-empty"
          ></div>

          <!-- day cells -->
          <el-tooltip
            v-for="cell in calCells"
            :key="cell.date"
            :content="buildTooltip(cell)"
            placement="top"
            :disabled="cell.status === 'empty'"
          >
            <div
              class="cal-cell"
              :class="cellClass(cell)"
              @click="onCellClick(cell)"
            >
              <div class="day">{{ cell.dayNum }}</div>
              <div class="info">{{ cellInfo(cell) }}</div>
            </div>
          </el-tooltip>
        </div>

        <!-- Summary sidebar -->
        <div class="cal-side">
          <h3 class="summary-title">{{ $t('history.Summary') }}</h3>
          <div class="summary-body">
            <div>共 <b>{{ summary.total }}</b> 个有效日</div>
            <div>
              {{ $t('history.Success') }} <b class="c-success">{{ summary.success }}</b> ·
              {{ $t('history.Failed') }} <b class="c-danger">{{ summary.failed }}</b>
            </div>
            <div>
              {{ $t('history.Skipped') }} <b class="c-warning">{{ summary.skipped }}</b> ·
              {{ $t('history.Running') }} <b class="c-primary">{{ summary.running }}</b>
            </div>
            <div>无备份记录 <b>{{ summary.noRun }}</b> 天</div>
            <div style="margin-top: 10px">
              {{ $t('history.Last Success') }}：{{ summary.lastSuccess || '—' }}
            </div>
            <div>
              {{ $t('history.Last Failed') }}：{{ summary.lastFailed || '—' }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty-placeholder">
      <i class="el-icon-date" style="font-size: 40px; color: #dcdfe6;" />
      <p style="color: #909399; margin-top: 8px">请选择 database 和 table，点击查询后查看备份台账</p>
    </div>
  </div>
</template>

<script>
import { DataManageApi } from '@/apis';

const WEEK_HEADERS = ['日', '一', '二', '三', '四', '五', '六'];

export default {
  name: 'TableLedger',
  data() {
    return {
      loading: false,
      hasQueried: false,
      selectedDatabase: '',
      selectedTable: '',
      selectedDays: 30,
      databaseList: [],
      runs: [],         // BackupRun[]
      weekHeaders: WEEK_HEADERS,
    };
  },
  computed: {
    cluster() {
      return this.$route.params.id;
    },

    // Map date string "YYYY-MM-DD" -> latest run (and all runs list)
    dateRunMap() {
      const map = {}; // date -> { latest: run, all: run[] }
      for (const run of this.runs) {
        const ts = run.start_time && run.start_time !== '0001-01-01T00:00:00Z'
          ? run.start_time
          : run.create_time;
        if (!ts) continue;
        const d = new Date(ts);
        if (isNaN(d.getTime())) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map[key]) map[key] = { latest: run, all: [] };
        map[key].all.push(run);
        // keep latest by start_time desc
        const existing = new Date(map[key].latest.start_time || map[key].latest.create_time);
        if (d > existing) map[key].latest = run;
      }
      return map;
    },

    // Build sorted list of dates in range [today-days+1 .. today]
    dateRange() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dates = [];
      for (let i = this.selectedDays - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dates.push(d);
      }
      return dates;
    },

    startOffset() {
      if (!this.dateRange.length) return 0;
      return this.dateRange[0].getDay(); // 0=Sun
    },

    calCells() {
      return this.dateRange.map(d => {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const entry = this.dateRunMap[key];
        const run = entry ? entry.latest : null;
        const allRuns = entry ? entry.all : [];
        const status = run ? run.status : 'no-run';
        // Display day: show month prefix on 1st of month or first cell
        const isFirstOfMonth = d.getDate() === 1;
        const dayNum = isFirstOfMonth ? `${d.getMonth() + 1}/${d.getDate()}` : String(d.getDate());
        return { date: key, d, dayNum, status, run, allRuns };
      });
    },

    summary() {
      let total = 0, success = 0, failed = 0, skipped = 0, running = 0, noRun = 0;
      let lastSuccessDate = null, lastFailedDate = null, lastFailedReason = '';

      for (const cell of this.calCells) {
        total++;
        switch (cell.status) {
          case 'success': success++; break;
          case 'failed': failed++; break;
          case 'skipped': skipped++; break;
          case 'running': running++; break;
          case 'queued': break;
          case 'interrupted': break;
          default: noRun++;
        }
        if (cell.status === 'success' && (!lastSuccessDate || cell.d > lastSuccessDate)) {
          lastSuccessDate = cell.d;
        }
        if (cell.status === 'failed' && (!lastFailedDate || cell.d > lastFailedDate)) {
          lastFailedDate = cell.d;
          lastFailedReason = cell.run ? (cell.run.message || cell.run.status_reason || '') : '';
        }
      }

      const fmt = (d) => {
        if (!d) return null;
        return `${d.getMonth() + 1}/${d.getDate()}`;
      };

      return {
        total,
        success,
        failed,
        skipped,
        running,
        noRun,
        lastSuccess: lastSuccessDate ? fmt(lastSuccessDate) : null,
        lastFailed: lastFailedDate
          ? `${fmt(lastFailedDate)}${lastFailedReason ? '，' + lastFailedReason : ''}`
          : null,
      };
    },
  },
  methods: {
    async fetchDatabases() {
      // We use getTableSummary to get the list of databases with tables
      // But it requires a database; so we try to list tables per cluster instead.
      // For now: leave databaseList empty — user types freely (or uses autocomplete).
      // Optional: if there's a cluster-level DB list endpoint, use it here.
    },

    async onDatabaseChange() {
      if (!this.selectedDatabase) return;
      try {
        const res = await DataManageApi.getTableSummary(this.cluster, this.selectedDatabase);
        if (res.data.retCode === '0000') {
          // getTableSummary returns table list for db — not needed for input, just hints
        }
      } catch {
        // ignore
      }
    },

    async fetchLedger() {
      if (!this.selectedDatabase || !this.selectedTable) {
        this.$message.warning('请先填写 database 和 table');
        return;
      }
      this.loading = true;
      try {
        const res = await DataManageApi.listRunsByTable(
          this.cluster,
          this.selectedDatabase,
          this.selectedTable,
          this.selectedDays
        );
        if (res.data.retCode === '0000') {
          this.runs = res.data.entity || [];
          this.hasQueried = true;
        } else {
          this.$message.error(res.data.retMsg || '查询失败');
        }
      } catch (e) {
        this.$message.error('查询异常: ' + e.message);
      } finally {
        this.loading = false;
      }
    },

    cellClass(cell) {
      const base = `cell-${cell.status}`;
      return base;
    },

    cellInfo(cell) {
      const s = cell.status;
      const run = cell.run;
      if (s === 'no-run') return '无';
      if (s === 'success') {
        const elapsed = this.calcElapsedSecs(run);
        return elapsed !== null ? `✓ ${this.formatChineseElapsed(elapsed)}` : '✓';
      }
      if (s === 'failed') return '✗ 失败';
      if (s === 'skipped') return '↳ 跳过';
      if (s === 'running') return '⏳ 进行中';
      if (s === 'queued') return '⏳ 排队';
      if (s === 'interrupted') return '⚡ 中断';
      return '';
    },

    buildTooltip(cell) {
      const run = cell.run;
      if (!run) return '';
      const allRuns = cell.allRuns || [];
      const statusLabel = this.statusLabel(run.status);
      const ts = this.formatFullDate(run.start_time || run.create_time);

      if (allRuns.length === 1) {
        const elapsed = this.calcElapsedSecs(run);
        const elStr = elapsed !== null ? `耗时 ${this.formatChineseElapsed(elapsed)}` : '';
        const sizeStr = this.totalSize(run);
        const partStr = run.partitions ? `${run.partitions.length} 个分区` : '';
        const parts = [ts, statusLabel, elStr, sizeStr, partStr].filter(Boolean);
        return parts.join(' · ');
      }

      // multiple runs on same day
      return allRuns.map(r => {
        const t = this.formatFullDate(r.start_time || r.create_time);
        const sl = this.statusLabel(r.status);
        const el = this.calcElapsedSecs(r);
        const elStr = el !== null ? this.formatChineseElapsed(el) : '';
        return `${t} ${sl}${elStr ? ' ' + elStr : ''}`;
      }).join('\n');
    },

    calcElapsedSecs(run) {
      if (!run) return null;
      const start = run.start_time && run.start_time !== '0001-01-01T00:00:00Z' ? new Date(run.start_time) : null;
      const end = run.finished_at && run.finished_at !== '0001-01-01T00:00:00Z' ? new Date(run.finished_at) : null;
      if (!start) return null;
      const endT = end || new Date();
      const secs = Math.floor((endT - start) / 1000);
      return isNaN(secs) || secs < 0 ? null : secs;
    },

    formatChineseElapsed(secs) {
      if (secs < 60) return `${secs}s`;
      if (secs < 3600) return `${Math.floor(secs / 60)}分`;
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      return m > 0 ? `${h}时${m}分` : `${h}时`;
    },

    formatFullDate(dateStr) {
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

    totalSize(run) {
      if (!run || !run.partitions) return '';
      const bytes = run.partitions.reduce((s, p) => s + (p.size || 0), 0);
      if (!bytes) return '';
      return this.formatBytes(bytes);
    },

    formatBytes(bytes) {
      if (!bytes || bytes === 0) return '';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    },

    statusLabel(status) {
      const map = {
        success: this.$t('history.Status Success'),
        failed: this.$t('history.Status Failed'),
        running: this.$t('history.Status Running'),
        queued: this.$t('history.Status Queued'),
        skipped: this.$t('history.Status Skipped'),
        interrupted: this.$t('history.Status Interrupted'),
      };
      return map[status] || status;
    },

    onCellClick(cell) {
      if (cell.run) {
        this.$emit('view-run', cell.run.run_id);
      }
    },
  },
  mounted() {
    // Mount without auto-query; user must fill db+table and click 查询
  },
};
</script>

<style scoped>
.table-ledger {
  padding: 16px;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
  flex-wrap: wrap;
}

.ledger-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 12px 0;
  color: #303133;
}

.ledger-hint {
  font-weight: normal;
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.cal-wrap {
  display: flex;
  gap: 24px;
  margin-top: 8px;
  align-items: flex-start;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  font-size: 11px;
  flex: 0 0 480px;
  max-width: 480px;
}

.cal-header {
  text-align: center;
  padding: 6px 0;
  color: #909399;
  font-weight: 500;
  font-size: 12px;
}

.cal-cell {
  aspect-ratio: 1;
  border: 1px solid #ebeef5;
  border-radius: 3px;
  padding: 4px;
  cursor: pointer;
  position: relative;
  background: white;
  min-height: 44px;
}

.cal-cell:hover {
  border-color: #C9A100;
}

.cal-cell.cell-empty {
  background: #fafafa;
  cursor: default;
  border-color: transparent;
}

.cal-cell.cell-empty:hover {
  border-color: transparent;
}

.cal-cell.cell-success {
  background: #f0f9eb;
  border-color: #c2e7b0;
}

.cal-cell.cell-failed {
  background: #fef0f0;
  border-color: #fbc4c4;
}

.cal-cell.cell-skipped {
  background: #fdf6ec;
  border-color: #f5dab1;
}

.cal-cell.cell-running {
  background: #FDF7DD;
  border-color: #C9A100;
}

.cal-cell.cell-queued {
  background: #f4f4f5;
  border-color: #e9e9eb;
}

.cal-cell.cell-interrupted {
  background: #fef0e6;
  border-color: #fbd0a8;
}

.cal-cell.cell-no-run {
  background: white;
  border-color: #ebeef5;
}

.cal-cell .day {
  font-weight: 500;
  font-size: 11px;
  color: #303133;
}

.cal-cell .info {
  font-size: 10px;
  color: #606266;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Summary */
.cal-side {
  flex: 1;
  min-width: 180px;
}

.summary-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px 0;
  color: #303133;
}

.summary-body {
  font-size: 13px;
  line-height: 1.9;
  color: #606266;
}

.c-success { color: #67C23A; }
.c-danger  { color: #F56C6C; }
.c-warning { color: #E6A23C; }
.c-primary { color: #C9A100; }

/* Empty placeholder */
.empty-placeholder {
  text-align: center;
  padding: 60px 20px;
}
</style>
