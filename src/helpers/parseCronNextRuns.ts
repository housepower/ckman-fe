import cronParser from 'cron-parser';
import moment from 'moment';

export interface CronPreviewResult {
  valid: boolean;
  runs: string[];
  error?: string;
}

export function parseCronNextRuns(expr: string, count = 3): CronPreviewResult {
  const trimmed = (expr || '').trim();
  if (!trimmed) return { valid: false, runs: [] };
  if (trimmed.split(/\s+/).length !== 6) {
    return { valid: false, runs: [], error: 'fields' };
  }
  try {
    const interval = cronParser.parseExpression(trimmed, { currentDate: new Date() });
    const runs: string[] = [];
    for (let i = 0; i < count; i++) {
      runs.push(moment(interval.next().toDate()).format('YYYY-MM-DD HH:mm:ss'));
    }
    return { valid: true, runs };
  } catch (e: any) {
    return { valid: false, runs: [], error: e?.message || 'parse_error' };
  }
}
