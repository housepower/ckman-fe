import axios from 'axios';
import { Message } from 'element-ui';
import { $i18n } from '@/services/i18n';

const t = (key: string, args?: any) => $i18n.t(key, args) as string;

function classifyHttpError(err: any): string | null {
  if (!err || typeof err !== 'object') return null;

  const code = err.code;
  if (code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) {
    return t('errors.Timeout');
  }

  if (!err.response) {
    if (err.message === 'Network Error') return t('errors.Network');
    return null;
  }

  const status = err.response.status;
  const data = err.response.data;
  const backendMsg = data && (data.detail || data.error || data.message || data.retMsg);
  if (backendMsg) return String(backendMsg);

  if (status === 400) return t('errors.BadRequest');
  if (status === 403) return t('errors.Forbidden');
  if (status === 404) return t('errors.NotFound');
  if (status >= 500) return t('errors.Server', { status });

  return null;
}

export const $message = {
  info: (x: string) => Message.info(x),
  success: (x: string) => Message.success(x),
  warning: (x: string) => Message.warning(x),
  error: (x: string) => Message.error(x),
  fuck(obj: any) {
    if (axios.isCancel(obj)) return console.info('Request canceled: ', obj.message.url);
    if (obj === 'cancel') return console.info('User canceled');

    console.error(obj);

    const classified = classifyHttpError(obj);
    if (classified) return Message.error(classified);

    if (obj == null) {
      return Message.error(t('errors.Unknown'));
    } else if (obj instanceof Error) {
      return Message.error(obj.message);
    } else if (typeof obj !== 'object') {
      return Message.error(obj + '');
    } else if (obj.data || (obj.response && obj.response.data)) {
      const data = obj.data || obj.response.data;
      return Message.error(data.detail || data.error || data.message || data.retMsg || JSON.stringify(data));
    } else {
      return Message.error(obj.detail || obj.error || obj.message || obj.retMsg || JSON.stringify(obj));
    }
  },
};
