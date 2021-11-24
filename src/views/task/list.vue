<template>
  <main class="settings">
    <breadcrumb :data="['Message Center']"></breadcrumb>
    <div class="title flex flex-between flex-vcenter ptb-10 pull-left">
      <span class="fs-20 font-bold">{{$t('task.Task List')}}</span>
      <span class="ml-5 fc-green fs-14">( {{$t('task.Running Task Num')}} {{runningTaskNum}} )</span>
    </div
    <section class="mb-20" v-if="isLoaded">
      <vxe-toolbar zoom custom class="pull-right">
        <template #buttons>
          <el-input size="medium" :placeholder="$t('common.keyword search')" v-model="searchKey" class="width-250 mr-10" suffix-icon="el-icon-search"></el-input>
          <el-button size="mini" @click="refresh()" circle icon="el-icon-refresh" class="fs-16 fc-black" style="border-color: #dcdfe6;"></el-button>
        </template>
      </vxe-toolbar>

      <vxe-table
        style="clear: both;"
        ref="xTable"
        v-bind="gridOptions"
        v-loading="loading"
        :columns="columns"
        :data="currentPageData"
        @sort-change="sortChangeEvent"
      >
       <vxe-column
          v-for="{ prop, label, minWidth, fixed, filters } of columns"
          :key="prop"
          :fixed="fixed"
          sortable
          :field="prop"
          :title="label"
          :filters="filters || null"
          :min-width="minWidth || 140">
          <template slot-scope="{ row, column }">
            <span v-if="column.property === 'Option'">{{ row.Option[lang] }}</span>
            <span v-else>{{ row[column.property] }}</span>
          </template>
        </vxe-column>
        <vxe-column
          fixed="right"
          align="center"
          :title="$t('tables.Action')"
          width="140">
          <template slot-scope="scope">
            <el-button  type="text" size="small" @click="viewDetail(scope.row)">{{$t('task.View')}}</el-button>
            <el-button  type="text" size="small" :disabled="!['Success', 'Failed'].includes(scope.row.Status)" @click="deleteTask(scope.row.TaskId)">{{$t('common.Delete')}}</el-button>
          </template>
        </vxe-column>
      </vxe-table>

      <vxe-pager
        :current-page="pagination.currentPage"
        :page-size.sync="pagination.pageSize"
        :page-sizes="pagination.pageSizes"
        :total="pagination.total"
        :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']"
        @page-change="handlePageChange">
      </vxe-pager>
    </section>
  </main>
</template>
<script lang="ts">
import { TaskApi, ClusterApi } from '@/apis';
import { $message, $modal } from '@/services';
import TaskDetail from './components/TaskDetail.vue';
export default {
  data() {
    return {
      tableData: [],
      headerData: [],
      loading: false,
      isLoaded: false,
      searchKey: '',
      sort: {},
      pagination: {
        total: 0,
        pageSize: 10,
        pageSizes: [10, 15, 20, 50, 100, 200, 500, 1000],
        currentPage: 1
      },
      gridOptions: {
        border: true,
        resizable: true,
        showHeaderOverflow: true,
        showOverflow: true,
        highlightHoverRow: true,
        rowId: 'TaskId',
        toolbarConfig: {
          zoom: true,
          custom: true
        },
        sortConfig: {
          trigger: 'cell',
        },
        filterConfig: {
        },
      },
      clusters: [],
      runningTaskNum: null,
      timerId1: null,
      timerId2: null
    };
  },
  computed: {
    columns() {
      const { clusters } = this;
      return [
        { prop: 'TaskId', label: this.$t('task.Task ID') },
        { prop: 'ClusterName', label: this.$t('task.Cluster Name'), filters: clusters },
        { prop: 'Type', label: this.$t('task.Task Type') },
        { prop: 'Option', label: this.$t('task.Task Name') },
        { prop: 'Status', label: this.$t('task.Task Status'), filters: [
          { label: 'Waiting', value: 'Waiting' },
          { label: 'Running', value: 'Running' },
          { label: 'Failed', value: 'Failed' },
          { label: 'Success', value: 'Success' }
        ] },
        { prop: 'CreateTime', label: this.$t('task.Create Time') },
      ];
    },
    lang() {
      return this.$i18n.locale.toUpperCase();
    },
    listData() {
      const { searchKey, sort: { property, order } } = this;
      const result = this.tableData
        .filter(x => {
          let flag = true;
          if (!x.ClusterName?.includes(searchKey)) {
            flag = false;
          }
          return flag;
        })
        .sort((prev, next) => {
          const type = typeof prev[property];
          if (type === 'number') {
            const flag = prev[property] - next[property];
            if (order === 'asc') {
              return flag;
            } else if (order === 'desc') {
              return -flag;
            }
          } else if (type === 'string') {
            let flag;
            if(prev[property].length === next[property].length){
              flag = prev[property].localeCompare(next[property]);
            } else {
              flag = prev[property].length - next[property].length;
            }
            if (order === 'asc') {
              return flag;
            } else if (order === 'desc') {
              return -flag;
            }
          }
        })
      return result;
    },
    currentPageData() {
      const { pagination: { currentPage, pageSize } } = this;
      return this.listData?.slice((currentPage - 1)*pageSize, currentPage*pageSize);
    }
  },
  watch: {
    'listData.length'(len) {
      this.pagination.currentPage = 1;
      this.pagination.total = len;
    }
  },
  async created() {
    await this.getClusterList();
    this.fetchData();
    this.getRunningTasks();
  },
  methods: {
    async getClusterList() {
      const {
        data: { entity },
      } = await ClusterApi.getCluster();
      this.clusters = Object.keys(entity).map(x => {
        return {
          label: x,
          value: x
        };
      });
    },
    sortChangeEvent(ctx) {
      const { property, order } = ctx;
      this.sort = {
        property,
        order
      };
    },
    handlePageChange(pager) {
      this.pagination.currentPage = pager.currentPage;
    },
    async fetchData() {
      const { data: { entity } } = await TaskApi.getLists()
        .finally(() => {
          this.isLoaded = true;
        });

      this.tableData = entity;
    },
    async deleteTask(taskId) {
      await TaskApi.deleteTask(taskId);
      $message.success(this.$t('common.Delete') + this.$t('common.Success'));
      this.fetchData();
    },
    async getRunningTasks() {
      const { data: { entity } } = await TaskApi.getRunningLists();
      this.runningTaskNum = entity;
    },
    viewDetail(task) {
      $modal({
        component: TaskDetail,
        props: {
          title: this.$t('task.View Task'),
          width: 800,
          cancelText: this.$t("task.Close"),
          okText: null,
        },
        data: {
          taskId: task.TaskId,
          refresh: ['Waiting', 'Running'].includes(task.Status)
        },
      });
    },
    refresh() {
      this.fetchData();
      this.getRunningTasks();
    }
  },
};
</script>

<style lang="scss" scoped>

</style>
