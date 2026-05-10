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
      <el-button size="small" icon="el-icon-refresh" circle @click="fetchPolicies" :title="$t('history.Refresh')" />
    </div>

    <!-- Policy Table -->
    <el-table
      :data="filteredPolicies"
      v-loading="loading"
      row-key="policy_id"
      border
      style="width: 100%"
      @expand-change="handleExpandChange"
    >
      <!-- Expand column -->
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="run-expand" @click.stop>
            <div v-if="runLoadingMap[row.policy_id]" class="run-loading">
              <i class="el-icon-loading" /> {{ $t('history.Loading') }}
            </div>
            <template v-else>
              <div class="run-header">
                <span class="run-col col-time">{{ $t('history.Trigger Time') }}</span>
                <span class="run-col col-type">{{ $t('history.Trigger Type') }}</span>
                <span class="run-col col-status">{{ $t('history.Status') }}</span>
                <span class="run-col col-parts">{{ $t('history.Partition Count') }}</span>
                <span class="run-col col-elapsed">{{ $t('history.Elapsed') }}</span>
                <span class="run-col col-notes">{{ $t('history.Notes') }}</span>
                <span class="run-col col-action"></span>
              </div>
              <div
                v-for="run in (runMap[row.policy_id] || [])"
                :key="run.run_id"
                class="run-row"
                @click="$emit('view-run', run.run_id)"
              >
                <span class="run-col col-time">{{ formatDate(run.start_time || run.create_time) }}</span>
                <span class="run-col col-type muted">{{ triggerTypeLabel(run.trigger_type) }}</span>
                <span class="run-col col-status">
                  <el-tag :type="statusType(run.status)" size="mini" v-if="run.status !== 'interrupted'">
                    {{ statusLabel(run.status) }}
                  </el-tag>
                  <el-tag v-else size="mini" color="#ED8936" style="color: white; border-color: #ED8936;">
                    {{ $t('history.Status Interrupted') }}
                  </el-tag>
                </span>
                <span class="run-col col-parts">{{ run.partitions ? run.partitions.length : '—' }}</span>
                <span class="run-col col-elapsed muted">{{ formatElapsed(run) }}</span>
                <span class="run-col col-notes muted">{{ run.message || run.status_reason || '—' }}</span>
                <span class="run-col col-action">
                  <el-button type="text" size="mini" @click.stop="$emit('view-run', run.run_id)">
                    {{ $t('history.View') }}
                  </el-button>
                </span>
              </div>
              <div v-if="!(runMap[row.policy_id] || []).length" class="run-empty muted">
                {{ $t('history.No Runs') }}
              </div>
              <div class="run-more" @click.stop="goViewMore(row)">
                {{ $t('history.View More 30 Days') }} →
              </div>
            </template>
          </div>
        </template>
      </el-table-column>

      <!-- database.table -->
      <el-table-column :label="$t('history.Database Table')" min-width="180">
        <template #default="{ row }">
          <span class="table-name">{{ row.database }}.{{ row.table }}</span>
        </template>
      </el-table-column>

      <!-- 类型 -->
      <el-table-column :label="$t('history.Schedule Type')" width="80">
        <template #default="{ row }">
          {{ row.schedule_type === 'scheduled' ? $t('history.Schedule Scheduled') : $t('history.Schedule Immediate') }}
        </template>
      </el-table-column>

      <!-- cron / instance -->
      <el-table-column :label="$t('history.Cron Instance')" min-width="180">
        <template #default="{ row }">
          <span class="muted" v-if="row.schedule_type === 'scheduled'">
            {{ row.crontab }} · {{ row.instance || '—' }}
          </span>
          <span class="muted" v-else>— · {{ row.instance || '—' }}</span>
        </template>
      </el-table-column>

      <!-- 启用 -->
      <el-table-column :label="$t('history.Enabled')" width="80">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" size="mini">
            {{ row.enabled ? $t('history.Enabled') : $t('history.Disabled') }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 最近一次 -->
      <el-table-column :label="$t('history.Latest Run')" min-width="180">
        <template #default="{ row }">
          <template v-if="latestRunMap[row.policy_id]">
            <span class="muted" style="margin-right: 6px">
              {{ formatDate(latestRunMap[row.policy_id].start_time || latestRunMap[row.policy_id].create_time) }}
            </span>
            <el-tag
              v-if="latestRunMap[row.policy_id].status !== 'interrupted'"
              :type="statusType(latestRunMap[row.policy_id].status)"
              size="mini"
            >
              {{ statusLabel(latestRunMap[row.policy_id].status) }}
            </el-tag>
            <el-tag v-else size="mini" color="#ED8936" style="color: white; border-color: #ED8936;">
              {{ $t('history.Status Interrupted') }}
            </el-tag>
          </template>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>

      <!-- 操作 -->
      <el-table-column :label="$t('history.Actions')" width="220" fixed="right">
        <template #default="{ row }">
          <template v-if="row.schedule_type === 'scheduled'">
            <el-button type="text" size="mini" @click="triggerNow(row)">{{ $t('history.Trigger Now') }}</el-button>
            <el-button type="text" size="mini" @click="$emit('edit-policy', row)">{{ $t('history.Edit') }}</el-button>
            <el-button type="text" size="mini" @click="toggleEnabled(row)">
              {{ row.enabled ? $t('history.Disable') : $t('history.Enable') }}
            </el-button>
          </template>
          <template v-else>
            <el-button type="text" size="mini" @click="$emit('copy-policy', row)">{{ $t('history.Copy as New') }}</el-button>
            <el-button type="text" size="mini" @click="$emit('edit-policy', row)">{{ $t('history.Edit') }}</el-button>
            <el-button type="text" size="mini" style="color: #F56C6C" @click="deletePolicy(row)">{{ $t('history.Delete') }}</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

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
      runMap: {},         // policy_id -> BackupRun[]
      runLoadingMap: {},  // policy_id -> boolean
      latestRunMap: {},   // policy_id -> BackupRun (latest)
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
  },
  methods: {
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

    async handleExpandChange(row, expandedRows) {
      const isExpanded = expandedRows.some(r => r.policy_id === row.policy_id);
      if (!isExpanded) return;
      if (this.runMap[row.policy_id]) return; // already loaded
      await this.fetchRunsForPolicy(row.policy_id);
    },

    async fetchRunsForPolicy(policyId) {
      this.$set(this.runLoadingMap, policyId, true);
      try {
        const res = await DataManageApi.listRunsByPolicy(policyId, { limit: 10 });
        if (res.data.retCode === '0000') {
          this.$set(this.runMap, policyId, res.data.entity || []);
        } else {
          this.$message.error(res.data.retMsg || '获取运行记录失败');
          this.$set(this.runMap, policyId, []);
        }
      } catch (e) {
        this.$message.error('获取运行记录异常: ' + e.message);
        this.$set(this.runMap, policyId, []);
      } finally {
        this.$set(this.runLoadingMap, policyId, false);
      }
    },

    async triggerNow(policy) {
      try {
        const res = await DataManageApi.triggerPolicy(policy.policy_id);
        if (res.data.retCode === '0000') {
          this.$message.success(this.$t('history.Trigger Success'));
          // refresh run list if already expanded
          this.$delete(this.runMap, policy.policy_id);
          await this.fetchRunsForPolicy(policy.policy_id);
          await this.fetchLatestRun(policy.policy_id);
        } else {
          this.$message.error(res.data.retMsg || '触发失败');
        }
      } catch (e) {
        this.$message.error('触发异常: ' + e.message);
      }
    },

    async toggleEnabled(policy) {
      try {
        const pRes = await DataManageApi.getPolicy(policy.policy_id);
        if (pRes.data.retCode !== '0000') {
          this.$message.error(pRes.data.retMsg || '获取策略详情失败');
          return;
        }
        const full = { ...pRes.data.entity, enabled: !policy.enabled };
        const upRes = await DataManageApi.updatePolicy(policy.policy_id, full);
        if (upRes.data.retCode === '0000') {
          this.$message.success(policy.enabled ? '已禁用' : '已启用');
          await this.fetchPolicies();
        } else {
          this.$message.error(upRes.data.retMsg || '操作失败');
        }
      } catch (e) {
        this.$message.error('操作异常: ' + e.message);
      }
    },

    async deletePolicy(policy) {
      try {
        await this.$confirm(this.$t('history.Confirm Delete', { table: `${policy.database}.${policy.table}` }), this.$t('common.Confirm'), {
          confirmButtonText: this.$t('history.Confirm Delete Btn'),
          cancelButtonText: this.$t('common.Cancel'),
          type: 'warning',
        });
      } catch {
        return; // user cancelled
      }
      try {
        const res = await DataManageApi.deletePolicy(policy.policy_id);
        if (res.data.retCode === '0000') {
          this.$message.success('删除成功');
          await this.fetchPolicies();
        } else {
          this.$message.error(res.data.retMsg || '删除失败');
        }
      } catch (e) {
        this.$message.error('删除异常: ' + e.message);
      }
    },

    goViewMore(policy) {
      // navigate to table-ledger tab with context
      this.$emit('view-table-ledger', { database: policy.database, table: policy.table });
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

    triggerTypeLabel(type) {
      const map = {
        cron: this.$t('history.Trigger cron'),
        manual_immediate: this.$t('history.Trigger manual_immediate'),
        manual_restore: this.$t('history.Trigger manual_restore'),
        manual_retry: this.$t('history.Trigger manual_retry'),
      };
      return map[type] || type;
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

    formatElapsed(run) {
      if (!run.start_time || run.start_time === '0001-01-01T00:00:00Z') return '—';
      const end = run.finished_at && run.finished_at !== '0001-01-01T00:00:00Z'
        ? new Date(run.finished_at)
        : new Date();
      const start = new Date(run.start_time);
      const secs = Math.floor((end - start) / 1000);
      if (isNaN(secs) || secs < 0) return '—';
      if (secs < 60) return `${secs}s`;
      if (secs < 3600) return `${Math.floor(secs / 60)}分`;
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      return m > 0 ? `${h}时${m}分` : `${h}时`;
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

/* Run expand area */
.run-expand {
  padding: 8px 12px 14px 36px;
  background: #FDF7DD;
  border-left: 3px solid #C9A100;
}

.run-loading {
  padding: 12px;
  color: #909399;
}

.run-header,
.run-row {
  display: grid;
  grid-template-columns: 120px 110px 90px 70px 80px 1fr 70px;
  gap: 10px;
  align-items: center;
  padding: 6px 10px;
  font-size: 12.5px;
}

.run-header {
  font-weight: 500;
  color: #909399;
  font-size: 12px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 4px;
}

.run-row {
  border-bottom: 1px dashed #dcdfe6;
  cursor: pointer;
  border-radius: 3px;
}

.run-row:last-of-type {
  border-bottom: none;
}

.run-row:hover {
  background: rgba(255, 255, 255, 0.7);
}

.run-empty {
  padding: 12px 10px;
  font-size: 12.5px;
}

.run-more {
  padding: 8px 10px;
  text-align: center;
  color: #909399;
  font-size: 12px;
  cursor: pointer;
  border-top: 1px dashed #dcdfe6;
  margin-top: 4px;
}

.run-more:hover {
  color: #C9A100;
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
</style>
