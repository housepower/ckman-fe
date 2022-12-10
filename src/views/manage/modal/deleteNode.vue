<template>
  <el-dialog
    v-bind="$attrs"
    :title="$t('common.tips')"
    @close="close"
    >
    {{ $t("common.Confirm Delete") }}
    <span slot="footer" class="dialog-footer">
      <el-checkbox v-model="force" class="mr-20">{{ $t('common.Force Delete') }}</el-checkbox>
      <el-button @click="close">{{$t("common.Cancel")}}</el-button>
      <el-button type="primary" @click="onOk">{{$t("common.Save")}}</el-button>
    </span>
  </el-dialog>
</template>
<script>
import { ClusterApi } from "@/apis";
export default {
  props: {
    "ip": String,
    "password": String,
  },
  data() {
    return {
      force: false,
    };
  },
  methods: {
    close() {
      this.$emit('close');
    },
    async onOk() {
      const { force, password, ip } = this;
      const { data: { entity: taskId } } = await ClusterApi.deleteClusterNode(this.$route.params.id, {
        ip,
        force,
      }, password);
      this.$emit('onOk', taskId);
      return taskId;
    }
  },
};
</script>

<style></style>
