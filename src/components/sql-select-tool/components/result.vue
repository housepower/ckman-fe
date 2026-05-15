<template>
  <div class="sql-result" :class="{ 'sql-result--fullscreen': isFullscreen }">
    <div v-if="tabs.length > 1" class="sql-result__tabs">
      <button
        v-for="(tab, idx) in tabs"
        :key="tab.id"
        class="sql-result__tab"
        :class="{
          'sql-result__tab--active': tab.id === activeTabId,
          'sql-result__tab--error': tab.status === 'error',
        }"
        :title="tab.sql"
        @click="setActive(tab.id)"
      >
        <span>{{ $t('queryExecution.Result') }} {{ idx + 1 }}</span>
        <i v-if="tab.status === 'loading'" class="el-icon-loading sql-result__tab-icon" />
        <i v-else-if="tab.status === 'error'" class="el-icon-warning-outline sql-result__tab-icon" />
      </button>
    </div>

    <div v-if="!activeTab" class="sql-result__empty">{{ $t('queryExecution.No Data') }}</div>

    <div v-else-if="activeTab.status === 'error'" class="sql-result__error">
      <i class="el-icon-warning-outline sql-result__error-icon" />
      <pre class="sql-result__error-msg">{{ activeTab.error }}</pre>
    </div>

    <div
      v-else-if="activeTab.status === 'loading' && rows.length === 0"
      class="sql-result__skeleton"
    >
      <Skeleton variant="table" :rows="6" :columns="5" />
    </div>

    <template v-else>
      <div class="sql-result__table-wrap">
        <vxe-toolbar custom class="sql-result__toolbar" size="mini">
          <template #tools>
            <button
              class="sql-result__expand"
              :title="isFullscreen ? $t('common.Close') : $t('home.Fullscreen')"
              @click="toggleFullscreen"
            >
              <i class="fa" :class="isFullscreen ? 'fa-compress' : 'fa-expand'"></i>
            </button>
          </template>
        </vxe-toolbar>
        <vxe-table
          ref="xTable"
          v-loading="activeTab.status === 'loading'"
          class="sql-result__table"
          :data="currentPageData"
          :empty-text="$t('queryExecution.No Data')"
          :border="false"
          size="mini"
          show-overflow
          resizable
          highlight-hover-row
          height="100%"
          :sort-config="{ trigger: 'cell' }"
          @sort-change="sortChangeEvent"
        >
          <vxe-column
            v-for="(column, index) in columns"
            :key="index"
            :field="column.prop"
            :title="column.label"
            :min-width="180"
            sortable
          >
            <template slot-scope="{ row, column: col }">
              <div class="sql-result__cell" @dblclick="copyField(row, col)">
                <span :title="getFieldValue(row, col)">{{ getFieldValue(row, col) }}</span>
              </div>
            </template>
          </vxe-column>
        </vxe-table>
      </div>
      <div class="sql-result__footer">
        <vxe-pager
          :current-page="activeTab.pagination.currentPage"
          :page-size="activeTab.pagination.pageSize"
          :page-sizes="activeTab.pagination.pageSizes"
          :total="activeTab.pagination.total"
          :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']"
          @page-change="handlePageChange"
        />
        <span class="sql-result__elapsed">
          {{ $t('queryExecution.Elapsed') }} {{ elapsed }} ms
        </span>
        <el-button
          type="primary"
          size="small"
          icon="el-icon-download"
          :disabled="rows.length === 0"
          @click="exportCSV"
        >
          {{ $t('queryExecution.Export') }}
        </el-button>
      </div>
    </template>
  </div>
</template>

<script>
import store from '@/store';
import { parseDurationBySplit } from '@/helpers';
import BigNumber from 'bignumber.js';

export default {
  data() {
    return { sort: {}, isFullscreen: false };
  },
  computed: {
    tabs() {
      return store.state.sqlSelect.tabs;
    },
    activeTabId() {
      return store.state.sqlSelect.activeTabId;
    },
    activeTab() {
      return store.getters['sqlSelect/activeTab'];
    },
    columns() {
      return store.getters['sqlSelect/activeColumns'];
    },
    rows() {
      return store.getters['sqlSelect/activeRows'];
    },
    sortedRows() {
      const { property, order } = this.sort;
      if (!property || !order) return this.rows;
      const sorted = this.rows.slice();
      sorted.sort((a, b) => {
        const av = a[property];
        const bv = b[property];
        let flag = 0;
        if (typeof av === 'number' && typeof bv === 'number') {
          flag = av - bv;
        } else {
          const as = String(av ?? '');
          const bs = String(bv ?? '');
          flag = as.length === bs.length ? as.localeCompare(bs) : as.length - bs.length;
        }
        return order === 'asc' ? flag : -flag;
      });
      return sorted;
    },
    currentPageData() {
      if (!this.activeTab) return [];
      const { currentPage, pageSize } = this.activeTab.pagination;
      return this.sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    },
    elapsed() {
      return this.activeTab ? parseDurationBySplit(this.activeTab.queryDuration) : 0;
    },
  },
  watch: {
    activeTabId() {
      this.sort = {};
    },
  },
  mounted() {
    document.addEventListener('keydown', this.onKeydown);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.onKeydown);
    if (this.isFullscreen) document.body.style.overflow = '';
  },
  methods: {
    setActive(id) {
      store.commit('sqlSelect/setActiveTab', id);
    },
    getFieldValue(row, column) {
      const value = row[column.property];
      if (value === null || value === undefined) return '';
      if (value instanceof BigNumber) return value.toString();
      if (typeof value === 'object' && !Array.isArray(value)) return JSON.stringify(value);
      return String(value);
    },
    copyField(row, column) {
      this.copy(this.getFieldValue(row, column));
    },
    formatCsvValue(value) {
      if (value === null || value === undefined) return '';
      if (value instanceof BigNumber) return `"\t${String(value)}"`;
      let stringValue = String(value);
      if (typeof value === 'object' && !Array.isArray(value)) stringValue = JSON.stringify(value);
      if (/[",\n]/.test(stringValue)) return `"${stringValue.replace(/"/g, '""')}"`;
      return stringValue;
    },
    export2Csv({ data, columns, filename = 'export.csv' }) {
      const csvContent = [
        columns.map((col) => this.formatCsvValue(col.label)).join(','),
        ...data.map((item) => columns.map((col) => this.formatCsvValue(item[col.prop])).join(',')),
      ].join('\n');
      const blob = new Blob([`﻿${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    exportCSV() {
      const { id: clusterName } = this.$route.params;
      const dateStr = new Date()
        .toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
        .replace(/\//g, '-')
        .replace(/:/g, '-')
        .replace(/\s/, 'T');
      const idx = this.tabs.findIndex((t) => t.id === this.activeTabId) + 1;
      this.export2Csv({
        data: this.rows,
        columns: this.columns,
        filename: `ckman_query_${clusterName}_${idx}_${dateStr}.csv`,
      });
    },
    handlePageChange({ currentPage, pageSize }) {
      if (!this.activeTab) return;
      store.commit('sqlSelect/setTabPage', { id: this.activeTab.id, currentPage });
      store.commit('sqlSelect/setTabPageSize', { id: this.activeTab.id, pageSize });
    },
    sortChangeEvent({ property, order }) {
      this.sort = { property, order };
    },
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen;
      document.body.style.overflow = this.isFullscreen ? 'hidden' : '';
      // vxe-table 容器尺寸突变后需要重新测量；nextTick 不够，等浏览器布局完成再算
      const recalc = () => {
        const t = this.$refs.xTable;
        if (!t) return;
        if (t.refreshColumn) t.refreshColumn();
        if (t.recalculate) t.recalculate(true);
        if (t.syncData) t.syncData();
      };
      requestAnimationFrame(() => requestAnimationFrame(recalc));
      setTimeout(recalc, 150);
      window.dispatchEvent(new Event('resize'));
    },
    onKeydown(e) {
      if (e.key === 'Escape' && this.isFullscreen) this.toggleFullscreen();
    },
    copy(str) {
      const input = document.createElement('textarea');
      input.value = str;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        this.$message.success(this.$t('queryExecution.Copy Success'));
      } finally {
        document.body.removeChild(input);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.sql-result {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;

  &--fullscreen {
    // 留出顶栏(52px) + 集群导航条(40px) = 92px，保持导航可用
    position: fixed !important;
    top: 92px !important;
    right: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: calc(100vh - 92px) !important;
    z-index: 98; // 顶栏 z=100、集群导航 z=99 之下，确保不被遮挡的同时不盖住导航
    background: var(--c-surface-0);
    display: flex;
    flex-direction: column;
  }

  &__expand {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 0;
    border-radius: var(--r-sm);
    color: var(--c-text-tertiary);
    cursor: pointer;
    transition: background-color var(--du-fast) var(--ease-out),
                color var(--du-fast) var(--ease-out);

    &:hover {
      background: var(--c-surface-2);
      color: var(--c-primary-solid);
    }
  }

  &__tabs {
    flex: 0 0 auto;
    display: flex;
    gap: var(--s-1);
    padding: var(--s-1) var(--s-2) 0;
    background: var(--c-surface-1);
    border-bottom: 1px solid var(--c-surface-3);
    overflow-x: auto;
  }

  &__tab {
    appearance: none;
    background: var(--c-surface-0);
    border: 1px solid var(--c-surface-3);
    border-bottom-color: transparent;
    border-radius: var(--r-sm) var(--r-sm) 0 0;
    cursor: pointer;
    padding: var(--s-1) var(--s-3);
    font-size: var(--fs-sm);
    color: var(--c-text-secondary);
    display: inline-flex;
    align-items: center;
    gap: var(--s-1);
    transition: color var(--du-fast) var(--ease-out),
                background-color var(--du-fast) var(--ease-out);
    white-space: nowrap;

    &:hover {
      color: var(--c-text-primary);
    }

    &--active {
      color: var(--c-text-primary);
      font-weight: var(--fw-semibold);
      border-top: 2px solid var(--c-primary-solid);
      padding-top: calc(var(--s-1) - 1px);
    }

    &--error {
      color: var(--c-danger-solid);
    }
  }

  &__tab-icon {
    font-size: var(--fs-sm);
  }

  &__skeleton {
    flex: 1;
    min-height: 0;
    padding: var(--s-4) var(--s-3);
    overflow: hidden;
  }

  &__empty,
  &__error {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: var(--s-2);
    padding: var(--s-5);
    color: var(--c-text-tertiary);
  }

  &__error {
    color: var(--c-danger-solid);
    align-items: stretch;
    justify-content: flex-start;
  }

  &__error-icon {
    font-size: var(--fs-xl);
    align-self: center;
  }

  &__error-msg {
    margin: 0;
    padding: var(--s-3);
    background: var(--c-surface-1);
    border: 1px solid var(--c-surface-3);
    border-radius: var(--r-sm);
    font-family: var(--f-mono);
    font-size: var(--fs-sm);
    color: var(--c-text-primary);
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 100%;
    overflow: auto;
  }

  &__table-wrap {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: row-reverse;
  }

  &__toolbar {
    flex: 0 0 auto;
    background: transparent !important;
    height: 100% !important;
    align-items: flex-start !important;
  }

  &__table {
    flex: 1;
    min-width: 0;
  }

  &__cell {
    display: block;
    width: 100%;
    white-space: pre;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
  }

  &__footer {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--s-3);
    padding: var(--s-2) var(--s-3);
    background: var(--c-surface-1);
    border-top: 1px solid var(--c-surface-3);
  }

  &__elapsed {
    font-size: var(--fs-sm);
    color: var(--c-text-tertiary);
    font-variant-numeric: tabular-nums;
  }
}
</style>
