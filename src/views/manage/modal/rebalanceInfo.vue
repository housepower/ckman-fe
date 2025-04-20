<template>
    <div>
      <el-table
        :data="list"
        style="width: 100%;"
        height="500">
        <el-table-column
          fixed="left"
          prop="table"
          :label="$t('common.Table Name')">
        </el-table-column>
        <el-table-column
          prop="host"
          :label="$t('manage.Node IP')">
        </el-table-column>
        <el-table-column
          prop="shard_num"
          :label="$t('manage.shard number')">
        </el-table-column>
        <el-table-column
          prop="rows"
          :label="$t('tables.Rows')">
        </el-table-column>
        <el-table-column
          prop="size"
          :label="$t('tables.UnCompressed')">
        </el-table-column>
      </el-table>
    </div>
  </template>
  
  <script lang="ts">
  import { ClusterApi } from '@/apis';
  import { DForm } from '@/components/';
import { it } from 'date-fns/locale';
  interface RebalanceInfo {
    database: string;
    table: string;
    host: string;
    shard_num: Number;
    rows: Number | string;
    size: Number;
  }
  export default {
    props: {
      clusterName: String,
      schemaValue: Object,
    },
    data() {
      return {
        list: [] as RebalanceInfo[],
      };
    },
    created() {
      this.getList();
    },
    methods: {
      async getList() {
        const { clusterName, schemaValue } = this;
        const { data: { entity } } = await ClusterApi.rebalanceInfo({
          clusterName,
          params: schemaValue,
        });

        if (!entity) {
            return;
        }

        entity.forEach((item: RebalanceInfo) => {
          item.table = `${item.database}.${item.table}`;
          item.rows = item.rows.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          this.list.push(item);
        })
    }
  }
}
  </script>
  
  <style>
  
  </style>