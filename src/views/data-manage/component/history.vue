<template>
  <div class="history pb-20">
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('history.Policy List')" name="policies">
        <PolicyList
          v-if="activeTab === 'policies'"
          @view-run="handleViewRun"
          @go-backup="handleGoBackup"
          @edit-policy="handleEditPolicy"
          @copy-policy="handleCopyPolicy"
          @view-table-ledger="handleViewTableLedger"
        />
      </el-tab-pane>
      <el-tab-pane :label="$t('history.Table Ledger')" name="ledger">
        <TableLedger
          ref="tableLedger"
          v-if="activeTab === 'ledger'"
          @view-run="handleViewRun"
        />
      </el-tab-pane>
    </el-tabs>
    <!-- T13: run-detail drawer / edit-modal will be mounted here -->
  </div>
</template>

<script>
import PolicyList from './policy-list.vue';
import TableLedger from './table-ledger.vue';

export default {
  name: 'History',
  components: { PolicyList, TableLedger },
  data() {
    return {
      activeTab: 'policies',
    };
  },
  methods: {
    handleViewRun(runId) {
      // TODO T13: open run-detail drawer
      console.log('TODO T13: open run detail', runId);
    },
    handleGoBackup() {
      // TODO: switch to backup-data menu item in data-manage.vue
      console.log('TODO: switch to backup-data menu');
    },
    handleEditPolicy(policy) {
      // TODO T13: open policy edit modal
      console.log('TODO T13: open edit modal', policy);
    },
    handleCopyPolicy(policy) {
      // TODO T13: copy policy to new backup form
      console.log('TODO T13: copy policy as new backup', policy);
    },
    handleViewTableLedger({ database, table }) {
      this.activeTab = 'ledger';
      this.$nextTick(() => {
        if (this.$refs.tableLedger) {
          this.$refs.tableLedger.selectedDatabase = database;
          this.$refs.tableLedger.selectedTable = table;
        }
      });
    },
  },
};
</script>

<style scoped>
.history {
  padding: 20px;
}
</style>
