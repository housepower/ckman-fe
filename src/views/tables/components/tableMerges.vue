<template>
  <section class="merges">
    <div class="merges__head">
      <div class="merges__title-group">
        <h3 class="merges__title">{{ $t('tables.Table Merges') }}</h3>
        <time-filter
          v-model="timeFilter"
          ref="timeFilter"
          localKey="tableMetricsTimeFilter"
          :refreshDuration.sync="refresh"
          @input="fetchData"
          @on-refresh="fetchData"
        />
      </div>
      <div class="merges__controls">
        <el-input
          v-model="searchKey"
          size="small"
          :placeholder="$t('common.keyword search')"
          suffix-icon="el-icon-search"
          class="merges__search"
        />
        <el-button
          size="small"
          plain
          icon="el-icon-refresh"
          @click="fetchData"
        >{{ $t('common.Refresh') }}</el-button>
      </div>
    </div>

    <vxe-table
      ref="xTable"
      v-loading="loading"
      :data="currentPageData"
      :border="false"
      align="center"
      resizable
      show-header-overflow
      show-overflow
      highlight-hover-row
      :sort-config="{ trigger: 'cell' }"
      height="550"
      @sort-change="sortChangeEvent"
    >
      <vxe-column
        v-for="{ prop, label, minWidth, fixed } of columns"
        :key="prop"
        :fixed="fixed"
        :field="prop"
        :title="label"
        :min-width="minWidth || 140"
        sortable
      >
        <template slot-scope="{ row, column }">
          <span v-if="column.property.endsWith('compressed') || column.property === 'memory_usage'">
            {{ byteConvert(row[column.property]) }}
          </span>
          <span v-else-if="column.property === 'rows' || column.property === 'elapsed'">
            {{ percentiles(row[column.property]) }}
          </span>
          <span v-else-if="column.property === 'progress'">
            {{ formatProgress(row[column.property]) }}
          </span>
          <span v-else>{{ row[column.property] }}</span>
        </template>
      </vxe-column>
    </vxe-table>

    <vxe-pager
      :current-page="pagination.currentPage"
      :page-size.sync="pagination.pageSize"
      :page-sizes="pagination.pageSizes"
      :total="pagination.total"
      :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']"
      @page-change="handlePageChange"
    />
  </section>
</template>

<script>
import { TablesApi } from '@/apis';
import { byteConvert, percentiles } from '@/helpers/';

export default {
  data() {
    return {
      clusterName: '',
      timeFilter: null,
      refresh: null,
      loading: false,
      searchKey: '',
      sort: {},
      tableData: [],
      pagination: {
        total: 0,
        pageSize: 10,
        pageSizes: [10, 20, 50, 100, 200, 500, 1000],
        currentPage: 1,
      },
    };
  },
  watch: {
    'listData.length'(len) {
      this.pagination.currentPage = 1;
      this.pagination.total = len;
    },
  },
  computed: {
    columns() {
      return [
        { prop: 'table',             label: this.$t('tables.Table Name'),     minWidth: 250, fixed: 'left' },
        { prop: 'host',              label: this.$t('session.Node Host'),     minWidth: 100 },
        { prop: 'elapsed',           label: this.$t('tables.Elapsed'),        minWidth: 100 },
        { prop: 'merge_start',       label: this.$t('tables.MergeStart'),     minWidth: 160 },
        { prop: 'progress',          label: this.$t('tables.Merge Progress'), minWidth: 100 },
        { prop: 'memory_usage',      label: this.$t('tables.MemUsage'),       minWidth: 100 },
        { prop: 'num_parts',         label: this.$t('tables.NumParts'),       minWidth: 100 },
        { prop: 'rows',              label: this.$t('tables.Rows'),           minWidth: 100 },
        { prop: 'compressed',        label: this.$t('tables.Compressed'),     minWidth: 150 },
        { prop: 'uncompressed',      label: this.$t('tables.UnCompressed'),   minWidth: 150 },
        { prop: 'result_part_name',  label: this.$t('tables.ResultPartName'), minWidth: 140 },
        { prop: 'source_part_names', label: this.$t('tables.SourcePartNames'), minWidth: 220 },
        { prop: 'merge_algorithm',   label: this.$t('tables.Algorithm'),      minWidth: 120 },
      ];
    },
    listData() {
      const { searchKey, sort: { property, order } } = this;
      const filtered = (this.tableData || []).filter((x) =>
        x.table ? x.table.includes(searchKey) : false,
      );
      if (!property || !order) return filtered;
      const sorted = filtered.slice();
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
      const { currentPage, pageSize } = this.pagination;
      return this.listData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    },
  },
  created() {
    this.clusterName = this.$route.params.id;
    this.fetchData();
  },
  methods: {
    byteConvert,
    percentiles,
    formatProgress(value) {
      const str = (value * 100).toString();
      const dot = str.indexOf('.');
      const trimmed = dot !== -1 ? str.substring(0, dot + 3) : str;
      return trimmed + '%';
    },
    async fetchData() {
      this.loading = true;
      const { data: { entity } } = await TablesApi.tableMerges(this.clusterName)
        .finally(() => (this.loading = false));
      this.tableData = Object.freeze(entity || []);
      this.pagination.total = this.tableData.length;
    },
    sortChangeEvent({ property, order }) {
      this.sort = { property, order };
    },
    handlePageChange(pager) {
      this.pagination.currentPage = pager.currentPage;
    },
  },
};
</script>

<style lang="scss" scoped>
.merges {
  padding: var(--s-3) 0 var(--s-6);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-3);
    margin-bottom: var(--s-3);
    flex-wrap: wrap;
  }

  &__title-group {
    display: flex;
    align-items: center;
    gap: var(--s-3);
  }

  &__title {
    font-size: var(--fs-md);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    margin: 0;
    line-height: var(--lh-tight);
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: var(--s-2);
  }

  &__search {
    width: 240px;
  }
}
</style>
