<template>
  <div class="table-list">
    <div class="toolbar">
      <el-input v-model="searchKey" size="small" style="width:280px" :placeholder="$t('history.Search Table')" suffix-icon="el-icon-search" clearable />
      <div style="flex:1" />
      <el-button size="small" icon="el-icon-refresh" :loading="loading" @click="$emit('refresh')">{{ $t('history.Refresh') }}</el-button>
      <el-tooltip :content="$t('history.Auto Refresh Tip')" placement="top">
        <span class="auto-refresh">
          <el-switch
            :value="autoRefresh"
            active-color="#C9A100"
            inactive-color="#c0c4cc"
            @change="$emit('update:auto-refresh', $event)"
          />
          <span class="ar-label">{{ $t('history.Auto Refresh') }}</span>
        </span>
      </el-tooltip>
    </div>

    <el-table
      :data="pagedRows"
      v-loading="loading"
      row-key="key"
      border
      style="width:100%"
      :row-class-name="() => 'table-row-clickable'"
      @row-click="handleRowClick"
    >
      <el-table-column :label="$t('history.Database Table')" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">
          <i class="el-icon-tickets" style="color:#C9A100;margin-right:6px" />
          <span class="table-name">{{ row.database }}.{{ row.table }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Belong Task')" min-width="220">
        <template #default="{ row }">
          <el-tooltip
            v-if="row.taskNames.length > 0"
            :content="row.taskNames.join(', ')"
            placement="top"
          >
            <span class="task-tags-line">
              <el-tag
                v-for="name in row.taskNames"
                :key="name"
                size="mini"
                type="info"
                class="task-tag"
              >
                {{ name }}
              </el-tag>
            </span>
          </el-tooltip>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Latest Backup')" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <template v-if="metaMap[row.key] && metaMap[row.key].latestBackup">
            <span class="muted">{{ formatDate(metaMap[row.key].latestBackup.time) }}</span>
            <el-tag
              size="mini"
              :type="statusType(metaMap[row.key].latestBackup.status)"
              style="margin-left:6px"
            >
              {{ $t('history.Status ' + capitalize(metaMap[row.key].latestBackup.status)) }}
            </el-tag>
          </template>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Latest Restore')" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <template v-if="metaMap[row.key] && metaMap[row.key].latestRestore">
            <span class="muted">{{ formatDate(metaMap[row.key].latestRestore.time) }}</span>
            <el-tag
              size="mini"
              :type="statusType(metaMap[row.key].latestRestore.status)"
              style="margin-left:6px"
            >
              {{ $t('history.Status ' + capitalize(metaMap[row.key].latestRestore.status)) }}
            </el-tag>
          </template>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Partitions Count Label')" width="100">
        <template #default="{ row }">
          <span class="muted">{{ metaMap[row.key] ? metaMap[row.key].partitionCount : '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Actions')" width="120" fixed="right" class-name="col-no-click">
        <template #default="{ row }">
          <el-button type="text" size="mini" @click="$emit('view-table', toViewPolicy(row))">{{ $t('history.View Partitions') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="filteredRows.length > 0"
      class="table-pagination"
      :current-page.sync="currentPage"
      :page-size.sync="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="filteredRows.length"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="currentPage = 1"
    />
  </div>
</template>

<script>
import { DataManageApi } from '@/apis';

export default {
  name: 'TableList',
  props: {
    policies: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    autoRefresh: { type: Boolean, default: false },
  },
  data() {
    return {
      searchKey: '',
      currentPage: 1,
      pageSize: 20,
      metaMap: {},
    };
  },
  computed: {
    // 按 cluster.db.table 聚合 policies，一张表一行
    aggregatedRows() {
      const map = new Map();
      for (const p of this.policies) {
        if (p.deleted) continue;
        const key = `${p.cluster_name}.${p.database}.${p.table}`;
        if (!map.has(key)) {
          map.set(key, {
            key,
            cluster_name: p.cluster_name,
            database: p.database,
            table: p.table,
            policies: [],
            taskNames: [],
          });
        }
        map.get(key).policies.push(p);
      }
      for (const row of map.values()) {
        const names = new Set();
        for (const p of row.policies) {
          names.add(p.task_name || `${p.database}.${p.table}`);
        }
        row.taskNames = [...names];
      }
      return [...map.values()];
    },
    filteredRows() {
      if (!this.searchKey) return this.aggregatedRows;
      const q = this.searchKey.toLowerCase();
      return this.aggregatedRows.filter(r => `${r.database}.${r.table}`.toLowerCase().includes(q));
    },
    pagedRows() {
      const s = (this.currentPage - 1) * this.pageSize;
      return this.filteredRows.slice(s, s + this.pageSize);
    },
  },
  watch: {
    aggregatedRows: {
      handler(rows) {
        for (const r of rows) this.fetchTableMeta(r);
      },
      immediate: true,
    },
    searchKey() { this.currentPage = 1; },
  },
  methods: {
    async fetchTableMeta(row) {
      try {
        const res = await DataManageApi.listRunsByTable(row.cluster_name, row.database, row.table, 365);
        if (res.data.retCode === '0000') {
          const runs = res.data.entity || [];
          // 真实最近一次（任意状态），各自维度独立比较
          let latestBackup = null, latestRestore = null;
          const parts = new Set();
          for (const r of runs) {
            const time = r.started_at || r.start_time || r.create_time;
            if (r.operation === 'backup') {
              if (!latestBackup || time > latestBackup.time) latestBackup = { time, run_id: r.run_id, status: r.status };
            }
            if (r.operation === 'restore') {
              if (!latestRestore || time > latestRestore.time) latestRestore = { time, run_id: r.run_id, status: r.status };
            }
            // 仅成功 run 的 partition 计入「分区数」（用户视角是「可恢复的分区」）
            if (r.status === 'success') {
              for (const p of (r.partitions || [])) parts.add(p.partition);
            }
          }
          this.$set(this.metaMap, row.key, { latestBackup, latestRestore, partitionCount: parts.size });
        }
      } catch { /* silent */ }
    },
    toViewPolicy(row) {
      // partition-list-dialog 只读 cluster_name / database / table，构造一个最小 policy
      return {
        cluster_name: row.cluster_name,
        database: row.database,
        table: row.table,
      };
    },
    handleRowClick(row, column) {
      if (!column) return;
      if ((column.className || '').includes('col-no-click')) return;
      this.$emit('view-table', this.toViewPolicy(row));
    },
    formatDate(s) {
      if (!s || s === '0001-01-01T00:00:00Z') return '—';
      const d = new Date(s);
      return isNaN(d.getTime()) ? s : d.toLocaleString('zh-CN', { hour12: false });
    },
    capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; },
    statusType(s) {
      switch (s) {
        case 'success': return 'success';
        case 'failed': return 'danger';
        case 'running': return 'primary';
        case 'queued': return 'info';
        case 'skipped': return 'warning';
        case 'interrupted': return 'warning';
        default: return 'info';
      }
    },
  },
};
</script>

<style scoped>
.toolbar { display:flex; gap:10px; align-items:center; margin-bottom:14px; flex-wrap:wrap; }
.auto-refresh { display:inline-flex; align-items:center; gap:6px; }
.ar-label { font-size: 12px; color: #606266; }
.table-row-clickable { cursor: pointer; }
.table-row-clickable .col-no-click { cursor: default; }
.table-name { font-weight: 500; }
.muted { color: #909399; }
.task-tag { margin-right: 4px; }
.task-tags-line {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
.table-pagination { margin-top: 12px; text-align: right; }
</style>
