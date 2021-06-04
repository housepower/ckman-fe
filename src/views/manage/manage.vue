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
                   @click="clusterOptation(item)">{{$t('manage.' + item + ' Cluster')}}</el-button>
      </template>
    </breadcrumb>
    <section class="container">
      <div class="uprade ptb-15">
        <span class="fs-18 font-bold mb-15 inline-block">{{$t('manage.Upgrade Cluster')}}</span>
        <div class="">
          <span class="fs-14 font-bold">{{$t('home.ClickHouse Version')}}: {{ list.version }}</span>
          <span v-if="mode === 'deploy'" class="fs-14 font-bold ml-50">{{$t('manage.Upgrade to')}}:</span>
          <el-select v-model="packageVersion"
                     v-if="mode === 'deploy'"
                     size="small"
                     clearable
                     filterable
                     class="ml-10 mr-50">
            <el-option v-for="item in versionOptions"
                       v-if="mode === 'deploy'"
                       :key="item.value"
                       :label="item.label"
                       :value="item.value">
            </el-option>
          </el-select>
          <el-button type="primary"
                     v-if="mode === 'deploy'"
                     size="mini"
                     class="fs-16"
                     :disabled="!packageVersion"
                     @click="clusterOptation('upgrade')">{{$t('common.Upgrade')}}</el-button>
        </div>
      </div>
      <div class="node-list">
        <h3 class="mt-15 mb-30">{{$t('home.ClickHouse Node List')}}</h3>
        <div class="search flex flex-between">
          <el-input v-model="input"
                    placeholder="search"
                    autocomplete="false"
                    clearable
                    class="width-300"></el-input>
          <el-button type="primary"
                     v-if="mode === 'deploy'"
                     size="mini"
                     class="fs-16"
                     @click="addNode">{{$t('manage.Add Node')}}</el-button>
        </div>

        <el-table class="mt-10"
                  :data="list.nodes"
                  border>
          <el-table-column prop="ip"
                           show-overflow-tooltip
                           :label="$t('manage.Node IP')"
                           align="center" />
          <el-table-column prop="hostname"
                           show-overflow-tooltip
                           :label="$t('manage.Node Name')"
                           align="center" />
          <el-table-column prop="shardNumber"
                           show-overflow-tooltip
                           :label="$t('manage.shard number')"
                           align="center" />
          <el-table-column prop="replicaNumber"
                           show-overflow-tooltip
                           :label="$t('manage.replica number')"
                           align="center" />
          <el-table-column prop="status"
                           show-overflow-tooltip
                           :label="$t('manage.Node Status')"
                           align="center" />
          <el-table-column :label="$t('home.Actions')"
                           v-if="mode === 'deploy'"
                           #default="{ row }"
                           align="center">
            <template>
              <i class="fa fa-trash pointer fs-18"
                 v-tooltip="$t('common.Delete')"
                 @click="remove(row)" />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </main>
</template>
<script>
import { upperFirst, lowerFirst, cloneDeep, head, last } from "lodash-es";
import AddNode from "./modal/addNode";
import { $modal, $loading } from "@/services";
import { ClusterStatus, ClusterTypeStatus } from "@/constants";
import { ClusterApi, PackageApi } from "@/apis";
export default {
  data() {
    return {
      mode: "",
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
        nodes: [],
      },
      clusterStatus: [],
      packageVersion: "",
    };
  },
  mounted() {
    this.clusterStatus = Object.keys(ClusterStatus)
      .filter((item) => item !== "upgrade")
      .map((v) => upperFirst(v));
    this.fetchModeData();
    this.fetchVersionData();
    this.fetchData();
  },
  methods: {
    async fetchData() {
      const {
        data: { entity },
      } = await ClusterApi.getClusterInfo(this.$route.params.id);
      this.list = entity;
    },
    async fetchVersionData() {
      const {
        data: { entity },
      } = await PackageApi.getList();
      this.versionOptions = entity.map((item) => ({
        value: item,
        label: item,
        disabled: item === this.list.version,
      }));
    },
    async fetchModeData() {
      const {
        data: { entity },
      } = await ClusterApi.getCluster();
      Object.entries(entity).forEach(([name, item]) => {
        if (item.cluster === this.$route.params.id)
          this.mode = item.mode;
      });
      console.log("mode:", this.mode)
    },
    isStatusDisable(item) {
      if ( this.mode === "import")
        return true;
      if (
        ["start", "destroy"].includes(lowerFirst(item)) &&
        this.list.status !== "red"
      )
        return true;
      if (lowerFirst(item) === "stop" && this.list.status === "red")
        return true;
      return false;
    },
    numberRange() {
      let { nodes } = this.list;
      nodes = nodes.sort((a, b) => a.shardNumber - b.shardNumber);
      const range =
        nodes.length === 0
          ? [1, 1]
          : [head(nodes).shardNumber, last(nodes).shardNumber + 1];
      return range;
    },
    async addNode() {
      await $modal({
        component: AddNode,
        props: {
          title: this.$t("manage.Add Node"),
          width: 600,
          cancelText: this.$t("common.Cancel"),
          okText: this.$t("common.Save"),
        },
        data: {
          numberRange: this.numberRange(),
        },
      });
      this.$message.success("node节点添加成功");
      this.fetchData();
    },
    async remove(item) {
      console.log(item);
      await this.$confirm(this.$t("common.Confirm Delete"),  this.$t("common.tips"), {
        confirmButtonText: this.$t("common.Delete"),
        cancelButtonText: this.$t("common.Cancel"),
        text: "warning",
      });
      await ClusterApi.deleteClusterNode(this.$route.params.id, {
        ip: item.ip,
      });
      this.$message.success(this.$t("common.Delete") + this.$t("common.Success"));
      this.fetchData();
    },
    async clusterOptation(type) {
      type = lowerFirst(type);
      await this.$confirm(this.$t('common.' + ClusterStatus[type]), this.$t('common.tips'), {
        confirmButtonText: this.$t("common.Confirm"),
        cancelButtonText: this.$t("common.Cancel"),
      });
      $loading.increase();
      let params = {
        clusterName: this.$route.params.id,
      };
      if (type === "upgrade") {
        params = Object.assign(params, { packageVersion: this.packageVersion });
      }
      await ClusterApi.manageCluster(type, params).finally(() =>
        $loading.decrease()
      );
      this.$message.success(`${this.$t('manage.' + upperFirst(type) + ' Cluster')}` + ` ${this.$t('common.' + 'Success')}`);
      if (type === 'destroy') {
        this.$router.push('/home');
        return;
      }
      this.fetchData();
    },
  },
  components: {},
};
</script>

<style lang="scss" scoped>
.uprade {
  border-bottom: 1px solid #eaeef4;
}
</style>
