<template>
  <main class="create-cluster">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console')]"
      :title="$t('home.Create a ClickHouse Cluster')"
    />
    <d-form
      v-if="schema"
      :loading="loading"
      :schema="schema"
      :form-model="formModel"
      @submit="onSubmit"
    />
  </main>
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

    async onSubmit({ data, force }) {
      this.loading = true;
      const { data: { entity: taskId } } = await ClusterApi.createCluster(data, force).finally(() => this.loading = false);
      await $modal({
        component: TaskDetail,
        props: {
          title: this.$t('task.View Task'),
          width: 800,
          cancelText: this.$t("task.Close"),
          okText: this.$t("common.Close"),
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

<style lang="scss" scoped>
.create-cluster {
  padding-bottom: var(--s-8);
}
</style>