<template>
  <el-dialog
    :visible.sync="visible"
    :title="title"
    width="720px"
    :close-on-click-modal="false"
    @opened="onOpened"
  >
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="120px"
      size="small"
    >
      <!-- 1. Readonly fields -->
      <div class="section-title">{{ $t('history.Readonly Fields') }}</div>
      <el-form-item :label="$t('backup.Database')">
        <el-input :value="form.database" disabled />
      </el-form-item>
      <el-form-item :label="$t('backup.Table Name')">
        <el-input :value="form.table" disabled />
      </el-form-item>
      <el-form-item :label="$t('backup.Backup Type')">
        <el-input :value="scheduleTypeLabel" disabled />
        <div class="form-hint">{{ $t('history.Readonly Fields Hint') }}</div>
      </el-form-item>

      <!-- 2. Schedule (only for scheduled) -->
      <template v-if="form.schedule_type === 'scheduled'">
        <div class="section-title">{{ $t('backup.Schedule') }}</div>
        <el-form-item label="Crontab" prop="crontab">
          <el-input v-model="form.crontab" />
          <div class="form-hint">{{ $t('history.Crontab Min Interval') }}</div>
        </el-form-item>
        <el-form-item :label="$t('history.Instance')" prop="instance">
          <el-select v-model="form.instance" filterable style="width: 100%">
            <el-option
              v-for="ins in instanceList"
              :key="ins"
              :label="ins"
              :value="ins"
            />
          </el-select>
          <div v-if="instanceChanged" class="form-hint warn-hint">
            ⚠ <b>{{ $t('history.Instance Change Warn Title') }}</b><br>
            {{ $t('history.Instance Change Warn 1') }}<br>
            {{ $t('history.Instance Change Warn 2') }}<br>
            {{ $t('history.Instance Change Warn 3') }}
          </div>
        </el-form-item>
      </template>

      <el-form-item :label="$t('history.Enabled')">
        <el-checkbox v-model="form.enabled">{{ $t('history.Enable This Policy') }}</el-checkbox>
      </el-form-item>

      <!-- 3. Backup content -->
      <div class="section-title">{{ $t('history.Backup Content') }}</div>
      <el-form-item :label="$t('backup.Backup Method')">
        <el-radio-group v-model="form.backup_style">
          <el-radio label="incremental">{{ $t('backup.Incremental Backup') }}</el-radio>
          <el-radio label="full" :disabled="form.schedule_type === 'scheduled'">{{ $t('backup.Full Backup') }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.backup_style === 'incremental'" :label="$t('backup.Incremental Method')">
        <el-radio-group v-model="form.backup_type">
          <el-radio label="partition">{{ $t('backup.By Partition Name') }}</el-radio>
          <el-radio label="daily">{{ $t('backup.By Time Period') }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.backup_type === 'daily'" :label="$t('backup.Time Range')">
        <el-input-number
          v-model="form.days_before"
          :min="1"
          :max="365"
          controls-position="right"
          style="width: 120px"
        />
        {{ $t('backup.Days Ago Text') }}
      </el-form-item>

      <!-- 4. Backup target (S3) -->
      <template v-if="form.target_type === 's3' && form.s3">
        <div class="section-title">{{ $t('history.Backup Target S3') }}</div>
        <el-form-item :label="$t('backup.Endpoint')">
          <el-input v-model="form.s3.endpoint" />
        </el-form-item>
        <el-form-item :label="$t('backup.Bucket')">
          <el-input v-model="form.s3.bucket" />
        </el-form-item>
        <el-form-item :label="$t('backup.AccessKeyID')">
          <el-input v-model="form.s3.accessKeyId" />
        </el-form-item>
        <el-form-item :label="$t('backup.SecretAccessKey')">
          <el-input v-model="form.s3.secretAccessKey" type="password" show-password />
          <div class="form-hint">{{ $t('history.Secret Key Hint') }}</div>
        </el-form-item>
      </template>

      <!-- 5. Options -->
      <div class="section-title">{{ $t('backup.Compression Format') }}</div>
      <el-form-item :label="$t('backup.Compression Format')">
        <el-select v-model="form.compression" style="width: 160px">
          <el-option
            v-for="c in compressionOptions"
            :key="c"
            :label="c"
            :value="c"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('backup.Checksum')">
        <el-checkbox v-model="form.checksum">{{ $t('history.Enable Md5 Check') }}</el-checkbox>
      </el-form-item>
      <el-form-item :label="$t('backup.Clean Successful Partitions')">
        <el-checkbox v-model="form.clean">{{ $t('history.Clean Partition After') }}</el-checkbox>
        <div v-if="form.clean" class="form-hint danger-hint">
          ⚠ {{ $t('history.Clean Partition Danger') }}
        </div>
      </el-form-item>
    </el-form>

    <span slot="footer" class="footer-row">
      <span class="muted footer-hint">{{ $t('history.Edit Effect 60s') }}</span>
      <span>
        <el-button @click="visible = false">{{ $t('history.Cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">{{ $t('history.Save') }}</el-button>
      </span>
    </span>
  </el-dialog>
</template>

<script>
import { DataManageApi, ConfigApi } from '@/apis';

export default {
  name: 'PolicyEditModal',
  model: {
    prop: 'value',
    event: 'input',
  },
  props: {
    policyId: {
      type: String,
      default: '',
    },
    value: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      form: {
        database: '',
        table: '',
        schedule_type: '',
        crontab: '',
        instance: '',
        enabled: true,
        backup_style: 'incremental',
        backup_type: 'partition',
        days_before: 1,
        target_type: '',
        s3: null,
        compression: 'none',
        checksum: false,
        clean: false,
      },
      originalInstance: '',
      instanceList: [],
      saving: false,
      compressionOptions: ['none', 'gzip', 'gz', 'brotli', 'br', 'xz', 'LZMA', 'zstd'],
      rules: {
        crontab: [
          { required: true, message: 'Crontab is required', trigger: 'blur' },
        ],
        instance: [
          { required: true, message: 'Instance is required', trigger: 'change' },
        ],
      },
    };
  },
  computed: {
    visible: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit('input', val);
      },
    },
    title() {
      const tbl = this.form.database && this.form.table
        ? `${this.form.database}.${this.form.table}`
        : '';
      return this.$t('history.Edit Policy Title', { table: tbl });
    },
    scheduleTypeLabel() {
      if (this.form.schedule_type === 'scheduled') return this.$t('history.Schedule Scheduled');
      if (this.form.schedule_type === 'immediate') return this.$t('history.Schedule Immediate');
      return this.form.schedule_type || '—';
    },
    instanceChanged() {
      return this.form.instance !== this.originalInstance && this.originalInstance !== '';
    },
  },
  watch: {
    value(newVal) {
      if (newVal && this.policyId) {
        this.fetchPolicy();
        this.fetchInstances();
      }
    },
    policyId(newId) {
      if (newId && this.value) {
        this.fetchPolicy();
        this.fetchInstances();
      }
    },
  },
  methods: {
    onOpened() {
      // reset form validation on open
      if (this.$refs.form) {
        this.$refs.form.clearValidate();
      }
    },

    async fetchPolicy() {
      if (!this.policyId) return;
      try {
        const res = await DataManageApi.getPolicy(this.policyId);
        if (res.data.retCode === '0000') {
          const p = res.data.entity || {};
          // Deep copy to avoid mutating source
          this.form = {
            ...p,
            s3: p.s3 ? { ...p.s3, secretAccessKey: '' } : null,
          };
          this.originalInstance = p.instance || '';
        } else {
          this.$message.error(res.data.retMsg || '获取策略详情失败');
        }
      } catch (e) {
        this.$message.error('获取策略详情异常: ' + e.message);
      }
    },

    async fetchInstances() {
      try {
        const res = await ConfigApi.getInstances();
        if (res.data.retCode === '0000') {
          this.instanceList = res.data.entity || [];
        }
      } catch (e) {
        // non-critical, silent
        console.error('fetchInstances error:', e);
      }
    },

    async onSave() {
      try {
        await this.$refs.form.validate();
      } catch {
        return;
      }

      // Build body: omit secretAccessKey if left blank (don't overwrite original)
      const body = { ...this.form };
      if (body.s3) {
        body.s3 = { ...body.s3 };
        if (!body.s3.secretAccessKey) {
          delete body.s3.secretAccessKey;
        }
      }

      this.saving = true;
      try {
        const res = await DataManageApi.updatePolicy(this.policyId, body);
        if (res.data.retCode === '0000') {
          this.$message.success(this.$t('common.Action Success'));
          this.$emit('updated');
          this.visible = false;
        } else {
          this.$message.error(res.data.retMsg || '保存失败');
        }
      } catch (e) {
        this.$message.error('保存异常: ' + e.message);
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  margin: 14px 0 10px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #EBEEF5;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 4px;
}

.warn-hint {
  color: #E6A23C;
  background: #FDF6EC;
  border: 1px solid #FAECD8;
  border-radius: 3px;
  padding: 8px 10px;
  margin-top: 6px;
}

.danger-hint {
  color: #F56C6C;
  background: #FEF0F0;
  border: 1px solid #FDE2E2;
  border-radius: 3px;
  padding: 6px 10px;
  margin-top: 4px;
}

.footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.footer-hint {
  font-size: 12px;
  color: #909399;
}

.muted {
  color: #909399;
}
</style>
