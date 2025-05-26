<template>
  <div class="height-full flex flex-column">
    <div class="flex flex-reverse flex-1">
      <vxe-toolbar zoom custom class="pull-right fs-0 vxe-toolbar-custom" size="mini"></vxe-toolbar>
      <vxe-table class="flex-1 vxe-table-custom" v-loading="loading" border size="mini" show-overflow
        :empty-text="$t('queryExecution.No Data')" :data="currentPageData" v-bind="gridOptions"
        @sort-change="sortChangeEvent" height="100%">
        <vxe-column v-for="(column, index) in columns" :field="column.prop" :title="column.label" :min-width="180"
          :key="index" sortable>
          <template slot-scope="{row, column}">
            <div class="space-wrapper" @dblclick="copyField(row, column)">
              <span class="text-ellipsis" title="">{{ getFieldValue(row, column) }}</span>
            </div>
          </template>
        </vxe-column>
      </vxe-table>
    </div>
    <div class="flex pr-10" :style="{ 'align-items': 'center', 'justify-content': 'flex-end' }">
      <vxe-pager :current-page="pagination.currentPage" :page-size.sync="pagination.pageSize"
        :page-sizes="pagination.pageSizes" :total="pagination.total"
        :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']" @page-change="handlePageChange">
      </vxe-pager>
      <span>耗时 {{ queryDuration }} ms</span>
      <el-button type="primary" size="mini" class="ml-10" @click="exportCSV" icon="el-icon-download">
        {{ $t('queryExecution.Export') }}
      </el-button>
    </div>
  </div>
</template>
<script>
import store from '@/store';
import { parseDurationBySplit } from '@/helpers';
import BigNumber from 'bignumber.js';
export default {
  data() {
    return {
      loading: false,
      sort: {},
      gridOptions: {
        border: true,
        resizable: true,
        showHeaderOverflow: true,
        showOverflow: true,
        highlightHoverRow: true,
        rowId: 'tableName',
        sortConfig: {
          trigger: 'cell',
        },
        filterConfig: {
        },
      },
    }
  },
  computed: {
    columns() {
      return store.getters['sqlSelect/getResultColumn'];
    },
    datas() {
      const data = store.getters['sqlSelect/getResultData'];
      const { property, order } = this.sort;
      return data.sort((prev, next) => {
        const type = typeof prev[property];
        if (type === 'number') {
          const flag = prev[property] - next[property];
          if (order === 'asc') {
            return flag;
          } else if (order === 'desc') {
            return -flag;
          }
        } else if (type === 'string') {
          let flag;
          if (prev[property].length === next[property].length) {
            flag = prev[property].localeCompare(next[property]);
          } else {
            flag = prev[property].length - next[property].length;
          }
          if (order === 'asc') {
            return flag;
          } else if (order === 'desc') {
            return -flag;
          }
        }
      });
    },
    currentPageData() {
      const { currentPage, pageSize } = this.pagination;
      return this.datas.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    },
    pagination() {
      return store.state.sqlSelect.pagination;
    },
    status() {
      return store.state.sqlSelect.status;
    },
    queryDuration() {
      return parseDurationBySplit(store.state.sqlSelect.queryDuration);
    },
  },
  watch: {
    status(newStatus) {
      if (newStatus === 'loading') {
        this.loading = true;
      } else {
        this.loading = false;
      }
    }
  },
  methods: {
    getFieldValue(row, column) {
      const value = row[column.property];
      if (value === null || value === undefined) return '';
      console.log(value);
      if (value instanceof BigNumber) {
        return value.toString();
      }
      if (typeof value === 'object' &&!Array.isArray(value)) {
        return JSON.stringify(value); 
      }
      return String(value);
    },
    // 双击复制
    copyField(row, column) {
      const value = row[column.property];
      let copyText = '';
      if (value === null || value === undefined) {
        copyText = '';
      } else if (value instanceof BigNumber) {
        copyText = value.toString();
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        copyText = JSON.stringify(value);
      } else {
        copyText = String(value);
      }

      this.copy(copyText); // 使用已有的 copy 方法
    },
    export2Csv({ data, columns, filename = 'export.csv' }) {
      try {
        // 1. 构建CSV内容
        const csvContent = [
          // 表头
          columns.map(col => this.formatCsvValue(col.label)).join(','),
          // 数据行
          ...data.map(item =>
            columns.map(col => this.formatCsvValue(item[col.prop])).join(',')
          )
        ].join('\n')

        // 2. 创建Blob对象
        const blob = new Blob([`\ufeff${csvContent}`], {
          type: 'text/csv;charset=utf-8;'
        })

        // 3. 创建下载链接
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()

        // 4. 清理资源
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (e) {
        console.error('导出CSV失败:', e)
        throw e
      }
    },

    // CSV特殊字符处理
    formatCsvValue(value) {
      if (value === null || value === undefined) return ''
      let stringValue = String(value)
      if (value instanceof BigNumber) {
        return `"\t${stringValue}"`
      }
      if (typeof value === 'object' &&!Array.isArray(value)) {
        stringValue = JSON.stringify(value)
      }
      // 处理包含逗号、换行符、双引号的情况
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue;
    },
    exportCSV() {
      const columns = this.columns
      const data = this.datas

      // CSV文件名
      const options = {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      const { id: clusterName } = this.$route.params;
      const dateStr = new Date().toLocaleString('zh-CN', options)
        .replace(/\//g, '-')
        .replace(/:/g, '-')
        .replace(/\s/, 'T');

      const filename = `ckman_query_${clusterName}_${dateStr}.csv`;
      // 调用导出工具方法
      this.export2Csv({
        data,
        columns,
        filename
      })
    },
    handleSizeChange(val) {
      store.commit('sqlSelect/changePageSize', val);
    },
    handleCurrentChange(val) {
      store.commit('sqlSelect/changeCurrentPage', val);
    },
    handlePageChange({ currentPage }) {
      this.pagination.currentPage = currentPage;
    },
    sortChangeEvent(ctx) {
      const { property, order } = ctx;
      this.sort = {
        property,
        order
      };
    },
    copy(str) {
      try {
        let input = document.createElement('textarea');
        input.value = str;
        input.style.border = '0';
        input.style.padding = '0';
        input.style.margin = '0';
        input.style.right = '999999em';
        input.style.position = 'absolute';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        this.$message.success(this.$t('queryExecution.Copy Success'));
        input = null;
      } catch (e) {
        //
      }
    }
  }
}
</script>
<style lang="scss">
.vxe-toolbar-custom {
  background: #f2f2f2;
  height: 100% !important;
  align-items: start;

  .vxe-custom--wrapper {
    margin-left: 0;
    padding: 3px;
    margin-top: 5px;
  }
}

.vxe-table-custom.vxe-table--render-default.size--mini .vxe-body--column.col--ellipsis,
.vxe-table--render-default.size--mini .vxe-footer--column.col--ellipsis,
.vxe-table--render-default.size--mini .vxe-header--column.col--ellipsis,
.vxe-table--render-default.vxe-editable.size--mini .vxe-body--column {
  height: 25px;
}

.vxe-table-custom {
  .vxe-table--empty-placeholder {
    height: 100% !important;
  }
}

.space-wrapper {
  white-space: pre-wrap; // 保留空白符
  word-break: break-all; // 允许单词内断行

  .text-ellipsis {
    white-space: pre;
  }
}

.vxe-table-cell {
  white-space: normal !important; // 覆盖默认样式
}
</style>
