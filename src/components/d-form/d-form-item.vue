<template>
  <el-form-item :prop="propName" v-if="isVisible" :class="className" :rules="rules" class="mb-0">
    <div slot="label" class="width-full text-left relative" @click="isSlideUp = !isSlideUp">
      <div class="pointer text-ellipsis" style="display: inline-block; width: 250px;">
        <i v-if="isShowCaret" class="fa" :class="{ 'fa-caret-right': !isSlideUp, 'fa-caret-down': isSlideUp }"></i>
        {{schema['label_' + lang] || schema['label_' + lang] || originName}}
        <el-tooltip class="item" effect="dark" placement="top">
          <div slot="content" style="line-height: 1.5">
            <p v-for="(item, index) in description" :key="index" class="mb-2">{{item}}</p>
          </div>
          <i class="fa fa-info-circle pointer"></i>
        </el-tooltip>
        <span class="fc-red bold ml-5" v-if="isRequired">*</span>
        <span>：</span>
        <el-button v-if="isShowAddIcon" @click.stop="addItem" size="mini" class="absolute" :style="{ 'left': isCascade ? '300px' : '260px' }">
          <i class="fa fa-plus pointer el-link--primary"></i>
        </el-button>
        <span class="fc-red absolute error-message">{{errorMessage}}</span>
      </div>
    </div>
    <!-- {{propName}} -->
    <!-- {{ originName }} -->
    <!-- {{ formModel }} -->
    <!-- {{ schema.type }} -->
    <!-- {{formModel}} -->
    <template v-if="schema.candidates && schema.candidates.length > 0">
      <el-select v-model="formModel[originName]" size="medium" class="width-350" :placeholder="$t('common.Please choose')">
        <el-option v-for="(item, index) in schema.candidates" :key="index" :label="item['label_' + lang]" :value="['int', 'float'].includes(schema.type) ? Number(item.value) : item.value"></el-option>
      </el-select>
    </template>
    
    <template v-else>
      <template v-if="schema.type === 'string'">
        <!-- 单行文本 -->
        <el-input class="width-350" size="medium" v-model="formModel[originName]" :placeholder="$t('common.Please fill out')" v-if="schema.input_type === 'text'"></el-input>
        <!-- 多行文本 -->
        <el-input class="width-350" size="medium" type="textarea" v-model="formModel[originName]" :placeholder="$t('common.Please fill out')" v-if="schema.input_type === 'textarea'"></el-input>
        <!-- 密码 -->
        <el-input class="width-350" size="medium" autocomplete="new-password" v-model="formModel[originName]" :placeholder="$t('common.Please fill out')" v-if="schema.input_type === 'password'" show-password></el-input>
      </template>
      
      <!-- switch -->
      <el-switch v-model="formModel[originName]" size="medium" v-if="schema.type === 'bool'"></el-switch>
      <!-- 数字输入-整数 -->
      <el-input-number
        class="width-350"
        size="medium"
        v-model="formModel[originName]"
        :controls="false"
        :precision="0"
        :min="(schema.range && schema.range.min) || -Infinity"
        :max="(schema.range && schema.range.max) || Infinity"
        :step="(schema.range && schema.range.step) || 1"
        v-if="schema.type === 'int'">
      </el-input-number>
      <!-- 数字输入-小数 -->
      <el-input-number
        class="width-350"
        size="medium"
        v-model="formModel[originName]"
        :controls="false"
        :precision="precision"
        :min="(schema.range && schema.range.min) || -Infinity"
        :max="(schema.range && schema.range.max) || Infinity"
        :step="(schema.range && schema.range.step) || 1"
        v-if="schema.type === 'float'">
      </el-input-number>
      <!-- 结构体 -->
      <struct v-show="isSlideUp" :schema="schema.struct" :prop-name="`${ propName }`" v-model="formModel[originName]" v-if="schema.type === 'struct'"></struct>
      <!-- 列表 -->
      <list-struct
        v-show="isSlideUp"
        ref="listStructRef"
        :schema="schema"
        :prop-name="propName"
        :origin-name="originName"
        v-model="formModel[originName]"
        v-if="schema.type === 'list-struct'">
      </list-struct>
      <!-- 字符串列表 -->
      <list-string
        v-show="isSlideUp"
        ref="listStringRef"
        :schema="schema"
        :prop-name="propName"
        v-model="formModel[originName]"
        v-if="schema.type === 'list-string'">
      </list-string>
      <!-- MAP映射 -->
      <Map v-show="isSlideUp" ref="mapRef" :schema="schema" :prop-name="propName" v-model="formModel[originName]" v-if="schema.type === 'map'"></Map>
      <slot name="suffix"></slot>
    </template>
  </el-form-item>
</template>
<script>
import { isEqual, cloneDeep } from 'lodash-es';
import { catWith, getPostData } from './util';
export default {
  name: 'dFormItem',
  components: {
    Struct: () => import('./components/struct.vue'),
    ListStruct: () => import('./components/list-struct.vue'),
    ListString: () => import('./components/list-string.vue'),
    Map: () => import('./components/map.vue'),
  },

  model: {
    prop: 'formModel',
    event: 'change',
  },

  props: {
    schema: {
      type: Object,
      default() {
        return {};
      },
    },
    originName: {
      type: String,
      default: ''
    }, 
    propName: {
      type: String,
      default: ''
    },
    formModel: {
      type: Object,
      default() {
        return {}
      }
    },
    isCascade: {
      type: Boolean,
      default: false
    },
  },

  computed: {
    lang() {
      return this.$i18n.locale;
    },
    isShowAddIcon() {
      return ['list-struct', 'list-string', 'map'].includes(this.schema.type);
    },
    isShowCaret() {
      return ['list-struct', 'list-string', 'map', 'struct'].includes(this.schema.type);
    },
    isComplexType() {
      return ['list-struct', 'list-string', 'map', 'struct'].includes(this.schema.type);
    },
    isRequired() {
      const { formModel, schema: { required } } = this;
      try {
        return catWith(formModel, `return ${ required };`);
      } catch(e) {
        console.warn(formModel, required, e);
      }
    },
    isVisible() {
      const { formModel, schema: { visiable } } = this;
      try {
        return catWith(formModel, `return ${ visiable };`);
      } catch(e) {
        console.warn(formModel, visiable, e);
      }
    },
    className() {
      const { isComplexType, schema: { type }, originName, isSlideUp, formModel } = this;
      let str = '';
      if (isComplexType) {
        str += 'complex-item';

        if (isSlideUp || !formModel[originName] || formModel[originName].length === 0) {
          str += ' ' + 'hide-content';
        }
      } else {
        str += 'normal-item';
      }

      str += ' ' + type;

      return str;
    },
    precision() {
      const { schema } = this;
      if ( schema.range && schema.range.step) {
        const step = schema.range.step.toString().split('.');
        if (step.length > 1) {
          return step[1].length;
        }
      }
    },
    description() {
      const { schema, originName, lang}  = this;
      const { type, range, default: defaultValue, required } = schema;
      const descArray =  [
        `${this.$t('common.Field Name')}：${schema['label_' + lang] || ''}`,
        `name: ${originName || ''}`,
        `${this.$t('common.Field Type')}：${type || ''}`,
        `${this.$t('common.Defaults')}：${defaultValue || this.$t('common.Null')}`,
        `${this.$t('common.Is it required')}：${(required) ? this.$t('common.Yes') : this.$t('common.No')}`,
        `${this.$t('common.Description')}：${schema['description_' + lang] || ''}`,
      ];
      if (['int', 'float'].includes(type)) {
        if (range) {
          const { min, max } = range;
          descArray.splice(2, 0,  `${this.$t('common.Ranges')}：[ ${min}, ${max} ]`);
        } else {
          descArray.splice(2, 0, `${this.$t('common.Ranges')}：${this.$t('common.Null')}`);
        }
      }
      return descArray;
    },
    rules() {
      const { isRequired, schema, lang, $t } = this;
      const { range, regex, type, struct } = schema;
      const dataTypes = [null, '', undefined];
      return {
        trigger: ['blur', 'change'],
        validator: (rule, value) => {
          if (isRequired == true) {
            switch(type) {
              case 'list-string':
                if (value.length === 0) {
                  this.isSlideUp = true;
                  return new Error(this.$t('common.Required'));
                } else {
                  this.errorMessage = '';
                  return true;
                }
              case 'struct': {
                const data = getPostData(cloneDeep(value), schema);
                if (isEqual(data, null)) {
                  this.isSlideUp = true;
                  return new Error(this.$t('common.Required'));
                } else {
                  this.errorMessage = '';
                  return true;
                }
              }
              case 'list-struct': {
                if (value.length === 0) {
                  return new Error(this.$t('common.Required'));
                } else {
                  return true;
                }
              }
              case 'map': {
                const data = getPostData(cloneDeep(value), schema);
                if (isEqual(data, null)) {
                  this.isSlideUp = true;
                  return new Error(this.$t('common.Required'));
                } else {
                  return true;
                }
              }
            }
          }
          
          if (isRequired && dataTypes.includes(value)) {
            return new Error(this.$t('common.Required'));
          }

          if (regex && !dataTypes.includes(value) && !new RegExp(regex.slice(1, -1)).test(value)) {
            return new Error(this.$t('common.Input error, please check the rules and re-enter'));
          }

          if (!(range && !dataTypes.includes(value))) return true;

          const { min, max } = range;
          if (value < min) return new Error(this.$t('common.Please enter a value greater than {min}', { min }));
          if (value >= max) return new Error(this.$t('common.Please enter a value less than or equal to {max}', { max }));
          return true;
        },
      };
    }
  },

  data() {
    return {
      label: '',
      isSlideUp: false,
      errorMessage: '',
    }
  },

  methods: {
    addItem() {
      this.isSlideUp = true;
      const { schema } = this;
      const { type } = schema;
      if (type === 'list-struct') {
        this.$refs.listStructRef.addItem();
        return;
      }

      if (type === 'list-string') {
        this.$refs.listStringRef.addItem();
        return;
      }

      if (type === 'map') {
        this.$refs.mapRef.addItem();
        return;
      }
    }
  }
}
</script>
<style lang="scss" scoped>

::v-deep .el-form-item__error {
  top: 8px;
  left: 356px;
  width: 100%;
}
::v-deep .el-form-item__content {
  line-height: inherit;
}

::v-deep .el-form-item__label {
  line-height: inherit;
}
.complex-item {
  display: flex;
  flex-direction: column;
  ::v-deep >.el-form-item__content > .el-form-item__label {
    text-align: left;
  }


  &.list-string, &.list-struct, &.struct, &.map {
    ::v-deep .el-form-item__error {
      top: -50px;
      left: 356px;
    }
  }

  &.list-string, &.list-struct {
    .error-message {
      top: -2px;
      left: 300px;
    }
  }

  &.struct {
    ::v-deep .el-form-item__error {
      top: -40px;
      left: 356px;
    }

    >.el-form-item__label .error-message {
      left: 260px;
    }
  }

  &.struct {
    ::v-deep > .el-form-item__content {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }

  &.struct {
    ::v-deep > .el-form-item__content {
      padding-left: 20px;
    }
  }

  &.list-string ::v-deep >.el-form-item__content {
    padding-left: 250px;
  }
}

.normal-item {
  display: flex;
  ::v-deep .el-form-item__error {
    top: 8px !important;
    left: 356px;
  }
}

.struct {
  >.list-struct >.el-form-item__label {
    .error-message {
      top: 2px !important;
      left: 300px !important;
    }
  }
}
</style>