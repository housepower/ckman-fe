<template>
  <main class="query flex flex-column height-full pb-20">
    <breadcrumb :data="['Clusters', $route.params.id, 'data-manage']" />
    <div class="content-container flex">
      <div class="menu-container">
        <el-menu mode="vertical" class="data-manage-menu" text-color="#000" active-text-color="#C9A100"
          default-active="backup-data" :collapse="isCollapse" unique-opened>
          <el-submenu index="backup-restore">
            <template #title>
              <i class="el-icon-folder"></i>
              <span v-if="!isCollapse" class="bold-text">{{ $t('dataManage.backupRestore') }}</span>
            </template>

            <el-menu-item index="backup-data" @click="showComponent('backup')">
              <i class="el-icon-folder-add"></i>
              <span v-if="!isCollapse">{{ $t('dataManage.backupData') }}</span>
            </el-menu-item>
            <el-menu-item index="history-list" @click="showComponent('history')">
              <i class="el-icon-time"></i>
              <span v-if="!isCollapse">{{ $t('dataManage.backupHistory') }}</span>
            </el-menu-item>
          </el-submenu>

          <el-submenu index="data-balancing">
            <template #title>
              <i class="el-icon-sort"></i>
              <span v-if="!isCollapse" class="bold-text">{{ $t('dataManage.dataBalancing') }}</span>
            </template>
            <el-menu-item index="history-list" @click="showComponent('rebalance')">
              <i class="el-icon-connection"></i>
              <span v-if="!isCollapse">{{ $t('dataManage.dataBalancing') }}</span>
            </el-menu-item>
          </el-submenu>
          <el-submenu index="cluster-migration">
            <template #title>
              <i class="el-icon-guide"></i>
              <span v-if="!isCollapse" class="bold-text">{{ $t('dataManage.clusterMigration') }}</span>
            </template>
            <el-menu-item index="history-list" @click="showComponent('migration')">
              <i class="el-icon-more"></i>
              <span v-if="!isCollapse">{{ $t('dataManage.Coming Soon') }}</span>
            </el-menu-item>
          </el-submenu>
        </el-menu>

        <div class="collapse-button" @click="toggleCollapse">
          <i v-if="!isCollapse" class="el-icon-d-arrow-left"></i>
          <i v-else class="el-icon-d-arrow-right"></i>
        </div>
      </div>

      <div class="content-view">
        <component :is="currentComponent" v-if="currentComponent" />
        <div v-else class="empty-placeholder">
          <i class="el-icon-menu"></i>
          <p>{{ $t('dataManage.selectFunction') }}</p>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import ImportComponent from './component/import.vue';
import ExportComponent from './component/export.vue';
import BackupComponent from './component/backup.vue';
import HistoryComponent from './component/history.vue';
import RebalanceComponent from './component/rebalance.vue';
import MigrationComponent from './component/migration.vue';
export default {
  components: {
    ImportComponent,
    ExportComponent,
    BackupComponent,
    HistoryComponent,
    RebalanceComponent,
    MigrationComponent,
  },
  data() {
    return {
      activeMenu: 'backup-data', // 当前激活的菜单项
      currentComponent: null, // 当前显示的组件
      isCollapse: false, // 菜单是否折叠
    };
  },
  created() {
    this.showComponent('backup');
  },
  methods: {
    showComponent(componentName) {
      // 设置当前激活的菜单项
      this.activeMenu = `${componentName}-data`;

      // 根据传入的名称显示对应组件
      switch (componentName) {
        case 'import':
          this.currentComponent = 'ImportComponent';
          break;
        case 'export':
          this.currentComponent = 'ExportComponent';
          break;
        case 'backup':
          this.currentComponent = 'BackupComponent';
          break;
        case 'history':
          this.currentComponent = 'HistoryComponent';
          break;
        case 'rebalance':
          this.currentComponent = 'RebalanceComponent';
          break;
        case 'migration':
          this.currentComponent = 'MigrationComponent';
          break;
        default:
          this.currentComponent = null;
      }
    },
    toggleCollapse() {
      this.isCollapse = !this.isCollapse;
    }
  },
};
</script>

<style lang="scss" scoped>
.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 16px;

  i {
    font-size: 60px;
    margin-bottom: 20px;
  }
}

// 新增外层容器样式
.content-container {
  display: flex;
  height: calc(100vh - 150px);
  width: 100%;
  gap: 20px; // 菜单和内容之间的间距
}

// 新增内容区域样式
.content-view {
  flex: 1; // 占据剩余空间
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  background: #fff;
  overflow: auto; // 允许滚动
  transition: margin-left 0.3s;
}

.collapse-button {
  position: absolute;
  top: 50%;
  right: -12px;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 10;
  transition: all 0.3s ease;

  i {
    font-size: 12px;
    color: #C9A100;
    transition: all 0.3s ease;
  }

  .collapse-icon {
    transition: all 0.3s ease;
  }

  &:hover {
    background: #C9A100;
    border-color: #c0c4cc;
    
    i {
      color: #606266;
    }
    
    .collapse-icon {
      fill: #606266;
    }
  }
}

.menu-container {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  width: fit-content;
  height: calc(100vh - 150px);
  display: flex;
  overflow: hidden;
  position: relative; // 添加相对定位

  .data-manage-menu:not(.el-menu--collapse) {
    width: 200px;
    /* 增加宽度容纳二级菜单 */
    min-width: unset;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;

    /* 一级菜单激活样式 */
    .el-submenu.is-active>.el-submenu__title,
    .el-menu-item.is-active {
      // background-color: #C9A100 !important;
      color: #C9A100 !important;
      font-weight: bold;
    }

    /* 一级菜单项样式 */
    .el-submenu>.el-submenu__title,
    .el-menu-item {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      height: 50px;
      font-size: 14px;
      padding: 0 20px !important;
      transform: translateY(0);
      margin: 0;
      line-height: 1.5;
      vertical-align: middle;

      /* 图标样式 */
      i {
        margin-right: 10px;
        font-size: 16px;
      }

      /* 加粗字体 */
      .bold-text {
        font-weight: bold;
      }

      &:hover {
        background: transparent;
      }
    }

    /* 二级菜单样式 */
    .el-menu-item {
      padding-left: 50px !important;
      /* 二级菜单缩进 */
      height: 40px;
      /* 二级菜单高度稍小 */
      font-size: 13px;
      /* 二级菜单字体稍小 */

      i {
        font-size: 14px;
        /* 二级菜单图标稍小 */
      }
    }

    /* 菜单项间距 */
    .el-submenu+.el-menu-item,
    .el-menu-item+.el-menu-item,
    .el-submenu+.el-submenu {
      margin-top: 4px;
    }
  }
}
</style>