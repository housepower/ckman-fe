import { ClusterTabs } from './ClusterTabs';

export const Menus = Object.freeze([
  {
    path: 'overview',
    name: 'Overview',
    icon: 'fa-dashboard',
    children: ClusterTabs.overview,
  },
  {
    path: 'manage',
    name: 'Manage',
    icon: 'fa-server',
  },
  {
    path: 'tables',
    name: 'Tables',
    icon: 'fa-table',
    children: ClusterTabs.tables,
  },
  {
    path: 'data-manage',
    name: 'data-manage',
    icon: 'fa-database',
    children: ClusterTabs['data-manage'],
  },
  {
    path: 'session',
    name: 'Session',
    icon: 'fa-exchange',
    children: ClusterTabs.session,
  },
  {
    path: 'query-execution',
    name: 'Query Execution',
    icon: 'fa-terminal',
  },
  {
    path: 'settings',
    name: 'Settings',
    icon: 'fa-cog',
  },
]);
export const LoaderMenus = Object.freeze([
  {
    path: 'overview',
    name: 'Overview',
    icon: 'fa-dashboard',
    children: ClusterTabs.overview,
  },
  {
    path: 'manage',
    name: 'Manage',
    icon: 'fa-server',
  },
]);
