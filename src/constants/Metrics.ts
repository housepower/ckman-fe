export const Metrics = Object.freeze([
  {
    title: 'ClickHouse Table KPIs',
    metrics: [{
      expect: 'clickhouse Query',
      metric: 'ClickHouseMetrics_Query{instance=~"{{.hosts}}"}',
    }],
  },{
    title: 'ClickHouse Node KPIs',
    metrics: [{
      expect: 'cpu usage',
      metric: '100 * (1 - sum(increase(node_cpu_seconds_total{mode="idle",instance=~"{{.hosts}}"}[1m])) by (instance) / sum(increase(node_cpu_seconds_total{instance=~"{{.hosts}}"}[1m])) by (instance))',
    },{
      expect: 'memory usage',
      metric: '100 * (1 - (node_memory_MemFree_bytes{instance=~"{{.hosts}}"}+node_memory_Buffers_bytes{instance=~"{{.hosts}}"}+node_memory_Cached_bytes{instance=~"{{.hosts}}"})/node_memory_MemTotal_bytes{instance=~"{{.hosts}}"})',
    },{
      expect: 'disk usage',
      metric: '100 * (1 - node_filesystem_avail_bytes{fstype !~"tmpfs",instance=~"{{.hosts}}"} / node_filesystem_size_bytes{fstype !~"tmpfs",instance=~"{{.hosts}}"})',
    },{
      expect: 'IOPS',
      metric: 'irate(node_disk_writes_completed_total{instance=~"{{.hosts}}"}[1m])+irate(node_disk_reads_completed_total{instance=~"{{.hosts}}"}[1m])',
    }],
  },{
    title: 'ZooKeeper KPIs',
    metrics: [{
      expect: 'znode_count',
      metric: 'znode_count{instance=~"{{.hosts}}"}',
    },{
      expect: 'leader_uptime',
      metric: 'increase(leader_uptime{instance=~"{{.hosts}}"}[1m])',
    },{
      expect: 'stale_sessions_expired',
      metric: 'stale_sessions_expired{instance=~"{{.hosts}}"}',
    },{
      expect: 'jvm_gc_collection_seconds_count',
      metric: 'jvm_gc_collection_seconds_count{instance=~"{{.hosts}}"}',
    },{
      expect: 'jvm_gc_collection_seconds_sum',
      metric: 'jvm_gc_collection_seconds_sum{instance=~"{{.hosts}}"}',
    }],
  },
]);

export const LoaderMetrics = Object.freeze([
  {
    title: 'Clickhouse Sinker KPIs',
    metrics: [
      {
        expect: 'rate clickhouse_sinker_consume_msgs_total 1m',
        metric: 'sum(rate(clickhouse_sinker_consume_msgs_total[1m])) by(job,task)',
      },{
        expect: 'rate clickhouse_sinker_flush_msgs_total 1m',
        metric: 'sum(rate(clickhouse_sinker_flush_msgs_total[1m])) by(job,task)',
      },{
        expect: 'rate clickhouse_sinker_shard_msgs 1m',
        metric: 'sum(clickhouse_sinker_shard_msgs) by(job,task)',
      },{
        expect: 'rate clickhouse_sinker_ring_msgs 1m',
        metric: 'sum(clickhouse_sinker_ring_msgs) by(job,task)',
      },{
        expect: 'rate clickhouse_sinker_parsing_pool_backlog 1m',
        metric: 'sum(clickhouse_sinker_parsing_pool_backlog) by(job,task)',
      },{
        expect: 'rate clickhouse_sinker_writing_pool_backlog 1m',
        metric: 'sum(clickhouse_sinker_writing_pool_backlog) by(job,task)',
      },
    ],
  },
]);


