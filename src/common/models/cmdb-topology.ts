import { PaginationConfig } from '@/common/helpers';

export type CmdbTopologyNodeType = 'middleware' | 'host';

export interface CmdbTopologyDataModel {
  ciNo: string;
  name: string; // 节点名称
  texts?: string[]; // 节点文本内容
  color: string; // 节点颜色
  type: CmdbTopologyNodeType; // 节点类型
  [key: string]: any;
  children?: CmdbTopologyDataModel[]; // 子节点
  collapsed?: boolean; // 是否收起
}

export interface CmdbTopologyNodeModel {
  ciNo: string;
  name: string; // 节点名称
  texts?: string[]; // 节点文本内容
  color: string; // 节点颜色
  type: 'cmdb-host' | 'cmdb-middleware'; // 节点类型
  children?: CmdbTopologyNodeModel[]; // 显示的子节点
  _children?: CmdbTopologyNodeModel[]; // 全部子节点
  id: string; // 节点id
  parentId: string;
  collapsed: boolean;
  level: number;
  pageConf: PaginationConfig;
  horizontal: boolean; // 是否横向模式
}
