<template>
  <div class="layout flex flex-column overflow-hidden">
    <header class="flex-between flex-vcenter plr-20">
      <div class="header-left flex flex-vcenter">
        <router-link
          to="/"
          class="home-icon"
          :class="{ 'home-icon--active': isClustersActive }"
          v-tooltip="$t('home.All ClickHouse Clusters')"
        >
          <i class="fa fa-database"></i>
        </router-link>
        <router-link to="/" class="brand-link">
          <span class="brand-text">{{title}} <span class="brand-version">{{version}}</span></span>
        </router-link>
      </div>
      <div class="header-right flex flex-vcenter">

        <div class="flex flex-vcenter mr-15 pointer" @click="viewTaskList">
          <i class="el-icon-bell fs-20 mr-5"></i>
          <span class="fs-16">{{$t('layout.Message Center')}}</span>
          <el-badge is-dot></el-badge>
        </div>

        <a href="/docs/ckman" target="_blank" class="flex flex-vcenter mr-15 pointer">
          <i class="fa fa-book fs-20 mr-5" aria-hidden="true"></i>
          <span class="fs-16">{{$t('layout.Document')}}</span>
        </a>

        <router-link to="/swagger/index.html" target="_blank" class="fa fa-file-text-o fs-20 mr-15"><span class="fs-16 ml-5">{{$t('layout.API')}}</span></router-link>

        <el-dropdown class="pointer">
          <div class="flex flex-vcenter">
            <i class="fa fa-user-o fs-20"></i>
            <span v-text="user"
                  class="fs-16 ml-5 user" />
          </div>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item @click.native="logout">{{$t("common.Logout")}}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
  
        <router-link to="/setting" class="fa fa-briefcase fs-20 pointer ml-15"><span class="fs-16 ml-5">{{$t('common.package')}}</span></router-link>

        <el-select v-model="$i18n.locale" class="ml-10 width-100" size="mini">
          <el-option value="en" label="English" />
          <el-option value="zh" label="中文" />
        </el-select>
      </div>
    </header>

    <nav class="cluster-tabs" v-if="$route.params.id">
      <div class="cluster-tabs__inner">
        <a
          v-for="item of menus"
          :key="item.name"
          href="javascript:void(0)"
          class="ctab"
          :class="{ 'ctab--active': currentMenu === item.path, 'ctab--hidden': item.name === 'Settings' && mode !== 'deploy' }"
          @click="handleMenuClick(item, $event)"
        >
          {{ $t('home.' + item.name) }}
        </a>
      </div>
    </nav>

    <main class="flex-1" style="overflow: auto;">
      <router-view />
    </main>
  </div>
</template>
<script>
import { Menus, LoaderMenus } from "@/constants";
import { PackageApi, ClusterApi } from "@/apis";
import { ConfigApi } from "@/apis/config";
import ElementLocale from 'element-ui/lib/locale';
import enLocale from 'element-ui/lib/locale/lang/en';
import zhLocale from 'element-ui/lib/locale/lang/zh-CN';

export default {
  name: "Layout",
  data() {
    return {
      menus: Menus,
      user: "",
      version: "",
      mode: '',
      currentMenu: '',
      timerId: null,
      taskNum: null
    };
  },
  mounted() {
    this.user = JSON.parse(localStorage.getItem("user") || "{}").username;
    this.fetchVersion();
  },
  methods: {
    async onChangeCluster() {
      const { path } = this.$route;
      const currentMenu = path.split('/').pop();
      const clusterName = this.$route.params.id;
      if (!clusterName || this.currentMenu === currentMenu) return false;
      this.currentMenu = currentMenu;
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
        this.currentMenu = item.path.split('/').lastItem;
      }
    },

    logout() {
      localStorage.removeItem("user");
      this.$message.success(this.$t('layout.Logout Success'));
      this.$router.push('/login');
    },

    async fetchVersion() {
      const {
        data: { entity },
      } = await ConfigApi.getVersion();
      this.version = entity;
    },

    viewTaskList() {
      this.$router.push({
        name: 'TaskList'
      });
    }
  },
  created() {
    this.onChangeCluster();
  },
  watch: {
    $route: {
      handler(route) {
        this.menus = route.meta === "loader" ? LoaderMenus : Menus;
        this.onChangeCluster();
      },
      immediate: true,
    },
    '$i18n.locale'(value) {
      localStorage.setItem('locale', value);
      document.title = this.title;
      document.documentElement.lang = value;
      // 同步更新 Element UI locale
      ElementLocale.use(value === 'zh' ? zhLocale : enLocale);
    },
  },
  computed: {
    title() {
      return this.$t('layout.ClickHouse Management Console');
    },
    isClustersActive() {
      return this.$route.path === '/' || this.$route.path.startsWith('/clusters');
    },
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
  height: 52px;
  color: var(--c-surface-0);
  background: var(--c-gray-700);
  border-bottom: 2px solid var(--c-primary-solid);
  font-size: var(--fs-md);

  .user,
  i {
    color: var(--c-surface-0);
  }

  a, .router-link-active {
    color: var(--c-surface-0);
    text-decoration: none;
  }

  .brand-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--c-primary-solid);
    margin-right: var(--s-2);
    vertical-align: 1px;
  }
}
.brand-link {
  display: inline-flex;
  align-items: center;
  font-size: var(--fs-lg);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.3px;
}

.brand-version {
  font-weight: var(--fw-regular);
  opacity: 0.5;
  margin-left: var(--s-1);
  font-size: var(--fs-sm);
}

.header-left {
  gap: var(--s-3);
}

.home-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-md);
  color: var(--c-surface-0);
  background: rgba(255, 255, 255, 0.06);
  transition: background var(--du-fast) var(--ease-out),
              color var(--du-fast) var(--ease-out);

  i {
    font-size: var(--fs-lg);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.14);
  }

  &--active {
    background: var(--c-primary-solid);
    color: var(--c-gray-700);

    &:hover {
      background: var(--c-primary-solid);
    }
  }
}

.header-right {
  font-size: var(--fs-md);

  > * {
    margin-left: var(--s-4);
    padding: var(--s-1) var(--s-2);
    border-radius: var(--r-sm);
    transition: background var(--du-fast) var(--ease-out);

    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }

  i {
    font-size: var(--fs-xl);
    margin-right: var(--s-2);
  }

  .fs-16, .fs-20 {
    font-size: inherit !important;
  }

  .mr-15 { margin-right: 0 !important; }
  .mr-5 { margin-right: var(--s-1) !important; }
  .ml-5 { margin-left: var(--s-1) !important; }
  .ml-10 { margin-left: var(--s-2) !important; }
  .ml-15 { margin-left: var(--s-3) !important; }
}

main {
  background: var(--c-surface-1);
  padding: 0 var(--s-5);
  padding-top: var(--s-3);
}

.cluster-tabs {
  position: sticky;
  top: 52px;
  z-index: 99;
  background: var(--c-surface-0);
  border-bottom: 1px solid var(--c-surface-3);
  height: 40px;

  &__inner {
    display: flex;
    gap: var(--s-4);
    padding: 0 var(--s-5);
    height: 100%;
    align-items: stretch;
  }

  .ctab {
    display: inline-flex;
    align-items: center;
    padding: 0 var(--s-1);
    font-size: var(--fs-sm);
    color: var(--c-text-secondary);
    text-decoration: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color var(--du-fast) var(--ease-out),
                border-color var(--du-fast) var(--ease-out);

    &:hover {
      color: var(--c-text-primary);
    }

    &--active {
      color: var(--c-text-primary);
      font-weight: var(--fw-semibold);
      border-bottom-color: var(--c-primary-solid);
    }

    &--hidden {
      display: none;
    }
  }
}
</style>
