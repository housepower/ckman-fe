<template>
  <div class="db-tree">
    <el-input
      v-model="filterText"
      size="small"
      :placeholder="$t('common.keyword search')"
      clearable
      @input="onSearchDebounced"
      @clear="onSearchDebounced"
      class="db-tree__search"
    />
    <div ref="tree" id="ztree" class="db-tree__ztree ztree"></div>
  </div>
</template>

<script>
import { SqlQueryApi } from '@/apis';

export default {
  data() {
    return {
      filterText: '',
      data: null,
      loading: false,
      setting: {
        view: {
          txtSelectedEnable: true,
          nameIsHTML: true,
        },
      },
    };
  },
  beforeDestroy() {
    if (this._searchTimer) clearTimeout(this._searchTimer);
  },
  async mounted() {
    await this.getTableList();
    $.fn.zTree.init($('#ztree'), this.setting, this.data);
  },
  methods: {
    onSearchDebounced() {
      if (this._searchTimer) clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => this.onSearch(), 400);
    },
    onSearch() {
      const zTree = $.fn.zTree.getZTreeObj('ztree');
      if (!zTree) return;

      const prev = this._lastHighlighted || [];
      prev.forEach((n) => {
        if (n && n._origName != null) {
          n.name = n._origName;
          n._origName = null;
          zTree.updateNode(n);
        }
      });
      this._lastHighlighted = [];

      const keyword = (this.filterText || '').trim();
      if (keyword.length < 2) return;

      const MAX_MATCHES = 100;
      const MAX_AUTO_EXPAND_CHILDREN = 100;
      const MAX_EXPANSIONS = 50;

      const matches = [];
      const visit = (nodes) => {
        if (!nodes || matches.length >= MAX_MATCHES) return;
        for (const n of nodes) {
          if (matches.length >= MAX_MATCHES) return;
          const raw = n._origName != null ? n._origName : n.name;
          if (raw && raw.indexOf(keyword) !== -1) matches.push(n);
          if (n.children) visit(n.children);
        }
      };
      visit(zTree.getNodes());

      const escapeHtml = (s) =>
        String(s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escapeReg(keyword), 'g');

      const ancestors = new Set();
      matches.forEach((n) => {
        const raw = n._origName != null ? n._origName : n.name;
        n._origName = raw;
        n.name = escapeHtml(raw).replace(re, (m) => `<mark class="ztree-mark">${escapeHtml(m)}</mark>`);
        zTree.updateNode(n);
        let p = n.getParentNode && n.getParentNode();
        while (p) {
          if (ancestors.has(p)) break;
          ancestors.add(p);
          p = p.getParentNode && p.getParentNode();
        }
      });

      let expanded = 0;
      for (const p of ancestors) {
        if (expanded >= MAX_EXPANSIONS) break;
        const childCount = (p.children && p.children.length) || 0;
        if (childCount > MAX_AUTO_EXPAND_CHILDREN) continue;
        zTree.expandNode(p, true, false, false);
        expanded++;
      }
      this._lastHighlighted = matches;

      this.scrollToFirstMatch(matches[0]);
    },
    scrollToFirstMatch(node) {
      if (!node) return;
      let target = node;
      while (target) {
        const el = document.getElementById(target.tId + '_a');
        if (el) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          return;
        }
        target = target.getParentNode && target.getParentNode();
      }
    },
    async getTableList() {
      const { id: clusterName } = this.$route.params;
      this.loading = true;
      const { data: { entity } } = await SqlQueryApi.getTableLists(clusterName)
        .finally(() => (this.loading = false));
      this.data = (Object.keys(entity) || []).map((dbName) => ({
        id: dbName,
        name: dbName,
        icon: '/images/database.png',
        leaf: false,
        expand: false,
        children: (Object.keys(entity[dbName]) || []).map((tableName) => ({
          id: dbName + '-' + tableName,
          name: tableName,
          icon: '/images/table.png',
          leaf: false,
          expand: false,
          children: (entity[dbName][tableName] || []).map((columnName) => ({
            id: columnName,
            name: columnName,
            icon: '/images/columns.png',
            leaf: true,
          })),
        })),
      }));
    },
  },
};
</script>

<style lang="scss" scoped>
.db-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--s-2) var(--s-3);
  gap: var(--s-2);

  &__ztree {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
}
</style>

<style>
.ztree * {
  font-size: var(--fs-sm);
  color: var(--c-text-primary);
  font-family: inherit;
}
.ztree span[treenode_ico] {
  background-size: 12px 12px !important;
  background-position: center center !important;
}
.ztree li a:hover {
  background-color: var(--c-surface-1);
  color: var(--c-text-primary);
}
.ztree li a.curSelectedNode {
  background-color: var(--c-surface-2);
  border: 1px solid var(--c-surface-3);
  color: var(--c-text-primary);
}
.ztree-mark {
  background-color: #FFE066;
  color: #1A1D23;
  font-weight: bold;
  border-radius: 2px;
  padding: 0 2px;
}
</style>
