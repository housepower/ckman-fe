import Vue from 'vue';

import 'font-awesome/scss/font-awesome.scss';

export * from '@/common/components';
import { TimeFilter } from './time-filter';
import { default as Breadcrumb } from './breadcrumb.vue';
import { default as OverviewBase } from './overview-base/overview-base.vue';
import { default as SqlCodeMirror } from './sql-code-mirror/sql-code-mirror.vue';
import { default as DForm } from './d-form/d-form.vue';
console.log(DForm);

Object.entries({
  TimeFilter,
  Breadcrumb,
  OverviewBase,
}).forEach(([name, component]) => Vue.component(name, component));

export {
  TimeFilter,
  Breadcrumb,
  OverviewBase,
  SqlCodeMirror,
  DForm,
};
