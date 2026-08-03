<template>
  <el-form :model="formData" ref="form" style="line-height: 40px;">
    <DFormItem
      v-for="(item, key) in schema"
      :key="key"
      :schema="item"
      :origin-name="key"
      :prop-name="key"
      v-model="formData">
    </DFormItem>
    <el-form-item class="sticky-bottom" v-if="!noFooter">
      <div v-if="showPolicy" class="d-form-restart-policy">
        <label class="d-form-restart-policy__label">{{ $t('manage.Policy') }}</label>
        <el-select v-model="policy" size="small" class="d-form-restart-policy__select">
          <el-option :label="$t('manage.Full')" value="Full"></el-option>
          <el-option :label="$t('manage.Rolling')" value="Rolling"></el-option>
        </el-select>
        <span v-if="tlsChanged" class="d-form-restart-policy__hint">
          <i class="el-icon-warning"></i>
          {{ $t('common.TLS Restart Hint') }}
        </span>
      </div>
      <el-checkbox class="mr-20" v-model="force">{{$t('common.Force Override')}}</el-checkbox>
      <el-button v-if="isShowSubmit" :loading="loading" @click="validate" type="primary">{{ submitText || $t("common.Create")}}</el-button>
      <el-button v-if="isShowCancel" @click="cancel">{{ cancelText || $t("common.Cancel")}}</el-button>
    </el-form-item>
  </el-form>
</template>
<script>
import DFormItem from './d-form-item.vue';
import { getDefaultFormData, getPostData } from './util';
import { cloneDeep, isEqual } from 'lodash-es';

export default {
  name: 'DForm',
  components: {
    DFormItem,
  },

  provide() {
    return {
      // 供任意深度的嵌套字段（如 TlsConf.Cert）访问表单根数据，
      // 例如"生成自签名证书"需要读取整个表单里已填写的节点 IP。
      dFormRoot: this,
    };
  },

  props: {
    schema: {
      type: Object,
      default: {},
    },
    formModel: {
      type: Object,
      default() {
        return null;
      }
    },
    noFooter: {
      type: Boolean,
      default: false,
    },
    isShowSubmit: {
      type: Boolean,
      default: true
    },
    isShowCancel: {
      type: Boolean,
      default: true
    },
    submitText: {
      type: String,
      default: '',
    },
    cancelText: {
      type: String,
      default: '',
    },
    loading: Boolean,
    // 是否展示重启策略选择器（目前仅集群配置修改页需要）
    showPolicy: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      formData: {},
      force: false,
      policy: 'Rolling',
      // Secure/Cert/Key 的初始值快照（字符串/布尔的原始值，非对象引用）。
      // 注意：getDefaultFormData 对 struct 类型字段是浅拷贝，formData.TlsConf 与
      // formModel.TlsConf 实际指向同一个对象，编辑表单会就地改到 formModel 上；
      // 因此这里必须在 created() 时就把值取出来存成基本类型快照，不能之后再从
      // formModel 读取（那时可能已经被表单编辑污染，导致比较永远相等）。
      initialSecure: false,
      initialCert: '',
      initialKey: '',
    }
  },

  computed: {
    // Secure 或证书内容相对初始值发生变化
    tlsChanged() {
      if (!this.showPolicy) return false;
      const { formData, initialSecure, initialCert, initialKey } = this;
      const curSecure = !!formData.Secure;
      if (curSecure !== initialSecure) return true;
      const curCert = (formData.TlsConf && formData.TlsConf.Cert) || '';
      const curKey = (formData.TlsConf && formData.TlsConf.Key) || '';
      return curCert !== initialCert || curKey !== initialKey;
    },
  },

  watch: {
    // 由 false 变为 true 时，重启策略默认切到"全量停机"；此后不再强行覆盖用户的手动选择
    tlsChanged(newVal, oldVal) {
      if (newVal && !oldVal) {
        this.policy = 'Full';
      }
    },
  },

  created() {
    const { formModel, schema, formData } = this;
    this.initialSecure = !!(formModel && formModel.Secure);
    this.initialCert = (formModel && formModel.TlsConf && formModel.TlsConf.Cert) || '';
    this.initialKey = (formModel && formModel.TlsConf && formModel.TlsConf.Key) || '';
    this.formData = getDefaultFormData(formModel, schema, formData);
  },

  methods: {
    validate(cb) {
      const form = this.$refs.form;
      form.clearValidate();
      try {
        return form.validate((valid) => {
          if (valid) {
            const { schema, formData, force, policy, showPolicy } = this;
            const data = getPostData(cloneDeep(formData), schema);
            const payload = showPolicy ? { data, force, policy } : { data, force };
            this.$emit('submit', payload);
            cb & cb(payload);
          } else {
            const fields = form.fields.filter(item => item.validateState === 'error');
            const field = form.fields.find(item => item.validateState === 'error');
            // 展开错误第一层
            fields.forEach(field => {
              field.isSlideUp = true;
              let temp = field;
              do {
                const parent = temp.$parent;
                temp = parent;
                if (temp.$el.className.indexOf('el-form-item') !== -1) {
                  temp.isSlideUp = true;
                }
              } while(temp.$el.nodeName !== 'FORM');
            });

            // 从子到父，展开父标签，直到el-form
            let collapseNum = 0;
            if (field) {
              field.isSlideUp = true;
              let temp = field;
              
              do {
                const parent = temp.$parent;
                temp = parent;
                if (temp.collapse && !isEqual(temp.collapse.activeNames, [temp.name])) {
                  temp.collapse.activeNames = [temp.name];
                  collapseNum += 1;
                }
                if (temp.$el.className.indexOf('el-form-item') !== -1) {
                  temp.isSlideUp = true;
                }
              } while(temp.$el.nodeName !== 'FORM');
              
              setTimeout(() => {
                field.$el.scrollIntoView();
              }, collapseNum * 300);
            }
            return false;
          }
        });
      } catch(e) {
        console.log(e);
      }
    },

    cancel() {
      this.$router.go(-1);
    },
  }
}
</script>
<style lang="scss">
.sticky-bottom {
  position: sticky;
  bottom: 0;
  background: #fff;
  padding: 10px 0;
  text-align: center;
}
.d-form-restart-policy {
  display: inline-flex;
  align-items: center;
  margin-right: 20px;

  &__label {
    margin-right: 8px;
  }

  &__select {
    width: 140px;
  }

  &__hint {
    margin-left: 12px;
    color: #E6A23C;
    font-size: 12px;

    .el-icon-warning {
      margin-right: 4px;
    }
  }
}
</style>