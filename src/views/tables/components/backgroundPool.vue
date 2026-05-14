<template>
  <div class="bgpool">
    <div class="bgpool__header">
      <span class="bgpool__title">{{ $t('tables.Background Pool') }}</span>
      <el-select
        v-model="selectedHost"
        placeholder="select host"
        class="bgpool__host"
        @change="handleHostChange"
      >
        <el-option
          v-for="server in tableData"
          :key="server.host"
          :label="server.host"
          :value="server.host"
        />
      </el-select>
    </div>

    <div v-if="currentServer" class="bgpool__board">
      <div class="bgpool__grid">
        <div
          v-for="(pool, name) in currentServer.background_pool"
          :key="name"
          class="bgpool__item"
        >
          <el-progress
            type="circle"
            :percentage="Math.round(pool.usage * 100)"
            :color="getProgressColor(pool.usage * 100)"
            :width="110"
            :stroke-width="8"
          >
            <template #default="{ percentage }">
              <div class="bgpool__progress">
                <span class="bgpool__progress-pct">{{ percentage }}%</span>
                <span class="bgpool__progress-task">{{ pool.task }}/{{ pool.size }}</span>
              </div>
            </template>
          </el-progress>
          <div class="bgpool__name">{{ name }}</div>
        </div>
      </div>
    </div>

    <el-empty
      v-else-if="!currentServer && tableData.length > 0"
      :description="$t('common.No Data')"
    />
  </div>
</template>

<script>
import { TablesApi } from "@/apis";

export default {
  name: 'BackgroundPool',
  data() {
    return {
      tableData: [],
      selectedHost: '',
      currentServer: null,
      progressColors: [
        { color: '#10B981', percentage: 50 },
        { color: '#F59E0B', percentage: 70 },
        { color: '#EF4444', percentage: 85 },
        { color: '#B91C1C', percentage: 100 },
      ],
    };
  },
  watch: {
    tableData: {
      immediate: true,
      handler(newVal) {
        if (newVal && newVal.length > 0) {
          this.selectedHost = newVal[0].host;
          this.currentServer = newVal[0];
        } else {
          this.currentServer = null;
        }
      },
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    handleHostChange(host) {
      this.currentServer = this.tableData.find(
        (server) => server.host === host
      );
    },
    async fetchData() {
      try {
        const {
          data: { entity },
        } = await TablesApi.backgroundpool(this.$route.params.id);
        this.tableData = entity || [];
      } catch (error) {
        console.error('Failed to fetch background pool data:', error);
        this.tableData = [];
      }
    },
    getProgressColor(percentage) {
      const roundedPercentage = Math.round(percentage);
      for (const item of this.progressColors) {
        if (roundedPercentage <= item.percentage) {
          return item.color;
        }
      }
      return this.progressColors[this.progressColors.length - 1].color;
    },
  },
};
</script>

<style lang="scss" scoped>
.bgpool {
  padding: var(--s-3) 0 var(--s-6);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-3);
    margin-bottom: var(--s-4);
  }

  &__title {
    font-size: var(--fs-md);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    line-height: var(--lh-tight);
  }

  &__host {
    width: 240px;
  }

  &__board {
    background: var(--c-surface-0);
    border: 1px solid var(--c-surface-3);
    border-radius: var(--r-lg);
    padding: var(--s-5);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--s-4) var(--s-3);
    justify-items: center;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--s-3) var(--s-2);
    border-radius: var(--r-md);
    transition: background-color var(--du-fast) var(--ease-out);

    &:hover {
      background: var(--c-surface-1);
    }
  }

  &__progress {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: var(--lh-tight);
  }

  &__progress-pct {
    font-size: var(--fs-xl);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    font-variant-numeric: tabular-nums;
  }

  &__progress-task {
    font-size: var(--fs-xs);
    color: var(--c-text-tertiary);
    margin-top: 2px;
    font-variant-numeric: tabular-nums;
  }

  &__name {
    margin-top: var(--s-2);
    font-size: var(--fs-sm);
    font-weight: var(--fw-medium);
    color: var(--c-text-secondary);
    text-align: center;
    word-break: break-word;
    max-width: 140px;
    line-height: var(--lh-normal);
  }
}

@media (max-width: 768px) {
  .bgpool {
    &__grid {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: var(--s-3);
    }

    &__host {
      width: 180px;
    }
  }
}
</style>
