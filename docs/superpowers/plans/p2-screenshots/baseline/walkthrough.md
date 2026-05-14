# P2 12-view 走查记录

## 自动化验证

| 项 | 结果 |
|---|---|
| yarn build | PASS（Build complete.） |
| verify-tokens (94 tokens) | PASS |
| yarn lint:style | 315 warnings / 0 errors |
| 后端契约 0 变更（src/apis + router.ts diff） | PASS（空） |
| src/views/ 仅 layout.vue 改动 | PASS |

## 人工验证待补

P2 改造影响所有 view 的 chrome 视觉，需在浏览器中人工验证：

### 全局 chrome
- [ ] 顶栏深色 `#1A1D23`，金色下边线 2px
- [ ] 顶栏左侧 brand 旁有金色 dot
- [ ] 进入集群子页时，顶栏正下方出现 7 个 tab（白底、激活态金色下划线）
- [ ] 原底栏 tab 消失
- [ ] 主内容区背景为 `--c-surface-1`（浅灰），不再是 `#eaeef4`

### 共享组件视觉
- [ ] sharp-modal 弹窗：圆角 8px、阴影、标题区分隔线
- [ ] sharp-drawer 抽屉：阴影、底部按钮区灰底
- [ ] Breadcrumb：chevron 分隔符、末项加重
- [ ] v-loading 加载圆点：金色
- [ ] r-tabset tab：顶部带金色下划线
- [ ] DForm label 上下结构、description 常驻、必填星金色
- [ ] el-message toast：左侧色条、圆角、阴影

### 业务页内容
- [ ] 12 个 view 内容区视觉与 P1 基本一致（不应有大变动）
- [ ] 浏览器 Console 0 新增 error / warning

## 验收结论

- [x] yarn build 通过
- [x] 94 tokens 验证通过
- [x] yarn lint:style 0 error
- [x] 后端契约 0 变更
- [x] 业务 view template 0 改动（仅 layout.vue）
- [ ] 全局 chrome 视觉如期（人工验证待补）
- [ ] 共享组件视觉如期（人工验证待补）
- [ ] 12 view 内容区视觉无意外变化（人工验证待补）
