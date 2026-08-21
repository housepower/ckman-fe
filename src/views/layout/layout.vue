<template>
  <div
    class="layout"
    :class="{ 'layout--collapsed': collapsed, 'layout--no-sidebar': !inCluster }"
  >
    <header class="flex flex-vcenter">
      <router-link to="/" class="brand">
        <img class="brand__icon" src="/favicon.ico" alt="" />
        <span class="brand__text">
          {{ title }}
          <span class="brand__version">{{ version }}</span>
        </span>
      </router-link>

      <div class="header-right flex flex-vcenter">
        <router-link to="/task" class="header-link">
          <i class="fa fa-tasks"></i>
          <span>{{ $t('task.Task List') }}</span>
        </router-link>

        <a href="/docs/" target="_blank" class="header-link">
          <i class="fa fa-book" aria-hidden="true"></i>
          <span>{{ $t('layout.Document') }}</span>
        </a>

        <router-link to="/setting" class="header-link">
          <i class="fa fa-briefcase"></i>
          <span>{{ $t('common.package') }}</span>
        </router-link>

        <router-link v-if="isAdmin" to="/users" class="header-link">
          <i class="fa fa-users"></i>
          <span>{{ $t('common.users') }}</span>
        </router-link>

        <el-select v-model="$i18n.locale" class="width-100" size="mini">
          <el-option value="en" label="English" />
          <el-option value="zh" label="中文" />
        </el-select>

        <el-dropdown class="pointer">
          <div class="flex flex-vcenter">
            <i class="fa fa-user-o"></i>
            <span v-text="user" class="ml-5 user" />
          </div>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item @click.native="openChangePassword">{{ $t('user.Change Password') }}</el-dropdown-item>
            <el-dropdown-item @click.native="logout">{{ $t('common.Logout') }}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </header>

    <div class="layout__body">
      <!-- 侧边栏承载集群内导航，集群外（集群列表、任务、安装包、用户）不出现 -->
      <aside class="sidebar" v-if="inCluster">
        <nav class="side-nav">
          <router-link
            to="/home"
            class="side-item"
            active-class="side-item--active"
            v-tooltip="tip($t('home.All ClickHouse Clusters'))"
          >
            <i class="fa fa-home side-item__icon"></i>
            <span class="side-item__text">{{ $t('home.All ClickHouse Clusters') }}</span>
          </router-link>

          <p class="side-group" v-if="!collapsed">{{ $route.params.id }}</p>
          <div class="side-divider" v-else></div>
          <template v-for="item of clusterMenus">
            <a
              :key="item.name"
              href="javascript:void(0)"
              class="side-item"
              :class="{ 'side-item--active': currentMenu === item.path }"
              v-tooltip="tip($t('home.' + item.name))"
              @click="handleMenuClick(item, $event)"
            >
              <i class="fa side-item__icon" :class="item.icon"></i>
              <span class="side-item__text">{{ $t('home.' + item.name) }}</span>
            </a>
            <div
              v-if="!collapsed && item.children && currentMenu === item.path"
              :key="item.name + '-tabs'"
              class="side-sub"
            >
              <a
                v-for="tab of item.children"
                :key="tab.key"
                href="javascript:void(0)"
                class="side-subitem"
                :class="{ 'side-subitem--active': currentTab(item) === tab.key }"
                @click="goTab(tab.key)"
              >
                {{ $t(tab.label) }}
              </a>
            </div>
          </template>
        </nav>

        <button
          type="button"
          class="side-toggle"
          v-tooltip="tip(collapsedLabel)"
          @click="toggleCollapse"
        >
          <i class="fa side-item__icon" :class="collapsed ? 'fa-angle-double-right' : 'fa-angle-double-left'"></i>
          <span class="side-item__text">{{ collapsedLabel }}</span>
        </button>
      </aside>

      <main class="flex-1" style="overflow: auto;">
        <router-view />
      </main>
    </div>
  </div>
</template>
<script>
import { Menus, LoaderMenus } from "@/constants";
import { PackageApi, ClusterApi, UserApi } from "@/apis";
import { ConfigApi } from "@/apis/config";
import { $modal } from "@/services";
import ElementLocale from 'element-ui/lib/locale';
import enLocale from 'element-ui/lib/locale/lang/en';
import zhLocale from 'element-ui/lib/locale/lang/zh-CN';

const COLLAPSE_KEY = 'ckman-sidebar-collapsed';

export default {
  name: "Layout",
  data() {
    return {
      menus: Menus,
      user: "",
      version: "",
      mode: '',
      currentMenu: '',
      loadedCluster: '',
      timerId: null,
      taskNum: null,
      isAdmin: false,
      collapsed: localStorage.getItem(COLLAPSE_KEY) === '1',
    };
  },
  async mounted() {
    await this.refreshMe();
    this.fetchVersion();
  },
  methods: {
    async onChangeCluster() {
      const { path } = this.$route;
      const currentMenu = path.split('/').pop();
      const clusterName = this.$route.params.id;
      if (!clusterName) return false;
      this.currentMenu = currentMenu;
      // 仅在切换到不同集群时刷新 mode；按 tab 名早退会导致跨集群同名 tab 时 mode 不更新。
      if (this.loadedCluster === clusterName) return false;
      this.loadedCluster = clusterName;
      const { data: { entity } } = await ClusterApi.getCluster();
      const { mode } = entity[clusterName] || {};

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

    toggleCollapse() {
      this.collapsed = !this.collapsed;
    },

    // 二级菜单当前项：URL 上没写就是第一项，与页面的回落规则一致。
    currentTab(item) {
      const tab = this.$route.query.tab;
      return item.children.some(x => x.key === tab) ? tab : item.children[0].key;
    },

    goTab(key) {
      if (this.$route.query.tab === key) return;
      this.$router.push({ query: { ...this.$route.query, tab: key } });
    },

    // 折叠态才给出 tooltip：展开时文字已经可见，content 为 null 时组件自身隐藏。
    tip(content) {
      return this.collapsed ? { content, placement: 'right' } : { content: null };
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

    async refreshMe() {
      try {
        const { data: { entity } } = await UserApi.me();
        if (!entity || !entity.enabled) {
          this.$router.push('/login');
          return;
        }
        this.user = entity.username;
        this.isAdmin = entity.policy === 'admin';
        this.$root.userInfo = entity;
        // Merge into existing localStorage record so the JWT token persists
        // (the /user/me response does not carry a token).
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, ...entity }));
      } catch (_e) {
        this.$router.push('/login');
      }
    },
    openChangePassword() {
      $modal({
        component: () => import('@/views/users/modal/changePassword.vue'),
        props: {
          title: this.$t('user.Change Password'),
          width: 440,
        },
      }).catch(() => { /* dialog cancelled */ });
    },
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
    collapsed(value) {
      localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0');
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
    // 侧边栏只服务集群内的导航，集群外的页面（集群列表、任务、安装包、用户）不渲染它
    inCluster() {
      return !!this.$route.params.id;
    },
    collapsedLabel() {
      return this.collapsed ? this.$t('layout.Expand Sidebar') : this.$t('layout.Collapse Sidebar');
    },
    // 导入的集群不支持编辑配置，直接从菜单里去掉而不是渲染成不可点的项。
    clusterMenus() {
      return this.menus.filter(x => !(x.name === 'Settings' && this.mode === 'import'));
    },
  },
};
</script>

<style lang="scss" scoped>
.layout {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // 没有侧边栏时，贴合框架定位的组件（查询结果全屏面板）应从最左侧算起
  &--no-sidebar {
    --layout-sidebar-w: 0px;
  }

  &__body {
    flex: 1;
    min-height: 0;
    display: flex;
    overflow: hidden;
  }
}

// ── 侧边栏 ───────────────────────────────────────
.sidebar {
  flex: 0 0 auto;
  width: var(--layout-sidebar-w);
  display: flex;
  flex-direction: column;
  background: var(--c-gray-700);
  color: var(--c-surface-0);
  overflow: hidden;
  transition: width var(--du-base) var(--ease-out);
}

.brand {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  margin-right: var(--s-6);
  color: var(--c-surface-0);
  text-decoration: none;
  font-size: var(--fs-md);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.3px;
  white-space: nowrap;

  &__icon {
    width: 22px;
    height: 21px;
    display: block;
    flex: 0 0 auto;
  }

  &__text {
    margin-left: var(--s-3);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__version {
    font-weight: var(--fw-regular);
    opacity: 0.5;
    margin-left: var(--s-1);
    font-size: var(--fs-sm);
  }
}

.side-nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--s-3) 0;
}

.side-group {
  margin: var(--s-3) 0 var(--s-1);
  padding: 0 var(--s-4);
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.side-divider {
  height: 1px;
  margin: var(--s-3) var(--s-4);
  background: rgba(255, 255, 255, 0.1);
}

.side-item {
  display: flex;
  align-items: center;
  height: 38px;
  padding: 0 var(--s-4);
  color: rgba(255, 255, 255, 0.72);
  font-size: var(--fs-md);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background var(--du-fast) var(--ease-out),
              color var(--du-fast) var(--ease-out);

  &__icon {
    width: 18px;
    flex: 0 0 auto;
    text-align: center;
    font-size: var(--fs-lg);
  }

  &__text {
    margin-left: var(--s-3);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &:hover {
    color: var(--c-surface-0);
    background: rgba(255, 255, 255, 0.08);
  }

  &--active {
    color: var(--c-surface-0);
    font-weight: var(--fw-semibold);
    background: rgba(255, 255, 255, 0.1);
    border-left-color: var(--c-primary-solid);

    .side-item__icon {
      color: var(--c-primary-solid);
    }
  }
}

// 二级菜单：只在所属一级项选中时展开，折叠态不渲染
.side-sub {
  padding: var(--s-1) 0;
  background: rgba(0, 0, 0, 0.18);
}

.side-subitem {
  display: block;
  padding: var(--s-2) var(--s-4) var(--s-2) var(--s-10);
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--fs-sm);
  line-height: var(--lh-tight);
  text-decoration: none;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background var(--du-fast) var(--ease-out),
              color var(--du-fast) var(--ease-out);

  &:hover {
    color: var(--c-surface-0);
    background: rgba(255, 255, 255, 0.06);
  }

  &--active {
    color: var(--c-surface-0);
    font-weight: var(--fw-medium);
    border-left-color: var(--c-primary-solid);
    background: rgba(255, 255, 255, 0.06);
  }
}

.side-toggle {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  width: 100%;
  height: 38px;
  padding: 0 var(--s-4);
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 3px solid transparent;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--fs-md);
  font-family: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--du-fast) var(--ease-out),
              color var(--du-fast) var(--ease-out);

  &:hover {
    color: var(--c-surface-0);
    background: rgba(255, 255, 255, 0.08);
  }
}

// 折叠态：只留图标，文字与分组标题不再占位。
// 同时把 --layout-sidebar-w 覆写在 .layout 上，后代组件（查询结果全屏面板）
// 直接继承到折叠后的宽度，无需感知折叠状态。
.layout--collapsed {
  --layout-sidebar-w: var(--layout-sidebar-w-collapsed);

  .side-item__text,
  .side-toggle .side-item__text {
    display: none;
  }

  .side-item,
  .side-toggle {
    padding: 0;
    justify-content: center;
    border-left-width: 0;
    border-right: 3px solid transparent;
  }

  .side-item--active {
    border-right-color: var(--c-primary-solid);
  }

  .side-divider {
    margin: var(--s-3) var(--s-2);
  }
}

// ── 顶栏 ─────────────────────────────────────────
header {
  flex: 0 0 auto;
  justify-content: space-between;
  height: var(--layout-header-h);
  padding: 0 var(--s-5);
  background: var(--c-gray-700);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: var(--fs-md);
}

.header-right {
  .user,
  i {
    color: rgba(255, 255, 255, 0.72);
  }

  > * {
    margin-left: var(--s-3);
    padding: var(--s-1) var(--s-2);
    border-radius: var(--r-sm);
    transition: background var(--du-fast) var(--ease-out);
  }

  > .el-dropdown:hover,
  > .header-link:hover {
    background: rgba(255, 255, 255, 0.08);

    .user,
    i {
      color: var(--c-surface-0);
    }
  }

  i {
    font-size: var(--fs-lg);
  }

  .ml-5 { margin-left: var(--s-1) !important; }
}

.header-link {
  display: inline-flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  white-space: nowrap;

  i {
    margin-right: var(--s-1);
  }

  &:hover,
  &.router-link-active {
    color: var(--c-surface-0);

    i {
      color: var(--c-surface-0);
    }
  }

  &.router-link-active {
    font-weight: var(--fw-semibold);
  }
}

main {
  min-width: 0; // 内容过宽时收缩自己而不是撑破布局
  background: var(--c-surface-1);
  padding: 0 var(--s-5);
}
</style>
