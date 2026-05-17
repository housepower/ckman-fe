<template>
  <div class="rebalance-info">
    <div v-if="!list.length && !loading" class="rebalance-info__empty">
      {{ $t('rebalance.No tables to display') }}
    </div>
    <div
      v-for="t in list"
      :key="`${t.database}.${t.table}`"
      class="rebalance-info__card"
    >
      <div class="rebalance-info__head">
        <div class="rebalance-info__name-line">
          <span class="rebalance-info__name">{{ t.database }}.{{ t.table }}</span>
          <span class="rebalance-info__engine">{{ t.engine }}</span>
        </div>
        <div class="rebalance-info__metrics">
          <span
            class="rebalance-info__imbalance"
            :class="imbalanceClass(t.imbalance_ratio)"
          >
            {{ $t('rebalance.Imbalance') }}: {{ formatPercent(t.imbalance_ratio) }}
          </span>
        </div>
      </div>

      <div
        v-if="t.warnings && t.warnings.length"
        class="rebalance-info__warnings"
      >
        <div
          v-for="(w, idx) in t.warnings"
          :key="idx"
          class="rebalance-info__warn"
        >
          <i class="el-icon-warning-outline" /> {{ w[lang] }}
        </div>
      </div>

      <el-table :data="t.shards" size="small" border>
        <el-table-column
          :label="$t('manage.shard number')"
          prop="shard_num"
          width="80"
        />
        <el-table-column :label="$t('manage.Node IP')" prop="host" />
        <el-table-column :label="$t('tables.Rows')">
          <template #default="{ row }">{{ formatRows(row.rows) }}</template>
        </el-table-column>
        <el-table-column :label="$t('tables.UnCompressed')">
          <template #default="{ row }">{{ formatBytes(row.bytes) }}</template>
        </el-table-column>
        <el-table-column :label="$t('rebalance.Compressed')">
          <template #default="{ row }">{{ formatBytes(row.compressed_bytes) }}</template>
        </el-table-column>
        <el-table-column :label="$t('rebalance.Partitions')" width="100">
          <template #default="{ row }">{{ formatRows(row.partition_count) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script lang="ts">
import { ClusterApi } from '@/apis';

interface I18nText {
  ZH: string;
  EN: string;
}

interface ShardInfo {
  host: string;
  shard_num: number;
  rows: number;
  bytes: number;
  compressed_bytes: number;
  partition_count: number;
}

interface TableInfo {
  database: string;
  table: string;
  dist_table?: string;
  engine: string;
  imbalance_ratio: number;
  warnings?: I18nText[];
  shards: ShardInfo[];
}

export default {
  props: {
    clusterName: String,
    formData: Object,
  },
  data() {
    return {
      list: [] as TableInfo[],
      loading: false,
    };
  },
  computed: {
    lang(): 'ZH' | 'EN' {
      return this.$i18n.locale.toUpperCase() === 'ZH' ? 'ZH' : 'EN';
    },
  },
  created() {
    this.getList();
  },
  methods: {
    async getList() {
      this.loading = true;
      try {
        const { clusterName, formData } = this;
        const { data: { entity } } = await ClusterApi.rebalanceInfo({
          clusterName,
          params: formData,
        });
        this.list = Array.isArray(entity) ? entity : [];
      } finally {
        this.loading = false;
      }
    },
    formatRows(n: number): string {
      if (n === null || n === undefined) return '—';
      return Number(n).toLocaleString();
    },
    formatBytes(b: number): string {
      if (!b || b === 0) return '—';
      if (b < 1024) return `${b} B`;
      if (b < 1024 * 1024) return `${(b / 1024).toFixed(2)} KiB`;
      if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(2)} MiB`;
      if (b < 1024 ** 4) return `${(b / 1024 ** 3).toFixed(2) } GiB`;
      return `${(b / 1024 ** 4).toFixed(2)} TiB`;
    },
    formatPercent(r: number): string {
      if (typeof r !== 'number' || Number.isNaN(r)) return '—';
      return `${(r * 100).toFixed(1)}%`;
    },
    // Threshold buckets chosen to match common UX guidance: < 5% effectively
    // balanced, 5-20% borderline, > 20% worth rebalancing. Non-finite values
    // (missing field, parse error) fall back to "low" so the UI doesn't
    // misleadingly paint suspect data red.
    imbalanceClass(r: number): string {
      if (typeof r !== 'number' || Number.isNaN(r)) return 'rebalance-info__imbalance--low';
      if (r < 0.05) return 'rebalance-info__imbalance--low';
      if (r < 0.2) return 'rebalance-info__imbalance--mid';
      return 'rebalance-info__imbalance--high';
    },
  },
};
</script>

<style lang="scss" scoped>
.rebalance-info {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  max-height: 500px;
  overflow-y: auto;
  padding-right: var(--s-1);

  &__empty {
    text-align: center;
    color: var(--c-text-tertiary);
    padding: var(--s-8) 0;
  }

  &__card {
    border: 1px solid var(--c-surface-3);
    border-radius: var(--r-md);
    padding: var(--s-3);
    background: var(--c-surface-0);
  }

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--s-2);
    margin-bottom: var(--s-2);
  }

  &__name-line {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    min-width: 0;
  }

  &__name {
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    font-size: var(--fs-md);
  }

  &__engine {
    font-size: var(--fs-xs);
    padding: 1px var(--s-2);
    border-radius: var(--r-sm);
    background: var(--c-surface-2);
    color: var(--c-text-secondary);
    border: 1px solid var(--c-surface-3);
  }

  &__imbalance {
    font-size: var(--fs-xs);
    padding: 2px var(--s-2);
    border-radius: var(--r-sm);
    font-weight: var(--fw-medium);

    &--low {
      color: var(--c-success-fg);
      background: var(--c-success-bg);
    }

    &--mid {
      color: var(--c-warning-fg);
      background: var(--c-warning-bg);
    }

    &--high {
      color: var(--c-danger-fg);
      background: var(--c-danger-bg);
    }
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
}
</style>
