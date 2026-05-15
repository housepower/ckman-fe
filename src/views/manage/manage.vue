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
          size="medium"
          :type="item === 'Destroy' ? 'danger' : 'default'"
          :class="{ 'cluster-op-btn--unavailable': isStatusDisable(item) }"
          :title="isStatusDisable(item) ? $t('manage.Action Unavailable In Current State') : ''"
          @click="onClusterOp(item)"
        >
          {{ $t('manage.' + item + ' Cluster') }}
        </el-button>
      </template>
    </PageHeader>
    <div class="upgrade-card" :class="{ 'upgrade-card--collapsed': !upgradeExpanded }">
      <div
        class="upgrade-card__header"
        :class="{ 'upgrade-card__header--toggle': mode === 'deploy' }"
        @click="mode === 'deploy' && (upgradeExpanded = !upgradeExpanded)"
      >
        <div class="upgrade-card__title-group">
          <h3 class="upgrade-card__title">{{ $t('manage.Upgrade Cluster') }}</h3>
          <div class="upgrade-card__current">
            <span class="upgrade-card__current-label">{{ $t('home.ClickHouse Version') }}</span>
            <span class="upgrade-card__current-pill">{{ list.version || '—' }}</span>
          </div>
        </div>
        <i
          v-if="mode === 'deploy'"
          class="upgrade-card__chevron fa"
          :class="upgradeExpanded ? 'fa-chevron-up' : 'fa-chevron-down'"
        ></i>
      </div>
      <div v-if="mode === 'deploy' && upgradeExpanded" class="upgrade-card__form">
        <div class="upgrade-card__field">
          <label class="upgrade-card__field-label">{{ $t('manage.Upgrade to') }}</label>
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
        </div>
        <div class="upgrade-card__field">
          <label class="upgrade-card__field-label">{{ $t('manage.Policy') }}</label>
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
        </div>
        <div class="upgrade-card__options">
          <el-checkbox v-model="skip">{{ $t('manage.skip same version') }}</el-checkbox>
          <el-checkbox v-model="keeper">{{ $t('manage.skip keeper') }}</el-checkbox>
        </div>
        <div class="upgrade-card__action">
          <el-button
            type="primary"
            size="medium"
            :disabled="!packageVersion"
            @click="clusterOperation('upgrade')"
          >
            <i class="el-icon-upload2"></i>
            {{ $t('common.Upgrade') }}
          </el-button>
        </div>
      </div>
    </div>
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
        :data="pagedList"
      >
        <vxe-column
          v-for="(col, index) in columns"
          :key="index"
          :field="col.prop"
          show-overflow-tooltip
          :title="col.label"
          :filters="col.filters || null"
          sortable
          align="left">
          <template slot-scope="{ row, column }">
            <div v-if="col.prop === 'status'" class="status-cell">
              <span class="status-dot" :class="`status-dot--${row.status}`"></span>
              <span class="status-cell__text">{{ statusLabel(row.status) }}</span>
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
            <div v-else-if="col.prop === 'disk'" class="disk-cell">
              <template v-if="hasDiskData(row.disk)">
                <el-progress
                  :percentage="diskPercent(row.disk)"
                  :color="diskColor"
                  :stroke-width="6"
                  :show-text="false"
                  class="disk-cell__bar"
                />
                <span class="disk-cell__text">{{ row.disk }}</span>
              </template>
              <span v-else class="disk-cell__empty">—</span>
            </div>
            <span v-else>{{ row[column.property] }}</span>
          </template>
        </vxe-column>
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
      </vxe-table>
      <el-pagination
        v-if="queryList.length > pageSize"
        class="node-card__pagination"
        :current-page.sync="currentPage"
        :page-size.sync="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="queryList.length"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>
    <DeleteNodeComponent :visible.sync="deleteNodeDialogVisible" :password="password" :ip="deleteIp" @onOk="onAddNodeSuccess" @close="deleteNodeDialogVisible = false" />
  </main>
</template>
<script>
import { upperFirst, lowerFirst, cloneDeep, head, last } from "lodash-es";
import AddNodeDialog from "./modal/addNode";
import InputPassword from "./modal/inputPassword";
import { $modal, $loading } from "@/services";
import { ClusterStatus, ClusterTypeStatus } from "@/constants";
import { ClusterApi, PackageApi } from "@/apis";
import TaskDetail from '@/views/task/components/TaskDetail.vue';
import ViewLogComponent from './modal/viewLog.vue';
import DeleteNodeComponent from './modal/deleteNode.vue';
export default {
  components: {
    AddNodeDialog,
    DeleteNodeComponent,
  },
  data() {
    return {
      upgradeExpanded: false,
      currentPage: 1,
      pageSize: 10,
      addNodeDialogVisible: false,
      reBalanceDialogVisible: false,
      deleteNodeDialogVisible: false,
      mode: "",
      httpPort: 8123,
      versionOptions: [
        {
          value: "",
          label: "",
        },
      ],
      input: "",
      list: {
        status: "green",
        version: "",
        pkgType:'',
        nodes: [],
      },
      clusterStatus: [],
      packageVersion: "",
      skip: true,
      keeper: false,
      policy: 'Full',
      needPassword: false,
      password: '',
      packageType: '',
      gridOptions: {
        border: false,
        resizable: true,
        showHeaderOverflow: true,
        showOverflow: true,
        highlightHoverRow: true,
        rowId: 'tableName',
        toolbarConfig: {
          zoom: true,
          custom: true
        },
        sortConfig: {
          trigger: 'cell',
        },
        filterConfig: {
        },
      },
      numberRange: [],
      deleteIp: '',
    };
  },
  computed: {
    queryList() {
      const { list, input } = this;
      return list.nodes.filter(node => {
        return node.hostname.includes(input) || node.ip.includes(input) || node.status.includes(input);
      });
    },
    pagedList() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.queryList.slice(start, start + this.pageSize);
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.queryList.length / this.pageSize));
    },
    columns() {
      return [
        {
          prop: "ip",
          label: this.$t('manage.Node IP'),
          minWidth: 250,
          sortable: true
        },
        {
          prop: "hostname",
          label: this.$t('manage.Node Name'),
          minWidth: 250,
          sortable: true
        },
        {
          prop: "shardNumber",
          label: this.$t('manage.shard number'),
          minWidth: 250,
          sortable: true
        },
        {
          prop: "replicaNumber",
          label: this.$t('manage.replica number'),
          minWidth: 250,
          sortable: true
        },
        {
          prop: "disk",
          label: this.$t('manage.Disk(Used/Total)'),
          minWidth: 250,
          sortable: true
        },
        {
          prop: "status",
          label: this.$t('manage.Node Status'),
          minWidth: 250,
          sortable: true,
          filters: [{ 'label': 'green', 'value': 'green' }, { 'label': 'red', 'value': 'red' }]
        }
      ];
    }
  },
  watch: {
    input() {
      this.currentPage = 1;
    },
    pageSize() {
      this.currentPage = 1;
    },
    totalPages(value) {
      if (this.currentPage > value) {
        this.currentPage = value;
      }
    },
  },
  mounted() {
    this.clusterStatus = Object.keys(ClusterStatus)
      .filter((item) => item !== "upgrade")
      .map((v) => upperFirst(v));
    this.fetchData();
    // this.fetchVersionData();
  },
  methods: {
    statusLabel(status) {
      const key = 'manage.status' + upperFirst(status);
      const label = this.$t(key);
      return label === key ? status : label;
    },
    hasDiskData(disk) {
      if (!disk || typeof disk !== 'string') return false;
      return /([\d.]+)\s*\w*\s*\/\s*([\d.]+)/.test(disk);
    },
    diskPercent(disk) {
      if (!disk || typeof disk !== 'string') return 0;
      const match = disk.match(/([\d.]+)\s*\w*\s*\/\s*([\d.]+)/);
      if (!match) return 0;
      const used = parseFloat(match[1]);
      const total = parseFloat(match[2]);
      if (!total || isNaN(used)) return 0;
      return Math.min(100, Math.round((used / total) * 100));
    },
    diskColor(percentage) {
      if (percentage >= 90) return '#EF4444';
      if (percentage >= 70) return '#F59E0B';
      return '#10B981';
    },
    async fetchData() {
      const {
        data: { entity },
      } = await ClusterApi.getClusterInfo(this.$route.params.id);
      this.list = entity;
      this.mode = entity.mode;
      this.httpPort = entity.httpPort;
      this.needPassword = entity.needPassword;
      this.packageType = entity.pkgType;
      this.fetchVersionData();
      this.numberRange = this.getNumberRange();
    },
    async fetchVersionData() {
      const { packageType } = this;
      const {
        data: { entity },
      } = await PackageApi.getList(packageType);
      this.versionOptions = (entity||[]).map((item) => ({
        value: item.version,
        label: item.version,
        disabled: item.version === this.list.version,
      }));
    },
    isStatusDisable(item) {
      if (
        ["start", "destroy"].includes(lowerFirst(item)) &&
        this.list.status !== "red"
      )
        return true;
      if (lowerFirst(item) === "stop" && this.list.status === "red")
        return true;
      return false;
    },
    getNumberRange() {
      let { nodes } = this.list;
      nodes = nodes.sort((a, b) => a.shardNumber - b.shardNumber);
      const range =
        nodes.length === 0
          ? [1, 1]
          : [head(nodes).shardNumber, last(nodes).shardNumber + 1];
      return range;
    },

    async openPasswordDialog() {
      const password = await $modal({
        component: InputPassword,
        props: {
          title: this.$t("home.SSH Password"),
          width: 300,
          cancelText: this.$t("common.Cancel"),
          okText: this.$t("common.Confirm"),
        },
        data: {
          password: this.password,
        }
      }).then(password => {
        return password;
      });

      return password;
    },

    async addNode() {
      let password = '';
      if (this.needPassword) {
        password = await this.openPasswordDialog();
      }

      this.password = password;

      this.addNodeDialogVisible = true;
    },

    onAddNodeSuccess(taskId) {
      this.addNodeDialogVisible = false;
      this.deleteNodeDialogVisible = false;
      $modal({
        component: TaskDetail,
        props: {
          title: this.$t('task.View Task'),
          width: 800,
          cancelText: this.$t("task.Close"),
          okText: null,
        },
        data: {
          taskId: taskId,
          refresh: true
        },
      }).finally(() => this.fetchData());
    },

    async remove(item) {
      let password = '';
      if (this.needPassword) {
        password = await this.openPasswordDialog();
      }
      this.deleteIp = item.ip;
      this.deleteNodeDialogVisible = true;
    },
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
    onClusterOp(item) {
      if (this.isStatusDisable(item)) {
        this.$message.warning(this.$t('manage.Action Unavailable In Current State'));
        return;
      }
      this.clusterOperation(item);
    },
    async clusterOperation(type) {
      type = lowerFirst(type);

      let password = '';
      if (this.needPassword) {
        password = await this.openPasswordDialog();
      }

      this.password = password; 

      await this.$confirm(this.$t('common.' + ClusterStatus[type]), this.$t('common.tips'), {
        confirmButtonText: this.$t("common.Confirm"),
        cancelButtonText: this.$t("common.Cancel"),
      });
      $loading.increase();
      let params = {
        clusterName: this.$route.params.id,
      };
      if (type === "upgrade") {
        const { packageVersion, policy, skip, keeper } = this;
        params = Object.assign(params, { packageVersion, policy, skip, skipKeeper: keeper });
      }
      const { data: { entity: taskId } } = await ClusterApi.manageCluster(type, params, password).finally(() =>
        $loading.decrease()
      );

      // 升级集群，显示任务状态弹出层
      if ((type === 'upgrade' || type === 'destroy') && taskId) {
        await $modal({
          component: TaskDetail,
          props: {
            title: this.$t('task.View Task'),
            width: 800,
            cancelText: this.$t("task.Close"),
            okText: null,
          },
          data: {
            taskId: taskId,
            refresh: true
          },
        }).finally(() => {
          if (type === 'destroy') {
            this.$router.push('/home');
            return;
          } else {
            this.fetchData();
          }
        });
      } else {
        this.$message.success(`${this.$t('manage.' + upperFirst(type) + ' Cluster')}` + ` ${this.$t('common.' + 'Success')}`);
        this.fetchData();
      }
    },

    // 集群node上线
    async onlineClusterNode(row) {
      let password = '';
      if (this.needPassword) {
        password = await this.openPasswordDialog();
      }
      this.$set(row, 'onlineLoading', true);
      const { id: clusterName } = this.$route.params;
      await ClusterApi.onlineClusterNode(clusterName, row.ip, password);
      this.$message.success(`${this.$t('manage.Online')}` + ` ${this.$t('common.' + 'Success')}`);
      this.fetchData();
      this.$set(row, 'onlineLoading', false);
    },

    // 集群node下线
    async offlineClusterNode(row) {
      let password = '';
      if (this.needPassword) {
        password = await this.openPasswordDialog();
      }
      this.$set(row, 'offlineLoading', true);
      const { id: clusterName } = this.$route.params;
      await ClusterApi.offlineClusterNode(clusterName, row.ip, password);
      this.$message.success(`${this.$t('manage.Offline')}` + ` ${this.$t('common.' + 'Success')}`);
      this.fetchData();
      this.$set(row, 'offlineLoading', false);
    },

    filterHandler(value, row, column) {
      const property = column['property'];
      return row[property] === value;
    },

    async openHttpWeb(ip, httpPort) {
      window.open("http://"+ip+":"+httpPort+"/play")
    },

    async openDashboard(ip, httpPort) {
      window.open("http://" + ip + ":" + httpPort + "/dashboard")
    },

    async viewClusterLog(row) {
      let password = "";
      if (this.needPassword) {
        password = await this.openPasswordDialog();
      }
      const { ip } = row;
      const { id: clusterName } = this.$route.params;
      await $modal({
        component: ViewLogComponent,
        props: {
          title: `${this.$t("manage.clickhouse Log")} · ${ip}`,
          width: 900,
          cancelText: null,
          okText: this.$t("common.Close"),
        },
        data: {
          clusterName,
          ip,
          password,
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.manage-page {
  padding-bottom: var(--s-8);
}

// 当前状态不可用时：保持原色，仅 hover 显示禁止光标 + 弱化透明度
.cluster-op-btn--unavailable {
  cursor: not-allowed;

  &:hover {
    opacity: 0.6;
  }
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
  &--collapsed {
    .upgrade-card__header {
      padding-bottom: 0;
      border-bottom: none;
      margin-bottom: 0;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-3);
    padding-bottom: var(--s-3);
    border-bottom: 1px solid var(--c-surface-2);
    margin-bottom: var(--s-4);

    &--toggle {
      cursor: pointer;
      user-select: none;

      &:hover .upgrade-card__chevron {
        color: var(--c-primary-solid);
      }
    }
  }

  &__title-group {
    display: inline-flex;
    align-items: baseline;
    gap: var(--s-4);
  }

  &__title {
    font-size: var(--fs-md);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
    margin: 0;
    line-height: var(--lh-tight);
  }

  &__chevron {
    color: var(--c-text-tertiary);
    font-size: var(--fs-sm);
    transition: color var(--du-fast) var(--ease-out);
  }

  &__current {
    display: inline-flex;
    align-items: baseline;
    gap: var(--s-2);
  }

  &__current-label {
    font-size: var(--fs-xs);
    color: var(--c-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: var(--fw-medium);
  }

  &__current-pill {
    display: inline-block;
    font-size: var(--fs-md);
    font-weight: var(--fw-semibold);
    color: var(--c-primary-solid);
    background: var(--c-primary-bg);
    border: 1px solid var(--c-primary-border);
    border-radius: var(--r-md);
    padding: 2px var(--s-2);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.3px;
    line-height: var(--lh-tight);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--s-3);
  }

  &__field {
    display: flex;
    align-items: center;
    gap: var(--s-3);
  }

  &__field-label {
    width: 96px;
    flex-shrink: 0;
    text-align: right;
    font-size: var(--fs-sm);
    font-weight: var(--fw-medium);
    color: var(--c-text-secondary);
  }

  &__select {
    width: 280px;
  }

  &__options {
    display: flex;
    align-items: center;
    gap: var(--s-4);
    padding-left: calc(96px + var(--s-3));
  }

  &__action {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--s-3);
    border-top: 1px solid var(--c-surface-2);
    margin-top: var(--s-2);
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

  &__pagination {
    margin-top: var(--s-3);
    text-align: right;
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

.disk-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 140px;

  &__bar {
    width: 100%;
  }

  &__text {
    font-size: var(--fs-xs);
    color: var(--c-text-tertiary);
    font-variant-numeric: tabular-nums;
  }

  &__empty {
    color: var(--c-text-tertiary);
  }
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
