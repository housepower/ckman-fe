<template>
  <section class="pkg-upload">
    <el-upload
      class="pkg-upload__dropzone"
      action="void"
      multiple
      drag
      :auto-upload="false"
      :file-list="fileList"
      :on-change="changeFile"
      :on-remove="removeFile"
      accept=".rpm, .deb, .tgz"
    >
      <i class="el-icon-upload pkg-upload__icon" />
      <div class="pkg-upload__hint">
        {{ $t('homePackage.Upload Packages') }}
      </div>
      <div class="pkg-upload__tip">
        .rpm / .deb / .tgz
      </div>
    </el-upload>
    <el-progress
      v-if="uploadPercent > 0"
      class="pkg-upload__progress"
      :text-inside="true"
      :stroke-width="16"
      :percentage="uploadPercent"
    />
  </section>
</template>

<script>
import { PackageApi } from '@/apis';

export default {
  data() {
    return {
      fileList: [],
      uploadPercent: 0,
    };
  },
  methods: {
    changeFile(_file, fileList) {
      this.fileList = fileList;
    },
    removeFile(_file, fileList) {
      this.fileList = fileList;
    },
    async onOk() {
      if (this.fileList.length === 0) {
        this.$message.warning(this.$t('common.Please select file'));
        return Promise.reject();
      }
      const tasks = this.fileList.map((file) => {
        const formData = new FormData();
        formData.append('package', file.raw);
        return PackageApi.upload(formData, {
          onUploadProgress: (progressEvent) => {
            this.uploadPercent =
              Math.floor((progressEvent.loaded / progressEvent.total) * 100) | 0;
          },
        });
      });
      await Promise.all(tasks);
      this.$message.success(this.$t('common.Upload Success'));
    },
  },
};
</script>

<style lang="scss" scoped>
.pkg-upload {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);

  &__dropzone ::v-deep .el-upload {
    width: 100%;
  }

  &__dropzone ::v-deep .el-upload-dragger {
    width: 100%;
    background: var(--c-surface-0);
    border: 1px dashed var(--c-surface-3);
    border-radius: var(--r-md);

    &:hover {
      border-color: var(--c-primary-solid);
    }
  }

  &__icon {
    font-size: 48px;
    color: var(--c-text-tertiary);
    margin: var(--s-4) 0 var(--s-2);
  }

  &__hint {
    font-size: var(--fs-md);
    color: var(--c-text-primary);
    font-weight: var(--fw-medium);
  }

  &__tip {
    margin-top: var(--s-1);
    font-family: var(--f-mono);
    font-size: var(--fs-xs);
    color: var(--c-text-tertiary);
  }

  &__progress ::v-deep .el-progress-bar__inner {
    background: var(--c-primary-solid);
  }
}
</style>
