<template>
  <div class="flex flex-column list-string mb-20 ml-10" v-if="formData.length > 0" style="line-height: 30px;">
    <!-- {{formModel}} -->
    <!-- <i class="fa fa-plus pointer ml-10" @click.stop="addItem"></i> -->
    <div class="content pt-10 pr-10 pb-0 pl-10">
      <div v-for="(item, index) in formData" :key="item.$$id" class="flex flex-vcenter mb-10">
        <el-input size="medium" v-model="item.value" class="width-350" @change="onChange"></el-input>
        <i class="fa fa-trash pointer fs-16 fc-red ml-10" @click="deleteItem(index)"></i>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'ListString',
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
    PropName: {
      type: String,
      default: ''
    },
    formModel: {
      type: Array,
      default() {
        return []
      }
    }
  },

  data() {
    return {
      formData: [],
      activeName: ''
    }
  },

  created() {
    this.initData();
  },

  methods: {
    initData() {
      this.formData = this.formModel.map(x => {
        return {
          $$id: +new Date(),
          value: x
        }
      });
    },
    addItem() {
      this.formData.push({
        $$id: +new Date(),
        value: ''
      });
    },
    deleteItem(index) {
      this.formData.splice(index, 1);
    },
    onChange() {
      this.$emit('change', this.formData.filter(x => x.value).map(x => x.value))
    }
  }
}
</script>

<style lang="scss">
.list-string {
  .content {
    background-color: rgba(0, 0, 0, 0.05);
  }
}  
</style>