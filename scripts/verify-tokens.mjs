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
console.log('PASS: 20 base color tokens verified');
