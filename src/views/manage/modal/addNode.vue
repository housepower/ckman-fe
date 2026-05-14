<template>
  <el-dialog
    v-bind="$attrs"
    :title="$t('manage.Add Node')"
    width="560px"
    destroy-on-close
    @close="close"
  >
    <el-form
      ref="Form"
      :model="formModel"
      :rules="rules"
      label-position="top"
      class="addnode-form"
    >
      <el-form-item :label="$t('manage.New Node IP')" prop="ips">
        <el-input
          type="textarea"
          v-model="formModel.ips"
          :placeholder="$t('common.placeholderIp')"
          :rows="3"
          class="addnode-form__textarea"
        />
      </el-form-item>
      <el-form-item :label="$t('manage.Node Shard')" prop="shard">
        <el-input-number
          v-model="formModel.shard"
          :step="1"
          :min="numberRange[0]"
          :max="numberRange[1]"
        />
      </el-form-item>
      <el-form-item :label="$t('manage.Source Schema Host')" prop="sourceSchemaHost">
        <el-select v-model="formModel.sourceSchemaHost" class="addnode-form__select">
          <el-option
            v-for="n in nodes"
            :key="n.ip"
            :label="n.ip"
            :value="n.ip"
            :disabled="n.status === 'red'"
          >
            <div class="node-opt">
              <span class="node-opt__dot" :class="`node-opt__dot--${n.status}`"></span>
              <span class="node-opt__ip">{{ n.ip }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="addnode-footer">
        <label class="addnode-footer__force">
          <el-switch v-model="force" />
          <span>{{ $t('common.Force Override') }}</span>
        </label>
        <div class="addnode-footer__btns">
          <el-button @click="close">{{ $t('common.Cancel') }}</el-button>
          <el-button type="primary" @click="onOk">
            <i class="el-icon-plus"></i>
            {{ $t('common.Save') }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
<script>
import { ClusterApi } from "@/apis";
import { lineFeed, getCirdOrRangeIps } from "@/helpers";
export default {
  props: {
    "numberRange": Array,
    "password": String,
    "nodes": { type: Array, default: () => [] },
  },
  data() {
    return {
      formModel: {
        ips: "",
        shard: 1,
        sourceSchemaHost: "",
      },
      force: false,
      rules: {
        sourceSchemaHost: [
          { required: true, message: this.$t('manage.Source Schema Host required'), trigger: 'change' },
        ],
      },
    };
  },
  watch: {
    nodes: {
      immediate: true,
      handler(list) {
        if (this.formModel.sourceSchemaHost) return;
        if (!list || list.length === 0) return;
        const green = list.find(n => n.status === 'green');
        const yellow = list.find(n => n.status === 'yellow');
        this.formModel.sourceSchemaHost = (green && green.ip) || (yellow && yellow.ip) || '';
      },
    },
  },
  methods: {
    close() {
      this.$emit('close');
    },
    async onOk() {
      try {
        await this.$refs.Form.validate();
      } catch (e) {
        return;
      }
      const { ips, shard, sourceSchemaHost } = this.formModel;
      const { force, password } = this;
      const { data: { entity: taskId } } = await ClusterApi.addClusterNode(this.$route.params.id, {
        ips: getCirdOrRangeIps(lineFeed(ips)),
        shard: +shard,
        sourceSchemaHost,
      }, force, password);
      this.$emit('onOk', taskId);
      return taskId;
    }
  },
};
</script>

<style lang="scss" scoped>
.addnode-form {
  &__textarea {
    ::v-deep .el-textarea__inner {
      font-family: var(--f-mono);
      font-size: var(--fs-sm);
      line-height: var(--lh-normal);
    }
  }

  &__select {
    width: 100%;
  }
}

.addnode-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);

  &__force {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    cursor: pointer;
    font-size: var(--fs-sm);
    color: var(--c-text-secondary);
  }

  &__btns {
    display: flex;
    gap: var(--s-2);
  }
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

<!-- 非 scoped 全局规则：el-select 下拉被 teleport 到 body，scoped 选择器不可达 -->
<style lang="scss">
.node-opt {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &--green  { background: var(--c-success-solid); }
    &--red    { background: var(--c-danger-solid); }
    &--yellow { background: var(--c-warning-solid); }
  }

  &__ip {
    font-variant-numeric: tabular-nums;
    color: var(--c-text-primary);
  }
}
</style>
