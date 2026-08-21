import { Metrics } from './Metrics';

/**
 * 集群页面内的二级导航。
 *
 * 单一来源：侧边栏据此渲染二级菜单，页面据此决定显示哪块内容。
 * 当前选中项存在路由 query 的 `tab` 上，缺省取第一项，
 * 所以 key 会出现在 URL 里，改动等同于改 URL。
 */
export interface ClusterTab {
  key: string;
  label: string; // 完整 i18n key
}

export const ClusterTabs: Readonly<Record<string, readonly ClusterTab[]>> = Object.freeze({
  overview: Object.freeze(
    Metrics.map(group => ({ key: group.key, label: 'ClickHouseEcharts.' + group.title })),
  ),
  tables: Object.freeze([
    { key: 'metric',      label: 'tables.Table Metrics' },
    { key: 'merges',      label: 'tables.Table Merges' },
    { key: 'replication', label: 'tables.Table Replication Status' },
    { key: 'background',  label: 'tables.Background Pool' },
    { key: 'zookeeper',   label: 'tables.Zookeeper Status' },
  ]),
  'data-manage': Object.freeze([
    { key: 'backup',    label: 'dataManage.backupManagement' },
    { key: 'rebalance', label: 'dataManage.dataBalancing' },
  ]),
  session: Object.freeze([
    { key: 'open', label: 'session.Open Sessions' },
    { key: 'ddl',  label: 'session.DDL Queue' },
    { key: 'slow', label: 'session.Slow Sessions' },
  ]),
});

/** 把 query 里的 tab 解析成下标；缺失或无法识别时回落到第一项。 */
export function tabIndexOf(tabs: readonly ClusterTab[], key: unknown): number {
  const index = tabs.findIndex(tab => tab.key === key);
  return index < 0 ? 0 : index;
}
