<template>
  <section class="overview-base">
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
