<template>
  <main class="home-package">
    <PageHeader
      :crumb="[$t('layout.ClickHouse Management Console')]"
      :title="$t('homePackage.ClickHouse Packages')"
    >
      <template #actions>
        <el-button type="primary" size="small" icon="el-icon-upload2" @click="$refs.pkgList.chooseFile()">
          {{ $t('homePackage.Upload Packages') }}
        </el-button>
      </template>
    </PageHeader>
    <pkg-list ref="pkgList" />
  </main>
</template>

<script>
import PkgList from './component/pkgs';

export default {
  name: 'homePackage',
  components: { PkgList },
};
</script>

<style lang="scss" scoped>
.home-package {
  padding-bottom: var(--s-8);
}
</style>
