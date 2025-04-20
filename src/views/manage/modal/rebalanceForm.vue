<template>
  <el-dialog
    v-bind="$attrs"
    :title="$t('manage.Rebalance Cluster')"
    width="800px"
    @close="close"
    >
    <d-form :loading="loading" v-if="schema" :noFooter="true" :schema="schema" :form-model="formModel" ref="form"></d-form>
    <el-text style="color: red;" type="warning">
      {{$t('manage.Disabled Writing')}}
    </el-text>
    <span slot="footer" class="dialog-footer">
      <el-button @click="getRebalanceInfo">{{$t("manage.Rebalance Info")}}</el-button>
      <el-button @click="close">{{$t("common.Cancel")}}</el-button>
      <el-button type="primary" @click="onSubmit" :loading="loading">{{$t("common.Confirm")}}</el-button>
    </span>
  </el-dialog>
</template>
<script>
import RebalanceInfoComponent from './rebalanceInfo.vue';
import { $modal } from "@/services";
import { DForm } from '@/components/';
import { ClusterApi } from '@/apis';
export default {
  name: 'RebalanceCluster',
  components: {
    DForm,
  },

  props: {
    type: String,
    password: String,
  },

  data() {
    return {
      schema: null,
      formModel: {},
      loading: false,
      clusterName: '',
    }
  },

  created() {
    this.clusterName = this.$route.params.id;
    this.getFormSchema();
  },

  methods: {
    close() {
      this.$emit('close');
    },
    async getFormSchema() {
      const { data: { entity } } = await ClusterApi.getReBalanceFormSchema();
      try {
        const schema = (new Function("return " + entity))();
        this.schema = schema;
      } catch (e) {

      }
    },
    getRebalanceInfo(){
      this.$refs.form.validate(async ({ data: schemaValue }) => {
      const { clusterName } = this;
      $modal({
        component: RebalanceInfoComponent,
        props: {
          title: this.$t("manage.Rebalance Info"),
          width: 800,
          cancelText: null,
          okText: null,
        },
        data: {
          clusterName,
          schemaValue,
        },
      });
    });
    },
    onSubmit() {
      this.$refs.form.validate(async ({ data: schemaValue }) => {
        this.loading = true;
        const { clusterName, password } = this;
        const { data } = await ClusterApi.rebalanceCluster({
          clusterName,
          params: schemaValue,
          password
        }).finally(() => this.loading = false);
        this.getRebalanceInfo();
      });
    }
  }
}
</script>