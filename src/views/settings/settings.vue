<template>
  <div class="flex flex-column height-full" v-if="mode">
    <breadcrumb :data="breadcrumbInfo"></breadcrumb>
    <div class="flex-1 flex" v-if="mode === 'import'">
      <div class="fs-20" style="margin: 20px auto;">{{$t("home.The imported cluster does not support editing")}}</div>
    </div>
    <div v-else>
      <d-form class="mt-30" :loading="loading" v-if="schema" :schema="schema" :form-model="formModel" @submit="onSubmit" :is-show-cancel="false" :submit-text="$t('common.Save')"></d-form>
    </div>
  </div>
  
</template>
<script>
import { DForm } from '@/components/';
import { ClusterApi } from '@/apis';
export default {
  name: 'test',
  components: {
    DForm,
  },

  props: {},

  data() {
    return {
      schema: null,
      formModel: {},
      breadcrumbInfo: ["Clusters", this.$route.params.id, this.$t("settings")],
      mode: '',
      loading: false,
    }
  },

  created() {
    this.getFormSchema();
    this.getCluster();
  },

  mounted() {
  },

  methods: {
    async getCluster() {
      const clusterName = this.$route.params.id;
      const { data: { entity } } = await ClusterApi.getClusterConfig(clusterName);
      this.mode = entity.mode;
      const data = (new Function("return " + entity.config))();
      console.log(data);
      this.formModel = data;
    },

    async getFormSchema() {
      const { data: { entity } } = await ClusterApi.getClusterUpdateFormSchema();
      try {
        const schema = (new Function("return " + entity))();
        this.schema = schema;
      } catch (e) {

      }
    },

    async onSubmit(data) {
      this.loading = true;
      const clusterName = this.$route.params.id;
      await ClusterApi.saveClusterConfig(clusterName, data).finally(() => this.loading = false);
      this.$message.success(`${clusterName} Cluster ${ this.$t("common.Save") }${ this.$t("common.Success") }`);
    }
  }
}
</script>
