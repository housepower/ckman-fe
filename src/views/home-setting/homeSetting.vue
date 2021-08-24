<template>
  <main class="home-package">
    <breadcrumb :data="['package']"></breadcrumb>
    <section class="rpms">
      <el-divider content-position="left">{{$t('homePackage.ClickHouse RPMs')}}</el-divider>
      <rpm-list />
    </section>
  </main>
</template>
<script>
import RpmList from "./component/rpms";

export default {
    name: "homePackage",
  data() {
    return {
      formModel: {},
    };
  },
  components: {
    RpmList,
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
