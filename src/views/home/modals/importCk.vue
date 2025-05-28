<template>
  <section class="createCk">
    <el-form ref="Form"
             :model="formModel"
             label-width="150px">
      <el-form-item :label="$t('home.Cluster Name') + ':'"
                    prop="cluster"
                    required>
        <el-input v-model="formModel.cluster"
                  class="width-350" />
      </el-form-item>

      <el-form-item :label="$t('home.Logic Name') + ':'" prop="logic_cluster">
        <el-input v-model="formModel.logic_cluster" class="width-350" />
      </el-form-item>

      <el-form-item :label="$t('home.ClickHouse Node IP') + ':'"
                    prop="hosts"
                    required>
        <el-input v-model="formModel.hosts"
                  type="textarea"
                  :autosize="{ minRows: 2 }"
                  :placeholder="$t('common.placeholderIp')"
                  class="width-350" />
      </el-form-item>
      <el-form-item :label="$t('home.ClickHouse Protocol') + ':'"
                    prop="protocol"
                    required>
        <el-select v-model="formModel.protocol"
                  class="width-350">
          <el-option value="native">native</el-option>
          <el-option value="http">http</el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('home.ClickHouse TCP Port') + ':'"
                    prop="port"
                    required>
        <el-input v-model="formModel.port"
                  class="width-350" />
      </el-form-item>
      <el-form-item :label="$t('home.ClickHouse HTTP Port') + ':'"
                    prop="httpPort"
                    required>
        <el-input v-model="formModel.httpPort"
                  class="width-350" />
      </el-form-item>
      <el-form-item :label="$t('home.TLS Secure') + ':'"
                    prop="secure">
        <el-switch v-model="formModel.secure" />
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
    </el-form>
  </section>
</template>
<script>
import { ClusterApi } from "@/apis";
import { lineFeed, getCirdOrRangeIps } from "@/helpers";
export default {
  props: ["versionOptions"],
  data() {
    return {
      formModel: {
        cluster: "",
        logic_cluster: '',
        hosts: "",
        zkNodes: "",
        user: "",
        password: "",
        protocol: "native",
        port: 9000,
        httpPort: 8123,
        secure: false,
        zkPort: 2181,
        prom_host: '127.0.0.1',
        prom_port: '9090',
      },
    };
  },
  methods: {
    async onOk() {
      await this.$refs.Form.validate();
      const {
        cluster,
        logic_cluster,
        hosts,
        zkNodes,
        user,
        password,
        protocol,
        port,
        httpPort,
        secure,
        zkPort,
        prom_host,
        prom_port,
      } = this.formModel;
      await ClusterApi.importCluster({
        cluster,
        logic_cluster,
        hosts: getCirdOrRangeIps(lineFeed(hosts)),
        protocol,
        port: +port,
        httpPort: +httpPort,
        secure,
        user,
        password,
        zkNodes: getCirdOrRangeIps(lineFeed(zkNodes)),
        zkPort: +zkPort,
        prom_host,
        prom_port,
      });
    },
  },
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
