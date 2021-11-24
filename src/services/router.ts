import Vue from 'vue';
import Router, { Route } from 'vue-router';

import { ChildViewHolder } from '@/common/components/child-view-holder';

const originalPush = Router.prototype.push;
Router.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err);
};

Vue.use(Router);

export const $router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/login.vue'),
    },
    {
      path: '/',
      name: 'Layout',
      redirect: 'home',
      component: () => import('@/views/layout/layout.vue'),
      children: [
        {
          path: 'home',
          name: 'Home',
          component: () => import('@/views/home/home.vue'),
        },
        {
          path: 'cluster/create',
          name: 'createCluster',
          component: () => import('@/views/home/create-cluster.vue'),
        },
        {
          path: 'setting',
          name: 'HomeSetting',
          component: () => import('@/views/home-setting/homeSetting.vue'),
        },
        {
          path: 'task',
          name: 'TaskList',
          component: () => import('@/views/task/list.vue'),
        },
        {
          path: '/clusters/:id',
          component: ChildViewHolder,
          redirect: '/clusters/:id/overview',
          children:[
            {
              path: 'overview',
              name: 'Overview',
              component: () => import('@/views/overview/overview.vue'),
            },
            {
              path: 'manage',
              name: 'Manage',
              component: () => import('@/views/manage/manage.vue'),
            },
            {
              path: 'tables',
              name: 'Tables',
              component: () => import('@/views/tables/tables.vue'),
            },
            {
              path: 'session',
              name: 'Session',
              component: () => import('@/views/session/session.vue'),
            },
            {
              path: 'query-execution',
              name: 'QueryExecution',
              component: () => import('@/views/query-execution/query.vue'),
            },
            {
              path: 'settings',
              name: 'Settings',
              component: () => import('@/views/settings/settings.vue'),
            },
          ],
        },
      ],
    },
  ],
});

export let $route: Route;

$router.beforeEach((to, from, next) => {
  if (to.path === '/login') {
    localStorage.removeItem('user');
  }
  const info = localStorage.getItem('user') || '{}';
  if (!JSON.parse(info).token && to.path !== '/login') {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  } else if (to.path === '/login'){
    next();
  } else {
    next();
  }
});

$router.afterEach(to => {
  document.body.dataset.page = to.name;
});

$router.afterEach(to => $route = to);
