<template>
  <section class="overview-base">
    <template v-if="!allEmpty">
      <div v-for="(group, gIndex) of chartMetrics" :key="group.title" class="chart-group">
        <h2 class="chart-group__title">{{ $t('ClickHouseEcharts.' + group.title) }}</h2>
        <div class="chart-grid">
          <div
            v-for="(item, mIndex) of group.metrics"
            :key="`${gIndex}-${mIndex}`"
            class="chart-card"
          >
            <p class="chart-card__title">{{ $t('ClickHouseEcharts.' + item.expect) }}</p>
            <div class="chart-card__body">
              <vue-echarts
                v-if="item.option && !item.isEmpty"
                ref="Charts"
                :option="item.option"
                theme="ckman"
                @mousemove.native="mousemove('series', $event)"
              />
              <EmptyState
                v-else-if="item.isEmpty"
                :title="$t('home.No data')"
                :description="$t('home.No data hint')"
                icon-class="el-icon-data-line"
                compact
              />
              <div v-else class="chart-card__loading">
                <i class="el-icon-loading"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <EmptyState
      v-else
      :title="$t('home.Metrics unavailable')"
      :description="$t('home.Metrics unavailable hint')"
      icon-class="el-icon-data-analysis"
    />
  </section>
</template>
<script>
import echarts from "echarts";
import { chartOption } from "./chartOption";
import { MetricApi } from "@/apis";
import { convertTimeBounds } from "@/helpers";

export default {
  name: 'OverviewBase',
  props: {
    metrics: {
      type: Array,
      default: () => [],
    },
    timeFilter: {
      type: Array,
      default: () => ["now-1h", "now"],
    },
    refreshDuration: {
      type: Number,
      default: null,
    },
  },
  computed: {
    allEmpty() {
      if (!this.chartMetrics.length) return false;
      const allLoaded = this.chartMetrics.every(g =>
        g.metrics.every(m => m.option !== null || m.isEmpty === true)
      );
      if (!allLoaded) return false;
      return this.chartMetrics.every(g =>
        g.metrics.every(m => m.isEmpty === true)
      );
    },
  },
  data() {
    return {
      chartMetrics: [],
    };
  },
  mounted() {
    this.chartMetrics = (this.metrics || []).map(({ title, metrics }) => {
      return {
        title,
        metrics: (metrics || []).map(m => ({ ...m, option: null, isEmpty: false })),
      };
    });
    this.fetchData();
  },
  watch: {
    timeFilter() {
      this.fetchData();
    },
    refreshDuration() {
      this.fetchData();
    },
  },
  methods: {
    fetchData() {
      this.chartMetrics.forEach((group) => {
        group.metrics.forEach((metric, index) => {
          this.fetchChartData(metric, index);
        });
      });
    },
    async fetchChartData(chart, index) {
      const { duration, min, max } = convertTimeBounds(this.timeFilter);
      let step = Math.floor(+duration / 360 / 1000);
      step = step < 60 ? 60 : step;
      try {
        const {
          data: { entity },
        } = await MetricApi.queryMetric(this.$route.params.id, {
          metric: chart.expect,
          start: Math.floor(min / 1000),
          end: Math.floor(max / 1000),
          step,
        });
        const hasData = Array.isArray(entity) && entity.length > 0;
        this.$set(chart, "isEmpty", !hasData);
        if (hasData) {
          this.$set(chart, "option", chartOption(entity, min, max));
        }
      } catch (e) {
        this.$set(chart, "isEmpty", true);
        this.$set(chart, "option", null);
      }
      this.$nextTick(() => {
        if (this.$refs.Charts && this.$refs.Charts[index]) {
          this.$refs.Charts[index].refreshChart();
          const chartInstances = (this.$refs.Charts || []).map((item) => item.chart);
          echarts.connect(chartInstances);
        }
      });
    },
    mousemove(params, $event) { },
  },
};
</script>
<style lang="scss" scoped>
.overview-base {
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
}

.chart-group {
  &__title {
    font-size: var(--fs-lg);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    margin: 0 0 var(--s-3);
    line-height: var(--lh-tight);
  }
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s-3);
}

.chart-card {
  background: var(--c-surface-0);
  border: 1px solid var(--c-surface-3);
  border-radius: var(--r-lg);
  padding: var(--s-3) var(--s-4) var(--s-4);
  display: flex;
  flex-direction: column;
  min-height: 320px;

  &__title {
    font-size: var(--fs-sm);
    font-weight: var(--fw-medium);
    color: var(--c-text-secondary);
    margin: 0 0 var(--s-2);
    line-height: var(--lh-tight);
    min-height: 2.5em;
  }

  &__body {
    flex: 1;
    min-height: 240px;
    position: relative;

    .vue-echarts {
      width: 100% !important;
      height: 100% !important;
    }
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--c-text-tertiary);
    font-size: var(--fs-xl);
  }
}

@media (min-width: 1600px) {
  .chart-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .chart-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
