# P3-overview 走查记录

## 自动化验证

| 项 | 结果 |
|---|---|
| yarn build | PASS |
| verify-tokens (94 tokens) | PASS |
| yarn lint:style | 0 errors |
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

- ECharts 'ckman' 主题需要 P1 注册（src/app/theme/echarts-theme.ts），未注册时回退默认主题
- 响应式断点 1600 / 1200 / 768 是经验值；如需调整修改 .chart-grid @media 块
- 图表卡片 min-height 320px 是经验值

## 验收结论

- [x] yarn build 通过
- [x] verify-tokens 94 tokens
- [x] lint:style 0 errors
- [x] 后端契约 0 变更
- [x] 仅 overview + overview-base + i18n 改动
- [ ] 视觉与交互人工验证待补
- [ ] ECharts 主题应用正确人工验证待补
