<template>
  <div class="layout">
    <header class="flex-between flex-vcenter plr-20">
      <router-link to="/" class="fs-18 font-bold">{{title}}  {{version}}</router-link>
      <div class="header-right">
        <el-select v-model="$i18n.locale" class="mr-10 width-100" size="mini">
          <el-option value="en" label="English" />
          <el-option value="zh" label="中文" />
        </el-select>
        <el-dropdown class="pointer">
          <div>
            <i class="fa fa-user-o fs-20"></i>
            <span v-text="user"
                  class="fs-16 ml-5 user" />
          </div>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item @click.native="logout">{{$t("common.Logout")}}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <router-link to="/setting" class="fa fa-cog fs-20 pointer ml-10" />
      </div>
    </header>

    <main class="plr-20 pt-10"
          style="padding-bottom: 85px">
      <router-view />
    </main>
    <transition name="el-fade-in-linear"
                appear>
      <footer class="flex-center width-full"
              v-show="$route.params.id">
        <div class="flex-center list-content width-1000">
          <router-link class="flex flex-1 flex-center height-full pointer list-item"
                       :to="{ path: item.path }"
                       exact-active-class="router-active"
                       v-for="item of menus"
                       :key="item.name">
            <span class="fs-20">{{$t('home.' + item.name) }}</span>
          </router-link>
        </div>
      </footer>
    </transition>
  </div>
</template>
<script>
import { Menus, LoaderMenus } from "@/constants";
import { PackageApi } from "@/apis";

export default {
  name: "Layout",
  data() {
    return {
      menus: Menus,
      user: "",
      version: "",
    };
  },
  mounted() {
    this.user = JSON.parse(localStorage.getItem("user") || "{}").username;
    this.fetchVersion();
  },
  methods: {
    handleMenuClick(e) {
      console.log(e);
    },
    logout() {
      localStorage.removeItem("user");
      this.$message.success("成功登出");
      this.$router.push('/login');
    },
    async fetchVersion() {
      const {
        data: { entity },
      } = await PackageApi.getVersion();
      this.version = entity;
    },
  },
  watch: {
    $route: {
      handler(route, prevRoute) {
        this.menus = route.meta === "loader" ? LoaderMenus : Menus;
      },
      immediate: true,
    },
    '$i18n.locale'(value) {
      localStorage.setItem('locale', value);
      document.title = this.title;
      document.documentElement.lang = value;
    },
  },
  computed: {
    title() {
      return this.$t('layout.ClickHouse Management Console');
    },
    version() {
      return this.version
    }
  },
};
</script>

<style lang="scss" scoped>
.layout {
  position: relative;
  height: 100%;
}
header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 50px;
  color: var(--color-white);
  background: var(--primary-color);

  .user,
  i {
    color: var(--color-white);
  }
}
footer {
  position: fixed;
  bottom: 0px;
  left: 50%;
  z-index: 100;
  transform: translateX(-50%);
  margin: 0 auto;
  background-color: #eaeef4;
  .list-content {
    height: 65px;

    .list-item {
      &:hover,
      &.router-active {
        background: var(--primary-color);
        transition: ease 0.5s;

        span {
          color: var(--color-white);
        }
      }
    }
  }
}
</style>
