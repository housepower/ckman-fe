<template>
  <div class="flex flex-column height-full pl-5 pr-5">
    <el-input
      size="mini"
      :placeholder="$t('common.keyword search')"
      clearable
      v-model="filterText"
      @change="onEnter">
    </el-input>
    <div ref="tree" id="ztree" class="ztree"></div>
  </div>
</template>
<script>
import { SqlQueryApi } from '@/apis';

export default {
  data() {
    return {
      filterText: '',
      data: null,
      loading: false,
      setting: {
        view: {
          txtSelectedEnable: true,
        }
      },
    };
  },

  async mounted() {
    await this.getTableList();
    const { setting, data } = this;
    $.fn.zTree.init($('#ztree'), setting, data);
  },

  methods: {
    onEnter() {
      var zTree = $.fn.zTree.getZTreeObj("ztree");
      const { filterText } = this;
      const fn = (node) => node.name.indexOf(filterText) !== -1;
      const showNodes = zTree.getNodesByFilter((node) => {
        const children = zTree.getNodesByParamFuzzy('name', filterText, node);
        return fn(node) || (children && children.length);
      });
      zTree.showNodes(showNodes);

      const hideNodes = zTree.getNodesByFilter((node) => {
        const children = zTree.getNodesByParamFuzzy('name', filterText, node);
        return !fn(node) && !(children && children.length);
      });
      zTree.hideNodes(hideNodes);
    },
    // 获取数据库表结构数据，并转化成结构化树数据
    async getTableList() {
      const { id: clusterName } = this.$route.params;
      this.loading = true;
      const { data: { entity } } = await SqlQueryApi.getTableLists(clusterName)
      .finally(() => this.loading = false);
      const treeData = (Object.keys(entity)||[]).map(dbName => {
        const db = {
          id: dbName,
          name: dbName,
          icon: '/images/database.png',
          leaf: false,
          expand: false,
          children: (Object.keys(entity[dbName])||[]).map(tableName => {
            const table = {
              id: dbName + '-' + tableName,
              name: tableName,
              icon: '/images/table.png',
              leaf: false,
              expand: false,
              children: (entity[dbName][tableName]||[]).map(columnName => {
                return {
                  id: columnName,
                  name: columnName,
                  icon: '/images/columns.png',
                  leaf: true,
                }
              })
            };
            return table;
          })
        };
        return db;
      });

      this.data = treeData;
    },
  }
}
</script>
<style lang="scss" scoped>
.filter-tree {
  overflow: auto;
}
.tree-component {
  color: #606266;
  overflow-y: auto;
}
</style>

<style>
.ztree * {
  font-size: 14px;
  color: #606266;
  font-family: inherit;
}
span[treenode_ico] {
  background-size: 12px 12px !important;
  background-position: center center !important;
}
</style>
