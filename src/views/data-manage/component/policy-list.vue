<template>
  <div class="policy-list">
    <!-- Toolbar -->
    <div class="toolbar">
      <el-select v-model="filterEnabled" size="small" style="width: 120px">
        <el-option :label="$t('history.All Status')" value="all" />
        <el-option :label="$t('history.Enabled')" value="enabled" />
        <el-option :label="$t('history.Disabled')" value="disabled" />
      </el-select>
      <el-select v-model="filterDatabase" size="small" style="width: 140px" clearable :placeholder="$t('history.Database Filter')">
        <el-option v-for="db in databaseList" :key="db" :label="db" :value="db" />
      </el-select>
      <el-input
        v-model="searchKey"
        size="small"
        style="width: 220px"
        :placeholder="$t('history.Database Table')"
        suffix-icon="el-icon-search"
        clearable
      />
      <div style="flex: 1" />
      <el-button type="primary" size="small" icon="el-icon-plus" @click="$emit('go-backup')">
        {{ $t('history.New Backup') }}
      </el-button>
      <el-button size="small" icon="el-icon-refresh-left" @click="$emit('go-restore')">
        {{ $t('history.New Restore') }}
      </el-button>
      <el-button size="small" icon="el-icon-refresh" :loading="loading" @click="fetchPolicies">
        {{ $t('history.Refresh') }}
      </el-button>
    </div>

    <!-- Task Table (outer: one row = one task) -->
    <el-table
      ref="taskTable"
      :data="pagedTasks"
      v-loading="loading"
      row-key="task_id"
      border
      style="width: 100%"
      :row-class-name="rowClassName"
      @row-click="handleRowClick"
    >
      <!-- Expand column -->
      <el-table-column type="expand">
        <template #default="{ row: task }">
          <div class="task-expand" @click.stop>
            <div class="task-policies-header">
              <span class="col-table">{{ $t('history.Database Table') }}</span>
              <span class="col-status">{{ $t('history.Latest Run') }}</span>
              <span class="col-action"></span>
            </div>
            <div
              v-for="p in task.policies"
              :key="p.policy_id"
              class="task-policy-row"
            >
              <span class="col-table">
                <span class="table-name">{{ p.database }}.{{ p.table }}</span>
              </span>
              <span class="col-status">
                <template v-if="latestRunMap[p.policy_id]">
                  <span class="muted">{{ formatDate(latestRunMap[p.policy_id].start_time || latestRunMap[p.policy_id].create_time) }}</span>
                  <el-tag
                    v-if="latestRunMap[p.policy_id].status !== 'interrupted'"
                    size="mini"
                    :type="statusType(latestRunMap[p.policy_id].status)"
                    style="margin-left:8px"
                  >
                    {{ statusLabel(latestRunMap[p.policy_id].status) }}
                  </el-tag>
                  <el-tag v-else size="mini" color="#ED8936" style="color: white; border-color: #ED8936; margin-left:8px">
                    {{ $t('history.Status Interrupted') }}
                  </el-tag>
                </template>
                <span v-else class="muted">—</span>
              </span>
              <span class="col-action">
                <el-button
                  type="text"
                  size="mini"
                  @click="$emit('restore-table', p)"
                >
                  {{ $t('history.Restore Table Partitions') }}
                </el-button>
                <el-button
                  type="text"
                  size="mini"
                  :disabled="!latestRunMap[p.policy_id]"
                  @click="$emit('view-run', latestRunMap[p.policy_id] && latestRunMap[p.policy_id].run_id)"
                >
                  {{ $t('history.View Latest Run') }}
                </el-button>
                <el-button type="text" size="mini" @click="$emit('edit-policy', p)">{{ $t('history.Edit') }}</el-button>
              </span>
            </div>
            <div v-if="!task.policies.length" class="task-empty muted">
              {{ $t('history.No Runs') }}
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 任务名 -->
      <el-table-column :label="$t('history.Task Name')" min-width="200">
        <template #default="{ row: task }">
          <span class="table-name">{{ displayTaskName(task) }}</span>
          <el-tag v-if="task.mixedEnabled" size="mini" type="warning" style="margin-left:6px">mixed</el-tag>
        </template>
      </el-table-column>

      <!-- 类型 -->
      <el-table-column :label="$t('history.Schedule Type')" width="80">
        <template #default="{ row: task }">
          {{ task.schedule_type === 'scheduled' ? $t('history.Schedule Scheduled') : $t('history.Schedule Immediate') }}
        </template>
      </el-table-column>

      <!-- cron / instance -->
      <el-table-column :label="$t('history.Cron Instance')" min-width="180">
        <template #default="{ row: task }">
          <span class="muted" v-if="task.schedule_type === 'scheduled'">
            {{ task.crontab }} · {{ task.instance || '—' }}
          </span>
          <span class="muted" v-else>— · {{ task.instance || '—' }}</span>
        </template>
      </el-table-column>

      <!-- 表数量 -->
      <el-table-column :label="$t('history.Tables Count Label')" width="80">
        <template #default="{ row: task }">
          <span class="muted">{{ $t('history.Tables Count', { count: task.policies.length }) }}</span>
        </template>
      </el-table-column>

      <!-- 启用：task 级 switch -->
      <el-table-column :label="$t('history.Enabled')" width="80" class-name="col-no-click">
        <template #default="{ row: task }">
          <el-tooltip
            v-if="task.mixedEnabled"
            :content="$t('history.Mixed Enabled Hint')"
            placement="top"
          >
            <el-switch
              :value="task.enabled"
              :loading="!!task.toggling"
              :disabled="!!task.toggling"
              active-color="#C9A100"
              inactive-color="#c0c4cc"
              @change="toggleTaskEnabled(task)"
            />
          </el-tooltip>
          <el-switch
            v-else
            :value="task.enabled"
            :loading="!!task.toggling"
            :disabled="!!task.toggling"
            active-color="#C9A100"
            inactive-color="#c0c4cc"
            @change="toggleTaskEnabled(task)"
          />
        </template>
      </el-table-column>

      <!-- 最近一次（取 task 下所有 policy 中最新的 run） -->
      <el-table-column :label="$t('history.Latest Run')" min-width="180">
        <template #default="{ row: task }">
          <template v-if="taskLatestRun(task)">
            <span class="muted" style="margin-right: 6px">
              {{ formatDate(taskLatestRun(task).start_time || taskLatestRun(task).create_time) }}
            </span>
            <el-tag
              v-if="taskLatestRun(task).status !== 'interrupted'"
              :type="statusType(taskLatestRun(task).status)"
              size="mini"
            >
              {{ statusLabel(taskLatestRun(task).status) }}
            </el-tag>
            <el-tag v-else size="mini" color="#ED8936" style="color: white; border-color: #ED8936;">
              {{ $t('history.Status Interrupted') }}
            </el-tag>
          </template>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>

      <!-- 操作 -->
      <el-table-column :label="$t('history.Actions')" width="220" fixed="right" class-name="col-no-click">
        <template #default="{ row: task }">
          <template v-if="task.schedule_type === 'scheduled'">
            <el-button type="text" size="mini" @click="triggerTask(task)">{{ $t('history.Trigger Now') }}</el-button>
            <el-button type="text" size="mini" @click="editTask(task)">{{ $t('history.Edit') }}</el-button>
            <el-button type="text" size="mini" style="color: #F56C6C" @click="deleteTask(task)">{{ $t('history.Delete') }}</el-button>
          </template>
          <template v-else>
            <el-button type="text" size="mini" @click="editTask(task)">{{ $t('history.Edit') }}</el-button>
            <el-button type="text" size="mini" style="color: #F56C6C" @click="deleteTask(task)">{{ $t('history.Delete') }}</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <el-pagination
      v-if="tasks.length > 0"
      class="policy-pagination"
      :current-page.sync="currentPage"
      :page-size.sync="pageSize"
      :page-sizes="pageSizes"
      :total="tasks.length"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="onPageSizeChange"
    />

    <!-- Legend -->
    <div class="legend">
      <span class="legend-item"><span class="legend-dot" style="background:#67C23A"></span>{{ $t('history.Status Success') }}</span>
      <span class="legend-item"><span class="legend-dot" style="background:#F56C6C"></span>{{ $t('history.Status Failed') }}</span>
      <span class="legend-item"><span class="legend-dot" style="background:#C9A100"></span>{{ $t('history.Status Running') }}</span>
      <span class="legend-item"><span class="legend-dot" style="background:#E6A23C"></span>{{ $t('history.Status Skipped') }}</span>
      <span class="legend-item"><span class="legend-dot" style="background:#ED8936"></span>{{ $t('history.Status Interrupted') }}</span>
    </div>
  </div>
</template>

<script>
import { DataManageApi } from '@/apis';

export default {
  name: 'PolicyList',
  data() {
    return {
      loading: false,
      policies: [],
      filterEnabled: 'all',
      filterDatabase: '',
      searchKey: '',
      latestRunMap: {},   // policy_id -> BackupRun (latest)
      currentPage: 1,
      pageSize: 20,
      pageSizes: [10, 20, 50, 100],
    };
  },
  computed: {
    cluster() {
      return this.$route.params.id;
    },
    databaseList() {
      const dbs = new Set(this.policies.map(p => p.database).filter(Boolean));
      return Array.from(dbs);
    },
    filteredPolicies() {
      return this.policies.filter(p => {
        if (p.deleted) return false;
        if (this.filterEnabled === 'enabled' && !p.enabled) return false;
        if (this.filterEnabled === 'disabled' && p.enabled) return false;
        if (this.filterDatabase && p.database !== this.filterDatabase) return false;
        if (this.searchKey) {
          const q = this.searchKey.toLowerCase();
          const tbl = `${p.database}.${p.table}`.toLowerCase();
          if (!tbl.includes(q)) return false;
        }
        return true;
      });
    },
    // group filteredPolicies by effective task_id
    tasks() {
      const groups = new Map();
      for (const p of this.filteredPolicies) {
        const tid = p.task_id || p.policy_id;
        if (!groups.has(tid)) {
          groups.set(tid, {
            task_id: tid,
            task_name: p.task_name || '',
            schedule_type: p.schedule_type,
            crontab: p.crontab,
            instance: p.instance,
            enabled: p.enabled,
            toggling: false,
            policies: [],
          });
        }
        groups.get(tid).policies.push(p);
      }
      // compute enabled state per group
      for (const g of groups.values()) {
        const enabledStates = new Set(g.policies.map(p => p.enabled));
        g.mixedEnabled = enabledStates.size > 1;
        // any enabled = group shown as enabled (conservative)
        g.enabled = enabledStates.has(true);
      }
      return [...groups.values()];
    },
    pagedTasks() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.tasks.slice(start, start + this.pageSize);
    },
  },
  watch: {
    // filter 变化时回到第 1 页
    filterEnabled() { this.currentPage = 1; },
    filterDatabase() { this.currentPage = 1; },
    searchKey() { this.currentPage = 1; },
  },
  methods: {
    onPageSizeChange() {
      this.currentPage = 1;
    },

    rowClassName() {
      return 'policy-row-clickable';
    },

    // 整行点击展开/收起；启用列和操作列跳过（class-name=col-no-click）
    handleRowClick(row, column) {
      if (!column) return;
      if (column.type === 'expand') return;
      const cn = column.className || '';
      if (cn.includes('col-no-click')) return;
      this.$refs.taskTable.toggleRowExpansion(row);
    },

    displayTaskName(task) {
      if (task.task_name) return task.task_name;
      if (task.policies.length === 1) return `${task.policies[0].database}.${task.policies[0].table}`;
      const first = task.policies[0];
      return `${first.database}.${first.table} (+${task.policies.length - 1})`;
    },

    // get the most recent run across all policies in a task
    taskLatestRun(task) {
      let best = null;
      for (const p of task.policies) {
        const run = this.latestRunMap[p.policy_id];
        if (!run) continue;
        if (!best) { best = run; continue; }
        const runTime = new Date(run.start_time || run.create_time || 0).getTime();
        const bestTime = new Date(best.start_time || best.create_time || 0).getTime();
        if (runTime > bestTime) best = run;
      }
      return best;
    },

    async fetchPolicies() {
      this.loading = true;
      try {
        const res = await DataManageApi.listPolicies(this.cluster);
        if (res.data.retCode === '0000') {
          this.policies = res.data.entity || [];
          // prefetch latest run for each policy
          this.policies.forEach(p => this.fetchLatestRun(p.policy_id));
        } else {
          this.$message.error(res.data.retMsg || '获取策略列表失败');
        }
      } catch (e) {
        this.$message.error('获取策略列表异常: ' + e.message);
      } finally {
        this.loading = false;
      }
    },

    async fetchLatestRun(policyId) {
      try {
        const res = await DataManageApi.listRunsByPolicy(policyId, { limit: 1 });
        if (res.data.retCode === '0000') {
          const runs = res.data.entity || [];
          if (runs.length > 0) {
            this.$set(this.latestRunMap, policyId, runs[0]);
          }
        }
      } catch (e) {
        // silent — not critical
      }
    },

    async triggerTask(task) {
      let success = 0, failed = 0;
      await Promise.all(task.policies.map(async p => {
        try {
          const res = await DataManageApi.triggerPolicy(p.policy_id);
          if (res.data.retCode === '0000') success++;
          else failed++;
        } catch { failed++; }
      }));
      this.$message.success(this.$t('history.Task Triggered', { success, failed }));
      this.fetchPolicies();
    },

    async toggleTaskEnabled(task) {
      const willEnable = !task.enabled;
      this.$set(task, 'toggling', true);
      let success = 0, failed = 0;
      const count = task.policies.length;
      const name = this.displayTaskName(task);
      try {
        await Promise.all(task.policies.map(async p => {
          try {
            const pRes = await DataManageApi.getPolicy(p.policy_id);
            if (pRes.data.retCode !== '0000') { failed++; return; }
            const body = { ...pRes.data.entity, enabled: willEnable };
            const upRes = await DataManageApi.updatePolicy(p.policy_id, body);
            if (upRes.data.retCode === '0000') success++;
            else failed++;
          } catch { failed++; }
        }));
        this.$message.success(
          this.$t(willEnable ? 'history.Task Enabled' : 'history.Task Disabled', { name, success, count })
        );
        await this.fetchPolicies();
      } finally {
        this.$set(task, 'toggling', false);
      }
    },

    async deleteTask(task) {
      const name = this.displayTaskName(task);
      const count = task.policies.length;
      try {
        await this.$confirm(
          this.$t('history.Confirm Delete Task', { name, count }),
          this.$t('common.Confirm'),
          {
            confirmButtonText: this.$t('history.Confirm Delete Btn'),
            cancelButtonText: this.$t('common.Cancel'),
            type: 'warning',
            dangerouslyUseHTMLString: true,
          }
        );
      } catch { return; }
      let success = 0, failed = 0;
      await Promise.all(task.policies.map(async p => {
        try {
          const res = await DataManageApi.deletePolicy(p.policy_id);
          if (res.data.retCode === '0000') success++;
          else failed++;
        } catch { failed++; }
      }));
      if (failed === 0) {
        this.$message.success(this.$t('history.Task Delete Result OK', { success }));
      } else {
        this.$message.warning(this.$t('history.Task Delete Result Partial', { success, failed }));
      }
      this.fetchPolicies();
    },

    editTask(task) {
      if (task.policies.length === 1) {
        this.$emit('edit-policy', task.policies[0]);
      } else {
        // TODO: 后续做批量编辑 modal
        this.$message.info(this.$t('history.Edit Task Coming Soon'));
      }
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

    formatDate(dateStr) {
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
  },
  mounted() {
    this.fetchPolicies();
  },
};
</script>

<style scoped>
.policy-list {
  padding: 16px;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
  flex-wrap: wrap;
}

.table-name {
  font-weight: 500;
}

.muted {
  color: #909399;
}

/* Task expand area */
.task-expand {
  padding: 8px 12px 14px 36px;
  background: #FDF7DD;
  border-left: 3px solid #C9A100;
}

.task-policies-header,
.task-policy-row {
  display: grid;
  grid-template-columns: 220px 1fr 280px;
  gap: 10px;
  align-items: center;
  padding: 6px 10px;
  font-size: 12.5px;
}

.task-policies-header {
  font-weight: 500;
  color: #909399;
  font-size: 12px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 4px;
}

.task-policy-row {
  border-bottom: 1px dashed #dcdfe6;
  border-radius: 3px;
}

.task-policy-row:last-of-type {
  border-bottom: none;
}

.task-policy-row:hover {
  background: rgba(255, 255, 255, 0.7);
}

.task-empty {
  padding: 12px 10px;
  font-size: 12.5px;
}

/* Legend */
.legend {
  display: flex;
  gap: 14px;
  font-size: 11px;
  color: #606266;
  margin-top: 12px;
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
}

.policy-pagination {
  margin-top: 12px;
  text-align: right;
}

/* 整行可点击 cursor 提示；启用 / 操作列改回 default */
.policy-row-clickable {
  cursor: pointer;
}
.policy-row-clickable .col-no-click {
  cursor: default;
}
</style>
