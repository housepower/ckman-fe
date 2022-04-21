<template>
  <div class="task-detail">
    <div v-if="detail" class="mb-20">
      <label>{{$t('task.Task ID')}}：</label><span class="fc-black">{{detail.TaskId}}</span>
      <label class="ml-20">{{$t('task.Cluster Name')}}：</label><span class="fc-black">{{detail.ClusterName}}</span>
      <label class="ml-20">{{$t('task.Current Action')}}：</label><span class="fc-black">{{detail.Option[lang] }}</span>
    </div>

    <vxe-table
        style="clear: both;"
        ref="xTable"
        v-bind="gridOptions"
        size="mini"
        :columns="columns"
        :data="currentPageData"
      >
        <vxe-column fixed="right" align="center" :title="$t('task.Node')" field="Host"></vxe-column>
        <vxe-column fixed="right" align="center" :title="$t('task.Status')" field="Status">
          <template slot-scope="scope">
            <div class="flex flex-vcenter flex-center">
              <img src="/images/5-130H2191322-50.gif" v-if="loading" class="mr-20" />
              <span class="status" :class="scope.row.Status.EN">{{scope.row.Status[lang]}}</span>
            </div>
          </template>
        </vxe-column>
      </vxe-table>

      <vxe-pager
        align="center"
        :current-page="pagination.currentPage"
        :page-size.sync="pagination.pageSize"
        :page-sizes="pagination.pageSizes"
        :total="pagination.total"
        :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'Total']"
        @page-change="handlePageChange">
      </vxe-pager>
  </div>
</template>
<script>
import { TaskApi } from '@/apis';
export default {
  props: {
    taskId: String,
    refresh: Boolean,
  },
  data() {
    return {
      timerId: null,
      detail: null,
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
        rowId: 'Host',
      },
      loading: false,
      status: null,
    };
  },
  computed: {
    columns() {
      return [
        { prop: 'Host' },
        { prop: 'Status' },
      ]
    },
    lang() {
      return this.$i18n.locale.toUpperCase();
    },
    currentPageData() {
      const { pagination: { currentPage, pageSize } } = this;
      return this.detail?.NodeStatus?.slice((currentPage - 1)*pageSize, currentPage*pageSize);
    }
  },
  created() {
    this.getTaskDetail();
    if (this.refresh) {
      this.loading = true;
      this.timerId = setInterval(this.getTaskDetail, 3000);
    }
  },
  beforeDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  },
  methods: {
    async getTaskDetail() {
      this.status = null;
      const { data: { entity } } = await TaskApi.getTaskDetail(this.taskId);
      this.detail = entity;
      this.pagination.currentPage = 1;
      this.pagination.total = entity.NodeStatus.length;
      // 全部任务成功或失败后，清除定时器，关闭loading
      if (entity.NodeStatus.filter(x => !['Done', 'Failed'].includes(x.Status.EN)).length == 0) {
        clearInterval(this.timerId);
        this.loading = false;
        // 任务全部完成，状态为Done，否则为Failed
        if (entity.NodeStatus.every(x => x.Status.EN === 'Done')) {
          this.status = 'Done';
        } else {
          this.status = 'Failed';
        }
      }
    },
    handlePageChange(pager) {
      this.pagination.currentPage = pager.currentPage;
    },
    onOk() {
      return this.status;
    }
  },
};
</script>

<style lang="scss" scoped>
  .status {
    color: green;
  }
  .Failed {
    color: red;
  }

  .Waiting {
    color: gray;
  }

</style>
