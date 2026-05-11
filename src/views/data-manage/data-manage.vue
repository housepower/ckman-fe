<template>
  <main class="query flex flex-column height-full pb-20">
    <breadcrumb :data="['Clusters', $route.params.id, 'data-manage']" />
    <div class="content-container flex">
      <div class="menu-container">
        <el-menu mode="vertical" class="data-manage-menu" text-color="#000" active-text-color="#C9A100"
          default-active="backup-management" :collapse="isCollapse">
          <el-menu-item index="backup-management" @click="showComponent('history')">
            <i class="el-icon-folder"></i>
            <span v-if="!isCollapse" class="bold-text">{{ $t('dataManage.backupManagement') }}</span>
          </el-menu-item>
          <el-menu-item index="data-balancing" @click="showComponent('rebalance')">
            <i class="el-icon-sort"></i>
            <span v-if="!isCollapse" class="bold-text">{{ $t('dataManage.dataBalancing') }}</span>
          </el-menu-item>
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
import HistoryComponent from './component/history.vue';
import RebalanceComponent from './component/rebalance.vue';
export default {
  components: {
    ImportComponent,
    ExportComponent,
    HistoryComponent,
    RebalanceComponent,
  },
  data() {
    return {
      activeMenu: 'backup-management',
      currentComponent: null,
      isCollapse: false,
    };
  },
  created() {
    this.showComponent('history');
  },
  methods: {
    showComponent(componentName) {
      this.activeMenu = `${componentName}-data`;
      switch (componentName) {
        case 'import':
          this.currentComponent = 'ImportComponent';
          break;
        case 'export':
          this.currentComponent = 'ExportComponent';
          break;
        case 'history':
          this.currentComponent = 'HistoryComponent';
          break;
        case 'rebalance':
          this.currentComponent = 'RebalanceComponent';
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

.content-container {
  display: flex;
  height: calc(100vh - 150px);
  width: 100%;
  gap: 20px;
}

.content-view {
  flex: 1;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  background: #fff;
  overflow: auto;
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

  &:hover {
    background: #C9A100;
    border-color: #c0c4cc;

    i {
      color: #606266;
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
  position: relative;

  .data-manage-menu:not(.el-menu--collapse) {
    width: 200px;
    min-width: unset;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;

    .el-menu-item.is-active {
      color: #C9A100 !important;
      font-weight: bold;
    }

    .el-menu-item {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      height: 50px;
      font-size: 14px;
      padding: 0 20px !important;
      margin: 0;
      line-height: 1.5;
      vertical-align: middle;

      i {
        margin-right: 10px;
        font-size: 16px;
      }

      .bold-text {
        font-weight: bold;
      }

      &:hover {
        background: transparent;
      }
    }

    .el-menu-item + .el-menu-item {
      margin-top: 4px;
    }
  }
}
</style>
