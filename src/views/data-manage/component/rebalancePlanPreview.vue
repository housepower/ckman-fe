<template>
  <div class="plan-preview">
    <div v-if="plan && plan.except_shard_drain" class="plan-preview__drain">
      <i class="el-icon-info" />
      {{ $t('rebalance.Drain Notice') }}:
      <strong>{{ plan.except_shard_drain.src_host }}</strong>
      → <strong>{{ plan.except_shard_drain.dst_host }}</strong>
    </div>

    <div v-if="!plan || !plan.tables || !plan.tables.length" class="plan-preview__empty">
      {{ $t('rebalance.No moves needed') }}
    </div>

    <div
      v-for="t in (plan && plan.tables) || []"
      :key="`${t.database}.${t.table}`"
      class="plan-preview__card"
    >
      <div class="plan-preview__head">
        <span class="plan-preview__name">{{ t.database }}.{{ t.table }}</span>
        <span class="plan-preview__strategy">{{ strategyLabel(t.strategy) }}</span>
        <span v-if="t.engine" class="plan-preview__engine">{{ t.engine }}</span>
      </div>

      <div
        v-if="t.warnings && t.warnings.length"
        class="plan-preview__warnings"
      >
        <div
          v-for="(w, idx) in t.warnings"
          :key="idx"
          class="plan-preview__warn"
        >
          <i class="el-icon-warning-outline" /> {{ w[lang] }}
        </div>
      </div>

      <!-- partition strategy: concrete moves -->
      <template v-if="t.strategy === 'partition'">
        <div v-if="!t.moves || !t.moves.length" class="plan-preview__none">
          {{ $t('rebalance.No partitions to move') }}
        </div>
        <el-table v-else :data="t.moves" size="small" border>
          <el-table-column :label="$t('rebalance.Partition')" prop="partition" />
          <el-table-column :label="$t('rebalance.From Host')" prop="src_host" />
          <el-table-column :label="$t('rebalance.To Host')" prop="dst_host" />
          <el-table-column :label="$t('rebalance.Compressed')" width="120">
            <template #default="{ row }">{{ formatBytes(row.bytes) }}</template>
          </el-table-column>
        </el-table>
        <div v-if="t.moves && t.moves.length" class="plan-preview__summary">
          {{ t.moves.length }} {{ $t('rebalance.partition(s)') }},
          {{ formatBytes(totalMoveBytes(t.moves)) }} {{ $t('rebalance.total') }}
        </div>
      </template>

      <!-- shardingkey strategy: reshuffle summary -->
      <template v-else-if="t.strategy === 'shardingkey' && t.reshuffle">
        <div class="plan-preview__reshuffle">
          <div class="plan-preview__stat">
            <span class="plan-preview__stat-label">{{ $t('rebalance.Sharding Key') }}</span>
            <span class="plan-preview__stat-value">{{ t.reshuffle.sharding_key || '—' }}</span>
          </div>
          <div class="plan-preview__stat">
            <span class="plan-preview__stat-label">{{ $t('tables.Rows') }}</span>
            <span class="plan-preview__stat-value">{{ formatRows(t.reshuffle.total_rows) }}</span>
          </div>
          <div class="plan-preview__stat">
            <span class="plan-preview__stat-label">{{ $t('tables.UnCompressed') }}</span>
            <span class="plan-preview__stat-value">{{ formatBytes(t.reshuffle.total_bytes) }}</span>
          </div>
          <div class="plan-preview__stat">
            <span class="plan-preview__stat-label">{{ $t('rebalance.Tmp Disk Need') }}</span>
            <span class="plan-preview__stat-value">{{ formatBytes(t.reshuffle.compressed_bytes) }}</span>
          </div>
          <div class="plan-preview__stat">
            <span class="plan-preview__stat-label">{{ $t('manage.shard number') }}</span>
            <span class="plan-preview__stat-value">{{ t.reshuffle.shards }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
interface I18nText {
  ZH: string;
  EN: string;
}

interface PartitionMove {
  partition: string;
  src_host: string;
  dst_host: string;
  bytes: number;
}

interface ReshuffleSummary {
  total_rows: number;
  total_bytes: number;
  compressed_bytes: number;
  shards: number;
  sharding_key: string;
}

interface TablePlan {
  database: string;
  table: string;
  strategy: string;
  engine: string;
  moves?: PartitionMove[];
  reshuffle?: ReshuffleSummary;
  warnings?: I18nText[];
}

interface RebalancePlan {
  except_shard_drain?: { src_host: string; dst_host: string };
  tables: TablePlan[];
}

export default {
  props: {
    plan: Object as () => RebalancePlan,
  },
  computed: {
    lang(): 'ZH' | 'EN' {
      return this.$i18n.locale.toUpperCase() === 'ZH' ? 'ZH' : 'EN';
    },
  },
  methods: {
    strategyLabel(s: string): string {
      if (s === 'partition') return this.$t('rebalance.By Partition');
      if (s === 'shardingkey') return this.$t('rebalance.By Sharding Key');
      return s;
    },
    formatRows(n: number): string {
      if (typeof n !== 'number' || Number.isNaN(n)) return '—';
      return n.toLocaleString();
    },
    formatBytes(b: number): string {
      if (!b || b === 0) return '—';
      if (b < 1024) return `${b} B`;
      if (b < 1024 ** 2) return `${(b / 1024).toFixed(2)} KiB`;
      if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(2)} MiB`;
      if (b < 1024 ** 4) return `${(b / 1024 ** 3).toFixed(2)} GiB`;
      return `${(b / 1024 ** 4).toFixed(2)} TiB`;
    },
    totalMoveBytes(moves: PartitionMove[]): number {
      return moves.reduce((sum, m) => sum + (m.bytes || 0), 0);
    },
    // Called by the modal harness when the user clicks "Execute". Resolves
    // the modal promise with a truthy value so rebalance.vue knows to
    // proceed; cancelling instead rejects with 'cancel'.
    onOk() {
      return 'execute';
    },
  },
};
</script>

<style lang="scss" scoped>
.plan-preview {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  max-height: 500px;
  overflow-y: auto;
  padding-right: var(--s-1);

  &__drain {
    background: var(--c-info-bg);
    color: var(--c-info-fg);
    border: 1px solid var(--c-info-border);
    border-radius: var(--r-sm);
    padding: var(--s-2) var(--s-3);
    font-size: var(--fs-sm);

    .el-icon-info {
      margin-right: var(--s-1);
    }
  }

  &__empty,
  &__none {
    text-align: center;
    color: var(--c-text-tertiary);
    padding: var(--s-4) 0;
    font-size: var(--fs-sm);
  }

  &__card {
    border: 1px solid var(--c-surface-3);
    border-radius: var(--r-md);
    padding: var(--s-3);
    background: var(--c-surface-0);
  }

  &__head {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    margin-bottom: var(--s-2);
    flex-wrap: wrap;
  }

  &__name {
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    font-size: var(--fs-md);
  }

  &__strategy {
    font-size: var(--fs-xs);
    padding: 2px var(--s-2);
    border-radius: var(--r-sm);
    background: var(--c-primary-bg);
    color: var(--c-primary-fg);
    border: 1px solid var(--c-primary-border);
    font-weight: var(--fw-medium);
  }

  &__engine {
    font-size: var(--fs-xs);
    padding: 1px var(--s-2);
    border-radius: var(--r-sm);
    background: var(--c-surface-2);
    color: var(--c-text-secondary);
    border: 1px solid var(--c-surface-3);
  }

  &__warnings {
    margin-bottom: var(--s-2);
    display: flex;
    flex-direction: column;
    gap: var(--s-1);
  }

  &__warn {
    font-size: var(--fs-xs);
    color: var(--c-warning-fg);
    background: var(--c-warning-bg);
    padding: var(--s-1) var(--s-2);
    border-radius: var(--r-sm);
    border-left: 3px solid var(--c-warning-solid);

    .el-icon-warning-outline {
      margin-right: var(--s-1);
    }
  }

  &__summary {
    font-size: var(--fs-xs);
    color: var(--c-text-secondary);
    text-align: right;
    margin-top: var(--s-2);
  }

  &__reshuffle {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--s-3);
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--s-2);
    background: var(--c-surface-1);
    border-radius: var(--r-sm);
  }

  &__stat-label {
    font-size: var(--fs-xs);
    color: var(--c-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__stat-value {
    font-size: var(--fs-md);
    color: var(--c-text-primary);
    font-weight: var(--fw-medium);
  }
}
</style>
