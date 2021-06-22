import Vue from 'vue';

import { ChildViewHolder } from './child-view-holder';
import { NumberAnimation } from './number-animation';
import { RTabset } from './r-tabset';
import { SharpDrawer, SharpModal } from './sharp-modal-drawer';
import { SharpPagination } from './sharp-pagination';
import { SharpSelector } from './sharp-selector';
import { SharpSelectorNext } from './sharp-selector-next';
import { SharpTooltip } from './sharp-tooltip';
import { TableSelection } from './table-selection';
import { TagManager } from './tag-manager';
import { TimeRange } from './time-range';
import { VCollapse } from './v-collapse';
import { VCollapseText } from './v-collapse-text';
import { VLoading } from './v-loading';
import { VueAceEditor } from './vue-ace-editor';
import { VueEcharts } from './vue-echarts';
import { VueProgressbar } from './vue-progressbar';

Object.entries({
  ChildViewHolder,
  NumberAnimation,
  RTabset,
  SharpModal,
  SharpDrawer,
  SharpPagination,
  SharpSelector,
  SharpSelectorNext,
  SharpTooltip,
  TagManager,
  TimeRange,
  VCollapse,
  VCollapseText,
  VLoading,
  VueEcharts,
  VueProgressbar,
  VueAceEditor,
}).forEach(([name, component]) => Vue.component(name, component));

export {
  ChildViewHolder,
  NumberAnimation,
  RTabset,
  SharpDrawer,
  SharpModal,
  SharpPagination,
  SharpSelector,
  SharpSelectorNext,
  SharpTooltip,
  TableSelection,
  TagManager,
  TimeRange,
  VCollapse,
  VCollapseText,
  VLoading,
  VueAceEditor,
  VueEcharts,
  VueProgressbar,
};
