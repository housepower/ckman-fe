<template>
  <multipane class="sql-tool" layout="vertical">
    <div class="sql-tool__aside">
      <div class="sql-tool__pane-head">{{ $t('queryExecution.Database') }}</div>
      <dbTree class="sql-tool__pane-body" />
    </div>
    <multipane-resizer class="sql-tool__resizer sql-tool__resizer--v"></multipane-resizer>
    <div class="sql-tool__work">
      <multipane class="sql-tool__work-panes" layout="horizontal">
        <div class="sql-tool__editor">
          <div class="sql-tool__pane-head">{{ $t('queryExecution.SQL Console') }}</div>
          <sql-editor
            ref="sqlEditor"
            class="sql-tool__pane-body"
            @startRun="bottomActiveTab = 'result'"
          />
        </div>
        <multipane-resizer class="sql-tool__resizer sql-tool__resizer--h"></multipane-resizer>
        <div class="sql-tool__bottom">
          <div class="sql-tool__tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="sql-tool__tab"
              :class="{ 'sql-tool__tab--active': bottomActiveTab === tab.key }"
              @click="bottomActiveTab = tab.key"
            >
              {{ $t(tab.label) }}
            </button>
          </div>
          <div class="sql-tool__bottom-body">
            <run-history v-show="bottomActiveTab === 'history'" @addSql="onAddSql" />
            <sql-result v-show="bottomActiveTab === 'result'" />
          </div>
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
  components: { Multipane, MultipaneResizer, dbTree, sqlEditor, sqlResult, runHistory },
  data() {
    return {
      bottomActiveTab: 'result',
      tabs: [
        { key: 'history', label: 'queryExecution.Query History' },
        { key: 'result',  label: 'queryExecution.Result' },
      ],
    };
  },
  beforeDestroy() {
    store.commit('sqlSelect/clear');
  },
  methods: {
    onAddSql(str) {
      this.$refs.sqlEditor.addSql(str);
    },
  },
};
</script>

<style lang="scss" scoped>
.sql-tool {
  flex: 1;
  min-height: 0;
  display: flex;
  width: 100%;
  background: var(--c-surface-0);
  border: 1px solid var(--c-surface-3);
  border-radius: var(--r-md);
  overflow: hidden;

  &__aside {
    display: flex;
    flex-direction: column;
    min-width: 200px;
    width: 280px;
    max-width: 400px;
  }

  &__work {
    flex: 1;
    min-width: 0;
    display: flex;
  }

  &__work-panes {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  &__editor {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 50%;
    min-height: 20%;
    max-height: 90%;
  }

  &__bottom {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  &__pane-head {
    flex: 0 0 auto;
    padding: var(--s-2) var(--s-3);
    font-size: var(--fs-xs);
    font-weight: var(--fw-semibold);
    color: var(--c-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    background: var(--c-surface-1);
    border-bottom: 1px solid var(--c-surface-3);
  }

  &__pane-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  &__tabs {
    flex: 0 0 auto;
    display: flex;
    gap: var(--s-4);
    padding: 0 var(--s-3);
    background: var(--c-surface-1);
    border-bottom: 1px solid var(--c-surface-3);
  }

  &__tab {
    appearance: none;
    background: none;
    border: 0;
    cursor: pointer;
    padding: var(--s-2) var(--s-1);
    font-size: var(--fs-sm);
    color: var(--c-text-secondary);
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
  }

  &__bottom-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;

    > * {
      height: 100%;
    }
  }

  &__resizer {
    position: relative;
    background: transparent;
    transition: background-color var(--du-fast) var(--ease-out);

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--c-surface-3);
      transition: background-color var(--du-fast) var(--ease-out);
    }

    &:hover {
      background: var(--c-surface-1);
      &::before {
        background: var(--c-primary-solid);
      }
    }

    &--v {
      width: 4px;
      cursor: col-resize;

      &::before {
        width: 2px;
        height: 32px;
      }
    }

    &--h {
      height: 4px;
      cursor: row-resize;

      &::before {
        width: 32px;
        height: 2px;
      }
    }
  }
}
</style>
