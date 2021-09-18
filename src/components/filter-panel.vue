<template>
<el-popover
  placement="bottom-end"
  :title="null"
  width="200"
  trigger="click"
  v-model="visible">
  <div>
    <el-input size="mini" suffix-icon="el-icon-search" v-model="searchKey" :placeholder="$t('common.keyword search')"></el-input>
    <div style="max-height: 200px; overflow-y: auto;" class="mt-5 mb-5">
      <el-checkbox-group v-model="selectedOption">
        <el-checkbox class="block" v-for="item in filterOptions" :label="item" :key="item">{{item}}</el-checkbox>
      </el-checkbox-group>
    </div>
    <div class="text-center">
      <el-button type="primary" size="mini" @click="doFilter">{{$t('common.Filter')}}</el-button>
      <el-button size="mini" @click="reset">{{$t('common.Reset')}}</el-button>
    </div>
  </div>
  <i slot="reference" @click.prevent.stop="onClickFilter()" class="fa fa-filter pull-right"></i>
</el-popover>
</template>
<script>
export default {
  name: "FilterPanel",
  props: {
    prop: {
      type: String,
      default: ''
    },
    tableData: {
      type: Array,
      default: []
    }
  },
  data() {
    return {
      visible: false,
      searchKey: '',
      selectedOption: [],
      options: []
    };
  },
  computed: {
    filterOptions() {
      const { searchKey, options } = this;
      const data = options.filter(x => {
        return x.includes(searchKey);
      });
      this.selectedOption = data;
      return data;
    }
  },
  methods: {
    onClickFilter() {
      const { prop, tableData } = this;
      this.options = Array.from(new Set(tableData.map(x => x[prop])));
    },

    doFilter() {
      const { prop, selectedOption: value } = this;
      this.$emit('change', {
        prop,
        value
      });
      this.visible = false;
    },

    reset() {
      this.searchKey = '';
      const { options } = this;
      this.selectedOption = options;

      const { prop } = this;
      this.$emit('change', {
        prop,
        value: options
      });

      this.visible = false;
    }
  }
};
</script>
<style lang="scss" scoped>
.fa-filter {
  height: 32px;
  display: inline-flex;
  align-items: center;
  color: #C0C4CC;
}
</style>