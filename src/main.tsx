import 'core-js';
import Vue from 'vue';
// import Vuex from 'vuex';
// Vue.use(Vuex);
import '@/store/';
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
import zhCN from 'vxe-table/lib/locale/lang/zh-CN';
import enUS from 'vxe-table/lib/locale/lang/en-US';
import VXETable from 'vxe-table';
VXETable.setup({
  i18n: (key, args) => $i18n.t(key, args) as string,
});
import 'vxe-table/lib/style.css';
import locale from 'element-ui/lib/locale/lang/en';

Vue.use(ElementUI, { locale });
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
