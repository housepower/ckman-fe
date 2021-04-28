import Vue from 'vue';
import VueI18n from 'vue-i18n';
Vue.use(VueI18n);

const messages = {
  en: {
    layout: {
      'ClickHouse Management Console': 'ClickHouse Management Console',
    },
    home: {
      'Create a ClickHouse Cluster': 'Create a ClickHouse Cluster',
      'Cluster Name': 'Cluster Name',
      'ClickHouse TCP Port': 'ClickHouse TCP Port',
    },
  },
  zh: {
    layout: {
      'ClickHouse Management Console': 'ckman管理平台',
    },
    home: {
      'Create a ClickHouse Cluster': '创建集群',
      'Cluster Name': '集群名称',
      'ClickHouse TCP Port': 'TCP端口',
    },
  },
};

const locale = localStorage.getItem('locale') || 'en';
export const $i18n = new VueI18n({ locale, messages });
const title = $i18n.t('layout.ClickHouse Management Console') + '';
document.title = title;
document.documentElement.lang = locale;
