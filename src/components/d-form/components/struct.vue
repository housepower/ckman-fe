<template>
  <div class="flex flex-column">
    <!-- TLS 证书来源：两个并列的顶层入口（导入 / 自动生成），而不是挂在某个具体字段下面 -->
    <div v-if="isTlsStruct" class="tls-source-toolbar">
      <span class="tls-source-toolbar__label">{{ $t('common.Import From File') }}</span>
      <input ref="certFileInput" type="file" accept=".crt,.pem,.key" style="display: none" @change="onCertFileChange($event, 'Cert')" />
      <input ref="keyFileInput" type="file" accept=".crt,.pem,.key" style="display: none" @change="onCertFileChange($event, 'Key')" />
      <el-button size="small" @click="$refs.certFileInput.click()">{{ $t('common.Import Certificate File') }}</el-button>
      <el-button size="small" @click="$refs.keyFileInput.click()">{{ $t('common.Import Key File') }}</el-button>
      <el-divider direction="vertical"></el-divider>
      <el-tooltip v-if="!isAdmin" effect="dark" :content="$t('common.Generate Self Signed Cert No Permission')" placement="top">
        <span>
          <el-button size="small" type="primary" disabled>
            {{ $t('common.Generate Self Signed Cert') }}
          </el-button>
        </span>
      </el-tooltip>
      <el-button v-else size="small" type="primary" :loading="genCertLoading" @click="genSelfSignedCert">
        {{ $t('common.Generate Self Signed Cert') }}
      </el-button>
    </div>
    <div class="pt-15 pr-20 pb-5 struct">
      <DFormItem v-model="formModel" v-for="(item, key) in schema" :key="key" :schema="item" :origin-name="key" :prop-name="`${PropName}.${key}`">
      </DFormItem>
    </div>
  </div>
</template>
<script>
import { ClusterApi } from '@/apis';
import { readFile } from '@/helpers';

export default {
  name: 'DForm',
  components: {
    DFormItem: () => import('../d-form-item.vue'),
  },

  model: {
    prop: 'formModel',
    event: 'change',
  },

  inject: {
    // 由 d-form.vue 提供，用于读取表单根数据（生成自签名证书需要顶层已填写的节点 IP）
    dFormRoot: {
      default: null,
    },
  },

  props: {
    schema: {
      type: Object,
      default() {
        return {};
      },
    },
    PropName: {
      type: String,
      default: ''
    },
    formModel: {
      type: Object,
      default() {
        return {}
      }
    }
  },

  data() {
    return {
      formData: {},
      genCertLoading: false,
    }
  },

  computed: {
    // TlsConf 是唯一在 schema 里注册的、含 Cert/Key 一对字段的顶层 struct，用字段名特判
    // （与 list-struct.vue 里对 Shards/Replicas 的特判是同一种风格）
    isTlsStruct() {
      return this.PropName === 'TlsConf';
    },
    isAdmin() {
      const root = this.$root;
      return !!(root && root.userInfo && root.userInfo.policy === 'admin');
    },
  },

  created() {
  },

  mounted() {

  },

  methods: {
    // 收集表单里已填写的全部 ClickHouse 节点 IP，用作自签名证书的 SAN
    collectHosts() {
      const root = this.dFormRoot && this.dFormRoot.formData;
      const shards = root && root.Shards;
      if (!Array.isArray(shards)) return [];
      const ips = [];
      shards.forEach((shard) => {
        (shard.Replicas || []).forEach((replica) => {
          if (replica && replica.Ip) ips.push(replica.Ip);
        });
      });
      return [...new Set(ips)];
    },

    async genSelfSignedCert() {
      const hosts = this.collectHosts();
      if (hosts.length === 0) {
        this.$message.warning(this.$t('common.No Host For Self Signed Cert'));
        return;
      }
      this.genCertLoading = true;
      try {
        const { data: { entity } } = await ClusterApi.genSelfSignedCert(hosts);
        this.$set(this.formModel, 'Cert', entity.cert);
        this.$set(this.formModel, 'Key', entity.key);
        this.$set(this.formModel, 'SelfSigned', true);
        this.$message.success(this.$t('common.Generate Self Signed Cert Success'));
      } catch (e) {
        if (e && e.response && e.response.data && e.response.data.retCode === '5030') {
          this.$message.error(this.$t('common.Generate Self Signed Cert No Permission'));
        } else {
          this.$message.error((e && e.message) || this.$t('errors.Unknown'));
        }
      } finally {
        this.genCertLoading = false;
      }
    },

    async onCertFileChange(event, fieldName) {
      const file = event.target.files && event.target.files[0];
      event.target.value = '';
      if (!file) return;
      try {
        const content = await readFile(file);
        this.$set(this.formModel, fieldName, content);
        // 手动导入的证书不再视为 ckman 自签名
        this.$set(this.formModel, 'SelfSigned', false);
      } catch (e) {
        this.$message.error(this.$t('common.Read File Failed'));
      }
    },
  }
}
</script>
<style lang="scss" scoped>
.tls-source-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0 0 10px 20px;
  padding: 10px 12px;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;

  &__label {
    color: #909399;
    font-size: 13px;
    margin-right: 2px;
  }
}
</style>
