<template>
  <div class="flex flex-column">
    <vxe-table
      class="flex-1"
      border
      align="center"
      v-bind="gridOptions"
      @sort-change="sortChangeEvent"
      :data="currentPageData">
        <vxe-column
          v-for="(col, index) in columns"
          show-header-overflow
          show-footer-overflow
          show-overflow="ellipsis"
          :key="index"
          :field="col.prop"
          :title="col.label"
          :width="col.width"
          align="center"
          sortable
          #default="{ row }">
          <span v-if="col.prop === 'startTime'">{{ row.startTime * 1000 | formatDate }}</span>
          <span v-else>{{ row[col.prop] }}</span>
        </vxe-column>
    </vxe-table>
    <vxe-pager
      :current-page="pagination.currentPage"
      :page-size.sync="pagination.pageSize"
      :page-sizes="pagination.pageSizes"
      :total="total"
      :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']"
      @page-change="handlePageChange">
    </vxe-pager>
  </div>
</template>
<script>
export default {
  props: {
    list: {
      type: Array,
      default: [],
    },
  },
  data() {
    return {
      sort: {},
      pagination: {
        total: 0,
        pageSize: 10,
        pageSizes: [10, 15, 20, 50, 100, 200, 500, 1000],
        currentPage: 1
      },
      gridOptions: {
        border: true,
        resizable: true,
        showHeaderOverflow: true,
        showOverflow: true,
        highlightHoverRow: true,
        rowId: 'tableName',
        toolbarConfig: {
          zoom: true,
          custom: true
        },
        sortConfig: {
          trigger: 'cell',
        },
        filterConfig: {
        },
      }
    };
  },
  computed: {
    total() {
      return this.list.length;
    },
    columns() {
      return [
        {
          prop: "startTime",
          label: this.$t('session.Query Start Time'),
          width: 180,
          sortable: true
        },
        {
          prop: "queryDuration",
          label: this.$t('session.Query Duration'),
          width: 140,
          sortable: true
        },
        {
          prop: "query",
          label: this.$t('session.Query'),
          sortable: true
        },
        {
          prop: "user",
          label: this.$t('session.Initial User'),
          width: 140,
          sortable: true
        },
        {
          prop: "queryId",
          label: this.$t('session.Initial Query ID'),
          width: 140,
          sortable: true
        },
        {
          prop: "address",
          label: this.$t('session.Initial Address'),
          width: 140,
          sortable: true
        },
        {
          prop: "threads",
          label: this.$t('session.Thread Numbers'),
          width: 140,
          sortable: true
        }
      ]
    },
    queryList() {
      const { sort: { property, order } } = this;
      console.log(this.list);
      this.list.sort((prev, next) => {
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
            if(prev[property].length === next[property].length){
              flag = prev[property].localeCompare(next[property]);
            } else{
              flag = prev[property].length - next[property].length;
            }
            if (order === 'asc') {
              return flag;
            } else if (order === 'desc') {
              return -flag;
            }
          }
        })
      return this.list;
    },
    currentPageData() {
      const { currentPage, pageSize } = this.pagination;
      console.log(this.queryList);
      return this.queryList.slice((currentPage - 1)*pageSize, currentPage*pageSize);
    }
  },
  methods: {
    sortChangeEvent(ctx) {
      const { property, order } = ctx;
      this.sort = {
        property,
        order
      };
    },
    handlePageChange(pager) {
      this.pagination.currentPage = pager.currentPage;
    },
  },
};
</script>

<style></style>
