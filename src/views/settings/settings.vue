<template>
  <main class="cluster-settings" v-if="mode">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console'), $route.params.id]"
      :title="$t('home.Settings')"
    />
    <div v-if="mode === 'import'" class="cluster-settings__import-tip">
      {{ $t('home.The imported cluster does not support editing') }}
    </div>
    <d-form
      v-else-if="schema"
      :loading="loading"
      :schema="schema"
      :form-model="formModel"
      :is-show-cancel="false"
      :submit-text="$t('common.Save')"
      @submit="onSubmit"
    />
  </main>
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

<style lang="scss" scoped>
.cluster-settings {
  padding-bottom: var(--s-8);

  &__import-tip {
    margin: var(--s-6) auto;
    text-align: center;
    color: var(--c-text-tertiary);
    font-size: var(--fs-md);
  }
}
</style>
