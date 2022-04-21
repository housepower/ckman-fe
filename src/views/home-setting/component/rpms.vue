<template>
  <section class="rpms text-right">
    <el-button type="primary"
               class="mb-15"
               @click="chooseFile">{{$t('homePackage.Upload RPMs')}}</el-button>
    <el-table :data="list"
              border>
      <el-table-column prop="version"
                       show-overflow-tooltip
                       :label="$t('common.Version')"
                       align="center" />
      <el-table-column prop="pkgType"
                       show-overflow-tooltip
                       :label="$t('common.Package Type')"
                       align="center" />
      <el-table-column prop="pkgName"
                       show-overflow-tooltip
                       :label="$t('common.Files')"
                       align="left"
                       min-width="500" />
      <el-table-column :label="$t('common.Action')"
                       #default="{ row }"
                       align="center">
        <template>
          <i class="fa fa-trash pointer fs-18"
             v-tooltip="'Delete'"
             @click="remove(row)" />
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>
<script>
import { PackageApi } from "@/apis";
import { $loading, $modal } from "@/services";
import Upload from "./upload";
export default {
  data() {
    return {
      list: [],
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.list = [];
      const {
        data: { entity },
      } = await PackageApi.getList();
      this.list = entity;
    },
    async chooseFile() {
      await $modal({
        props: {
          title: this.$t('common.Upload File'),
          width: "650px",
          cancelText: this.$t('common.Cancel'),
          okText: this.$t('common.Upload'),
        },
        component: Upload,
      });
      this.fetchData();
    },
    async remove(item) {
      await this.$confirm("Confirm whether to delete ?", "Tip", {
        confirmButtonText: this.$t('common.Delete'),
        cancelButtonText: this.$t('common.Cancel'),
        text: "warning",
      });
      await PackageApi.deletePackage({ packageVersion: item.version });
      this.$message.success(`${item.version} ${this.$t('common.Version')} ${this.$t('common.Delete')} ${this.$t('common.Success')}`);
      this.fetchData();
    },
  },
};
</script>

<style></style>
