<template>
  <section class="bgpool" v-loading="loading">
    <div class="bgpool__head">
      <h3 class="bgpool__title">{{ $t('tables.Background Pool') }}</h3>
      <el-button
        size="small"
        plain
        icon="el-icon-refresh"
        @click="fetchData"
      >{{ $t('common.Refresh') }}</el-button>
    </div>

    <div class="bgpool__nodes" v-if="servers.length">
      <article v-for="server of servers" :key="server.host" class="node-card">
        <header class="node-card__head">
          <i class="fa fa-server node-card__icon"></i>
          <span class="node-card__host">{{ server.host }}</span>
        </header>
        <div class="node-card__pools">
          <div v-for="pool of server.pools" :key="pool.name" class="pool">
            <p class="pool__name">{{ $t('tables.' + pool.name) }}</p>
            <div class="pool__track">
              <span
                class="pool__fill"
                :style="{ width: Math.min(pool.percent, 100) + '%', background: pool.color }"
              ></span>
            </div>
            <p class="pool__figures">
              <span class="pool__pct" :style="{ color: pool.color }">{{ pool.percent }}%</span>
              <span class="pool__task">{{ pool.task }}/{{ pool.size }}</span>
            </p>
          </div>
        </div>
      </article>
    </div>

    <EmptyState
      v-else-if="!loading"
      :title="$t('home.No data')"
      icon-class="el-icon-cpu"
    />
  </section>
</template>

<script>
import { TablesApi } from "@/apis";

// 固定顺序展示，保证各节点卡片的列上下对齐（接口返回的是 map）
const POOL_ORDER = ['MergesAndMutations', 'Fetches', 'Schedule', 'Move', 'Common'];

const PROGRESS_COLORS = [
  { color: '#10B981', percentage: 50 },
  { color: '#F59E0B', percentage: 70 },
  { color: '#EF4444', percentage: 85 },
  { color: '#B91C1C', percentage: 100 },
];

export default {
  name: 'BackgroundPool',
  data() {
    return {
      tableData: [],
      loading: false,
    };
  },
  computed: {
    servers() {
      return this.tableData.map(server => {
        const pool = server.background_pool || {};
        // 以 POOL_ORDER 打底，再补上接口新增的池，避免后端加池后这里看不到
        const names = POOL_ORDER.filter(name => name in pool)
          .concat(Object.keys(pool).filter(name => !POOL_ORDER.includes(name)));
        return {
          host: server.host,
          pools: names.map(name => {
            const percent = Math.round((pool[name].usage || 0) * 100);
            return {
              name,
              percent,
              task: pool[name].task,
              size: pool[name].size,
              color: this.getProgressColor(percent),
            };
          }),
        };
      });
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const {
          data: { entity },
        } = await TablesApi.backgroundpool(this.$route.params.id);
        this.tableData = entity || [];
      } catch (error) {
        console.error('Failed to fetch background pool data:', error);
        this.tableData = [];
      } finally {
        this.loading = false;
      }
    },
    getProgressColor(percentage) {
      const hit = PROGRESS_COLORS.find(item => percentage <= item.percentage);
      return (hit || PROGRESS_COLORS[PROGRESS_COLORS.length - 1]).color;
    },
  },
};
</script>

<style lang="scss" scoped>
.bgpool {
  padding: var(--s-3) 0 var(--s-6);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-3);
    margin-bottom: var(--s-4);
  }

  &__title {
    margin: 0;
    font-size: var(--fs-md);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    line-height: var(--lh-tight);
  }

  &__nodes {
    display: flex;
    flex-direction: column;
    gap: var(--s-3);
  }
}

.node-card {
  background: var(--c-surface-0);
  border: 1px solid var(--c-surface-3);
  border-radius: var(--r-lg);

  &__head {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    padding: var(--s-3) var(--s-4);
    border-bottom: 1px solid var(--c-surface-2);
  }

  &__icon {
    color: var(--c-text-tertiary);
    font-size: var(--fs-base);
  }

  &__host {
    font-size: var(--fs-md);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    font-variant-numeric: tabular-nums;
  }

  &__pools {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--s-5);
    padding: var(--s-4);
  }
}

.pool {
  min-width: 0;

  &__name {
    margin: 0 0 var(--s-2);
    font-size: var(--fs-sm);
    color: var(--c-text-secondary);
    line-height: var(--lh-tight);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__track {
    height: 6px;
    border-radius: var(--r-pill);
    background: var(--c-surface-2);
    overflow: hidden;
  }

  &__fill {
    display: block;
    height: 100%;
    border-radius: var(--r-pill);
    transition: width var(--du-base) var(--ease-out);
  }

  &__figures {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--s-2);
    margin: var(--s-2) 0 0;
    font-variant-numeric: tabular-nums;
    line-height: var(--lh-tight);
  }

  &__pct {
    font-size: var(--fs-lg);
    font-weight: var(--fw-semibold);
  }

  &__task {
    font-size: var(--fs-xs);
    color: var(--c-text-tertiary);
  }
}

@media (max-width: 1100px) {
  .node-card__pools {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--s-4);
  }
}
</style>
