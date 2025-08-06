<template>
  <div class="migration-container">
    <el-card shadow="hover" class="coming-soon-card">
      <div class="content-wrapper">
        <h2 class="title">{{ $t('dataManage.Coming Soon') }}</h2>
        <p class="description">{{ $t('migration.Feature Description') }}</p>
        
        <ul class="feature-list">
          <li>{{ $t('migration.Cross-cluster Migration') }}</li>
          <li>{{ $t('migration.Heterogeneous Migration') }}</li>
          <li>{{ $t('migration.Migration Monitoring') }}</li>
          <li>{{ $t('migration.Task Scheduling') }}</li>
        </ul>
      </div>
    </el-card>
    
    <div class="contact-info">
      <p>{{ $t('migration.Any Questions') }}<el-link type="primary" href="mailto:chenyanchang1990@163.com">{{ $t('migration.Contact Us') }}</el-link></p>
    </div>
  </div>
</template>


<style scoped>
.migration-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 80vh;
  padding: 20px;
}

.coming-soon-card {
  width: 100%;
  max-width: 700px;
  border-radius: 12px;
  background-color: #f8fbff;
  border: 1px solid #e6f7ff;
}

.content-wrapper {
  text-align: center;
  padding: 30px;
}

.icon-wrapper {
  margin-bottom: 20px;
}

.title {
  color: #303133;
  font-size: 24px;
  margin-bottom: 20px;
}

.description {
  color: #606266;
  font-size: 16px;
  margin-bottom: 25px;
}

.feature-list {
  text-align: left;
  max-width: 400px;
  margin: 0 auto 25px;
  padding-left: 20px;
}

.feature-list li {
  margin-bottom: 12px;
  color: #606266;
  font-size: 15px;
}

.progress-wrapper {
  margin: 30px auto;
  max-width: 400px;
}

.progress-text {
  margin-top: 8px;
  color: #67C23A;
  font-weight: 500;
}

.subscribe-text {
  color: #606266;
  margin: 25px 0 15px;
  font-size: 15px;
}

.subscribe-form {
  display: flex;
  justify-content: center;
}

.contact-info {
  margin-top: 30px;
  color: #909399;
  font-size: 14px;
}

@media (max-width: 768px) {
  .coming-soon-card {
    width: 95%;
  }
  
  .subscribe-form :deep(.el-input) {
    width: 100% !important;
  }
}
</style>