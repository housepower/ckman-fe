<template>
  <section class="user-modal">
    <el-form ref="form" :model="form" :rules="rules" label-width="120px" @submit.native.prevent>
      <el-form-item :label="$t('user.Username')" prop="username">
        <el-input v-model="form.username" autocomplete="off" />
      </el-form-item>
      <el-form-item prop="policy">
        <template slot="label">{{ $t('user.Role') }}<role-help /></template>
        <el-select v-model="form.policy" style="width: 100%">
          <el-option value="ordinary" :label="$t('user.Policy.ordinary')" />
          <el-option value="guest" :label="$t('user.Policy.guest')" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('user.Enabled')">
        <el-switch v-model="form.enabled" />
      </el-form-item>
      <el-form-item :label="$t('user.New Password')" prop="password">
        <el-input v-model="form.password" type="password" autocomplete="new-password" show-password />
      </el-form-item>
      <el-form-item :label="$t('user.Confirm Password')" prop="confirm">
        <el-input v-model="form.confirm" type="password" autocomplete="new-password" show-password />
      </el-form-item>
    </el-form>
  </section>
</template>

<script>
import { UserApi } from '@/apis';
import RoleHelp from '@/views/users/role-help.vue';

const USERNAME_RE = /^[A-Za-z][A-Za-z0-9_]{2,31}$/;
const RESERVED = new Set(['ckman', 'ordinary']);

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
  components: { RoleHelp },
  data() {
    return {
      form: { username: '', policy: 'ordinary', enabled: true, password: '', confirm: '' },
      rules: {
        username: [
          { required: true, message: this.$t('common.Required'), trigger: 'blur' },
          {
            validator: (_r, v, cb) => {
              if (!USERNAME_RE.test(v)) return cb(new Error(this.$t('user.Username Rule')));
              if (RESERVED.has(v)) return cb(new Error(this.$t('user.Reserved Username')));
              cb();
            },
            trigger: 'blur',
          },
        ],
        policy: [{ required: true, message: this.$t('common.Required'), trigger: 'change' }],
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
      await UserApi.create({
        username: this.form.username,
        password: this.form.password,
        policy: this.form.policy,
        enabled: this.form.enabled,
      });
      this.$message.success(this.$t('common.Success'));
      return true;
    },
  },
};
</script>
