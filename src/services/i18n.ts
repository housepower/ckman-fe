import Vue from 'vue';
import VueI18n from 'vue-i18n';
Vue.use(VueI18n);

const messages = {
  en: {
    common: {
      'Create': 'Create',
      'Confirm': 'Confirm',
      'Cancel': 'Cancel',
      'Import': 'Import',
      'Delete': 'Delete',
      'Logout': 'Logout',
      'placeholderIp': 'multiple IP, please comma-separated fill',
      'Requied': 'Can not be empty',
      'Clusters': 'Clusters',
      'overview': 'overview',
      'manage': 'manage',
      'tables': 'tables',
      'session': 'session',
      'query-execution': 'query-execution',
      'settings': 'settings',
      'Upgrade': 'Upgrade',
      'Add Node': 'Add Node',
      'Save': 'Save',
      'Table Name': 'Table Name',
      'Save Reboot': 'Save & Reboot',
      'Version': 'Version',
      'Files': 'Files',
      'Action': 'Action',
      'Upload File': 'Upload File',
      'tips': 'tips',
      'start': 'Confirm to start?',
      'stop': 'Confirm to stop?',
      'destroy': 'Confirm to destroy?',
      'rebalance': 'Confirm to rebalance?',
      'upgrade': 'upgrade',
    },
    layout: {
      'ClickHouse Management Console': 'ClickHouse Management Console',
    },
    home: {
      'Create or import a ClickHouse Cluster': 'Create or import a ClickHouse Cluster',
      'Create a ClickHouse Cluster': 'Create a ClickHouse Cluster',
      'Cluster Name': 'Cluster Name',
      'ClickHouse TCP Port': 'ClickHouse TCP Port',
      'ClickHouse Node List': 'ClickHouse Node List',
      'Replica': 'Replica',
      'Zookeeper Node List': 'Zookeeper Node List',
      'ZooKeeper Port': 'ZooKeeper Port',
      'ZK Status Port': 'ZK Status Port',
      'Data path': 'Data path',
      'Cluster Username': 'Cluster Username',
      'Cluster Password': 'Cluster Password',
      'SSH Username': 'SSH Username',
      'SSH Password': 'SSH Password',
      'Import a ClickHouse Cluster':'Import a ClickHouse Cluster',
      'Data Loader Management':'Data Loader Management',
      'All ClickHouse Clusters': 'All ClickHouse Clusters',
      'Mode': 'Mode',
      'ClickHouse Node IP': 'ClickHouse Node IP',
      'ClickHouse Node Count': 'ClickHouse Node Count',
      'Actions': 'Actions',
      'Go to cluster': 'Go to Cluster',
      'ClickHouse Version': 'ClickHouse Version',
      'Overview': 'OverView',
      'Manage': 'Manage',
      'Tables': 'Tables',
      'Session': 'Session',
      'Query Execution': 'Query Execution',
      'Settings': 'Settings',
    },
    manage: {
      'Upgrade Cluster': 'Upgrade Cluster',
      'Upgrade to': 'Upgrade to',
      'Node IP': 'Node IP',
      'Node Name': 'Node Name',
      'shard number': 'shard number',
      'replica number': 'replica number',
      'Node Status': 'Node Status' ,
      'Start Cluster': 'Start Cluste',
      'Stop Cluster': 'Stop Cluster',
      'Destroy Cluster': 'Destroy Cluster',
      'Rebalance Cluster': 'Rebalance Cluster',
      'New Node IP': 'New Node IP',
      'Node Shard': 'Node Shard',
    },
    tables: {
      'Table Metrics': 'Table Metrics',
      'Table Name': 'Table Name',
      'Columns': 'Columns',
      'Rows': 'Rows',
      'Parts': 'Parts',
      'Disk Space': 'Disk Space',
      'Completed Queries in last 24h': 'Completed Queries in last 24h',
      'Failed Queries in last 24h': 'Failed Queries in last 24h',
      'Last 7 days info': 'Queries cost(0.5,0.99,max)in last 7 days',
      'Table Replication Status': 'Table Replication Status',
      'Zookeeper Status': 'Zookeeper Status',
    },
    session: {
      'Open Sessions': 'Open Sessions',
      'Slow Sessions': 'Slow Sessions',
      'Query Start Time': 'Query Start Time',
      'Query Duration': 'Query Duration',
      'Query': 'Query',
      'Initial User': 'Initial User',
      'Initial Query ID': 'Initial Query ID',
      'Initial Address': 'Initial Address',
      'Thread Numbers': 'Thread Numbers',
    },
    queryExecution: {
      'Query History': 'Query History',
      'Execute Query': 'Execute Query',
    },
    homeSetting: {
      'Upload RPMs': 'Upload RPMs',
      'ClickHouse RPMs': 'ClickHouse RPMs',
    },
    ClickHouseEcharts: {
      'ClickHouse Table KPIs': 'ClickHouse Table KPIs',
      'clickhouse Query': 'clickhouse.Query',
      'ClickHouse Node KPIs': 'ClickHouse Node KPIs',
      'cpu usage': 'cpu usage',
      'memory usage': 'memory usage',
      'disk usage': 'disk usage',
      'IOPS': 'IOPS',
      'ZooKeeper KPIs': 'ZooKeeper KPIs',
      'znode_count': 'znode_count',
      'leader_uptime': 'leader_uptime',
      'stale_sessions_expired': 'stale_sessions_expired',
      'jvm_gc_collection_seconds_count': 'jvm_gc_collection_seconds_count',
      'jvm_gc_collection_seconds_sum': 'jvm_gc_collection_seconds_sum',
      'Clickhouse Sinker KPIs': 'Clickhouse Sinker KPIs',
      'rate clickhouse_sinker_consume_msgs_total 1m': 'sum by(task)(rate(clickhouse_sinker_consume_msgs_total[1m]))',
      'rate clickhouse_sinker_flush_msgs_total 1m': 'sum by(task) (rate(clickhouse_sinker_flush_msgs_total[1m]))',
      'rate clickhouse_sinker_shard_msgs 1m': 'sum by(task) (clickhouse_sinker_shard_msgs)',
      'rate clickhouse_sinker_ring_msgs 1m': 'sum by(task) (clickhouse_sinker_ring_msgs)',
      'rate clickhouse_sinker_parsing_pool_backlog 1m': 'sum by(task)(clickhouse_sinker_parsing_pool_backlog)',
      'rate clickhouse_sinker_writing_pool_backlog 1m': 'sum by(task) (clickhouse_sinker_writing_pool_backlog)',
    },
  },
  zh: {
    common: {
      'Create': '创建',
      'Confirm': '确定',
      'Cancel': '取消',
      'Import': '导入',
      'Delete': '删除',
      'Logout': '退出',
      'placeholderIp': '多个ip,请以逗号,分隔填写',
      'Requied': '必填字段',
      'Clusters': '集群',
      'overview': '监控集群',
      'manage': '管理集群',
      'tables': '表管理',
      'session': '会话管理',
      'query-execution': '查询管理',
      'settings': '设置',
      'Upgrade': '升级',
      'Add Node': '增加节点',
      'Save': '保存',
      'Table Name': '表名',
      'Save Reboot': '保存 & 重启',
      'Version': '版本',
      'Files': '文件',
      'Action': '操作',
      'Upload File': '上传文件',
      'tips': '提示',
      'start': '确认要进行 启动 操作么?',
      'stop': '确认要进行 停止 操作么?',
      'destroy': '确认要进行 销毁 操作么?',
      'rebalance': '确认要进行 平衡 操作么?',
      'upgrade': '升级',
    },
    layout: {
      'ClickHouse Management Console': 'ckman管理平台',
    },
    home: {
      'Create or import a ClickHouse Cluster': '创建或导入集群',
      'Create a ClickHouse Cluster': '创建集群',
      'Cluster Name': '集群名称',
      'ClickHouse TCP Port': 'TCP端口',
      'ClickHouse Node List': '集群列表',
      'Replica': '是否设置副本',
      'Zookeeper Node List': 'Zookeeper集群列表',
      'ZooKeeper Port': 'Zookeeper端口',
      'ZK Status Port': 'Zookeeper监控端口',
      'Data path': '数据路径',
      'Cluster Username': '用户名',
      'Cluster Password': '密码',
      'SSH Username': '主机用户名',
      'SSH Password': '主机密码',
      'Import a ClickHouse Cluster':'导入集群',
      'Data Loader Management':'数据导入管理',
      'All ClickHouse Clusters': '集群列表',
      'Mode': '集群模式',
      'ClickHouse Node IP': 'ClickHouse节点IP',
      'ClickHouse Node Count': 'ClickHouse节点数量',
      'Actions': '操作',
      'Go to cluster': '进入集群',
      'ClickHouse Version': 'ClickHouse版本',
      'Overview': '监控集群',
      'Manage': '管理集群',
      'Tables': '表管理',
      'Session': '会话管理',
      'Query Execution': '查询管理',
      'Settings': '设置',
    },
    manage: {
      'Upgrade Cluster': '升级集群',
      'Upgrade to': '升级至',
      'Node IP': '节点IP',
      'Node Name': '节点名称',
      'shard number': '分片编号',
      'replica number': '副本编号',
      'Node Status': '节点状态' , // （green-健康 red-离线  yellow-亚健康）
      'Start Cluster': '开启集群',
      'Stop Cluster': '停止集群',
      'Destroy Cluster': '销毁集群',
      'Rebalance Cluster': '均衡集群',
      'New Node IP': '节点IP',
      'Node Shard': '分片编号',
    },
    tables: {
      'Table Metrics': '表指标',
      'Table Name': '表名',
      'Columns': '列数',
      'Rows': '行数',
      'Parts': '分区数',
      'Disk Space': '占用磁盘',
      'Completed Queries in last 24h': '过去24小时成功的SQL数量',
      'Failed Queries in last 24h': '过去24小时失败的SQL数量',
      'Last 7 days info': '过去7天（0.5,0.99,max）SQL耗时',
      'Table Replication Status': '复制表状态',
      'Zookeeper Status': 'Zookeeper状态',
    },
    session: {
      'Open Sessions': '正在执行的SQL会话',
      'Slow Sessions': '慢SQL查询',
      'Query Start Time': 'SQL开始时间',
      'Query Duration': 'SQL持续时间',
      'Query': 'SQL语句',
      'Initial User': '执行用户',
      'Initial Query ID': 'Query ID',
      'Initial Address': '执行主机',
      'Thread Numbers': '线程号',
    },
    queryExecution: {
      'Query History': '查询历史',
      'Execute Query': '执行查询',
    },
    homeSetting: {
      'Upload RPMs': '上传RPM包',
      'ClickHouse RPMs': 'ClickHouse RPM包管理',
    },
    ClickHouseEcharts: {
      'ClickHouse Table KPIs': 'ClickHouse表性能指标',
      'clickhouse Query': 'SQL查询指标',
      'ClickHouse Node KPIs': 'ClickHouse节点性能指标',
      'cpu usage': 'CPU占用',
      'memory usage': '内存占用',
      'disk usage': '磁盘占用',
      'IOPS': 'IO指标',
      'ZooKeeper KPIs': 'zookeeper指标',
      'znode_count': 'znode数量',
      'leader_uptime': 'leader存活时间',
      'stale_sessions_expired': '过期会话',
      'jvm_gc_collection_seconds_count': 'jvm gc 次数',
      'jvm_gc_collection_seconds_sum': 'jvm gc 耗时',
      'Clickhouse Sinker KPIs': 'ClickHouse Sinker 指标',
      'rate clickhouse_sinker_consume_msgs_total 1m': 'clickhouse_sinker消费Kafka消息的速率(个/秒)',
      'rate clickhouse_sinker_flush_msgs_total 1m': 'clickhouse_sinker写ClickHouse的速率(行/秒)',
      'rate clickhouse_sinker_shard_msgs 1m': 'clickhouse_sinker shard buffer当前包含的消息数目',
      'rate clickhouse_sinker_ring_msgs 1m': 'clickhouse_sinker ring buffer当前包含的消息数目',
      'rate clickhouse_sinker_parsing_pool_backlog 1m': 'clickhouse_sinker 解析协程池当前积压的消息数目',
      'rate clickhouse_sinker_writing_pool_backlog 1m': 'clickhouse_sinker 输出协程池当前积压的批数目',
    },
  },
};

const locale = localStorage.getItem('locale') || 'en';
export const $i18n = new VueI18n({ locale, messages });
const title = $i18n.t('layout.ClickHouse Management Console') + '';
document.title = title;
document.documentElement.lang = locale;
