<template>
  <div class="backgroundPool pb-20">
    <div class="title flex flex-between flex-vcenter ptb-10">
      <span class="fs-20 font-bold">{{ $t('tables.Background Pool') }}</span>
      <el-select v-model="selectedHost" placeholder="select host" class="host-select"
        @change="handleHostChange">
        <el-option v-for="server in tableData" :key="server.host" :label="server.host" :value="server.host" />
      </el-select>
    </div>

    <!-- 修改后的单个主机展示 -->
    <div v-if="currentServer" class="server-container mb-30">
      <div class="pool-grid">
        <div v-for="(pool, name) in currentServer.background_pool" :key="name" class="pool-item">
          <div class="pool-item">
            <el-progress 
              type="circle" 
              stroke-width="8" 
              :percentage="pool.usage * 100" :color="customColors" :width="120">
            </el-progress>
            <div class="pool-name">{{ name}} ({{ pool.task }} / {{ pool.size }})</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { TablesApi } from "@/apis";
export default {
  data() {
    return {
      tableData: [],
      selectedHost: '',
      currentServer: null // 新增当前选中主机数据
    };
  },
  watch: {
    tableData: {
      immediate: true,
      handler(newVal) {
        if (newVal.length > 0) {
          this.selectedHost = newVal[0].host
          this.currentServer = newVal[0]
        }
      }
    }
  },
  computed: {
    customColors() {
      return [
        { color: '#FFE37D', percentage: 30 },
        { color: '#FFD54F', percentage: 60 },
        { color: '#FF6B6B', percentage: 80 },
        { color: '#F56C6C', percentage: 100 }
      ];
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    handleHostChange(host) {
      this.currentServer = this.tableData.find(
        server => server.host === host
      )
    },
    async fetchData() {
      const {
        data: { entity },
      } = await TablesApi.backgroundpool(this.$route.params.id);
      this.tableData = entity;
    },
  },
};
</script>

<style lang="scss" scoped>
.server-container {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 20px;

  .host-title {
    color: #606266;
    margin-bottom: 15px;
  }
}

.pool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 50px;
}

.pool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 200px;
}

.pool-name {
  margin-top: 12px; // 调整与图表间距
  font-size: 14px;
  color: #606266;
  text-align: center;
  width: 100%;
  position: relative;
  padding: 0 8px;
}

.host-select {
  width: 240px;
  margin-left: 20px;
}
</style>
