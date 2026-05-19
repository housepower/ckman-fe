<template>
  <main class="users-page">
    <header class="users-page__bar">
      <h2 class="users-page__title">{{ $t('user.User Management') }}</h2>
      <el-button type="primary" size="small" @click="openCreate">
        <i class="fa fa-plus" /> {{ $t('user.Add User') }}
      </el-button>
    </header>
    <el-table :data="rows" stripe v-loading="loading">
      <el-table-column prop="username" :label="$t('user.Username')" />
      <el-table-column>
        <template slot="header">
          {{ $t('user.Role') }}<role-help />
        </template>
        <template slot-scope="{ row }">
          {{ $t('user.Policy.' + row.policy) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('user.Enabled')" width="120">
        <template slot-scope="{ row }">
          <el-switch
            :value="row.enabled"
            :disabled="isBuiltin(row.username)"
            @change="onToggleEnabled(row, $event)"
          />
        </template>
      </el-table-column>
      <el-table-column :label="$t('user.Created At')" width="180">
        <template slot-scope="{ row }">
          {{ formatTs(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.Action')" width="280">
        <template slot-scope="{ row }">
          <el-button
            size="mini"
            :disabled="isBuiltin(row.username)"
            @click="openEdit(row)"
          >{{ $t('user.Edit User') }}</el-button>
          <el-button size="mini" @click="openResetPwd(row)">
            {{ $t('user.Reset Password') }}
          </el-button>
          <el-button
            size="mini"
            type="danger"
            :disabled="isBuiltin(row.username)"
            @click="onDelete(row)"
          >{{ $t('common.Delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </main>
</template>

<script>
import { UserApi } from '@/apis';
import { $modal } from '@/services';
import RoleHelp from '@/views/users/role-help.vue';

const BUILTIN = new Set(['ckman', 'ordinary']);

export default {
  name: 'Users',
  components: { RoleHelp },
  data() {
    return { rows: [], loading: false };
  },
  async created() {
    await this.refresh();
  },
  methods: {
    async refresh() {
      this.loading = true;
      try {
        const { data: { entity } } = await UserApi.list();
        this.rows = entity || [];
      } finally {
        this.loading = false;
      }
    },
    isBuiltin(name) {
      return BUILTIN.has(name);
    },
    formatTs(sec) {
      if (!sec) return '';
      return new Date(sec * 1000).toLocaleString();
    },
    async onToggleEnabled(row, next) {
      const action = next ? this.$t('common.Enable') : this.$t('common.Disable');
      try {
        await this.$confirm(`${action} ${row.username}?`, this.$t('common.tips'), {
          confirmButtonText: this.$t('common.Confirm'),
          cancelButtonText: this.$t('common.Cancel'),
        });
      } catch (_) {
        return;
      }
      await UserApi.update(row.username, { enabled: next });
      this.$message.success(this.$t('common.Success'));
      await this.refresh();
    },
    async onDelete(row) {
      try {
        await this.$confirm(this.$t('common.Confirm Delete'), this.$t('common.tips'), {
          confirmButtonText: this.$t('common.Confirm'),
          cancelButtonText: this.$t('common.Cancel'),
          type: 'warning',
        });
      } catch (_) {
        return;
      }
      await UserApi.delete(row.username);
      this.$message.success(this.$t('common.Success'));
      await this.refresh();
    },
    async openCreate() {
      try {
        await $modal({
          component: () => import('@/views/users/modal/createUser.vue'),
          props: { title: this.$t('user.Add User'), width: 480 },
        });
        await this.refresh();
      } catch (_) { /* cancelled */ }
    },
    async openEdit(row) {
      try {
        await $modal({
          component: () => import('@/views/users/modal/editUser.vue'),
          props: { title: this.$t('user.Edit User'), width: 480 },
          data: { user: row },
        });
        await this.refresh();
      } catch (_) { /* cancelled */ }
    },
    async openResetPwd(row) {
      try {
        await $modal({
          component: () => import('@/views/users/modal/resetPassword.vue'),
          props: { title: this.$t('user.Reset Password'), width: 440 },
          data: { username: row.username },
        });
      } catch (_) { /* cancelled */ }
    },
  },
};
</script>

<style lang="scss" scoped>
.users-page {
  padding: var(--s-4) var(--s-5);

  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--s-3);
  }

  &__title {
    margin: 0;
    font-size: var(--fs-lg);
    font-weight: var(--fw-semibold);
  }
}
</style>
