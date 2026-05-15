<template>
  <section class="pkg-list">
    <el-table
      class="pkg-list__table"
      :data="list"
      :border="false"
      stripe
    >
      <el-table-column
        prop="version"
        show-overflow-tooltip
        :label="$t('common.Version')"
        align="left"
        min-width="180"
      />
      <el-table-column
        prop="pkgType"
        show-overflow-tooltip
        :label="$t('common.Package Type')"
        align="left"
        min-width="160"
      />
      <el-table-column
        prop="pkgName"
        show-overflow-tooltip
        :label="$t('common.Files')"
        align="left"
        min-width="500"
      >
        <template slot-scope="{ row }">
          <span class="pkg-list__file">{{ row.pkgName }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('common.Action')"
        align="right"
        width="100"
      >
        <template slot-scope="{ row }">
          <el-button
            type="text"
            size="small"
            class="pkg-list__delete"
            @click="remove(row)"
          >
            <i class="fa fa-trash" /> {{ $t('common.Delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script>
import { PackageApi } from '@/apis';
import { $modal } from '@/services';
import Upload from './upload';

export default {
  data() {
    return { list: [] };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.list = [];
      const { data: { entity } } = await PackageApi.getList('all');
      this.list = entity;
    },
    async chooseFile() {
      await $modal({
        props: {
          title: this.$t('common.Upload File'),
          width: '650px',
          cancelText: this.$t('common.Cancel'),
          okText: this.$t('common.Upload'),
        },
        component: Upload,
      });
      this.fetchData();
    },
    async remove(item) {
      await this.$confirm(this.$t('common.Confirm Delete'), this.$t('common.tips'), {
        confirmButtonText: this.$t('common.Delete'),
        cancelButtonText: this.$t('common.Cancel'),
        text: 'warning',
      });
      await PackageApi.deletePackage({ packageVersion: item.version, pkgType: item.pkgType });
      this.$message.success(
        `${item.version} ${this.$t('common.Version')} ${this.$t('common.Delete')} ${this.$t('common.Success')}`,
      );
      this.fetchData();
    },
  },
};
</script>

<style lang="scss" scoped>
.pkg-list {
  background: var(--c-surface-0);
  border: 1px solid var(--c-surface-3);
  border-radius: var(--r-lg);
  padding: var(--s-3);

  &__file {
    font-family: var(--f-mono);
    font-size: var(--fs-sm);
    color: var(--c-text-primary);
  }

  &__delete {
    color: var(--c-danger-fg) !important;

    &:hover {
      color: var(--c-danger-solid) !important;
    }

    i {
      margin-right: var(--s-1);
    }
  }
}
</style>
