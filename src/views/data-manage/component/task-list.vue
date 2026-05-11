<template>
  <div class="task-list">
    <div class="toolbar">
      <el-select v-model="filterEnabled" size="small" style="width:120px">
        <el-option :label="$t('history.All Status')" value="all" />
        <el-option :label="$t('history.Enabled')" value="enabled" />
        <el-option :label="$t('history.Disabled')" value="disabled" />
      </el-select>
      <el-input v-model="searchKey" size="small" style="width:240px" :placeholder="$t('history.Search Task Or Table')" suffix-icon="el-icon-search" clearable />
      <div style="flex:1" />
      <el-button type="primary" size="small" icon="el-icon-plus" @click="$emit('go-backup')">{{ $t('history.New Backup') }}</el-button>
      <el-button size="small" icon="el-icon-refresh-left" @click="$emit('go-restore')">{{ $t('history.New Restore') }}</el-button>
      <el-button size="small" icon="el-icon-refresh" :loading="loading" @click="$emit('refresh')">{{ $t('history.Refresh') }}</el-button>
    </div>

    <el-table
      :data="pagedTasks"
      v-loading="loading"
      row-key="task_id"
      border
      style="width:100%"
      :row-class-name="() => 'task-row-clickable'"
      @row-click="handleRowClick"
    >
      <el-table-column :label="$t('history.Task Name')" min-width="240">
        <template #default="{ row: t }">
          <i class="el-icon-folder" style="color:#C9A100;margin-right:6px" />
          <span class="task-name">{{ displayName(t) }}</span>
          <el-tag v-if="t.mixedEnabled" size="mini" type="warning" style="margin-left:6px">mixed</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Schedule Type')" width="80">
        <template #default="{ row: t }">
          {{ t.schedule_type === 'scheduled' ? $t('history.Schedule Scheduled') : $t('history.Schedule Immediate') }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Cron Instance')" min-width="180">
        <template #default="{ row: t }">
          <span class="muted" v-if="t.schedule_type === 'scheduled'">{{ t.crontab }} · {{ t.instance || '—' }}</span>
          <span class="muted" v-else>— · {{ t.instance || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Tables Count Label')" width="80">
        <template #default="{ row: t }">
          <span class="muted">{{ $t('history.Tables Count', { count: t.policies.length }) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Enabled')" width="80" class-name="col-no-click">
        <template #default="{ row: t }">
          <el-switch
            v-if="t.schedule_type === 'scheduled'"
            :value="t.enabled"
            :loading="!!t.toggling"
            :disabled="!!t.toggling"
            active-color="#C9A100"
            inactive-color="#c0c4cc"
            @change="toggleTaskEnabled(t)"
          />
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Latest Run')" min-width="180">
        <template #default="{ row: t }">
          <template v-if="taskLatestRun(t)">
            <span class="muted" style="margin-right:6px">{{ formatDate(taskLatestRun(t).start_time || taskLatestRun(t).create_time) }}</span>
            <el-tag :type="statusType(taskLatestRun(t).status)" size="mini" v-if="taskLatestRun(t).status !== 'interrupted'">
              {{ $t('history.Status ' + capitalize(taskLatestRun(t).status)) }}
            </el-tag>
          </template>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('history.Actions')" width="200" fixed="right" class-name="col-no-click">
        <template #default="{ row: t }">
          <el-button type="text" size="mini" @click="triggerTask(t)" v-if="t.schedule_type === 'scheduled'">{{ $t('history.Trigger Now') }}</el-button>
          <el-button type="text" size="mini" style="color:#F56C6C" @click="deleteTask(t)">{{ $t('history.Delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="filteredTasks.length > 0"
      class="task-pagination"
      :current-page.sync="currentPage"
      :page-size.sync="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="filteredTasks.length"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="currentPage = 1"
    />
  </div>
</template>

<script>
import { DataManageApi } from '@/apis';

export default {
  name: 'TaskList',
  props: {
    policies: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
  },
  data() {
    return {
      filterEnabled: 'all',
      searchKey: '',
      currentPage: 1,
      pageSize: 20,
      latestRunMap: {},
    };
  },
  computed: {
    tasks() {
      const map = new Map();
      for (const p of this.policies) {
        if (p.deleted) continue;
        const tid = p.task_id || p.policy_id;
        if (!map.has(tid)) {
          map.set(tid, {
            task_id: tid,
            task_name: p.task_name || '',
            schedule_type: p.schedule_type,
            crontab: p.crontab,
            instance: p.instance,
            policies: [],
          });
        }
        map.get(tid).policies.push(p);
      }
      for (const g of map.values()) {
        const states = new Set(g.policies.map(p => p.enabled));
        g.mixedEnabled = states.size > 1;
        g.enabled = states.has(true);
      }
      return [...map.values()];
    },
    filteredTasks() {
      return this.tasks.filter(t => {
        if (this.filterEnabled === 'enabled' && !t.enabled) return false;
        if (this.filterEnabled === 'disabled' && t.enabled) return false;
        if (this.searchKey) {
          const q = this.searchKey.toLowerCase();
          if (!this.displayName(t).toLowerCase().includes(q)
            && !t.policies.some(p => `${p.database}.${p.table}`.toLowerCase().includes(q))) {
            return false;
          }
        }
        return true;
      });
    },
    pagedTasks() {
      const s = (this.currentPage - 1) * this.pageSize;
      return this.filteredTasks.slice(s, s + this.pageSize);
    },
  },
  watch: {
    policies: {
      handler(newPolicies) {
        for (const p of newPolicies) this.fetchLatestRun(p.policy_id);
      },
      immediate: true,
    },
    filterEnabled() { this.currentPage = 1; },
    searchKey() { this.currentPage = 1; },
  },
  methods: {
    async fetchLatestRun(policyId) {
      try {
        const res = await DataManageApi.listRunsByPolicy(policyId, { limit: 1 });
        if (res.data.retCode === '0000') {
          const runs = res.data.entity || [];
          if (runs.length) this.$set(this.latestRunMap, policyId, runs[0]);
        }
      } catch { /* silent */ }
    },
    displayName(t) {
      if (t.task_name) return t.task_name;
      const ps = t.policies;
      if (ps.length === 1) return `${ps[0].database}.${ps[0].table}`;
      return `${ps[0].database}.${ps[0].table} (+${ps.length - 1})`;
    },
    taskLatestRun(t) {
      let latest = null;
      for (const p of t.policies) {
        const r = this.latestRunMap[p.policy_id];
        if (r && (!latest || (r.start_time || r.create_time) > (latest.start_time || latest.create_time))) {
          latest = r;
        }
      }
      return latest;
    },
    handleRowClick(row, column) {
      if (!column) return;
      if ((column.className || '').includes('col-no-click')) return;
      this.$emit('view-task', row);
    },
    capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; },
    statusType(s) {
      switch (s) {
        case 'success': return 'success';
        case 'failed': return 'danger';
        case 'running': return 'primary';
        case 'queued': return 'info';
        case 'skipped': return 'warning';
        default: return 'info';
      }
    },
    formatDate(s) {
      if (!s || s === '0001-01-01T00:00:00Z') return '—';
      const d = new Date(s);
      return isNaN(d.getTime()) ? s : d.toLocaleString('zh-CN', { hour12: false });
    },
    async triggerTask(t) {
      const results = await Promise.allSettled(
        t.policies.map(p => DataManageApi.triggerPolicy(p.policy_id))
      );
      const success = results.filter(r => r.status === 'fulfilled' && r.value.data.retCode === '0000').length;
      const failed = results.length - success;
      this.$message.success(this.$t('history.Task Triggered', { success, failed }));
      this.$emit('refresh');
    },
    async toggleTaskEnabled(t) {
      const willEnable = !t.enabled;
      this.$set(t, 'toggling', true);
      try {
        await Promise.allSettled(
          t.policies.map(async p => {
            const r = await DataManageApi.getPolicy(p.policy_id);
            if (r.data.retCode !== '0000') throw new Error('fetch');
            const body = { ...r.data.entity, enabled: willEnable };
            return DataManageApi.updatePolicy(p.policy_id, body);
          })
        );
        this.$message.success(
          willEnable
            ? this.$t('history.Task Enabled Toast', { name: this.displayName(t) })
            : this.$t('history.Task Disabled Toast', { name: this.displayName(t) })
        );
        this.$emit('refresh');
      } finally {
        this.$set(t, 'toggling', false);
      }
    },
    async deleteTask(t) {
      try {
        await this.$confirm(
          this.$t('history.Confirm Delete Task', { name: this.displayName(t), count: t.policies.length }),
          this.$t('common.Confirm'),
          {
            confirmButtonText: this.$t('history.Confirm Delete Btn'),
            cancelButtonText: this.$t('common.Cancel'),
            type: 'warning',
            dangerouslyUseHTMLString: true,
          }
        );
      } catch { return; }
      const results = await Promise.allSettled(
        t.policies.map(p => DataManageApi.deletePolicy(p.policy_id))
      );
      const success = results.filter(r => r.status === 'fulfilled' && r.value.data.retCode === '0000').length;
      const failed = results.length - success;
      if (failed === 0) {
        this.$message.success(this.$t('history.Task Delete Result OK', { success }));
      } else {
        this.$message.warning(this.$t('history.Task Delete Result Partial', { success, failed }));
      }
      this.$emit('refresh');
    },
  },
};
</script>

<style scoped>
.toolbar { display:flex; gap:10px; align-items:center; margin-bottom:14px; flex-wrap:wrap; }
.task-row-clickable { cursor: pointer; }
.task-row-clickable .col-no-click { cursor: default; }
.task-name { font-weight: 500; }
.muted { color: #909399; }
.task-pagination { margin-top: 12px; text-align: right; }
</style>
