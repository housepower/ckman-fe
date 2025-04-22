<template>
  <div>
    <el-table
      :data="list"
      style="width: 100%;"
      height="500">
      <el-table-column
        prop="create_time"
        width="150"
        :label="$t('queryExecution.CreateTime')">
      </el-table-column>
      <el-table-column
        fixed="left"
        prop="node_name"
        width="140"
        :label="$t('tables.Node Name')">
      </el-table-column>
      <el-table-column
        prop="type"
        width="135"
        :label="$t('tables.Type')">
      </el-table-column>
      <el-table-column
        prop="num_tries"
        :label="$t('tables.Num Tries')">
      </el-table-column>
      <el-table-column
        show-overflow-tooltip
        prop="postpone_reason"
        :label="$t('tables.Postpone Reason')">
        <template #default="{ row}">
          <span @dblclick=onCopy(row.postpone_reason)>{{ row.postpone_reason }}</span>
        </template>
      </el-table-column>
      <el-table-column
        show-overflow-tooltip
        prop="last_exception"
        :label="$t('tables.Exception')">
        <template #default="{ row}">
          <span @dblclick=onCopy(row.last_exception)>{{ row.last_exception }}</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts">
import { TablesApi } from '@/apis';
import moment from 'moment';
interface QueueInfo {
  create_time: string;
  node_name: string;
  type: string;
  num_tries: Number | String;
  postpone_reason: String;
  last_exception: String;
}
export default {
  props: {
    table: String,
    clusterName: String,
    node: String,
    last_exception: String,
  },
  data() {
    return {
      list: [] as QueueInfo[],
    };
  },
  created() {
    this.getList();
  },
  methods: {

    async getList() {
      const { clusterName, table, node, last_exception } = this;
      const { data: { entity } } = await TablesApi.replicatedQueue(clusterName, table, node);
      
      if (!entity) {
        return;
      }

      entity.forEach((item: QueueInfo) => {
          item.create_time = moment(item.create_time).format('YYYY-MM-DD HH:mm:ss');
          item.num_tries = item.num_tries.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          //如果last_exception为""，则显示为props中的last_exception
          if (item.last_exception === "") {
            item.last_exception = last_exception; 
          }
          this.list.push(item);
        })
      this.list.sort(function (a, b) {
        return moment(b.create_time).unix() - moment(a.create_time).unix();
      })
    },
    onCopy(str) {
      try {
        let input = document.createElement('textarea');
        input.value = str;
        input.style.border = '0';
        input.style.padding = '0';
        input.style.margin  = '0';
        input.style.right = '999999em';
        input.style.position = 'absolute';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        this.$message.success(this.$t('queryExecution.Copy Success'));
        input = null;
      } catch (e) {
        //
      }
    },
  },
}
</script>

<style>

</style>