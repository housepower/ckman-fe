# P3-home — 集群列表页 IA 重排 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `src/views/home/home.vue`（集群列表页 / 登录后首页）按 spec §8.1 重排——删除占位 hero 区、引入 PageHeader、加 4 张统计卡、工具栏含 chip 筛选、表格列合并精简、操作列 hover-only。**不动后端 API、不动数据获取逻辑、不动路由**。

**Architecture:** 仅改 `home.vue` 单文件 template + script computed + scoped style。容器层用 P2 已就绪的 `PageHeader` 组件；卡片 / chip / 状态点全部内联 BEM scoped style + token；表格仍用 `el-table`（保留 sortable / filter 能力），通过 `slot-scope` 重组列内容。

**Tech Stack:** Vue 2.6 / Element UI eoi / P1 design tokens / P2 PageHeader 组件

**前置依赖：** P2 分支 `feat/p2-layout-shared-components` 已完成（PageHeader 可用）。P3-home 从 P2 分支拉新分支 `feat/p3-home-ia`。

---

## File Structure

```
src/views/home/
  home.vue                     ★ 整体重写：template + computed + scoped style
                                 - <script> 中 fetchData 不动、createCk / importCk / toCluster / remove 不动
                                 - 仅 computed 增加 stats、filterMode、filterReplica
                                 - template 整体重写
                                 - <style scoped> 全量重写

src/views/home/index.ts         不动
src/views/home/modals/importCk  不动
src/views/home/create-cluster.vue  不动
```

**显式不动**：
- `src/apis/cluster.ts` — `ClusterApi.getCluster` / `deleteCluster` 调用方式不变
- `src/services/router.ts` — `/clusters` 路由不变
- 任何其他 view、共享组件
- `src/components/page-header/` — P2 已建，本计划只消费

---

## 数据派生约定

后端 `ClusterApi.getCluster()` 返回 `entity` 是 `{ [name]: cluster }` 形状。每个 cluster 含字段：`cluster`、`logic_cluster`、`mode` ('deploy'|'import')、`isReplica` (bool)、`hosts` (string[] → 前端 join 为 string)、`count`、`comment`。

**派生统计**（无后端新增字段）：
- `total` = list.length
- `deployCount` = filter mode === 'deploy'
- `importCount` = filter mode === 'import'
- `replicaCount` = filter isReplica === true

**筛选 chip 状态机**：
- `filterMode`: 'all' | 'deploy' | 'import'
- `filterReplica`: boolean（true 表示 only-replica）

---

## Task 1: 启动 P3-home 工作分支

**Files:**
- 无文件改动

- [ ] **Step 1: 检查 git 状态干净，且当前 HEAD 是 P2 分支**

Run: `git status && git branch --show-current`
Expected: `nothing to commit, working tree clean`；当前分支 `feat/p2-layout-shared-components`。

如果不在 P2 分支：
```
git checkout feat/p2-layout-shared-components
```

- [ ] **Step 2: 从 P2 分支创建 P3-home 分支**

Run: `git checkout -b feat/p3-home-ia`
Expected: `Switched to a new branch 'feat/p3-home-ia'`

- [ ] **Step 3: 验证 baseline 编译通过**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 4: 验证 94 tokens 仍可用**

Run: `node scripts/verify-tokens.mjs`
Expected: `PASS: 94 tokens verified`

无 commit。

---

## Task 2: 用 PageHeader 替换 Provision Hero 区

**Files:**
- Modify: `src/views/home/home.vue`

删除原 40px 大图标 + "Provision" 标题 + 两个超高 Create/Import 大按钮，改为 PageHeader（crumb + title + subtitle + actions）。Create / Import 按钮挪到 PageHeader 的 actions slot 内，按 token 化按钮尺寸。

- [ ] **Step 1: 改 template `<section class="home">` 内顶部 hero 区**

打开 `src/views/home/home.vue`，把第 2-24 行的 `<section class="flex flex-wrap"> ... </section>` 整块（含 Provision title、两个 el-button）替换为：

```html
<PageHeader
  :crumb="[$t('layout.ClickHouse Management Console'), $t('home.All ClickHouse Clusters')]"
  :title="$t('home.All ClickHouse Clusters')"
>
  <template #actions>
    <el-button @click="importCk">
      <i class="el-icon-upload2"></i>
      {{ $t('home.Import a ClickHouse Cluster') }}
    </el-button>
    <el-button type="primary" @click="createCk">
      <i class="el-icon-plus"></i>
      {{ $t('home.Create a ClickHouse Cluster') }}
    </el-button>
  </template>
</PageHeader>
```

PageHeader 已在 P2 全局注册，无需 `import`。

- [ ] **Step 2: yarn build 验证**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 3: Commit**

```
git add src/views/home/home.vue
git commit -m "feat(home): replace Provision hero with PageHeader + actions"
```

---

## Task 3: 加 4 张统计卡片（Total / Deploy / Import / Replica）

**Files:**
- Modify: `src/views/home/home.vue`

在 PageHeader 下方、表格上方插入 stat-row。卡片用 BEM scoped style；4 个统计值由 computed 派生。

- [ ] **Step 1: 在 `<script>` data 下添加 computed**

在 `home.vue` `<script>` 的 `computed` 对象内，`queryList` 同级添加：

```js
    stats() {
      const { list } = this;
      return {
        total: list.length,
        deploy: list.filter(c => c.mode === 'deploy').length,
        import: list.filter(c => c.mode === 'import').length,
        replica: list.filter(c => c.isReplica === true).length,
      };
    },
```

- [ ] **Step 2: 在 template 中 PageHeader 之后、`<div class="list ...">` 之前插入 stat-row**

```html
<div class="stat-row">
  <div class="stat-card stat-card--total">
    <div class="stat-card__icon-bar"></div>
    <div class="stat-card__label">{{ $t('home.Total') }}</div>
    <div class="stat-card__value">{{ stats.total }}</div>
  </div>
  <div class="stat-card stat-card--deploy">
    <div class="stat-card__icon-bar"></div>
    <div class="stat-card__label">{{ $t('home.Deploy') }}</div>
    <div class="stat-card__value">{{ stats.deploy }}</div>
  </div>
  <div class="stat-card stat-card--import">
    <div class="stat-card__icon-bar"></div>
    <div class="stat-card__label">{{ $t('home.Import') }}</div>
    <div class="stat-card__value">{{ stats.import }}</div>
  </div>
  <div class="stat-card stat-card--replica">
    <div class="stat-card__icon-bar"></div>
    <div class="stat-card__label">{{ $t('home.Replica') }}</div>
    <div class="stat-card__value">{{ stats.replica }}</div>
  </div>
</div>
```

- [ ] **Step 3: 加 i18n 词条**

打开 `src/services/i18n.ts`（或对应的语言包文件，通常在 `src/assets/i18n/` 或 `src/common/i18n/`）。如果不确定位置：

Run: `grep -rln "All ClickHouse Clusters" src/ 2>/dev/null | head -3`

进入文件后，在 `home` 命名空间下添加（如果不存在）：

英文：
```
Total: 'Total',
Deploy: 'Deploy',
Import: 'Import',
Replica: 'Replica',
```

中文：
```
Total: '总数',
Deploy: '自部署',
Import: '已导入',
Replica: '启用副本',
```

注意：`Replica` 与 `Import` key 可能已经存在（home 命名空间或顶层 common）。如果已有则不重复添加；优先复用现有 key。`grep -n "Replica:" <i18n-file>` 确认。

- [ ] **Step 4: 在 `<style scoped>` 中追加 stat-row + stat-card 样式**

```scss
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--s-3);
  margin: var(--s-4) 0 var(--s-5);
}

.stat-card {
  position: relative;
  background: var(--c-surface-0);
  border: 1px solid var(--c-surface-3);
  border-radius: var(--r-lg);
  padding: var(--s-3) var(--s-4) var(--s-3) var(--s-4);
  overflow: hidden;

  &__icon-bar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 3px;
    background: var(--c-text-tertiary);
  }

  &--total &__icon-bar    { background: var(--c-primary-solid); }
  &--deploy &__icon-bar   { background: var(--c-info-solid); }
  &--import &__icon-bar   { background: var(--c-text-tertiary); }
  &--replica &__icon-bar  { background: var(--c-success-solid); }

  &__label {
    font-size: var(--fs-xs);
    font-weight: var(--fw-medium);
    color: var(--c-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: var(--lh-tight);
  }

  &__value {
    font-size: var(--fs-3xl);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    line-height: var(--lh-tight);
    margin-top: var(--s-1);
    font-variant-numeric: tabular-nums;
  }
}
```

- [ ] **Step 5: yarn build 验证**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 6: Commit**

```
git add src/views/home/home.vue src/services/
git commit -m "feat(home): add 4 stat cards (Total/Deploy/Import/Replica)"
```

---

## Task 4: 工具栏（搜索 + chip 筛选）

**Files:**
- Modify: `src/views/home/home.vue`

把现状的"All ClickHouse Clusters" 标题 + 右侧搜索框分离重组：表格上方独立一行 toolbar，左侧搜索框 + chip 筛选（All / Deploy / Import / Replica only）。

- [ ] **Step 1: 在 `<script>` data 中加 filterMode + filterReplica 状态**

修改 `data()` 返回对象，加入：

```js
      filterMode: 'all',
      filterReplica: false,
```

- [ ] **Step 2: 改造 queryList computed 加入 chip 过滤**

替换原 `queryList()` 为：

```js
    queryList() {
      const { list, key, filterMode, filterReplica } = this;
      return list.filter(item => {
        const matchKey = !key
          || item.cluster.includes(key)
          || item.mode.includes(key)
          || item.logic_cluster?.includes(key)
          || item.hosts.includes(key)
          || (item.comment || '').includes(key);
        const matchMode = filterMode === 'all' || item.mode === filterMode;
        const matchReplica = !filterReplica || item.isReplica === true;
        return matchKey && matchMode && matchReplica;
      });
    },
```

- [ ] **Step 3: 删除原 "All ClickHouse Clusters" 行并替换为 toolbar**

把 template 中 `<div class="list mt-50">` 内的 `<div class="font-bold mb-10 fs-18 overflow-hidden">...</div>`（含原标题 + el-input）整块替换为：

```html
<div class="toolbar">
  <el-input
    v-model="key"
    :placeholder="$t('common.keyword search')"
    autocomplete="false"
    clearable
    size="medium"
    class="toolbar__search"
    suffix-icon="el-icon-search"
  ></el-input>
  <div class="toolbar__chips">
    <button
      class="chip"
      :class="{ 'chip--active': filterMode === 'all' && !filterReplica }"
      @click="filterMode = 'all'; filterReplica = false"
    >{{ $t('home.All') }}</button>
    <button
      class="chip"
      :class="{ 'chip--active': filterMode === 'deploy' }"
      @click="filterMode = 'deploy'"
    >{{ $t('home.Deploy') }}</button>
    <button
      class="chip"
      :class="{ 'chip--active': filterMode === 'import' }"
      @click="filterMode = 'import'"
    >{{ $t('home.Import') }}</button>
    <button
      class="chip"
      :class="{ 'chip--active': filterReplica }"
      @click="filterReplica = !filterReplica"
    >{{ $t('home.Replica only') }}</button>
  </div>
</div>
```

- [ ] **Step 4: 加 i18n 词条 'All' / 'Replica only'**

英文：
```
All: 'All',
'Replica only': 'Replica only',
```

中文：
```
All: '全部',
'Replica only': '仅副本',
```

放在同 i18n 文件 home 命名空间下。

- [ ] **Step 5: 在 `<style scoped>` 追加 toolbar + chip 样式**

```scss
.toolbar {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  margin-bottom: var(--s-3);

  &__search {
    flex: 0 0 280px;
  }

  &__chips {
    display: flex;
    gap: var(--s-1);
    flex-wrap: wrap;
  }
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: var(--s-1) var(--s-3);
  border: 1px solid var(--c-surface-3);
  background: var(--c-surface-0);
  color: var(--c-text-secondary);
  border-radius: var(--r-pill);
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: background var(--du-fast) var(--ease-out),
              border-color var(--du-fast) var(--ease-out),
              color var(--du-fast) var(--ease-out);

  &:hover {
    background: var(--c-surface-1);
    color: var(--c-text-primary);
  }

  &--active {
    background: var(--c-primary-bg);
    border-color: var(--c-primary-border);
    color: var(--c-primary-fg);
    font-weight: var(--fw-medium);

    &:hover {
      background: var(--c-primary-bg);
      color: var(--c-primary-fg);
    }
  }
}
```

- [ ] **Step 6: yarn build 验证**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 7: Commit**

```
git add src/views/home/home.vue src/services/
git commit -m "feat(home): toolbar with search + mode/replica chip filters"
```

---

## Task 5: 表格列合并 — Cluster 列首列改成"name + meta 副信息行"

**Files:**
- Modify: `src/views/home/home.vue`

把原 Cluster Name / Belongs to Logic / ClickHouse Node IP / ClickHouse Node Count / Comment 5 列合并：首列变成 `<状态点> <name> <meta 副信息>`，hosts 折叠为 "N nodes · ip1, ip2 +M"，logic 在副信息行显示。

- [ ] **Step 1: 替换原 5 列为 1 列 Cluster cell**

在 template 的 `<el-table>` 内，删除原前 5 列（`prop="cluster"` / `prop="logic_cluster"` / `prop="hosts"` / `prop="count"` / `prop="comment"`），仅保留 `prop="mode"` / `prop="isReplica"` / Actions 三列暂时。

然后在 mode 列之前插入新 Cluster 合并列：

```html
<el-table-column
  prop="cluster"
  sortable
  min-width="280"
  :label="$t('home.Cluster')"
>
  <template #default="{ row }">
    <div class="cluster-cell">
      <span
        class="cluster-cell__dot"
        :class="row.mode === 'deploy' ? 'cluster-cell__dot--deploy' : 'cluster-cell__dot--import'"
      ></span>
      <div class="cluster-cell__main">
        <div class="cluster-cell__name">{{ row.cluster }}</div>
        <div class="cluster-cell__meta">
          <span v-if="row.logic_cluster">{{ row.logic_cluster }} ·</span>
          <span>{{ row.count }} {{ $t('home.nodes') }}</span>
          <span class="cluster-cell__hosts" v-if="row.hosts">· {{ truncateHosts(row.hosts) }}</span>
        </div>
      </div>
    </div>
  </template>
</el-table-column>
```

- [ ] **Step 2: 在 `<script>` methods 加 truncateHosts**

在 methods 对象内（与 `filterHandler` 同级）添加：

```js
    truncateHosts(hosts) {
      if (!hosts) return '';
      const arr = typeof hosts === 'string' ? hosts.split(',') : hosts;
      if (arr.length <= 2) return arr.join(', ');
      return `${arr[0]}, ${arr[1]} +${arr.length - 2}`;
    },
```

- [ ] **Step 3: 加 i18n 词条 'Cluster' / 'nodes'**

英文：
```
Cluster: 'Cluster',
nodes: 'nodes',
```

中文：
```
Cluster: '集群',
nodes: '节点',
```

- [ ] **Step 4: 在 `<style scoped>` 追加 cluster-cell 样式**

```scss
.cluster-cell {
  display: flex;
  align-items: center;
  gap: var(--s-3);

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &--deploy { background: var(--c-info-solid); }
    &--import { background: var(--c-text-tertiary); }
  }

  &__main {
    min-width: 0;
    flex: 1;
  }

  &__name {
    font-size: var(--fs-base);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    line-height: var(--lh-tight);
  }

  &__meta {
    font-size: var(--fs-xs);
    color: var(--c-text-tertiary);
    margin-top: 2px;
    line-height: var(--lh-tight);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__hosts {
    margin-left: var(--s-1);
  }
}
```

- [ ] **Step 5: yarn build 验证**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 6: Commit**

```
git add src/views/home/home.vue src/services/
git commit -m "feat(home): merge cluster/logic/hosts/count/comment columns into single cell"
```

---

## Task 6: Mode badge + Replica ✓/— + Comment 进 tooltip

**Files:**
- Modify: `src/views/home/home.vue`

Mode 列改 badge 样式（deploy 蓝、import 灰），Replica 改 ✓/— 文本，Comment 列删除（搬到 Cluster cell tooltip）。

- [ ] **Step 1: 改 mode 列**

把现有 mode 列 template：

```html
<el-table-column prop="mode"
                 show-overflow-tooltip
                 :filters="[{ text: 'deploy', value: 'deploy' }, { text: 'import', value: 'import' }]"
                 :filter-method="filterHandler"
                 :label="$t('home.Mode')" />
```

替换为：

```html
<el-table-column
  prop="mode"
  width="100"
  :label="$t('home.Mode')"
>
  <template #default="{ row }">
    <span class="mode-badge" :class="`mode-badge--${row.mode}`">{{ row.mode }}</span>
  </template>
</el-table-column>
```

去掉 filter（chip 已替代），width 收紧。

- [ ] **Step 2: 改 isReplica 列**

把现有 isReplica 列：

```html
<el-table-column prop="isReplica"
                 show-overflow-tooltip
                 :filters="[{ text: 'true', value: true }, { text: 'false', value: false }]"
                 :filter-method="filterHandler"
                 :label="$t('home.Replica')" />
```

替换为：

```html
<el-table-column
  prop="isReplica"
  width="100"
  :label="$t('home.Replica')"
>
  <template #default="{ row }">
    <span v-if="row.isReplica" class="replica-yes">✓</span>
    <span v-else class="replica-no">—</span>
  </template>
</el-table-column>
```

- [ ] **Step 3: Cluster cell 上加 comment tooltip**

修改 cluster-cell template，在外层 `<div class="cluster-cell">` 上套 `<el-tooltip>`（仅当 comment 存在）：

```html
<el-tooltip :content="row.comment" placement="top" :disabled="!row.comment">
  <div class="cluster-cell">
    <!-- ...原内容不变... -->
  </div>
</el-tooltip>
```

- [ ] **Step 4: 在 `<style scoped>` 追加 mode-badge / replica 样式**

```scss
.mode-badge {
  display: inline-block;
  padding: 2px var(--s-2);
  border-radius: var(--r-sm);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  text-transform: capitalize;
  line-height: var(--lh-tight);

  &--deploy {
    background: var(--c-info-bg);
    color: var(--c-info-fg);
  }

  &--import {
    background: var(--c-surface-2);
    color: var(--c-text-secondary);
  }
}

.replica-yes {
  color: var(--c-success-fg);
  font-weight: var(--fw-semibold);
}

.replica-no {
  color: var(--c-text-tertiary);
}
```

- [ ] **Step 5: yarn build 验证**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 6: Commit**

```
git add src/views/home/home.vue
git commit -m "feat(home): mode as badge, replica as check, comment moves to tooltip"
```

---

## Task 7: 操作列 hover 显示 Open + 删除按钮

**Files:**
- Modify: `src/views/home/home.vue`

操作列默认隐藏，鼠标 hover 行时才显示。包含 "Open ›" 链接 + ⋮ 菜单（菜单内含 Delete）。**保留 toCluster 与 remove 方法不动**。

- [ ] **Step 1: 改操作列 template**

替换现有 Actions 列：

```html
<el-table-column :label="$t('home.Actions')"
                 #default="{ row }">
  <el-link type="primary"
           underline
           @click.prevent="toCluster(row)"
           :to="'/clusters/' + row.cluster">{{$t('home.Go to cluster')}}</el-link>
  <i class="fa fa-trash pointer fs-18 ml-35"
     v-tooltip="$t('common.Delete')"
     @click="remove(row)" />
</el-table-column>
```

为：

```html
<el-table-column :label="$t('home.Actions')" width="140" align="right">
  <template #default="{ row }">
    <div class="row-actions">
      <router-link
        :to="'/clusters/' + row.cluster"
        @click.native="toCluster(row)"
        class="row-actions__open"
      >
        {{ $t('home.Open') }} ›
      </router-link>
      <el-dropdown trigger="click" @command="onRowCommand($event, row)">
        <i class="fa fa-ellipsis-v row-actions__more"></i>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="delete" class="row-actions__delete-item">
            <i class="el-icon-delete"></i>
            {{ $t('common.Delete') }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </template>
</el-table-column>
```

- [ ] **Step 2: 在 methods 加 onRowCommand 派发**

在 methods 对象内添加（与 `remove` 同级）：

```js
    onRowCommand(command, row) {
      if (command === 'delete') {
        this.remove(row);
      }
    },
```

不修改原 `remove` 方法。

- [ ] **Step 3: 加 i18n 词条 'Open'**

英文：
```
Open: 'Open',
```

中文：
```
Open: '打开',
```

- [ ] **Step 4: 在 `<style scoped>` 追加 row-actions 样式**

```scss
.row-actions {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  opacity: 0;
  transition: opacity var(--du-fast) var(--ease-out);

  &__open {
    color: var(--c-primary-fg);
    text-decoration: none;
    font-size: var(--fs-sm);
    font-weight: var(--fw-medium);

    &:hover {
      color: var(--c-primary-solid);
    }
  }

  &__more {
    color: var(--c-text-tertiary);
    cursor: pointer;
    font-size: var(--fs-md);
    padding: var(--s-1);

    &:hover {
      color: var(--c-text-primary);
    }
  }

  &__delete-item {
    color: var(--c-danger-fg) !important;

    i {
      margin-right: var(--s-1);
    }
  }
}

// hover 行时显示 actions
::v-deep .el-table__row:hover .row-actions {
  opacity: 1;
}

// 避免 hover-only 在键盘焦点时不可达：focus-within 也显示
::v-deep .el-table__row:focus-within .row-actions {
  opacity: 1;
}
```

- [ ] **Step 5: yarn build 验证**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 6: Commit**

```
git add src/views/home/home.vue src/services/
git commit -m "feat(home): hover-only row actions (Open link + more menu)"
```

---

## Task 8: 整体容器卡片化 + 收尾样式

**Files:**
- Modify: `src/views/home/home.vue`

把列表表格包裹进白底圆角卡片，删除原 `border` 属性的硬边线（改靠卡片边）；表格行高、表头风格统一到 token。

- [ ] **Step 1: 修改 list 容器与表格**

把 template 中 `<div class="list mt-50">` 改为 `<div class="list-card">`。同时去掉 el-table 的 `border` 属性、`header-cell-class-name` 类名：

```html
<div class="list-card">
  <div class="toolbar">
    <!-- ...P3 Task 4 的 toolbar... -->
  </div>
  <el-table
    :data="queryList"
    :empty-text="$t('home.No clusters')"
  >
    <!-- ...P3 Task 5/6/7 的列... -->
  </el-table>
</div>
```

注意：删除 `border` 和 `header-cell-class-name` 属性。

- [ ] **Step 2: 加 i18n 词条 'No clusters'**

英文：
```
'No clusters': 'No clusters yet. Click "Create" or "Import" to add one.',
```

中文：
```
'No clusters': '暂无集群。点击右上角"创建"或"导入"添加一个。',
```

- [ ] **Step 3: 在 `<style scoped>` 顶部追加 list-card 样式 + 清理旧样式**

替换 `<style scoped>` 全部内容为：

```scss
.home {
  padding-bottom: var(--s-8);
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--s-3);
  margin: var(--s-4) 0 var(--s-5);
}

.stat-card {
  position: relative;
  background: var(--c-surface-0);
  border: 1px solid var(--c-surface-3);
  border-radius: var(--r-lg);
  padding: var(--s-3) var(--s-4) var(--s-3) var(--s-4);
  overflow: hidden;

  &__icon-bar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 3px;
    background: var(--c-text-tertiary);
  }

  &--total &__icon-bar    { background: var(--c-primary-solid); }
  &--deploy &__icon-bar   { background: var(--c-info-solid); }
  &--import &__icon-bar   { background: var(--c-text-tertiary); }
  &--replica &__icon-bar  { background: var(--c-success-solid); }

  &__label {
    font-size: var(--fs-xs);
    font-weight: var(--fw-medium);
    color: var(--c-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: var(--lh-tight);
  }

  &__value {
    font-size: var(--fs-3xl);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    line-height: var(--lh-tight);
    margin-top: var(--s-1);
    font-variant-numeric: tabular-nums;
  }
}

.list-card {
  background: var(--c-surface-0);
  border: 1px solid var(--c-surface-3);
  border-radius: var(--r-lg);
  padding: var(--s-4);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  margin-bottom: var(--s-3);

  &__search {
    flex: 0 0 280px;
  }

  &__chips {
    display: flex;
    gap: var(--s-1);
    flex-wrap: wrap;
  }
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: var(--s-1) var(--s-3);
  border: 1px solid var(--c-surface-3);
  background: var(--c-surface-0);
  color: var(--c-text-secondary);
  border-radius: var(--r-pill);
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: background var(--du-fast) var(--ease-out),
              border-color var(--du-fast) var(--ease-out),
              color var(--du-fast) var(--ease-out);

  &:hover {
    background: var(--c-surface-1);
    color: var(--c-text-primary);
  }

  &--active {
    background: var(--c-primary-bg);
    border-color: var(--c-primary-border);
    color: var(--c-primary-fg);
    font-weight: var(--fw-medium);

    &:hover {
      background: var(--c-primary-bg);
      color: var(--c-primary-fg);
    }
  }
}

.cluster-cell {
  display: flex;
  align-items: center;
  gap: var(--s-3);

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &--deploy { background: var(--c-info-solid); }
    &--import { background: var(--c-text-tertiary); }
  }

  &__main {
    min-width: 0;
    flex: 1;
  }

  &__name {
    font-size: var(--fs-base);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    line-height: var(--lh-tight);
  }

  &__meta {
    font-size: var(--fs-xs);
    color: var(--c-text-tertiary);
    margin-top: 2px;
    line-height: var(--lh-tight);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__hosts {
    margin-left: var(--s-1);
  }
}

.mode-badge {
  display: inline-block;
  padding: 2px var(--s-2);
  border-radius: var(--r-sm);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  text-transform: capitalize;
  line-height: var(--lh-tight);

  &--deploy {
    background: var(--c-info-bg);
    color: var(--c-info-fg);
  }

  &--import {
    background: var(--c-surface-2);
    color: var(--c-text-secondary);
  }
}

.replica-yes {
  color: var(--c-success-fg);
  font-weight: var(--fw-semibold);
}

.replica-no {
  color: var(--c-text-tertiary);
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  opacity: 0;
  transition: opacity var(--du-fast) var(--ease-out);

  &__open {
    color: var(--c-primary-fg);
    text-decoration: none;
    font-size: var(--fs-sm);
    font-weight: var(--fw-medium);

    &:hover {
      color: var(--c-primary-solid);
    }
  }

  &__more {
    color: var(--c-text-tertiary);
    cursor: pointer;
    font-size: var(--fs-md);
    padding: var(--s-1);

    &:hover {
      color: var(--c-text-primary);
    }
  }

  &__delete-item {
    color: var(--c-danger-fg) !important;

    i {
      margin-right: var(--s-1);
    }
  }
}

::v-deep .el-table__row:hover .row-actions {
  opacity: 1;
}

::v-deep .el-table__row:focus-within .row-actions {
  opacity: 1;
}

::v-deep .el-table {
  font-size: var(--fs-sm);

  th {
    background: var(--c-surface-1);
    color: var(--c-text-secondary);
    font-weight: var(--fw-medium);
    font-size: var(--fs-xs);
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  td {
    color: var(--c-text-primary);
  }
}
```

注：原 scoped style 中的 `.title` / `.btns` / 注释掉的 `.list` 完全替换。

- [ ] **Step 4: yarn build 验证**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 5: Commit**

```
git add src/views/home/home.vue src/services/
git commit -m "feat(home): card-wrapped list with refined table style"
```

---

## Task 9: 全局验证 + 后端契约 0 变更

**Files:**
- 无文件改动

- [ ] **Step 1: 跑 yarn build**

Run: `yarn build 2>&1 | tail -3`
Expected: `Build complete.`

- [ ] **Step 2: 跑 stylelint**

Run: `yarn lint:style 2>&1 | grep -c " error " || echo 0`
Expected: `0`（warnings 允许）

- [ ] **Step 3: 跑 verify-tokens**

Run: `node scripts/verify-tokens.mjs`
Expected: `PASS: 94 tokens verified`

- [ ] **Step 4: 后端契约 0 变更**

Run: `git diff feat/p2-layout-shared-components..HEAD --stat -- src/apis/`
Expected: 输出为空。

- [ ] **Step 5: 路由 0 变更**

Run: `git diff feat/p2-layout-shared-components..HEAD --stat -- src/services/router.ts`
Expected: 输出为空。

- [ ] **Step 6: 仅 home 与 i18n 改动**

Run: `git diff feat/p2-layout-shared-components..HEAD --stat -- src/views/ src/services/`
Expected: 只有 `src/views/home/home.vue` 与（可选）i18n 文件。

无 commit。

---

## Task 10: walkthrough 记录 + 准备 PR

**Files:**
- Create: `docs/superpowers/plans/p3-home-screenshots/walkthrough.md`

- [ ] **Step 1: 创建 walkthrough.md**

Create `docs/superpowers/plans/p3-home-screenshots/walkthrough.md`：

```markdown
# P3-home 走查记录

## 自动化验证

| 项 | 结果 |
|---|---|
| yarn build | PASS |
| verify-tokens (94 tokens) | PASS |
| yarn lint:style | <填实际：warnings 数 / 0 errors> |
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
```

填入实际值（lint warnings 数量等）。

- [ ] **Step 2: Commit**

```
git add docs/superpowers/plans/p3-home-screenshots/
git commit -m "docs(p3-home): walkthrough automation results"
```

无 PR 推送（用户偏好本地保留，由人工 push 时再开 PR）。

---

## P3-home 验收清单（整体）

- [ ] `yarn build` 通过
- [ ] `verify-tokens` 94 tokens PASS
- [ ] `lint:style` 0 errors
- [ ] `src/apis/` 与 `src/services/router.ts` 0 改动
- [ ] 仅 `src/views/home/home.vue` 与（可能）i18n 文件改动
- [ ] PageHeader 在 home 页正确显示
- [ ] 4 张统计卡数字与实际数据一致
- [ ] chip 筛选与搜索联合工作
- [ ] hover 行操作列正确显示/隐藏
- [ ] Open / Delete 行为与改造前完全一致（后端调用一致）

---

## 不在 P3-home 范围

- ❌ 其他 5 个 IA 重排页面（overview / manage / tables / data-manage / query-execution）— 独立 PR
- ❌ Healthy / Degraded / Offline 卡片（需后端补字段，留待将来）
- ❌ DForm 重做（P2 已回滚，留待后续专题）
- ❌ create-cluster.vue 流程改造（独立专题）
- ❌ Element UI 主题深度改造（P2 已做轻量微调）
- ❌ 集群切换器加入顶栏（spec §4.2 提到，作为 P3 后续或 P4）

---

## 风险与提醒

| 风险 | 提醒 |
|---|---|
| `el-table-column` 取消 filter 后用户失去原生筛选 | chip 已替代，但若用户依赖原 filter UI，需在 walkthrough 时确认 |
| hover-only actions 在触摸屏不可达 | 已加 `focus-within` 兜底；触摸屏场景视为已知限制 |
| `truncateHosts` 在 hosts 是字符串还是数组的差异 | fetchData 中已 `hosts.join(',')` 转字符串；truncateHosts 兼容两种 |
| comment tooltip 在长 comment 上溢出 | el-tooltip 默认 max-width 不够，必要时在 `_element-ui-override.scss` 加 .el-tooltip__popper max-width |
| i18n 词条文件位置 | grep 已有 'All ClickHouse Clusters' 关键字确认；如新加 key 在错误的 namespace 会出现裸 key |
| router-link 内 click.native 在 SPA 中可能触发两次导航 | 现状 home.vue 已是 `<el-link @click.prevent="toCluster" :to="...">` 混用，本计划改成 `<router-link @click.native="toCluster" :to="...">`；toCluster 不 push 路由 |
