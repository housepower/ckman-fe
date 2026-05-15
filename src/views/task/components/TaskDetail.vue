<template>
  <div class="task-detail">
    <div v-if="detail" class="task-detail__meta">
      <div class="task-detail__field">
        <span class="task-detail__label">{{ $t('task.Task ID') }}</span>
        <span class="task-detail__value task-detail__value--mono">{{ detail.TaskId }}</span>
      </div>
      <div class="task-detail__field">
        <span class="task-detail__label">{{ $t('task.Cluster Name') }}</span>
        <span class="task-detail__value">
          {{ detail.ClusterName }}
          <span class="task-detail__type-badge">{{ detail.Type }}</span>
        </span>
      </div>
      <div class="task-detail__field">
        <span class="task-detail__label">{{ $t('task.Duration') }}</span>
        <span class="task-detail__value task-detail__value--mono">{{ durationText }}</span>
      </div>
      <div class="task-detail__field task-detail__field--wide">
        <span class="task-detail__label">{{ $t('task.Current Action') }}</span>
        <span class="task-detail__value">{{ detail.Option[lang] }}</span>
      </div>
    </div>

    <div v-if="detail" class="task-detail__progress">
      <div class="task-detail__progress-bar">
        <div
          v-if="counts.done > 0"
          class="task-detail__progress-seg task-detail__progress-seg--done"
          :style="{ width: pct(counts.done) }"
        ></div>
        <div
          v-if="counts.failed > 0"
          class="task-detail__progress-seg task-detail__progress-seg--failed"
          :style="{ width: pct(counts.failed) }"
        ></div>
      </div>
      <div class="task-detail__progress-text">
        <span class="task-detail__progress-count">
          {{ counts.done + counts.failed }}/{{ counts.total }}
        </span>
        <span v-if="counts.done > 0" class="task-detail__progress-tag task-detail__progress-tag--done">
          {{ counts.done }} {{ $t('task.statusDone') }}
        </span>
        <span v-if="counts.failed > 0" class="task-detail__progress-tag task-detail__progress-tag--failed">
          {{ counts.failed }} {{ $t('task.statusFailed') }}
        </span>
        <span v-if="counts.running > 0" class="task-detail__progress-tag task-detail__progress-tag--running">
          {{ counts.running }} {{ $t('task.statusRunning') }}
        </span>
      </div>
    </div>

    <div
      v-if="detail && detail.Message && hasFailure"
      class="task-detail__alert task-detail__alert--failed"
    >
      <i class="el-icon-warning-outline task-detail__alert-icon" />
      <div class="task-detail__alert-body">
        <div class="task-detail__alert-title">{{ $t('task.Message') }}</div>
        <pre class="task-detail__alert-text">{{ detail.Message }}</pre>
      </div>
    </div>

    <vxe-table
      ref="xTable"
      class="task-detail__table"
      :data="currentPageData"
      :border="false"
      align="left"
      resizable
      show-header-overflow
      show-overflow
      highlight-hover-row
    >
      <vxe-column field="Host" :title="$t('task.Node')">
        <template slot-scope="{ row }">
          <span class="task-detail__host">{{ row.Host }}</span>
        </template>
      </vxe-column>
      <vxe-column field="Status" :title="$t('task.Status')" width="140">
        <template slot-scope="{ row }">
          <span class="task-detail__status" :class="statusClass(row.Status.EN)">
            <i
              v-if="!isFinal(row.Status.EN)"
              class="task-detail__status-dot task-detail__status-dot--spin"
            ></i>
            <i v-else class="task-detail__status-dot"></i>
            {{ row.Status[lang] }}
          </span>
        </template>
      </vxe-column>
      <vxe-column field="Message" :title="$t('task.Message')" min-width="240">
        <template slot-scope="{ row }">
          <span
            v-if="row.Message"
            class="task-detail__node-msg"
            :title="row.Message"
            :class="{ 'task-detail__node-msg--err': row.Status && row.Status.EN === 'Failed' }"
          >{{ row.Message }}</span>
          <span v-else class="task-detail__node-msg-empty">—</span>
        </template>
      </vxe-column>
    </vxe-table>

    <vxe-pager
      v-if="(detail && detail.NodeStatus || []).length > pagination.pageSize"
      align="right"
      :current-page="pagination.currentPage"
      :page-size.sync="pagination.pageSize"
      :page-sizes="pagination.pageSizes"
      :total="pagination.total"
      :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'Total']"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script>
import { TaskApi } from '@/apis';

export default {
  props: {
    taskId: String,
    refresh: Boolean,
  },
  data() {
    return {
      timerId: null,
      tickTimer: null,
      nowTs: Date.now(),
      detail: null,
      pagination: {
        total: 0,
        pageSize: 10,
        pageSizes: [10, 20, 50, 100],
        currentPage: 1,
      },
      status: null,
    };
  },
  computed: {
    lang() {
      return this.$i18n.locale.toUpperCase();
    },
    currentPageData() {
      const { currentPage, pageSize } = this.pagination;
      return this.detail?.NodeStatus?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];
    },
    counts() {
      const list = this.detail?.NodeStatus || [];
      const total = list.length;
      let done = 0;
      let failed = 0;
      for (const n of list) {
        if (n.Status.EN === 'Done') done++;
        else if (n.Status.EN === 'Failed') failed++;
      }
      return { total, done, failed, running: total - done - failed };
    },
    hasFailure() {
      return this.counts.failed > 0;
    },
    isLive() {
      if (!this.detail) return false;
      return this.counts.total === 0 || this.counts.running > 0;
    },
    durationText() {
      if (!this.detail) return '—';
      if (this.isLive) {
        const start = this.parseStart(this.detail.CreateTime);
        if (start) return this.formatElapsed(this.nowTs - start);
      }
      return this.detail.Duration || '—';
    },
  },
  created() {
    this.getTaskDetail();
    if (this.refresh) {
      this.timerId = setInterval(this.getTaskDetail, 3000);
      this.tickTimer = setInterval(() => { this.nowTs = Date.now(); }, 1000);
    }
  },
  beforeDestroy() {
    if (this.timerId) clearInterval(this.timerId);
    if (this.tickTimer) clearInterval(this.tickTimer);
  },
  methods: {
    pct(n) {
      const total = this.counts.total || 1;
      return `${(n / total) * 100}%`;
    },
    isFinal(statusEN) {
      return statusEN === 'Done' || statusEN === 'Failed';
    },
    statusClass(statusEN) {
      if (statusEN === 'Done') return 'task-detail__status--done';
      if (statusEN === 'Failed') return 'task-detail__status--failed';
      return 'task-detail__status--running';
    },
    async getTaskDetail() {
      const { data: { entity } } = await TaskApi.getTaskDetail(this.taskId);
      this.detail = entity;
      this.pagination.total = entity.NodeStatus.length;

      if (entity.NodeStatus.every(x => x.Status.EN === 'Done' || x.Status.EN === 'Failed')) {
        if (this.timerId) clearInterval(this.timerId);
        if (this.tickTimer) clearInterval(this.tickTimer);
        this.status = entity.NodeStatus.every(x => x.Status.EN === 'Done') ? 'Done' : 'Failed';
      }
    },
    parseStart(t) {
      if (!t) return null;
      const ms = Date.parse(t);
      return Number.isNaN(ms) ? null : ms;
    },
    formatElapsed(ms) {
      const total = Math.max(0, Math.floor(ms / 1000));
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      if (h > 0) return `${h}h ${m}m ${s}s`;
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
    },
    handlePageChange(pager) {
      this.pagination.currentPage = pager.currentPage;
    },
    onOk() {
      return this.status;
    },
  },
};
</script>

<style lang="scss" scoped>
.task-detail {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);

  &__meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--s-2) var(--s-4);
    padding: var(--s-3);
    background: var(--c-surface-1);
    border: 1px solid var(--c-surface-3);
    border-radius: var(--r-md);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    &--wide {
      grid-column: 1 / -1;
    }
  }

  &__label {
    font-size: var(--fs-xs);
    color: var(--c-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: var(--fw-medium);
  }

  &__value {
    font-size: var(--fs-md);
    color: var(--c-text-primary);
    line-height: var(--lh-tight);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);

    &--mono {
      font-family: var(--f-mono);
      font-size: var(--fs-sm);
    }
  }

  &__type-badge {
    font-size: var(--fs-xs);
    padding: 1px var(--s-2);
    border-radius: var(--r-sm);
    background: var(--c-primary-bg);
    color: var(--c-primary-fg);
    border: 1px solid var(--c-primary-border);
    font-weight: var(--fw-medium);
  }

  &__progress-bar {
    position: relative;
    height: 8px;
    background: var(--c-surface-2);
    border-radius: 4px;
    overflow: hidden;
    display: flex;
  }

  &__progress-seg {
    height: 100%;
    transition: width var(--du-normal) var(--ease-out);

    &--done {
      background: var(--c-success-solid);
    }

    &--failed {
      background: var(--c-danger-solid);
    }
  }

  &__progress-text {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    margin-top: var(--s-2);
    font-size: var(--fs-sm);
  }

  &__progress-count {
    color: var(--c-text-secondary);
    font-variant-numeric: tabular-nums;
    font-weight: var(--fw-medium);
  }

  &__progress-tag {
    display: inline-flex;
    align-items: center;
    padding: 1px var(--s-2);
    border-radius: var(--r-sm);
    font-size: var(--fs-xs);
    font-weight: var(--fw-medium);

    &--done {
      color: var(--c-success-fg);
      background: var(--c-success-bg);
    }

    &--failed {
      color: var(--c-danger-fg);
      background: var(--c-danger-bg);
    }

    &--running {
      color: var(--c-primary-fg);
      background: var(--c-primary-bg);
    }
  }

  &__host {
    font-family: var(--f-mono);
    font-size: var(--fs-sm);
    color: var(--c-text-primary);
  }

  &__status {
    display: inline-flex;
    align-items: center;
    gap: var(--s-1);
    font-size: var(--fs-sm);

    &--done {
      color: var(--c-success-fg);

      .task-detail__status-dot { background: var(--c-success-solid); }
    }

    &--failed {
      color: var(--c-danger-fg);

      .task-detail__status-dot { background: var(--c-danger-solid); }
    }

    &--running {
      color: var(--c-primary-fg);

      .task-detail__status-dot { background: var(--c-primary-solid); }
    }
  }

  &__alert {
    display: flex;
    gap: var(--s-2);
    padding: var(--s-3);
    background: var(--c-danger-bg);
    border: 1px solid var(--c-danger-border);
    border-radius: var(--r-md);
    color: var(--c-danger-fg);
  }

  &__alert-icon {
    font-size: var(--fs-xl);
    margin-top: 2px;
    flex-shrink: 0;
  }

  &__alert-body {
    flex: 1;
    min-width: 0;
  }

  &__alert-title {
    font-size: var(--fs-xs);
    font-weight: var(--fw-semibold);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--s-1);
  }

  &__alert-text {
    margin: 0;
    font-family: var(--f-mono);
    font-size: var(--fs-sm);
    color: var(--c-text-primary);
    background: var(--c-surface-0);
    border: 1px solid var(--c-danger-border);
    border-radius: var(--r-sm);
    padding: var(--s-2);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 160px;
    overflow-y: auto;
  }

  &__node-msg {
    font-size: var(--fs-sm);
    color: var(--c-text-secondary);
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--err {
      color: var(--c-danger-fg);
    }
  }

  &__node-msg-empty {
    color: var(--c-text-tertiary);
  }

  &__status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;

    &--spin {
      box-shadow: 0 0 0 0 currentColor;
      animation: task-detail-pulse 1.4s infinite ease-out;
    }
  }
}

@keyframes task-detail-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(201, 161, 0, 0.6);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(201, 161, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(201, 161, 0, 0);
  }
}
</style>
