// TS 镜像，必须与 _tokens.scss 中的值一一对应
// 修改时同步两个文件；verify-tokens.mjs 会做一致性检查

export const tokens = {
  gold: {
    50:  '#FDF9E6',
    100: '#FAF1B8',
    200: '#F4E388',
    300: '#ECCF57',
    400: '#E0BA32',
    500: '#C9A100',
    600: '#A88500',
    700: '#856900',
    800: '#634D00',
    900: '#423300',
  },
  gray: {
    50:  '#F8F9FA',
    100: '#F1F3F5',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#1A1D23',
    800: '#0F1115',
    900: '#07080A',
  },
  semantic: {
    primary: { bg: '#FDF9E6', border: '#F4E388', fg: '#856900', solid: '#C9A100' },
    success: { bg: '#ECFDF5', border: '#A7F3D0', fg: '#047857', solid: '#10B981' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', fg: '#B45309', solid: '#F59E0B' },
    danger:  { bg: '#FEF2F2', border: '#FECACA', fg: '#B91C1C', solid: '#EF4444' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', fg: '#1D4ED8', solid: '#3B82F6' },
  },
  surface: { 0: '#FFFFFF', 1: '#F8F9FA', 2: '#F1F3F5', 3: '#E5E7EB' },
  text:    { primary: '#111827', secondary: '#4B5563', tertiary: '#9CA3AF', disabled: '#D1D5DB' },
  font: {
    body:    '"Inter", -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    display: '"Inter", -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    mono:    '"JetBrains Mono", "SF Mono", "Menlo", "Consolas", "Courier New", monospace',
  },
} as const;

export type Tokens = typeof tokens;
