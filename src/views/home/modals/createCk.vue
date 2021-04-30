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
                   size="small"
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
      <el-form-item :label="$t('home.Data pat') + ':'"
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
                    prop="password"
                    required>
        <el-input v-model="formModel.password"
                  type="password"
                  show-password
                  autocomplete="new-password"
                  class="width-350" />
      </el-form-item>

      <el-form-item :label="$t('home.SSH Username') + ':'"
                    prop="sshUser"
                    v-if="type"
                    required>
        <el-input v-model="formModel.sshUser"
                  class="width-350" />
      </el-form-item>
      <el-form-item :label="$t('home.SSH Password') + ':'"
                    prop="sshPassword"
                    v-if="type"
                    required>
        <el-input v-model="formModel.sshPassword"
                  type="password"
                  show-password
                  autocomplete="new-password"
                  class="width-350" />
      </el-form-item>
    </el-form>
  </section>
</template>
<script>
import { chunk } from "lodash-es";
import { ClusterApi } from "@/apis";
import { lineFeed } from "@/helpers";
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
        isReplica: false,
        port: 9000,
        zkPort: 2181,
        zkStatusPort:8080,
        path: "",
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
        hosts,
        zkNodes,
        user,
        password,
        sshUser,
        sshPassword,
        isReplica,
        port,
        zkPort,
        zkStatusPort,
        path,
      } = this.formModel;
      if (!this.type) {
        await ClusterApi.importCluster({
          cluster,
          hosts: lineFeed(hosts),
          port: +port,
          user,
          password,
          zkNodes: lineFeed(zkNodes),
          zkPort: +zkPort,
          zkStatusPort: +zkStatusPort,
        });
      } else {
        console.log(lineFeed(hosts));
        const shards = await this.dealShards(isReplica, lineFeed(hosts));
        await ClusterApi.createCluster({
          clickhouse: {
            ckTcpPort: +port,
            clusterName: cluster,
            shards,
            packageVersion,
            password,
            path,
            user,
            zkNodes: lineFeed(zkNodes),
            zkPort: +zkPort,
            zkStatusPort: +zkStatusPort,
          },
          hosts: lineFeed(hosts),
          password: sshPassword,
          user: sshUser,
        });
      }
    },
  },
  components: {},
};
</script>

<style lang="scss" scoped></style>
