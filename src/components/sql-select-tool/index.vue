<template>
<multipane class="vertical-panes sql-select-tool custom-resizer " layout="vertical" style="border: none;">
  <div class="pane" :style="{ minWidth: '100px', width: '280px', maxWidth: '400px' }">
    <el-tabs value="table" class="custom-tab db-tree-tabs">
        <el-tab-pane :label="$t('queryExecution.Database')" name="table">
          <dbTree></dbTree>
        </el-tab-pane>
      </el-tabs>
  </div>
  <multipane-resizer></multipane-resizer>
    <div class="pane" :style="{ flexGrow: 1, flex: 1 }">
      <multipane class="horizontal-panes custom-resizer" layout="horizontal">
        <div class="pane" :style="{ minWidth: '100%', width: '100%', maxWidth: '100%', height: '50%', minHeight: '20%', maxHeight: '90%' }">
          <el-tabs value="console" class="custom-tab custom-tab-flex">
            <el-tab-pane :label="$t('queryExecution.SQL Console')" name="console">
              <sql-editor @startRun="bottomActiveTab = 'result'"></sql-editor>
            </el-tab-pane>
          </el-tabs>
        </div>
        <multipane-resizer></multipane-resizer>
        <div class="pane" :style="{ flexGrow: 1, flex: 1, width: '100%' }">
          <el-tabs v-model="bottomActiveTab" @tab-click="handleClick" class="custom-tab-flex custom-tab-bottom">
            <el-tab-pane :label="$t('queryExecution.Query History')" name="history">
              <run-history></run-history>
            </el-tab-pane>
            <el-tab-pane :label="$t('queryExecution.Result')" name="result">
              <sql-result></sql-result>
            </el-tab-pane>
          </el-tabs>
        </div>
      </multipane>
    </div>
</multipane>
</template>
<script>
import { Multipane, MultipaneResizer } from 'vue-multipane';
import { dbTree, sqlEditor, sqlResult, runHistory } from './components/';
import store from '@/store';
export default {
  name: 'sqlSelectTool',
  components: {
    Multipane,
    MultipaneResizer,
    dbTree,
    sqlEditor,
    sqlResult,
    runHistory,
  },
  data() {
    return {
      leftActiveTab: 'table',
      bottomActiveTab: 'result',
    };
  },
  mounted() {
    window.addEventListener('beforeunload', this.persistHistory);
    try {
      const history = JSON.parse(localStorage.getItem('__ckman__sql_history__'));
      if (history) {
        store.commit('sqlSelect/setHistory', history);
      }
    } catch(e) {
      
    }
  },
  beforeDestroy() {
    this.persistHistory();
    store.commit('sqlSelect/clear');
  },
  methods: {
    handleClick() {
      //
    },
    persistHistory() {
      localStorage.setItem('__ckman__sql_history__', JSON.stringify(store.state.sqlSelect.history));
    }
  }
}
</script>
<style lang="scss">
.db-tree-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;

  .el-tabs__content {
    margin-bottom: 5px;
    flex: 1;
    .el-tab-pane {
      height: 100%;
    }
  }
}

.custom-tab {
  .el-tabs__item {
    padding: 0 10px !important;
  }
  .el-tabs__active-bar {
    transform: none !important;
  }
  .el-tabs__header {
    margin-bottom: 10px;
  }

  &-flex {
    height: 100%;
    display: flex;
    flex-direction: column;
    .el-tabs__content {
      flex: 1;
    }
    .el-tab-pane {
      height: 100%;
    }
  }

  &-bottom {
    // height: 100%;
    // display: flex;
    // flex-direction: column;
    .el-tabs__item {
      padding: 0 10px !important;
    }
    // .el-tabs__content {
    //   flex: 1;
    // }

    .el-tab-pane {
      height: 100%;
    }
    .el-tabs__header {
      margin-bottom: 0;
    }
  }
}

.sql-select-tool {
  border: 1px solid #e8eaec;
}
</style>

<style lang="scss">
.vertical-panes {
  width: 100%;
  // height: 400px;
  // border: 1px solid #EBEEF5;
}

.vertical-panes > .pane {
  // text-align: left;
  // overflow: hidden;
  // background: #eee;
  border: 1px solid #EBEEF5;
}

.vertical-panes > .pane ~ .pane {
  border-left: 1px solid #EBEEF5;
}

.horizontal-panes {
  width: 100%;
  height: 100%;
  // border: 1px solid #ccc;
}

.horizontal-panes > .pane {
  text-align: left;
  overflow: hidden;
  // background: #eee;
}

.horizontal-panes > .pane ~ .pane {
  border-top: 1px solid #EBEEF5;
}

.custom-resizer {
  width: 100%;
  height: 100%;
}

.custom-resizer > .pane {
  text-align: left;
  // padding: 15px;
  overflow: hidden;
  // background: #eee;
  // border: 1px solid #EBEEF5;
}

.custom-resizer > .pane ~ .pane {
}

.custom-resizer {
  &.vertical-panes > .multipane-resizer {
    margin: 0;
    left: 0;
    position: relative;
    &:before {
      display: block;
      content: "";
      width: 1px;
      height: 40px;
      position: absolute;
      top: 50%;
      left: 50%;
      margin-top: -20px;
      margin-left: -2px;
      border-left: 1px solid #ccc;
      border-right: 1px solid #ccc;
    }
    &:hover {
      &:before {
        border-color: #999;
      }
    }
  }
  &.horizontal-panes > .multipane-resizer {
    margin: 0;
    left: 0;
    position: relative;
    &:before {
      display: block;
      content: "";
      width: 40px;
      height: 1px;
      position: absolute;
      top: 50%;
      left: 50%;
      margin-top: -6px;
      margin-left: -20px;
      border-top: 1px solid #ccc;
      border-bottom: 1px solid #ccc;
    }
    &:hover {
      &:before {
        border-color: #999;
      }
    }
  }
}
</style>
