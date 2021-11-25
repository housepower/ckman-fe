<template>
  <section class="add-node">
    <el-form ref="Form"
             :model="formModel"
             label-width="150px">
      <el-form-item :label="$t('manage.New Node IP') + ':'"
                    prop="ips">
        <el-input type="textarea" v-model="formModel.ips"
                  :placeholder="$t('common.placeholderIp')"
                  class="width-350" />
      </el-form-item>
      <el-form-item :label="$t('manage.Node Shard') + ':'"
                    prop="shard">
        <el-input-number v-model="formModel.shard"
                         :step="1"
                         :min="numberRange[0]"
                         :max="numberRange[1]"></el-input-number>
      </el-form-item>
    </el-form>
  </section>
</template>
<script>
import { ClusterApi } from "@/apis";
import { lineFeed, getCirdOrRangeIps } from "@/helpers";
export default {
  props: ["numberRange", "password"],
  data() {
    return {
      formModel: {
        ips: "",
        shard: 1,
      },
    };
  },
  methods: {
    async onOk() {
      const { ips, shard } = this.formModel;
      const { data: { entity: taskId } } = await ClusterApi.addClusterNode(this.$route.params.id, {
        ips: getCirdOrRangeIps(lineFeed(ips)),
        shard: +shard,
      }, this.password);
      return taskId;
    },
  },
};
</script>

<style></style>
