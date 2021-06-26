<template>
  <div>
    <el-table :data="list.slice((currentPage - 1)*pageSize, currentPage*pageSize)"
      border
      align="center">
      <el-table-column prop="startTime"
                  show-overflow-tooltip
                  :label="$t('session.Query Start Time')"
                  align="center"
                  sortable
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
    <div class="text-center">
      <!-- 前端分页 -->
      <el-pagination v-if="list.length > 0"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[5, 10, 20, 40]"
        :page-size="pageSize"
        layout="sizes, prev, pager, next, jumper"
        :total="list.length">
      </el-pagination>
    </div>
   
  </div>
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
    return {
      currentPage: 1,
      pageSize: 10,
    };
  },
  methods: {
    // 前端分页
    handleSizeChange(size) {
      this.pageSize = size;
    },
    handleCurrentChange(currentPage) {
      this.currentPage = currentPage;
    },
  },
  mounted() {},
  components: {},
};
</script>

<style></style>
