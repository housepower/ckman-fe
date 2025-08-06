<template>
  <div class="import-container">
    <el-form ref="importForm" :model="form" :rules="rules" label-width="120px" label-position="right">
      <!-- 数据源选择 -->
      <el-form-item label="数据源" prop="source_type">
        <el-select v-model="form.source_type" placeholder="请选择数据源">
          <el-option label="本地上传" value="local"></el-option>
          <el-option label="远程路径" value="remote"></el-option>
        </el-select>
      </el-form-item>

      <!-- 文件路径输入 -->
      <el-form-item label="文件路径" prop="source_path">
        <!-- 本地上传模式 -->
        <div v-if="form.source_type === 'local'">
          <el-upload class="upload-demo" action="" :auto-upload="false" :on-change="handleFileChange"
            :show-file-list="false">
            <el-button size="small" type="primary">选择文件</el-button>
            <span v-if="form.source_path" style="margin-left: 10px;">{{ form.source_path }}</span>
          </el-upload>
        </div>

        <!-- 远程路径模式 -->
        <el-input v-else v-model="form.source_path" placeholder="请输入远程文件路径 (如: /path/to/data.csv)"></el-input>
      </el-form-item>

      <!-- 文件格式选择 -->
      <el-form-item label="文件格式" prop="format">
        <el-radio-group v-model="form.format">
          <el-radio-button label="csv" value="csv" />
          <el-radio-button label="parquet" value="parquet" />
          <el-radio-button label="orc" value="orc" />
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="form.format === 'csv'" label="包含表头" prop="withHeader">
        <el-switch v-model="form.withHeader"></el-switch>
      </el-form-item>

      <!-- 分隔符选择 (仅当文件格式为CSV时显示) -->
      <el-form-item v-if="form.format === 'csv'" label="分隔符" prop="delimiter">
        <el-select v-model="form.delimiter" placeholder="请选择分隔符">
          <el-option label="竖线 (|)" value="|"></el-option>
          <el-option label="制表符 (\t)" value="\t"></el-option>
          <el-option label="逗号 (,)" value=","></el-option>
        </el-select>
      </el-form-item>

      <!-- 目标表输入 -->
      <el-form-item label="目标表" prop="table">
        <el-input v-model="form.table" placeholder="请输入目标表名(如：database.table)"></el-input>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button upload-demo @click="handleImport">一键导入</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
  
<script>

import { DataManageApi } from '@/apis';
export default {
  name: 'ImportComponent',
  data() {
    return {
      form: {
        source_type: 'local', // 默认本地上传
        source_path: '',        // 远程文件路径
        file: null,          // 上传的文件对象
        format: 'csv',   // 默认CSV格式
        withHeader: false,    // 默认包含表头
        delimiter: ',',      // 默认逗号分隔符
        table: ''      // 目标表名
      },
      rules: {
        source_type: [{ required: true, message: '请选择数据源', trigger: 'change' }],
        source_path: [{ required: true, message: '请选择文件或输入路径', trigger: 'blur' }],
        format: [{ required: true, message: '请选择文件格式', trigger: 'change' }],
        delimiter: [{ required: true, message: '请选择分隔符', trigger: 'change' }],
        table: [{ required: true, message: '请输入目标表名', trigger: 'blur' }]
      }
    };
  },
  methods: {
    // 处理文件选择变化
    handleFileChange(file) {
      this.form.source_path = file.name;
      this.form.file = file.raw;
    },

    // 一键导入
    async handleImport() {
      this.$refs.importForm.validate(async valid => {
        if (valid) {
          // 创建FormData对象
          const formData = new FormData();

          // 添加基本表单数据
          formData.append('source_type', this.form.source_type);
          formData.append('format', this.form.format);
          formData.append('table', this.form.table);

          // 根据数据源类型添加文件数据
          if (this.form.sourceType === 'local' && this.form.file) {
            formData.append('sourceData', this.form.file);
            formData.append('source_path', this.form.source_path);
          } else if (this.form.sourceType === 'remote') {
            formData.append('source_path', this.form.source_path);
          }

          // 添加CSV分隔符（如果适用）
          if (this.form.fileFormat === 'csv') {
            formData.append('delimiter', this.form.delimiter);
            formData.append('withHeader', this.form.withHeader);
          }

          await DataManageApi.importData(this.$route.params.id, formData);
        } else {
          this.$message.error('请填写完整表单');
          return false;
        }
      });
    },

    // 重置表单
    resetForm() {
      this.$refs.importForm.resetFields();
      this.form.fileName = '';
      this.form.file = null;
      this.$message.info('表单已重置');
    }
  }
};
</script>

<style scoped>
.import-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 调整表单元素间距 */
.el-form-item {
  margin-bottom: 22px;
}

/* 上传按钮样式 */
.upload-demo {
  display: flex;
  align-items: center;
}
</style>