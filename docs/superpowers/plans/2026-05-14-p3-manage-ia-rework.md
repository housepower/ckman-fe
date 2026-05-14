# P3-manage — 节点管理页 IA 重排（保守版）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `views/manage/manage.vue` 做保守 IA 重排——PageHeader 替代 breadcrumb、集群级操作搬到 PageHeader actions、升级集群区与节点列表区卡片化、表格 token 化、节点行操作列改 ⋮ 菜单。**不动后端 API、不动升级流程、不动批量操作（暂不引入多选+批量栏）、不动节点对话框**（addNode / deleteNode / inputPassword / viewLog 全部保留）。

**Architecture:** 单文件改造 `src/views/manage/manage.vue`。template 整体重写为 PageHeader（actions=Start/Stop/Destroy/Upgrade dropdown）+ 升级区卡片 +  节点列表卡片（含 vxe-table）+ 操作列 dropdown。script 仅新增 `onNodeCommand` 派发函数与 i18n 词条；既有 methods 与 modals 调用全部保留不动。

**Tech Stack:** Vue 2.6 / Element UI eoi / vxe-table 3 / P1 design tokens / P2 PageHeader

**前置依赖：** P3-overview 分支 `feat/p3-overview-ia` 已完成。P3-manage 从 P3-overview 拉新分支 `feat/p3-manage-ia`。

---

## File Structure

```
src/views/manage/
  manage.vue                ★ 单文件改造：template + 新增 onNodeCommand + scoped style 重写
  modal/
    addNode.vue             不动
    deleteNode.vue          不动
    inputPassword.vue       不动
    viewLog.vue             不动
```

**显式不动**：
- `src/apis/cluster.ts` — manageCluster / onlineClusterNode / offlineClusterNode / addClusterNode / deleteClusterNode / getClusterInfo 调用方式不变
- `src/apis/package.ts` — getList 不变
- `src/services/router.ts`
- `src/constants/ClusterStatus.ts`
- 升级集群流程的 form 字段与提交参数（packageVersion / policy / skip / keeper）
- TaskDetail modal 弹窗逻辑

---

## Task 1: 启动 P3-manage 工作分支

- [ ] **Step 1: 验证 git 状态干净，HEAD 是 P3-overview**

Run: `git status && git branch --show-current`
Expected: `nothing to commit`；branch `feat/p3-overview-ia`。

如不在 P3-overview 分支：
```
git checkout feat/p3-overview-ia
```

- [ ] **Step 2: 创建 P3-manage 分支**

Run: `git checkout -b feat/p3-manage-ia`
Expected: `Switched to a new branch 'feat/p3-manage-ia'`

- [ ] **Step 3: baseline 编译**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 4: verify-tokens**

Run: `node scripts/verify-tokens.mjs`
Expected: `PASS: 94 tokens verified`

无 commit。

---

## Task 2: PageHeader 替代 breadcrumb + 集群级操作 dropdown

**Files:**
- Modify: `src/views/manage/manage.vue`

把现状的 `<breadcrumb :data="..." :slot=default>` 替换为 PageHeader（crumb + title="节点管理"）。集群级操作按钮（Start / Stop / Destroy）从 breadcrumb 的 slot 搬到 PageHeader actions，按"主操作 button + 危险操作 dropdown"分组。

- [ ] **Step 1: 改 template 顶部**

打开 `src/views/manage/manage.vue`，把第 1-13 行的：

```html
<template>
  <main class="settings">
    <breadcrumb :data="['Clusters', $route.params.id, 'manage']">
      <template v-slot:default>
        <el-button type="primary"
                   size="mini"
                   class="fs-14"
                   v-for="item of clusterStatus"
                   :key="item"
                   :disabled="isStatusDisable(item)"
                   @click="clusterOperation(item)">{{$t('manage.' + item + ' Cluster')}}</el-button>
      </template>
    </breadcrumb>
```

替换为：

```html
<template>
  <main class="manage-page">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console'), $route.params.id]"
      :title="$t('home.Manage')"
    >
      <template #actions>
        <el-button
          v-for="item of clusterStatus"
          :key="item"
          :disabled="isStatusDisable(item)"
          size="medium"
          :type="item === 'Destroy' ? 'danger' : 'default'"
          @click="clusterOperation(item)"
        >
          {{ $t('manage.' + item + ' Cluster') }}
        </el-button>
      </template>
    </PageHeader>
```

注意：
- 类名 `main.settings` 改为 `main.manage-page`
- `breadcrumb` → `PageHeader`（已全局注册，无需 import）
- 按钮去掉 `fs-14` 硬编码字号、`size="mini"` → `size="medium"`（与 home 一致）
- Destroy 用 type="danger"，其余 default

- [ ] **Step 2: yarn build 验证**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 3: Commit**

```
git add src/views/manage/manage.vue
git commit -m "feat(manage): replace breadcrumb with PageHeader + actions"
```

---

## Task 3: 升级集群区卡片化

**Files:**
- Modify: `src/views/manage/manage.vue`

升级集群区现状用 `<div class="uprade ptb-15">` 简单容器，字号硬编码。改为白底卡片 + token + 字号统一。

- [ ] **Step 1: 改升级区 template**

把当前升级区（约第 14-50 行）：

```html
<section class="container">
  <div class="uprade ptb-15">
    <span class="fs-18 font-bold mb-15 inline-block">{{$t('manage.Upgrade Cluster')}}</span>
    <div class="">
      <span class="fs-14 font-bold">{{$t('home.ClickHouse Version')}}: {{ list.version }}</span>
      <template v-if="mode === 'deploy'">
        <span class="fs-14 font-bold ml-30">{{$t('manage.Upgrade to')}}:</span>
        <el-select v-model="packageVersion" ...>
          ...
        </el-select>
        <span class="fs-14 font-bold ml-0">{{$t('manage.Policy')}}:</span>
        <el-select v-model="policy" ...>
          <el-option :label="$t('manage.Full')" value="Full"></el-option>
          <el-option :label="$t('manage.Rolling')" value="Rolling"></el-option>
        </el-select>
        <el-checkbox v-model="skip" class="mr-50">{{$t('manage.skip same version')}}</el-checkbox>
        <el-checkbox v-model="keeper" class="mr-50">{{$t('manage.skip keeper')}}</el-checkbox>
        <el-button type="primary" ...>{{$t('common.Upgrade')}}</el-button>
      </template>
    </div>
  </div>
```

替换为：

```html
<div class="upgrade-card">
  <h3 class="upgrade-card__title">{{ $t('manage.Upgrade Cluster') }}</h3>
  <div class="upgrade-card__row">
    <span class="upgrade-card__label">{{ $t('home.ClickHouse Version') }}:</span>
    <span class="upgrade-card__value">{{ list.version }}</span>
  </div>
  <div class="upgrade-card__row" v-if="mode === 'deploy'">
    <span class="upgrade-card__label">{{ $t('manage.Upgrade to') }}:</span>
    <el-select
      v-model="packageVersion"
      size="small"
      clearable
      filterable
      class="upgrade-card__select"
    >
      <el-option
        v-for="item in versionOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      ></el-option>
    </el-select>
    <span class="upgrade-card__label">{{ $t('manage.Policy') }}:</span>
    <el-select
      v-model="policy"
      size="small"
      clearable
      filterable
      class="upgrade-card__select"
    >
      <el-option :label="$t('manage.Full')" value="Full"></el-option>
      <el-option :label="$t('manage.Rolling')" value="Rolling"></el-option>
    </el-select>
    <el-checkbox v-model="skip">{{ $t('manage.skip same version') }}</el-checkbox>
    <el-checkbox v-model="keeper">{{ $t('manage.skip keeper') }}</el-checkbox>
    <el-button
      type="primary"
      size="small"
      :disabled="!packageVersion"
      @click="clusterOperation('upgrade')"
    >
      {{ $t('common.Upgrade') }}
    </el-button>
  </div>
</div>
```

注意：
- 用 BEM 类名 `upgrade-card__*`
- 删除 `<section class="container">` 包裹（节点列表卡片自带容器）
- 去掉硬编码 fs-14 / fs-16 / fs-18 / ml-30 / mr-50 等 class

- [ ] **Step 2: yarn build**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 3: Commit**

```
git add src/views/manage/manage.vue
git commit -m "feat(manage): refactor upgrade region into card with token styles"
```

---

## Task 4: 节点列表卡片化 + 工具栏整理

**Files:**
- Modify: `src/views/manage/manage.vue`

把节点列表区（含 Add Node 按钮 + 搜索 + vxe-table）整体包入 `list-card` 卡片；工具栏改为一行（Add Node 在左、搜索在右）。

- [ ] **Step 1: 改节点列表区 template**

把当前 `<div class="node-list">` 整块（约第 51-131 行）：

```html
<div class="node-list">
  <h3 class="mt-15 mb-30">{{$t('home.ClickHouse Node List')}}</h3>
  <div class="search flex flex-between pull-left">
    <el-button type="primary" v-if="mode === 'deploy'" size="medium" class="fs-16" @click="addNode">{{$t('manage.Add Node')}}</el-button>
  </div>
  <AddNodeDialog ... />
  <vxe-toolbar zoom custom class="pull-right">
    <template #buttons>
      <el-input v-model="input" ... class="width-300"></el-input>
    </template>
  </vxe-toolbar>
  <vxe-table class="mt-10" ...>
    ...
  </vxe-table>
</div>
```

替换为：

```html
<div class="node-card">
  <div class="node-card__header">
    <h3 class="node-card__title">{{ $t('home.ClickHouse Node List') }}</h3>
    <div class="node-card__actions">
      <el-input
        v-model="input"
        :placeholder="$t('common.keyword search')"
        autocomplete="off"
        clearable
        size="medium"
        suffix-icon="el-icon-search"
        class="node-card__search"
      />
      <el-button
        v-if="mode === 'deploy'"
        type="primary"
        size="medium"
        @click="addNode"
      >
        <i class="el-icon-plus"></i>
        {{ $t('manage.Add Node') }}
      </el-button>
    </div>
  </div>
  <AddNodeDialog
    :visible.sync="addNodeDialogVisible"
    :nodes="list.nodes"
    @close="addNodeDialogVisible = false"
    @onOk="onAddNodeSuccess"
    :numberRange="numberRange"
    :password="password"
  />
  <vxe-table
    v-bind="gridOptions"
    :data="queryList"
  >
    <!-- vxe-column 配置在 Task 5 处理 -->
  </vxe-table>
</div>
```

注意：
- 删除 `<vxe-toolbar>`（搜索框已上移到 node-card__header）
- `<vxe-table>` 去掉 `border` 属性（卡片边界已经划分了区域）
- 保留 `gridOptions` / `queryList` 引用不变

- [ ] **Step 2: yarn build**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 3: Commit**

```
git add src/views/manage/manage.vue
git commit -m "feat(manage): wrap node list in card with unified toolbar"
```

---

## Task 5: 节点表格列 token 化（状态点 + IP cell）

**Files:**
- Modify: `src/views/manage/manage.vue`

把 vxe-column 内的 status dot 与 ip cell 改为 token 化样式。columns 数组保留不动。

- [ ] **Step 1: 改 vxe-column slot-scope 渲染**

打开 `src/views/manage/manage.vue`，找到 `<vxe-table>` 内的循环列模板（slot-scope），把 status 与 ip 分支改为：

```html
<vxe-table
  v-bind="gridOptions"
  :data="queryList"
>
  <vxe-column
    v-for="(col, index) in columns"
    :key="index"
    :field="col.prop"
    show-overflow-tooltip
    :title="col.label"
    :filters="col.filters || null"
    sortable
    align="left"
  >
    <template slot-scope="{ row, column }">
      <div v-if="col.prop === 'status'" class="status-cell">
        <span class="status-dot" :class="`status-dot--${row.status}`"></span>
        <span class="status-cell__text">{{ row.status }}</span>
        <span class="status-cell__uptime">{{ row.uptime }}</span>
      </div>
      <div v-else-if="col.prop === 'ip'" class="ip-cell">
        <span class="ip-cell__text">{{ row.ip }}</span>
        <el-tooltip :content="$t('manage.Open Play UI')" placement="top">
          <el-button
            type="text"
            icon="el-icon-link"
            class="ip-cell__action"
            @click="openHttpWeb(row.ip, httpPort)"
          />
        </el-tooltip>
      </div>
      <span v-else>{{ row[column.property] }}</span>
    </template>
  </vxe-column>
```

注意：
- `align="center"` 改 `align="left"`（左对齐更易扫读）
- 删除 ip-cell 中无关包裹的硬编码 class
- status / ip cell 用 BEM 类名

- [ ] **Step 2: yarn build**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 3: Commit**

```
git add src/views/manage/manage.vue
git commit -m "feat(manage): tokenize status dot and ip cell rendering"
```

---

## Task 6: 操作列改 ⋮ dropdown menu

**Files:**
- Modify: `src/views/manage/manage.vue`

把节点行操作列（Offline / Online / View Log / Delete 4 个 el-button）合并为单个 ⋮ dropdown 菜单。Online / Offline 互斥（按 status 显示其一）。

- [ ] **Step 1: 改操作列**

找到 vxe-table 末尾的操作列（约现在的第 117-129 行）：

```html
<vxe-column :title="$t('home.Actions')"
  v-if="mode === 'deploy'"
  width="250"
  align="center">
  <template slot-scope="{ row }">
    <el-button type="text" v-if="row.status === 'green'" @click="offlineClusterNode(row)" :loading="row.offlineLoading">{{ $t('manage.Offline') }}</el-button>
    <el-button type="text" v-if="row.status === 'red'" @click="onlineClusterNode(row)" :loading="row.onlineLoading">{{ $t('manage.Online') }}</el-button>
    <el-button type="text" @click="viewClusterLog(row)">{{ $t('manage.View Log') }}</el-button>
    <el-button type="text" @click="remove(row)">{{ $t('common.Delete') }}</el-button>
  </template>
</vxe-column>
```

替换为：

```html
<vxe-column
  :title="$t('home.Actions')"
  v-if="mode === 'deploy'"
  width="100"
  align="center"
>
  <template slot-scope="{ row }">
    <el-dropdown trigger="click" @command="onNodeCommand($event, row)">
      <i class="fa fa-ellipsis-v node-row-more"></i>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item v-if="row.status === 'green'" command="offline">
          <i class="el-icon-turn-off"></i>
          {{ $t('manage.Offline') }}
        </el-dropdown-item>
        <el-dropdown-item v-if="row.status === 'red'" command="online">
          <i class="el-icon-open"></i>
          {{ $t('manage.Online') }}
        </el-dropdown-item>
        <el-dropdown-item command="log">
          <i class="el-icon-document"></i>
          {{ $t('manage.View Log') }}
        </el-dropdown-item>
        <el-dropdown-item command="delete" class="node-row-delete-item">
          <i class="el-icon-delete"></i>
          {{ $t('common.Delete') }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </template>
</vxe-column>
```

- [ ] **Step 2: 在 methods 加 onNodeCommand 派发**

在 `src/views/manage/manage.vue` 的 `methods` 对象内（与 `remove` 方法同级）添加：

```js
    onNodeCommand(command, row) {
      switch (command) {
        case 'offline':
          this.offlineClusterNode(row);
          break;
        case 'online':
          this.onlineClusterNode(row);
          break;
        case 'log':
          this.viewClusterLog(row);
          break;
        case 'delete':
          this.remove(row);
          break;
      }
    },
```

不修改原 4 个 method（offlineClusterNode / onlineClusterNode / viewClusterLog / remove）。

- [ ] **Step 3: yarn build**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 4: Commit**

```
git add src/views/manage/manage.vue
git commit -m "feat(manage): collapse node row actions into ⋮ dropdown menu"
```

---

## Task 7: 全局 scoped style 重写 + 全局验证

**Files:**
- Modify: `src/views/manage/manage.vue`

把 `<style scoped>` 全量重写为 token + 卡片化的 BEM 规则。同时把因 dropdown 渲染到 body portal 而无法应用 scoped 的样式（node-row-delete-item）写到非 scoped 块。

- [ ] **Step 1: 替换 `<style lang="scss" scoped>` 整块**

找到 `src/views/manage/manage.vue` 文件末尾的 `<style lang="scss" scoped>...</style>` 整段，替换为：

```html
<style lang="scss" scoped>
.manage-page {
  padding-bottom: var(--s-8);
}

.upgrade-card,
.node-card {
  background: var(--c-surface-0);
  border: 1px solid var(--c-surface-3);
  border-radius: var(--r-lg);
  padding: var(--s-4);
  margin-top: var(--s-3);
}

.upgrade-card {
  &__title {
    font-size: var(--fs-md);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    margin: 0 0 var(--s-3);
    line-height: var(--lh-tight);
  }

  &__row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--s-3);
    font-size: var(--fs-sm);
    margin-bottom: var(--s-2);

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__label {
    color: var(--c-text-secondary);
    font-weight: var(--fw-medium);
  }

  &__value {
    color: var(--c-text-primary);
    font-weight: var(--fw-semibold);
  }

  &__select {
    width: 200px;
  }
}

.node-card {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--s-3);
    gap: var(--s-3);
  }

  &__title {
    font-size: var(--fs-md);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    margin: 0;
    line-height: var(--lh-tight);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--s-2);
  }

  &__search {
    width: 280px;
  }
}

.status-cell {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);

  &__text {
    color: var(--c-text-primary);
    font-weight: var(--fw-medium);
    text-transform: capitalize;
  }

  &__uptime {
    color: var(--c-text-tertiary);
    font-size: var(--fs-xs);
    margin-left: var(--s-2);
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &--green  { background: var(--c-success-solid); }
  &--red    { background: var(--c-danger-solid); }
  &--yellow { background: var(--c-warning-solid); }
}

.ip-cell {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);

  &__text {
    font-variant-numeric: tabular-nums;
    color: var(--c-text-primary);
  }

  &__action {
    color: var(--c-text-tertiary);
    padding: 0 var(--s-1);

    &:hover {
      color: var(--c-primary-solid);
    }
  }
}

.node-row-more {
  color: var(--c-text-tertiary);
  font-size: var(--fs-md);
  cursor: pointer;
  padding: var(--s-1);

  &:hover {
    color: var(--c-text-primary);
  }
}
</style>

<!-- 非 scoped 全局规则：el-dropdown-menu 被 Element UI teleport 到 body，scoped 选择器不可达 -->
<style lang="scss">
.node-row-delete-item {
  color: var(--c-danger-fg) !important;

  i {
    margin-right: var(--s-1);
  }
}
</style>
```

注意：保留原 `<style scoped>` 之外的所有 `<script>` 内容；只替换 scoped style 块并追加非 scoped 块。

- [ ] **Step 2: yarn build**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 3: lint:style**

Run: `yarn lint:style 2>&1 | grep -c " error " || echo 0`
Expected: `0`

- [ ] **Step 4: verify-tokens**

Run: `node scripts/verify-tokens.mjs`
Expected: `PASS: 94 tokens verified`

- [ ] **Step 5: 后端契约 0 改动**

Run: `git diff feat/p3-overview-ia..HEAD --stat -- src/apis/ src/services/router.ts`
Expected: 输出为空。

- [ ] **Step 6: 仅 manage.vue 改动**

Run: `git diff feat/p3-overview-ia..HEAD --stat -- src/views/ src/components/ src/services/`
Expected: 只有 `src/views/manage/manage.vue`。

- [ ] **Step 7: Commit**

```
git add src/views/manage/manage.vue
git commit -m "feat(manage): rewrite scoped style with tokens + card containers"
```

---

## Task 8: walkthrough 记录

**Files:**
- Create: `docs/superpowers/plans/p3-manage-screenshots/walkthrough.md`

- [ ] **Step 1: 创建 walkthrough.md**

Create `docs/superpowers/plans/p3-manage-screenshots/walkthrough.md`：

```markdown
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
- [ ] 升级集群区：白底圆角卡片，标题 14px 加粗，字段 + select + checkbox + Upgrade 按钮在同一行
- [ ] 节点列表区：白底圆角卡片，头部 "ClickHouse Node List" 标题 + 右侧 搜索框 + Add Node 按钮
- [ ] 表格：状态列状态点（green=绿 / red=红 / yellow=黄）+ uptime；IP 列含数字字体 + 链接图标
- [ ] 操作列：单个 ⋮ 图标，点击展开菜单含 Offline/Online/Log/Delete（Delete 红色）

### 交互
- [ ] Start Cluster 按钮：状态 red 时可用，发送 manageCluster('start')
- [ ] Stop Cluster：状态非 red 时可用
- [ ] Destroy Cluster：danger 按钮，二次确认
- [ ] Upgrade：选 packageVersion + policy + Upgrade 按钮触发 manageCluster('upgrade')
- [ ] Add Node：弹出 AddNodeDialog
- [ ] 操作列 ⋮：Offline/Online 互斥（按 status），点击触发原 onNodeCommand → offlineClusterNode/onlineClusterNode/viewClusterLog/remove

### 数据
- [ ] 搜索框过滤 hostname/ip/status 三个字段
- [ ] 升级版本 select 选项来自 PackageApi.getList，当前已部署版本 disabled

### 边角
- [ ] mode === 'import' 时：Upgrade 区只显示 ClickHouse Version 一行（不显示升级控件）；Add Node 按钮不可见；操作列整列不可见
- [ ] mode === 'deploy' 时所有功能可见

## 验收结论

- [x] yarn build 通过
- [x] 94 tokens
- [x] lint:style 0 errors
- [x] 后端契约 0 变更
- [x] 仅 manage.vue 改动
- [ ] 视觉与交互人工验证待补
```

- [ ] **Step 2: Commit**

```
git add docs/superpowers/plans/p3-manage-screenshots/
git commit -m "docs(p3-manage): walkthrough automation results"
```

---

## P3-manage 验收清单（整体）

- [ ] yarn build 通过
- [ ] verify-tokens 94 tokens
- [ ] lint:style 0 errors
- [ ] src/apis/ 0 改动
- [ ] src/services/router.ts 0 改动
- [ ] 仅 src/views/manage/manage.vue 改动
- [ ] PageHeader + 集群级操作按钮 (Start/Stop/Destroy)
- [ ] 升级集群区卡片化 + token
- [ ] 节点列表区卡片化 + token
- [ ] 节点行 status dot + ip cell
- [ ] 节点操作列 ⋮ dropdown
- [ ] node-row-delete-item 红色（通过非 scoped style 应用）

---

## 不在 P3-manage 范围

- ❌ 多选 checkbox + 底部批量操作栏（保留 P4 或后续）
- ❌ shard/replica 改徽章（保留为列展示，下次精修可加）
- ❌ disk 列 mini bar 可视化（保留文本展示）
- ❌ ZooKeeper 节点列表 / 表配置（manage 页若有 zookeeper 列继续保留原样）
- ❌ 升级流程任何后端字段 / 参数变化
- ❌ AddNodeDialog / DeleteNodeDialog / inputPassword / viewLog 任何变化
- ❌ TaskDetail modal 弹窗

---

## 风险与提醒

| 风险 | 提醒 |
|---|---|
| vxe-table 内 dropdown 在 portal 渲染 | `.node-row-delete-item` 已放非 scoped block 应用红色，参照 P3-home 的 row-actions__delete-item 模式 |
| Start / Stop / Destroy 按钮在 PageHeader actions 排列宽度 | actions 区默认 flex；3 个 button + Destroy danger 视觉应不挤；若窄屏挤，下一轮加 `el-button-group` 或 dropdown 收纳 |
| `el-dropdown-item v-if="row.status === 'green'"` 会在切换时重新挂载 | Vue 2 v-if 切换是常规渲染，无副作用 |
| `align="left"` 改变全部 vxe-column 对齐 | 原 status 列右对齐 uptime，新方案 status-cell flex 内部处理，应能保留视觉 |
| `mode === 'import'` 时 Add Node 按钮 v-if 已隐藏 | 不变；操作列也整列 v-if="mode === 'deploy'" |
| `clusterStatus` 数组在 mounted 中生成，依赖 ClusterStatus 常量 | 不动 |
