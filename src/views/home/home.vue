<template>
  <section class="home">
    <section class="flex flex-wrap">
      <div class="flex-1">
        <div class="title flex flex-column mb-30">
          <p class="mb-5"
             style="font-size: 40px">
            <i class="fa fa-database"></i>
            <span class="inline-block ml-10 font-bold">Provision</span>
          </p>
          <p class="fs-14 font-bold">{{$t('home.Create or import a ClickHouse Cluster')}}</p>
        </div>
        <div class="btns flex flex-column width-6">
          <el-button type="primary"
                     size="large"
                     class="mb-20 fs-18"
                     @click="createCk">{{$t('home.Create a ClickHouse Cluster')}}</el-button>
          <el-button type="primary"
                     size="large"
                     class="fs-18"
                     @click="importCk">{{$t('home.Import a ClickHouse Cluster')}}</el-button>
        </div>
      </div>
    </section>

    <div class="list mt-50">
      <div class="font-bold mb-10 fs-18 overflow-hidden">{{$t('home.All ClickHouse Clusters')}}
        
        <el-input v-model="key"
          :placeholder="$t('common.keyword search')"
          autocomplete="false"
          clearable
          size="medium"
          class="width-300 pull-right"></el-input>
      </div>
      <el-table :data="queryList"
                border
                header-cell-class-name="header-cell-class-name">
        <el-table-column prop="cluster"
                         show-overflow-tooltip
                         sortable
                         :label="$t('home.Cluster Name')" />
        <el-table-column prop="logic_cluster"
                         show-overflow-tooltip
                         sortable
                         :label="$t('home.Belongs to Logic')" />
        <el-table-column prop="mode"
                         show-overflow-tooltip
                         :filters="[{ text: 'deploy', value: 'deploy' }, { text: 'import', value: 'import' }]"
                         :filter-method="filterHandler"
                         :label="$t('home.Mode')" />
        <el-table-column prop="isReplica"
                         show-overflow-tooltip
                         :filters="[{ text: 'true', value: true }, { text: 'false', value: false }]"
                         :filter-method="filterHandler"
                         :label="$t('home.Replica')" />
        <el-table-column prop="hosts"
                         show-overflow-tooltip
                         :label="$t('home.ClickHouse Node IP')" />
        <el-table-column prop="count"
                         show-overflow-tooltip
                         sortable
                         :label="$t('home.ClickHouse Node Count')" />
        <el-table-column prop="comment"
                         show-overflow-tooltip
                         :label="$t('home.Comment')" />
        <el-table-column :label="$t('home.Actions')"
                         #default="{ row }">
          <el-link type="primary"
                   underline
                   @click.prevent="toCluster(row)"
                   :to="'/clusters/' + row.cluster">{{$t('home.Go to cluster')}}</el-link>
          <i class="fa fa-trash pointer fs-18 ml-15"
             v-tooltip="$t('common.Delete')"
             @click="remove(row)" />
        </el-table-column>
      </el-table>
    </div>
  </section>
</template>
<script>
import ImportCk from "./modals/importCk";
import { $modal } from "@/services";
import { ClusterApi } from "@/apis";
export default {
  name: "Home",
  data() {
    return {
      list: [],
      versionOptions: [],
      key: '',
    };
  },
  computed: {
    queryList() {
      const { list, key } = this;
      return list.filter(item => {
        return item.cluster.includes(key)
          || item.mode.includes(key)
          || item.logic_cluster?.includes(key)
          || item.hosts.includes(key);
      });
    }
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.list = [];
      const {
        data: { entity },
      } = await ClusterApi.getCluster();
      Object.entries(entity).forEach(([name, item]) => {
        item.count = item.hosts.length;
        item.hosts = item.hosts.join(",");
        this.list.unshift(item);
      });
    },
    createCk() {
      this.$router.push({
        name: 'createCluster'
      });
    },
    async importCk() {
      await $modal({
        component: ImportCk,
        props: {
          title: this.$t("home.Import a ClickHouse Cluster"),
          width: 600,
          customClass: 'create-cluster-modal',
          cancelText: this.$t("common.Cancel"),
          okText: this.$t("common.Import"),
        },
        data: {
          versionOptions: this.versionOptions,
        },
      });
      const tip = this.$t('common.Import') + this.$t('common.Success');
      this.$message.success(`${tip}`);
      this.fetchData();
    },
    toCluster(item) {
      this.$root.clusterBench = item;
      delete this.$root.clusterBench.count;
    },
    async remove(item) {
      await this.$confirm(this.$t("common.Confirm Delete"), this.$t("common.tips"), {
        confirmButtonText: this.$t("common.Delete"),
        cancelButtonText: this.$t("common.Cancel"),
        text: "warning",
      });
      await ClusterApi.deleteCluster(`${item.cluster}`);
      this.$message.success(`${item.cluster} Cluster ${ this.$t("common.Delete") }${ this.$t("common.Success") }`);
      this.fetchData();
    },

    filterHandler(value, row, column) {
      const property = column['property'];
      return row[property] === value;
    }
  },
};
</script>

<style lang="scss" scoped>
.title {
  color: var(--color-black);
}
.btns {
  width: 300px;
  .el-button {
    margin: 0;
    height: 42px;
  }
}
// .list {
//   ::v-deep .header-cell-class-name {
//     background: var(--primary-color);
//   }
// }
</style>
