import Vue from 'vue';

import 'font-awesome/scss/font-awesome.scss';

export * from '@/common/components';
import { TimeFilter } from './time-filter';
import { default as Breadcrumb } from './breadcrumb.vue';
import { default as OverviewBase } from './overview-base/overview-base.vue';

Object.entries({
  TimeFilter,
  Breadcrumb,
  OverviewBase,
}).forEach(([name, component]) => Vue.component(name, component));

export {
  TimeFilter,
  Breadcrumb,
  OverviewBase,
};
