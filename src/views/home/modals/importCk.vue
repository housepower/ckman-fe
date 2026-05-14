<template>
  <section class="import-form">
    <el-form
      ref="Form"
      :model="formModel"
      label-position="top"
    >
      <h4 class="import-form__section">{{ $t('home.sectionCluster') }}</h4>
      <div class="import-form__grid">
        <el-form-item :label="$t('home.Cluster Name')" prop="cluster" required>
          <el-input v-model="formModel.cluster" />
        </el-form-item>
        <el-form-item :label="$t('home.Logic Name')" prop="logic_cluster">
          <el-input v-model="formModel.logic_cluster" />
        </el-form-item>
        <el-form-item
          :label="$t('home.ClickHouse Node IP')"
          prop="hosts"
          required
          class="import-form__full"
        >
          <el-input
            v-model="formModel.hosts"
            type="textarea"
            :autosize="{ minRows: 2 }"
            :placeholder="$t('common.placeholderIp')"
            class="import-form__mono"
          />
        </el-form-item>
        <el-form-item :label="$t('home.ClickHouse Protocol')" prop="protocol" required>
          <el-select v-model="formModel.protocol" class="import-form__field">
            <el-option value="native">native</el-option>
            <el-option value="http">http</el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('home.TLS Secure')" prop="secure">
          <el-switch v-model="formModel.secure" />
        </el-form-item>
        <el-form-item :label="$t('home.ClickHouse TCP Port')" prop="port" required>
          <el-input v-model="formModel.port" class="import-form__field" />
        </el-form-item>
        <el-form-item :label="$t('home.ClickHouse HTTP Port')" prop="httpPort" required>
          <el-input v-model="formModel.httpPort" class="import-form__field" />
        </el-form-item>
      </div>

      <h4 class="import-form__section">{{ $t('home.sectionZk') }}</h4>
      <div class="import-form__grid">
        <el-form-item
          :label="$t('home.Zookeeper Node List')"
          prop="zkNodes"
          required
          class="import-form__full"
        >
          <el-input
            v-model="formModel.zkNodes"
            type="textarea"
            :autosize="{ minRows: 2 }"
            :placeholder="$t('common.placeholderIp')"
            class="import-form__mono"
          />
        </el-form-item>
        <el-form-item :label="$t('home.ZooKeeper Port')" prop="zkPort" required>
          <el-input v-model="formModel.zkPort" class="import-form__field" />
        </el-form-item>
      </div>

      <h4 class="import-form__section">{{ $t('home.sectionAuth') }}</h4>
      <div class="import-form__grid">
        <el-form-item :label="$t('home.Cluster Username')" prop="user" required>
          <el-input v-model="formModel.user" />
        </el-form-item>
        <el-form-item :label="$t('home.Cluster Password')" prop="password">
          <el-input
            v-model="formModel.password"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
      </div>
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

<style lang="scss" scoped>
.import-form {
  &__section {
    font-size: var(--fs-xs);
    font-weight: var(--fw-semibold);
    color: var(--c-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin: 0 0 var(--s-2);
    padding-bottom: var(--s-1);
    border-bottom: 1px solid var(--c-surface-3);

    &:not(:first-child) {
      margin-top: var(--s-4);
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 var(--s-4);
  }

  &__full {
    grid-column: 1 / -1;
  }

  &__field {
    width: 100%;
  }

  &__mono ::v-deep .el-textarea__inner {
    font-family: var(--f-mono);
    font-size: var(--fs-sm);
    line-height: var(--lh-normal);
  }
}

::v-deep .el-form-item {
  margin-bottom: var(--s-3);
}

::v-deep .el-form-item__label {
  font-weight: var(--fw-medium);
  color: var(--c-text-primary);
  padding-bottom: var(--s-1) !important;
  line-height: var(--lh-tight);
}

::v-deep .el-switch.is-checked .el-switch__core {
  background-color: var(--c-primary-solid);
  border-color: var(--c-primary-solid);
}
</style>

<style lang="scss">
  .create-cluster-modal {
    .el-dialog__body {
      max-height: 70vh;
      overflow-y: auto;
    }
  }
</style>
