<template>
  <div class="table-list">
    <div class="toolbar">
      <el-input v-model="searchKey" size="small" style="width:280px" :placeholder="$t('history.Search Table')" suffix-icon="el-icon-search" clearable />
      <div style="flex:1" />
      <el-button size="small" icon="el-icon-refresh" :loading="loading" @click="$emit('refresh')">{{ $t('history.Refresh') }}</el-button>
    </div>

    <el-table
      :data="pagedRows"
      v-loading="loading"
      row-key="policy_id"
      border
      style="width:100%"
      :row-class-name="() => 'table-row-clickable'"
      @row-click="handleRowClick"
    >
      <el-table-column :label="$t('history.Database Table')" min-width="240">
        <template #default="{ row }">
          <i class="el-icon-tickets" style="color:#C9A100;margin-right:6px" />
          <span class="table-name">{{ row.database }}.{{ row.table }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Belong Task')" min-width="180">
        <template #default="{ row }">
          <span class="muted">{{ taskNameOf(row) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Latest Backup')" min-width="180">
        <template #default="{ row }">
          <template v-if="metaMap[row.policy_id] && metaMap[row.policy_id].latestBackup">
            <span class="muted">{{ formatDate(metaMap[row.policy_id].latestBackup.time) }}</span>
            <el-tag size="mini" type="success" style="margin-left:6px">{{ $t('history.Status Success') }}</el-tag>
          </template>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Latest Restore')" min-width="180">
        <template #default="{ row }">
          <template v-if="metaMap[row.policy_id] && metaMap[row.policy_id].latestRestore">
            <span class="muted">{{ formatDate(metaMap[row.policy_id].latestRestore.time) }}</span>
            <el-tag size="mini" type="info" style="margin-left:6px">{{ $t('history.Status Success') }}</el-tag>
          </template>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Partitions Count Label')" width="100">
        <template #default="{ row }">
          <span class="muted">{{ metaMap[row.policy_id] ? metaMap[row.policy_id].partitionCount : '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Actions')" width="120" fixed="right" class-name="col-no-click">
        <template #default="{ row }">
          <el-button type="text" size="mini" @click="$emit('view-table', row)">{{ $t('history.View Partitions') }}</el-button>
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
    rows() {
      return this.policies.filter(p => !p.deleted);
    },
    filteredRows() {
      if (!this.searchKey) return this.rows;
      const q = this.searchKey.toLowerCase();
      return this.rows.filter(p => `${p.database}.${p.table}`.toLowerCase().includes(q));
    },
    pagedRows() {
      const s = (this.currentPage - 1) * this.pageSize;
      return this.filteredRows.slice(s, s + this.pageSize);
    },
  },
  watch: {
    policies: {
      handler(newPolicies) {
        for (const p of newPolicies) this.fetchPolicyMeta(p.policy_id);
      },
      immediate: true,
    },
    searchKey() { this.currentPage = 1; },
  },
  methods: {
    async fetchPolicyMeta(policyId) {
      try {
        const res = await DataManageApi.listRunsByPolicy(policyId, { limit: 30 });
        if (res.data.retCode === '0000') {
          const runs = res.data.entity || [];
          let latestBackup = null, latestRestore = null;
          const parts = new Set();
          for (const r of runs) {
            const time = r.start_time || r.create_time;
            if (r.operation === 'backup' && r.status === 'success') {
              if (!latestBackup || time > latestBackup.time) latestBackup = { time, run_id: r.run_id };
            }
            if (r.operation === 'restore' && r.status === 'success') {
              if (!latestRestore || time > latestRestore.time) latestRestore = { time, run_id: r.run_id };
            }
            for (const p of (r.partitions || [])) parts.add(p.partition);
          }
          this.$set(this.metaMap, policyId, { latestBackup, latestRestore, partitionCount: parts.size });
        }
      } catch { /* silent */ }
    },
    taskNameOf(p) {
      return p.task_name || `${p.database}.${p.table}`;
    },
    handleRowClick(row, column) {
      if (!column) return;
      if ((column.className || '').includes('col-no-click')) return;
      this.$emit('view-table', row);
    },
    formatDate(s) {
      if (!s || s === '0001-01-01T00:00:00Z') return '—';
      const d = new Date(s);
      return isNaN(d.getTime()) ? s : d.toLocaleString('zh-CN', { hour12: false });
    },
  },
};
</script>

<style scoped>
.toolbar { display:flex; gap:10px; align-items:center; margin-bottom:14px; flex-wrap:wrap; }
.table-row-clickable { cursor: pointer; }
.table-row-clickable .col-no-click { cursor: default; }
.table-name { font-weight: 500; }
.muted { color: #909399; }
.table-pagination { margin-top: 12px; text-align: right; }
</style>
