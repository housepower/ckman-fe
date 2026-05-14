## Task 17 自动化验证结果

| 验证项 | 结果 |
|---|---|
| yarn build | PASS |
| dist/ woff2 数量 | 33 |
| @font-face 规则数 | 36 |
| Inter 字体声明 | PASS |
| JetBrains Mono 字体声明 | PASS |
| --c-gold-500 注入 | PASS |
| --f-body 注入 | PASS |

**人工验证待补**：
- [ ] 浏览器 DevTools → Network → Font，确认 inter-latin-400.woff2 等 200 OK
- [ ] DevTools Computed → body font-family 含 Inter（P2 阶段才把字体应用到 body，P1 仅 token 就位）

## Task 18: 12-view 走查表（待人工补全）

| view | 路径 | 视觉一致 | Console 错误 | 备注 |
|---|---|---|---|---|
| login | /login | TBD | TBD | 待人工 |
| home | /clusters | TBD | TBD | 待人工 |
| home-setting | /setting | TBD | TBD | 待人工 |
| overview | /clusters/{c}/overview | TBD | TBD | 待人工 |
| manage | /clusters/{c}/manage | TBD | TBD | 待人工 |
| tables | /clusters/{c}/tables | TBD | TBD | 待人工 |
| data-manage | /clusters/{c}/data-manage | TBD | TBD | 待人工 |
| query-execution | /clusters/{c}/query-execution | TBD | TBD | 待人工 |
| session | /clusters/{c}/session | TBD | TBD | 待人工 |
| settings | /clusters/{c}/settings | TBD | TBD | 待人工 |
| task | /task | TBD | TBD | 待人工 |
| docs | /docs/index | TBD | TBD | 待人工 |

## 自动化验收

| 项 | 结果 |
|---|---|
| yarn build | PASS（Build complete.） |
| verify-tokens (94 tokens) | PASS（94 tokens verified） |
| yarn lint:style | PASS（0 errors, 94 warnings） |
| 后端契约 0 变更（src/apis + router.ts diff） | PASS |
| dist/ woff2 数量 ≥ 10 | PASS（33 个） |
| @font-face 规则注入 | PASS（36 条规则） |
| --c-gold-500 = #C9A100 在打包 CSS 中 | PASS |

## 人工验收待补

P1 的视觉一致性走查需要人工在浏览器中执行：

1. `yarn serve` 启动 dev server
2. 登录后逐个打开 12 个 view
3. 每个 view 对比 P1 前后视觉是否完全一致（旧硬编码值应仍生效，P1 不直接改业务样式）
4. 浏览器 Console 0 新增 error/warning
5. DevTools Network → Font 看到 inter-latin-*.woff2 等 200 OK

## 验收结论

- [x] yarn build 通过
- [x] 94 tokens 验证通过
- [x] yarn lint:style 0 error
- [x] 后端契约 0 变更
- [x] @fontsource woff2 正确打包
- [ ] **12 view 视觉一致性（人工验证待补）**
- [ ] **浏览器 Console 0 新增 error（人工验证待补）**

带人工验证待补的两项是 P1 合并前的最后门——需要人工在浏览器中确认后方可合 PR。
