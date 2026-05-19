<template>
  <el-dialog
    :title="`${$t('manage.Node Override')} · ${ip}`"
    :visible.sync="dialogVisible"
    width="780px"
    :close-on-click-modal="false"
    @close="onCancel"
  >
    <div class="override-tip">
      <i class="el-icon-info"></i> {{ $t('manage.Node Override Tip') }}
    </div>
    <el-tabs v-model="activeTab" type="card" class="override-tabs">
      <el-tab-pane :label="$t('manage.Node Override Table Mode')" name="table">
        <div class="override-table">
          <el-button size="mini" type="primary" icon="el-icon-plus" @click="addRow">
            {{ $t('common.Add') }}
          </el-button>
          <el-table :data="rows" border style="margin-top: 8px;" size="mini">
            <el-table-column prop="path" :label="$t('common.Key')">
              <template slot-scope="{ row }">
                <el-input v-if="row.editable" v-model="row.path" placeholder="a/b/c 或 disk[@name='x']/type" size="mini" />
                <el-tooltip v-else :content="$t('manage.Override Readonly Row Tip')" placement="top">
                  <span class="override-readonly">{{ row.raw || row.path }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="value" :label="$t('common.Value')" width="220">
              <template slot-scope="{ row }">
                <el-input v-if="row.editable" v-model="row.value" size="mini" />
                <span v-else>—</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('home.Actions')" width="60">
              <template slot-scope="{ $index }">
                <el-button size="mini" type="text" icon="el-icon-delete" @click="rows.splice($index, 1)" />
              </template>
            </el-table-column>
          </el-table>
          <p v-if="rows.length === 0" class="override-empty">{{ $t('manage.Node Override Empty') }}</p>
        </div>
      </el-tab-pane>
      <el-tab-pane :label="$t('manage.Node Override XML Mode')" name="xml">
        <div ref="editorMount" class="override-editor"></div>
        <p v-if="xmlError" class="override-error">{{ xmlError }}</p>
      </el-tab-pane>
    </el-tabs>

    <span slot="footer">
      <el-button type="danger" plain :disabled="!hasOverride" @click="onClear">{{ $t('common.Clear') }}</el-button>
      <el-button @click="onCancel">{{ $t('common.Cancel') }}</el-button>
      <el-button type="primary" :loading="saving" :disabled="!!xmlError" @click="onSave">
        {{ $t('common.Save') }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { ClusterApi } from '@/apis';
import { parseXmlToRows, rowsToXml, detectRootTag, prettyXml } from './nodeOverride.utils';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { xml } from '@codemirror/lang-xml';
import { bracketMatching } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';

export default {
  name: 'NodeOverrideDialog',
  props: {
    visible: { type: Boolean, default: false },
    clusterName: { type: String, required: true },
    ip: { type: String, required: true },
  },
  data() {
    return {
      dialogVisible: this.visible,
      activeTab: 'table',
      currentXml: '',
      rows: [],
      xmlError: '',
      saving: false,
      hasOverride: false,
      editor: null,
      rootTag: 'clickhouse',
    };
  },
  watch: {
    visible(v) {
      this.dialogVisible = v;
      if (v) this.fetch();
    },
    activeTab(v) {
      if (v === 'xml') {
        this.currentXml = prettyXml(rowsToXml(this.rows, this.rootTag));
        this.$nextTick(() => this.mountEditor());
      } else {
        this.disposeEditor();
        try {
          this.rows = parseXmlToRows(this.currentXml);
          this.xmlError = '';
        } catch (e) {
          this.xmlError = this.$t('manage.Override Invalid Xml');
        }
      }
    },
  },
  methods: {
    async fetch() {
      const { data: { entity } } = await ClusterApi.getNodeOverride(this.clusterName, this.ip);
      this.currentXml = entity.xml || '';
      this.hasOverride = !!this.currentXml;
      this.rootTag = detectRootTag(this.currentXml);
      try {
        this.rows = parseXmlToRows(this.currentXml);
      } catch (e) {
        this.rows = [];
        this.activeTab = 'xml';
      }
    },
    addRow() {
      this.rows.push({ path: '', value: '', editable: true });
    },
    mountEditor() {
      if (this.editor) return;
      this.editor = new EditorView({
        state: EditorState.create({
          doc: prettyXml(this.currentXml) || this.currentXml,
          extensions: [
            lineNumbers(),
            xml(),
            oneDark,
            bracketMatching(),
            EditorView.lineWrapping,
            EditorView.updateListener.of(u => {
              if (u.docChanged) {
                this.currentXml = u.state.doc.toString();
                this.validateXml();
              }
            }),
          ],
        }),
        parent: this.$refs.editorMount,
      });
    },
    disposeEditor() {
      if (this.editor) {
        this.editor.destroy();
        this.editor = null;
      }
    },
    validateXml() {
      if (!this.currentXml.trim()) {
        this.xmlError = '';
        return;
      }
      const doc = new DOMParser().parseFromString(this.currentXml, 'application/xml');
      this.xmlError = doc.getElementsByTagName('parsererror').length
        ? this.$t('manage.Override Invalid Xml')
        : '';
    },
    async onSave() {
      let payload = this.currentXml;
      if (this.activeTab === 'table') {
        payload = rowsToXml(this.rows, this.rootTag);
      }
      this.saving = true;
      try {
        const { data: { entity } } = await ClusterApi.saveNodeOverride(this.clusterName, this.ip, payload);
        if (entity && entity.warning) {
          this.$message.warning(this.$t('manage.Save Override Warning Reload Failed'));
        } else {
          this.$message.success(this.$t('manage.Save Override Success'));
        }
        this.$emit('close');
      } finally {
        this.saving = false;
      }
    },
    async onClear() {
      const ok = await this.$confirm(
        this.$t('manage.Override Clear Confirm'),
        this.$t('common.Warning'),
        { type: 'warning' }
      ).catch(() => false);
      if (!ok) return;
      this.saving = true;
      try {
        await ClusterApi.deleteNodeOverride(this.clusterName, this.ip);
        this.$message.success(this.$t('common.Success'));
        this.$emit('close');
      } finally {
        this.saving = false;
      }
    },
    onCancel() {
      this.disposeEditor();
      this.$emit('close');
    },
  },
  beforeDestroy() {
    this.disposeEditor();
  },
};
</script>

<style scoped>
.override-tip { color: var(--c-text-tertiary); font-size: var(--fs-sm); margin-bottom: 8px; }
.override-editor { height: 320px; border: 1px solid var(--c-surface-3); border-radius: 4px; overflow: hidden; }
.override-error { color: var(--c-danger-solid); font-size: var(--fs-sm); margin-top: 6px; }
.override-readonly { color: var(--c-text-tertiary); font-family: monospace; font-size: 12px; }
.override-empty { text-align: center; color: var(--c-text-tertiary); margin-top: 16px; }
</style>
