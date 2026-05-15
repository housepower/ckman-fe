<template>
  <section class="home">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console')]"
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
        <div class="stat-card__icon"><i class="fa fa-cubes"></i></div>
        <div class="stat-card__body">
          <div class="stat-card__label">{{ $t('home.Total') }}</div>
          <div class="stat-card__value">{{ stats.total }}</div>
        </div>
      </div>
      <div class="stat-card stat-card--deploy">
        <div class="stat-card__icon"><i class="fa fa-rocket"></i></div>
        <div class="stat-card__body">
          <div class="stat-card__label">{{ $t('home.Deploy') }}</div>
          <div class="stat-card__value">{{ stats.deploy }}</div>
        </div>
      </div>
      <div class="stat-card stat-card--import">
        <div class="stat-card__icon"><i class="fa fa-download"></i></div>
        <div class="stat-card__body">
          <div class="stat-card__label">{{ $t('home.Import') }}</div>
          <div class="stat-card__value">{{ stats.import }}</div>
        </div>
      </div>
      <div class="stat-card stat-card--replica">
        <div class="stat-card__icon"><i class="fa fa-clone"></i></div>
        <div class="stat-card__body">
          <div class="stat-card__label">{{ $t('home.Replica') }}</div>
          <div class="stat-card__value">{{ stats.replica }}</div>
        </div>
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
          min-width="220"
          :label="$t('home.Cluster')"
        >
          <template #default="{ row }">
            <div class="cluster-cell">
              <i class="cluster-cell__icon fa fa-database"></i>
              <div class="cluster-cell__main">
                <div class="cluster-cell__name">{{ row.cluster }}</div>
                <div v-if="row.comment" class="cluster-cell__comment">{{ row.comment }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="logic_cluster"
          sortable
          min-width="140"
          :label="$t('home.Logic Name')"
        >
          <template #default="{ row }">
            <span v-if="row.logic_cluster">{{ row.logic_cluster }}</span>
            <span v-else class="cell-empty">—</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="count"
          sortable
          width="100"
          align="right"
          :label="$t('home.Nodes')"
        >
          <template #default="{ row }">
            <span class="cell-count">{{ row.count }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="hosts"
          min-width="240"
          :label="$t('home.ClickHouse Node IP')"
        >
          <template #default="{ row }">
            <span class="cell-hosts">{{ row.hosts }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="mode"
          width="100"
          :label="$t('home.Mode')"
        >
          <template #default="{ row }">
            <span class="mode-badge" :class="`mode-badge--${row.mode}`">{{ modeLabel(row.mode) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="isReplica"
          width="90"
          align="center"
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
import { ClusterApi } from "@/apis";
export default {
  name: "Home",
  data() {
    return {
      list: [],
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
    importCk() {
      this.$router.push({ name: 'importCluster' });
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
    modeLabel(mode) {
      if (!mode) return '';
      const key = `home.${mode.charAt(0).toUpperCase()}${mode.slice(1)}`;
      return this.$t(key);
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
  display: flex;
  align-items: center;
  gap: var(--s-3);
  background: var(--c-surface-0);
  border: 1px solid var(--c-surface-3);
  border-radius: var(--r-lg);
  padding: var(--s-3) var(--s-4);
  overflow: hidden;
  transition: border-color var(--du-fast) var(--ease-out),
              box-shadow var(--du-fast) var(--ease-out);

  &:hover {
    border-color: var(--c-surface-4, var(--c-surface-3));
    box-shadow: 0 4px 12px -6px rgba(15, 23, 42, 0.08);
  }

  &__icon {
    flex: 0 0 auto;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  &__body {
    min-width: 0;
    flex: 1;
  }

  &--total &__icon {
    background: rgba(201, 161, 0, 0.10);
    color: var(--c-primary-solid);
  }
  &--deploy &__icon {
    background: var(--c-info-bg);
    color: var(--c-info-solid);
  }
  &--import &__icon {
    background: var(--c-surface-2);
    color: var(--c-text-secondary);
  }
  &--replica &__icon {
    background: var(--c-success-bg);
    color: var(--c-success-solid);
  }

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
  align-items: flex-start;
  gap: var(--s-2);

  &__icon {
    flex-shrink: 0;
    width: 16px;
    margin-top: 4px;
    font-size: 14px;
    color: var(--c-primary-solid);
    text-align: center;
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

  &__comment {
    margin-top: 2px;
    font-size: var(--fs-xs);
    color: var(--c-text-tertiary);
    line-height: var(--lh-normal);
    word-break: break-word;
  }
}

.cell-empty {
  color: var(--c-text-tertiary);
}

.cell-count {
  font-variant-numeric: tabular-nums;
  font-weight: var(--fw-medium);
  color: var(--c-text-primary);
}

.cell-hosts {
  font-family: var(--f-mono);
  font-size: var(--fs-xs);
  color: var(--c-text-secondary);
  word-break: break-all;
  line-height: var(--lh-normal);
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
