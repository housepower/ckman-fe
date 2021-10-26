<template>
  <div class="flex flex-column height-full pl-5 pr-5">
    <el-input
      size="mini"
      :placeholder="$t('common.keyword search')"
      clearable
      v-model="filterText">
    </el-input>

    <el-tree
      class="filter-tree flex-1 mt-5"
      :data="data"
      :props="defaultProps"
      :filter-node-method="filterNode"
      ref="tree">
      <span class="custom-tree-node" slot-scope="{ node, data }">
        <i :class="data.icon"></i><span class="ml-5">{{ node.label }}</span>
      </span>
    </el-tree>
  </div>
</template>
<script>
import { SqlQuery } from '@/apis';
export default {
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val);
    }
  },

  data() {
    return {
      filterText: '',
      data: [],
      defaultProps: {
        children: 'children',
        label: 'label'
      }
    };
  },

  created() {
    this.getTableList();
  },

  methods: {
    // 对树过滤
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1;
    },
    // 获取数据库表结构数据，并转化成结构化树数据
    async getTableList() {
      const { id: clusterName } = this.$route.params;
      const { data: { entity } } = await SqlQuery.getTableLists(clusterName);
      const treeData = Object.keys(entity).map(dbName => {
        const db = {
          id: dbName,
          label: dbName,
          icon: 'fa fa-database',
          children: Object.keys(entity[dbName]).map(tableName => {
            const table = {
              id: tableName,
              label: tableName,
              icon: 'fa fa-table',
              children: entity[dbName][tableName].map(columnName => {
                return {
                  id: columnName,
                  label: columnName,
                  icon: 'fa fa-columns'
                }
              })
            };
            return table;
          })
        };
        return db;
      });

      this.data = treeData;
    }
  }
}
</script>
<style lang="scss">
.filter-tree {
  overflow: auto;
}
</style>
