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

    <div class="list-card">
      <div class="toolbar">
  <el-input
    v-model="key"
    :placeholder="$t('common.keyword search')"
    autocomplete="off"
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
      <el-table
        :data="queryList"
        :empty-text="$t('home.No clusters')"
      >
        <el-table-column
          prop="cluster"
          sortable
          min-width="280"
          :label="$t('home.Cluster')"
        >
          <template #default="{ row }">
            <el-tooltip :content="row.comment" placement="top" :disabled="!row.comment">
              <div class="cluster-cell">
                <span
                  class="cluster-cell__dot"
                  :class="row.mode === 'deploy' ? 'cluster-cell__dot--deploy' : 'cluster-cell__dot--import'"
                ></span>
                <div class="cluster-cell__main">
                  <div class="cluster-cell__name">{{ row.cluster }}</div>
                  <div class="cluster-cell__meta">
                    <span v-if="row.logic_cluster">{{ row.logic_cluster }} ·</span>
                    <span>{{ row.count }} {{ $t('home.nodes') }}</span>
                    <span class="cluster-cell__hosts" v-if="row.hosts">· {{ truncateHosts(row.hosts) }}</span>
                  </div>
                </div>
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          prop="mode"
          width="100"
          :label="$t('home.Mode')"
        >
          <template #default="{ row }">
            <span class="mode-badge" :class="`mode-badge--${row.mode}`">{{ row.mode }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="isReplica"
          width="100"
          :label="$t('home.Replica')"
        >
          <template #default="{ row }">
            <span v-if="row.isReplica" class="replica-yes">✓</span>
            <span v-else class="replica-no">—</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('home.Actions')" width="140" align="right">
          <template #default="{ row }">
            <div class="row-actions">
              <router-link
                :to="'/clusters/' + row.cluster"
                @click.native="toCluster(row)"
                class="row-actions__open"
              >
                {{ $t('home.Open') }} ›
              </router-link>
              <el-dropdown trigger="click" @command="onRowCommand($event, row)">
                <i class="fa fa-ellipsis-v row-actions__more"></i>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="delete" class="row-actions__delete-item">
                    <i class="el-icon-delete"></i>
                    {{ $t('common.Delete') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </template>
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
    onRowCommand(command, row) {
      if (command === 'delete') {
        this.remove(row);
      }
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

    truncateHosts(hosts) {
      if (!hosts) return '';
      const arr = typeof hosts === 'string' ? hosts.split(',') : hosts;
      if (arr.length <= 2) return arr.join(', ');
      return `${arr[0]}, ${arr[1]} +${arr.length - 2}`;
    },
  },
};
</script>

<style lang="scss" scoped>
.home {
  padding-bottom: var(--s-8);
}

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

.list-card {
  background: var(--c-surface-0);
  border: 1px solid var(--c-surface-3);
  border-radius: var(--r-lg);
  padding: var(--s-4);
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

.cluster-cell {
  display: flex;
  align-items: center;
  gap: var(--s-3);

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &--deploy { background: var(--c-info-solid); }
    &--import { background: var(--c-text-tertiary); }
  }

  &__main {
    min-width: 0;
    flex: 1;
  }

  &__name {
    font-size: var(--fs-base);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    line-height: var(--lh-tight);
  }

  &__meta {
    font-size: var(--fs-xs);
    color: var(--c-text-tertiary);
    margin-top: 2px;
    line-height: var(--lh-tight);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__hosts {
    margin-left: var(--s-1);
  }
}

.mode-badge {
  display: inline-block;
  padding: 2px var(--s-2);
  border-radius: var(--r-sm);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  text-transform: capitalize;
  line-height: var(--lh-tight);

  &--deploy {
    background: var(--c-info-bg);
    color: var(--c-info-fg);
  }

  &--import {
    background: var(--c-surface-2);
    color: var(--c-text-secondary);
  }
}

.replica-yes {
  color: var(--c-success-fg);
  font-weight: var(--fw-semibold);
}

.replica-no {
  color: var(--c-text-tertiary);
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  opacity: 0;
  transition: opacity var(--du-fast) var(--ease-out);

  &__open {
    color: var(--c-primary-fg);
    text-decoration: none;
    font-size: var(--fs-sm);
    font-weight: var(--fw-medium);

    &:hover {
      color: var(--c-primary-solid);
    }
  }

  &__more {
    color: var(--c-text-tertiary);
    cursor: pointer;
    font-size: var(--fs-md);
    padding: var(--s-1);

    &:hover {
      color: var(--c-text-primary);
    }
  }

}

::v-deep .el-table__row:hover .row-actions {
  opacity: 1;
}

::v-deep .el-table__row:focus-within .row-actions {
  opacity: 1;
}

::v-deep .el-table {
  font-size: var(--fs-sm);

  th {
    background: var(--c-surface-1);
    color: var(--c-text-secondary);
    font-weight: var(--fw-medium);
    font-size: var(--fs-xs);
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  td {
    color: var(--c-text-primary);
  }
}
</style>

<!-- 非 scoped 全局规则：el-dropdown-menu 被 Element UI teleport 到 body，scoped 选择器不可达 -->
<style lang="scss">
.row-actions__delete-item {
  color: var(--c-danger-fg) !important;

  i {
    margin-right: var(--s-1);
  }
}
</style>
