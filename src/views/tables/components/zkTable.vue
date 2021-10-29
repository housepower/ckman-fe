<template>
  <div class="zkTable">
    <div class="title flex flex-between flex-vcenter ptb-10">
      <span class="fs-20 font-bold">{{$t('tables.Zookeeper Status')}}</span>
    </div>

    <table cellspacing="0" class="el-table width-full reverse-table el-table--border el-table--enable-row-hover el-table--enable-row-transition">
      <tr>
        <th></th>
        <th class="pl-10 pt-10 pb-10 is-center" v-for="item in columns" :key="item.field">{{item.label}}</th>
      </tr>
      <tr v-for="field in fields">
        <td class="pl-10 is-center">{{field}}</td>
        <template v-for="column in columns">
         <td class="pl-10 is-center">{{data[column.field][field]}}</td>
        </template>
      </tr>
    </table>
  </div>
</template>
<script>
import { pull } from "lodash-es";
import { TablesApi } from "@/apis";
export default {
  data() {
    return {
      tableData: [],
    };
  },
  computed: {
    data() {
      const { tableData } = this;
      const newData = {};
      tableData.forEach((item) => {
        newData[item.host] = item;
      });
      return newData;
    },
    fields() {
      const { tableData } = this;
      if (tableData.length > 0) {
        return pull(Object.keys(tableData[0]), "host");
      }
    },
    columns() {
      const { tableData } = this;
      const cols = [];
      tableData.forEach(({ host }) => {
        cols.push({
          field: host,
          label: host
        })
      });
      return cols;
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      const {
        data: { entity },
      } = await TablesApi.zkStatus(this.$route.params.id);
      this.tableData = Object.freeze(entity);
    },
  },
};
</script>

<style lang="scss" scoped>
 .reverse-table tr td:first-child {
    background-color: #f8f8f9;
  }
</style>
