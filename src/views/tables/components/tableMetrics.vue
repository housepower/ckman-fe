<template>
  <div class="table-metric pb-20">
    <div class="title flex flex-between flex-vcenter ptb-10">
      <span class="fs-20 font-bold">{{$t('tables.Table Metrics')}}</span>
    </div>
    <el-table :data="tableData"
              cneter
              border>
      <template v-for="{ prop, label } of columns">
        <el-table-column :prop="prop"
                         :label="label"
                         :key="prop"
                         show-overflow-tooltip />
      </template>

    </el-table>
  </div>

</template>
<script>
import { TablesApi } from "@/apis";
export default {
  data() {
    return {
      tableData: [],
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      const {
        data: { entity },
      } = await TablesApi.tableMetrics(this.$route.params.id);
      Object.entries(entity).forEach(([key, values]) => {
        const {
          columns,
          rows,
          space,
          completedQueries,
          failedQueries,
          parts,
          queryCost,
        } = values;
        this.tableData.push({
          tableName: key,
          columns,
          rows,
          space,
          completedQueries,
          failedQueries,
          parts,
          queryCost: Object.values(queryCost)
            .map((v) => `${(v / 1000).toFixed(2)}s`)
            .join(","),
        });
      });
    },
  },
  computed: {
    columns() {
      let columns = [
        {
          prop: "tableName",
          label: this.$t('tables.Table Name'),
        },
        {
          prop: "columns",
          label: this.$t('tables.Columns'),
        },
        {
          prop: "rows",
          label: this.$t('tables.Rows'),
        },
        {
          prop: "parts",
          label: this.$t('tables.Parts'),
        },
        {
          prop: "space",
          label: this.$t('tables.Disk Space'),
        },
        {
          prop: "completedQueries",
          label: this.$t('tables.Completed Queries in last 24h'),
        },
        {
          prop: "failedQueries",
          label: this.$t('tables.Failed Queries in last 24h'),
        },
        {
          prop: "queryCost",
          label: this.$t('tables.Last 7 days info'),
        },
      ];
      return columns
    }
  }
};
</script>

<style lang="scss" scoped>
.table-metric {
  border-bottom: 1px solid var(--color-gray);
}
</style>