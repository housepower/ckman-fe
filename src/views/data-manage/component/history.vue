<template>
  <div class="history pb-20">
    <el-tabs v-model="activeTab" type="">
      <el-tab-pane :label="$t('history.Policy List')" name="policies">
        <PolicyList
          v-if="activeTab === 'policies'"
          ref="policyList"
          @view-run="handleViewRun"
          @go-backup="handleGoBackup"
          @edit-policy="handleEditPolicy"
          @copy-policy="handleCopyPolicy"
          @view-table-ledger="handleViewTableLedger"
        />
      </el-tab-pane>
      <el-tab-pane :label="$t('history.Table Ledger')" name="ledger">
        <TableLedger
          v-if="activeTab === 'ledger'"
          ref="tableLedger"
          :init-database="ledgerDb"
          :init-table="ledgerTable"
          @view-run="handleViewRun"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- Run Detail Dialog -->
    <RunDetail v-model="runDetailVisible" :run-id="currentRunId" />

    <!-- Edit Policy Modal -->
    <PolicyEditModal
      v-model="editModalVisible"
      :policy-id="currentEditPolicyId"
      @updated="onPolicyUpdated"
    />
  </div>
</template>

<script>
import PolicyList from './policy-list.vue';
import TableLedger from './table-ledger.vue';
import RunDetail from './run-detail.vue';
import PolicyEditModal from './policy-edit-modal.vue';

export default {
  name: 'History',
  components: { PolicyList, TableLedger, RunDetail, PolicyEditModal },
  data() {
    return {
      activeTab: 'policies',
      runDetailVisible: false,
      currentRunId: '',
      editModalVisible: false,
      currentEditPolicyId: '',
      ledgerDb: '',
      ledgerTable: '',
    };
  },
  methods: {
    handleViewRun(runId) {
      this.currentRunId = runId;
      this.runDetailVisible = true;
    },
    handleEditPolicy(policy) {
      this.currentEditPolicyId = policy.policy_id;
      this.editModalVisible = true;
    },
    handleCopyPolicy(policy) {
      this.$message.info(this.$t('history.Copy Policy Hint'));
      console.log('TODO: copy policy', policy);
    },
    handleGoBackup() {
      this.$message.info(this.$t('history.Go Backup Hint'));
      console.log('TODO: switch to backup-data');
    },
    handleViewTableLedger({ database, table }) {
      this.ledgerDb = database;
      this.ledgerTable = table;
      this.activeTab = 'ledger';
    },
    onPolicyUpdated() {
      if (this.$refs.policyList && this.$refs.policyList.fetchPolicies) {
        this.$refs.policyList.fetchPolicies();
      }
    },
  },
};
</script>

<style scoped>
.history {
  padding: 20px;
}
</style>
