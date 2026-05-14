# P1 — Design Tokens 与基础设施 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立完整的 design tokens 体系（七族 ~94 个 token），引入 Inter / JetBrains Mono 自托管字体，配置 stylelint 守门规则，作为后续视觉精雕的地基。**P1 完成后 12 个 view 的视觉外观保持不变**（旧硬编码值仍生效），但 `:root` 注入完整 CSS 变量族，新代码可以直接引用 token。

**Architecture:** SCSS + CSS 双输出。每个 token 同时输出为 SCSS 变量（用于编译时喂入 Element UI 主题）和 CSS 自定义属性（用于运行时业务样式）。Element UI / vxe-table / ECharts 三个第三方库的主题通过 override 文件统一接入新 token。`src/app/variables.scss` 保留为兼容层（向后导出 `$primary-color` 等旧 SCSS 变量），避免破坏 `vue.config.js` 的 `additionalData` 注入。

**Tech Stack:** Vue 2.6 / Element UI eoi / vxe-table 3 / ECharts 4 / Sass 1.32 / vue-cli 4 + webpack 4 / stylelint 14 + custom rules / @fontsource/inter + @fontsource/jetbrains-mono

**关键路径**：
- 新建：`src/app/theme/{_tokens.scss, _element-ui-override.scss, _vxe-table-override.scss, index.scss, tokens.ts, echarts-theme.ts}` 6 个文件
- 新建：`scripts/verify-tokens.mjs` 1 个文件
- 新建：`.stylelintrc.json` 1 个文件
- 改造：`src/app/index.ts`、`src/app/variables.scss`（兼容层）、`src/app/element-variables.scss`、`src/app/global.scss`、`src/common/app/global.scss`、`public/index.html`、`package.json`
- 不删除：`src/app/variables.scss`（仍作兼容层，P4 阶段才删）

---

## File Structure

```
src/app/
  variables.scss               (改造为兼容层：re-export $primary-color from new tokens)
  element-variables.scss       (改造：用新 token SCSS 变量喂入 Element UI)
  global.scss                  (微调：$primary-color → var(--c-primary-solid))
  echarts-themes/
    index.ts                   (微调：注册新 theme 名 'ckman')
    primary.ts                 (保留，deprecated 注释)
  theme/                       ★新增目录
    _tokens.scss               (★ 七族 token，~94 个，SCSS + CSS 双输出)
    _element-ui-override.scss  (★ 喂入 $--color-primary 等 Element UI SCSS 变量)
    _vxe-table-override.scss   (★ 集中管理 vxe-table :deep() 覆盖)
    index.scss                 (★ 该目录统一入口，被 src/app/index.ts import)
    tokens.ts                  (★ TS 端 token 镜像，用于 ECharts/JS 消费)
    echarts-theme.ts           (★ ECharts 主题对象，用 tokens.ts 派生)

src/common/app/
  global.scss                  (微调：$primary-color → var(--c-primary-solid))
  element-variables.scss       (微调：deprecated 注释，不再做主题覆盖)

scripts/
  verify-tokens.mjs            (★ 编译验证脚本，检查 :root 注入)

public/
  index.html                   (微调：加 <link rel="preload"> 字体)

根目录：
  .stylelintrc.json            (★ stylelint 配置，warn 级零硬编码)
  package.json                 (微调：加 stylelint + @fontsource 依赖)
```

---

## Task 1: 启动 P1 工作分支与 baseline 验证

**Files:**
- 无文件改动，仅 git 操作

- [ ] **Step 1: 检查 git 状态干净**

Run: `git status`
Expected: `nothing to commit, working tree clean`

- [ ] **Step 2: 创建 P1 工作分支**

Run: `git checkout -b feat/p1-design-tokens`
Expected: `Switched to a new branch 'feat/p1-design-tokens'`

- [ ] **Step 3: 验证 baseline 编译通过**

Run: `yarn install --frozen-lockfile && yarn build 2>&1 | tail -20`
Expected: `Build complete.` 或 `Compiled successfully`，无 ERROR 行

如果编译失败，停止并报告——baseline 必须先通过才能继续。

- [ ] **Step 4: 记录 baseline 截图位置**

创建目录占位（实际截图人工补，本任务仅建文件夹）：
```
mkdir -p docs/superpowers/plans/p1-screenshots/baseline
```

无 commit。

---

## Task 2: 新增 @fontsource 字体依赖与 stylelint 工具链

**Files:**
- Modify: `package.json`（dependencies + devDependencies）

- [ ] **Step 1: 加运行时字体依赖**

Run:
```
yarn add @fontsource/inter@5 @fontsource/jetbrains-mono@5
```
Expected: 两个包写入 dependencies；`node_modules/@fontsource/inter/` 与 `node_modules/@fontsource/jetbrains-mono/` 存在。

- [ ] **Step 2: 加 stylelint devDeps**

Run:
```
yarn add -D stylelint@14 stylelint-config-recommended-scss@8 stylelint-scss@4 postcss@8 postcss-scss@4
```
Expected: 5 个包写入 devDependencies。

- [ ] **Step 3: 验证 stylelint 可被调用**

Run: `node_modules/.bin/stylelint --version`
Expected: 输出 `14.x.x`。

- [ ] **Step 4: Commit**

```
git add package.json yarn.lock
git commit -m "build(deps): add @fontsource fonts and stylelint toolchain for P1"
```

---

## Task 3: 创建 `_tokens.scss` 骨架与色板基色（金色 10 阶 + 中性灰 10 阶）

**Files:**
- Create: `src/app/theme/_tokens.scss`
- Create: `scripts/verify-tokens.mjs`

- [ ] **Step 1: 写编译验证脚本（先失败）**

Create `scripts/verify-tokens.mjs`：

```js
#!/usr/bin/env node
import sass from 'sass';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokenFile = resolve(__dirname, '../src/app/theme/_tokens.scss');

// 兼容 sass 1.32 legacy API（同步）
const result = sass.renderSync({
  file: tokenFile,
  includePaths: [resolve(__dirname, '../src'), resolve(__dirname, '../node_modules')],
});
const css = result.css.toString();

const required = [
  '--c-gold-50:', '--c-gold-100:', '--c-gold-200:', '--c-gold-300:',
  '--c-gold-400:', '--c-gold-500:', '--c-gold-600:', '--c-gold-700:',
  '--c-gold-800:', '--c-gold-900:',
  '--c-gray-50:', '--c-gray-100:', '--c-gray-200:', '--c-gray-300:',
  '--c-gray-400:', '--c-gray-500:', '--c-gray-600:', '--c-gray-700:',
  '--c-gray-800:', '--c-gray-900:',
];

const missing = required.filter(name => !css.includes(name));
if (missing.length) {
  console.error('FAIL: missing tokens:', missing);
  process.exit(1);
}
if (!css.includes('--c-gold-500: #C9A100')) {
  console.error('FAIL: gold-500 anchor mismatch');
  process.exit(1);
}
console.log('PASS: 20 base color tokens verified');
```

- [ ] **Step 2: 运行验证脚本，确认失败**

Run: `node scripts/verify-tokens.mjs`
Expected: 报错 — file `src/app/theme/_tokens.scss` 不存在。

- [ ] **Step 3: 创建 _tokens.scss 骨架与基色**

Create `src/app/theme/_tokens.scss`：

```scss
// ckman-fe Design Tokens
// 单一来源：所有 token 同时输出为 SCSS 变量（编译时）与 CSS 自定义属性（运行时）
// 命名约定：用途名 > 物理名。组件层禁止直接使用基色 token（如 --c-gold-500），应使用语义 token（如 --c-primary-solid）

// ─────────────────────────────────────────────────
// Color · 基色（10 阶金色 + 10 阶中性灰）
// ─────────────────────────────────────────────────

// 金色（锚 500 = #C9A100，HSL 色相 48°，按饱和度/明度均匀派生）
$tokens-gold-50:  #FDF9E6;
$tokens-gold-100: #FAF1B8;
$tokens-gold-200: #F4E388;
$tokens-gold-300: #ECCF57;
$tokens-gold-400: #E0BA32;
$tokens-gold-500: #C9A100;  // ★ 品牌锚定，绝对不动
$tokens-gold-600: #A88500;
$tokens-gold-700: #856900;
$tokens-gold-800: #634D00;
$tokens-gold-900: #423300;

// 中性灰（锚 700 = #1a1d23 顶栏色，冷调灰）
$tokens-gray-50:  #F8F9FA;
$tokens-gray-100: #F1F3F5;
$tokens-gray-200: #E5E7EB;
$tokens-gray-300: #D1D5DB;
$tokens-gray-400: #9CA3AF;
$tokens-gray-500: #6B7280;
$tokens-gray-600: #4B5563;
$tokens-gray-700: #1A1D23;  // ★ 顶栏深色锚定
$tokens-gray-800: #0F1115;
$tokens-gray-900: #07080A;

// ─────────────────────────────────────────────────
// :root CSS 自定义属性导出
// ─────────────────────────────────────────────────
:root {
  // Color · 基色
  --c-gold-50:  #{$tokens-gold-50};
  --c-gold-100: #{$tokens-gold-100};
  --c-gold-200: #{$tokens-gold-200};
  --c-gold-300: #{$tokens-gold-300};
  --c-gold-400: #{$tokens-gold-400};
  --c-gold-500: #{$tokens-gold-500};
  --c-gold-600: #{$tokens-gold-600};
  --c-gold-700: #{$tokens-gold-700};
  --c-gold-800: #{$tokens-gold-800};
  --c-gold-900: #{$tokens-gold-900};

  --c-gray-50:  #{$tokens-gray-50};
  --c-gray-100: #{$tokens-gray-100};
  --c-gray-200: #{$tokens-gray-200};
  --c-gray-300: #{$tokens-gray-300};
  --c-gray-400: #{$tokens-gray-400};
  --c-gray-500: #{$tokens-gray-500};
  --c-gray-600: #{$tokens-gray-600};
  --c-gray-700: #{$tokens-gray-700};
  --c-gray-800: #{$tokens-gray-800};
  --c-gray-900: #{$tokens-gray-900};
}
```

- [ ] **Step 4: 运行验证脚本，确认通过**

Run: `node scripts/verify-tokens.mjs`
Expected: `PASS: 20 base color tokens verified`

- [ ] **Step 5: Commit**

```
git add src/app/theme/_tokens.scss scripts/verify-tokens.mjs
git commit -m "feat(theme): add base color tokens (gold + gray 10 levels each)"
```

---

## Task 4: 扩展 `_tokens.scss` — 语义色族 + 表面 + 文字

**Files:**
- Modify: `src/app/theme/_tokens.scss`
- Modify: `scripts/verify-tokens.mjs`

- [ ] **Step 1: 扩验证脚本（先失败）**

修改 `scripts/verify-tokens.mjs`，在 `required` 数组末尾追加：

```js
  // 语义色 × 4 状态字段（5 状态：primary/success/warning/danger/info）
  '--c-primary-bg:', '--c-primary-border:', '--c-primary-fg:', '--c-primary-solid:',
  '--c-success-bg:', '--c-success-border:', '--c-success-fg:', '--c-success-solid:',
  '--c-warning-bg:', '--c-warning-border:', '--c-warning-fg:', '--c-warning-solid:',
  '--c-danger-bg:', '--c-danger-border:', '--c-danger-fg:', '--c-danger-solid:',
  '--c-info-bg:', '--c-info-border:', '--c-info-fg:', '--c-info-solid:',
  // 表面
  '--c-surface-0:', '--c-surface-1:', '--c-surface-2:', '--c-surface-3:',
  // 文字
  '--c-text-primary:', '--c-text-secondary:', '--c-text-tertiary:', '--c-text-disabled:',
```

并修改末尾 console.log：
```js
console.log('PASS: 48 color tokens verified');
```

- [ ] **Step 2: 运行验证，确认失败**

Run: `node scripts/verify-tokens.mjs`
Expected: 报错 missing tokens。

- [ ] **Step 3: 追加语义色 + 表面 + 文字到 _tokens.scss**

在 `src/app/theme/_tokens.scss` 文件末尾（`:root {` 块**内**最后一个 `--c-gray-900` 行后）追加：

```scss
  // ─────────────────────────────────────────────────
  // Color · 语义（5 × 4 = 20 个 token）
  // ─────────────────────────────────────────────────
  --c-primary-bg:     #{$tokens-gold-50};
  --c-primary-border: #{$tokens-gold-200};
  --c-primary-fg:     #{$tokens-gold-700};
  --c-primary-solid:  #{$tokens-gold-500};

  --c-success-bg:     #ECFDF5;
  --c-success-border: #A7F3D0;
  --c-success-fg:     #047857;
  --c-success-solid:  #10B981;

  --c-warning-bg:     #FFFBEB;
  --c-warning-border: #FDE68A;
  --c-warning-fg:     #B45309;
  --c-warning-solid:  #F59E0B;

  --c-danger-bg:      #FEF2F2;
  --c-danger-border:  #FECACA;
  --c-danger-fg:      #B91C1C;
  --c-danger-solid:   #EF4444;

  --c-info-bg:        #EFF6FF;
  --c-info-border:    #BFDBFE;
  --c-info-fg:        #1D4ED8;
  --c-info-solid:     #3B82F6;

  // ─────────────────────────────────────────────────
  // Color · 表面（4 层）
  // ─────────────────────────────────────────────────
  --c-surface-0: #FFFFFF;            // 页面纯白卡片
  --c-surface-1: #{$tokens-gray-50}; // 页面背景
  --c-surface-2: #{$tokens-gray-100};// 卡片 hover / 次级背景
  --c-surface-3: #{$tokens-gray-200};// 分隔色

  // ─────────────────────────────────────────────────
  // Color · 文字（4 层）
  // ─────────────────────────────────────────────────
  --c-text-primary:   #111827;
  --c-text-secondary: #{$tokens-gray-600};
  --c-text-tertiary:  #{$tokens-gray-400};
  --c-text-disabled:  #{$tokens-gray-300};
```

- [ ] **Step 4: 同步追加 SCSS 变量版（在 :root 块之前的 SCSS 变量区追加）**

在 `_tokens.scss` 文件 `$tokens-gray-900` 行之后、`:root {` 行之前追加：

```scss
// 语义色（SCSS 变量，用于编译时 Element UI 主题等）
$tokens-primary-solid: $tokens-gold-500;
$tokens-success-solid: #10B981;
$tokens-warning-solid: #F59E0B;
$tokens-danger-solid:  #EF4444;
$tokens-info-solid:    #3B82F6;

// 文字（SCSS 变量）
$tokens-text-primary:   #111827;
$tokens-text-secondary: $tokens-gray-600;
$tokens-text-tertiary:  $tokens-gray-400;
$tokens-text-disabled:  $tokens-gray-300;

// 表面（SCSS 变量）
$tokens-surface-0: #FFFFFF;
$tokens-surface-1: $tokens-gray-50;
$tokens-surface-2: $tokens-gray-100;
$tokens-surface-3: $tokens-gray-200;
```

- [ ] **Step 5: 运行验证，确认通过**

Run: `node scripts/verify-tokens.mjs`
Expected: `PASS: 48 color tokens verified`

- [ ] **Step 6: Commit**

```
git add src/app/theme/_tokens.scss scripts/verify-tokens.mjs
git commit -m "feat(theme): add semantic color + surface + text tokens"
```

---

## Task 5: 扩展 `_tokens.scss` — Spacing / Radius / Shadow

**Files:**
- Modify: `src/app/theme/_tokens.scss`
- Modify: `scripts/verify-tokens.mjs`

- [ ] **Step 1: 扩验证脚本**

在 `scripts/verify-tokens.mjs` 的 `required` 数组末尾追加：

```js
  // Spacing (13 个)
  '--s-0:', '--s-1:', '--s-2:', '--s-3:', '--s-4:', '--s-5:', '--s-6:',
  '--s-8:', '--s-10:', '--s-12:', '--s-16:', '--s-20:', '--s-24:',
  // Radius (4 个)
  '--r-sm:', '--r-md:', '--r-lg:', '--r-pill:',
  // Shadow (5 个)
  '--sh-xs:', '--sh-sm:', '--sh-md:', '--sh-lg:', '--sh-inset:',
```

并修改末尾 console.log 为 `'PASS: 70 tokens verified'`。

- [ ] **Step 2: 运行验证，确认失败**

Run: `node scripts/verify-tokens.mjs`
Expected: 报错 missing tokens。

- [ ] **Step 3: 追加到 _tokens.scss 的 :root 块末尾**

在 `--c-text-disabled` 行后追加：

```scss
  // ─────────────────────────────────────────────────
  // Spacing（4px 步进，13 阶）
  // ─────────────────────────────────────────────────
  --s-0:  0;
  --s-1:  4px;
  --s-2:  8px;
  --s-3:  12px;
  --s-4:  16px;
  --s-5:  20px;
  --s-6:  24px;
  --s-8:  32px;
  --s-10: 40px;
  --s-12: 48px;
  --s-16: 64px;
  --s-20: 80px;
  --s-24: 96px;

  // ─────────────────────────────────────────────────
  // Radius
  // ─────────────────────────────────────────────────
  --r-sm:   4px;
  --r-md:   6px;
  --r-lg:   8px;
  --r-pill: 9999px;

  // ─────────────────────────────────────────────────
  // Shadow（基于深灰投影，避免纯黑）
  // ─────────────────────────────────────────────────
  --sh-xs:    0 1px 0 rgba(17, 24, 39, 0.04);
  --sh-sm:    0 1px 2px rgba(17, 24, 39, 0.06);
  --sh-md:    0 2px 8px rgba(17, 24, 39, 0.08);
  --sh-lg:    0 8px 24px rgba(17, 24, 39, 0.10);
  --sh-inset: inset 0 1px 0 rgba(17, 24, 39, 0.04);
```

- [ ] **Step 4: 在 SCSS 变量区也加 radius（Element UI 主题需要）**

在 `_tokens.scss` 顶部 SCSS 变量区（$tokens-surface-3 之后）追加：

```scss
// Radius（SCSS 变量）
$tokens-r-sm: 4px;
$tokens-r-md: 6px;
$tokens-r-lg: 8px;

// Type · 字号（SCSS 变量，部分供 Element UI 使用）
$tokens-fs-base: 13px;
```

- [ ] **Step 5: 运行验证，确认通过**

Run: `node scripts/verify-tokens.mjs`
Expected: `PASS: 70 tokens verified`

- [ ] **Step 6: Commit**

```
git add src/app/theme/_tokens.scss scripts/verify-tokens.mjs
git commit -m "feat(theme): add spacing / radius / shadow tokens"
```

---

## Task 6: 扩展 `_tokens.scss` — Type 与 Motion

**Files:**
- Modify: `src/app/theme/_tokens.scss`
- Modify: `scripts/verify-tokens.mjs`

- [ ] **Step 1: 扩验证脚本**

在 `required` 数组末尾追加：

```js
  // Type · 字族
  '--f-display:', '--f-body:', '--f-mono:',
  // Type · 字号 (9 个)
  '--fs-xs:', '--fs-sm:', '--fs-base:', '--fs-md:', '--fs-lg:',
  '--fs-xl:', '--fs-2xl:', '--fs-3xl:', '--fs-display:',
  // Type · 字重 (4 个)
  '--fw-regular:', '--fw-medium:', '--fw-semibold:', '--fw-bold:',
  // Type · 行高 (3 个)
  '--lh-tight:', '--lh-normal:', '--lh-relaxed:',
  // Motion (5 个)
  '--du-fast:', '--du-base:', '--du-slow:',
  '--ease-out:', '--ease-in-out:',
```

并修改末尾 console.log 为 `'PASS: 94 tokens verified'`。

- [ ] **Step 2: 运行验证，确认失败**

Run: `node scripts/verify-tokens.mjs`
Expected: missing tokens。

- [ ] **Step 3: 追加到 :root 块末尾**

在 `--sh-inset` 行后追加：

```scss
  // ─────────────────────────────────────────────────
  // Type · 字族
  // ─────────────────────────────────────────────────
  --f-display: "Inter", -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  --f-body:    "Inter", -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  --f-mono:    "JetBrains Mono", "SF Mono", "Menlo", "Consolas", "Courier New", monospace;

  // ─────────────────────────────────────────────────
  // Type · 字号（9 阶，base = 13px 与现状一致）
  // ─────────────────────────────────────────────────
  --fs-xs:      11px;
  --fs-sm:      12px;
  --fs-base:    13px;
  --fs-md:      14px;
  --fs-lg:      16px;
  --fs-xl:      18px;
  --fs-2xl:     22px;
  --fs-3xl:     28px;
  --fs-display: 36px;

  // ─────────────────────────────────────────────────
  // Type · 字重
  // ─────────────────────────────────────────────────
  --fw-regular:  400;
  --fw-medium:   500;
  --fw-semibold: 600;
  --fw-bold:     700;

  // ─────────────────────────────────────────────────
  // Type · 行高
  // ─────────────────────────────────────────────────
  --lh-tight:   1.25;
  --lh-normal:  1.5;
  --lh-relaxed: 1.75;

  // ─────────────────────────────────────────────────
  // Motion
  // ─────────────────────────────────────────────────
  --du-fast: 120ms;
  --du-base: 180ms;
  --du-slow: 240ms;

  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

- [ ] **Step 4: 运行验证，确认通过**

Run: `node scripts/verify-tokens.mjs`
Expected: `PASS: 94 tokens verified`

- [ ] **Step 5: Commit**

```
git add src/app/theme/_tokens.scss scripts/verify-tokens.mjs
git commit -m "feat(theme): add type and motion tokens (total 94 tokens)"
```

---

## Task 7: 创建 TS 端 token 镜像 `tokens.ts`

**Files:**
- Create: `src/app/theme/tokens.ts`

P1 阶段 TS 端 token 用于 ECharts 主题对象（Task 10）。提供与 _tokens.scss 一致的值，并附 verify-tokens.mjs 增加一致性检查。

- [ ] **Step 1: 创建 tokens.ts**

Create `src/app/theme/tokens.ts`：

```typescript
// TS 镜像，必须与 _tokens.scss 中的值一一对应
// 修改时同步两个文件；verify-tokens.mjs 会做一致性检查

export const tokens = {
  gold: {
    50:  '#FDF9E6',
    100: '#FAF1B8',
    200: '#F4E388',
    300: '#ECCF57',
    400: '#E0BA32',
    500: '#C9A100',
    600: '#A88500',
    700: '#856900',
    800: '#634D00',
    900: '#423300',
  },
  gray: {
    50:  '#F8F9FA',
    100: '#F1F3F5',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#1A1D23',
    800: '#0F1115',
    900: '#07080A',
  },
  semantic: {
    primary: { bg: '#FDF9E6', border: '#F4E388', fg: '#856900', solid: '#C9A100' },
    success: { bg: '#ECFDF5', border: '#A7F3D0', fg: '#047857', solid: '#10B981' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', fg: '#B45309', solid: '#F59E0B' },
    danger:  { bg: '#FEF2F2', border: '#FECACA', fg: '#B91C1C', solid: '#EF4444' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', fg: '#1D4ED8', solid: '#3B82F6' },
  },
  surface: { 0: '#FFFFFF', 1: '#F8F9FA', 2: '#F1F3F5', 3: '#E5E7EB' },
  text:    { primary: '#111827', secondary: '#4B5563', tertiary: '#9CA3AF', disabled: '#D1D5DB' },
  font: {
    body:    '"Inter", -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    display: '"Inter", -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    mono:    '"JetBrains Mono", "SF Mono", "Menlo", "Consolas", "Courier New", monospace',
  },
} as const;

export type Tokens = typeof tokens;
```

- [ ] **Step 2: 扩 verify-tokens.mjs 加一致性检查**

修改 `scripts/verify-tokens.mjs`：

(a) 在文件顶部 import 区追加（与现有 import 平级）：

```js
import { readFileSync } from 'fs';
```

(b) 在文件末尾的 `console.log('PASS: 94 tokens verified');` **之前**追加：

```js
// 一致性检查：tokens.ts 中的 gold-500 必须与 SCSS 中一致
const tsSource = readFileSync(resolve(__dirname, '../src/app/theme/tokens.ts'), 'utf-8');
if (!tsSource.includes("500: '#C9A100'")) {
  console.error('FAIL: tokens.ts gold-500 anchor does not match SCSS');
  process.exit(1);
}
```

- [ ] **Step 3: 运行验证**

Run: `node scripts/verify-tokens.mjs`
Expected: `PASS: 94 tokens verified`（含 ts 一致性检查通过）

- [ ] **Step 4: Commit**

```
git add src/app/theme/tokens.ts scripts/verify-tokens.mjs
git commit -m "feat(theme): add TS token mirror for ECharts/JS consumers"
```

---

## Task 8: 字体托管 — @fontsource CSS import + preload

**Files:**
- Create: `src/app/theme/index.scss`
- Modify: `public/index.html`

@fontsource 包提供 woff2 + CSS 文件。我们用 CSS import 加载 Inter regular/medium/semibold/bold + JBM regular，并预加载最常用的 Inter regular/medium。

- [ ] **Step 1: 创建 theme 目录入口 index.scss**

Create `src/app/theme/index.scss`：

```scss
// theme 目录统一入口
// 1. 字体（必须最先，浏览器先发起请求）
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/inter/700.css';
@import '@fontsource/jetbrains-mono/400.css';

// 2. Tokens
@import './tokens';
```

- [ ] **Step 2: 验证 @fontsource 文件路径存在**

Run:
```
ls node_modules/@fontsource/inter/400.css node_modules/@fontsource/jetbrains-mono/400.css
```
Expected: 两个文件都存在。

- [ ] **Step 3: 在 public/index.html 加 preload meta**

打开 `public/index.html`，找到 `<head>` 内任意位置（建议在 `<meta charset>` 之后），添加：

```html
    <link rel="preload" as="font" type="font/woff2"
          href="<%= BASE_URL %>fonts/inter-latin-400.woff2" crossorigin>
    <link rel="preload" as="font" type="font/woff2"
          href="<%= BASE_URL %>fonts/inter-latin-500.woff2" crossorigin>
```

注意：@fontsource 默认将 woff2 文件打包到 webpack dist 下相对路径。preload 的 href 路径需要与 webpack 实际产出的字体 URL 一致。

- [ ] **Step 4: 运行 yarn build 验证打包不报错**

Run: `yarn build 2>&1 | tail -10`
Expected: `Build complete.` 无 ERROR。
预期 `dist/css/` 下 chunk 中包含 `@font-face` 规则；`dist/fonts/` 或类似目录下有 .woff2 文件。

- [ ] **Step 5: 如果 woff2 路径不匹配 preload href，记录实际路径并修正 index.html**

Run: `find dist -name "*.woff2" 2>/dev/null | head -5`
将实际路径写入 `public/index.html` 的 preload href（带 `<%= BASE_URL %>` 前缀）。如果路径含 hash（如 `inter-latin-400.123abc.woff2`），preload 会因 hash 失败——此时**移除 preload 或改为不带 hash 的固定路径**。

如果 hash 问题难解决，本步骤可降级：先**不做 preload**（删除 Step 3 加的两行），仅靠 font-display: swap 处理。@fontsource 默认 face 已含 swap。在 `public/index.html` 顶部加注释说明：

```html
    <!-- TODO(P4): re-evaluate font preload after webpack output stabilizes -->
```

- [ ] **Step 6: Commit**

```
git add src/app/theme/index.scss public/index.html
git commit -m "feat(theme): self-host Inter and JetBrains Mono via @fontsource"
```

---

## Task 9: 创建 `_element-ui-override.scss` 喂入 Element UI 主题

**Files:**
- Create: `src/app/theme/_element-ui-override.scss`

Element UI 主题变量是 SCSS 变量，必须在编译时定义。本文件喂入新 token 的 SCSS 变量给 Element UI，**替代**现状 `src/app/element-variables.scss` 的功能。

- [ ] **Step 1: 创建文件并喂入 Element UI 变量**

Create `src/app/theme/_element-ui-override.scss`：

```scss
@import './tokens';

// 喂入 Element UI 主题变量（SCSS 编译时）
$--color-primary:         $tokens-primary-solid;
$--color-success:         $tokens-success-solid;
$--color-warning:         $tokens-warning-solid;
$--color-danger:          $tokens-danger-solid;
$--color-info:            $tokens-info-solid;

$--color-text-primary:    $tokens-text-primary;
$--color-text-regular:    $tokens-text-secondary;
$--color-text-secondary:  $tokens-text-tertiary;
$--color-text-placeholder:$tokens-text-disabled;

$--border-color-base:     $tokens-gray-300;
$--border-color-light:    $tokens-gray-200;
$--border-color-lighter:  $tokens-gray-100;
$--border-color-extra-light: $tokens-gray-50;

$--background-color-base: $tokens-surface-1;

$--font-size-base:        $tokens-fs-base;
$--border-radius-base:    $tokens-r-md;

// Element UI 字体路径（必需）
$--font-path: '~element-ui-eoi/lib/theme-chalk/fonts';

@import '~element-ui-eoi/packages/theme-chalk/src/index';
```

注意：`element-ui` 在 webpack 中被 alias 为 `element-ui-eoi`，但 SCSS `@import` 不走 webpack alias，必须直接写 `element-ui-eoi`。

- [ ] **Step 2: 语法静态检查**

文件使用了 `~element-ui-eoi/...` 路径（webpack tilde 前缀），sass CLI 不支持，无法独立编译。语法验证延后到 Task 12 的 `yarn build`。

仅做语法快速 grep 自检：

Run:
```
grep -c "^\$--color-primary:" src/app/theme/_element-ui-override.scss
```
Expected: `1`

Run:
```
grep -c "^@import '~element-ui-eoi/packages/theme-chalk/src/index';" src/app/theme/_element-ui-override.scss
```
Expected: `1`

- [ ] **Step 3: Commit**

```
git add src/app/theme/_element-ui-override.scss
git commit -m "feat(theme): add Element UI theme override using new tokens"
```

---

## Task 10: 创建 `_vxe-table-override.scss`

**Files:**
- Create: `src/app/theme/_vxe-table-override.scss`

vxe-table 内部样式通过 CSS 变量 / 内联值混合，许多变量未暴露。统一在此文件用 `:global` 选择器覆盖。

- [ ] **Step 1: 创建文件**

Create `src/app/theme/_vxe-table-override.scss`：

```scss
@import './tokens';

// vxe-table 全局覆盖
// 注意：此文件不 import vxe-table CSS（已在 main.tsx 引入 'vxe-table/lib/style.css'），仅做样式覆盖

.vxe-table {
  // 表头
  .vxe-table--header-wrapper,
  .vxe-table--fixed-left-wrapper .vxe-table--header-wrapper,
  .vxe-table--fixed-right-wrapper .vxe-table--header-wrapper {
    background-color: var(--c-surface-1);
  }

  .vxe-header--column {
    font-weight: var(--fw-semibold);
    color: var(--c-text-secondary);
    font-size: var(--fs-sm);
    background-color: var(--c-surface-1);
    border-bottom-color: var(--c-surface-3);
  }

  // 行
  .vxe-body--row {
    &:hover {
      .vxe-body--column {
        background-color: var(--c-surface-1) !important;
      }
    }
  }

  .vxe-body--column {
    color: var(--c-text-primary);
    font-size: var(--fs-base);
    border-bottom-color: var(--c-surface-3);
  }

  // 排序图标 hover 用主色
  .vxe-sort--asc-btn:hover,
  .vxe-sort--desc-btn:hover,
  .vxe-filter--btn:hover {
    color: var(--c-primary-solid);
  }
}

// 分页器
.vxe-pager {
  font-size: var(--fs-base);
  color: var(--c-text-secondary);

  .vxe-pager--num-btn.is--active {
    background-color: var(--c-primary-solid);
    color: var(--c-surface-0);
    border-color: var(--c-primary-solid);
  }
}
```

- [ ] **Step 2: 编译验证**

Run:
```
node_modules/.bin/sass --load-path=node_modules --load-path=src \
  src/app/theme/_vxe-table-override.scss /tmp/vxe-test.css 2>&1 | head -10
```
Expected: 无 ERROR；输出文件存在。

(本文件无 `~` 前缀依赖，可独立编译验证)

- [ ] **Step 3: Commit**

```
git add src/app/theme/_vxe-table-override.scss
git commit -m "feat(theme): add vxe-table override using tokens"
```

---

## Task 11: 创建 `echarts-theme.ts` 基于 tokens.ts

**Files:**
- Create: `src/app/theme/echarts-theme.ts`

替代 `src/app/echarts-themes/primary.ts` 中的硬编码颜色，主色用金色，辅以按色相分散的 4 色辅色。**不删除 primary.ts**，作为对照保留，业务侧通过新 theme 名 `'ckman'` 启用。

- [ ] **Step 1: 创建主题文件**

Create `src/app/theme/echarts-theme.ts`：

```typescript
import echarts from 'echarts';
import { tokens } from './tokens';

const { gold, gray, semantic } = tokens;

const seriesColors = [
  gold[500],            // 金（品牌主色）
  semantic.info.solid,  // 钢蓝
  semantic.success.solid, // 深绿
  semantic.danger.solid,  // 砖红
  semantic.warning.solid, // 橘黄
  gray[600],            // 中性灰
  '#8B5CF6',            // 紫
  '#06B6D4',            // 青
];

echarts.registerTheme('ckman', {
  color: seriesColors,
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'Inter, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
    color: tokens.text.primary,
  },
  title: {
    textStyle: { color: tokens.text.primary, fontWeight: 600 },
    subtextStyle: { color: tokens.text.tertiary },
  },
  line: {
    itemStyle: { borderWidth: 2 },
    lineStyle: { width: 2 },
    symbolSize: 4,
    symbol: 'circle',
    smooth: false,
  },
  bar: { itemStyle: { borderWidth: 0, borderColor: gray[200] } },
  categoryAxis: {
    axisLine: { lineStyle: { color: gray[300] } },
    axisTick: { lineStyle: { color: gray[300] } },
    axisLabel: { color: tokens.text.tertiary, fontSize: 11 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: tokens.text.tertiary, fontSize: 11 },
    splitLine: { lineStyle: { color: gray[100], type: 'dashed' } },
  },
  legend: { textStyle: { color: tokens.text.secondary, fontSize: 12 } },
  tooltip: {
    backgroundColor: tokens.text.primary,
    borderWidth: 0,
    textStyle: { color: '#FFFFFF', fontSize: 12 },
    axisPointer: { lineStyle: { color: gray[400] } },
  },
});
```

- [ ] **Step 2: 语法静态检查**

依赖 Task 12 的 `yarn build` 做完整 TS 编译验证。本步仅快速 grep 自检：

Run:
```
grep -c "registerTheme('ckman'" src/app/theme/echarts-theme.ts
```
Expected: `1`

如果 Task 12 的 `yarn build` 在 echarts 类型上报错，回到本文件顶部加 `// @ts-nocheck` 绕过（P4 阶段统一处理 echarts 类型）。

- [ ] **Step 3: Commit**

```
git add src/app/theme/echarts-theme.ts
git commit -m "feat(theme): add ECharts 'ckman' theme using tokens"
```

---

## Task 12: 接入 theme 目录到 `src/app/index.ts`

**Files:**
- Modify: `src/app/index.ts`
- Modify: `src/app/theme/index.scss`（追加 override 引用）
- Create: `src/app/theme/index.ts`

theme 目录现在有 SCSS 与 TS 两类入口。统一在 `src/app/index.ts` 加载，**放在原 `element-variables.scss` 之前**，确保新 token 先生效。

- [ ] **Step 1: 追加 override import 到 theme/index.scss**

修改 `src/app/theme/index.scss`，在 `@import './tokens';` 后追加：

```scss
// 3. 第三方组件主题覆盖
@import './element-ui-override';
@import './vxe-table-override';
```

- [ ] **Step 2: 创建 TS 入口**

Create `src/app/theme/index.ts`：

```typescript
import './echarts-theme';
import './index.scss';
```

- [ ] **Step 3: 改造 src/app/index.ts**

打开 `src/app/index.ts`，在文件顶部第一行**之前**插入：

```typescript
// New design tokens & theme (P1)
import './theme';
```

完整改造后内容：

```typescript
// New design tokens & theme (P1)
import './theme';

import './element-variables.scss';

import '@/common/app/element-variables.scss';
import './global.scss';

import '@/common/app/detectFeatures';
import './echarts-themes';
import './filters';
import './hackElementUI';
import './runs';
```

- [ ] **Step 4: 编译验证整站可构建**

Run: `yarn build 2>&1 | tail -20`
Expected: `Build complete.` 无 ERROR。

如果有 SCSS 重复导入告警（element-chalk 被导入两次：theme/_element-ui-override.scss + element-variables.scss），先**忽略**警告，下一任务会解决。

- [ ] **Step 5: 启动 dev server 跑通页面**

Run: `yarn serve` （后台运行，跑约 30 秒待编译完成）

在浏览器打开 http://localhost:8080，登录后逐个点开 12 个 view（home / overview / manage / tables / data-manage / query-execution / session / settings / login / home-setting / task / docs）。

Expected：
- 每个 view 视觉外观保持原状（旧硬编码值仍生效）
- 浏览器 Console 无新增 error / warning
- DevTools Elements → `<html>` 上 Computed → 看到 `--c-gold-500: #C9A100`（或 `--c-gold-500: #c9a100`）

记录任意异常到 `docs/superpowers/plans/p1-screenshots/baseline/issues.md`。

停止 dev server。

- [ ] **Step 6: Commit**

```
git add src/app/theme/index.scss src/app/theme/index.ts src/app/index.ts
git commit -m "feat(theme): wire new tokens & theme into app bootstrap"
```

---

## Task 13: 消除 Element UI 主题重复导入

**Files:**
- Modify: `src/app/element-variables.scss`
- Modify: `src/common/app/element-variables.scss`

现状 `src/app/element-variables.scss` 和 `src/common/app/element-variables.scss` 都 `@import "~element-ui/packages/theme-chalk/src/index"`，再加上新 `_element-ui-override.scss` 里也 import 了一次——会有三次导入。

策略：保留 `src/app/element-variables.scss` 但**只放业务侧的 Element UI 组件样式覆盖**（如 `.el-form-item.is-required:after`），移除 chalk index 导入。`src/common/app/element-variables.scss` 同样处理。

- [ ] **Step 1: 改造 src/app/element-variables.scss**

替换文件内容为：

```scss
// Element UI 业务侧样式微调（chalk 主题已在 ./theme/_element-ui-override.scss 中导入）
// 这里只放 .el-* 选择器的二次微调

// form 必填项 * 位置修改（保留现状行为，颜色用 token）
.el-form-item {
  &.is-required:not(.is-no-asterisk)  {
    & > .el-form-item__label {
      &:before {
        display: none;
      }

      &:after {
        content: '*';
        color: var(--c-danger-solid);
      }
    }
  }

  .el-form-item__label, .el-form-item__content, .el-radio__label, .el-checkbox__label {
    font-size: var(--fs-base);
  }
}
```

注意：保留原文件其余规则（如有）。如果原文件 21 行后还有内容，**保留**这些规则，仅删除 `@import "variables";` 与 `@import "~element-ui/..."` 两行，并把 `$--color-primary: $primary-color;` 这种 SCSS 变量声明全部删除（已在 theme 里做了）。

- [ ] **Step 2: 改造 src/common/app/element-variables.scss**

打开 `src/common/app/element-variables.scss`：
- 删除前两行：`@import "variables";` 和 `$--color-primary: $primary-color;`
- 删除 `@import "~element-ui/..."` 那行
- 保留所有 `.el-*` 业务覆盖规则
- 把规则中的硬编码颜色（`#E8EAEC`、`#F8F8F9`、`#4E4E4E`、`#4A90E2`、`#E2E2E2`、`#fef6e9`、`#f7b84f`）**保留**（P2 阶段再统一换 token）

- [ ] **Step 3: 编译验证**

Run: `yarn build 2>&1 | tail -20`
Expected: `Build complete.` 无 ERROR。
检查 `dist/css/` 输出大小：应小于改造前（重复 chalk 已消除）。

Run: `du -sh dist/css/`
记录大小，与 Task 1 Step 3 的 baseline 对比。

- [ ] **Step 4: 跑 dev server 复检 12 view**

同 Task 12 Step 5。
Expected: 视觉与之前一致，无新增 console error。

- [ ] **Step 5: Commit**

```
git add src/app/element-variables.scss src/common/app/element-variables.scss
git commit -m "refactor(theme): dedupe Element UI chalk import"
```

---

## Task 14: 改造 `variables.scss` 为兼容层（不删除）

**Files:**
- Modify: `src/app/variables.scss`

`vue.config.js` 通过 `additionalData` 把 `@import "~@/app/variables"` 注入所有 SCSS 文件。`$primary-color` 在很多 .vue 中被引用。**不能删除**这个文件。

改造为：导入新 tokens，并 re-export `$primary-color` 作为兼容别名。

- [ ] **Step 1: 改造 variables.scss**

打开 `src/app/variables.scss`，替换全部内容为：

```scss
// 兼容层（P1）：旧 SCSS 变量名 → 新 tokens
// 通过 vue.config.js 的 additionalData 注入到所有 SCSS 文件
// P4 阶段计划全面替换为 var(--c-primary-solid) 后删除本文件

@import "./theme/tokens";

// 旧名 → 新 token 别名
$primary-color: $tokens-primary-solid;
```

- [ ] **Step 2: 编译验证整站**

Run: `yarn build 2>&1 | tail -20`
Expected: `Build complete.` 无 ERROR。所有引用 `$primary-color` 的 .vue / .scss 应继续工作。

- [ ] **Step 3: dev server 复检**

同 Task 12 Step 5，重点确认：
- home 页 "All ClickHouse Clusters" 标题、按钮金色未变
- step-number / step-item 圆点金色未变（global.scss 中使用 `$primary-color`）
- main-title-primary 边框金色未变

- [ ] **Step 4: Commit**

```
git add src/app/variables.scss
git commit -m "refactor(theme): convert variables.scss to compatibility layer"
```

---

## Task 15: 创建 stylelint 配置（warn 级）

**Files:**
- Create: `.stylelintrc.json`
- Create: `.stylelintignore`
- Modify: `package.json`（lint:style script）

P1 阶段所有规则配 **warn**，不阻塞合并。P2 起逐项升级为 error。

- [ ] **Step 1: 创建 .stylelintrc.json**

Create `.stylelintrc.json`：

```json
{
  "extends": ["stylelint-config-recommended-scss"],
  "plugins": ["stylelint-scss"],
  "customSyntax": "postcss-scss",
  "rules": {
    "color-no-hex": [true, {
      "severity": "warning",
      "message": "Use var(--c-*) tokens instead of hex colors"
    }],
    "unit-allowed-list": [
      ["%", "px", "em", "rem", "vh", "vw", "deg", "ms", "s", "fr"],
      { "severity": "warning" }
    ],
    "declaration-no-important": [true, { "severity": "warning" }],
    "scss/at-import-partial-extension": null,
    "no-descending-specificity": null,
    "no-duplicate-selectors": null,
    "selector-class-pattern": null,
    "scss/dollar-variable-pattern": null,
    "scss/at-mixin-pattern": null,
    "scss/at-function-pattern": null
  }
}
```

- [ ] **Step 2: 创建 .stylelintignore**

Create `.stylelintignore`：

```
dist/
node_modules/
src/common/app/theme/theme-black.css
src/common/app/theme/theme-white.css
src/common/app/theme/constants.css
src/app/theme/_tokens.scss
src/app/theme/_element-ui-override.scss
src/app/theme/_vxe-table-override.scss
src/app/echarts-themes/
```

理由：
- theme tokens 文件本身就是 hex 值的"出口"，不应被规则约束
- constants.css / theme-{black,white}.css 是 P2/P4 阶段处理的遗留文件

- [ ] **Step 3: 在 package.json 加 lint:style script**

修改 `package.json` 的 scripts 块，在 `"lint"` 同级添加：

```json
    "lint:style": "stylelint \"src/**/*.{scss,vue}\""
```

注意保留现有 scripts，仅追加这一项。逗号位置正确。

- [ ] **Step 4: 跑 stylelint**

Run: `yarn lint:style 2>&1 | tail -30`
Expected: 输出大量 warning（预期数百条 `color-no-hex` warning，来自现有 .vue 文件），但**无 error**（exit code 0 或 2 都可，关键看是否有 `error` 级别消息）。

如果 exit code 非 0 且消息全是 warning，调整脚本为 `stylelint --allow-empty-input --max-warnings=99999 "src/**/*.{scss,vue}"` 以允许通过。

- [ ] **Step 5: Commit**

```
git add .stylelintrc.json .stylelintignore package.json
git commit -m "build: add stylelint with warn-level zero-hardcode rules"
```

---

## Task 16: 改造 `global.scss` 文件移除 `$primary-color` 直接引用

**Files:**
- Modify: `src/app/global.scss`
- Modify: `src/common/app/global.scss`

把这两个文件里 `$primary-color` 改为 `var(--c-primary-solid)`，其他硬编码颜色**保留**（P2 阶段处理）。这是为了验证 token 链路 end-to-end。

- [ ] **Step 1: 改造 src/app/global.scss**

将以下两处：
- 第 52 行（step-number::before）：`background: $primary-color;` → `background: var(--c-primary-solid);`
- 第 107 行（step-item::before）：`background-color: $primary-color;` → `background-color: var(--c-primary-solid);`
- 第 122 行（step-item::after）：`border-left: 1px solid $primary-color;` → `border-left: 1px solid var(--c-primary-solid);`

- [ ] **Step 2: 改造 src/common/app/global.scss**

将以下处：
- 第 99 行（.fc-primary）：`color: $primary-color !important;` → `color: var(--c-primary-solid) !important;`
- 第 349 行（.main-title-primary）：`border: 1px solid $primary-color;` → `border: 1px solid var(--c-primary-solid);`
- 第 362 行（.dropdown-item.selected）：`color: $primary-color;` → `color: var(--c-primary-solid);`

**不修改** `:root { --primary-color: #{$primary-color}; }` （第 8 行）——这是旧 CSS 变量，与新 `--c-primary-solid` 并存，方便业务代码逐步迁移。

- [ ] **Step 3: dev server 复检**

启动 `yarn serve`，确认所有金色元素（按钮、step 圆点、tab 下划线等）颜色未变。

- [ ] **Step 4: Commit**

```
git add src/app/global.scss src/common/app/global.scss
git commit -m "refactor(theme): replace \$primary-color with var(--c-primary-solid) in global SCSS"
```

---

## Task 17: 字体生效验证

**Files:**
- 无文件改动，仅人工验证

- [ ] **Step 1: 启动 dev server**

Run: `yarn serve`，等待编译完成。

- [ ] **Step 2: 浏览器加载 home 页**

打开 http://localhost:8080，登录后进入 home 页（集群列表）。

- [ ] **Step 3: 验证字体已加载**

打开 DevTools → Network → Font，刷新页面。
Expected: 看到 `inter-latin-400-normal.woff2`、`inter-latin-500-normal.woff2` 等文件 200 OK。

- [ ] **Step 4: 验证字体已应用**

DevTools → Elements，点 body → Computed → font-family。
Expected: 当前显示为 `-apple-system, ...` 等（**因为 P1 还没把字体应用到 body**——这是预期行为，token 已就位但消费在 P2 阶段）。

确认 `:root` 上 `--f-body` 值为 `"Inter", ...`：
```js
getComputedStyle(document.documentElement).getPropertyValue('--f-body')
```
Expected 输出含 `Inter`。

- [ ] **Step 5: 停止 dev server，记录验证截图**

将 Network 截图与 Computed 截图保存到 `docs/superpowers/plans/p1-screenshots/baseline/font-loaded.png` 与 `tokens-injected.png`（手动保存）。

无 commit（仅人工验证）。

---

## Task 18: 12 个 view 走查与四态对照

**Files:**
- Create: `docs/superpowers/plans/p1-screenshots/baseline/walkthrough.md`

P1 验收门：12 个 view 视觉外观与改造前**完全一致**（旧硬编码值仍生效）。

- [ ] **Step 1: 启动 dev server，登录后逐个走读**

12 个 view 路由：

| view | 路径 |
|---|---|
| login | /login |
| home | /clusters |
| home-setting | /setting |
| overview | /clusters/{cluster}/overview |
| manage | /clusters/{cluster}/manage |
| tables | /clusters/{cluster}/tables |
| data-manage | /clusters/{cluster}/data-manage |
| query-execution | /clusters/{cluster}/query-execution |
| session | /clusters/{cluster}/session |
| settings | /clusters/{cluster}/settings |
| task | /task |
| docs | /docs/index |

逐个打开，每页：
- 截图存到 `docs/superpowers/plans/p1-screenshots/after/{view-name}.png`
- 与 baseline（Task 1 Step 4 占位的目录）对比
- Console 错误数记录

- [ ] **Step 2: 编写 walkthrough.md**

Create `docs/superpowers/plans/p1-screenshots/baseline/walkthrough.md`：

```markdown
# P1 12-view 走查记录

| view | 视觉一致 | Console 错误 | 备注 |
|---|---|---|---|
| login | ✅/❌ | 0 | |
| home | ✅/❌ | 0 | |
| home-setting | ✅/❌ | 0 | |
| overview | ✅/❌ | 0 | |
| manage | ✅/❌ | 0 | |
| tables | ✅/❌ | 0 | |
| data-manage | ✅/❌ | 0 | |
| query-execution | ✅/❌ | 0 | |
| session | ✅/❌ | 0 | |
| settings | ✅/❌ | 0 | |
| task | ✅/❌ | 0 | |
| docs | ✅/❌ | 0 | |

## 异常项

（如有视觉不一致或新增 console error，逐条列出页面、复现路径、截图对照）

## 验收结论

- [ ] 12 view 视觉一致
- [ ] 0 新增 console error
- [ ] :root 注入 94 个 token
- [ ] 字体 woff2 加载 200 OK
- [ ] Element UI 主题主色仍为 #C9A100
- [ ] yarn build 通过
- [ ] yarn lint:style 仅 warning 无 error
```

填写实际结果（✅/❌）。

- [ ] **Step 3: 如发现任何异常，停止并报告**

发现异常不进行后续 Task 19。修复后回到 Step 1 重跑走查。

- [ ] **Step 4: Commit walkthrough 记录**

```
git add docs/superpowers/plans/p1-screenshots/
git commit -m "docs(p1): record 12-view walkthrough validation"
```

---

## Task 19: 推送分支并创建 PR

**Files:**
- 无文件改动

- [ ] **Step 1: 跑最终编译验证**

Run: `yarn build 2>&1 | tail -10`
Expected: `Build complete.` 无 ERROR。

- [ ] **Step 2: 跑 verify-tokens 最终验证**

Run: `node scripts/verify-tokens.mjs`
Expected: `PASS: 94 tokens verified`

- [ ] **Step 3: 跑 stylelint**

Run: `yarn lint:style 2>&1 | grep -c " error " || echo 0`
Expected: `0`（0 个 error；warning 数量不限）

- [ ] **Step 4: 推送分支**

Run: `git push -u origin feat/p1-design-tokens`

如失败需要先确认 remote 配置正确。

- [ ] **Step 5: 创建 PR**

Run:
```
gh pr create --title "feat(theme): P1 design tokens & infrastructure" --body "$(cat <<'EOF'
## Summary

实施视觉精雕项目的 P1 阶段：建立完整 design tokens 体系（94 个 token，七族），引入 Inter / JetBrains Mono 自托管字体，配置 stylelint 守门规则（warn 级）。

**视觉外观保持不变**——所有现有页面仍使用旧硬编码值，P2 起逐步迁移到 token。

## What changed

- 新增 `src/app/theme/`：tokens.scss / tokens.ts / element-ui-override / vxe-table-override / echarts-theme
- `src/app/variables.scss` 改造为兼容层（re-export `$primary-color`）
- `src/app/element-variables.scss` 与 `src/common/app/element-variables.scss` 消除重复 chalk 导入
- `global.scss` 中 `$primary-color` 直接引用替换为 `var(--c-primary-solid)`（验证链路）
- 新增 stylelint 配置，规则全部 warn 级
- 新增 `scripts/verify-tokens.mjs` 编译期校验

## 后端契约

- `src/apis/*` **0 变更**
- `src/services/router.ts` **0 变更**

## Test plan

- [x] yarn build 通过
- [x] node scripts/verify-tokens.mjs PASS
- [x] yarn lint:style 0 error（warning 允许）
- [x] 12 个 view 视觉走查与改造前一致（截图 in docs/superpowers/plans/p1-screenshots/）
- [x] :root 注入 94 个 CSS 自定义属性
- [x] 字体 woff2 网络加载 200 OK

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: 在 PR 中粘贴 12-view 截图（人工）**

通过 GitHub UI 在 PR 描述里上传 `docs/superpowers/plans/p1-screenshots/after/*.png`。

PR URL 输出后，本任务结束。

---

## P1 验收清单（整体）

完成所有 Task 后必须满足：

- [ ] `src/app/theme/_tokens.scss` 输出 94 个 CSS 自定义属性（脚本验证）
- [ ] `src/app/theme/tokens.ts` 与 SCSS 中 `--c-gold-500: #C9A100` 一致（脚本验证）
- [ ] `src/app/theme/_element-ui-override.scss` 喂入 SCSS 变量后 Element UI 主题主色仍为 #C9A100
- [ ] `src/app/theme/_vxe-table-override.scss` 全文使用 `var(--c-*)` 而非硬编码
- [ ] `src/app/theme/echarts-theme.ts` 注册名 `'ckman'`
- [ ] Inter + JetBrains Mono woff2 自托管并通过 @fontsource 加载（DevTools Network 200 OK）
- [ ] `src/app/variables.scss` 改造为兼容层但保留 `$primary-color` 别名
- [ ] `vue.config.js` `additionalData` 注入路径**未修改**（仍指 `~@/app/variables`）
- [ ] 12 个 view 视觉外观与改造前完全一致（人工对照截图）
- [ ] 浏览器 Console 0 新增 error/warning
- [ ] yarn build 通过、yarn lint:style 0 error
- [ ] `src/apis/*` 与 `src/services/router.ts` 0 变更（`git diff main..feat/p1-design-tokens -- src/apis src/services/router.ts` 输出空）
- [ ] PR 在 GitHub 上创建并含截图

---

## 不在 P1 范围（明确划清）

- ❌ Layout 改造（顶栏深色、子页 tab 上移）→ P2
- ❌ PageHeader / sharp-modal / sharp-drawer / Breadcrumb 视觉重做 → P2
- ❌ 6 个 IA 重排页面（home / overview / manage / tables / data-manage / query-execution）→ P3
- ❌ stylelint 从 warn 升级到 error → P2 起逐项
- ❌ 业务 .vue 文件改 markup 或样式 → P2/P3
- ❌ 删除旧 `src/app/echarts-themes/primary.ts`（保留作对照）→ P4
- ❌ 删除 `src/app/variables.scss` 兼容层 → P4
- ❌ 替换 `src/common/app/theme/constants.css` 中的旧 color group → P4

---

## 风险与提醒

| 风险 | 提醒 |
|---|---|
| @fontsource v5 的 webpack 打包路径含 hash | 见 Task 8 Step 5；preload 失败时降级为不 preload |
| `vue.config.js` additionalData 注入导致每个 .vue 文件都引入 tokens（编译体积膨胀） | tokens.scss 仅有 SCSS 变量声明，无规则；编译后无额外 CSS 体积。**variables.scss 必须保持轻**——禁止在兼容层加任何选择器 |
| stylelint 在 .vue 文件内 `<style>` 块的解析 | postcss-scss + vue 文件解析需要 `customSyntax`；若解析失败可改用 `postcss-html`。本计划默认 `postcss-scss`，若 lint:style 解析报错改用 `postcss-html`（需 `yarn add -D postcss-html`） |
| Element UI eoi 与 element-chalk SCSS 路径 | webpack alias `element-ui → element-ui-eoi` 不作用于 SCSS @import；必须直接写 `element-ui-eoi` |
| TS strict mode 不开 | echarts-theme.ts 用 `// @ts-nocheck` 降级；P4 阶段处理 |
