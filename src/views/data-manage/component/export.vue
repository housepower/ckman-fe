<template>
  <div class="export-container">
    <el-form ref="exportForm" :model="form" :rules="rules" label-width="120px" label-position="right">
      <!-- 表名输入 -->
      <el-form-item label="表名" prop="tableName">
        <el-input v-model="form.tableName" placeholder="请输入要导出的表名" @change="updateFileName"></el-input>
      </el-form-item>

      <!-- 数据过滤方式 -->
      <el-form-item label="数据过滤" prop="filterType">
        <el-radio-group v-model="form.filterType" @change="handleFilterChange">
          <el-radio-button label="partition">分区</el-radio-button>
          <el-radio-button label="sql">SQL</el-radio-button>
          <el-radio-button label="all">全部数据</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 分区选择 (当选择分区时显示) -->
      <el-form-item v-if="form.filterType === 'partition'" label="分区名" prop="partitions">
        <el-select v-model="form.partitions" multiple placeholder="请选择分区" style="width: 100%;">
          <el-option v-for="partition in availablePartitions" :key="partition" :label="partition"
            :value="partition"></el-option>
        </el-select>
      </el-form-item>

      <!-- SQL编辑器 (当选择SQL时显示) -->
      <el-form-item v-if="form.filterType === 'sql'" label="SQL查询" prop="sqlQuery">
        <el-input type="textarea" v-model="form.sqlQuery" :autosize="{ minRows: 4, maxRows: 8 }"
          placeholder="请输入SQL查询语句 (如: SELECT * FROM table WHERE condition)"></el-input>
        <div style="margin-top: 10px; text-align: right;">
          <el-button size="small" type="primary" @click="previewQuery">查询预览</el-button>
        </div>
      </el-form-item>

      <!-- 导出格式选择 -->
      <el-form-item label="导出格式" prop="exportFormat">
        <el-radio-group v-model="form.exportFormat" @change="updateFileName">
          <el-radio-button label="csv">CSV</el-radio-button>
          <el-radio-button label="parquet">Parquet</el-radio-button>
          <el-radio-button label="orc">ORC</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 分隔符选择 (仅当导出格式为CSV时显示) -->
      <el-form-item v-if="form.exportFormat === 'csv'" label="分隔符" prop="delimiter">
          <el-select v-model="form.delimiter" placeholder="请选择分隔符">
            <el-option label="竖线 (|)" value="|"></el-option>
            <el-option label="制表符 (\t)" value="\t"></el-option>
            <el-option label="逗号 (,)" value=","></el-option>
          </el-select>
        </el-form-item>

      <!-- 文件路径输入 -->
      <el-form-item label="文件目录" prop="filePath" required>
        <el-input v-model="form.filePath" placeholder="请输入完整文件路径 (如: /tmp/export/)"></el-input>
      </el-form-item>
      <el-form-item label="文件名" prop="fileName">
        <el-input v-model="form.fileName" placeholder="自动生成的文件名" readonly>
        </el-input>
      </el-form-item>
      <!-- 操作按钮 -->
      <el-form-item>
        <el-button type="primary" @click="handleExport">一键导出</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'ExportComponent',
  data() {
    return {
      form: {
        tableName: '',
        filterType: 'all',
        partitions: [],
        sqlQuery: '',
        exportFormat: 'csv',
        delimiter: ',',
        fileName: ''
      },
      // 示例分区数据，实际应用中应从API获取
      availablePartitions: ['2023-01', '2023-02', '2023-03', '2023-04', '2023-05'],
      rules: {
        tableName: [
          { required: true, message: '请输入表名', trigger: 'blur' }
        ],
        partitions: [
          {
            required: true,
            message: '请至少选择一个分区',
            trigger: 'change',
            validator: (rule, value, callback) => {
              if (this.form.filterType === 'partition' && value.length === 0) {
                callback(new Error('请至少选择一个分区'));
              } else {
                callback();
              }
            }
          }
        ],
        sqlQuery: [
          {
            required: true,
            message: '请输入SQL查询语句',
            trigger: 'blur',
            validator: (rule, value, callback) => {
              if (this.form.filterType === 'sql' && !value.trim()) {
                callback(new Error('请输入SQL查询语句'));
              } else {
                callback();
              }
            }
          }
        ],
        exportFormat: [
          { required: true, message: '请选择导出格式', trigger: 'change' }
        ],
        fileName: [
          { required: true, message: '请输入文件名', trigger: 'blur' }
        ]
      }
    };
  },
  methods: {
    // 处理过滤类型变化
    handleFilterChange(value) {
      if (value !== 'partition') this.form.partitions = [];
      if (value !== 'sql') this.form.sqlQuery = '';
    },

    // 更新文件名
    updateFileName() {
      if (this.form.tableName) {
        const tableParts = this.form.tableName.split('.');
        const dbName = tableParts.length > 1 ? tableParts[0] : 'default';
        const tableName = tableParts.length > 1 ? tableParts[1] : tableParts[0];

        this.form.fileName = `${dbName}.${tableName}.${this.form.exportFormat}`;
      }
    },

    // 查询预览
    previewQuery() {
      if (!this.form.sqlQuery.trim()) {
        this.$message.warning('请输入SQL查询语句');
        return;
      }

      this.$refs.exportForm.validateField('sqlQuery', (valid) => {
        if (!valid) {
          console.log('执行预览查询:', this.form.sqlQuery);
          // 这里可以调用API进行查询预览
          this.$message.success('查询预览请求已发送');
        }
      });
    },

    // 一键导出
    handleExport() {
      this.$refs.exportForm.validate(valid => {
        if (valid) {
          console.log('导出数据:', this.form);
          // 这里可以调用API进行数据导出

          // 构造导出参数
          const exportParams = {
            table: this.form.tableName,
            filter: this.form.filterType,
            format: this.form.exportFormat,
            file: `/tmp/${this.form.fileName}`
          };

          if (this.form.filterType === 'partition') {
            exportParams.partitions = this.form.partitions;
          } else if (this.form.filterType === 'sql') {
            exportParams.query = this.form.sqlQuery;
          }

          if (this.form.exportFormat === 'csv') {
            exportParams.delimiter = this.form.delimiter;
          }

          console.log('导出参数:', exportParams);
          this.$message.success('导出请求已发送');
        } else {
          this.$message.error('请填写完整表单');
          return false;
        }
      });
    },

    // 重置表单
    resetForm() {
      this.$refs.exportForm.resetFields();
      this.form.partitions = [];
      this.form.sqlQuery = '';
      this.$message.info('表单已重置');
    }
  }
};
</script>

<style scoped>
.export-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 调整表单元素间距 */
.el-form-item {
  margin-bottom: 22px;
}

/* 分区选择器样式 */
.el-select {
  width: 100%;
}

/* SQL编辑器样式 */
.el-textarea {
  font-family: monospace;
}
</style>