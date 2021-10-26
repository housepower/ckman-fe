<template>
  <main class="query flex flex-column height-full pb-20">
    <breadcrumb :data="['Clusters', $route.params.id, 'query-execution']" />
    <SqlSelectTool class="flex-1"></SqlSelectTool>
  </main>
</template>
<script>
import { isNull, uniqBy } from "lodash-es";
import SqlSelectTool from '@/components/sql-select-tool/index.vue';

export default {
  components: {
    SqlSelectTool,
  },
  data() {
    return {
      list: [],
      selectedSql: {},
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      const splData = localStorage.getItem("sqlHisToryData");
      this.list =
        splData !== "undefined" && !isNull(splData) ? JSON.parse(splData) : [];
    },
    selectSql(item) {
      this.selectedSql = item;
    },
    updateData(addSql) {
      this.list.unshift(addSql);
      this.list = uniqBy(this.list, "value");
      localStorage.setItem(
        "sqlHisToryData",
        JSON.stringify(this.list.slice(0, 20))
      );
      this.fetchData();
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  position: absolute;
  left: 262px;
  top: 115px;
  bottom: 65px;
  right: 20px;
  z-index: 50;
}
</style>
