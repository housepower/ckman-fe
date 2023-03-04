<template>
  <div>
    <el-form label-width="140px" :model="formData" :rules="rules" ref="form">
      <el-form-item :label="$t('tables.Time Range')" prop="timeRange">
        <el-date-picker
          class="width-400"
          v-model="formData.timeRange"
          type="daterange"
          align="right"
          unlink-panels
          :range-separator="$t('tables.To')"
          :start-placeholder="$t('tables.Begin')"
          :end-placeholder="$t('tables.End')"
          value-format="yyyy-MM-dd"
          :picker-options="pickerOptions">
        </el-date-picker>
      </el-form-item>

      <el-form-item :label="$t('tables.Export Format')" prop="format">
        <el-select v-model="formData.format" :placeholder="$t('common.Please Choose')" class="width-400">
          <el-option
            v-for="item in exportFormatOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('tables.Maximum Time Slice')" prop="maxfilesize">
        <el-input-number v-model="formData.maxfilesize" :placeholder="$t('common.Please fill out')" class="width-400" />
      </el-form-item>

      <el-form-item :label="$t('tables.Target')" prop="target">
        <el-select v-model="formData.target" :placeholder="$t('common.Please Choose')" class="width-400">
          <el-option
            v-for="item in targetOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>
      
      <template v-if="formData.target === 'local'">
        <el-form-item :label="$t('tables.Path')" :placeholder="$t('common.Please fill out')" prop="local.path">
          <el-input v-model="formData.local.path" />
        </el-form-item>
      </template>

      <template v-else-if="formData.target === 'hdfs'">
        <el-form-item :label="$t('tables.Address')" prop="hdfs.addr">
          <el-input v-model="formData.hdfs.addr" :placeholder="$t('common.Please fill out')" />
        </el-form-item>
        <el-form-item :label="$t('tables.User')" prop="hdfs.user">
          <el-input v-model="formData.hdfs.user" :placeholder="$t('common.Please fill out')" />
        </el-form-item>
        <el-form-item :label="$t('tables.Directory')" prop="hdfs.dir">
          <el-input v-model="formData.hdfs.dir" :placeholder="$t('common.Please fill out')" />
        </el-form-item>
      </template>

      <template v-else-if="formData.target === 's3'">
        <el-form-item :label="$t('tables.Endpoint')" prop="s3.endpoint">
          <el-input v-model="formData.s3.endpoint" :placeholder="$t('common.Please fill out')" />
        </el-form-item>
        <el-form-item :label="$t('tables.AccessKeyID')" prop="s3.accessKeyId">
          <el-input v-model="formData.s3.accessKeyId" :placeholder="$t('common.Please fill out')" />
        </el-form-item>
        <el-form-item :label="$t('tables.SecretAccessKey')" prop="s3.secretAccessKey">
          <el-input v-model="formData.s3.secretAccessKey" :placeholder="$t('common.Please fill out')" />
        </el-form-item>
        <el-form-item :label="$t('tables.Region')" prop="s3.region">
          <el-input v-model="formData.s3.region" :placeholder="$t('common.Please fill out')" />
        </el-form-item>
        <el-form-item :label="$t('tables.Bucket')" prop="s3.bucket">
          <el-input v-model="formData.s3.bucket" :placeholder="$t('common.Please fill out')" />
        </el-form-item>
        <el-form-item :label="$t('tables.Compression')" prop="s3.compression">
          <el-select v-model="formData.s3.compression" :placeholder="$t('common.Please choose')">
          <el-option
            v-for="item in compressionOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
        </el-form-item>
      </template>

    </el-form>
  </div>
</template>
<script>
import { TablesApi } from '@/apis';

export default {
  name: 'ArchiveModal',
  props: {
    clusterName: {
      type: String,
      require: true
    },
    database: {
      type: String,
      require: true
    },
    tables: {
      type: Array,
      require: true
    }
  },

  data() {
    return {
      formData: {
        timeRange: null,
        format: 'CSV',
        maxfilesize: 1000000000,
        target: 'local',
        local: {
          path: '',
        },
        hdfs: {
          addr: '',
          user: '',
          dir: '',
        },
        s3: {
          endpoint: '',
          accessKeyId: '',
          secretAccessKey: '',
          region: '',
          bucket: '',
          compression: 'gzip'
        }
      },
      rules: {
        timeRange: [{required: true, type: 'array', message: this.$t('common.Please Choose')}],
        format:  [{required: true, type: 'string', message: this.$t('common.Please Choose')}],
        maxfilesize:  [{required: true, type: 'number', message: this.$t('common.Please fill out')}],
        target:  [{required: true, type: 'string', message: this.$t('common.Please Choose')}],

        local: {
          path: [{required: true, type: 'string', message: this.$t('common.Please fill out')}],
        },

        hdfs: {
          addr: [{required: true, type: 'string', message: this.$t('common.Please fill out')}],
          user: [{required: true, type: 'string', message: this.$t('common.Please fill out')}],
          dir: [{required: true, type: 'string', message: this.$t('common.Please fill out')}],
        },

        s3: {
          Endpoint: [{required: true, type: 'string', message: this.$t('common.Please fill out')}],
          AccessKeyID: [{required: true, type: 'string', message: this.$t('common.Please fill out')}],
          SecretAccessKey: [{required: true, type: 'string', message: this.$t('common.Please fill out')}],
          Region: [{required: true, type: 'string', message: this.$t('common.Please fill out')}],
          Bucket: [{required: true, type: 'string', message: this.$t('common.Please fill out')}],
          Compression:  [{required: true, type: 'string', message: this.$t('common.Please Choose')}],
        },
      },
      exportFormatOptions: [
        { label: 'CSV', value: 'CSV' },
        { label: 'ORC', value: 'ORC' },
        { label: 'Parquet', value: 'Parquet' }
      ],
      targetOptions: [
        { label: 'local', value: 'local' },
        { label: 'hdfs', value: 'hdfs' },
        { label: 's3', value: 's3' }
      ],
      compressionOptions: [
        { label: 'none', value: 'none' },
        { label: 'gzip', value: 'gzip' },
        { label: 'gz', value: 'gz' },
        { label: 'brotli', value: 'brotli' },
        { label: 'br', value: 'br' },
        { label: 'xz', value: 'xz' },
        { label: 'LZMA', value: 'LZMA' },
        { label: 'zstd', value: 'zstd' },
        { label: 'zst', value: 'zst' },
      ],
      pickerOptions: {
        shortcuts: [{
          text:this.$t('tables.Current Month'),
          onClick(picker) {
            picker.$emit('pick', [new Date(), new Date()]);
          }
        }, {
          text: this.$t('tables.So far this year'),
          onClick(picker) {
            const end = new Date();
            const start = new Date(new Date().getFullYear(), 0);
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: this.$t('tables.Last six months'),
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setMonth(start.getMonth() - 6);
            picker.$emit('pick', [start, end]);
          }
        }]
      },
    }
  },

  created() {
  },

  mounted() {
  },

  methods: {
    async onOk() {
      const form = this.$refs.form;
      await form.validate();
      const { clusterName, database, tables, formData } = this;
      const [begin, end] = formData.timeRange;
      const params = {
        ...this.formData,
        database,
        tables,
        begin,
        end,
      };

      delete params.timeRange;
      const { data: { entity: taskId } } = await TablesApi.archiveTables(clusterName, params);
      return taskId;
    }
  }
}
</script>