# P3-overview — 集群监控页 IA 重排 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `views/overview/overview.vue` + `components/overview-base/overview-base.vue` 按 spec §8.2 重排——TimeFilter 挪到 PageHeader actions、图表 3 列网格化、ECharts 主题切换到 `'ckman'`、空数据态显示 EmptyState。**不动后端 API（`MetricApi.queryMetric`）、不动路由、不动 Metrics 常量**。

**Architecture:** 把 `timeFilter` / `refresh` state 从 `overview-base` 提升到 `overview.vue`，TimeFilter 控件随之上移到 PageHeader actions 区。`overview-base` 退化为"接收 props → watch 触发 fetch → 渲染图表网格"的纯渲染层。chart-item 从 `33%/500px` 硬编码改为 grid + 卡片化容器；vue-echarts 加 `theme="ckman"`；接口返回空时每张图独立显示 EmptyState。

**Tech Stack:** Vue 2.6 / Element UI eoi / ECharts 4 / P1 design tokens / P2 PageHeader & EmptyState / P1 注册的 `'ckman'` ECharts theme

**前置依赖：** P3-home 分支 `feat/p3-home-ia` 已完成。P3-overview 从 P3-home 拉新分支 `feat/p3-overview-ia`（顺接 P3 系列，避免每次回 P2 baseline）。

---

## File Structure

```
src/views/overview/
  overview.vue                ★ 扩充：持有 timeFilter/refresh state + PageHeader + TimeFilter

src/components/overview-base/
  overview-base.vue           ★ 重写：删 breadcrumb + 删内嵌 TimeFilter +
                                 接收 timeFilter/refresh props +
                                 watch 触发 fetch + grid 网格 + 卡片 + EmptyState
  chartOption.ts              不动（图表 series option 生成逻辑不变）

src/constants/Metrics.ts      不动（指标定义）

显式不动：
- `src/apis/metric.ts`
- `src/services/router.ts`
- 任何其他 view
- `src/components/page-header/`、`src/components/empty-state/`
- `src/app/theme/echarts-theme.ts`（'ckman' theme 已注册）
- `src/common/components/vue-echarts/`（接受 theme prop 已支持）
```

---

## Task 1: 启动 P3-overview 工作分支

**Files:**
- 无文件改动

- [ ] **Step 1: 检查 git 状态干净，且当前 HEAD 是 P3-home 分支**

Run: `git status && git branch --show-current`
Expected: `nothing to commit, working tree clean`；当前分支 `feat/p3-home-ia`。

如果不在 P3-home 分支：
```
git checkout feat/p3-home-ia
```

- [ ] **Step 2: 从 P3-home 分支创建 P3-overview 分支**

Run: `git checkout -b feat/p3-overview-ia`
Expected: `Switched to a new branch 'feat/p3-overview-ia'`

- [ ] **Step 3: 验证 baseline 编译通过**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 4: 验证 94 tokens 仍可用**

Run: `node scripts/verify-tokens.mjs`
Expected: `PASS: 94 tokens verified`

无 commit。

---

## Task 2: overview.vue 持有 state + PageHeader + TimeFilter

**Files:**
- Modify: `src/views/overview/overview.vue`

把 `timeFilter` 和 `refresh` state 从 OverviewBase 提升到 overview.vue 顶层；在 PageHeader actions 中放 TimeFilter；通过 props 把状态传给 OverviewBase。

- [ ] **Step 1: 替换 overview.vue 全文**

替换 `src/views/overview/overview.vue` 整个内容为：

```vue
<template>
  <div class="overview-page">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console'), clusterName, $t('home.Overview')]"
      :title="clusterName"
      :subtitle="$t('home.Overview')"
    >
      <template #actions>
        <time-filter
          v-model="timeFilter"
          localKey="overviewBaseTimeFilter"
          :refreshDuration.sync="refresh"
        />
      </template>
    </PageHeader>
    <overview-base
      :metrics="metrics"
      :time-filter="timeFilter"
      :refresh-duration="refresh"
    />
  </div>
</template>

<script>
import { Metrics } from "@/constants";

export default {
  name: 'Overview',
  data() {
    return {
      metrics: Metrics,
      timeFilter: ["now-1h", "now"],
      refresh: null,
    };
  },
  computed: {
    clusterName() {
      return this.$route.params.id || '';
    },
  },
};
</script>

<style lang="scss" scoped>
.overview-page {
  padding-bottom: var(--s-8);
}
</style>
```

注意：
- PageHeader / TimeFilter / OverviewBase 都已全局注册，无需 import
- `breadcrumbInfo` prop 不再传给 OverviewBase（Breadcrumb 已被 PageHeader 替代）
- 新增 `time-filter` 和 `refresh-duration` 两个 props 传给 OverviewBase（下个 task 在 OverviewBase 内接收）

- [ ] **Step 2: 加 i18n 词条 'Overview'（如不存在）**

Run: `grep -n "'Overview':" src/services/i18n.ts`

如果 `home.Overview` 未定义：

英文 home 命名空间：
```
Overview: 'Overview',
```

中文 home 命名空间：
```
Overview: '监控',
```

如果已存在（如 home 或 manage 顶部 tab 显示用到），跳过此步。

- [ ] **Step 3: yarn build 验证**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

此时 OverviewBase 仍持有自己的 timeFilter state，但 overview.vue 也持有了一份——重复但不报错。下个 task 把 OverviewBase 内的 state 删除。

- [ ] **Step 4: Commit**

```
git add src/views/overview/overview.vue src/services/i18n.ts
git commit -m "feat(overview): hoist timeFilter state to page-level + PageHeader"
```

---

## Task 3: overview-base.vue 接收 props + 删除内嵌 TimeFilter 与 breadcrumb

**Files:**
- Modify: `src/components/overview-base/overview-base.vue`

OverviewBase 从"页面级组件"退化为"图表网格渲染层"——删除 breadcrumb、删除内嵌 TimeFilter、接收 props、watch props 变化触发 fetch。

- [ ] **Step 1: 替换 overview-base.vue template 上半部分**

打开 `src/components/overview-base/overview-base.vue`，把整个 `<template>` 替换为：

```html
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
```

注意：
- 删除原 `<main class="settings">` + `<breadcrumb>` + 原 chart-item 平铺布局
- 每张图卡片化（chart-card 含 title + body）
- 三态：option 有数据 → 图表；isEmpty 标记 → EmptyState；都没有 → loading icon
- vue-echarts 加 `theme="ckman"` 启用 P1 注册的主题

- [ ] **Step 2: 替换 script props 与移除 timeFilter / refresh state**

把 `<script>` 整个替换为：

```vue
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
      // refresh ticking is owned by TimeFilter component itself; this watch is for completeness
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
```

注意：
- 删除 `breadcrumbInfo` prop
- 新增 `timeFilter` / `refreshDuration` props
- 删除原 `data()` 中的 `timeFilter` / `refresh` state（state 已上提）
- 删除 `timeFilterChange` / `timeFilterRefresh` methods（不再需要）
- 加 `watch timeFilter` 触发 fetch
- `fetchChartData` 加 try/catch + 空数据检测（设置 isEmpty 标记）
- 每个 metric 增加 `option: null, isEmpty: false` 初始字段

- [ ] **Step 3: 加 i18n 词条 'No data' 与 'No data hint'**

Run: `grep -n "'No data':" src/services/i18n.ts` 检查是否存在。

如果不存在，在 home 命名空间内加：

英文：
```
'No data': 'No data',
'No data hint': 'No metrics returned for this period. Check Prometheus integration or expand time range.',
```

中文：
```
'No data': '无数据',
'No data hint': '该时间区间未返回指标。请确认 Prometheus 接入是否正常，或扩大时间范围。',
```

- [ ] **Step 4: yarn build 验证**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 5: Commit**

```
git add src/components/overview-base/overview-base.vue src/services/i18n.ts
git commit -m "feat(overview-base): accept timeFilter/refresh props, drop internal state + breadcrumb"
```

---

## Task 4: overview-base.vue scoped style 重写（网格 + 卡片化）

**Files:**
- Modify: `src/components/overview-base/overview-base.vue`

把 `<style scoped>` 全量重写为 token 化 + 3 列 grid 网格 + 卡片化容器。

- [ ] **Step 1: 替换 `<style scoped>` 全部内容**

把 `src/components/overview-base/overview-base.vue` 文件末尾的 `<style lang="scss" scoped>` 整块替换为：

```scss
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

// 响应式：宽屏 4 列，窄屏 2 列，更窄屏 1 列
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
```

- [ ] **Step 2: yarn build 验证**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 3: Commit**

```
git add src/components/overview-base/overview-base.vue
git commit -m "feat(overview-base): grid layout + chart cards + responsive cols"
```

---

## Task 5: 全局空数据态（接口完全不可达时）

**Files:**
- Modify: `src/components/overview-base/overview-base.vue`

当 Prometheus 完全没接入时，第一个 fetch 即报错；每张图独立显示 EmptyState 较繁琐。补充顶层空数据态：当所有图都 isEmpty 时，显示一个大的 EmptyState 替代整个网格。

- [ ] **Step 1: 在 script 加 computed allEmpty**

在 `src/components/overview-base/overview-base.vue` 的 `<script>` `data()` 之前加 `computed`：

```js
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
```

如果 `computed` 已存在（应该不存在），把 allEmpty 加到其中。

- [ ] **Step 2: 在 template 顶部包裹空数据态条件渲染**

把 `<section class="overview-base">` 内的 `<div v-for="(group, gIndex) of chartMetrics" ...>` 整块用 `v-if="!allEmpty"` 包，再加 `v-else` 分支显示 EmptyState：

```html
<template>
  <section class="overview-base">
    <template v-if="!allEmpty">
      <div v-for="(group, gIndex) of chartMetrics" :key="group.title" class="chart-group">
        <!-- ...原内容不变... -->
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
```

- [ ] **Step 3: 加 i18n 词条**

在 src/services/i18n.ts home 命名空间内加：

英文：
```
'Metrics unavailable': 'Metrics unavailable',
'Metrics unavailable hint': 'Could not load metrics. Verify Prometheus integration is configured for this cluster.',
```

中文：
```
'Metrics unavailable': '指标暂不可用',
'Metrics unavailable hint': '无法加载监控指标。请确认本集群的 Prometheus 接入配置已生效。',
```

- [ ] **Step 4: yarn build 验证**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 5: Commit**

```
git add src/components/overview-base/overview-base.vue src/services/i18n.ts
git commit -m "feat(overview-base): show global EmptyState when all charts fail/empty"
```

---

## Task 6: 全局验证

**Files:**
- 无文件改动

- [ ] **Step 1: yarn build**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 2: verify-tokens**

Run: `node scripts/verify-tokens.mjs`
Expected: `PASS: 94 tokens verified`

- [ ] **Step 3: lint:style**

Run: `yarn lint:style 2>&1 | grep -c " error " || echo 0`
Expected: `0`

- [ ] **Step 4: 后端契约 0 变更**

Run: `git diff feat/p3-home-ia..HEAD --stat -- src/apis/`
Expected: 输出为空。

- [ ] **Step 5: 路由 0 变更**

Run: `git diff feat/p3-home-ia..HEAD --stat -- src/services/router.ts`
Expected: 输出为空。

- [ ] **Step 6: 仅 overview + overview-base + i18n 改动**

Run: `git diff feat/p3-home-ia..HEAD --stat -- src/views/ src/components/ src/services/`
Expected: 只有
- `src/views/overview/overview.vue`
- `src/components/overview-base/overview-base.vue`
- `src/services/i18n.ts`

无 commit。

---

## Task 7: walkthrough 记录

**Files:**
- Create: `docs/superpowers/plans/p3-overview-screenshots/walkthrough.md`

- [ ] **Step 1: 创建 walkthrough.md**

Create `docs/superpowers/plans/p3-overview-screenshots/walkthrough.md`：

```markdown
# P3-overview 走查记录

## 自动化验证

| 项 | 结果 |
|---|---|
| yarn build | PASS |
| verify-tokens (94 tokens) | PASS |
| yarn lint:style | <填实际：warnings / 0 errors> |
| 后端契约 0 变更（src/apis） | PASS（空） |
| 路由 0 变更 | PASS（空） |
| 仅 overview + overview-base + i18n 改动 | PASS |

## 人工验证待补

### 视觉
- [ ] 顶部 PageHeader 显示 crumb + cluster 名（title）+ Overview（subtitle）
- [ ] 顶部右侧 TimeFilter 控件可见，初始 "now-1h to now"
- [ ] 主体图表 3 列网格（宽屏 1600px+ 4 列，窄屏 1200- 2 列，<768px 1 列）
- [ ] 每张图卡片化：白底圆角 + 标题在上 + ECharts 在下
- [ ] ECharts 使用 'ckman' 主题（主色金色 #C9A100、辅色钢蓝/深绿/砖红）
- [ ] 分组标题 "ClickHouse Table KPIs" / "ClickHouse Node KPIs" 在网格之上

### 交互
- [ ] 调整 TimeFilter 时间范围 → 所有图表自动刷新
- [ ] 调整 TimeFilter 实时刷新间隔 → 图表周期性刷新
- [ ] 鼠标 hover 某张图表 → 所有图表的 axisPointer 同步移动（echarts.connect）

### 空数据
- [ ] 单张图无数据时显示 EmptyState（标题 "No data" + 提示）
- [ ] 完全不可达 Prometheus 时显示顶层 EmptyState（"Metrics unavailable" + 提示）

### 旧 breadcrumb 已删除
- [ ] 旧 overview-base 顶部的 `<breadcrumb>` 不再出现（PageHeader 替代）

## 已知边角

- ECharts 'ckman' 主题需要 P1 注册（src/app/theme/echarts-theme.ts），未注册时回退默认主题（可视化但配色与品牌不一致）
- 响应式断点 1600 / 1200 / 768 是经验值；如需调整修改 .chart-grid @media 块
- 图表卡片 min-height 320px 是经验值；如果某张图内容很高（如分组柱状图）可能溢出，需个别调整

## 验收结论

- [x] yarn build 通过
- [x] verify-tokens 94 tokens
- [x] lint:style 0 errors
- [x] 后端契约 0 变更
- [x] 仅 overview + overview-base + i18n 改动
- [ ] 视觉与交互人工验证待补
- [ ] ECharts 主题应用正确人工验证待补
```

- [ ] **Step 2: Commit**

```
git add docs/superpowers/plans/p3-overview-screenshots/
git commit -m "docs(p3-overview): walkthrough automation results"
```

---

## P3-overview 验收清单（整体）

- [ ] `yarn build` 通过
- [ ] `verify-tokens` 94 tokens
- [ ] `lint:style` 0 errors
- [ ] `src/apis/` 0 改动
- [ ] `src/services/router.ts` 0 改动
- [ ] 仅 overview.vue / overview-base.vue / i18n.ts 改动
- [ ] PageHeader + TimeFilter 在 actions 区
- [ ] 图表网格化 3 列（响应式 4/2/1）
- [ ] ECharts 主题 'ckman'
- [ ] 单图空数据 EmptyState
- [ ] 全局 EmptyState（全部 fail/empty 时）

---

## 不在 P3-overview 范围

- ❌ Prometheus 接入文档链接（subtitle 提示已足够；具体接入入口由后端定）
- ❌ 修改 Metrics 常量（指标列表本身）
- ❌ chartOption.ts 修改（series option 仍由原函数生成）
- ❌ TimeFilter 控件本身重做
- ❌ vue-echarts 包装组件改造

---

## 风险与提醒

| 风险 | 提醒 |
|---|---|
| TimeFilter 控件高度可能与 PageHeader 不对齐 | PageHeader actions 区有 `align-items: center`；TimeFilter 默认 medium 高度应可适配。如果错位，在 overview.vue scoped style 内对 PageHeader actions 加 align-items 微调 |
| ECharts theme 'ckman' 必须在 mounted 前注册 | P1 任务已通过 src/app/index.ts 在应用启动时注册；如果应用启动顺序变化导致 theme 未注册，vue-echarts 会回退到 default theme（视觉降级但不报错）|
| `echarts.connect(chartInstances)` 在卡片化布局下可能慢 | 现有 connect 行为不变，仅渲染容器尺寸改变 |
| `isEmpty` 标记可能在 fetch 仍在进行时短暂为 true | `mounted()` 中初始化 `isEmpty: false`；fetchChartData 完成才设 true。中间窗口期会显示 loading icon |
| `allEmpty` computed 在异步 fetch 全部完成前会返回 false | 只有所有图都"加载完成"（option ≠ null 或 isEmpty === true）才计算 allEmpty，避免误判 |
| `OverviewBase` 在 src/components/ 下被视为通用组件 | 实际 grep 显示仅 overview.vue 使用；改造它等于改造 overview 页的实现细节，可接受 |
| metrics prop 数据流 | overview.vue 仍传 Metrics 常量给 OverviewBase，OverviewBase 在 mounted 中重塑为 chartMetrics 内部 state；i18n key 'ClickHouseEcharts.*' 保持不变 |
