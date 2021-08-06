<template>
  <div class="list-struct ml-10" v-if="formModel.length > 0">
    <el-collapse v-model="activeName" accordion v-if="!isCascade" class="mb-20">
      <el-collapse-item v-for="(item, index) in formModel" :key="item.$$id" :name="item.$$id" size="medium">
        <template slot="title" class="flex flex-vcenter pl-10">
          <span class="flex-1 pl-10">{{`${formModel[index].Name || originName}[${index}]`}}</span>
          <i class="fa fa-trash pointer fs-16 fc-red ml-10" style="margin: 8px 10px 8px auto;" @click.stop="deleteItem(index)"></i>
        </template>
        <div v-for="(child, key) in schema.struct" :key="key" style="line-height: 40px;">
          <DFormItem v-model="formModel[index]" :schema="child" :origin-name="key" :prop-name="`${PropName}.${index}.${key}`">
          </DFormItem>
        </div>
      </el-collapse-item>
    </el-collapse>
    <div class="pt-15 pb-10 list-struct-list-struct" v-else style="line-height: 30px; background-color: rgba(0, 0, 0, 0.05);">
      <div v-for="(item, index) in formModel" :key="item.$$id" :name="item.$$id" class="pl-30 pr-40 relative">
        <div v-for="(child, key) in schema.struct" :key="key">
          <DFormItem v-model="formModel[index]" :schema="child" :origin-name="key" :prop-name="`${PropName}.${index}.${key}`" :is-cascade="isCascade">
          </DFormItem>
        </div>
        <i class="fa fa-trash pointer fs-16 fc-red ml-10 absolute" style="right: 15px; top: 10px;" @click.stop="deleteItem(index)"></i>
      </div>
    </div>
  </div>
</template>
<script>
import { getDefaultFormData } from '../util.js';
export default {
  name: 'DForm',
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
    originName: {
      type: String,
      default: '',
    },
    formModel: {
      type: Array,
      default() {
        return []
      }
    }
  },

  computed: {
    isCascade() {
      const { originName } = this;
      if (originName === 'Shards' || originName === 'Replicas') {
        return true;
      }
      return false;
    }
  },

  data() {
    return {
      activeName: ''
    }
  },

  methods: {
    addItem() {
      const { schema } = this;
      const item = {
        $$id: +new Date(),
      };
      Object.assign(item, getDefaultFormData(item, schema.struct));
      console.log(schema.struct, item);
      this.formModel.push(item);
    },

    deleteItem(index) {
      this.formModel.splice(index, 1)
    }
  }
}
</script>
<style lang="scss" scoped>
::v-deep .el-collapse {
  .el-collapse-item:last-child {
    .el-collapse-item__header {
      border: none;
      &:after {
        display: none;
      }
    }
  }
}
::v-deep .el-collapse-item__header {
  background: rgba(0, 0, 0, 0.05);
  border-bottom-color: rgba(0, 0, 0, 0.1);
  height: 40px;
  position: relative;
  &:after {
    content: '';
    position: absolute;
    bottom: -2px;
    display: block;
    width: 100%;
    height: 1px;
    background-color: #fff;
    z-index: 2;
  }
}
::v-deep .el-collapse-item__content {
  padding: 20px;
  border-width: 0 1px 0 1px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.05);
}
.list-struct-list-struct {
  ::v-deep .error-message {
    top: 3px !important;
    left: 350px !important;
  }
}
</style>