<template>
  <section class="home">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console'), $t('home.All ClickHouse Clusters')]"
      :title="$t('home.All ClickHouse Clusters')"
    >
      <template #actions>
        <el-button @click="importCk">
          <i class="el-icon-upload2"></i>
          {{ $t('home.Import a ClickHouse Cluster') }}
        </el-button>
        <el-button type="primary" @click="createCk">
          <i class="el-icon-plus"></i>
          {{ $t('home.Create a ClickHouse Cluster') }}
        </el-button>
      </template>
    </PageHeader>

    <div class="stat-row">
      <div class="stat-card stat-card--total">
        <div class="stat-card__icon-bar"></div>
        <div class="stat-card__label">{{ $t('home.Total') }}</div>
        <div class="stat-card__value">{{ stats.total }}</div>
      </div>
      <div class="stat-card stat-card--deploy">
        <div class="stat-card__icon-bar"></div>
        <div class="stat-card__label">{{ $t('home.Deploy') }}</div>
        <div class="stat-card__value">{{ stats.deploy }}</div>
      </div>
      <div class="stat-card stat-card--import">
        <div class="stat-card__icon-bar"></div>
        <div class="stat-card__label">{{ $t('home.Import') }}</div>
        <div class="stat-card__value">{{ stats.import }}</div>
      </div>
      <div class="stat-card stat-card--replica">
        <div class="stat-card__icon-bar"></div>
        <div class="stat-card__label">{{ $t('home.Replica') }}</div>
        <div class="stat-card__value">{{ stats.replica }}</div>
      </div>
    </div>

    <div class="list mt-50">
      <div class="toolbar">
  <el-input
    v-model="key"
    :placeholder="$t('common.keyword search')"
    autocomplete="false"
    clearable
    size="medium"
    class="toolbar__search"
    suffix-icon="el-icon-search"
  ></el-input>
  <div class="toolbar__chips">
    <button
      class="chip"
      :class="{ 'chip--active': filterMode === 'all' && !filterReplica }"
      @click="filterMode = 'all'; filterReplica = false"
    >{{ $t('home.All') }}</button>
    <button
      class="chip"
      :class="{ 'chip--active': filterMode === 'deploy' }"
      @click="filterMode = 'deploy'"
    >{{ $t('home.Deploy') }}</button>
    <button
      class="chip"
      :class="{ 'chip--active': filterMode === 'import' }"
      @click="filterMode = 'import'"
    >{{ $t('home.Import') }}</button>
    <button
      class="chip"
      :class="{ 'chip--active': filterReplica }"
      @click="filterReplica = !filterReplica"
    >{{ $t('home.Replica only') }}</button>
  </div>
</div>
      <el-table :data="queryList"
                border
                header-cell-class-name="header-cell-class-name">
        <el-table-column prop="cluster"
                         show-overflow-tooltip
                         sortable
                         :label="$t('home.Cluster Name')" />
        <el-table-column prop="logic_cluster"
                         show-overflow-tooltip
                         sortable
                         :label="$t('home.Belongs to Logic')" />
        <el-table-column prop="mode"
                         show-overflow-tooltip
                         :filters="[{ text: 'deploy', value: 'deploy' }, { text: 'import', value: 'import' }]"
                         :filter-method="filterHandler"
                         :label="$t('home.Mode')" />
        <el-table-column prop="isReplica"
                         show-overflow-tooltip
                         :filters="[{ text: 'true', value: true }, { text: 'false', value: false }]"
                         :filter-method="filterHandler"
                         :label="$t('home.Replica')" />
        <el-table-column prop="hosts"
                         show-overflow-tooltip
                         :label="$t('home.ClickHouse Node IP')" />
        <el-table-column prop="count"
                         show-overflow-tooltip
                         sortable
                         :label="$t('home.ClickHouse Node Count')" />
        <el-table-column prop="comment"
                         show-overflow-tooltip
                         :label="$t('home.Comment')" />
        <el-table-column :label="$t('home.Actions')"
                         #default="{ row }">
          <el-link type="primary"
                   underline
                   @click.prevent="toCluster(row)"
                   :to="'/clusters/' + row.cluster">{{$t('home.Go to cluster')}}</el-link>
          <i class="fa fa-trash pointer fs-18 ml-35"
             v-tooltip="$t('common.Delete')"
             @click="remove(row)" />
        </el-table-column>
      </el-table>
    </div>
  </section>
</template>
<script>
import ImportCk from "./modals/importCk";
import { $modal } from "@/services";
import { ClusterApi } from "@/apis";
export default {
  name: "Home",
  data() {
    return {
      list: [],
      versionOptions: [],
      key: '',
      filterMode: 'all',
      filterReplica: false,
    };
  },
  computed: {
    queryList() {
      const { list, key, filterMode, filterReplica } = this;
      return list.filter(item => {
        const matchKey = !key
          || item.cluster.includes(key)
          || item.mode.includes(key)
          || item.logic_cluster?.includes(key)
          || item.hosts.includes(key)
          || (item.comment || '').includes(key);
        const matchMode = filterMode === 'all' || item.mode === filterMode;
        const matchReplica = !filterReplica || item.isReplica === true;
        return matchKey && matchMode && matchReplica;
      });
    },
    stats() {
      const { list } = this;
      return {
        total: list.length,
        deploy: list.filter(c => c.mode === 'deploy').length,
        import: list.filter(c => c.mode === 'import').length,
        replica: list.filter(c => c.isReplica === true).length,
      };
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.list = [];
      const {
        data: { entity },
      } = await ClusterApi.getCluster();
      Object.entries(entity).forEach(([name, item]) => {
        item.count = item.hosts.length;
        item.hosts = item.hosts.join(",");
        this.list.unshift(item);
      });
    },
    createCk() {
      this.$router.push({
        name: 'createCluster'
      });
    },
    async importCk() {
      await $modal({
        component: ImportCk,
        props: {
          title: this.$t("home.Import a ClickHouse Cluster"),
          width: 600,
          customClass: 'create-cluster-modal',
          cancelText: this.$t("common.Cancel"),
          okText: this.$t("common.Import"),
        },
        data: {
          versionOptions: this.versionOptions,
        },
      });
      const tip = this.$t('common.Import') + this.$t('common.Success');
      this.$message.success(`${tip}`);
      this.fetchData();
    },
    toCluster(item) {
      this.$root.clusterBench = item;
      delete this.$root.clusterBench.count;
    },
    async remove(item) {
      await this.$confirm(this.$t("common.Confirm Delete"), this.$t("common.tips"), {
        confirmButtonText: this.$t("common.Delete"),
        cancelButtonText: this.$t("common.Cancel"),
        text: "warning",
      });
      await ClusterApi.deleteCluster(`${item.cluster}`);
      this.$message.success(`${item.cluster} Cluster ${ this.$t("common.Delete") }${ this.$t("common.Success") }`);
      this.fetchData();
    },

    filterHandler(value, row, column) {
      const property = column['property'];
      return row[property] === value;
    }
  },
};
</script>

<style lang="scss" scoped>
.title {
  color: var(--color-black);
}
.btns {
  width: 300px;
  .el-button {
    margin: 0;
    height: 42px;
  }
}
// .list {
//   ::v-deep .header-cell-class-name {
//     background: var(--primary-color);
//   }
// }

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--s-3);
  margin: var(--s-4) 0 var(--s-5);
}

.stat-card {
  position: relative;
  background: var(--c-surface-0);
  border: 1px solid var(--c-surface-3);
  border-radius: var(--r-lg);
  padding: var(--s-3) var(--s-4) var(--s-3) var(--s-4);
  overflow: hidden;

  &__icon-bar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 3px;
    background: var(--c-text-tertiary);
  }

  &--total &__icon-bar    { background: var(--c-primary-solid); }
  &--deploy &__icon-bar   { background: var(--c-info-solid); }
  &--import &__icon-bar   { background: var(--c-text-tertiary); }
  &--replica &__icon-bar  { background: var(--c-success-solid); }

  &__label {
    font-size: var(--fs-xs);
    font-weight: var(--fw-medium);
    color: var(--c-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: var(--lh-tight);
  }

  &__value {
    font-size: var(--fs-3xl);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    line-height: var(--lh-tight);
    margin-top: var(--s-1);
    font-variant-numeric: tabular-nums;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  margin-bottom: var(--s-3);

  &__search {
    flex: 0 0 280px;
  }

  &__chips {
    display: flex;
    gap: var(--s-1);
    flex-wrap: wrap;
  }
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: var(--s-1) var(--s-3);
  border: 1px solid var(--c-surface-3);
  background: var(--c-surface-0);
  color: var(--c-text-secondary);
  border-radius: var(--r-pill);
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: background var(--du-fast) var(--ease-out),
              border-color var(--du-fast) var(--ease-out),
              color var(--du-fast) var(--ease-out);

  &:hover {
    background: var(--c-surface-1);
    color: var(--c-text-primary);
  }

  &--active {
    background: var(--c-primary-bg);
    border-color: var(--c-primary-border);
    color: var(--c-primary-fg);
    font-weight: var(--fw-medium);

    &:hover {
      background: var(--c-primary-bg);
      color: var(--c-primary-fg);
    }
  }
}
</style>
