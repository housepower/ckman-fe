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
