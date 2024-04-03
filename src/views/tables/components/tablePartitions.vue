<template>
  <div>
    <el-table
      :data="list"
      style="width: 100%;"
      height="500">
      <el-table-column
        fixed="left"
        prop="name"
        :label="$t('tables.Partition')">
      </el-table-column>
      <el-table-column
        prop="parts"
        :label="$t('tables.Parts')">
      </el-table-column>
      <el-table-column
        prop="rows"
        :label="$t('tables.Rows')">
      </el-table-column>
      <el-table-column
        prop="uncompressed"
        :label="$t('tables.UnCompressed')">
        <template slot-scope="{ row }">
          {{byteConvert(row.uncompressed)}}
        </template>
      </el-table-column>
      <el-table-column
        prop="compressed"
        :label="$t('tables.Compressed')">
        <template slot-scope="{ row }">
          {{byteConvert(row.compressed)}}
        </template>
      </el-table-column>
      <el-table-column
        prop="min_time"
        :label="$t('tables.Min Time')">
      </el-table-column>
      <el-table-column
        prop="max_time"
        :label="$t('tables.Max Time')">
      </el-table-column>
      <el-table-column
        prop="disk_name"
        :label="$t('tables.Disk Name')">
      </el-table-column>
      <el-table-column
        fixed="right"
        align="center"
        prop=""
        :label="$t('tables.Action')">
        <template slot-scope="{ row }">
          <el-button type="text" @click="deleteItem(row)">{{$t('tables.Delete')}}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts">
import { TablesApi } from '@/apis';
import { byteConvert, percentiles } from '@/helpers/';
import moment from 'moment';
interface Partition {
  name: string;
  database: string;
  table: string;
  rows: Number | string;
  compressed: Number;
  uncompressed: Number;
  min_time: string;
  max_time: string;
  disk_name: string;
}
export default {
  props: {
    tableName: String,
    clusterName: String,
  },
  data() {
    return {
      list: [],
    };
  },
  created() {
    this.getList();
  },
  methods: {
    byteConvert,
    async getList() {
      const { clusterName, tableName } = this;
      const { data: { entity } } = await TablesApi.getPartitions(clusterName, tableName);
      
      this.list = (Object.freeze(Object.entries(entity)||[])).map(([key, values]: [string, Partition]) => {
        values.max_time = moment(values.max_time).format('YYYY-MM-DD HH:mm:SS');
        values.min_time = moment(values.min_time).format('YYYY-MM-DD HH:mm:SS');
        values.rows = values.rows.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); // 加入数字千分位分隔符
        values.name = key;
        return values;
      });
      this.list.sort(function (a, b) {
        return b.name - a.name;
      })
    },
    async deleteItem(row) {
      await this.$confirm(this.$t("common.Confirm Delete"), this.$t("common.tips"), {
        confirmButtonText: this.$t("common.Delete"),
        cancelButtonText: this.$t("common.Cancel"),
        text: "warning",
      });
      const { clusterName } = this;
      const { min_time, table, database } = row;
      const start = moment(min_time);
      await TablesApi.deletePartition(clusterName, {
        database,
        tables: [table],
        begin: start.format('YYYY-MM-DD'),
        end: start.add(1, 'day').format('YYYY-MM-DD'),
      });

      this.getList();
    }
  },
}
</script>

<style>

</style>