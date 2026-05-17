<template>
  <section class="rebalance">
    <div class="rebalance__head">
      <h2 class="rebalance__title">{{ $t('manage.Rebalance Cluster') }}</h2>
      <p class="rebalance__desc">{{ $t('rebalance.description') }}</p>
    </div>

    <el-alert
      class="rebalance__alert"
      :title="$t('rebalance.warning')"
      type="warning"
      :closable="false"
      show-icon
    >
      {{ $t('manage.Disabled Writing') }}
    </el-alert>

    <div class="rebalance__card">
      <el-form
        ref="rebalanceForm"
        :model="form"
        :rules="rules"
        label-position="top"
        size="medium"
      >
        <h4 class="rebalance__section">{{ $t('rebalance.sectionTarget') }}</h4>
        <div class="rebalance__grid">
          <el-form-item :label="$t('rebalance.Database')" prop="database" required>
            <el-input v-model="form.database" :placeholder="$t('rebalance.Enter database name')" />
          </el-form-item>
          <el-form-item :label="$t('rebalance.Table Name')" prop="table" required>
            <el-input v-model="form.table" :placeholder="$t('rebalance.Enter table pattern')" />
          </el-form-item>
        </div>

        <h4 class="rebalance__section">{{ $t('rebalance.sectionStrategy') }}</h4>
        <div class="rebalance__grid">
          <el-form-item
            :label="$t('rebalance.Rebalance Strategy')"
            prop="policy"
            class="rebalance__full"
          >
            <el-radio-group v-model="form.policy" @change="handleStrategyChange">
              <el-radio-button label="partition">{{ $t('rebalance.By Partition') }}</el-radio-button>
              <el-radio-button label="shardingkey">{{ $t('rebalance.By Sharding Key') }}</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <template v-if="form.policy === 'shardingkey'">
            <el-form-item :label="$t('rebalance.Sharding Key')" prop="shardingKey" required>
              <el-input v-model="form.shardingKey" :placeholder="$t('rebalance.Enter sharding key')" />
            </el-form-item>
            <el-form-item :label="$t('rebalance.Allowable Error Rate')" prop="allowLossRate">
              <el-input-number
                v-model="form.allowLossRate"
                :min="0"
                :max="1"
                :step="0.01"
                :precision="2"
                class="rebalance__field"
              />
            </el-form-item>
          </template>
        </div>

        <h4 class="rebalance__section">{{ $t('rebalance.sectionOptions') }}</h4>
        <div class="rebalance__switch-row">
          <el-form-item
            v-if="form.policy === 'shardingkey'"
            :label="$t('rebalance.Keep Temp Data')"
            prop="saveTemps"
          >
            <el-switch v-model="form.saveTemps" />
          </el-form-item>
          <el-form-item :label="$t('rebalance.Shard Scaling Down')" prop="except_max_shard">
            <el-switch v-model="form.except_max_shard" />
          </el-form-item>
        </div>
      </el-form>
    </div>

    <div class="rebalance__footer">
      <el-button size="medium" @click="resetForm">{{ $t('common.Reset') }}</el-button>
      <el-button size="medium" @click="getRebalanceInfo">{{ $t('manage.Rebalance Info') }}</el-button>
      <el-button size="medium" type="primary" :loading="loading" @click="onSubmit">
        {{ $t('common.Confirm') }}
      </el-button>
    </div>
  </section>
</template>

<script>
import RebalanceInfoComponent from './rebalanceInfo.vue';
import RebalancePlanPreview from './rebalancePlanPreview.vue';
import TaskDetail from '@/views/task/components/TaskDetail.vue';
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
        except_max_shard: false,
      },
      rules: {
        database: [
          { required: true, message: this.$t('rebalance.Database name cannot be empty'), trigger: 'blur' },
        ],
        table: [
          { required: true, message: this.$t('rebalance.Table pattern cannot be empty'), trigger: 'blur' },
        ],
        shardingKey: [
          {
            required: true,
            trigger: 'blur',
            validator: (rule, value, callback) => {
              if (this.form.policy === 'shardingkey' && !String(value || '').trim()) {
                callback(new Error(this.$t('rebalance.Sharding key cannot be empty')));
              } else {
                callback();
              }
            },
          },
        ],
        allowLossRate: [
          {
            required: true,
            trigger: 'blur',
            validator: (rule, value, callback) => {
              if (this.form.policy === 'shardingkey' && (value === null || value === undefined)) {
                callback(new Error(this.$t('rebalance.Error rate cannot be empty')));
              } else {
                callback();
              }
            },
          },
        ],
      },
      loading: false,
      clusterName: '',
    };
  },
  created() {
    this.clusterName = this.$route.params.id;
  },
  methods: {
    handleStrategyChange(value) {
      if (value !== 'shardingkey') {
        this.form.shardingKey = '';
        this.form.allowLossRate = 0.05;
        this.form.saveTemps = false;
      }
    },

    getRebalanceInfo() {
      this.$refs.rebalanceForm.validate((valid) => {
        if (!valid) {
          this.$message.error(this.$t('rebalance.Please fill in the form completely'));
          return;
        }
        $modal({
          component: RebalanceInfoComponent,
          props: {
            title: this.$t('manage.Rebalance Info'),
            width: 800,
            cancelText: null,
            okText: null,
          },
          data: {
            clusterName: this.clusterName,
            formData: {
              tables: [{ database: this.form.database, table: this.form.table }],
            },
          },
        });
      });
    },

    // Build the rebalance payload from the current form state. Shared by
    // both the plan-preview fetch and the actual execute call so the two
    // requests are guaranteed to describe the same operation.
    buildRebalancePayload() {
      return {
        tables: [{
          database: this.form.database,
          table: this.form.table,
          policy: this.form.policy,
          shardingKey: this.form.policy === 'shardingkey' ? this.form.shardingKey : undefined,
          allowLossRate: this.form.policy === 'shardingkey' ? this.form.allowLossRate : undefined,
          saveTemps: this.form.saveTemps,
        }],
        except_max_shard: this.form.except_max_shard,
      };
    },

    onSubmit() {
      this.$refs.rebalanceForm.validate(async (valid) => {
        if (!valid) return;
        const params = this.buildRebalancePayload();

        // Step 1: fetch the plan preview. Failures here are real errors
        // (network / 4xx / 5xx) and need user feedback — without an
        // explicit catch they would otherwise be swallowed by validate's
        // async callback, leaving the UI in an apparently-success state.
        this.loading = true;
        let plan;
        try {
          const resp = await ClusterApi.rebalancePlan({
            clusterName: this.clusterName,
            params,
          });
          plan = resp?.data?.entity;
        } catch (err) {
          this.$message.error(this.$t('rebalance.Failed to fetch plan'));
          return;
        } finally {
          this.loading = false;
        }
        if (!plan) return; // shard == 1 returns empty plan; nothing to confirm

        // Step 2: show the preview modal. The harness rejects with the
        // string 'cancel' when the user clicks Back; anything else is a
        // real component error and should be reported.
        try {
          await $modal({
            component: RebalancePlanPreview,
            props: {
              title: this.$t('rebalance.Plan Preview'),
              width: 900,
              okText: this.$t('rebalance.Execute'),
              cancelText: this.$t('common.Back'),
            },
            data: { plan },
          });
        } catch (e) {
          if (e === 'cancel') return;
          console.error('[rebalance] plan preview modal error:', e);
          return;
        }

        // Step 3: execute the rebalance and open the live task modal.
        this.loading = true;
        let taskId;
        try {
          const resp = await ClusterApi.rebalanceCluster({
            clusterName: this.clusterName,
            params,
            password: this.password,
          });
          taskId = resp?.data?.entity;
        } finally {
          this.loading = false;
        }
        if (!taskId) return; // shard == 1: backend returned success with no task
        $modal({
          component: TaskDetail,
          props: {
            title: this.$t('task.View Task'),
            width: 800,
            cancelText: this.$t('task.Close'),
            okText: null,
          },
          data: { taskId, refresh: true },
        });
      });
    },

    resetForm() {
      this.$refs.rebalanceForm.resetFields();
      this.form.policy = 'partition';
      this.form.shardingKey = '';
      this.form.allowLossRate = 0.05;
      this.form.saveTemps = false;
      this.form.except_max_shard = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.rebalance {
  padding: var(--s-3) 0 var(--s-6);

  &__head {
    margin-bottom: var(--s-4);
  }

  &__title {
    font-size: var(--fs-lg);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    margin: 0 0 var(--s-1);
    line-height: var(--lh-tight);
  }

  &__desc {
    font-size: var(--fs-sm);
    color: var(--c-text-tertiary);
    margin: 0;
    line-height: var(--lh-normal);
  }

  &__alert {
    margin-bottom: var(--s-4);
  }

  &__card {
    background: var(--c-surface-0);
    border: 1px solid var(--c-surface-3);
    border-radius: var(--r-lg);
    padding: var(--s-5);
  }

  &__section {
    font-size: var(--fs-xs);
    font-weight: var(--fw-semibold);
    color: var(--c-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin: 0 0 var(--s-2);
    padding-bottom: var(--s-1);
    border-bottom: 1px solid var(--c-surface-3);

    &:not(:first-child) {
      margin-top: var(--s-4);
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 var(--s-4);
  }

  &__full {
    grid-column: 1 / -1;
  }

  &__field {
    width: 100%;
  }

  &__switch-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-5);
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--s-2);
    margin-top: var(--s-4);
  }
}

::v-deep .el-form-item {
  margin-bottom: var(--s-3);
}

::v-deep .el-form-item__label {
  font-weight: var(--fw-medium);
  color: var(--c-text-primary);
  padding-bottom: var(--s-1) !important;
  line-height: var(--lh-tight);
}

::v-deep .el-switch.is-checked .el-switch__core {
  background-color: var(--c-primary-solid);
  border-color: var(--c-primary-solid);
}
</style>
