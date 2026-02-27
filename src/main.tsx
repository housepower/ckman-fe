import 'core-js';
import Vue from 'vue';
// import Vuex from 'vuex';
// Vue.use(Vuex);
import '@/store';
import '@/app';
import '@/components';
import '@/directives';
import { Component } from '@/common/VueComponentBase';
import { $router, $i18n, _updateVueInstance } from '@/services';

Component.registerHooks([
  'beforeRouteEnter',
  'beforeRouteUpdate',
  'beforeRouteLeave',
]);

import ElementUI from 'element-ui';
import VXETable from 'vxe-table';
VXETable.setup({
  i18n: (key, args) => $i18n.t(key, args) as string,
});
import 'vxe-table/lib/style.css';
import enLocale from 'element-ui/lib/locale/lang/en';
import zhLocale from 'element-ui/lib/locale/lang/zh-CN';
import ElementLocale from 'element-ui/lib/locale';

// 根据当前语言设置 Element UI locale
const currentLocale = localStorage.getItem('locale') || 'en';
ElementLocale.use(currentLocale === 'zh' ? zhLocale : enLocale);

Vue.use(ElementUI);
Vue.use(VXETable);

Vue.config.productionTip = false;

const data = {
  modals: [],
  loading: {
    status: 0,
    text: '',
  },
  clusterBench: null,
  tooltips: [],
  userInfo: null,
};
_updateVueInstance(data as any);
new Vue({
  data,
  router: $router,
  i18n: $i18n,
  render() {
    return (
      <div id="app" style="height: 100%">
        <vue-progressbar ref="progressbar" />
        <router-view />
        {this.modals.map(attrs => <sharp-modal {...{ attrs }} />)}
        {this.loading.status ? <v-loading /> : null}
        {this.tooltips.map(attrs => <sharp-tooltip {...{ attrs }} />)}
      </div>
    );
  },
  created() {
    _updateVueInstance(this);
  },
}).$mount('#app');

// if ($router.currentRoute.name !== 'login') {
//   $router.push({name: 'Home'});
// }
