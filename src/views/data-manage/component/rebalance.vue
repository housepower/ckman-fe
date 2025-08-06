<template>
  <div>
    <el-form ref="rebalanceForm" :model="form" :rules="rules" label-width="150px" label-position="right">
      <!-- 数据库名 -->
      <el-form-item :label="$t('rebalance.Database')" prop="database">
        <el-input v-model="form.database" :placeholder="$t('rebalance.Enter database name')"></el-input>
      </el-form-item>

      <!-- 表名（正则表达式） -->
      <el-form-item :label="$t('rebalance.Table Name')" prop="table">
        <el-input v-model="form.table" :placeholder="$t('rebalance.Enter table pattern')"></el-input>
      </el-form-item>

      <!-- 均衡策略 -->
      <el-form-item :label="$t('rebalance.Rebalance Strategy')" prop="policy">
        <el-radio-group v-model="form.policy" @change="handleStrategyChange">
          <el-radio label="partition">{{ $t('rebalance.By Partition') }}</el-radio>
          <el-radio label="shardingkey">{{ $t('rebalance.By Sharding Key') }}</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- Shardingkey 相关配置 -->
      <template v-if="form.policy === 'shardingkey'">
        <el-form-item :label="$t('rebalance.Sharding Key')" prop="shardingKey">
          <el-input v-model="form.shardingKey" :placeholder="$t('rebalance.Enter sharding key')"></el-input>
        </el-form-item>

        <el-form-item :label="$t('rebalance.Allowable Error Rate')" prop="errorRate">
          <el-input-number v-model="form.allowLossRate" :min="0" :max="1" :step="0.01" :precision="2"
            :placeholder="$t('rebalance.Enter value between 0 and 1')"></el-input-number>
        </el-form-item>
        <!-- 开关选项 -->
        <el-form-item :label="$t('rebalance.Keep Temp Data')" prop="keepTempData">
          <el-switch v-model="form.saveTemps"></el-switch>
        </el-form-item>
      </template>

      <el-form-item :label="$t('rebalance.Shard Scaling Down')" prop="except_max_shard">
        <el-switch v-model="form.except_max_shard"></el-switch>
      </el-form-item>

      <!-- 警告信息 -->
      <el-alert :title="$t('rebalance.warning')" type="warning" :closable="false" show-icon>
        {{ $t('manage.Disabled Writing') }}
      </el-alert>
    </el-form>

    <!-- 操作按钮 -->
    <div class="dialog-footer" style="margin-top: 20px; text-align: center;">
      <el-button @click="getRebalanceInfo">{{ $t('manage.Rebalance Info') }}</el-button>
      <el-button @click="resetForm">{{ $t('common.Reset') }}</el-button>
      <el-button type="primary" @click="onSubmit" :loading="loading">{{ $t('common.Confirm') }}</el-button>
    </div>
  </div>
</template>

<script>
import RebalanceInfoComponent from './rebalanceInfo.vue';
import { $modal } from "@/services";
import { ClusterApi } from '@/apis';

export default {
  name: 'RebalanceCluster',
  props: {
    type: String,
    password: String,
  },
  data() {
    return {
      form: {
        database: '',
        table: '',
        policy: 'partition',
        shardingKey: '',
        allowLossRate: 0.05,
        saveTemps: false,
        except_max_shard: false
      },
      rules: {
        database: [
          { required: true, message: '数据库名不能为空', trigger: 'blur' }
        ],
        table: [
          { required: true, message: '表名模式不能为空', trigger: 'blur' }
        ],
        ploicy: [
          { required: true, message: '请选择均衡策略', trigger: 'change' }
        ],
        shardingKey: [
          {
            required: true,
            message: '分片键不能为空',
            trigger: 'blur',
            validator: (rule, value, callback) => {
              if (this.form.policy === 'shardingkey' && !value.trim()) {
                callback(new Error('分片键不能为空'));
              } else {
                callback();
              }
            }
          }
        ],
        allowLossRate: [
          {
            required: true,
            message: '错误率不能为空',
            trigger: 'blur',
            validator: (rule, value, callback) => {
              if (this.form.policy === 'shardingkey' && (value === null || value === undefined)) {
                callback(new Error('错误率不能为空'));
              } else {
                callback();
              }
            }
          }
        ]
      },
      loading: false,
      clusterName: '',
    }
  },
  created() {
    this.clusterName = this.$route.params.id;
  },
  methods: {
    // 处理策略变化
    handleStrategyChange(value) {
      if (value !== 'shardingkey') {
        this.form.shardingKey = '';
        this.form.errorRate = 0.05;
      }
    },

    // 获取均衡信息
    getRebalanceInfo() {
      this.$refs.rebalanceForm.validate(valid => {
        if (valid) {
          $modal({
            component: RebalanceInfoComponent,
            props: {
              title: "均衡信息",
              width: 800,
              cancelText: null,
              okText: null,
            },
            data: {
              clusterName: this.clusterName,
              formData: {
                tables: [{
                  database: this.form.database,
                  table: this.form.table,
                }]
              },
            },
          });
        } else {
          this.$message.error('请先填写完整表单');
        }
      });
    },

    // 提交表单
    onSubmit() {
      this.$refs.rebalanceForm.validate(valid => {
        if (valid) {
          this.loading = true;
          ClusterApi.rebalanceCluster({
            clusterName: this.clusterName,
            params: {
              tables: [{
                database: this.form.database,
                table: this.form.table,
                policy: this.form.policy,
                shardingKey: this.form.policy === 'shardingkey' ? this.form.shardingKey : undefined,
                allowLossRate: this.form.policy === 'shardingkey' ? this.form.allowLossRate : undefined,
                saveTemps: this.form.saveTemps
              }],
              except_max_shard: this.form.except_max_shard
            },
            password: this.password
          }).finally(() => {
            this.loading = false;
          });
        }
      });
    },

    // 重置表单
    resetForm() {
      this.$refs.rebalanceForm.resetFields();
      this.form.policy = 'partition';
      this.form.shardingKey = '';
      this.form.allowLossRate = 0.05;
      this.form.saveTemps = false;
      this.form.except_max_shard = false;
    }
  }
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.dialog-footer {
  margin-top: 20px;
  text-align: center;
}

.el-alert {
  margin: 20px 0;
}
</style>