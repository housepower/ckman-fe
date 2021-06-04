<template>
  <el-table :data="list"
            border
            align="center">
    <el-table-column prop="startTime"
                     show-overflow-tooltip
                     :label="$t('session.Query Start Time')"
                     align="center"
                     #default="{ row }">
      <span>{{ row.startTime * 1000 | formatDate }}</span>
    </el-table-column>
    <el-table-column prop="queryDuration"
                     show-overflow-tooltip
                     :label="$t('session.Query Duration')"
                     width="140"
                     align="center" />
    <el-table-column prop="query"
                     show-overflow-tooltip
                     :label="$t('session.Query')"
                     align="center" />
    <el-table-column prop="user"
                     show-overflow-tooltip
                     :label="$t('session.Initial User')"
                     width="120"
                     align="center" />
    <el-table-column prop="queryId"
                     show-overflow-tooltip
                     :label="$t('session.Initial Query ID')"
                     align="center" />
    <el-table-column prop="address"
                     show-overflow-tooltip
                     :label="$t('session.Initial Address')"
                     align="center" />
    <el-table-column prop="threads"
                     show-overflow-tooltip
                     :label="$t('session.Thread Numbers')"
                     width="120"
                     align="center" />
  </el-table>
</template>
<script>
export default {
  props: {
    list: {
      type: Array,
      default: [],
    },
  },
  data() {
    return {};
  },
  mounted() {},
  components: {},
};
</script>

<style></style>
