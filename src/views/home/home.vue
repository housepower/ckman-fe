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
      <div class="font-bold mb-10 fs-18 overflow-hidden">{{$t('home.All ClickHouse Clusters')}}
        
        <el-input v-model="key"
          :placeholder="$t('common.keyword search')"
          autocomplete="false"
          clearable
          size="medium"
          class="width-300 pull-right"></el-input>
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
    };
  },
  computed: {
    queryList() {
      const { list, key } = this;
      return list.filter(item => {
        return item.cluster.includes(key)
          || item.mode.includes(key)
          || item.logic_cluster?.includes(key)
          || item.hosts.includes(key);
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
</style>
