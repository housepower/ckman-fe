<template>
  <main class="login">
    <div class="login__lang">
      <el-select v-model="$i18n.locale" size="mini">
        <el-option value="en" label="English" />
        <el-option value="zh" label="中文" />
      </el-select>
    </div>
    <section class="container flex-center flex-column">
      <section>
        <h1 class="login__brand">
          <img class="login__brand-icon" src="/favicon.ico" alt="" />
          <span class="login__brand-text">{{ $t('login.Brand') }}</span>
        </h1>
        <el-form :model="info"
                 status-icon
                 :rules="rules"
                 ref="Form"
                 label-width="80px"
                 class="pt-15">
          <el-form-item :label="$t('login.User')"
                        prop="user">
            <el-input type="text"
                      v-model="info.user"
                      autocomplete="off"
                      class="width-300"></el-input>
          </el-form-item>
          <el-form-item :label="$t('login.Password')"
                        prop="pass">
            <el-input :type="isPasswordType ? 'password' : 'text'"
                      v-model="info.pass"
                      autocomplete="off"
                      class="width-300">
                      <i slot="suffix" class="fa" :class="{ 'fa-eye-slash': isPasswordType, 'fa-eye': !isPasswordType }" @click="isPasswordType = !isPasswordType"></i>
                      </el-input>
          </el-form-item>
          <el-button type="primary"
                     @click.prevent="login"
                     native-type="submit"
                     class="width-full">{{ $t('login.Login') }}</el-button>
        </el-form>
      </section>
      <p style="position: absolute; bottom: -50px">{{ $t('login.Copyright', { year: currentYear }) }}</p>
    </section>
  </main>
</template>

<script>
import { LoginApi } from "@/apis";
const md5 = require("blueimp-md5");
export default {
  data() {
    return {
      isPasswordType: true,
      currentYear: new Date().getFullYear(),
      info: {
        pass: "",
        user: "",
      },
      rules: {
        pass: [
          { required: true, message: this.$t('login.Password Required'), trigger: "blur" },
        ],
        user: [
          { required: true, message: this.$t('login.User Required'), trigger: "blur" },
        ],
      },
      redirect: "/home",
    };
  },
  mounted() {
    this.redirect = decodeURIComponent(this.$route.query.redirect || "/home");
  },
  methods: {
    async login() {
      await this.$refs.Form.validate();
      const {
        data: { entity },
      } = await LoginApi.login({
        password: md5(this.info.pass),
        username: this.info.user,
      });
      localStorage.setItem("user", JSON.stringify(entity));
      this.$root.userInfo = entity;
      this.$router.push({ path: this.redirect });
    },
  },
};
</script>

<style lang="scss" scoped>
.login {
  position: relative;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  height: 100vh;
  background: #f7f8fa;
  overflow: hidden;

  &__lang {
    position: absolute;
    top: 16px;
    right: 24px;
    z-index: 2;
    width: 100px;
  }

  &::before,
  &::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }

  &::before {
    width: 520px;
    height: 520px;
    top: -180px;
    left: -160px;
    background: radial-gradient(circle, rgba(201, 161, 0, 0.30) 0%, rgba(201, 161, 0, 0) 70%);
  }

  &::after {
    width: 620px;
    height: 620px;
    bottom: -220px;
    right: -200px;
    background: radial-gradient(circle, rgba(201, 161, 0, 0.20) 0%, rgba(201, 161, 0, 0) 72%);
  }

  .container {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 450px;
    transform: translate3d(-50%, -50%, 0);
    padding: 32px 24px 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 16px 40px -16px rgba(15, 23, 42, 0.18),
                0 4px 12px -4px rgba(15, 23, 42, 0.08);
  }

  &__brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 0 0 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
    font-size: 22px;
    font-weight: 600;
    line-height: 1.2;
    color: #1f2530;
    letter-spacing: 0.3px;
  }

  &__brand-icon {
    width: 32px;
    height: 30px;
    flex: 0 0 auto;
    display: block;
  }

  &__brand-text {
    white-space: nowrap;
  }
}
</style>
