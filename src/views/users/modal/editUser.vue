<template>
  <section class="user-modal">
    <el-form ref="form" :model="form" label-width="120px" @submit.native.prevent>
      <el-form-item :label="$t('user.Username')">
        <el-input :value="user.username" disabled />
      </el-form-item>
      <el-form-item :label="$t('user.Role')">
        <el-select v-model="form.policy" style="width: 100%">
          <el-option value="ordinary" :label="$t('user.Policy.ordinary')" />
          <el-option value="guest" :label="$t('user.Policy.guest')" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('user.Enabled')">
        <el-switch v-model="form.enabled" />
      </el-form-item>
    </el-form>
  </section>
</template>

<script>
import { UserApi } from '@/apis';

export default {
  props: {
    user: { type: Object, required: true },
  },
  data() {
    return {
      form: { policy: this.user.policy, enabled: this.user.enabled },
    };
  },
  methods: {
    async onOk() {
      await UserApi.update(this.user.username, {
        policy: this.form.policy,
        enabled: this.form.enabled,
      });
      this.$message.success(this.$t('common.Success'));
      return true;
    },
  },
};
</script>
