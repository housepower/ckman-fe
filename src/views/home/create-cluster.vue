<template>
  <div>
    <breadcrumb :data="breadcrumbInfo"></breadcrumb>
    <d-form :loading="loading" class="mt-30" v-if="schema" :schema="schema" :form-model="formModel" @submit="onSubmit"></d-form>
  </div>
  
</template>
<script>
import { DForm } from '@/components/';
// import mockData from '@/components/d-form/mock/data.json';
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
      breadcrumbInfo: ["Clusters", this.$t("home.Create a ClickHouse Cluster")],
      loading: false,
    }
  },

  created() {
    this.getFormSchema();
  },

  mounted() {
  },

  methods: {
    async getFormSchema() {
      const { data: { entity } } = await ClusterApi.getClusterCreateFormSchema();
      try {
        const schema = (new Function("return " + entity))();
        this.schema = schema;
      } catch (e) {

      }
    },

    async onSubmit(data) {
      this.loading = true;
      await ClusterApi.createCluster(data).finally(() => this.loading = false);
      this.$router.go(-1);
    }
  }
}
</script>