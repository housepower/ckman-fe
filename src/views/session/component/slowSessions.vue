<template>
  <section class="slow-sessions">
    <div class="slow-sessions__head">
      <div class="slow-sessions__title-group">
        <h3 class="slow-sessions__title">{{ $t('session.Slow Sessions') }}</h3>
        <span class="slow-sessions__count">{{ total }}</span>
      </div>
      <div class="slow-sessions__controls">
        <time-filter
          v-model="timeFilter"
          :refreshDuration.sync="refresh"
          localKey="sessionTimeFilter"
          @input="fetchData"
          @on-refresh="fetchData"
        />
        <label class="slow-sessions__limit-label">{{ $t('session.Limit Count') }}</label>
        <el-input-number
          v-model="limit"
          size="small"
          :min="5"
          class="slow-sessions__limit"
          @change="fetchData"
        />
      </div>
    </div>

    <vxe-table
      class="slow-sessions__table"
      :data="pageData"
      :border="false"
      align="center"
      resizable
      show-header-overflow
      show-overflow
      highlight-hover-row
      :sort-config="{ trigger: 'cell' }"
      @sort-change="onSortChange"
    >
      <vxe-column
        v-for="col in columns"
        :key="col.prop"
        :field="col.prop"
        :title="col.label"
        :width="col.width"
        sortable
        align="center"
        #default="{ row }"
      >
        <span v-if="col.prop === 'startTime'">{{ row.startTime * 1000 | formatDate }}</span>
        <span
          v-else-if="col.prop === 'query'"
          class="slow-sessions__sql"
          @dblclick="onCopy(row.query)"
        >{{ row.query }}</span>
        <span v-else>{{ row[col.prop] }}</span>
      </vxe-column>
    </vxe-table>

    <vxe-pager
      :current-page="pagination.currentPage"
      :page-size.sync="pagination.pageSize"
      :page-sizes="pagination.pageSizes"
      :total="total"
      :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']"
      @page-change="handlePageChange"
    />
  </section>
</template>

<script>
import { SessionApi } from '@/apis';
import { convertTimeBounds, parseDurationBySplit } from '@/helpers';
import { sortRows } from './sessionUtils';

export default {
  name: 'SlowSessions',
  data() {
    return {
      list: [],
      sort: {},
      pagination: { total: 0, pageSize: 10, pageSizes: [10, 20, 50, 100, 200], currentPage: 1 },
      timeFilter: ['now-7d', 'now'],
      refresh: null,
      limit: 10,
    };
  },
  computed: {
    total() {
      return this.list.length;
    },
    columns() {
      return [
        { prop: 'startTime',     label: this.$t('session.Query Start Time') },
        { prop: 'queryDuration', label: this.$t('session.Query Duration') },
        { prop: 'query',         label: this.$t('session.Query') },
        { prop: 'user',          label: this.$t('session.Initial User') },
        { prop: 'queryId',       label: this.$t('session.Initial Query ID') },
        { prop: 'host',          label: this.$t('session.Node Host') },
        { prop: 'address',       label: this.$t('session.Initial Address') },
      ];
    },
    pageData() {
      const { currentPage, pageSize } = this.pagination;
      const sorted = sortRows(this.list, this.sort);
      return sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      const id = this.$route.params.id;
      const { min, max } = convertTimeBounds(this.timeFilter);
      const { data: { entity } } = await SessionApi.close(id, {
        limit: this.limit,
        start: parseInt(min / 1000, 10),
        end: parseInt(max / 1000, 10),
      });
      this.list = (entity || []).map((x) => ({
        ...x,
        queryDuration: parseDurationBySplit(x.queryDuration),
      }));
    },
    onSortChange({ property, order }) {
      this.sort = { property, order };
    },
    handlePageChange(pager) {
      this.pagination.currentPage = pager.currentPage;
    },
    onCopy(text) {
      const input = document.createElement('textarea');
      input.value = text;
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
.slow-sessions {
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
    align-items: baseline;
    gap: var(--s-2);
  }

  &__title {
    font-size: var(--fs-md);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    margin: 0;
    line-height: var(--lh-tight);
  }

  &__count {
    font-size: var(--fs-xs);
    color: var(--c-text-tertiary);
    font-variant-numeric: tabular-nums;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: var(--s-3);
    flex-wrap: wrap;
  }

  &__limit-label {
    font-size: var(--fs-sm);
    color: var(--c-text-secondary);
  }

  &__limit {
    width: 110px;
  }

  &__sql {
    cursor: pointer;
    font-family: var(--f-mono);
    font-size: var(--fs-sm);
  }
}
</style>
