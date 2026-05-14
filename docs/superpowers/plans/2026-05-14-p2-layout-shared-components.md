# P2 — Layout 骨架与共享组件升级 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 P1 token 地基之上，完成 Layout L2 形态改造（深色顶栏 + 金色下边线 + 集群子页 tab 上移），新建 PageHeader / EmptyState 通用组件，重做 Breadcrumb / sharp-modal / sharp-drawer / v-loading / r-tabset / DForm 共享组件的视觉，并把残留共享组件中的 `$primary-color` 全部迁到 `var(--c-primary-solid)` token。**业务 view（`src/views/*`）template 0 改动**——所有 12 个 view 仅通过 chrome 与共享组件继承新视觉。

**Architecture:** chrome 改造集中在 `src/views/layout/layout.vue`；新组件放 `src/components/`；共享组件原地视觉升级，保留所有现有 API 与 markup，仅改 `<style>` 块用 token 替换硬编码。Element UI / vxe-table 主题在 P1 已通过 override 接入 token，P2 验证视觉如期生效，并在 `_element-ui-override.scss` 追加 toast / message / dialog 微调。

**Tech Stack:** Vue 2.6 / Element UI eoi / TypeScript / Sass / `superpowers:writing-plans` + `subagent-driven-development`

**前置依赖：** P1 分支 `feat/p1-design-tokens` 已就绪（94 tokens 注入、字体托管、Element UI token 喂入）。P2 从 P1 分支拉新分支 `feat/p2-layout-shared-components`，不依赖 P1 是否已合并 main。

---

## File Structure

```
src/views/layout/
  layout.vue                   ★ 改造：深色顶栏 + 集群子页 tab 上移 + 删除 footer + 集群切换器

src/components/
  page-header/                 ★ 新增
    page-header.vue
    index.ts
  empty-state/                 ★ 新增
    empty-state.vue
    index.ts
  breadcrumb.vue               ★ 改造：chevron 分隔符 + 末项加重 + token
  index.ts                     ★ 注册 PageHeader + EmptyState
  d-form/
    d-form.vue                 ★ 改造：sticky footer 视觉
    d-form-item.vue            ★ 重做：label 上下结构 + description 常驻 + 必填金 + 错误独行 + 嵌套 guide + 响应式 + 只读 disabled
  time-filter/
    time-filter.scss           ★ 改造：token 替换
  sql-code-mirror/
    sql-code-mirror.vue        ★ 改造（如有 inline scss）：token 替换

src/common/components/
  sharp-modal-drawer/
    sharp-modal.vue            ★ 改造：圆角 / 阴影 / 间距 token
    sharp-drawer.vue           ★ 改造：圆角 / 阴影 / 间距 token
  v-loading/
    v-loading.scss             ★ 改造：token 替换
  r-tabset/
    r-tabset.scss              ★ 改造：tab 上移、金下划线、token
  sharp-pagination.tsx         ★ 改造：行内 style 移到 token
  sharp-selector/
  sharp-selector-next/
  sharp-tooltip.tsx            ★ 改造：tooltip 视觉 token
  time-range/
    time-range.scss            ★ 改造：token 替换

src/app/theme/
  _element-ui-override.scss    ★ 追加：el-message / el-notification / el-dialog / el-drawer 微调
```

**显式不动**（P2 外）：
- `src/views/{home, home-setting, login, overview, manage, tables, data-manage, query-execution, session, settings, task, docs}/**` — 业务页 template / script 0 修改
- `src/apis/*` — 后端契约 0 变更
- `src/services/router.ts` — 路由 path/name 0 变更
- 任何 token 值（`_tokens.scss`）— P1 已锁定
- `RunDetailDrawer` / `TaskDetailDrawer` / `StatusBadge` / `ProgressCard` — 留 P3 业务页改造时一并新建

---

## Task 1: 启动 P2 工作分支

**Files:**
- 无文件改动，仅 git 操作

- [ ] **Step 1: 检查 git 状态干净，且当前 HEAD 是 P1 分支**

Run: `git status && git branch --show-current`
Expected: `nothing to commit, working tree clean`；当前分支 `feat/p1-design-tokens`。

如果不在 P1 分支：
```
git checkout feat/p1-design-tokens
```

- [ ] **Step 2: 从 P1 分支创建 P2 分支**

Run: `git checkout -b feat/p2-layout-shared-components`
Expected: `Switched to a new branch 'feat/p2-layout-shared-components'`

- [ ] **Step 3: 验证 baseline 编译通过**

Run: `yarn build 2>&1 | tail -5`
Expected: `Build complete.` 无 ERROR。

- [ ] **Step 4: 验证 94 tokens 仍可用**

Run: `node scripts/verify-tokens.mjs`
Expected: `PASS: 94 tokens verified`

无 commit。

---

## Task 2: 新建 PageHeader 通用组件

**Files:**
- Create: `src/components/page-header/page-header.vue`
- Create: `src/components/page-header/index.ts`
- Modify: `src/components/index.ts`

PageHeader 是 P2 起的通用页头组件，承载面包屑（crumb）+ 标题 + 副标题 + 右侧 actions 槽。各业务页（P3 阶段）按需使用，不强制。

- [ ] **Step 1: 创建组件**

Create `src/components/page-header/page-header.vue`：

```vue
<template>
  <header class="page-header">
    <div class="page-header__main">
      <nav class="page-header__crumb" v-if="crumb && crumb.length">
        <span
          v-for="(item, i) in crumb"
          :key="i"
          class="crumb-item"
          :class="{ 'crumb-item--last': i === crumb.length - 1 }"
        >
          {{ item }}<span v-if="i < crumb.length - 1" class="sep">›</span>
        </span>
      </nav>
      <h1 class="page-header__title">{{ title }}</h1>
      <p class="page-header__subtitle" v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div class="page-header__actions" v-if="$slots.actions">
      <slot name="actions"></slot>
    </div>
  </header>
</template>

<script>
export default {
  name: 'PageHeader',
  props: {
    crumb: { type: Array, default: () => [] },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
  },
};
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-5) 0 var(--s-4);

  &__crumb {
    font-size: var(--fs-xs);
    color: var(--c-text-tertiary);
    margin-bottom: var(--s-1);

    .crumb-item {
      &.crumb-item--last {
        color: var(--c-text-secondary);
        font-weight: var(--fw-medium);
      }
    }
    .sep {
      margin: 0 var(--s-1);
      color: var(--c-text-tertiary);
    }
  }

  &__title {
    font-size: var(--fs-2xl);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    line-height: var(--lh-tight);
    margin: 0;
  }

  &__subtitle {
    font-size: var(--fs-base);
    color: var(--c-text-secondary);
    margin: var(--s-1) 0 0;
  }

  &__actions {
    display: flex;
    gap: var(--s-2);
    align-items: center;
  }
}
</style>
```

- [ ] **Step 2: 创建 index.ts barrel**

Create `src/components/page-header/index.ts`：

```typescript
import PageHeader from './page-header.vue';
export default PageHeader;
export { PageHeader };
```

- [ ] **Step 3: 注册到全局 components/index.ts**

Read `src/components/index.ts` 当前内容，在最末尾加全局注册。当前文件已有 5 个组件全局注册的模式；请遵循该文件现有的注册方式（通常是 `Vue.component('PageHeader', PageHeader)` 或 import 后 export）。

如果文件结构是 `import` + `Vue.component()` 模式，追加：

```typescript
import PageHeader from './page-header';
import EmptyState from './empty-state';

Vue.component('PageHeader', PageHeader);
Vue.component('EmptyState', EmptyState);
```

（EmptyState 在 Task 3 创建，可以现在一起注册）

如果文件结构是 export pattern 或其他，按当前模式追加 PageHeader 与 EmptyState（EmptyState 先 import 失败也无妨——本 task 不 yarn build；Task 3 之后再 build）。

如果不确定现有模式，请先 Read 文件再 Edit。

- [ ] **Step 4: Commit**

```
git add src/components/page-header/ src/components/index.ts
git commit -m "feat(components): add PageHeader common component"
```

---

## Task 3: 新建 EmptyState 通用组件

**Files:**
- Create: `src/components/empty-state/empty-state.vue`
- Create: `src/components/empty-state/index.ts`

EmptyState 用于业务页空数据态展示。三段式：图标 + 文案 + 主行动按钮 slot。

- [ ] **Step 1: 创建组件**

Create `src/components/empty-state/empty-state.vue`：

```vue
<template>
  <div class="empty-state" :class="{ 'empty-state--compact': compact }">
    <div class="empty-state__icon">
      <i :class="iconClass"></i>
    </div>
    <p class="empty-state__title">{{ title }}</p>
    <p class="empty-state__desc" v-if="description">{{ description }}</p>
    <div class="empty-state__action" v-if="$slots.default">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    iconClass: { type: String, default: 'el-icon-document' },
    compact: { type: Boolean, default: false },
  },
};
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--s-12) var(--s-6);
  text-align: center;
  color: var(--c-text-secondary);

  &--compact {
    padding: var(--s-6) var(--s-4);
  }

  &__icon {
    font-size: 48px;
    color: var(--c-text-tertiary);
    margin-bottom: var(--s-3);

    .empty-state--compact & {
      font-size: 32px;
      margin-bottom: var(--s-2);
    }
  }

  &__title {
    font-size: var(--fs-md);
    font-weight: var(--fw-medium);
    color: var(--c-text-primary);
    margin: 0 0 var(--s-1);
  }

  &__desc {
    font-size: var(--fs-sm);
    color: var(--c-text-tertiary);
    margin: 0 0 var(--s-4);
    max-width: 360px;
  }

  &__action {
    margin-top: var(--s-2);
  }
}
</style>
```

- [ ] **Step 2: 创建 index.ts barrel**

Create `src/components/empty-state/index.ts`：

```typescript
import EmptyState from './empty-state.vue';
export default EmptyState;
export { EmptyState };
```

- [ ] **Step 3: yarn build 验证**

Run: `yarn build 2>&1 | tail -5`
Expected: `Build complete.` 无 ERROR。新组件已被正确注册到 components/index.ts（Task 2 Step 3）并被 webpack 识别。

- [ ] **Step 4: Commit**

```
git add src/components/empty-state/
git commit -m "feat(components): add EmptyState common component"
```

---

## Task 4: Layout 改造（一） — 重写顶栏深色化与 brand

**Files:**
- Modify: `src/views/layout/layout.vue`

把顶栏（`<header>`）从金色 50px 改为深灰 48px，左侧 brand 用金色 dot 点缀，右侧菜单字号缩小、间距收紧。**仅本 task 改顶栏外观**；集群切换器和子页 tab 上移留给后续 task。

- [ ] **Step 1: Read 当前 layout.vue 确认起点**

Run: `cat src/views/layout/layout.vue | head -60`

确认当前顶栏 `<header>` template 结构（应含 router-link/title/version、右侧 div.header-right、消息中心、文档、API、用户 dropdown、语言切换）。

- [ ] **Step 2: 改写 `<style scoped>` 中的 header 样式块**

打开 `src/views/layout/layout.vue`，找到 `<style lang="scss" scoped>` 内 `header { ... }` 块（约第 161-174 行），替换为：

```scss
header {
  position: sticky;
  width: 100%;
  top: 0;
  z-index: 100;
  height: 48px;
  color: var(--c-surface-0);
  background: var(--c-gray-700);
  border-bottom: 2px solid var(--c-primary-solid);
  font-size: var(--fs-sm);

  .user,
  i {
    color: var(--c-surface-0);
  }

  a, .router-link-active {
    color: var(--c-surface-0);
    text-decoration: none;
  }

  .brand-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--c-primary-solid);
    margin-right: var(--s-2);
    vertical-align: 1px;
  }
}
```

- [ ] **Step 3: 在 template 顶部 brand 区加金色 dot**

修改 layout.vue template 内的第 4 行（约）：

```html
<router-link to="/" class="fs-18 font-bold">{{title}}  {{version}}</router-link>
```

替换为：

```html
<router-link to="/" class="brand-link">
  <span class="brand-dot"></span>
  <span class="brand-text">{{title}} <span class="brand-version">{{version}}</span></span>
</router-link>
```

同时在 `<style scoped>` 块中追加：

```scss
.brand-link {
  display: inline-flex;
  align-items: center;
  font-size: var(--fs-md);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.3px;
}

.brand-version {
  font-weight: var(--fw-regular);
  opacity: 0.5;
  margin-left: var(--s-1);
  font-size: var(--fs-xs);
}
```

- [ ] **Step 4: 调整右侧菜单字号与间距**

修改 layout.vue template 中右侧的元素 class，把硬编码 `fs-16`/`fs-20`/`mr-15`/`ml-5` 等替换为统一的 token 化 class（保留 utility class，可以追加 inline style，或加新 class）。

简单做法：在 `<style scoped>` 中追加：

```scss
.header-right {
  font-size: var(--fs-sm);

  > * {
    margin-left: var(--s-3);
  }

  i {
    font-size: var(--fs-md);
    margin-right: var(--s-1);
  }

  .fs-16, .fs-20 {
    font-size: inherit !important;
  }

  .mr-15 { margin-right: 0 !important; }
  .mr-5 { margin-right: var(--s-1) !important; }
  .ml-5 { margin-left: var(--s-1) !important; }
  .ml-10 { margin-left: var(--s-2) !important; }
  .ml-15 { margin-left: var(--s-3) !important; }
}
```

这样不动现有 utility class 引用，只在 layout scoped 内覆盖。

- [ ] **Step 5: yarn build 验证**

Run: `yarn build 2>&1 | tail -5`
Expected: `Build complete.`

- [ ] **Step 6: Commit**

```
git add src/views/layout/layout.vue
git commit -m "feat(layout): dark topbar with gold bottom border and brand dot"
```

---

## Task 5: Layout 改造（二） — 集群子页 tab 上移到顶栏正下方

**Files:**
- Modify: `src/views/layout/layout.vue`

把现在底栏的 7 个集群子页 tab（Overview / Manage / Tables / data-manage / Session / Query Execution / Settings）从 `<footer>` 移到 `<header>` 正下方，形成"深顶 + 白底 tab 条 + 内容区"的 L2 结构。删除 footer 区。

- [ ] **Step 1: 在 template 中新增 ClusterTabs 区**

在 layout.vue template 中，`<header>` 标签的**外面**、`<main>` 标签的**之前**，新增：

```html
<nav class="cluster-tabs" v-if="$route.params.id">
  <div class="cluster-tabs__inner">
    <a
      v-for="item of menus"
      :key="item.name"
      href="javascript:void(0)"
      class="ctab"
      :class="{ 'ctab--active': currentMenu === item.path, 'ctab--hidden': item.name === 'Settings' && mode !== 'deploy' }"
      @click="handleMenuClick(item, $event)"
    >
      {{ $t('home.' + item.name) }}
    </a>
  </div>
</nav>
```

- [ ] **Step 2: 删除原 footer 区**

删除原 `<footer>...</footer>` 整个块（包含 `<transition>` 与 `v-if="$route.params.id"` 的 footer），约第 44-56 行。

- [ ] **Step 3: 在 `<style scoped>` 追加 cluster-tabs 样式**

在 style 块中追加：

```scss
.cluster-tabs {
  position: sticky;
  top: 48px;
  z-index: 99;
  background: var(--c-surface-0);
  border-bottom: 1px solid var(--c-surface-3);
  height: 40px;

  &__inner {
    display: flex;
    gap: var(--s-4);
    padding: 0 var(--s-5);
    height: 100%;
    align-items: stretch;
  }

  .ctab {
    display: inline-flex;
    align-items: center;
    padding: 0 var(--s-1);
    font-size: var(--fs-sm);
    color: var(--c-text-secondary);
    text-decoration: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color var(--du-fast) var(--ease-out),
                border-color var(--du-fast) var(--ease-out);

    &:hover {
      color: var(--c-text-primary);
    }

    &--active {
      color: var(--c-text-primary);
      font-weight: var(--fw-semibold);
      border-bottom-color: var(--c-primary-solid);
    }

    &--hidden {
      display: none;
    }
  }
}
```

- [ ] **Step 4: 删除原 footer 样式块**

在 `<style scoped>` 块中删除 `footer { ... }` 整个块。

- [ ] **Step 5: yarn build 验证**

Run: `yarn build 2>&1 | tail -5`
Expected: `Build complete.`

- [ ] **Step 6: Commit**

```
git add src/views/layout/layout.vue
git commit -m "feat(layout): move cluster sub-page tabs to top, remove footer"
```

---

## Task 6: Layout 改造（三） — 主内容区与背景调整

**Files:**
- Modify: `src/views/layout/layout.vue`
- Modify: `src/common/app/global.scss`

主内容区 `<main>` 在去除 footer 后需要重新对齐背景与间距。同时 body 背景色由 `#eaeef4` 改为 `--c-surface-1`（统一 token）。

- [ ] **Step 1: 调整 layout.vue 中 main 样式**

在 layout.vue `<style scoped>` 中追加或修改：

```scss
main {
  background: var(--c-surface-1);
  padding: 0 var(--s-5);
  padding-top: var(--s-3);
}
```

并删除模板里 main 元素上 `class="plr-20 pt-10 flex-1"` 中的 `plr-20 pt-10`（保留 `flex-1`）：

```html
<main class="flex-1" style="overflow: auto;">
  <router-view />
</main>
```

- [ ] **Step 2: 修改 src/common/app/global.scss 中 body 背景**

打开 `src/common/app/global.scss`，第 44 行附近：

```scss
background-color: #eaeef4;
```

改为：

```scss
background-color: var(--c-surface-1);
```

- [ ] **Step 3: yarn build**

Run: `yarn build 2>&1 | tail -5`
Expected: `Build complete.`

- [ ] **Step 4: Commit**

```
git add src/views/layout/layout.vue src/common/app/global.scss
git commit -m "refactor(layout): use surface-1 token for main background"
```

---

## Task 7: Breadcrumb 视觉升级

**Files:**
- Modify: `src/components/breadcrumb.vue`

替换分隔符为 chevron `›`、末项加重、token 化背景与边框。

- [ ] **Step 1: 改造 template**

替换 `src/components/breadcrumb.vue` 整个文件为：

```vue
<template>
  <section class="breadcrum">
    <el-breadcrumb separator="›">
      <el-breadcrumb-item>
        <router-link to="/"><i class="fa fa-home"></i></router-link>
      </el-breadcrumb-item>
      <el-breadcrumb-item
        v-for="(item, index) of data"
        :key="index"
        :class="{ active: index === data.length - 1 }"
      >
        {{ index !== 1 ? $t('common.' + item) : item }}
      </el-breadcrumb-item>
    </el-breadcrumb>
    <div class="slot">
      <slot></slot>
    </div>
  </section>
</template>

<script>
export default {
  name: 'Breadcrumb',
  props: {
    data: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style lang="scss" scoped>
.breadcrum {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 var(--s-3);
  margin-bottom: var(--s-2);
  background: var(--c-surface-0);
  border: 1px solid var(--c-surface-3);
  border-radius: var(--r-md);

  ::v-deep .el-breadcrumb__inner {
    font-size: var(--fs-sm);
    color: var(--c-text-secondary);
  }

  ::v-deep .el-breadcrumb__separator {
    color: var(--c-text-tertiary);
    margin: 0 var(--s-2);
  }

  .active {
    ::v-deep .el-breadcrumb__inner {
      color: var(--c-text-primary);
      font-weight: var(--fw-semibold);
    }
  }
}
</style>
```

注意：把原 default 值从 `default: []` 改为 `default: () => []`（修复 Vue 警告）。把原 separator-class 改为 separator（直接传字符串）。

- [ ] **Step 2: yarn build**

Run: `yarn build 2>&1 | tail -5`
Expected: `Build complete.`

- [ ] **Step 3: Commit**

```
git add src/components/breadcrumb.vue
git commit -m "feat(breadcrumb): use chevron separator, token-based visuals"
```

---

## Task 8: sharp-modal + sharp-drawer 视觉升级

**Files:**
- Modify: `src/common/components/sharp-modal-drawer/sharp-modal.vue`
- Modify: `src/common/components/sharp-modal-drawer/sharp-drawer.vue`

只改 `<style scoped>` 块；template 与 script 保持不变（API 稳定）。圆角 / 阴影 / 间距 / 边线 / 标题区视觉全部走 token。

- [ ] **Step 1: 升级 sharp-modal.vue style 块**

修改 `src/common/components/sharp-modal-drawer/sharp-modal.vue` 的 `<style lang="scss" scoped>` 块为：

```scss
::v-deep .el-dialog {
  border-radius: var(--r-lg);
  box-shadow: var(--sh-lg);
  overflow: hidden;
}

::v-deep .el-dialog__header {
  padding: var(--s-4) var(--s-5);
  border-bottom: 1px solid var(--c-surface-3);
  background: var(--c-surface-0);

  .el-dialog__title {
    font-size: var(--fs-md);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
  }

  .el-dialog__headerbtn {
    top: var(--s-4);
    right: var(--s-5);
  }
}

::v-deep .el-dialog__body {
  padding: var(--s-5);
  color: var(--c-text-primary);
  font-size: var(--fs-base);
}

::v-deep .el-dialog__footer {
  padding: var(--s-3) var(--s-5);
  border-top: 1px solid var(--c-surface-3);
  background: var(--c-surface-1);
}
```

- [ ] **Step 2: 升级 sharp-drawer.vue style 块**

修改 `src/common/components/sharp-modal-drawer/sharp-drawer.vue` 的 `<style lang="scss" scoped>` 块为：

```scss
::v-deep .el-drawer {
  box-shadow: var(--sh-lg);
}

::v-deep .el-drawer__header {
  font-size: var(--fs-md);
  font-weight: var(--fw-semibold);
  color: var(--c-text-primary);
  padding: var(--s-4) var(--s-5);
  margin-bottom: 0;
  border-bottom: 1px solid var(--c-surface-3);
  background: var(--c-surface-0);
}

::v-deep .el-drawer__body {
  display: flex;
  flex-direction: column;
}

.sharp-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--s-5);
  color: var(--c-text-primary);
  font-size: var(--fs-base);
}

.footer {
  background: var(--c-surface-1);
  border-top: 1px solid var(--c-surface-3);
  padding: var(--s-3) var(--s-5);
  text-align: right;
}
```

- [ ] **Step 3: yarn build**

Run: `yarn build 2>&1 | tail -5`
Expected: `Build complete.`

- [ ] **Step 4: Commit**

```
git add src/common/components/sharp-modal-drawer/
git commit -m "feat(sharp-modal-drawer): visual upgrade with tokens"
```

---

## Task 9: v-loading 视觉升级

**Files:**
- Modify: `src/common/components/v-loading/v-loading.scss`

替换硬编码颜色与字号为 token；圆点用主色 `var(--c-primary-solid)`。

- [ ] **Step 1: 替换 v-loading.scss 内容**

替换 `src/common/components/v-loading/v-loading.scss` 整个文件为：

```scss
.loading {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3000;
  background-color: rgba(255, 255, 255, 0.85);
  opacity: 0;
  animation: opacity-animation var(--du-base) var(--du-base) forwards;

  @keyframes opacity-animation {
    to { opacity: 1 }
  }

  .content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .rotate {
    width: 50px;
    height: 50px;
    display: flex;
    flex-wrap: wrap;
    animation: Rotate 1.2s infinite linear;
    transform-origin: center center;

    i {
      margin: 10%;
      width: 30%;
      height: 30%;
      border-radius: 100%;
      background-color: var(--c-primary-solid);

      &:nth-child(2) { opacity: 0.8; }
      &:nth-child(3) { opacity: 0.6; }
      &:nth-child(4) { opacity: 0.4; }
    }
  }

  .text {
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translate(-50%, 100%);
    width: 300px;
    word-break: break-all;
    white-space: pre-wrap;
    text-align: center;
    font-size: var(--fs-sm);
    color: var(--c-text-secondary);
  }
}

@keyframes Rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

注意：原文件第 1 行有 `@import '~@/app/variables';` —— 删除（不再需要，因为不用 `$primary-color` 了）。但若 vue.config.js additionalData 已注入 variables，保留也无害；建议删除以减少冗余。

- [ ] **Step 2: yarn build**

Run: `yarn build 2>&1 | tail -5`
Expected: `Build complete.`

- [ ] **Step 3: Commit**

```
git add src/common/components/v-loading/v-loading.scss
git commit -m "feat(v-loading): use tokens, refine text style"
```

---

## Task 10: r-tabset tab 视觉升级

**Files:**
- Modify: `src/common/components/r-tabset/r-tabset.scss`

把 tab 从底部下边线改为底部金色下划线 + 顶部 tab 风格；token 化。

- [ ] **Step 1: 替换 r-tabset.scss 内容**

替换 `src/common/components/r-tabset/r-tabset.scss` 整个文件为：

```scss
:not(.no-style) > nav {
  display: flex;
  gap: var(--s-4);
  margin: 0 0 var(--s-4);
  padding: 0 var(--s-2);
  border-bottom: 1px solid var(--c-surface-3);

  .no-collapse > & {
    margin: 0 0 var(--s-4);
  }

  ::v-deep a {
    display: inline-flex;
    align-items: center;
    height: 36px;
    padding: 0 var(--s-1);
    color: var(--c-text-secondary);
    text-decoration: none !important;
    position: relative;
    font-size: var(--fs-sm);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color var(--du-fast) var(--ease-out),
                border-color var(--du-fast) var(--ease-out);

    &:hover {
      color: var(--c-text-primary);
    }

    &.router-link-active {
      font-weight: var(--fw-semibold);
      color: var(--c-text-primary);
      border-bottom-color: var(--c-primary-solid);
    }
  }
}
```

- [ ] **Step 2: yarn build**

Run: `yarn build 2>&1 | tail -5`
Expected: `Build complete.`

- [ ] **Step 3: Commit**

```
git add src/common/components/r-tabset/r-tabset.scss
git commit -m "feat(r-tabset): top tab style with gold underline"
```

---

## Task 11: DForm（一） — d-form-item label 上下结构

**Files:**
- Modify: `src/components/d-form/d-form-item.vue`

把 label 区从原"水平内联（caret + label + info + 必填 + add）"改为"label 一行 + description 常驻一行 + 输入控件下方"的上下层次。

- [ ] **Step 1: Read 当前 d-form-item.vue 找到 slot="label" 区**

Run: `cat src/components/d-form/d-form-item.vue | head -30`

确认现状 `<div slot="label" ...>` 块结构（约 3-20 行）。

- [ ] **Step 2: 替换 label 区结构**

修改 `src/components/d-form/d-form-item.vue` 中 `<div slot="label" ...>` 整个块（开始约第 3 行 `<div slot="label" class="width-full text-left relative" ...>`，到对应 `</div>` 结束）为：

```html
<div slot="label" class="dfi-label" @click="isSlideUp = !isSlideUp">
  <div class="dfi-label__main">
    <i
      v-if="isShowCaret"
      class="fa dfi-caret"
      :class="{ 'fa-caret-right': !isSlideUp, 'fa-caret-down': isSlideUp }"
    ></i>
    <span class="dfi-label__name">{{ schema['label_' + lang] || originName }}</span>
    <span class="dfi-required" v-if="isRequired">*</span>
    <el-tooltip
      v-if="description.length"
      class="item"
      effect="dark"
      placement="top"
    >
      <div slot="content" style="line-height: 1.5">
        <p v-for="(item, index) in description" :key="index" class="mb-2">{{ item }}</p>
      </div>
      <i class="fa fa-info-circle dfi-info"></i>
    </el-tooltip>
    <el-button
      v-if="isShowAddIcon && schema.editable === 'true'"
      @click.stop="addItem"
      size="mini"
      class="dfi-add"
    >
      <i class="fa fa-plus"></i>
    </el-button>
  </div>
  <p
    class="dfi-description"
    v-if="description.length && description[0]"
  >
    {{ description.join(' ') }}
  </p>
  <p class="dfi-error" v-if="errorMessage">{{ errorMessage }}</p>
</div>
```

- [ ] **Step 3: 在 `<style scoped>`（如有；如无则添加） 中追加 dfi-* 样式**

如果 d-form-item.vue 文件末尾没有 `<style>` 块，添加：

```html
<style lang="scss" scoped>
.dfi-label {
  display: block;
  text-align: left;
  cursor: pointer;
  margin-bottom: var(--s-1);

  &__main {
    display: flex;
    align-items: center;
    gap: var(--s-1);
    font-size: var(--fs-sm);
    font-weight: var(--fw-medium);
    color: var(--c-text-primary);
  }

  &__name {
    line-height: var(--lh-normal);
  }
}

.dfi-caret {
  color: var(--c-text-tertiary);
  font-size: var(--fs-xs);
}

.dfi-required {
  color: var(--c-primary-solid);
  font-weight: var(--fw-bold);
  margin-left: 2px;
}

.dfi-info {
  color: var(--c-text-tertiary);
  cursor: help;
  font-size: var(--fs-sm);
}

.dfi-add {
  margin-left: var(--s-2);
}

.dfi-description {
  font-size: var(--fs-xs);
  color: var(--c-text-tertiary);
  margin: var(--s-1) 0 var(--s-1) var(--s-3);
  line-height: var(--lh-normal);
}

.dfi-error {
  font-size: var(--fs-xs);
  color: var(--c-danger-fg);
  margin: var(--s-1) 0 0 var(--s-3);
  line-height: var(--lh-normal);
}
</style>
```

如果文件已有 `<style>` 块，将上述内容**追加**到块内。

- [ ] **Step 4: yarn build**

Run: `yarn build 2>&1 | tail -5`
Expected: `Build complete.`

- [ ] **Step 5: Commit**

```
git add src/components/d-form/d-form-item.vue
git commit -m "feat(d-form): hierarchical label with description always-visible"
```

---

## Task 12: DForm（二） — 输入控件响应式 + Disabled 改只读视觉

**Files:**
- Modify: `src/components/d-form/d-form-item.vue`

把硬编码 `class="width-350"` 全部移除，改用 max-width 容器；Disabled（`schema.editable === 'false'`）字段视觉改为浅灰只读样式。

- [ ] **Step 1: 移除所有 width-350 硬编码**

Run: `grep -n "width-350" src/components/d-form/d-form-item.vue`

预期：找到 ~6 处使用。

对每一处，把 `class="width-350"` 替换为 `class="dfi-input"`。

例如：

```html
<el-input class="width-350" size="medium" ...
```

改为：

```html
<el-input class="dfi-input" size="medium" ...
```

`el-input-number`、`el-select` 也同样处理。

- [ ] **Step 2: 在 `<style scoped>` 末尾追加 dfi-input 样式**

```scss
::v-deep .dfi-input {
  max-width: 480px;
  width: 100% !important;

  &.el-input--medium .el-input__inner,
  &.el-input-number--medium .el-input__inner {
    border-radius: var(--r-sm);
  }
}

::v-deep .dfi-input.is-disabled .el-input__inner,
::v-deep .dfi-input .el-input.is-disabled .el-input__inner {
  background: var(--c-surface-1);
  color: var(--c-text-secondary);
  border-color: var(--c-surface-3);
  cursor: default;
}
```

- [ ] **Step 3: yarn build**

Run: `yarn build 2>&1 | tail -5`
Expected: `Build complete.`

- [ ] **Step 4: Commit**

```
git add src/components/d-form/d-form-item.vue
git commit -m "feat(d-form): responsive input width and read-only disabled state"
```

---

## Task 13: DForm（三） — d-form.vue sticky footer + force switch

**Files:**
- Modify: `src/components/d-form/d-form.vue`

底部"强制覆盖" checkbox + 提交按钮的视觉改为 sticky bar + switch + 主按钮收敛。

- [ ] **Step 1: 改造 d-form.vue template footer 区**

修改 `src/components/d-form/d-form.vue` 整个 `<template>` 为：

```html
<template>
  <el-form :model="formData" ref="form" class="d-form">
    <DFormItem
      v-for="(item, key) in schema"
      :key="key"
      :schema="item"
      :origin-name="key"
      :prop-name="key"
      v-model="formData"
    >
    </DFormItem>
    <el-form-item class="d-form__footer" v-if="!noFooter">
      <div class="d-form__footer-inner">
        <label class="d-form__force">
          <el-switch v-model="force" active-color="var(--c-primary-solid)" />
          <span class="d-form__force-label">{{ $t('common.Force Override') }}</span>
        </label>
        <div class="d-form__btns">
          <el-button v-if="isShowCancel" @click="cancel">
            {{ cancelText || $t('common.Cancel') }}
          </el-button>
          <el-button
            v-if="isShowSubmit"
            :loading="loading"
            @click="validate"
            type="primary"
          >
            {{ submitText || $t('common.Create') }}
          </el-button>
        </div>
      </div>
    </el-form-item>
  </el-form>
</template>
```

- [ ] **Step 2: 在 `<style scoped>` 追加 d-form 样式**

如果 d-form.vue 没有 `<style>` 块，添加；否则替换内容：

```html
<style lang="scss" scoped>
.d-form {
  line-height: var(--lh-normal);

  &__footer {
    position: sticky;
    bottom: 0;
    background: var(--c-surface-0);
    border-top: 1px solid var(--c-surface-3);
    padding: var(--s-3) var(--s-5);
    margin: var(--s-4) calc(-1 * var(--s-5)) 0;
    z-index: 10;
  }

  &__footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__force {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    cursor: pointer;
    font-size: var(--fs-sm);
    color: var(--c-text-secondary);
  }

  &__btns {
    display: flex;
    gap: var(--s-2);
  }
}
</style>
```

注意：el-switch `active-color` 属性只接受具体颜色字符串，不能直接写 `var(...)`。该 prop 留 SCSS 默认即可（删除 active-color 属性，或用 element-variables 全局色）；如需保留绑定 token 色，可在 style scoped 内用 `::v-deep .el-switch.is-checked .el-switch__core { background-color: var(--c-primary-solid); border-color: var(--c-primary-solid); }`：

修改 template 中 `<el-switch v-model="force" active-color="var(--c-primary-solid)" />` 为：

```html
<el-switch v-model="force" />
```

然后在 style scoped 追加：

```scss
::v-deep .el-switch.is-checked .el-switch__core {
  background-color: var(--c-primary-solid);
  border-color: var(--c-primary-solid);
}
```

- [ ] **Step 3: yarn build**

Run: `yarn build 2>&1 | tail -5`
Expected: `Build complete.`

- [ ] **Step 4: Commit**

```
git add src/components/d-form/d-form.vue
git commit -m "feat(d-form): sticky footer with switch and refined button layout"
```

---

## Task 14: Element UI 主题微调追加（toast / message / dialog 默认覆盖）

**Files:**
- Modify: `src/app/theme/_element-ui-override.scss`

Element UI 的 `$message`、`$notify`、`$confirm` 用全局 CSS 覆盖（不能在 .vue scoped 内改）。本文件在 chalk 主题导入之后追加 `.el-message`、`.el-notification`、`.el-dialog`、`.el-drawer` 微调。

- [ ] **Step 1: 在 _element-ui-override.scss 文件末尾追加全局覆盖**

打开 `src/app/theme/_element-ui-override.scss`，在文件末尾（`@import '~element-ui-eoi/packages/theme-chalk/src/index';` 行之后）追加：

```scss
// ─────────────────────────────────────────────────
// Element UI 全局微调（chalk 之后追加，覆盖默认）
// ─────────────────────────────────────────────────

.el-message {
  border-radius: var(--r-md);
  border: 1px solid var(--c-surface-3);
  box-shadow: var(--sh-md);
  min-width: 320px;
  padding: var(--s-3) var(--s-4);

  &--success { border-left: 3px solid var(--c-success-solid); }
  &--warning { border-left: 3px solid var(--c-warning-solid); }
  &--error   { border-left: 3px solid var(--c-danger-solid); }
  &--info    { border-left: 3px solid var(--c-info-solid); }
}

.el-notification {
  border-radius: var(--r-md);
  box-shadow: var(--sh-lg);
  border: 1px solid var(--c-surface-3);
}

.el-message-box {
  border-radius: var(--r-lg);
  box-shadow: var(--sh-lg);

  &__header { padding: var(--s-4) var(--s-5); border-bottom: 1px solid var(--c-surface-3); }
  &__title  { font-size: var(--fs-md); font-weight: var(--fw-semibold); }
  &__content { padding: var(--s-4) var(--s-5); }
  &__btns   { padding: var(--s-3) var(--s-5); }
}

.el-tooltip__popper {
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);

  &.is-dark {
    background: var(--c-gray-700);
    color: var(--c-surface-0);
  }
}

.el-button {
  font-size: var(--fs-sm);
  border-radius: var(--r-sm);

  &--medium { padding: var(--s-2) var(--s-3); }
  &--small  { padding: 7px var(--s-3); }
  &--mini   { padding: 6px var(--s-2); font-size: var(--fs-xs); }
}

.el-input__inner {
  border-radius: var(--r-sm);
  font-size: var(--fs-sm);
}

.el-tag {
  border-radius: var(--r-sm);
  font-size: var(--fs-xs);
}
```

- [ ] **Step 2: yarn build**

Run: `yarn build 2>&1 | tail -5`
Expected: `Build complete.`

- [ ] **Step 3: Commit**

```
git add src/app/theme/_element-ui-override.scss
git commit -m "feat(theme): refine Element UI message/notification/dialog/button"
```

---

## Task 15: 共享组件目录残余 $primary-color → CSS var（全量）

**Files:**
- Modify: 任意 `src/components/**/*.scss` 或 `src/components/**/*.vue` 含 `$primary-color` 的文件
- Modify: 任意 `src/common/components/**/*.scss` 或 `src/common/components/**/*.vue` 含 `$primary-color` 的文件

P2 收尾时全量迁移共享组件中残留的 `$primary-color` 引用。**业务 view 不动**——`src/views/` 下的 `$primary-color` 留 P3 业务页改造时清理。

- [ ] **Step 1: 全量 grep 找出所有残余引用**

Run:
```
grep -rn "\$primary-color" src/components/ src/common/components/ 2>/dev/null
```

记录所有命中文件与行号。预期文件可能包括（但不限于）：
- `src/components/time-filter/time-filter.scss`
- `src/common/components/time-range/time-range.scss`
- `src/components/sql-code-mirror/sql-code-mirror.vue`（如有 inline scss 引用）
- `src/components/overview-base/...`
- `src/common/components/sharp-selector/...`

实际命中以 grep 输出为准。

- [ ] **Step 2: 全量替换**

对所有命中文件，用 sed 批量替换：

```
grep -rl "\$primary-color" src/components/ src/common/components/ 2>/dev/null \
  | xargs -I {} sed -i 's/\$primary-color/var(--c-primary-solid)/g' {}
```

- [ ] **Step 3: 复查替换完整（无残留）**

Run:
```
grep -rn "\$primary-color" src/components/ src/common/components/ 2>/dev/null | wc -l
```

Expected: `0`

如果还有命中（罕见情况：SCSS @if/@else 内部、字符串内 token 名等），手动处理或保留并在 commit message 说明原因。

- [ ] **Step 4: yarn build**

Run: `yarn build 2>&1 | tail -5`
Expected: `Build complete.`

- [ ] **Step 5: 列出被修改的文件**

Run: `git status --short src/components/ src/common/components/`

记录改动列表，用于 Step 6 commit message。

- [ ] **Step 6: Commit**

```
git add src/components/ src/common/components/
git commit -m "refactor(theme): migrate residual \$primary-color in shared components to var(--c-primary-solid)"
```

---

## Task 16: 全局 yarn lint:style + 验证

**Files:**
- 无文件改动

- [ ] **Step 1: 跑 stylelint**

Run: `yarn lint:style 2>&1 | tail -5`
Expected: 0 errors。warning 数量与 P1 baseline 接近（P2 引入新组件、修改 SCSS，warning 可能略增）。

如果出现新 error（非 warning），停止并报告原因。

- [ ] **Step 2: 跑 verify-tokens**

Run: `node scripts/verify-tokens.mjs`
Expected: `PASS: 94 tokens verified`（token 表本任务不动）

- [ ] **Step 3: 检查后端契约 0 变更**

Run: `git diff main..HEAD --stat -- src/apis/ src/services/router.ts`
Expected: 输出为空。

- [ ] **Step 4: 检查业务 view 0 改动**

Run: `git diff feat/p1-design-tokens..HEAD --stat -- src/views/`
Expected: 只有 `src/views/layout/layout.vue` 在差异列表，不应有其他业务 view 改动。

如果有其他 view 改动，停止并报告。

无 commit。

---

## Task 17: 12-view 走查 + walkthrough 记录（自动化部分）

**Files:**
- Create: `docs/superpowers/plans/p2-screenshots/baseline/walkthrough.md`
- 不修改其他文件

P2 改了 chrome（顶栏 + 集群 tab）+ 共享组件视觉。每个 view 都会看到 chrome 视觉变化，但内容区视觉应保持原状（除使用 PageHeader 之外，业务页未改造）。

- [ ] **Step 1: 跑 yarn build 与 lint:style 最终验证**

Run: `yarn build 2>&1 | tail -5`
Expected: `Build complete.`

Run: `yarn lint:style 2>&1 | tail -3`
Expected: 0 errors。

- [ ] **Step 2: 创建 walkthrough.md 记录**

Create `docs/superpowers/plans/p2-screenshots/baseline/walkthrough.md`：

```markdown
# P2 12-view 走查记录

## 自动化验证

| 项 | 结果 |
|---|---|
| yarn build | <填实际：PASS/FAIL> |
| verify-tokens (94 tokens) | <填实际> |
| yarn lint:style | <填实际：N warnings / 0 errors> |
| 后端契约 0 变更（src/apis + router.ts diff） | <PASS/FAIL> |
| src/views/ 仅 layout.vue 改动 | <PASS/FAIL> |

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
```

填入实际验证数值替换 `<填实际>` 与 `<PASS/FAIL>` 占位符。

- [ ] **Step 3: Commit**

```
git add docs/superpowers/plans/p2-screenshots/
git commit -m "docs(p2): record P2 walkthrough automation results"
```

---

## Task 18: 推送分支并创建 PR

**Files:**
- 无文件改动

- [ ] **Step 1: 最终确认所有验证通过**

Run:
```
yarn build 2>&1 | tail -3
node scripts/verify-tokens.mjs
yarn lint:style 2>&1 | grep -c " error " || echo 0
git diff feat/p1-design-tokens..HEAD --stat -- src/apis/ src/services/router.ts
```

Expected:
- yarn build: Build complete.
- verify-tokens: PASS: 94 tokens verified
- lint:style errors: 0
- src/apis + router.ts diff: 空

- [ ] **Step 2: 推送分支**

Run: `git push -u origin feat/p2-layout-shared-components`

如失败，确认 remote 已配置（可能需要 origin 已存在）。

- [ ] **Step 3: 创建 PR**

Run:
```
gh pr create --title "feat(layout/components): P2 layout & shared components visual upgrade" --body "$(cat <<'EOF'
## Summary

P2 实施视觉精雕项目的第二阶段：

- 重构 `views/layout/layout.vue` 为 L2 形态（深色顶栏 + 金色下边线 + 集群子页 tab 上移、删除底栏）
- 新增 `PageHeader`、`EmptyState` 两个通用组件
- 重做 Breadcrumb、sharp-modal、sharp-drawer、v-loading、r-tabset、DForm 共享组件视觉
- `_element-ui-override.scss` 追加 el-message / el-notification / el-dialog / button / input / tag 全局微调
- 残余共享组件 SCSS 中 \`\$primary-color\` 迁移到 \`var(--c-primary-solid)\` token

**业务 view template 0 改动**——所有 12 个 view 通过 chrome + 共享组件继承新视觉。

## What changed

- `src/views/layout/layout.vue`: 顶栏深色 + brand dot + 集群子页 tab 上移 + 删除 footer + main 背景 token 化
- 新增：`src/components/page-header/`、`src/components/empty-state/`
- 改造：`src/components/breadcrumb.vue`、`src/components/d-form/d-form.vue`、`src/components/d-form/d-form-item.vue`
- 改造（仅样式）：`src/common/components/sharp-modal-drawer/`、`src/common/components/v-loading/`、`src/common/components/r-tabset/`、`src/components/time-filter/`、`src/common/components/time-range/`
- 追加：`src/app/theme/_element-ui-override.scss` 全局组件覆盖
- 微调：`src/common/app/global.scss` body 背景 token 化

## 后端契约

- \`src/apis/*\` **0 变更**
- \`src/services/router.ts\` **0 变更**
- 业务 view \`src/views/{home,overview,manage,tables,data-manage,query-execution,session,settings,task,login,home-setting,docs}/**\` **0 变更**（仅 \`src/views/layout/\` 改 chrome）

## Test plan

- [x] yarn build 通过
- [x] verify-tokens 94 tokens PASS
- [x] yarn lint:style 0 error
- [x] 后端契约 0 变更
- [x] 业务 view 0 改动（仅 layout.vue）
- [ ] **人工**：浏览器 12 view 走查（chrome 变化如期、内容区无意外变化）
- [ ] **人工**：浏览器 Console 0 新增 error/warning
- [ ] **人工**：sharp-modal / sharp-drawer / DForm 视觉确认

## 不在 P2 范围

- RunDetailDrawer / TaskDetailDrawer 留 P3
- StatusBadge / ProgressCard 留 P3
- 12 view 业务页 IA 重排（home/overview/manage/tables/data-manage/query-execution）留 P3
- stylelint 规则升级到 error 留 P3+

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: 在 PR 中粘贴 12-view 截图（人工）**

通过 GitHub UI 上传 chrome 视觉对比截图。

PR URL 输出后，本任务结束。

---

## P2 验收清单（整体）

完成所有 Task 后必须满足：

- [ ] `yarn build` 通过
- [ ] `node scripts/verify-tokens.mjs` PASS（94 tokens 不变）
- [ ] `yarn lint:style` 0 errors
- [ ] 后端契约 0 变更（`git diff feat/p1-design-tokens..HEAD --stat -- src/apis/ src/services/router.ts` 输出空）
- [ ] `src/views/` 仅 `layout.vue` 改动（其他 11 个 view 0 改）
- [ ] `vue.config.js` 未改
- [ ] `_tokens.scss` 未改（token 表锁定）
- [ ] PageHeader / EmptyState 组件已注册到全局
- [ ] sharp-modal / sharp-drawer / Breadcrumb / v-loading / r-tabset / DForm 视觉已升级（人工对照截图）
- [ ] el-message / el-notification / el-dialog 全局微调已注入（人工触发 toast 验证）
- [ ] 顶栏深色化、集群 tab 上移、底栏移除（人工浏览器验证）
- [ ] PR 在 GitHub 上创建并含截图

---

## 不在 P2 范围（明确划清）

- ❌ RunDetailDrawer / TaskDetailDrawer 新建（留 P3）
- ❌ StatusBadge / ProgressCard 新建（留 P3）
- ❌ 6 个 IA 重排页面（home/overview/manage/tables/data-manage/query-execution）→ P3
- ❌ stylelint 规则升级到 error → P3 起
- ❌ `src/common/app/global.scss` 中残余硬编码色（如 `#E06E7C`、`#4A90E2`、`#5CC20D` 等）的全面 token 化 → P3 业务页改造时一并清理
- ❌ ECharts theme 从 primary 切换到 ckman → P3/P4
- ❌ vue-cli → Vite 迁移
- ❌ Vue 2 → Vue 3 迁移
- ❌ 删除 `src/app/variables.scss` 兼容层 → P4
- ❌ 删除 `src/app/echarts-themes/primary.ts` → P4
- ❌ TypeScript 严格模式打开

---

## 风险与提醒

| 风险 | 提醒 |
|---|---|
| layout.vue 改造影响 12 个 view 的 chrome 视觉 | 这是 P2 的预期变化，PR 描述与 walkthrough 已写明 |
| 集群子页 tab 上移后 main 内容区高度需重算 | 顶栏 48px + cluster-tabs 40px = 88px 占顶部；main 用 flex-1 自适应即可 |
| sharp-modal 圆角 8px 与 vxe-table override 圆角风格 | 共用 `--r-lg`（8px）保持一致 |
| Element UI `.el-tooltip__popper.is-dark` 覆盖与现有 sharp-tooltip 行为 | 我们只改背景色，不改 markup，sharp-tooltip 完全兼容 |
| DForm 重做后既有 cluster create 流程 i18n key 仍能匹配 | template 中 i18n key 引用方式未变（`schema['label_' + lang]`），数据流不动 |
| 用户在 chrome 改造后找不到集群切换 | 集群切换器**P3 阶段才加**到顶栏（涉及业务交互），P2 用户从 home 切集群即可，与现状一致 |
| stylelint warning 数量上涨 | DForm 重做引入新 scss 文件，部分硬编码（如 `#FFFFFF`）触发 warning，但**新代码应零硬编码**——若有 warning 来自新文件，需修复 |
