<template>
  <el-dialog
    :visible="value"
    :title="$t('history.Partition List Title', { table: tableLabel })"
    width="960px"
    @update:visible="$emit('input', $event)"
    @opened="onOpened"
    @closed="onClosed"
  >
    <!-- Filter toolbar -->
    <div class="filter-toolbar">
      <el-date-picker
        v-model="filterDateRange"
        type="daterange"
        size="small"
        value-format="yyyy-MM-dd"
        :start-placeholder="$t('history.Filter Start')"
        :end-placeholder="$t('history.Filter End')"
        style="width:260px"
      />
      <el-input
        v-model="filterPartitionName"
        size="small"
        :placeholder="$t('history.Filter Partition Name')"
        suffix-icon="el-icon-search"
        clearable
        style="width:220px"
      />
      <el-button size="small" @click="checkAllFiltered">{{ $t('history.Check All Filtered') }} ({{ filteredRows.length }})</el-button>
      <el-button size="small" @click="uncheckAll">{{ $t('history.Uncheck All') }}</el-button>
    </div>

    <!-- Partition table -->
    <el-table
      ref="partTable"
      :data="pagedRows"
      v-loading="loading"
      row-key="partition"
      border
      style="width:100%"
      :max-height="tableMaxHeight"
      :row-class-name="() => 'part-row-clickable'"
      @selection-change="onSelectionChange"
      @row-click="handleRowClick"
    >
      <el-table-column type="selection" width="50" class-name="col-no-click" />
      <el-table-column type="expand" class-name="col-no-click hide-expand-col" width="1">
        <template #default="{ row }">
          <div class="ops-timeline">
            <div class="ops-header">
              <span class="ops-col-op">{{ $t('history.Operation') }}</span>
              <span class="ops-col-time">{{ $t('history.Trigger Time') }}</span>
              <span class="ops-col-status">{{ $t('history.Status') }}</span>
              <span class="ops-col-elapsed">{{ $t('history.Elapsed') }}</span>
              <span class="ops-col-size">{{ $t('history.Disk Size') }}</span>
              <span class="ops-col-rows">{{ $t('history.Rows') }}</span>
              <span class="ops-col-target">{{ $t('history.Target') }}</span>
              <span class="ops-col-msg">{{ $t('history.Notes') }}</span>
              <span class="ops-col-action"></span>
            </div>
            <div
              v-for="op in row.ops"
              :key="op.run_id + ':' + op.time"
              class="ops-row"
              @click="$emit('view-run', op.run_id)"
            >
              <span class="ops-col-op">
                <el-tag size="mini" :type="op.op === 'backup' ? 'primary' : 'info'">
                  {{ op.op === 'backup' ? $t('history.Op Backup') : $t('history.Op Restore') }}
                </el-tag>
              </span>
              <span class="ops-col-time muted ellipsis" :title="formatDate(op.time)">{{ formatDate(op.time) }}</span>
              <span class="ops-col-status">
                <el-tag size="mini" :type="statusType(op.status)" v-if="op.status !== 'interrupted'">{{ $t('history.Status ' + capitalize(op.status)) }}</el-tag>
                <el-tag v-else size="mini" color="#ED8936" style="color:white;border-color:#ED8936">{{ $t('history.Status Interrupted') }}</el-tag>
              </span>
              <span class="ops-col-elapsed muted">{{ formatElapsed(op.elapsed) }}</span>
              <span class="ops-col-size muted">{{ formatBytes(op.size) }}</span>
              <span class="ops-col-rows muted">{{ formatNumber(op.rows) }}</span>
              <span class="ops-col-target">
                <el-tooltip v-if="op.target" :content="op.target.label" placement="top">
                  <el-tag size="mini" :type="op.target.kind === 's3' ? 'warning' : 'success'" class="ellipsis-tag">
                    {{ op.target.label }}
                  </el-tag>
                </el-tooltip>
                <span v-else class="muted">—</span>
              </span>
              <span class="ops-col-msg muted ellipsis" :title="op.msg || ''">{{ op.msg || '—' }}</span>
              <span class="ops-col-action">
                <el-button type="text" size="mini" @click.stop="$emit('view-run', op.run_id)">{{ $t('history.View') }}</el-button>
              </span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="partition" :label="$t('history.Partition')" min-width="140" sortable show-overflow-tooltip>
        <template #default="{ row }"><span class="mono">{{ row.partition }}</span></template>
      </el-table-column>
      <el-table-column :label="$t('history.Disk Size')" width="110" sortable :sort-method="(a, b) => (a.size || 0) - (b.size || 0)">
        <template #default="{ row }">{{ formatBytes(row.size) }}</template>
      </el-table-column>
      <el-table-column :label="$t('history.Rows')" width="110" sortable :sort-method="(a, b) => (a.rows || 0) - (b.rows || 0)">
        <template #default="{ row }">{{ formatNumber(row.rows) }}</template>
      </el-table-column>
      <el-table-column :label="$t('history.Latest Backup')" min-width="180" sortable :sort-method="sortByLatestBackup" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="muted" v-if="row.latestBackup">{{ formatDate(row.latestBackup.time) }}</span>
          <span class="muted" v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Target')" min-width="160">
        <template #default="{ row }">
          <el-tooltip
            v-if="row.latestBackup && row.latestBackup.target"
            :content="row.latestBackup.target.label"
            placement="top"
          >
            <el-tag size="mini" :type="row.latestBackup.target.kind === 's3' ? 'warning' : 'success'" class="ellipsis-tag">
              {{ row.latestBackup.target.label }}
            </el-tag>
          </el-tooltip>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Latest Restore')" min-width="180" sortable :sort-method="sortByLatestRestore" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="muted" v-if="row.latestRestore">{{ formatDate(row.latestRestore.time) }}</span>
          <span class="muted" v-else>—</span>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="filteredRows.length > 0"
      class="part-pagination"
      :current-page.sync="currentPage"
      :page-size.sync="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="filteredRows.length"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="currentPage = 1"
    />

    <!-- Summary + Footer -->
    <div class="summary">
      {{ $t('history.Partition Summary', { selected: selectedPartitions.length, total: partitionRows.length, runs: involvedRunCount }) }}
    </div>

    <span slot="footer">
      <el-button @click="$emit('input', false)">{{ $t('history.Close') }}</el-button>
      <el-button type="primary" :disabled="selectedPartitions.length === 0" @click="onRestoreSelected">
        {{ $t('history.Restore Selected Partitions Count', { count: selectedPartitions.length }) }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { DataManageApi } from '@/apis';

export default {
  name: 'PartitionListDialog',
  model: { prop: 'value', event: 'input' },
  props: {
    value: { type: Boolean, default: false },
    policy: { type: Object, default: null },
    policies: { type: Array, default: () => [] },
  },
  data() {
    return {
      runs: [],
      loading: false,
      filterDateRange: null,
      filterPartitionName: '',
      selectedPartitions: [],
      currentPage: 1,
      pageSize: 10,
      viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
    };
  },
  computed: {
    tableLabel() {
      return this.policy ? `${this.policy.database}.${this.policy.table}` : '';
    },
    policyById() {
      const map = {};
      for (const p of this.policies) map[p.policy_id] = p;
      return map;
    },
    partitionRows() {
      const map = {};
      for (const run of this.runs) {
        const target = this.targetOfPolicy(this.policyById[run.policy_id]);
        for (const p of (run.partitions || [])) {
          if (!map[p.partition]) {
            map[p.partition] = { partition: p.partition, ops: [], size: p.size || 0, rows: p.rows || 0, latestBackup: null, latestRestore: null };
          }
          const op = {
            op: run.operation,
            time: run.started_at || run.create_time,
            status: p.status,
            size: p.size || 0,
            rows: p.rows || 0,
            elapsed: p.elapsed || 0,
            run_id: run.run_id,
            policy_id: run.policy_id,
            target,
            msg: p.msg,
          };
          map[p.partition].ops.push(op);
          if (run.operation === 'backup' && p.status === 'success') {
            if (!map[p.partition].latestBackup || op.time > map[p.partition].latestBackup.time) {
              map[p.partition].latestBackup = op;
            }
          }
          if (run.operation === 'restore' && p.status === 'success') {
            if (!map[p.partition].latestRestore || op.time > map[p.partition].latestRestore.time) {
              map[p.partition].latestRestore = op;
            }
          }
          if (op.size && (!map[p.partition].size || op.size > map[p.partition].size)) {
            map[p.partition].size = op.size;
          }
          if (op.rows && (!map[p.partition].rows || op.rows > map[p.partition].rows)) {
            map[p.partition].rows = op.rows;
          }
        }
      }
      for (const v of Object.values(map)) {
        v.ops.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
      }
      return Object.values(map).sort((a, b) => (b.partition || '').localeCompare(a.partition || ''));
    },
    filteredRows() {
      return this.partitionRows.filter(r => {
        if (this.filterPartitionName && !r.partition.toLowerCase().includes(this.filterPartitionName.toLowerCase())) return false;
        if (this.filterDateRange && this.filterDateRange.length === 2) {
          const partDate = this.parsePartitionDate(r.partition);
          if (!partDate) return false;
          const [start, end] = this.filterDateRange;
          if (start && partDate < start) return false;
          if (end && partDate > end) return false;
        }
        return true;
      });
    },
    pagedRows() {
      const s = (this.currentPage - 1) * this.pageSize;
      return this.filteredRows.slice(s, s + this.pageSize);
    },
    // dialog 内部高度大概是 viewport - title/padding/footer/filter/pagination ≈ viewport - 320
    tableMaxHeight() {
      return Math.max(240, this.viewportHeight - 320);
    },
    involvedRunCount() {
      const runs = new Set();
      for (const partName of this.selectedPartitions) {
        const row = this.partitionRows.find(r => r.partition === partName);
        if (row && row.latestBackup) runs.add(row.latestBackup.run_id);
      }
      return runs.size;
    },
  },
  watch: {
    filterDateRange() { this.currentPage = 1; },
    filterPartitionName() { this.currentPage = 1; },
    pagedRows() { this.$nextTick(() => this.syncTableSelection()); },
  },
  mounted() {
    this.onResize = () => { this.viewportHeight = window.innerHeight; };
    window.addEventListener('resize', this.onResize);
  },
  beforeDestroy() {
    if (this.onResize) window.removeEventListener('resize', this.onResize);
  },
  methods: {
    onOpened() {
      if (this.policy) this.fetchRuns();
    },
    onClosed() {
      this.runs = [];
      this.selectedPartitions = [];
      this.filterDateRange = null;
      this.filterPartitionName = '';
      this.currentPage = 1;
    },
    async fetchRuns() {
      this.loading = true;
      try {
        const res = await DataManageApi.listRunsByTable(this.policy.cluster_name, this.policy.database, this.policy.table, 365);
        if (res.data.retCode === '0000') {
          this.runs = res.data.entity || [];
        }
      } finally {
        this.loading = false;
      }
    },
    onSelectionChange(rows) {
      // 分页后 el-table 只感知当前页选择，需要合并保留其他页已选项
      const onPage = new Set(this.pagedRows.map(r => r.partition));
      const newOnPage = rows.map(r => r.partition);
      const kept = this.selectedPartitions.filter(p => !onPage.has(p));
      this.selectedPartitions = [...kept, ...newOnPage];
    },
    handleRowClick(row, column) {
      if (!column) return;
      if ((column.className || '').includes('col-no-click')) return;
      this.$refs.partTable.toggleRowExpansion(row);
    },
    checkAllFiltered() {
      // 一键选中筛选结果（跨页），不依赖当前页 el-table 状态
      this.selectedPartitions = this.filteredRows.map(r => r.partition);
      this.$nextTick(() => this.syncTableSelection());
    },
    uncheckAll() {
      this.selectedPartitions = [];
      this.$nextTick(() => {
        if (this.$refs.partTable) this.$refs.partTable.clearSelection();
      });
    },
    syncTableSelection() {
      if (!this.$refs.partTable) return;
      const sel = new Set(this.selectedPartitions);
      this.$refs.partTable.clearSelection();
      for (const row of this.pagedRows) {
        if (sel.has(row.partition)) {
          this.$refs.partTable.toggleRowSelection(row, true);
        }
      }
    },
    onRestoreSelected() {
      const groups = new Map();
      for (const partName of this.selectedPartitions) {
        const row = this.partitionRows.find(r => r.partition === partName);
        if (!row || !row.latestBackup) continue;
        const runId = row.latestBackup.run_id;
        if (!groups.has(runId)) groups.set(runId, []);
        groups.get(runId).push(partName);
      }
      const items = [...groups.entries()].map(([run_id, partitions]) => ({ run_id, partitions }));
      this.$emit('restore-partitions', { cluster: this.policy.cluster_name, items });
      this.$emit('input', false);
    },
    parsePartitionDate(name) {
      let m = name.match(/^(\d{4})(\d{2})(\d{2})$/);
      if (m) return `${m[1]}-${m[2]}-${m[3]}`;
      m = name.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) return name;
      return null;
    },
    sortByLatestBackup(a, b) {
      const ta = (a.latestBackup && a.latestBackup.time) || '';
      const tb = (b.latestBackup && b.latestBackup.time) || '';
      return ta.localeCompare(tb);
    },
    sortByLatestRestore(a, b) {
      const ta = (a.latestRestore && a.latestRestore.time) || '';
      const tb = (b.latestRestore && b.latestRestore.time) || '';
      return ta.localeCompare(tb);
    },
    capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; },
    statusType(s) {
      switch (s) {
        case 'success': return 'success';
        case 'failed': return 'danger';
        case 'running': return 'primary';
        case 'waiting': return 'info';
        default: return 'info';
      }
    },
    formatDate(s) {
      if (!s || s === '0001-01-01T00:00:00Z') return '—';
      const d = new Date(s);
      return isNaN(d.getTime()) ? s : d.toLocaleString('zh-CN', { hour12: false });
    },
    formatElapsed(sec) {
      if (!sec || sec <= 0) return '—';
      if (sec < 60) return sec + 's';
      if (sec < 3600) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return s ? `${m}m ${s}s` : `${m}m`;
      }
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      return m ? `${h}h ${m}m` : `${h}h`;
    },
    targetOfPolicy(p) {
      if (!p) return null;
      if (p.target_type === 's3') {
        const bucket = p.s3 && p.s3.bucket;
        return { kind: 's3', label: bucket ? `S3 / ${bucket}` : 'S3' };
      }
      if (p.target_type === 'local') {
        const path = p.local && p.local.path;
        return { kind: 'local', label: path ? `Local / ${path}` : 'Local' };
      }
      return null;
    },
    formatBytes(b) {
      if (!b || b === 0) return '—';
      if (b < 1024) return b + ' B';
      if (b < 1048576) return (b / 1024).toFixed(2) + ' KB';
      if (b < 1073741824) return (b / 1048576).toFixed(2) + ' MB';
      return (b / 1073741824).toFixed(2) + ' GB';
    },
    formatNumber(n) {
      if (!n || n === 0) return '—';
      return Number(n).toLocaleString();
    },
  },
};
</script>

<style scoped>
.filter-toolbar { display:flex; gap:8px; align-items:center; margin-bottom:12px; flex-wrap:wrap; }
.part-row-clickable { cursor: pointer; }
.part-row-clickable .col-no-click { cursor: default; }
.part-pagination { margin-top: 10px; text-align: right; }
::v-deep .hide-expand-col { padding: 0; }
::v-deep .el-table__expand-icon { display: none; }
.summary { margin-top: 10px; font-size: 12px; color: #909399; }
.mono { font-family: ui-monospace, Menlo, Consolas, monospace; }
.ops-timeline { padding: 8px 16px; background: #FDF7DD; border-left: 3px solid #C9A100; }
.ops-header, .ops-row {
  display: grid;
  grid-template-columns: 60px 150px 70px 60px 80px 90px 150px 1fr 60px;
  gap: 6px;
  padding: 6px 8px;
  font-size: 12.5px;
  align-items: center;
}
.ops-header { color: #909399; font-size: 12px; font-weight: 500; }
.ops-row { cursor: pointer; border-radius: 3px; }
.ops-row:hover { background: rgba(255,255,255,0.7); }
.muted { color: #909399; }
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ellipsis-tag {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
