<template>
  <section class="open-sessions">
    <div class="open-sessions__head">
      <h3 class="open-sessions__title">{{ $t('session.Open Sessions') }}</h3>
      <span class="open-sessions__count">{{ total }}</span>
    </div>

    <vxe-table
      class="open-sessions__table"
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
          class="open-sessions__sql"
          @dblclick="onCopy(row.query)"
        >{{ row.query }}</span>
        <span v-else>{{ row[col.prop] }}</span>
      </vxe-column>
      <vxe-column
        fixed="right"
        align="center"
        :title="$t('tables.Action')"
        width="120"
      >
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="killSession(scope.row)">
            {{ $t('session.Kill') }}
          </el-button>
        </template>
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
import { sortRows } from './sessionUtils';

export default {
  name: 'OpenSessions',
  data() {
    return {
      list: [],
      sort: {},
      pagination: { total: 0, pageSize: 10, pageSizes: [10, 20, 50, 100, 200], currentPage: 1 },
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
      const { data: { entity } } = await SessionApi.open(id);
      this.list = entity || [];
    },
    onSortChange({ property, order }) {
      this.sort = { property, order };
    },
    handlePageChange(pager) {
      this.pagination.currentPage = pager.currentPage;
    },
    async killSession(row) {
      const id = this.$route.params.id;
      await SessionApi.kill(id, row.host, row.queryId, 'open');
      this.$message.success(this.$t('common.Action Success'));
      this.fetchData();
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
.open-sessions {
  padding: var(--s-3) 0 var(--s-6);

  &__head {
    display: flex;
    align-items: baseline;
    gap: var(--s-2);
    margin-bottom: var(--s-3);
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

  &__sql {
    cursor: pointer;
    font-family: var(--f-mono);
    font-size: var(--fs-sm);
  }
}
</style>
