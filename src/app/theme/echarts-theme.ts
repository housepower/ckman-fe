import echarts from 'echarts';
import { tokens } from './tokens';

const { gold, gray, semantic } = tokens;

const seriesColors = [
  gold[500],              // 金（品牌主色）
  semantic.info.solid,    // 钢蓝
  semantic.success.solid, // 深绿
  semantic.danger.solid,  // 砖红
  semantic.warning.solid, // 橘黄
  gray[600],              // 中性灰
  '#8B5CF6',              // 紫
  '#06B6D4',              // 青
];

echarts.registerTheme('ckman', {
  color: seriesColors,
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'Inter, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
    color: tokens.text.primary,
  },
  title: {
    textStyle: { color: tokens.text.primary, fontWeight: 600 },
    subtextStyle: { color: tokens.text.tertiary },
  },
  line: {
    itemStyle: { borderWidth: 2 },
    lineStyle: { width: 2 },
    symbolSize: 4,
    symbol: 'circle',
    smooth: false,
  },
  bar: { itemStyle: { borderWidth: 0, borderColor: gray[200] } },
  categoryAxis: {
    axisLine: { lineStyle: { color: gray[300] } },
    axisTick: { lineStyle: { color: gray[300] } },
    axisLabel: { color: tokens.text.tertiary, fontSize: 11 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: tokens.text.tertiary, fontSize: 11 },
    splitLine: { lineStyle: { color: gray[100], type: 'dashed' } },
  },
  legend: { textStyle: { color: tokens.text.secondary, fontSize: 12 } },
  tooltip: {
    backgroundColor: tokens.text.primary,
    borderWidth: 0,
    textStyle: { color: '#FFFFFF', fontSize: 12 },
    axisPointer: { lineStyle: { color: gray[400] } },
  },
});
