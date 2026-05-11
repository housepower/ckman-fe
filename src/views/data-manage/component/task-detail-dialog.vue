<template>
  <el-dialog
    :visible="value"
    :title="$t('history.Task Detail Title', { name: displayName })"
    width="720px"
    @update:visible="$emit('input', $event)"
  >
    <div v-if="task" class="task-detail">
      <!-- ① 调度 -->
      <div class="section">
        <div class="section-title"><span class="num">1</span>{{ $t('backup.Schedule') }}</div>
        <div class="kv-row"><span class="kv-key">{{ $t('backup.Backup Type') }}</span>
          <span class="kv-val">
            <el-tag size="mini" :type="task.schedule_type === 'scheduled' ? 'primary' : 'info'">
              {{ task.schedule_type === 'scheduled' ? $t('history.Schedule Scheduled') : $t('history.Schedule Immediate') }}
            </el-tag>
          </span>
        </div>
        <template v-if="task.schedule_type === 'scheduled'">
          <div class="kv-row"><span class="kv-key">Crontab</span><span class="kv-val mono">{{ task.crontab }}</span></div>
          <div class="kv-row"><span class="kv-key">{{ $t('backup.Instance') }}</span><span class="kv-val">{{ task.instance || '—' }}</span></div>
        </template>
        <div class="kv-row"><span class="kv-key">{{ $t('history.Enabled') }}</span>
          <span class="kv-val">
            <el-tag size="mini" :type="task.enabled ? 'success' : 'info'">
              {{ task.enabled ? $t('history.Enabled') : $t('history.Disabled') }}
            </el-tag>
            <el-tag v-if="task.mixedEnabled" size="mini" type="warning" style="margin-left:6px">mixed</el-tag>
          </span>
        </div>
      </div>

      <!-- ② 备份对象 -->
      <div class="section">
        <div class="section-title"><span class="num">2</span>{{ $t('backup.Backup Object') }}</div>
        <div class="kv-row"><span class="kv-key">{{ $t('backup.Database') }}</span><span class="kv-val mono">{{ firstPolicy.database }}</span></div>
        <div class="kv-row"><span class="kv-key">{{ $t('backup.Table Name') }}</span>
          <span class="kv-val">
            <el-tag v-for="p in task.policies" :key="p.policy_id" size="mini" style="margin-right:4px;margin-bottom:4px">
              {{ p.table }}
            </el-tag>
          </span>
        </div>
        <div class="kv-row"><span class="kv-key">{{ $t('history.Tables Count Label') }}</span><span class="kv-val">{{ task.policies.length }}</span></div>
      </div>

      <!-- ③ 备份方式 -->
      <div class="section">
        <div class="section-title"><span class="num">3</span>{{ $t('backup.Backup Mode') }}</div>
        <div class="kv-row"><span class="kv-key">{{ $t('backup.Backup Method') }}</span>
          <span class="kv-val">{{ firstPolicy.backup_style === 'full' ? $t('backup.Full Backup') : $t('backup.Incremental Backup') }}</span>
        </div>
        <template v-if="firstPolicy.backup_style === 'incremental'">
          <div class="kv-row"><span class="kv-key">{{ $t('backup.Incremental Method') }}</span>
            <span class="kv-val">{{ firstPolicy.backup_type === 'partition' ? $t('backup.By Partition Name') : $t('backup.By Time Period') }}</span>
          </div>
          <div v-if="firstPolicy.backup_type === 'daily'" class="kv-row"><span class="kv-key">{{ $t('backup.Time Range') }}</span><span class="kv-val">{{ firstPolicy.days_before }} {{ $t('backup.Days Ago Text') }}</span></div>
        </template>
      </div>

      <!-- ④ 备份目标 -->
      <div class="section">
        <div class="section-title"><span class="num">4</span>{{ $t('backup.Backup Target Section') }}</div>
        <div class="kv-row"><span class="kv-key">{{ $t('backup.Backup Target') }}</span><span class="kv-val">{{ firstPolicy.target_type === 's3' ? 'AWS S3' : 'Local' }}</span></div>
        <template v-if="firstPolicy.target_type === 's3' && firstPolicy.s3">
          <div class="kv-row"><span class="kv-key">{{ $t('backup.Endpoint') }}</span><span class="kv-val mono">{{ firstPolicy.s3.Endpoint || firstPolicy.s3.endpoint }}</span></div>
          <div class="kv-row"><span class="kv-key">{{ $t('backup.Bucket') }}</span><span class="kv-val mono">{{ firstPolicy.s3.Bucket || firstPolicy.s3.bucket }}</span></div>
          <div class="kv-row"><span class="kv-key">{{ $t('backup.Region') }}</span><span class="kv-val mono">{{ firstPolicy.s3.Region || firstPolicy.s3.region || '—' }}</span></div>
        </template>
        <template v-if="firstPolicy.target_type === 'local' && firstPolicy.local">
          <div class="kv-row"><span class="kv-key">{{ $t('backup.Backup Path') }}</span><span class="kv-val mono">{{ firstPolicy.local.path }}</span></div>
        </template>
      </div>

      <!-- ⑤ 选项 -->
      <div class="section">
        <div class="section-title"><span class="num">5</span>{{ $t('backup.Options') }}</div>
        <div class="kv-row"><span class="kv-key">{{ $t('backup.Compression Format') }}</span><span class="kv-val">{{ firstPolicy.compression || 'none' }}</span></div>
        <div class="kv-row"><span class="kv-key">{{ $t('backup.Checksum') }}</span><span class="kv-val"><i v-if="firstPolicy.checksum" class="el-icon-check" style="color:#67C23A" /><i v-else class="el-icon-close" style="color:#909399" /></span></div>
        <div class="kv-row"><span class="kv-key">{{ $t('backup.Clean Successful Partitions') }}</span><span class="kv-val"><i v-if="firstPolicy.clean" class="el-icon-check" style="color:#67C23A" /><i v-else class="el-icon-close" style="color:#909399" /></span></div>
      </div>
    </div>

    <span slot="footer">
      <el-button @click="$emit('input', false)">{{ $t('history.Close') }}</el-button>
      <el-button type="primary" @click="onEdit">{{ $t('history.Edit Task') }}</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'TaskDetailDialog',
  model: { prop: 'value', event: 'input' },
  props: {
    value: { type: Boolean, default: false },
    task: { type: Object, default: null },
  },
  computed: {
    firstPolicy() {
      return (this.task && this.task.policies && this.task.policies[0]) || {};
    },
    displayName() {
      if (!this.task) return '';
      if (this.task.task_name) return this.task.task_name;
      const ps = this.task.policies || [];
      if (ps.length === 1) return `${ps[0].database}.${ps[0].table}`;
      return `${ps[0].database}.${ps[0].table} (+${ps.length - 1})`;
    },
  },
  methods: {
    onEdit() {
      this.$emit('edit-task', this.task);
      this.$emit('input', false);
    },
  },
};
</script>

<style scoped>
.section { margin-bottom: 16px; }
.section-title { font-size: 14px; font-weight: 500; color: #303133; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
.section-title .num { background: #C9A100; color: white; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; }
.kv-row { display: grid; grid-template-columns: 140px 1fr; gap: 12px; margin-bottom: 6px; align-items: start; }
.kv-key { color: #909399; font-size: 13px; text-align: right; padding-top: 4px; }
.kv-val { color: #303133; font-size: 13px; padding-top: 4px; }
.kv-val.mono { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; }
</style>
