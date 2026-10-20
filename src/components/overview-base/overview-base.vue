<template>
  <section class="overview-base">
    <template v-if="!allEmpty">
      <div
        v-for="(group, gIndex) of chartMetrics"
        :key="group.title"
        class="chart-group"
        v-show="gIndex === activeGroupIndex"
      >
        <div class="chart-grid">
          <div
            v-for="(item, mIndex) of group.metrics"
            :key="`${gIndex}-${mIndex}`"
            class="chart-card"
          >
            <p class="chart-card__title">{{ $t('ClickHouseEcharts.' + item.expect) }}</p>
            <button
              v-if="item.option && !item.isEmpty"
              class="chart-card__expand"
              :title="$t('home.Fullscreen')"
              @click="openExpand(gIndex, mIndex)"
            >
              <i class="fa fa-expand"></i>
            </button>
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

    <transition name="chart-expand-fade">
      <div
        v-if="expanded"
        class="chart-expand"
        @click.self="closeExpand"
      >
        <div class="chart-expand__panel">
          <header class="chart-expand__head">
            <span class="chart-expand__title">{{ expandedTitle }}</span>
            <button class="chart-expand__close" :title="$t('common.Close')" @click="closeExpand">
              <i class="fa fa-times"></i>
            </button>
          </header>
          <div class="chart-expand__body">
            <vue-echarts
              v-if="expandedOption"
              ref="ExpandedChart"
              :option="expandedOption"
              theme="ckman"
            />
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>
<script>
import axios from "axios";

import { chartOption } from "./chartOption";
import { MetricApi } from "@/apis";
import { tabIndexOf } from "@/constants";
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
      type: [String, Number],
      default: null,
    },
    refreshTick: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    // 只统计当前分组的指标：其余分组按需加载，没请求过不代表没数据
    allEmpty() {
      const group = this.chartMetrics[this.activeGroupIndex];
      if (!group) return false;
      const loaded = group.metrics.every(m => m.option !== null || m.isEmpty === true);
      return loaded && group.metrics.every(m => m.isEmpty === true);
    },
    expandedMetric() {
      if (!this.expanded) return null;
      const { gi, mi } = this.expanded;
      return this.chartMetrics[gi] && this.chartMetrics[gi].metrics[mi];
    },
    expandedOption() {
      return this.expandedMetric && this.expandedMetric.option;
    },
    expandedTitle() {
      return this.expandedMetric
        ? this.$t('ClickHouseEcharts.' + this.expandedMetric.expect)
        : '';
    },
    // 指标分组的切换入口在侧边栏二级菜单，选中项由 URL 的 ?tab= 决定
    activeGroupIndex() {
      return tabIndexOf(this.chartMetrics, this.$route.query.tab);
    },
  },
  data() {
    return {
      chartMetrics: [],
      expanded: null, // { gi, mi } or null
    };
  },
  mounted() {
    this.chartMetrics = (this.metrics || []).map(({ key, title, metrics }) => {
      return {
        key,
        title,
        metrics: (metrics || []).map(m => ({ ...m, option: null, isEmpty: false })),
      };
    });
    this.fetchGroup(this.activeGroupIndex);
    document.addEventListener('keydown', this.onKeydown);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.onKeydown);
    document.body.style.overflow = '';
  },
  watch: {
    timeFilter() {
      this.fetchGroup(this.activeGroupIndex);
    },
    refreshDuration() {
      this.fetchGroup(this.activeGroupIndex);
    },
    refreshTick() {
      this.fetchGroup(this.activeGroupIndex);
    },
    // 指标分组切换是路由跳转，切到哪个分组才拉哪个分组的指标
    activeGroupIndex(index) {
      this.fetchGroup(index);
    },
  },
  methods: {
    fetchGroup(groupIndex) {
      const group = this.chartMetrics[groupIndex];
      if (!group) return;
      let flatIndex = this.chartMetrics
        .slice(0, groupIndex)
        .reduce((sum, g) => sum + g.metrics.length, 0);
      group.metrics.forEach((metric) => {
        this.fetchChartData(metric, flatIndex++);
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
        // 路由跳转（切换指标分组/离开页面）会 cancel 进行中的请求，
        // 保留原状态，切回该分组时 watcher 会重新拉取
        if (axios.isCancel(e)) return;
        this.$set(chart, "isEmpty", true);
        this.$set(chart, "option", null);
      }
      this.$nextTick(() => {
        if (this.$refs.Charts && this.$refs.Charts[index]) {
          this.$refs.Charts[index].refreshChart();
        }
      });
    },
    mousemove(params, $event) { },
    openExpand(gi, mi) {
      this.expanded = { gi, mi };
      document.body.style.overflow = 'hidden';
      this.$nextTick(() => {
        const c = this.$refs.ExpandedChart;
        if (c && c.refreshChart) c.refreshChart();
      });
    },
    closeExpand() {
      this.expanded = null;
      document.body.style.overflow = '';
    },
    onKeydown(e) {
      if (e.key === 'Escape' && this.expanded) this.closeExpand();
    },
  },
};
</script>
<style lang="scss" scoped>
.overview-base {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s-3);
}

.chart-card {
  position: relative;
  background: var(--c-surface-0);
  border: 1px solid var(--c-surface-3);
  border-radius: var(--r-lg);
  padding: var(--s-3) var(--s-4) var(--s-4);
  display: flex;
  flex-direction: column;
  min-height: 320px;

  &:hover &__expand {
    opacity: 1;
  }

  &__expand {
    position: absolute;
    top: var(--s-2);
    right: var(--s-2);
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 0;
    border-radius: var(--r-sm);
    color: var(--c-text-tertiary);
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--du-fast) var(--ease-out),
                background-color var(--du-fast) var(--ease-out),
                color var(--du-fast) var(--ease-out);

    &:hover {
      background: var(--c-surface-2);
      color: var(--c-primary-solid);
    }
  }

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

// 全屏 overlay
.chart-expand {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--s-5);
  backdrop-filter: blur(2px);

  &__panel {
    width: min(1280px, 96vw);
    height: min(820px, 92vh);
    background: var(--c-surface-0);
    border-radius: var(--r-lg);
    box-shadow: 0 24px 48px -16px rgba(15, 23, 42, 0.32),
                0 8px 16px -8px rgba(15, 23, 42, 0.16);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__head {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--s-3) var(--s-4);
    border-bottom: 1px solid var(--c-surface-3);
  }

  &__title {
    font-size: var(--fs-md);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
  }

  &__close {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 0;
    border-radius: var(--r-sm);
    color: var(--c-text-tertiary);
    cursor: pointer;
    transition: background-color var(--du-fast) var(--ease-out),
                color var(--du-fast) var(--ease-out);

    &:hover {
      background: var(--c-surface-2);
      color: var(--c-text-primary);
    }
  }

  &__body {
    flex: 1;
    min-height: 0;
    padding: var(--s-3) var(--s-4) var(--s-4);

    .vue-echarts {
      width: 100% !important;
      height: 100% !important;
    }
  }
}

.chart-expand-fade-enter-active,
.chart-expand-fade-leave-active {
  transition: opacity var(--du-base) var(--ease-out);
}

.chart-expand-fade-enter,
.chart-expand-fade-leave-to {
  opacity: 0;
}
</style>
