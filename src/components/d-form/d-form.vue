<template>
  <el-form :model="formData" ref="form" style="line-height: 40px;">
    {{formData}}
    <DFormItem
      v-for="(item, key) in schema"
      :key="key"
      :schema="item"
      :origin-name="key"
      :prop-name="key"
      v-model="formData">
    </DFormItem>
    <el-form-item class="sticky-bottom">
      <el-button @click="submit">提交</el-button>
      <el-button @click="reset">重置</el-button>
    </el-form-item>
  </el-form>
</template>
<script>
import DFormItem from './d-form-item.vue';
import { getDefaultFormData, getPostData } from './util';
import { cloneDeep } from 'lodash-es';
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
  },

  data() {
    return {
      formData: {},
    }
  },

  created() {
    const { formModel, schema, formData } = this;
    this.formData = getDefaultFormData(formModel, schema, formData);
  },

  mounted() {

  },

  methods: {
    submit() {
      const { schema, formData } = this;
      const data = getPostData(cloneDeep(formData), schema);
      console.log('postData: ', data);
      this.$refs.form.validate((valid) => {
        if (valid) {
          const { schema, formData } = this;
          const data = getPostData(cloneDeep(formData), schema);
          console.log('postData: ', data);
        } else {
          console.log('error submit');
          return false;
        }
      });
      console.log(this.formData)
    }, //

    reset() {

    }
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
</style>