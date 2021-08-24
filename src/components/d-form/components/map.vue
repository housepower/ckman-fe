<template>
  <div class="ml-10">
    <div v-for="(item, index) in formData" :key="index" class="flex flex-vcenter mb-10">
      <el-input size="medium" style="flex: 1;" v-model="item.key" @change="onChange" />
      <span class="pl-5 pr-5">:</span>
      <el-input size="medium" style="flex: 2;" v-model="item.value" @change="onChange" />
      <i class="fa fa-trash pointer fs-16 fc-red ml-10" @click="deleteItem(index)"></i>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Map',
  components: {
    DFormItem: () => import('../d-form-item.vue'),
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
      default: {}
    }
  },

  data() {
    return {
      formData: [],
    }
  },

  created() {
    this.initData();
  },

  methods: {
    initData() {
      const { formModel } = this;
      this.formData = Object.entries(formModel).map(([key, value]) => {
        return {
          key,
          value,
        }
      })
    },
    addItem() {
      this.formData.push({
        key: '',
        value: '',
      });
    },
    deleteItem(index) {
      this.formData.splice(index, 1);
      this.onChange();
    },
    // 根据数组模型，转换成map对象模型
    onChange() {
      const mapValue = {};
      this.formData.filter(x => x.key).forEach(({ key, value }) => {
        mapValue[key] = value;
      });
      this.$emit('change', mapValue);
    }
  }
}
</script>