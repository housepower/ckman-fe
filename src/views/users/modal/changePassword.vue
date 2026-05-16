<template>
  <section class="user-modal">
    <el-form ref="form" :model="form" :rules="rules" label-width="120px" @submit.native.prevent>
      <el-form-item :label="$t('user.Old Password')" prop="oldp">
        <el-input v-model="form.oldp" type="password" show-password autocomplete="current-password" />
      </el-form-item>
      <el-form-item :label="$t('user.New Password')" prop="newp">
        <el-input v-model="form.newp" type="password" show-password autocomplete="new-password" />
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
  data() {
    return {
      form: { oldp: '', newp: '', confirm: '' },
      rules: {
        oldp: [{ required: true, message: this.$t('common.Required'), trigger: 'blur' }],
        newp: [
          { required: true, message: this.$t('common.Required'), trigger: 'blur' },
          {
            validator: (_r, v, cb) => passwordPolicy(v) ? cb() : cb(new Error(this.$t('user.Password Rule'))),
            trigger: 'blur',
          },
        ],
        confirm: [
          {
            validator: (_r, v, cb) => v === this.form.newp ? cb() : cb(new Error(this.$t('user.Password Mismatch'))),
            trigger: 'blur',
          },
        ],
      },
    };
  },
  methods: {
    async onOk() {
      await this.$refs.form.validate();
      await UserApi.changeMyPassword({
        old_password: this.form.oldp,
        new_password: this.form.newp,
      });
      this.$message.success(this.$t('common.Success'));
      return true;
    },
  },
};
</script>
