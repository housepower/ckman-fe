#!/usr/bin/env node
import sass from 'sass';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokenFile = resolve(__dirname, '../src/app/theme/_tokens.scss');

// 兼容 sass 1.32 legacy API（同步）
const result = sass.renderSync({
  file: tokenFile,
  includePaths: [resolve(__dirname, '../src'), resolve(__dirname, '../node_modules')],
});
const css = result.css.toString();

const required = [
  '--c-gold-50:', '--c-gold-100:', '--c-gold-200:', '--c-gold-300:',
  '--c-gold-400:', '--c-gold-500:', '--c-gold-600:', '--c-gold-700:',
  '--c-gold-800:', '--c-gold-900:',
  '--c-gray-50:', '--c-gray-100:', '--c-gray-200:', '--c-gray-300:',
  '--c-gray-400:', '--c-gray-500:', '--c-gray-600:', '--c-gray-700:',
  '--c-gray-800:', '--c-gray-900:',
  // 语义色 × 4 状态字段（5 状态：primary/success/warning/danger/info）
  '--c-primary-bg:', '--c-primary-border:', '--c-primary-fg:', '--c-primary-solid:',
  '--c-success-bg:', '--c-success-border:', '--c-success-fg:', '--c-success-solid:',
  '--c-warning-bg:', '--c-warning-border:', '--c-warning-fg:', '--c-warning-solid:',
  '--c-danger-bg:', '--c-danger-border:', '--c-danger-fg:', '--c-danger-solid:',
  '--c-info-bg:', '--c-info-border:', '--c-info-fg:', '--c-info-solid:',
  // 表面
  '--c-surface-0:', '--c-surface-1:', '--c-surface-2:', '--c-surface-3:',
  // 文字
  '--c-text-primary:', '--c-text-secondary:', '--c-text-tertiary:', '--c-text-disabled:',
  // Spacing (13 个)
  '--s-0:', '--s-1:', '--s-2:', '--s-3:', '--s-4:', '--s-5:', '--s-6:',
  '--s-8:', '--s-10:', '--s-12:', '--s-16:', '--s-20:', '--s-24:',
  // Radius (4 个)
  '--r-sm:', '--r-md:', '--r-lg:', '--r-pill:',
  // Shadow (5 个)
  '--sh-xs:', '--sh-sm:', '--sh-md:', '--sh-lg:', '--sh-inset:',
];

const missing = required.filter(name => !css.includes(name));
if (missing.length) {
  console.error('FAIL: missing tokens:', missing);
  process.exit(1);
}
if (!css.includes('--c-gold-500: #C9A100')) {
  console.error('FAIL: gold-500 anchor mismatch');
  process.exit(1);
}
console.log('PASS: 70 tokens verified');
