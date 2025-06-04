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
import { $modal } from '@/services/';
import InputPassword from '../manage/modal/inputPassword.vue';
import TaskDetail from '@/views/task/components/TaskDetail.vue';
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
    async openPasswordDialog() {
      const password = await $modal({
        component: InputPassword,
        props: {
          title: this.$t("home.SSH Password"),
          width: 300,
          cancelText: this.$t("common.Cancel"),
          okText: this.$t("common.Confirm"),
        },
        data: {
          password: this.password,
        }
      }).then(password => {
        return password;
      });

      return password;
    },
    async onSubmit({ data, force }) {
      let password = "";
      console.log(data);
      console.log(data["AuthenticateType"]);
      if (data["AuthenticateType"] === 1) {
        password = await this.openPasswordDialog();
      }
      this.loading = true;
      const clusterName = this.$route.params.id;
      const { data: { entity: taskId } } = await ClusterApi.saveClusterConfig(clusterName, data, force, password).finally(() => this.loading = false);
      await $modal({
        component: TaskDetail,
        props: {
          title: this.$t('task.View Task'),
          width: 800,
          cancelText: this.$t("task.Close"),
          okText: null,
        },
        data: {
          taskId: taskId,
          refresh: true
        },
      });
    }
  }
}
</script>
