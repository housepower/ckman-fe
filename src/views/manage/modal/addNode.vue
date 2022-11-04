<template>
  <el-dialog
    v-bind="$attrs"
    :title="$t('manage.Add Node')"
    @close="close"
    >
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
    <span slot="footer" class="dialog-footer">
      <el-checkbox v-model="force" class="mr-20">{{ $t('common.Force Override') }}</el-checkbox>
      <el-button @click="close">{{$t("common.Cancel")}}</el-button>
      <el-button type="primary" @click="onOk">{{$t("common.Save")}}</el-button>
    </span>
  </el-dialog>
</template>
<script>
import { ClusterApi } from "@/apis";
import { lineFeed, getCirdOrRangeIps } from "@/helpers";
export default {
  props: {
    "numberRange": Array,
    "password": String,
  },
  data() {
    return {
      formModel: {
        ips: "",
        shard: 1,
      },
      force: false,
    };
  },
  methods: {
    close() {
      this.$emit('close');
    },
    async onOk() {
      const { ips, shard } = this.formModel;
      const { force, password } = this;
      const { data: { entity: taskId } } = await ClusterApi.addClusterNode(this.$route.params.id, {
        ips: getCirdOrRangeIps(lineFeed(ips)),
        shard: +shard,
      }, force, password);
      this.$emit('onOk', taskId);
      return taskId;
    }
  },
};
</script>

<style></style>
