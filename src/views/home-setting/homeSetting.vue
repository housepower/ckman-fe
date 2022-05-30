<template>
  <main class="home-package">
    <breadcrumb :data="['package']"></breadcrumb>
    <section class="pkgs">
      <el-divider content-position="left">{{$t('homePackage.ClickHouse Packages')}}</el-divider>
      <pkg-list />
    </section>
  </main>
</template>
<script>
import PkgList from "./component/pkgs";

export default {
    name: "homePackage",
  data() {
    return {
      formModel: {},
    };
  },
  components: {
    PkgList,
  },
};
</script>

<style lang="scss" scoped>
.home-package {
  .ml-360 {
    margin-left: 360px;
  }
}
</style>
