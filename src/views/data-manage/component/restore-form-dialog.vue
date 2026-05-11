<template>
  <el-dialog
    :visible="value"
    :title="$t('restore.New Restore')"
    width="880px"
    :close-on-click-modal="false"
    @update:visible="$emit('input', $event)"
    @opened="onOpened"
    @closed="onClosed"
  >
    <el-form ref="form" :model="form" label-width="120px" size="small">

      <!-- Section 1: 目标 -->
      <div class="form-section">
        <div class="form-section-title"><span class="section-num">1</span>{{ $t('restore.Target') }}</div>
        <div class="form-row">
          <label class="form-label">{{ $t('restore.Cluster') }}</label>
          <span class="cluster-tag">{{ cluster }}</span>
        </div>
      </div>

      <!-- Section 2: 恢复范围 -->
      <div class="form-section">
        <div class="form-section-title"><span class="section-num">2</span>{{ $t('restore.Restore Range') }}</div>

        <div class="form-row">
          <label class="form-label">{{ $t('restore.Restore Date Range') }}</label>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            :range-separator="$t('restore.To')"
            :start-placeholder="$t('restore.Start Date')"
            :end-placeholder="$t('restore.End Date')"
            value-format="yyyy-MM-dd"
            style="width: 360px"
            @change="onRangeChange"
          />
        </div>

        <div class="form-row" style="margin-top: 14px">
          <label class="form-label">{{ $t('restore.Database') }}</label>
          <el-input
            v-model="selectedDatabase"
            :placeholder="$t('restore.Enter Database')"
            style="width: 220px"
            @change="onDatabaseChange"
          />
        </div>

        <div class="form-row" style="margin-top: 14px">
          <label class="form-label">{{ $t('restore.Tables') }}</label>
          <el-select
            v-model="selectedTables"
            multiple
            filterable
            :allow-create="tablesFallback"
            default-first-option
            :placeholder="$t('restore.Search Tables')"
            style="width: 460px"
            :loading="tablesLoading"
            @change="onTablesChange"
          >
            <template v-if="!tablesFallback">
              <el-option
                v-for="tbl in tableList"
                :key="tbl.name"
                :label="tbl.name"
                :value="tbl.name"
              >
                <div class="ms-row-option">
                  <span class="ms-option-name">{{ tbl.name }}</span>
                  <span :class="['partition-tag', partitionTagClass(tbl.partition_format)]">
                    {{ partitionTagLabel(tbl.partition_format) }}
                  </span>
                  <span class="ms-option-size">{{ formatBytes(tbl.total_bytes) }}</span>
                </div>
              </el-option>
            </template>
          </el-select>
        </div>
      </div>

      <!-- Section 3: 来源 runs 预览 -->
      <div class="form-section">
        <div class="form-section-title">
          <span class="section-num">3</span>{{ $t('restore.Source Runs Preview') }}
          <el-button
            v-if="selectedTables.length > 0 && selectedDatabase"
            size="mini"
            :loading="runsLoading"
            icon="el-icon-search"
            style="margin-left: 12px"
            @click="fetchSourceRuns"
          >{{ $t('restore.Load Runs') }}</el-button>
        </div>

        <div v-if="runsLoading" class="section-hint">
          <i class="el-icon-loading" /> {{ $t('restore.Loading Runs') }}
        </div>

        <template v-else-if="runsLoaded">
          <div v-if="totalRunCount > 0" class="source-summary">
            {{ $t('restore.Source Found', { tables: tableRunMap.size, runs: totalRunCount, parts: totalPartitionCount }) }}
          </div>
          <div v-else class="warn-hint">
            {{ $t('restore.Source Empty All') }}
          </div>

          <div v-for="warn in tableWarnings" :key="warn" class="warn-hint" style="margin-top: 6px">
            {{ warn }}
          </div>
        </template>

        <div v-else class="section-hint muted">
          {{ $t('restore.Source Hint') }}
        </div>
      </div>

      <!-- Section 4: 分区预览树 -->
      <div class="form-section">
        <div class="form-section-title"><span class="section-num">4</span>{{ $t('restore.Restore Preview') }}</div>

        <div v-if="treeData.length === 0" class="section-hint muted">
          {{ $t('restore.Preview Hint') }}
        </div>

        <template v-else>
          <!-- partition filter toolbar -->
          <div class="partition-filter">
            <el-date-picker
              v-model="filterDateRange"
              type="daterange"
              :start-placeholder="$t('restore.Filter Start')"
              :end-placeholder="$t('restore.Filter End')"
              size="small"
              value-format="yyyy-MM-dd"
              style="width: 260px"
            />
            <el-input
              v-model="filterPartitionName"
              size="small"
              :placeholder="$t('restore.Filter Partition Name')"
              suffix-icon="el-icon-search"
              clearable
              style="width: 200px; margin-left: 8px"
            />
            <el-button size="small" @click="checkAllFiltered" style="margin-left: 8px">
              {{ $t('restore.Check All Filtered') }} ({{ filteredPartitionCount }})
            </el-button>
            <el-button size="small" @click="uncheckAll">
              {{ $t('restore.Uncheck All') }}
            </el-button>
          </div>

          <el-tree
            ref="partitionTree"
            :data="treeData"
            show-checkbox
            default-expand-all
            node-key="id"
            :default-checked-keys="defaultCheckedKeys"
            :filter-node-method="filterTreeNode"
            @check="onTreeCheck"
            class="partition-tree"
          >
            <template #default="{ node, data }">
              <span :class="['tree-node', data.level]">
                <i v-if="data.level === 'table'" class="el-icon-files" style="margin-right: 4px; color: #C9A100" />
                <i v-else-if="data.level === 'run'" class="el-icon-document" style="margin-right: 4px; color: #909399" />
                <i v-else class="el-icon-paperclip" style="margin-right: 4px; color: #67C23A" />
                {{ data.label }}
              </span>
            </template>
          </el-tree>
        </template>
      </div>

      <!-- Section 5: 执行摘要 -->
      <div class="form-section" style="border-bottom: none; margin-bottom: 0">
        <div class="form-section-title"><span class="section-num">5</span>{{ $t('restore.Execute') }}</div>

        <div v-if="submitPlan.length > 0" class="submit-summary">
          {{ $t('restore.Will Submit', { count: submitPlan.length, tables: uniqueSubmitTables }) }}
        </div>
        <div v-else class="section-hint muted">
          {{ $t('restore.Submit Hint') }}
        </div>
      </div>

    </el-form>

    <span slot="footer">
      <el-button @click="$emit('input', false)">{{ $t('history.Cancel') }}</el-button>
      <el-button
        type="primary"
        :disabled="submitPlan.length === 0"
        :loading="submitLoading"
        @click="onSubmit"
      >
        {{ $t('restore.Restore Submit') }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { DataManageApi } from '@/apis';

export default {
  name: 'RestoreFormDialog',
  model: { prop: 'value', event: 'input' },
  props: {
    value: { type: Boolean, default: false },
    cluster: { type: String, required: true },
    initDatabase: { type: String, default: '' },
    initTable: { type: String, default: '' },
    initSourceRunId: { type: String, default: '' },
  },
  data() {
    return this.emptyState();
  },
  computed: {
    totalRunCount() {
      let count = 0;
      this.tableRunMap.forEach(runs => { count += runs.length; });
      return count;
    },
    totalPartitionCount() {
      let count = 0;
      this.tableRunMap.forEach(runs => {
        runs.forEach(run => {
          count += (run.partitions || []).length;
        });
      });
      return count;
    },
    // Build submit plan: array of { source_run_id, partitions: string[] }
    submitPlan() {
      const plan = [];
      for (const [runId, partSet] of Object.entries(this.checkedPartitions)) {
        const parts = Array.from(partSet);
        if (parts.length > 0) {
          plan.push({ source_run_id: runId, partitions: parts });
        }
      }
      return plan;
    },
    uniqueSubmitTables() {
      // Count unique tables covered by submit plan
      const tables = new Set();
      for (const item of this.submitPlan) {
        // Find which table this run belongs to
        for (const [table, runs] of this.tableRunMap.entries()) {
          if (runs.some(r => r.run_id === item.source_run_id)) {
            tables.add(table);
            break;
          }
        }
      }
      return tables.size;
    },
    filteredPartitionCount() {
      return this.collectFilteredPartitionIds().length;
    },
  },
  watch: {
    filterDateRange() { this.applyTreeFilter(); },
    filterPartitionName() { this.applyTreeFilter(); },
    tableList(newList) {
      if (this.initTable && newList.some(t => t.name === this.initTable)) {
        if (!this.selectedTables.includes(this.initTable)) {
          this.selectedTables = [...this.selectedTables, this.initTable];
        }
      }
    },
  },
  methods: {
    // ── State factory ───────────────────────────────────────────
    emptyState() {
      const today = new Date();
      const past30 = new Date();
      past30.setDate(today.getDate() - 30);
      const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      return {
        // Section 2 state
        dateRange: [fmt(past30), fmt(today)],
        selectedDatabase: '',
        selectedTables: [],
        tableList: [],
        tablesLoading: false,
        tablesFallback: false,

        // Section 3 state
        runsLoading: false,
        runsLoaded: false,
        // Map: tableName -> BackupRun[] (filtered success + in date range)
        tableRunMap: new Map(),
        tableWarnings: [],

        // Section 4 state: tree
        treeData: [],
        defaultCheckedKeys: [],
        checkedPartitions: {}, // runId -> Set<partitionName>

        // Section 4 filter state
        filterDateRange: null,
        filterPartitionName: '',

        // Section 5 state
        submitLoading: false,
      };
    },

    // ── Dialog lifecycle ────────────────────────────────────────
    onOpened() {
      if (this.initDatabase) {
        this.selectedDatabase = this.initDatabase;
        this.fetchTableSummary();
      }
      // initTable is auto-selected via watch on tableList after fetchTableSummary completes
      // initSourceRunId is applied in buildTree() after fetchSourceRuns completes
    },

    onClosed() {
      Object.assign(this.$data, this.emptyState());
    },

    // ── Partition tag helpers ──────────────────────────────────
    partitionTagClass(format) {
      const map = { day: 'daily', month: 'month', hour: 'daily', custom: 'custom', none: 'none' };
      return map[format] || 'custom';
    },
    partitionTagLabel(format) {
      const map = {
        day: this.$t('backup.Partition Day'),
        month: this.$t('backup.Partition Month'),
        hour: this.$t('backup.Partition Hour'),
        custom: this.$t('backup.Partition Custom'),
        none: this.$t('backup.Partition None'),
      };
      return map[format] || (format || this.$t('backup.Partition Unknown'));
    },

    // ── Byte formatter ─────────────────────────────────────────
    formatBytes(bytes) {
      if (!bytes || bytes === 0) return '—';
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let val = bytes;
      let ui = 0;
      while (val >= 1024 && ui < units.length - 1) { val /= 1024; ui++; }
      return val.toFixed(1) + ' ' + units[ui];
    },

    // ── Fetch table summary ─────────────────────────────────────
    async fetchTableSummary() {
      if (!this.selectedDatabase || !this.selectedDatabase.trim()) {
        this.tableList = [];
        this.tablesFallback = false;
        return;
      }
      this.tablesLoading = true;
      try {
        const { data } = await DataManageApi.getTableSummary(this.cluster, this.selectedDatabase);
        if (data.retCode === '0000' && Array.isArray(data.entity) && data.entity.length > 0) {
          this.tableList = data.entity;
          this.tablesFallback = false;
        } else {
          this.tableList = [];
          this.tablesFallback = true;
        }
      } catch (err) {
        console.warn('getTableSummary failed, fallback to free input:', err);
        this.tableList = [];
        this.tablesFallback = true;
      } finally {
        this.tablesLoading = false;
      }
    },

    // ── Fetch source runs ───────────────────────────────────────
    async fetchSourceRuns() {
      if (!this.selectedDatabase || this.selectedTables.length === 0) {
        this.$message.warning(this.$t('restore.Please Select DB And Tables'));
        return;
      }
      if (!this.dateRange || this.dateRange.length < 2) {
        this.$message.warning(this.$t('restore.Please Select Date Range'));
        return;
      }

      this.runsLoading = true;
      this.runsLoaded = false;
      this.tableRunMap = new Map();
      this.tableWarnings = [];

      const [startStr, endStr] = this.dateRange;
      const startDate = new Date(startStr + 'T00:00:00');
      const endDate = new Date(endStr + 'T23:59:59');

      // Calculate days to cover from today back to startDate
      const today = new Date();
      const diffMs = today.getTime() - startDate.getTime();
      const days = Math.max(30, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);

      const promises = this.selectedTables.map(async (table) => {
        try {
          const res = await DataManageApi.listRunsByTable(
            this.cluster,
            this.selectedDatabase,
            table,
            days
          );
          if (res.data.retCode === '0000') {
            const allRuns = res.data.entity || [];
            // Filter: operation=backup, status=success, start_time in date range
            const filtered = allRuns.filter(run => {
              if (run.operation && run.operation !== 'backup') return false;
              if (run.status !== 'success') return false;
              const ts = run.start_time && run.start_time !== '0001-01-01T00:00:00Z'
                ? run.start_time
                : run.create_time;
              if (!ts) return false;
              const d = new Date(ts);
              return d >= startDate && d <= endDate;
            });
            return { table, runs: filtered };
          }
        } catch (e) {
          console.warn(`listRunsByTable error for ${table}:`, e);
        }
        return { table, runs: [] };
      });

      try {
        const results = await Promise.all(promises);
        const newMap = new Map();
        const warns = [];

        results.forEach(({ table, runs }) => {
          newMap.set(table, runs);
          if (runs.length === 0) {
            warns.push(this.$t('restore.Source Empty', { table }));
          }
        });

        this.tableRunMap = newMap;
        this.tableWarnings = warns;
        this.runsLoaded = true;
        this.buildTree();
      } finally {
        this.runsLoading = false;
      }
    },

    // ── Build tree data ─────────────────────────────────────────
    buildTree() {
      const tree = [];
      const allChecked = [];
      const initChecked = []; // only the initSourceRunId partitions
      const newChecked = {};

      this.tableRunMap.forEach((runs, table) => {
        if (runs.length === 0) return;

        const tableNode = {
          id: `table:${this.selectedDatabase}.${table}`,
          label: `${this.selectedDatabase}.${table} (${runs.length} runs, ${runs.reduce((s, r) => s + (r.partitions || []).length, 0)} partitions)`,
          level: 'table',
          children: [],
        };

        // Sort runs by start_time desc
        const sortedRuns = [...runs].sort((a, b) => {
          const ta = new Date(a.start_time || a.create_time || 0).getTime();
          const tb = new Date(b.start_time || b.create_time || 0).getTime();
          return tb - ta;
        });

        sortedRuns.forEach(run => {
          const partitions = run.partitions || [];
          const totalSize = partitions.reduce((s, p) => s + (p.size || 0), 0);
          const runLabel = `${this.formatShortDate(run.start_time || run.create_time)} success (${partitions.length} partitions${totalSize ? ', ' + this.formatBytes(totalSize) : ''})`;

          const runNode = {
            id: `run:${run.run_id}`,
            label: runLabel,
            level: 'run',
            runId: run.run_id,
            children: [],
          };

          newChecked[run.run_id] = new Set();

          partitions.forEach(part => {
            const partName = typeof part === 'string' ? part : (part.partition || part.name || String(part));
            const partSize = typeof part === 'object' ? (part.size || 0) : 0;
            const partStatus = typeof part === 'object' ? (part.status || '') : '';
            const partLabel = `${partName}${partStatus ? ' (' + partStatus + ')' : ''}${partSize ? ', ' + this.formatBytes(partSize) : ''}`;
            const partId = `part:${run.run_id}:${partName}`;

            runNode.children.push({
              id: partId,
              label: partLabel,
              level: 'partition',
              runId: run.run_id,
              partName,
            });

            allChecked.push(partId);

            // If initSourceRunId is set, only pre-check partitions from that run
            if (this.initSourceRunId && run.run_id === this.initSourceRunId) {
              initChecked.push(partId);
              newChecked[run.run_id].add(partName);
            } else if (!this.initSourceRunId) {
              // No filter: check all partitions by default
              newChecked[run.run_id].add(partName);
            }
          });

          tableNode.children.push(runNode);
        });

        tree.push(tableNode);
      });

      this.treeData = tree;

      if (this.initSourceRunId && initChecked.length > 0) {
        // Only pre-check the partitions from the target run
        this.defaultCheckedKeys = initChecked;
        this.checkedPartitions = newChecked;
      } else {
        // Default: check all partitions
        this.defaultCheckedKeys = allChecked;
        this.checkedPartitions = newChecked;
      }
    },

    // ── Tree check handler ──────────────────────────────────────
    onTreeCheck() {
      const checkedNodes = this.$refs.partitionTree.getCheckedNodes(false);
      const newChecked = {};

      checkedNodes.forEach(node => {
        if (node.level === 'partition') {
          const { runId, partName } = node;
          if (!newChecked[runId]) newChecked[runId] = new Set();
          newChecked[runId].add(partName);
        }
      });

      this.checkedPartitions = newChecked;
    },

    // ── Event handlers ──────────────────────────────────────────
    onRangeChange() {
      // Reset loaded state so user knows they need to reload
      this.runsLoaded = false;
      this.treeData = [];
      this.checkedPartitions = {};
    },

    onDatabaseChange() {
      this.selectedTables = [];
      this.tableList = [];
      this.tablesFallback = false;
      this.runsLoaded = false;
      this.treeData = [];
      this.checkedPartitions = {};
      this.fetchTableSummary();
    },

    onTablesChange() {
      this.runsLoaded = false;
      this.treeData = [];
      this.checkedPartitions = {};
    },

    // ── Date formatter ──────────────────────────────────────────
    formatShortDate(dateStr) {
      if (!dateStr || dateStr === '0001-01-01T00:00:00Z') return '—';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const M = d.getMonth() + 1;
        const D = d.getDate();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${M}/${D} ${hh}:${mm}`;
      } catch {
        return dateStr;
      }
    },

    // ── Partition filter methods ────────────────────────────────
    applyTreeFilter() {
      this.$nextTick(() => {
        if (this.$refs.partitionTree) {
          this.$refs.partitionTree.filter('__');
        }
      });
    },

    filterTreeNode(_, data) {
      if (!data.id || !data.id.startsWith('part:')) {
        return true;
      }
      const parts = data.id.split(':');
      const partitionName = parts[parts.length - 1];

      if (this.filterPartitionName) {
        if (!partitionName.toLowerCase().includes(this.filterPartitionName.toLowerCase())) {
          return false;
        }
      }
      if (this.filterDateRange && this.filterDateRange.length === 2) {
        const [start, end] = this.filterDateRange;
        const partitionDate = this.parsePartitionDate(partitionName);
        if (partitionDate) {
          if (start && partitionDate < start) return false;
          if (end && partitionDate > end) return false;
        } else {
          return false;
        }
      }
      return true;
    },

    parsePartitionDate(name) {
      let m = name.match(/^(\d{4})(\d{2})(\d{2})$/);
      if (m) return `${m[1]}-${m[2]}-${m[3]}`;
      m = name.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) return name;
      return null;
    },

    collectFilteredPartitionIds() {
      const ids = [];
      const walk = (nodes) => {
        for (const n of nodes) {
          if (n.id && n.id.startsWith('part:')) {
            if (this.filterTreeNode(null, n)) ids.push(n.id);
          } else if (n.children) {
            walk(n.children);
          }
        }
      };
      walk(this.treeData);
      return ids;
    },

    checkAllFiltered() {
      const ids = this.collectFilteredPartitionIds();
      this.$refs.partitionTree.setCheckedKeys(ids);
      this.onTreeCheck();
    },

    uncheckAll() {
      this.$refs.partitionTree.setCheckedKeys([]);
      this.onTreeCheck();
    },

    // ── Submit ──────────────────────────────────────────────────
    async onSubmit() {
      if (this.submitPlan.length === 0) {
        this.$message.warning(this.$t('restore.No Partitions Selected'));
        return;
      }

      this.submitLoading = true;

      const results = await Promise.allSettled(
        this.submitPlan.map(item =>
          DataManageApi.restoreData(this.cluster, {
            source_run_id: item.source_run_id,
            partitions: item.partitions,
          })
        )
      );

      this.submitLoading = false;

      const successResults = results.filter(
        r => r.status === 'fulfilled' && r.value && r.value.data && r.value.data.retCode === '0000'
      );
      const successCount = successResults.length;
      const failCount = results.length - successCount;

      const runIds = successResults
        .map(r => (r.value.data.entity && r.value.data.entity.run_id) || '')
        .filter(Boolean);

      if (failCount === 0) {
        this.$message.success(this.$t('restore.Restore Submitted Ok', { success: successCount }));
      } else {
        this.$message.warning(this.$t('restore.Restore Submitted Partial', { success: successCount, failed: failCount }));
      }

      this.$emit('submitted', runIds);
      this.$emit('input', false);
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app/variables.scss';

.form-section {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 16px;
  margin-bottom: 18px;

  &:last-of-type {
    border-bottom: none;
  }
}

.form-section-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 14px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-num {
  background: $primary-color;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-label {
  font-size: 13px;
  color: #606266;
  width: 100px;
  flex-shrink: 0;
  text-align: right;
}

.cluster-tag {
  display: inline-block;
  padding: 4px 12px;
  background: #FDF7DD;
  border: 1px solid #C9A100;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #7a6000;
}

.section-hint {
  font-size: 13px;
  color: #909399;
  padding: 8px 0;
}

.muted {
  color: #909399;
}

.source-summary {
  padding: 10px 14px;
  background: #f0f9eb;
  border: 1px solid #c2e7b0;
  border-radius: 4px;
  font-size: 13px;
  color: #2d6a1c;
  margin-bottom: 8px;
}

.warn-hint {
  margin-top: 6px;
  padding: 8px 10px;
  background: #fdf6ec;
  border: 1px solid #f5dab1;
  color: #ad6c00;
  border-radius: 3px;
  font-size: 12px;
  line-height: 1.5;
}

.partition-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  margin-bottom: 10px;
}

.partition-tree {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px;
  background: #fafafa;
  max-height: 360px;
  overflow-y: auto;
}

.tree-node {
  font-size: 13px;

  &.table {
    font-weight: 500;
    color: #303133;
  }

  &.run {
    color: #606266;
  }

  &.partition {
    color: #909399;
    font-size: 12px;
  }
}

.submit-summary {
  padding: 10px 14px;
  background: #FDF7DD;
  border: 1px solid #C9A100;
  border-radius: 4px;
  font-size: 13px;
  color: #7a6000;
  margin-bottom: 8px;
}

/* table option row in dropdown */
.ms-row-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.ms-option-name {
  flex: 1;
  color: #303133;
  font-size: 13px;
}

.ms-option-size {
  font-size: 11px;
  color: #909399;
  min-width: 60px;
  text-align: right;
}

/* partition-tag variants */
.partition-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 2px;
  text-align: center;
  white-space: nowrap;

  &.daily {
    background: #f0f9eb;
    color: #67C23A;
    border: 1px solid #c2e7b0;
  }

  &.month {
    background: #fdf6ec;
    color: #E6A23C;
    border: 1px solid #f5dab1;
  }

  &.none {
    background: #fef0f0;
    color: #F56C6C;
    border: 1px solid #fbc4c4;
  }

  &.custom {
    background: #f4f4f5;
    color: #909399;
    border: 1px solid #e9e9eb;
  }
}
</style>
