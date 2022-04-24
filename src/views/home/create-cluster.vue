<template>
  <div>
    <breadcrumb :data="breadcrumbInfo"></breadcrumb>
    <d-form :loading="loading" class="mt-30" v-if="schema" :schema="schema" :form-model="formModel" @submit="onSubmit"></d-form>
  </div>
</template>
<script>
import { DForm } from '@/components/';
import { ClusterApi } from '@/apis';
import { $modal } from '@/services/';
import TaskDetail from '@/views/task/components/TaskDetail.vue';
// import dataJson from '@/components/d-form/mock/data.json';
export default {
  name: 'CreateCluster',
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

  methods: {
    async getFormSchema() {
      const { data: { entity } } = await ClusterApi.getClusterCreateFormSchema();
      try {
        const schema = (new Function("return " + entity))();
        this.schema = schema;
        // this.schema = dataJson;
        // console.log(dataJson);
      } catch (e) {

      }
    },

    async onSubmit(data) {
      this.loading = true;
      const { data: { entity: taskId } } = await ClusterApi.createCluster(data).finally(() => this.loading = false);
      await $modal({
        component: TaskDetail,
        props: {
          title: this.$t('task.View Task'),
          width: 800,
          cancelText: this.$t("task.Close"),
          okText: '关闭',
          cancelText: null
        },
        data: {
          taskId: taskId,
          refresh: true
        },
      }).then(status => {
        // 任务全部成功，返回上层页面
        if (status === 'Done') {
          this.$router.go(-1);
        }
      })
    }
  }
}
</script>