# ckman-fe 整站视觉精雕 — 设计文档

**日期**：2026-05-14
**类型**：UI 重构（视觉精雕 / IA 调整）
**范围**：ckman-fe 全部 12 个 view（home / home-setting / login / overview / manage / tables / data-manage / session / query-execution / settings / task / docs）+ 共享组件 + 全局样式
**硬约束**：不动 Vue 2 / Element UI eoi 主版本；不动后端 API 契约；不动路由 URL

---

## 1. 目标与非目标

### 1.1 目标

本次重构通过纯 CSS / Vue template 层面的改造，达成四个目标：

1. **代码现代化**（受限版）：建立 design tokens 体系，消除硬编码色值与魔数；不做 Vue/Element 主版本迁移
2. **UI 库视觉升级**（受限版）：通过 Element UI SCSS 变量覆盖 + vxe-table override，把视觉拉到现代 SaaS 后台水准；不替换库
3. **视觉精雕**：色板、字体、间距、动效、四态（空/加载/错误/正常）系统化；保留品牌金色 `#C9A100`
4. **信息架构优化**：6 个高频页面重排，去掉无效 hero、加状态汇总、统一工具栏、收敛操作菜单

### 1.2 非目标（明确划清）

- Vue 2 → Vue 3 迁移
- Element UI 2 → Element Plus 迁移
- Vuex → Pinia / vue-cli → Vite
- ECharts 4 → 5（除非主题适配必须）
- TypeScript 严格模式
- `src/apis/*` 任何函数签名 / URL / payload 变更
- 路由 URL 变更（书签必须仍可用）
- 暗色模式（仅亮色）
- i18n 文案重写（仅修订错位 / 裸 key）
- E2E 自动化测试套件

---

## 2. 视觉锚点（已敲定）

| 项 | 决策 |
|---|---|
| 视觉方向 | **A. 精炼现代**（Refined Modern）— 金色收敛为强调色，深色顶栏，状态语义化，卡片化容器 |
| 主色 | **`#C9A100` 原色保留**（品牌锚定不变） |
| 主题 | **仅亮色**（保留 `--c-*` 变量结构，后续可扩暗色） |
| Layout 形态 | **L2** — 深色顶栏 `#1a1d23` + 金色下边线 + 集群子页 tab 上移（删除底栏） |
| 主字体 | **Inter**（en）+ **JetBrains Mono**（数字 / 代码）+ 系统中文回退（PingFang SC / Microsoft YaHei） |
| 字体托管 | 自托管 woff2，font-display: swap，仅预加载 Inter regular/medium |
| 表格密度 | **舒适** — 行高 40px / 字号 13px（Element UI medium 同款） |
| 6 个 IA 重排页面 | home / overview / manage / tables / data-manage / query-execution |
| 6 个仅 token 升级页面 | login / home-setting / session / settings / task / docs |

---

## 3. Design Tokens 体系

### 3.1 文件结构

```
src/app/
  variables.scss               # 删除（迁入 _tokens.scss）
  theme/
    _tokens.scss               # 新建 - 所有 token 的单一来源
    _element-ui-override.scss  # 新建 - 喂给 Element UI SCSS 变量
    _vxe-table-override.scss   # 新建 - 喂给 vxe-table
    _echarts-theme.ts          # 新建 - ECharts 主题对象
  global.scss                  # 改造 - 仅 @import tokens + override
```

### 3.2 Token 七族

| 族 | 命名前缀 | 例 | 数量 |
|---|---|---|---|
| Color · 基色 | `--c-gold-{50,100,…,900}` / `--c-gray-{50,100,…,900}` | `--c-gold-500: #C9A100` | 20 |
| Color · 语义 | `--c-{primary,success,warning,danger,info}-{bg,border,fg,solid}` | `--c-success-solid: #10b981` | 20 |
| Color · 表面 | `--c-surface-{0,1,2,3}` / `--c-text-{primary,secondary,tertiary,disabled}` | `--c-surface-0: #fff` | 8 |
| Spacing | `--s-{0,1,2,3,4,5,6,8,10,12,16,20,24}`（步进 4px） | `--s-3: 12px` | 13 |
| Radius | `--r-{sm,md,lg,pill}` | `--r-md: 6px` | 4 |
| Shadow | `--sh-{xs,sm,md,lg,inset}` | `--sh-sm: 0 1px 2px rgba(0,0,0,0.04)` | 5 |
| Type | `--f-{display,body,mono}` / `--fs-{xs..3xl}` / `--fw-{regular,medium,semibold,bold}` / `--lh-{tight,normal,relaxed}` | `--fs-base: 13px` | 19 |
| Motion | `--du-{fast,base,slow}` / `--ease-{out,in-out}` | `--du-base: 180ms` | 5 |

### 3.3 关键约束

- **基色锚定**：`--c-gold-500: #C9A100`，其他 9 阶用 HSL 调整算法派生（保证色阶平滑）；中性灰族同理以 `--c-gray-700: #1a1d23` 作锚（顶栏色）
- **用途名 > 物理名**：组件层只能用 `--c-primary-solid`、`--c-text-primary` 等用途名；不能直接 `--c-gold-500`，方便整体换色
- **Element UI 兼容层**：`_element-ui-override.scss` 内用 `var(--c-*)` 喂入所有 `$--color-*`、`$--border-color-*`、`$--background-color-*` 等 SCSS 变量
- **零硬编码**：所有 `.vue/.scss` 不允许 `#xxxxxx`、`px`（1px 边线、border-radius 等白名单除外）；用 stylelint 规则在 CI 阻塞合并

### 3.4 Element UI 变量映射

| Element UI 变量 | Token 来源 |
|---|---|
| `$--color-primary` | `--c-gold-500` |
| `$--color-success` / `warning` / `danger` / `info` | `--c-{success,warning,danger,info}-solid` |
| `$--color-text-primary` / `regular` / `secondary` / `placeholder` | `--c-text-{primary,secondary,tertiary,disabled}` |
| `$--border-color-base` / `light` / `lighter` / `extra-light` | `--c-gray-{300,200,100,50}` |
| `$--background-color-base` | `--c-surface-1` |
| `$--font-size-base` | `--fs-base` |
| `$--border-radius-base` | `--r-md` |

---

## 4. Layout 骨架（L2 形态）

### 4.1 新结构

```
┌────────────────────────────────────────────────────────┐
│ TopBar (#1a1d23, 48px, 金色下边线 2px)                 │ ← 全局
│   [● CKMan]  Clusters Tasks Packages Docs    en/zh ▾  │
├────────────────────────────────────────────────────────┤
│ ClusterTabs (白底, 40px, active 金下划线)              │ ← 仅 /clusters/:id/* 出现
│   Overview Manage Tables Data SQL Session Setting      │
├────────────────────────────────────────────────────────┤
│ <PageHeader>                                           │ ← 每页可选用
│   crumb · title · subtitle              [actions...]   │
├────────────────────────────────────────────────────────┤
│ <router-view>                                          │
└────────────────────────────────────────────────────────┘
```

### 4.2 关键变化

- **删除底栏**（footer 区域），集群子页 7 个 tab 上移到顶栏正下方紧贴 chrome
- 顶栏品牌区加金色 dot（`--c-gold-500`），让品牌色继续可见
- 顶栏品牌区旁加 `[prod-ck ▾]` 集群切换器（下拉所有集群，无需回 home 再选）
- 顶栏右侧统一：语言切换、用户菜单（含登出）

### 4.3 PageHeader 组件（新建）

替换各页自写的 `<h2>` + 标题区，统一签名：

```vue
<PageHeader
  :crumb="['CKMan', 'prod-ck', 'Manage']"
  title="Node management"
  subtitle="Operate and monitor cluster nodes"
>
  <template #actions>
    <el-button type="primary">＋ Add node</el-button>
  </template>
</PageHeader>
```

---

## 5. 共享组件升级

### 5.1 升级清单

| 档 | 组件 | 主要改动 |
|---|---|---|
| **重做** | `sharp-modal` / `sharp-drawer` | 圆角 / 阴影 / 标题区 + footer 间距 / 关闭按钮位置；保留 API |
| **重做** | `Breadcrumb` | chevron 分隔符；最末一项加重；超 4 段折叠 |
| **重做** | 空状态 / `v-loading` / toast | 插图 + 文案 + 可选 action 三段式 |
| **重做** | `r-tabset` | tab 移到顶部带金色下划线，无圆角、无背景 |
| **重做** | `DForm` / `DFormItem` | 见 §6 |
| **样式** | `sharp-pagination` / `sharp-selector` / `sharp-tooltip` | 替换硬编码值 |
| **样式** | `time-range` / `TimeFilter` | 同上 + 焦点态金色环 |
| **样式** | `SqlCodeMirror` / `vue-ace-editor` | 字体改 JBM；行号区淡化；错误下波浪线用 `--c-danger-solid` |
| **样式** | `vxe-table` | 通过 override 统一表头、行 hover、斑马纹、密度切换 |
| **样式** | `OverviewBase` / `vue-echarts` | 接入 `_echarts-theme.ts` |
| **新建** | `PageHeader` | 见 §4.3 |
| **新建** | `StatusBadge` | 5 状态统一徽章（primary/success/warning/danger/muted） |
| **新建** | `ProgressCard` | 总进度卡（百分比 + 份额 + 已耗时 + 状态文本） |
| **新建** | `RunDetailDrawer` | 替代 `run-detail-dialog`（见 §7） |
| **新建** | `TaskDetailDrawer` | 替代 `task/components/TaskDetail`（见 §7） |
| **不动** | `v-collapse` / `v-collapse-text` / `tag-manager` / `table-selection` / `number-animation` / `vue-progressbar` | 仅 SCSS 内值替换 token |

---

## 6. DForm 设计

### 6.1 当前问题

- label 区在 250px 内塞 caret + label + info tooltip + `*` + 添加按钮 + 错误消息（绝对定位），结构脆弱
- description 藏在 `ⓘ` tooltip 里，可发现性差
- 输入控件硬编码 `.width-350`，容器内会溢出
- 必填红星 + 错误文本 + 删除按钮全红，红色泛滥
- 嵌套层级 ≥3 时仅靠缩进难以分辨

### 6.2 新结构

```
┌───────────────────────────────────────────────────┐
│ ▸ field_label  *                                  │ ← 一行 / fs-12 / fw-500，必填星金色
│   Short description from schema (always visible)  │ ← 常驻 / fs-11 / muted
│   ┌───────────────────────────────┐  [＋]         │ ← 自适应 max-width: 480px
│   │ value                         │               │
│   └───────────────────────────────┘               │
│   ⚠ Error message line                            │ ← 错误才显，独占一行
└───────────────────────────────────────────────────┘
```

### 6.3 关键改动

- **Label 上下层次化**：label 一行 + description 一行常驻 + 输入控件竖排
- **必填指示去红**：`*` 改用 `--c-gold-500`，错误才用 `--c-danger-fg`
- **输入控件响应式**：移除 `.width-350` 硬编码，改 `max-width: 480px; width: 100%`
- **嵌套靠 guide line**：嵌套 ≥1 层时左侧加 1px `--c-gold-100` 竖线
- **添加按钮固定位置**：`[＋]` 移到输入控件右侧、不再 absolute
- **Disabled 态语义化**：`editable=false` 字段改只读文本 + `--c-surface-1`，不是禁用样式
- **Force 开关收敛**：去掉与按钮的颜色冲突，改 switch + 简短描述
- **校验改 blur 触发**：减少打字时的红点干扰

---

## 7. 任务进度设计

两个域的后端数据丰俭差异大，模板**不共用**，但共享底层组件 `ProgressCard` / `StatusBadge`。

### 7.1 data-manage 域 — RunDetailDrawer

**数据来源**：`DataManageApi.getRun(runId)` 返回的 Run：
```
run_id, policy_id, trigger_type, operation, instance
status (queued|running|success|failed|interrupted|skipped), status_reason
started_at, finished_at, elapsed (秒)
partitions[]: { partition, status, size, rows, file_num, elapsed, msg }
error_msg | message
```

**抽屉内容**：

```
┌─ Run #r-2026-05-14-093120 ─────────────────────── × ─┐
│ Backup partitions on prod-ck                          │
│                                                        │
│ ┌──────────────────────────────────────────────────┐ │
│ │  ▰▰▰▰▰▰░░░░░░ 43%   3/7 partitions  04:12 elapsed│ │ ← ProgressCard
│ │  Running · started 09:31:20                       │ │
│ └──────────────────────────────────────────────────┘ │
│                                                        │
│ Partitions                                             │
│ ─────────────────────────────────────────────────────  │
│ partition │ status │ size │ rows │ files │ elapsed │ msg
│ 202405    │ ✓ Done │ 1.2G │ 12M  │ 47    │ 32s     │
│ 202404    │ ✓ Done │ 980M │ 10M  │ 38    │ 28s     │
│ 202403    │ ⏵ Running │ —  │ —    │ —     │ 18s     │
│ 202402    │ ◌ Wait │ —    │ —    │ —     │ —       │
│ ...                                                    │
│                                                        │
│ ── Error log ────────────────────────────────  [Copy] │ ← 仅 status=failed 时显示
│ (error_msg 字段内容，CodeMirror 只读单段)              │
└────────────────────────────────────────────────────────┘
```

**注意**：
- 总进度 = `partitions.filter(p => p.status === 'success').length / partitions.length`
- "预估剩余" **不显示**（后端无字段，外推不准）
- 错误日志区仅 `error_msg`/`message` 单段，**不是实时流**
- 轮询：3s；终态（success/failed/interrupted/skipped）后停轮询

### 7.2 task 全局域 — TaskDetailDrawer

**数据来源**：`TaskApi.getTaskDetail(taskId)` 返回：
```
TaskId, ClusterName, Type, Option (i18n)
Status (Waiting|Running|Success|Failed|Stopped)
Message, CreateTime, UpdateTime, Duration
NodeStatus[]: { Host, Status: { EN, [lang] } }
```

**抽屉内容**：

```
┌─ Task #TASK-xxx ─────────────────────── × ─┐
│ {Option[lang]} on {ClusterName}             │
│                                              │
│ ┌────────────────────────────────────────┐ │
│ │  ▰▰▰▰░░░░░░ 40%   2/5 nodes  Duration: │ │ ← ProgressCard（节点份额）
│ │  Running · created 09:31:20             │ │
│ │  Message: {Message}                     │ │
│ └────────────────────────────────────────┘ │
│                                              │
│ Nodes                                        │
│ ─────────────────────────────────────────── │
│ host       │ status                          │
│ 10.0.0.1   │ ✓ Done                          │
│ 10.0.0.2   │ ✓ Done                          │
│ 10.0.0.3   │ ⏵ Running                       │
│ 10.0.0.4   │ ◌ Waiting                       │
│ 10.0.0.5   │ ◌ Waiting                       │
└──────────────────────────────────────────────┘
```

**注意**：
- 节点级 step / current item、节点级 stderr 详情、实时日志流 — **后端无字段**，全部不渲染
- 仅能显示节点的 Status 字符串
- 轮询：3s；终态后停轮询

### 7.3 列表行内进度

| 列表 | 进度推算 | 字段 |
|---|---|---|
| data-manage 任务/运行历史行 | partitions 完成份额 | partition count + elapsed + status |
| task 全局列表行 | NodeStatus 中 `Status.EN === 'Done'` 份额 | Duration + Status + Message |

---

## 8. 6 个页面 IA 重排原则

### 8.1 home（集群列表）

- 删除"Provision + 大图标 hero 区"（节省 ~200px 垂直空间）
- 加 4 张状态汇总卡（Total / Healthy / Degraded / Offline）
- 工具栏：搜索 + chip 筛选（All / Deploy / Import / Replica only）
- 表格：Cluster 列合并 logic + hosts（hosts 折叠 +N）+ 状态点；Mode 改 badge；操作列 hover 显示

### 8.2 overview（集群监控）

- TimeFilter 挪到 PageHeader actions 区
- 指标卡网格 3 列 × N 行均匀宽度，每张 = 标题 + 单位 + 值 + ECharts mini
- 未接 Prometheus 空数据态给说明 + "查看接入文档"按钮
- ECharts 主题用 `_echarts-theme.ts`，金色作主色

### 8.3 manage（节点管理）

- 选中节点时浮现底部固定批量栏（已选 N · 启动/停止/重启/移除）
- 节点行 = 状态点 + IP + 角色徽章 + 资源占用 mini bar + 操作菜单
- 散乱按钮分四组收进 `⋮` 菜单：启停 / 诊断 / 配置 / 扩缩容
- 危险操作二次确认改 sharp-modal 警告样式

### 8.4 tables（表监控）

- 内嵌 tab 横向挤压改为顶部 `r-tabset` 显式 tab
- 每个表减 2-3 列，次要字段进 hover popover
- 每个 tab 标题旁加 `ⓘ` 说明
- 队列空状态给清晰文案（"队列为空 · 所有任务已完成"）

### 8.5 data-manage（备份/恢复/迁移/Rebalance）

- 备份历史行加进度条（运行中）+ 状态徽章
- 任务详情从弹窗改抽屉（RunDetailDrawer）
- "自动刷新 5s · 暂停" 显式按钮挪到 PageHeader
- 顶 tab 加任务计数徽章
- 每个 tab 空数据时给"如何开始"引导

### 8.6 query-execution（SQL 控制台）

- 三栏可调（`vue-multipane` 已支持）
- 多 SQL 并发结果开 tab，可关闭可固定
- 历史记录从顶部下拉改左侧抽屉，按时间 / 集群 / 状态分组
- 快捷键徽章常驻（`⌘ Enter` 执行、`⌘ /` 注释）
- 执行失败结果区给可复制错误 + 位置高亮，替代 toast

### 8.7 6 个仅 token 升级页面

login / home-setting / session / settings / task / docs — IA 不动，只享受 token + 骨架。
- login：表单居中、按钮换金色、加品牌字 hero
- home-setting / session / settings：表格 + 表单自动用新 token
- task（全局任务中心）：列表沿用，详情用 TaskDetailDrawer
- docs：markdown 渲染样式跟随新 type-scale，代码块换 JBM

---

## 9. 渐进落地策略

### 9.1 分四批推进（严格依赖链，单人推进 6 PR 串行）

```
P1 Tokens & 基础设施   ── 完成才能开始 P2
P2 Layout 骨架 + 共享组件 ── 完成才能开始 P3
P3 6 个 IA 重排页面（串行：home → overview → manage → tables → data-manage → query-execution）── 完成才能开始 P4
P4 残余 + 全局验收     ──
```

| 阶段 | 工作日 | 输出 |
|---|---|---|
| P1 | 3-5 | 1 PR：tokens + element/vxe 覆盖 + 字体托管 |
| P2 | 5-7 | 1 PR：layout.vue + PageHeader + 共享组件升级 |
| P3 | 10-14 | 6 PR：每页 1 PR，严格串行 |
| P4 | 3-5 | 1 PR：剩余 5 页 + ECharts/CodeMirror/vxe-table 主题 + 验收 + 文档 |

**总周期**：约 21-31 工作日（4-6 周）。

### 9.2 灰度策略

- **无特性开关**：纯 CSS/markup 重构，开关只增加复杂度
- **每 PR = 1 个回滚单元**：可独立 revert，不破坏其他
- **PR 描述必须含截图 diff**：每个改动页改前/改后同视角截图

---

## 10. 质量守门

### 10.1 CI 阻塞规则（stylelint）

| 规则 | 阶段 |
|---|---|
| 禁止 hex 色值（`color-no-hex` 等） | P1 配 warn，P2 起转 error |
| 禁止魔数 px（带白名单：0/1/2/100% 等） | P2 起 warn，P3 起 error |
| 禁止 `!important` 滥用（新增 ≤2 处） | 全程 warn |
| `@import` 顺序与命名规范 | P1 起 error |

### 10.2 验收清单（per PR 强制）

- [ ] stylelint 0 error
- [ ] PR 描述含改前/改后截图（每改动页 1 组）
- [ ] `git diff --stat src/apis/*` 无修改
- [ ] `src/services/router.ts` 中 path/name 0 变更（仅可改 component import）
- [ ] 涉及页面四态（空/加载/错误/正常）4 张截图齐备
- [ ] 键盘可达验证（Tab/Enter/ESC）
- [ ] i18n en + zh 双语完整，无裸 key
- [ ] 本地 `yarn serve` 浏览器 console 0 新增 error/warning

### 10.3 全局验收（项目收官）

| 维度 | 目标 |
|---|---|
| 视觉一致性 | 12 个 view 走读截图列在收官文档；找不出硬编码色/px |
| 性能 | 首屏 LCP 不增加 > 100ms；vxe-table 滚动帧率不降 |
| 可访问性 | 主交互区 contrast ≥ AA（4.5:1） |
| 回滚就绪 | 任一 PR 可 revert 不破坏其他 |
| 后端契约 0 变更 | `src/apis/*.ts` 函数签名/URL/payload 100% 不变 |

### 10.4 四态可视化矩阵

| 态 | 触发 | 视觉要求 |
|---|---|---|
| 空 | 列表无数据 / retCode 0000 entity 空集 | 插图 + 文案 + 主行动按钮三段式 |
| 加载 | 首次拉数据 / 切 tab | `v-loading` 全屏，spinner 改金色 |
| 错误 | retCode ≠ '0000' / network 失败 | **面板级错误卡 + retry 按钮**（替代现状的一闪 toast） |
| 正常 | 有数据 | 各页 IA 设计 |

---

## 11. 风险与对策

| 风险 | 概率 | 影响 | 对策 |
|---|---|---|---|
| Element UI eoi 主题变量与新 token 名冲突 | 中 | 中 | P1 先 pilot 一个表单 + 一个 dialog 跑通映射 |
| vxe-table 内部样式不通过变量暴露，需 `:deep()` 覆盖 | 高 | 中 | 接受 `:deep()` 覆盖，在 `_vxe-table-override.scss` 集中管理 |
| ECharts 4 主题对象与现有包装组件 API 不兼容 | 中 | 低 | P4 处理，必要时升级 4→5 |
| 自托管字体 +180KB 增加首屏 | 低 | 低 | font-display: swap + 仅预加载 Inter 两个权重 |
| home 删除 Provision hero 影响新用户认知 | 低 | 低 | 工具栏旁加 `+ Create cluster`，首次空数据态显式引导 |
| stylelint 严规则触发大量历史改动 | 中 | 低 | P1 设 warn，P2 起逐 PR 转 error，避免一次性堆 |
| 后端字段缺失导致进度抽屉信息单薄（已知）| 已知 | 低 | task 域抽屉砍掉节点 step/stderr/log，仅显示 NodeStatus.Status；data-manage 域用 partitions 富信息 |

---

## 12. 文档产出（收官 PR 内含）

- `docs/design-tokens.md` — 所有 token 命名 + 取值 + 用例
- `docs/components/*.md` — 每个共享组件一页（PageHeader / sharp-modal / sharp-drawer / Breadcrumb / DForm / RunDetailDrawer / TaskDetailDrawer / ProgressCard / StatusBadge / r-tabset / TimeFilter）
- `docs/migration-notes.md` — 开发者新写页面应该用什么 token / 组件，禁止用什么

---

## 13. 检查点摘要

完成本 spec 后由 `writing-plans` 接力生成实现计划。本设计文档承诺：
- 不改 `src/apis/*` 任何函数签名 / URL / payload
- 不改 `src/services/router.ts` 任何 path / name
- Vue 2 + Element UI eoi + vxe-table + ECharts 4 全部就地复用
- 12 个 view 路由不变、入口不变；用户书签可继续使用
