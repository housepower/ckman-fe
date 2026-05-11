<template>
  <div class="history pb-20">
    <!-- create view -->
    <div v-if="currentView === 'create'">
      <div class="create-header">
        <el-button icon="el-icon-arrow-left" size="small" @click="backToList">
          {{ $t('history.Back to List') }}
        </el-button>
      </div>
      <BackupComponent @submitted="onBackupSubmitted" @cancel="backToList" />
    </div>

    <!-- restore view -->
    <div v-else-if="currentView === 'restore'">
      <div class="create-header">
        <el-button icon="el-icon-arrow-left" size="small" @click="backToList">
          {{ $t('history.Back to List') }}
        </el-button>
      </div>
      <RestoreComponent @submitted="onRestoreSubmitted" @cancel="backToList" />
    </div>

    <!-- list view -->
    <div v-else>
      <PolicyList
        ref="policyList"
        @view-run="handleViewRun"
        @go-backup="goToCreate"
        @go-restore="goToRestore"
        @edit-policy="handleEditPolicy"
        @copy-policy="handleCopyPolicy"
      />
    </div>

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
import BackupComponent from './backup.vue';
import RestoreComponent from './restore.vue';
import PolicyList from './policy-list.vue';
import RunDetail from './run-detail.vue';
import PolicyEditModal from './policy-edit-modal.vue';

export default {
  name: 'History',
  components: { BackupComponent, RestoreComponent, PolicyList, RunDetail, PolicyEditModal },
  data() {
    return {
      currentView: 'list',  // 'list' | 'create' | 'restore'
      runDetailVisible: false,
      currentRunId: '',
      editModalVisible: false,
      currentEditPolicyId: '',
    };
  },
  methods: {
    goToCreate() {
      this.currentView = 'create';
    },
    goToRestore() {
      this.currentView = 'restore';
    },
    backToList() {
      this.currentView = 'list';
    },
    onBackupSubmitted() {
      this.currentView = 'list';
      this.$nextTick(() => {
        if (this.$refs.policyList && this.$refs.policyList.fetchPolicies) {
          this.$refs.policyList.fetchPolicies();
        }
      });
    },
    onRestoreSubmitted() {
      this.currentView = 'list';
      this.$nextTick(() => {
        if (this.$refs.policyList && this.$refs.policyList.fetchPolicies) {
          this.$refs.policyList.fetchPolicies();
        }
      });
    },
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

.create-header {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}
</style>
