<template>
  <div class="layout flex flex-column overflow-hidden">
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

    <main class="plr-20 pt-10 flex-1"
          style="overflow: auto;">
      <router-view />
    </main>
    <transition name="el-fade-in-linear"
                appear>
      <footer class="flex-center width-full"
              v-if="$route.params.id">
        <div class="flex-center list-content width-1000">
          <a href="javascript:void(0)" class="flex flex-1 flex-center height-full pointer"
            :class="{ 'router-active': currentMenu === item.name, 'list-item': item.name !== 'Settings' || mode === 'deploy' }"
            @click="handleMenuClick(item, $event)" v-for="item of menus" :key="item.name">
            <span class="fs-20">{{$t('home.' + item.name) }}</span>
          </a>
        </div>
      </footer>
    </transition>
  </div>
</template>
<script>
import { Menus, LoaderMenus } from "@/constants";
import { PackageApi, ClusterApi } from "@/apis";

export default {
  name: "Layout",
  data() {
    return {
      menus: Menus,
      user: "",
      version: "",
      mode: '',
      currentMenu: '',
    };
  },
  mounted() {
    this.user = JSON.parse(localStorage.getItem("user") || "{}").username;
    this.fetchVersion();
  },

  created() {
    this.onChangeCluster();
  },

  methods: {
    async onChangeCluster() {
      const { name } = this.$route;
      this.currentMenu = name;
      const clusterName = this.$route.params.id;
      if (!clusterName) return false;
      const { data: { entity } } = await ClusterApi.getCluster();
      const { mode } = entity[clusterName];

      this.mode = mode;
    },
    async handleMenuClick(item) {
      if (item.name === 'Settings') {

        if (this.mode === 'import') {
          this.$message.warning(this.$t("home.The imported cluster does not support editing"));
          return;
        }
      }
      if (this.$route.name != item.name) {
        this.$router.push({ path: item.path });
        this.currentMenu = item.name;
      }
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
    }
  },
  watch: {
    $route: {
      handler(route, prevRoute) {
        this.menus = route.meta === "loader" ? LoaderMenus : Menus;
        this.onChangeCluster();
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
  width: 100%;
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
  position: sticky;
  width: 100%;
  bottom: 0px;
  left: 0;
  z-index: 100;
  //transform: translateX(-50%);
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
