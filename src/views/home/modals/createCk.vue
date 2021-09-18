<template>
  <section class="createCk">
    <el-form ref="Form"
             :model="formModel"
             label-width="150px">
      <el-form-item :label="$t('home.ClickHouse Version') + ':'"
                    prop="packageVersion"
                    v-if="type"
                    required>
        <el-select v-model="formModel.packageVersion"
                   clearable
                   filterable
                   class="width-350">
          <el-option v-for="item in versionOptions"
                     :key="item.value"
                     :label="item.label"
                     :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('home.Cluster Name') + ':'"
                    prop="cluster"
                    required>
        <el-input v-model="formModel.cluster"
                  class="width-350" />
      </el-form-item>

      <el-form-item :label="$t('home.Logic Name') + ':'" prop="logic_cluster" v-if="type">
        <el-input v-model="formModel.logic_cluster" class="width-350" />
      </el-form-item>

      <el-form-item :label="$t('home.ClickHouse Node IP') + ':'"
                    prop="hosts"
                    v-if="!type"
                    required>
        <el-input v-model="formModel.hosts"
                  type="textarea"
                  :autosize="{ minRows: 2 }"
                  :placeholder="$t('common.placeholderIp')"
                  class="width-350" />
      </el-form-item>
      <el-form-item :label="$t('home.ClickHouse TCP Port') + ':'"
                    prop="port"
                    required>
        <el-input v-model="formModel.port"
                  class="width-350" />
      </el-form-item>
      <el-form-item :label="$t('home.ClickHouse Node List') + ':'"
                    prop="hosts"
                    v-if="type"
                    required>
        <el-input type="textarea"
                  :autosize="{ minRows: 2 }"
                  v-model="formModel.hosts"
                  :placeholder="$t('common.placeholderIp')"
                  class="width-350" />
      </el-form-item>
      <el-form-item :label="$t('home.Replica')"
                    v-if="type"
                    prop="isReplica">
        <el-switch v-model="formModel.isReplica"></el-switch>
      </el-form-item>
      <el-form-item :label="$t('home.Zookeeper Node List') + ':'"
                    prop="zkNodes"
                    required>
        <el-input type="textarea"
                  :autosize="{ minRows: 2 }"
                  :placeholder="$t('common.placeholderIp')"
                  v-model="formModel.zkNodes"
                  class="width-350" />
      </el-form-item>
      <el-form-item :label="$t('home.ZooKeeper Port') + ':'"
                    prop="zkPort"
                    required>
        <el-input v-model="formModel.zkPort"
                  class="width-350" />
      </el-form-item>
      <el-form-item :label="$t('home.ZK Status Port') + ':'"
                    prop="zkStatusPort"
                    required>
        <el-input v-model="formModel.zkStatusPort"
                  class="width-350" />
      </el-form-item>
      <el-form-item :label="$t('home.Data path') + ':'"
                    prop="path"
                    v-if="type"
                    required>
        <el-input v-model="formModel.path"
                  class="width-350" />
      </el-form-item>
      <el-form-item :label="$t('home.Cluster Username') + ':'"
                    prop="user"
                    required>
        <el-input v-model="formModel.user"
                  class="width-350" />
      </el-form-item>
      <el-form-item :label="$t('home.Cluster Password') + ':'"
                    prop="password">
        <el-input v-model="formModel.password"
                  type="password"
                  show-password
                  autocomplete="new-password"
                  class="width-350" />
      </el-form-item>

      <!-- SSH用户名 -->
      <el-form-item :label="$t('home.SSH Username') + ':'"
                    prop="sshUser"
                    v-if="type"
                    required>
        <el-input v-model="formModel.sshUser"
                  class="width-350" />
      </el-form-item>
      <!-- SSH用户名 -->

      <!-- 使用公钥 -->
      <el-form-item :label="$t('home.Public Key') + ':'" prop="usePubkey" v-if="type">
        <el-switch v-model="formModel.usePubkey" :active-value="true" :inactive-value="false"></el-switch>
      </el-form-item>
       <!-- 使用公钥 -->

       <!-- SSH密码 -->
      <el-form-item :label="$t('home.SSH Password') + ':'" prop="sshPassword" v-if="type && !formModel.usePubkey">
        <el-input v-model="formModel.sshPassword"
          type="password"
          show-password
          autocomplete="new-password"
          class="width-350" />
          <el-checkbox v-model="formModel.savePassword">{{ $t('home.Save Password') }}?</el-checkbox>
      </el-form-item>
      <!-- SSH密码 -->

      <el-form-item :label="$t('home.SSH Port') + ':'" prop="sshPort" v-if="type" required>
        <el-input v-model="formModel.sshPort" class="width-350" />
      </el-form-item>
    </el-form>
  </section>
</template>
<script>
import { chunk } from "lodash-es";
import { ClusterApi } from "@/apis";
import { lineFeed, getCirdOrRangeIps } from "@/helpers";
export default {
  props: ["type", "versionOptions"],
  data() {
    return {
      formModel: {
        packageVersion: "",
        cluster: "",
        hosts: "",
        zkNodes: "",
        user: "",
        password: "",
        sshUser: "",
        sshPassword: "",
        sshPort:22,
        isReplica: false,
        port: 9000,
        zkPort: 2181,
        zkStatusPort:8080,
        path: "",
        savePassword: false,
        usePubkey: false,
      },
    };
  },
  methods: {
    async dealShards(isReplica, hosts) {
      if (!isReplica) {
        return hosts.map((ip) => ({ replicas: [{ ip }] }));
      } else {
        const isAliquot = hosts.length % 2;
        if (isAliquot) {
          this.$message.warning("hosts字段ip数量有误");
          return Promise.reject();
        } else {
          return chunk(hosts, 2).map((host) => ({
            replicas: host.map((ip) => ({ ip })),
          }));
        }
      }
    },
    async onOk() {
      await this.$refs.Form.validate();
      const {
        packageVersion,
        cluster,
        logic_cluster,
        hosts,
        zkNodes,
        user,
        password,
        sshUser,
        sshPassword,
        sshPort,
        isReplica,
        port,
        zkPort,
        zkStatusPort,
        path,
        savePassword,
        usePubkey,
      } = this.formModel;
      if (!this.type) {
        await ClusterApi.importCluster({
          cluster,
          logic_cluster,
          hosts: getCirdOrRangeIps(lineFeed(hosts)),
          port: +port,
          user,
          password,
          zkNodes: getCirdOrRangeIps(lineFeed(zkNodes)),
          zkPort: +zkPort,
          zkStatusPort: +zkStatusPort,
        });
      } else {
        const shards = await this.dealShards(isReplica, getCirdOrRangeIps(lineFeed(hosts)));
        await ClusterApi.createCluster({
          clickhouse: {
            ckTcpPort: +port,
            clusterName: cluster,
            logic_cluster,
            shards,
            packageVersion,
            password,
            path,
            user,
            zkNodes: getCirdOrRangeIps(lineFeed(zkNodes)),
            zkPort: +zkPort,
            zkStatusPort: +zkStatusPort,
          },
          hosts: getCirdOrRangeIps(lineFeed(hosts)),
          user: sshUser,
          sshPort: +sshPort,
          usePubkey,
          password: usePubkey ? null : sshPassword, // usePubkey为true, sshPassword才有效
          savePassword: usePubkey ? null : savePassword, // usePubkey为true, savePassword才有效
        });
      }
    },
  },
  components: {},
};
</script>

<style lang="scss">
  .create-cluster-modal {
    .el-dialog__body {
      height: 500px;
      overflow-y: auto;
    }
  }
</style>
