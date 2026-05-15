<template>
  <main class="import-cluster">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console')]"
      :title="$t('home.Import a ClickHouse Cluster')"
    />

    <section class="import-cluster__card">
      <el-form
        ref="Form"
        :model="formModel"
        label-position="top"
        size="medium"
        class="import-form"
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

      <footer class="import-cluster__foot">
        <el-button size="medium" @click="onCancel">{{ $t('common.Cancel') }}</el-button>
        <el-button size="medium" type="primary" :loading="loading" @click="onSubmit">{{ $t('common.Import') }}</el-button>
      </footer>
    </section>
  </main>
</template>

<script>
import { ClusterApi } from '@/apis';
import { lineFeed, getCirdOrRangeIps } from '@/helpers';

export default {
  name: 'ImportCluster',
  data() {
    return {
      loading: false,
      formModel: {
        cluster: '',
        logic_cluster: '',
        hosts: '',
        zkNodes: '',
        user: '',
        password: '',
        protocol: 'native',
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
    onCancel() {
      this.$router.go(-1);
    },
    async onSubmit() {
      try {
        await this.$refs.Form.validate();
      } catch (e) {
        return;
      }
      this.loading = true;
      const {
        cluster, logic_cluster, hosts, zkNodes, user, password,
        protocol, port, httpPort, secure, zkPort, prom_host, prom_port,
      } = this.formModel;
      try {
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
        this.$message.success(`${this.$t('common.Import')}${this.$t('common.Success')}`);
        this.$router.push({ name: 'Home' });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.import-cluster {
  padding-bottom: var(--s-8);

  &__card {
    background: var(--c-surface-0);
    border: 1px solid var(--c-surface-3);
    border-radius: var(--r-lg);
    padding: var(--s-5) var(--s-5) var(--s-4);
    margin-top: var(--s-3);
  }

  &__foot {
    display: flex;
    justify-content: flex-end;
    gap: var(--s-2);
    margin-top: var(--s-4);
    padding-top: var(--s-4);
    border-top: 1px solid var(--c-surface-3);
  }
}

.import-form {
  &__section {
    font-size: var(--fs-xs);
    font-weight: var(--fw-semibold);
    color: var(--c-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin: 0 0 var(--s-3);
    padding-bottom: var(--s-1);
    border-bottom: 1px solid var(--c-surface-3);

    &:not(:first-child) {
      margin-top: var(--s-5);
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
