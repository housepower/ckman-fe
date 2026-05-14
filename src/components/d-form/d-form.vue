<template>
  <el-form :model="formData" ref="form" class="d-form" label-position="top">
    <DFormItem
      v-for="(item, key) in schema"
      :key="key"
      :schema="item"
      :origin-name="key"
      :prop-name="key"
      v-model="formData"
    >
    </DFormItem>
    <el-form-item class="d-form__footer" v-if="!noFooter">
      <div class="d-form__footer-inner">
        <label class="d-form__force">
          <el-switch v-model="force" />
          <span class="d-form__force-label">{{ $t('common.Force Override') }}</span>
        </label>
        <div class="d-form__btns">
          <el-button v-if="isShowCancel" @click="cancel">
            {{ cancelText || $t('common.Cancel') }}
          </el-button>
          <el-button
            v-if="isShowSubmit"
            :loading="loading"
            @click="validate"
            type="primary"
          >
            {{ submitText || $t('common.Create') }}
          </el-button>
        </div>
      </div>
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
  },

  data() {
    return {
      formData: {},
      force: false,
    }
  },

  created() {
    const { formModel, schema, formData } = this;
    this.formData = getDefaultFormData(formModel, schema, formData);
  },

  methods: {
    validate(cb) {
      const form = this.$refs.form;
      form.clearValidate();
      try {
        return form.validate((valid) => {
          if (valid) {
            const { schema, formData, force } = this;
            const data = getPostData(cloneDeep(formData), schema);
            this.$emit('submit', { data, force } );
            cb  & cb({ data, force });
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
<style lang="scss" scoped>
.d-form {
  line-height: var(--lh-normal);

  &__footer {
    position: sticky;
    bottom: 0;
    background: var(--c-surface-0);
    border-top: 1px solid var(--c-surface-3);
    padding: var(--s-3) var(--s-5);
    margin: var(--s-4) calc(-1 * var(--s-5)) 0;
    z-index: 10;
  }

  &__footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

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

::v-deep .el-switch.is-checked .el-switch__core {
  background-color: var(--c-primary-solid);
  border-color: var(--c-primary-solid);
}
</style>