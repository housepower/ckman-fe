# P3-manage 走查记录

## 自动化验证

| 项 | 结果 |
|---|---|
| yarn build | PASS |
| verify-tokens (94 tokens) | PASS |
| yarn lint:style | 0 errors |
| 后端契约 0 变更 | PASS（空） |
| 仅 manage.vue 改动 | PASS |

## 人工验证待补

### 视觉
- [ ] PageHeader：crumb [平台 · 集群名] + title "节点管理"，右上 Start/Stop/Destroy 按钮（Destroy 红色）
- [ ] 升级集群区：白底圆角卡片，标题加粗，字段 + select + checkbox + Upgrade 按钮在同一行
- [ ] 节点列表区：白底圆角卡片，头部 "ClickHouse Node List" 标题 + 右侧 搜索框 + Add Node 按钮
- [ ] 表格：状态列状态点（green=绿 / red=红 / yellow=黄）+ uptime；IP 列含数字字体 + 链接图标
- [ ] 操作列：单个 ⋮ 图标，点击展开菜单含 Offline/Online/Log/Delete（Delete 红色）

### 交互
- [ ] Start Cluster 按钮：状态 red 时可用
- [ ] Stop Cluster：状态非 red 时可用
- [ ] Destroy Cluster：danger 按钮，二次确认
- [ ] Upgrade：选 packageVersion + policy + Upgrade 按钮触发 manageCluster('upgrade')
- [ ] Add Node：弹出 AddNodeDialog
- [ ] 操作列 ⋮：Offline/Online 互斥（按 status），点击触发原 onNodeCommand → offlineClusterNode/onlineClusterNode/viewClusterLog/remove

### 数据
- [ ] 搜索框过滤 hostname/ip/status
- [ ] 升级版本 select 选项来自 PackageApi.getList，当前已部署版本 disabled

### 边角
- [ ] mode === 'import' 时：Upgrade 区只显示 ClickHouse Version 一行；Add Node 按钮不可见；操作列整列不可见
- [ ] mode === 'deploy' 时所有功能可见
- [ ] yellow 状态节点的操作菜单只显示 View Log + Delete（Online/Offline 都不显示，符合预期）

## 验收结论

- [x] yarn build 通过
- [x] 94 tokens
- [x] lint:style 0 errors
- [x] 后端契约 0 变更
- [x] 仅 manage.vue 改动
- [ ] 视觉与交互人工验证待补
