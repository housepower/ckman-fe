import Vue from 'vue';

import 'font-awesome/scss/font-awesome.scss';

export * from '@/common/components';
import { TimeFilter } from './time-filter';
import { default as OverviewBase } from './overview-base/overview-base.vue';
import { default as SqlCodeMirror } from './sql-code-mirror/sql-code-mirror.vue';
import { default as DForm } from './d-form/d-form.vue';
import { PageHeader } from './page-header';
import EmptyState from './empty-state';
import Skeleton from './skeleton';
Object.entries({
  TimeFilter,
  OverviewBase,
  PageHeader,
  EmptyState,
  Skeleton,
}).forEach(([name, component]) => Vue.component(name, component));

export {
  TimeFilter,
  OverviewBase,
  SqlCodeMirror,
  DForm,
  PageHeader,
  EmptyState,
  Skeleton,
};
