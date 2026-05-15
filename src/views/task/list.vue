<template>
  <main class="task-page">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console')]"
      :title="$t('task.Task List')"
    >
      <template #actions>
        <span class="task-page__running">
          <i class="el-icon-loading" />
          {{ $t('task.Running Task Num') }}: {{ runningTaskNum || 0 }}
        </span>
      </template>
    </PageHeader>

    <section class="task-page__card" v-if="isLoaded">
      <div class="task-page__toolbar">
        <el-input
          v-model="searchKey"
          size="small"
          :placeholder="$t('common.keyword search')"
          suffix-icon="el-icon-search"
          class="task-page__search"
        />
        <el-button
          size="small"
          type="danger"
          plain
          icon="el-icon-delete"
          @click="deleteTaskBatch"
        >{{ $t('common.Delete') }}</el-button>
      </div>

      <vxe-table
        ref="xTable"
        v-loading="loading"
        :data="currentPageData"
        :border="false"
        align="center"
        resizable
        show-header-overflow
        show-overflow
        highlight-hover-row
        :sort-config="{ trigger: 'cell' }"
        row-id="TaskId"
        @sort-change="sortChangeEvent"
      >
        <vxe-column type="checkbox" width="56" align="center" />
        <vxe-column
          v-for="{ prop, label, minWidth, fixed, filters } of columns"
          :key="prop"
          :fixed="fixed"
          :field="prop"
          :title="label"
          :filters="filters || null"
          :min-width="minWidth || 140"
          sortable
        >
          <template slot-scope="{ row, column }">
            <span v-if="column.property === 'Option'">{{ row.Option[lang] }}</span>
            <span
              v-else-if="column.property === 'Status'"
              class="task-page__status"
              :class="statusClass(row.Status)"
            >{{ row.Status }}</span>
            <span v-else>{{ row[column.property] }}</span>
          </template>
        </vxe-column>
        <vxe-column
          fixed="right"
          align="center"
          :show-overflow="false"
          :title="$t('tables.Action')"
          width="220"
        >
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="viewDetail(scope.row)">
              {{ $t('task.View') }}
            </el-button>
            <el-button
              type="text"
              size="small"
              :disabled="!['Success', 'Failed', 'Stopped'].includes(scope.row.Status)"
              @click="deleteTask(scope.row.TaskId)"
            >{{ $t('common.Delete') }}</el-button>
            <el-button
              type="text"
              size="small"
              :disabled="!['Running', 'Waiting'].includes(scope.row.Status)"
              @click="stopTask(scope.row)"
            >{{ $t('task.Stop') }}</el-button>
          </template>
        </vxe-column>
      </vxe-table>

      <vxe-pager
        :current-page="pagination.currentPage"
        :page-size.sync="pagination.pageSize"
        :page-sizes="pagination.pageSizes"
        :total="pagination.total"
        :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']"
        @page-change="handlePageChange"
      />
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
      loading: false,
      isLoaded: false,
      searchKey: '',
      sort: {},
      pagination: {
        total: 0,
        pageSize: 10,
        pageSizes: [10, 20, 50, 100, 200, 500, 1000],
        currentPage: 1,
      },
      clusters: [],
      runningTaskNum: null,
      timerId: null,
    };
  },
  computed: {
    columns() {
      const { clusters } = this;
      return [
        { prop: 'TaskId',      label: this.$t('task.Task ID'),       minWidth: 220 },
        { prop: 'ClusterName', label: this.$t('task.Cluster Name'),  filters: clusters, minWidth: 140 },
        { prop: 'Type',        label: this.$t('task.Task Type'),     minWidth: 120 },
        { prop: 'Option',      label: this.$t('task.Task Name'),     minWidth: 160 },
        {
          prop: 'Status', label: this.$t('task.Task Status'), minWidth: 110,
          filters: [
            { label: 'Waiting', value: 'Waiting' },
            { label: 'Running', value: 'Running' },
            { label: 'Failed',  value: 'Failed' },
            { label: 'Success', value: 'Success' },
            { label: 'Stopped', value: 'Stopped' },
          ],
        },
        { prop: 'Message',    label: this.$t('task.Message'),     minWidth: 200 },
        { prop: 'CreateTime', label: this.$t('task.Create Time'), minWidth: 160 },
        { prop: 'UpdateTime', label: this.$t('task.Update Time'), minWidth: 160 },
        { prop: 'Duration',   label: this.$t('task.Duration'),    minWidth: 110 },
      ];
    },
    lang() {
      return this.$i18n.locale.toUpperCase();
    },
    listData() {
      const { searchKey, sort: { property, order }, lang } = this;
      const filtered = this.tableData.filter((x) => {
        const k = searchKey || '';
        return (
          (x.ClusterName || '').includes(k) ||
          (x.Type || '').includes(k) ||
          (x.Status || '').includes(k) ||
          (x.Option && x.Option[lang] && x.Option[lang].includes(k)) ||
          (x.TaskId || '').includes(k)
        );
      });
      if (!property || !order) return filtered;
      const sorted = filtered.slice();
      sorted.sort((a, b) => {
        const av = a[property];
        const bv = b[property];
        let flag = 0;
        if (typeof av === 'number' && typeof bv === 'number') {
          flag = av - bv;
        } else {
          const as = String(av ?? '');
          const bs = String(bv ?? '');
          flag = as.length === bs.length ? as.localeCompare(bs) : as.length - bs.length;
        }
        return order === 'asc' ? flag : -flag;
      });
      return sorted;
    },
    currentPageData() {
      const { currentPage, pageSize } = this.pagination;
      return this.listData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    },
  },
  watch: {
    'listData.length'(len) {
      this.pagination.currentPage = 1;
      this.pagination.total = len;
    },
  },
  async created() {
    await this.getClusterList();
    this.fetchData();
    this.getRunningTasks();
    this.timerId = setInterval(this.refresh, 3000);
  },
  beforeDestroy() {
    if (this.timerId) clearInterval(this.timerId);
  },
  methods: {
    statusClass(status) {
      return {
        'task-page__status--success': status === 'Success',
        'task-page__status--running': status === 'Running' || status === 'Waiting',
        'task-page__status--danger':  status === 'Failed',
        'task-page__status--muted':   status === 'Stopped',
      };
    },
    async getClusterList() {
      const { data: { entity } } = await ClusterApi.getCluster();
      this.clusters = (Object.keys(entity) || []).map((x) => ({ label: x, value: x }));
    },
    sortChangeEvent({ property, order }) {
      this.sort = { property, order };
    },
    handlePageChange(pager) {
      this.pagination.currentPage = pager.currentPage;
    },
    async fetchData() {
      const { data: { entity } } = await TaskApi.getLists().finally(() => {
        this.isLoaded = true;
      });
      this.tableData = entity;
      if (entity.filter((task) => !['Success', 'Failed', 'Stopped'].includes(task.Status)).length === 0) {
        if (this.timerId) clearInterval(this.timerId);
      }
    },
    async deleteTask(taskId) {
      await this.$confirm(this.$t('task.Delete Task'), this.$t('common.tips'), {
        confirmButtonText: this.$t('common.Confirm'),
        cancelButtonText: this.$t('common.Cancel'),
      });
      await TaskApi.deleteTask(taskId);
      $message.success(this.$t('common.Delete') + ' ' + this.$t('common.Success'));
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
          cancelText: this.$t('task.Close'),
          okText: null,
        },
        data: {
          taskId: task.TaskId,
          refresh: ['Waiting', 'Running'].includes(task.Status),
        },
      });
    },
    refresh() {
      this.fetchData();
      this.getRunningTasks();
    },
    getSelectRecords() {
      return this.$refs.xTable?.getCheckboxRecords() || [];
    },
    async deleteTaskBatch() {
      const selectRecords = this.getSelectRecords();
      if (selectRecords.length === 0) return;
      await this.$confirm(this.$t('task.Delete Task'), this.$t('common.tips'), {
        confirmButtonText: this.$t('common.Confirm'),
        cancelButtonText: this.$t('common.Cancel'),
      });
      // @ts-ignore
      const results:{ status: string, value: any}[] = await Promise.allSettled(
        selectRecords.map((x) => TaskApi.deleteTask(x.TaskId)),
      );
      const okCount = results.filter((x) => x.status === 'fulfilled').length;
      const failCount = results.filter((x) => x.status === 'rejected').length;
      const msg = failCount > 0 ? $message.warning : $message.success;
      msg(
        `${this.$t('common.Success')}${okCount}, ${this.$t('common.Failed')}${failCount}`,
      );
      this.fetchData();
    },
    async stopTask(item) {
      await this.$confirm(
        this.$t('task.The current operation cannot be actually canceled, only the task status is changed to stopped'),
        this.$t('common.tips'),
        {
          confirmButtonText: this.$t('task.Stop'),
          cancelButtonText: this.$t('common.Cancel'),
          text: 'warning',
        },
      );
      await TaskApi.stopTask(item.TaskId);
      this.$message.success(this.$t('common.Action Success'));
    },
  },
};
</script>

<style lang="scss" scoped>
.task-page {
  padding-bottom: var(--s-8);

  &__running {
    display: inline-flex;
    align-items: center;
    gap: var(--s-1);
    padding: var(--s-1) var(--s-2);
    font-size: var(--fs-sm);
    color: var(--c-success-fg);
    background: var(--c-success-bg);
    border: 1px solid var(--c-success-border);
    border-radius: var(--r-sm);
    font-variant-numeric: tabular-nums;
  }

  &__card {
    background: var(--c-surface-0);
    border: 1px solid var(--c-surface-3);
    border-radius: var(--r-lg);
    padding: var(--s-4);
  }

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--s-2);
    margin-bottom: var(--s-3);
  }

  &__search {
    width: 240px;
  }

  &__status {
    display: inline-flex;
    align-items: center;
    padding: 2px var(--s-2);
    border-radius: var(--r-pill);
    font-size: var(--fs-xs);
    font-weight: var(--fw-medium);
    border: 1px solid transparent;

    &--success {
      color: var(--c-success-fg);
      background: var(--c-success-bg);
      border-color: var(--c-success-border);
    }
    &--running {
      color: var(--c-primary-fg);
      background: var(--c-primary-bg);
      border-color: var(--c-primary-border);
    }
    &--danger {
      color: var(--c-danger-fg);
      background: var(--c-danger-bg);
      border-color: var(--c-danger-border);
    }
    &--muted {
      color: var(--c-text-tertiary);
      background: var(--c-surface-1);
      border-color: var(--c-surface-3);
    }
  }
}
</style>
