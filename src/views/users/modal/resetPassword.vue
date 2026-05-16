<template>
  <section class="user-modal">
    <p class="reset-target">{{ $t('user.Username') }}: <strong>{{ username }}</strong></p>
    <el-form ref="form" :model="form" :rules="rules" label-width="120px" @submit.native.prevent>
      <el-form-item :label="$t('user.New Password')" prop="password">
        <el-input v-model="form.password" type="password" show-password autocomplete="new-password" />
      </el-form-item>
      <el-form-item :label="$t('user.Confirm Password')" prop="confirm">
        <el-input v-model="form.confirm" type="password" show-password autocomplete="new-password" />
      </el-form-item>
    </el-form>
  </section>
</template>

<script>
import { UserApi } from '@/apis';

function passwordPolicy(pwd) {
  if (typeof pwd !== 'string' || pwd.length < 8) return false;
  let cats = 0;
  if (/[a-z]/.test(pwd)) cats++;
  if (/[A-Z]/.test(pwd)) cats++;
  if (/[0-9]/.test(pwd)) cats++;
  if (/[^A-Za-z0-9]/.test(pwd)) cats++;
  return cats >= 3;
}

export default {
  props: {
    username: { type: String, required: true },
  },
  data() {
    return {
      form: { password: '', confirm: '' },
      rules: {
        password: [
          { required: true, message: this.$t('common.Required'), trigger: 'blur' },
          {
            validator: (_r, v, cb) => passwordPolicy(v) ? cb() : cb(new Error(this.$t('user.Password Rule'))),
            trigger: 'blur',
          },
        ],
        confirm: [
          {
            validator: (_r, v, cb) => v === this.form.password ? cb() : cb(new Error(this.$t('user.Password Mismatch'))),
            trigger: 'blur',
          },
        ],
      },
    };
  },
  methods: {
    async onOk() {
      await this.$refs.form.validate();
      await UserApi.resetPassword(this.username, { new_password: this.form.password });
      this.$message.success(this.$t('common.Success'));
      return true;
    },
  },
};
</script>

<style scoped>
.reset-target { margin: 0 0 16px; }
</style>
