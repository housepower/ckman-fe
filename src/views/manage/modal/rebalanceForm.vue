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
      <el-checkbox v-model="balanceAll" class="mr-20">{{ $t('manage.All Table Rebalance') }}</el-checkbox>
      <el-button @click="close">{{$t("common.Cancel")}}</el-button>
      <el-button type="primary" @click="onSubmit" :loading="loading">{{$t("common.Confirm")}}</el-button>
    </span>
  </el-dialog>
</template>
<script>
import { DForm } from '@/components/';
import { ClusterApi } from '@/apis';
export default {
  name: 'CreateCluster',
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
      balanceAll: false,
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

    onSubmit() {
      this.$refs.form.validate(async ({ data: schemaValue }) => {
        this.loading = true;
        const { clusterName, password, balanceAll } = this;
        const { data } = await ClusterApi.rebalanceCluster({
          clusterName,
          params: schemaValue,
          all: balanceAll,
          password
        }).finally(() => this.loading = false);
        this.close();
      });
    }
  }
}
</script>