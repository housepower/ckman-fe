<template>
  <section class="add-node">
    <el-form ref="Form" :model="formModel">
      <el-form-item prop="password" required>
        <el-input v-model="formModel.password" :placeholder="$t('home.SSH Password')" show-password autocomplete="new-password" />
      </el-form-item>
    </el-form>
  </section>
</template>
<script>
export default {
  props: ["password"],
  data() {
    return {
      formModel: {
        password: ''
      }
    };
  },

  created() {
    this.formModel.password = this.password;
  },

  methods: {
    async onOk() {
      await this.$refs.Form.validate();
      return this.formModel.password;
    },
  },
};
</script>

<style></style>
