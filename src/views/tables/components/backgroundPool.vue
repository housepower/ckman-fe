<template>
  <div class="backgroundPool pb-20">
    <div class="title flex flex-between flex-vcenter ptb-10">
      <span class="fs-20 font-bold">{{ $t('tables.Background Pool') }}</span>
      <el-select v-model="selectedHost" placeholder="select host" class="host-select"
        @change="handleHostChange">
        <el-option v-for="server in tableData" :key="server.host" :label="server.host" :value="server.host" />
      </el-select>
    </div>

    <!-- 单个主机展示 -->
    <div v-if="currentServer" class="server-container mb-30">
      <div class="pool-grid">
        <div v-for="(pool, name) in currentServer.background_pool" :key="name" class="pool-item">
          <el-progress 
            type="circle" 
            :percentage="Math.round(pool.usage * 100)" 
            :color="getProgressColor(pool.usage * 100)" 
            :width="120"
            :stroke-width="8">
            <template #default="{ percentage }">
              <div class="progress-content">
                <span class="progress-value">{{ percentage }}%</span>
                <span class="progress-task">{{ pool.task }}/{{ pool.size }}</span>
              </div>
            </template>
          </el-progress>
          <div class="pool-name">{{ name }}</div>
        </div>
      </div>
    </div>

    <!-- 空数据提示 -->
    <el-empty v-else-if="!currentServer && tableData.length > 0" :description="$t('common.No Data')" />
  </div>
</template>

<script>
import { TablesApi } from "@/apis";

export default {
  name: 'BackgroundPool',
  data() {
    return {
      tableData: [],
      selectedHost: '',
      currentServer: null,
      // 优化后的颜色配置 - 更符合监控场景的颜色阈值
      progressColors: [
        { color: '#67C23A', percentage: 50 },   // 绿色：0-50%
        { color: '#E6A23C', percentage: 70 },   // 橙色：50-70%
        { color: '#F56C6C', percentage: 85 },   // 红色：70-85%
        { color: '#C0392B', percentage: 100 }  // 深红：85-100%
      ]
    };
  },
  watch: {
    tableData: {
      immediate: true,
      handler(newVal) {
        if (newVal && newVal.length > 0) {
          this.selectedHost = newVal[0].host;
          this.currentServer = newVal[0];
        } else {
          this.currentServer = null;
        }
      }
    }
  },
  computed: {
    // 保留原配置用于兼容，同时提供新的动态颜色方法
    customColors() {
      return this.progressColors;
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    handleHostChange(host) {
      this.currentServer = this.tableData.find(
        server => server.host === host
      );
    },
    async fetchData() {
      try {
        const {
          data: { entity },
        } = await TablesApi.backgroundpool(this.$route.params.id);
        this.tableData = entity || [];
      } catch (error) {
        console.error('Failed to fetch background pool data:', error);
        this.tableData = [];
      }
    },
    // 根据百分比获取对应的颜色
    getProgressColor(percentage) {
      const roundedPercentage = Math.round(percentage);
      for (const item of this.progressColors) {
        if (roundedPercentage <= item.percentage) {
          return item.color;
        }
      }
      return this.progressColors[this.progressColors.length - 1].color;
    }
  },
};
</script>

<style lang="scss" scoped>
.backgroundPool {
  padding: 20px;
}

.server-container {
  padding: 24px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  }
}

.pool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 30px;
  justify-items: center;
}

.pool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  transition: transform 0.2s ease, background-color 0.2s ease;
  cursor: default;

  &:hover {
    transform: translateY(-4px);
    background-color: rgba(64, 158, 255, 0.04);
  }
}

.progress-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.4;
}

.progress-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.progress-task {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.pool-name {
  margin-top: 16px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  text-align: center;
  word-break: break-word;
}

.host-select {
  width: 240px;
  margin-left: 20px;
}

// 响应式适配
@media (max-width: 768px) {
  .pool-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 20px;
  }

  .host-select {
    width: 180px;
    margin-left: 12px;
  }
}
</style>
