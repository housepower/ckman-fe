# P3-home 走查记录

## 自动化验证

| 项 | 结果 |
|---|---|
| yarn build | PASS |
| verify-tokens (94 tokens) | PASS |
| yarn lint:style | 316 warnings / 0 errors |
| 后端契约 0 变更（src/apis） | PASS（空） |
| 路由 0 变更（router.ts） | PASS（空） |
| 仅 home + i18n 改动 | PASS |

## 人工验证待补

P3-home 视觉与交互大改，需在浏览器中走一遍：

### 视觉
- [ ] hero 区已删除，PageHeader 显示 crumb + title + 右侧 Import/Create 按钮
- [ ] 4 张统计卡（Total / Deploy / Import / Replica）显示数字正确
- [ ] 工具栏：搜索框 + 4 个 chip（All / Deploy / Import / Replica only）
- [ ] 表格首列：name + meta 副信息行（logic · count nodes · hosts +N）
- [ ] mode 列：deploy / import badge
- [ ] replica 列：✓ / —
- [ ] comment 通过 hover Cluster 单元格 tooltip 显示

### 交互
- [ ] 点击 chip 切换筛选，列表正确过滤
- [ ] 搜索框 + chip 组合筛选生效
- [ ] hover 行时操作列出现 "Open ›" + ⋮ 菜单
- [ ] 点击 Open 跳集群子页（路由 /clusters/:id/overview）
- [ ] 点击 ⋮ → Delete 弹出确认 → 成功删除并刷新列表
- [ ] Import / Create 按钮功能与改造前一致

### 数据
- [ ] 统计卡片数字与列表实际数量匹配
- [ ] truncateHosts 折叠正确（≤2 直接显示，>2 时 "ip1, ip2 +N"）

### 空数据
- [ ] 0 集群时表格显示空状态文案

## 已知边角问题

- el-dropdown-item 渲染到 body portal，scoped style 中的 `.row-actions__delete-item` 红色样式可能不生效（Element UI 已知限制）。需要时改为非 scoped 全局规则。

## 验收结论

- [x] yarn build 通过
- [x] verify-tokens 94 tokens
- [x] lint:style 0 errors
- [x] 后端契约 0 变更
- [x] 仅 home + i18n 改动
- [ ] 视觉与交互人工验证待补
