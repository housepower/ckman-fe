<template>
  <div class="history pb-20">
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('history.Tasks Tab')" name="tasks">
        <TaskList
          :policies="policies"
          :loading="loading"
          @refresh="fetchPolicies"
          @view-task="onViewTask"
          @go-backup="backupDialogVisible = true"
          @go-restore="onGoRestore"
        />
      </el-tab-pane>
      <el-tab-pane :label="$t('history.Tables Tab')" name="tables">
        <TableList
          :policies="policies"
          :loading="loading"
          @refresh="fetchPolicies"
          @view-table="onViewTable"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 全局 dialogs -->
    <TaskDetailDialog v-model="taskDetailVisible" :task="currentTask" @edit-task="onEditTask" />
    <TaskEditDialog v-model="taskEditVisible" :task="currentTask" @updated="fetchPolicies" />
    <PartitionListDialog v-model="partitionDialogVisible" :policy="currentPolicy" :policies="policies" @view-run="onViewRun" @restore-partitions="onRestorePartitions" />
    <BackupFormDialog v-model="backupDialogVisible" :cluster="cluster" :policies="policies" @submitted="fetchPolicies" />
    <RestoreFormDialog
      v-model="restoreDialogVisible"
      :cluster="cluster"
      :init-database="restoreInit.database"
      :init-table="restoreInit.table"
      :init-source-run-id="restoreInit.sourceRunId"
      @submitted="fetchPolicies"
    />
    <RunDetailDialog v-model="runDetailVisible" :run-id="currentRunId" @restore-from-run="onRestoreFromRun" />
  </div>
</template>

<script>
import { DataManageApi } from '@/apis';
import TaskList from './task-list.vue';
import TableList from './table-list.vue';
import TaskDetailDialog from './task-detail-dialog.vue';
import TaskEditDialog from './task-edit-dialog.vue';
import PartitionListDialog from './partition-list-dialog.vue';
import BackupFormDialog from './backup-form-dialog.vue';
import RestoreFormDialog from './restore-form-dialog.vue';
import RunDetailDialog from './run-detail-dialog.vue';

export default {
  name: 'History',
  components: {
    TaskList,
    TableList,
    TaskDetailDialog,
    TaskEditDialog,
    PartitionListDialog,
    BackupFormDialog,
    RestoreFormDialog,
    RunDetailDialog,
  },
  data() {
    return {
      activeTab: 'tasks',
      policies: [],
      loading: false,
      taskDetailVisible: false,
      taskEditVisible: false,
      partitionDialogVisible: false,
      backupDialogVisible: false,
      restoreDialogVisible: false,
      runDetailVisible: false,
      currentTask: null,
      currentPolicy: null,
      currentRunId: '',
      restoreInit: { database: '', table: '', sourceRunId: '' },
    };
  },
  computed: {
    cluster() { return this.$route.params.id; },
  },
  mounted() { this.fetchPolicies(); },
  methods: {
    async fetchPolicies() {
      this.loading = true;
      try {
        const res = await DataManageApi.listPolicies(this.cluster);
        if (res.data.retCode === '0000') {
          this.policies = res.data.entity || [];
        } else {
          this.$message.error(res.data.retMsg || this.$t('history.Fetch Policies Failed'));
        }
      } catch (e) {
        this.$message.error(this.$t('history.Fetch Policies Failed') + ': ' + e.message);
      } finally {
        this.loading = false;
      }
    },
    onViewTask(task) {
      this.currentTask = task;
      this.taskDetailVisible = true;
    },
    onEditTask(task) {
      this.currentTask = task;
      this.taskEditVisible = true;
    },
    onViewTable(policy) {
      this.currentPolicy = policy;
      this.partitionDialogVisible = true;
    },
    onViewRun(runId) {
      this.currentRunId = runId;
      this.runDetailVisible = true;
    },
    onGoRestore() {
      this.restoreInit = { database: '', table: '', sourceRunId: '' };
      this.restoreDialogVisible = true;
    },
    onRestoreFromRun({ cluster, run_id, database, table }) {
      this.restoreInit = { database, table, sourceRunId: run_id };
      this.restoreDialogVisible = true;
    },
    async onRestorePartitions({ cluster, items }) {
      const results = await Promise.allSettled(
        items.map(item => DataManageApi.restoreData(cluster, {
          source_run_id: item.run_id,
          partitions: item.partitions,
        }))
      );
      const success = results.filter(r => r.status === 'fulfilled' && r.value.data.retCode === '0000').length;
      const failed = results.length - success;
      if (failed === 0) {
        this.$message.success(this.$t('history.Restore Submitted Ok', { success }));
      } else {
        this.$message.warning(this.$t('history.Restore Submitted Partial', { success, failed }));
      }
      this.fetchPolicies();
    },
  },
};
</script>

<style scoped>
.history { padding: 20px; }
</style>
