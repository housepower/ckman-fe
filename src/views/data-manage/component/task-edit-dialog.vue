<template>
  <el-dialog
    :visible="value"
    :title="$t('history.Edit Task Title', { name: displayName })"
    width="720px"
    :close-on-click-modal="false"
    @update:visible="$emit('input', $event)"
    @opened="onOpened"
  >
    <el-form ref="form" :model="form" :rules="rules" label-width="120px" size="small" v-if="task">
      <!-- ① 调度 -->
      <div class="section-title">{{ $t('backup.Schedule') }}</div>
      <el-form-item :label="$t('history.Task Name')" prop="task_name">
        <el-input v-model="form.task_name" :placeholder="$t('history.Task Name Placeholder')" />
      </el-form-item>
      <el-form-item :label="$t('history.Enabled')">
        <el-switch v-model="form.enabled" active-color="#C9A100" inactive-color="#c0c4cc" />
      </el-form-item>
      <el-form-item :label="$t('backup.Backup Type')">
        <el-input
          :value="form.schedule_type === 'scheduled' ? $t('history.Schedule Scheduled') : $t('history.Schedule Immediate')"
          disabled
        />
      </el-form-item>
      <template v-if="form.schedule_type === 'scheduled'">
        <el-form-item label="Crontab" prop="crontab">
          <el-input v-model="form.crontab" :placeholder="$t('backup.Enter cron expression')" />
          <span class="form-hint">{{ $t('history.Crontab Min Interval') }}</span>
        </el-form-item>
        <el-form-item :label="$t('backup.Instance')" prop="instance">
          <el-select v-model="form.instance" filterable style="width:100%">
            <el-option v-for="ins in instanceList" :key="ins" :label="ins" :value="ins" />
          </el-select>
          <div v-if="instanceChanged" class="warn-hint">
            ⚠ <b>{{ $t('history.Instance Change Warn Title') }}</b><br>
            {{ $t('history.Instance Change Warn 1') }}<br>
            {{ $t('history.Instance Change Warn 2') }}<br>
            {{ $t('history.Instance Change Warn 3') }}
          </div>
        </el-form-item>
      </template>

      <!-- ② 备份对象 -->
      <div class="section-title">{{ $t('backup.Backup Object') }}</div>
      <el-form-item :label="$t('backup.Database')">
        <el-input :value="form.database" disabled />
      </el-form-item>
      <el-form-item :label="$t('backup.Table Name')">
        <div>
          <el-tag v-for="t in form.tables" :key="t" size="small" style="margin-right:4px;margin-bottom:4px">{{ t }}</el-tag>
        </div>
      </el-form-item>

      <!-- ③ 备份方式 -->
      <div class="section-title">{{ $t('backup.Backup Mode') }}</div>
      <el-form-item :label="$t('backup.Backup Method')">
        <el-input
          :value="form.backup_style === 'full' ? $t('backup.Full Backup') : $t('backup.Incremental Backup')"
          disabled
        />
      </el-form-item>
      <el-form-item v-if="form.backup_style === 'incremental'" :label="$t('backup.Incremental Method')">
        <el-input
          :value="form.backup_type === 'partition' ? $t('backup.By Partition Name') : $t('backup.By Time Period')"
          disabled
        />
      </el-form-item>
      <el-form-item v-if="form.backup_type === 'daily' && form.backup_style === 'incremental'" :label="$t('backup.Time Range')">
        <el-input :value="form.days_before + ' ' + $t('backup.Days Ago Text')" disabled />
      </el-form-item>

      <!-- ④ 备份目标 -->
      <div class="section-title">{{ $t('backup.Backup Target Section') }}</div>
      <el-form-item :label="$t('backup.Backup Target')">
        <el-input :value="form.target_type === 's3' ? 'AWS S3' : 'Local'" disabled />
      </el-form-item>
      <template v-if="form.target_type === 's3'">
        <el-form-item :label="$t('backup.Endpoint')">
          <el-input :value="form.s3Endpoint" disabled />
        </el-form-item>
        <el-form-item :label="$t('backup.Bucket')">
          <el-input :value="form.s3Bucket" disabled />
        </el-form-item>
        <el-form-item :label="$t('backup.AccessKeyID')" prop="s3AccessKeyId">
          <el-input v-model="form.s3AccessKeyId" />
        </el-form-item>
        <el-form-item :label="$t('backup.SecretAccessKey')">
          <el-input v-model="form.s3SecretAccessKey" type="password" show-password />
          <span class="form-hint">{{ $t('history.Secret Key Hint') }}</span>
        </el-form-item>
        <el-form-item :label="$t('backup.Region')">
          <el-input v-model="form.s3Region" />
        </el-form-item>
      </template>
      <template v-if="form.target_type === 'local'">
        <el-form-item :label="$t('backup.Backup Path')">
          <el-input :value="form.localPath" disabled />
        </el-form-item>
      </template>

      <!-- ⑤ 选项 -->
      <div class="section-title">{{ $t('backup.Options') }}</div>
      <el-form-item :label="$t('backup.Compression Format')">
        <el-select v-model="form.compression" style="width:100%">
          <el-option v-for="c in ['gzip', 'gz', 'zstd', 'none']" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('backup.Checksum')">
        <el-switch v-model="form.checksum" active-color="#C9A100" inactive-color="#c0c4cc" />
      </el-form-item>
      <el-form-item :label="$t('backup.Clean Successful Partitions')">
        <el-switch v-model="form.clean" active-color="#C9A100" inactive-color="#c0c4cc" />
        <div v-if="form.clean" class="danger-hint">⚠ {{ $t('history.Clean Partition Danger') }}</div>
      </el-form-item>
    </el-form>

    <span slot="footer" class="footer-row">
      <span class="muted">{{ $t('history.Edit Effect 60s') }}</span>
      <span>
        <el-button @click="$emit('input', false)">{{ $t('history.Cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">{{ $t('history.Save') }}</el-button>
      </span>
    </span>
  </el-dialog>
</template>

<script>
import { DataManageApi, ConfigApi } from '@/apis';

export default {
  name: 'TaskEditDialog',
  model: { prop: 'value', event: 'input' },
  props: {
    value: { type: Boolean, default: false },
    task: { type: Object, default: null },
  },
  data() {
    return {
      form: this.emptyForm(),
      originalInstance: '',
      instanceList: [],
      saving: false,
      rules: {
        crontab: [{
          validator: (_, val, cb) => {
            if (this.form.schedule_type !== 'scheduled') { cb(); return; }
            if (!val || !val.trim()) cb(new Error(this.$t('backup.Enter cron expression')));
            else cb();
          },
          trigger: 'blur',
        }],
        s3Endpoint: [{
          validator: (_, val, cb) => {
            if (this.form.target_type !== 's3') { cb(); return; }
            if (!val || !val.trim()) cb(new Error(this.$t('backup.Enter S3 endpoint')));
            else cb();
          },
          trigger: 'blur',
        }],
        s3Bucket: [{
          validator: (_, val, cb) => {
            if (this.form.target_type !== 's3') { cb(); return; }
            if (!val || !val.trim()) cb(new Error(this.$t('backup.Enter Bucket name')));
            else cb();
          },
          trigger: 'blur',
        }],
        s3AccessKeyId: [{
          validator: (_, val, cb) => {
            if (this.form.target_type !== 's3') { cb(); return; }
            if (!val || !val.trim()) cb(new Error(this.$t('backup.Enter AccessKeyID')));
            else cb();
          },
          trigger: 'blur',
        }],
        localPath: [{
          validator: (_, val, cb) => {
            if (this.form.target_type !== 'local') { cb(); return; }
            if (!val || !val.trim()) cb(new Error(this.$t('backup.Enter backup path')));
            else cb();
          },
          trigger: 'blur',
        }],
      },
    };
  },
  computed: {
    displayName() {
      if (!this.task) return '';
      if (this.task.task_name) return this.task.task_name;
      const ps = this.task.policies || [];
      if (ps.length === 1) return `${ps[0].database}.${ps[0].table}`;
      return `${ps[0].database}.${ps[0].table} (+${ps.length - 1})`;
    },
    instanceChanged() {
      return this.form.instance !== this.originalInstance;
    },
  },
  watch: {
    value(visible) {
      if (visible && this.task) this.loadFromTask();
    },
  },
  methods: {
    emptyForm() {
      return {
        task_name: '', schedule_type: 'immediate', crontab: '', instance: '', enabled: true,
        database: '', tables: [],
        backup_style: 'incremental', backup_type: 'partition', days_before: 7,
        target_type: 's3',
        s3Endpoint: '', s3Bucket: '', s3AccessKeyId: '', s3SecretAccessKey: '', s3Region: '',
        localPath: '',
        compression: 'gzip', checksum: true, clean: false,
      };
    },
    loadFromTask() {
      const t = this.task;
      const p = t.policies[0] || {};
      this.form = {
        task_name: t.task_name || '',
        schedule_type: t.schedule_type,
        crontab: t.crontab || '',
        instance: t.instance || '',
        enabled: t.enabled,
        database: p.database || '',
        tables: t.policies.map(x => x.table),
        backup_style: p.backup_style || 'incremental',
        backup_type: p.backup_type || 'partition',
        days_before: p.days_before || 7,
        target_type: p.target_type || 's3',
        s3Endpoint: (p.s3 && (p.s3.Endpoint || p.s3.endpoint)) || '',
        s3Bucket: (p.s3 && (p.s3.Bucket || p.s3.bucket)) || '',
        s3AccessKeyId: (p.s3 && (p.s3.AccessKeyID || p.s3.accessKeyId)) || '',
        s3SecretAccessKey: '',
        s3Region: (p.s3 && (p.s3.Region || p.s3.region)) || '',
        localPath: (p.local && p.local.path) || '',
        compression: p.compression || 'gzip',
        checksum: !!p.checksum,
        clean: !!p.clean,
      };
      this.originalInstance = this.form.instance;
    },
    async onOpened() {
      try {
        const res = await ConfigApi.getInstances();
        if (res.data.retCode === '0000') this.instanceList = res.data.entity || [];
      } catch { /* silent */ }
    },
    async onSave() {
      this.$refs.form.validate(async valid => {
        if (!valid) return;
        this.saving = true;
        const editedFields = this.buildEditedFields();
        const results = await Promise.allSettled(
          this.task.policies.map(async p => {
            const body = { ...p, ...editedFields, policy_id: p.policy_id, table: p.table };
            const res = await DataManageApi.updatePolicy(p.policy_id, body);
            if (res.data.retCode !== '0000') throw new Error(res.data.retMsg || 'unknown');
            return res;
          })
        );
        this.saving = false;
        const success = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.length - success;
        if (failed === 0) {
          this.$message.success(this.$t('history.Task Updated', { count: success }));
        } else {
          this.$message.warning(this.$t('history.Task Update Partial', { success, failed }));
        }
        this.$emit('updated');
        this.$emit('input', false);
      });
    },
    buildEditedFields() {
      const f = this.form;
      const body = {
        task_name: f.task_name,
        crontab: f.crontab,
        instance: f.instance,
        enabled: f.enabled,
        backup_style: f.backup_style,
        backup_type: f.backup_type,
        days_before: f.days_before,
        target_type: f.target_type,
        compression: f.compression,
        checksum: f.checksum,
        clean: f.clean,
      };
      if (f.target_type === 's3') {
        body.s3 = {
          endpoint: f.s3Endpoint,
          accessKeyId: f.s3AccessKeyId,
          region: f.s3Region,
          bucket: f.s3Bucket,
        };
        if (f.s3SecretAccessKey && f.s3SecretAccessKey.trim() !== '') {
          body.s3.secretAccessKey = f.s3SecretAccessKey;
        }
      } else if (f.target_type === 'local') {
        body.local = { path: f.localPath };
      }
      return body;
    },
  },
};
</script>

<style scoped>
.section-title {
  font-size: 13px; font-weight: 500; color: #303133;
  margin: 14px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #ebeef5;
}
.form-hint { font-size: 12px; color: #909399; line-height: 1.5; }
.warn-hint {
  margin-top: 6px; padding: 8px 10px; background: #fdf6ec; border: 1px solid #f5dab1;
  color: #ad6c00; border-radius: 3px; font-size: 12px; line-height: 1.5;
}
.danger-hint {
  margin-top: 6px; padding: 8px 10px; background: #fef0f0; border: 1px solid #fbc4c4;
  color: #F56C6C; border-radius: 3px; font-size: 12px; line-height: 1.5;
}
.footer-row {
  display: flex; justify-content: space-between; align-items: center;
}
.muted { color: #909399; font-size: 12px; }
</style>
