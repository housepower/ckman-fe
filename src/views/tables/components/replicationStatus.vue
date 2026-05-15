<template>
  <section class="replication">
    <div class="replication__head">
      <div class="replication__title-group">
        <h3 class="replication__title">{{ $t('tables.Table Replication Status') }}</h3>
        <time-filter
          v-model="timeFilter"
          ref="timeFilter"
          localKey="tableMetricsTimeFilter"
          :refreshDuration.sync="refresh"
          @input="fetchData"
          @on-refresh="fetchData"
        />
      </div>
      <div class="replication__controls">
        <el-input
          v-model="searchKey"
          size="small"
          :placeholder="$t('common.keyword search')"
          suffix-icon="el-icon-search"
          class="replication__search"
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
        v-for="{ prop, label, minWidth, fixed, align } of columns"
        :key="prop"
        :fixed="fixed"
        :field="prop"
        :title="label"
        :min-width="minWidth || 140"
        :align="align || 'center'"
        sortable
      >
        <template slot-scope="{ row, column }">
          <span
            v-if="column.property === 'progress'"
            class="replication__progress"
            :class="progressClass(row[column.property])"
          >
            {{ formatProgress(row[column.property]) }}
          </span>
          <a
            v-else-if="column.property === 'queue_size' && row[column.property] > 0"
            href="javascript:void(0)"
            class="replication__num replication__num--link"
            :title="$t('tables.View')"
            @click="handleViewQueue(row)"
          >{{ percentiles(row[column.property]) }}</a>
          <span
            v-else-if="['queue_size', 'merges', 'inserts', 'log_pointer'].includes(column.property)"
            class="replication__num"
          >{{ percentiles(row[column.property]) }}</span>
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
import { $modal } from '@/services';
import { TablesApi } from '@/apis';
import { percentiles } from '@/helpers/';
import ReplicatedQueueComponent from './replicatedQueue.vue';

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
        { prop: 'table',         label: this.$t('tables.Table Name'),       minWidth: 280, fixed: 'left' },
        { prop: 'node',          label: this.$t('session.Node Host'),       minWidth: 120 },
        { prop: 'shard_replica', label: this.$t('tables.Shard Replica'),    minWidth: 110 },
        { prop: 'queue_size',    label: this.$t('tables.QueueSize'),        minWidth: 140, align: 'right' },
        { prop: 'inserts',       label: this.$t('tables.Inserts In Queue'), minWidth: 130, align: 'right' },
        { prop: 'merges',        label: this.$t('tables.Merges In Queue'),  minWidth: 130, align: 'right' },
        { prop: 'log_pointer',   label: this.$t('tables.Log Pointer'),      minWidth: 130, align: 'right' },
        { prop: 'progress',      label: this.$t('tables.Progress'),         minWidth: 100 },
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
    percentiles,
    handleViewQueue(row) {
      const { clusterName } = this;
      const { table, node, last_exception } = row;
      $modal({
        component: ReplicatedQueueComponent,
        props: {
          title: this.$t('tables.Replicated Queue'),
          width: 800,
          cancelText: null,
          okText: null,
        },
        data: { clusterName, table, node, last_exception },
      });
    },
    formatProgress(value) {
      const str = value.toString();
      const dot = str.indexOf('.');
      const trimmed = dot !== -1 ? str.substring(0, dot + 3) : str;
      return trimmed + '%';
    },
    progressClass(value) {
      if (value < 60) return 'replication__progress--danger';
      if (value < 90) return 'replication__progress--warning';
      return 'replication__progress--success';
    },
    async fetchData() {
      this.loading = true;
      const { data: { entity } } = await TablesApi.replicationStatus(this.clusterName)
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
.replication {
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

  &__progress {
    font-variant-numeric: tabular-nums;
    font-weight: var(--fw-medium);

    &--success { color: var(--c-success-fg); }
    &--warning { color: var(--c-warning-fg); }
    &--danger  { color: var(--c-danger-fg); }
  }

  &__num {
    font-variant-numeric: tabular-nums;

    &--link {
      color: var(--c-primary-solid);
      text-decoration: none;
      cursor: pointer;
      border-bottom: 1px dashed transparent;
      transition: border-color var(--du-fast) var(--ease-out);

      &:hover {
        border-bottom-color: var(--c-primary-solid);
      }
    }
  }
}
</style>
