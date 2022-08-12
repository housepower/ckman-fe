<template>
  <main class="settings">
    <breadcrumb :data="['Clusters', $route.params.id, 'session']"></breadcrumb>
    <section class="container">
      <div class="total flex flex-end pb-10 flex-vcenter">
        <!-- <div class="left flex-column flex-center ml-30">
          <span class="fs-28 font-bold">36</span>
          <span class="fs-18 font-bold">Total Open Sessions</span>
        </div> -->
      </div>
      <div class="tables">
        <h3 class="mb-10">{{$t('session.Open Sessions')}}</h3>
        <session-table :list="openList" :clusterName="id" type="open" />
        <div class="mb-10 mt-50" style="overflow: hidden;">
          <div class="fs-18 font-bold pull-left">{{$t('session.Slow Sessions')}}</div>
          <div class="pull-right">
            <time-filter v-model="timeFilter"
              :refreshDuration.sync="refresh"
              localKey="sessionTimeFilter"
              @input="timeFilterChange"
              @on-refresh="timeFilterRefresh" />
            <label class="ml-20">{{$t('session.Limit Count')}}</label>
            <el-input-number class="ml-10" placeholder="查询条数" @change="timeFilterRefresh" v-model="limit" size="small" :min="5" style="width:100px;"/>
          </div>
        </div>
        <session-table :list="closeList" :clusterName="id" type="close" />
      </div>
    </section>
  </main>
</template>
<script>
import SessionTable from "./component/sessionTable";
import { SessionApi } from "@/apis";
import { convertTimeBounds } from "@/helpers";
export default {
  data() {
    return {
      id: '',
      refresh: null,
      openList: [],
      closeList: [],
      timeFilter: ["now-7d", "now"],
      limit: 10,
    };
  },
  created() {
    this.id = this.$route.params.id;
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      const { id } = this;
      const {
        data: { entity: openList },
      } = await SessionApi.open(id);
      
      this.openList = openList;

      this.getSlowSessionList();
    },
    async getSlowSessionList() {
      const { min, max } = convertTimeBounds(this.timeFilter);
      const { limit, id } = this;
      const {
        data: { entity: closeList },
      } = await SessionApi.close(id, {
        limit,
        start: parseInt(min / 1000),
        end: parseInt(max / 1000),
      });
      this.closeList = closeList;
    },
    timeFilterRefresh() {
      this.getSlowSessionList();
    },
    timeFilterChange() {
      this.getSlowSessionList();
    }
  },
  components: { SessionTable },
};
</script>

<style lang="scss" scoped>
.total {
  // border-bottom: 1px solid #eaeef4;
}
</style>
