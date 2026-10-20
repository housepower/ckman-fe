import { format } from 'date-fns';
import { groupBy } from 'lodash-es';
import { MetricData } from '@/models';
export const chartOption = (data: MetricData[], min: number, max: number) => ({
  tooltip: {
    trigger: 'axis',
    // grafana 式的细竖线游标
    axisPointer: {
      type: 'line',
      lineStyle: { width: 1, type: 'solid' },
    },
    confine: true,
    enterable: true,
    formatter(params) {
      return `${format(params[0].axisValue, 'yyyy-MM-dd hh:mm:ss')}<br/>` + Object.entries(groupBy(params, 'seriesName')).map(([ip, arr]) => `${arr[0].marker}${ip}${arr.sort((a, b) => b.value[1] - a.value[1]).map(x => `: ${x.value[1]}`).join('<br/>')}`).join('<br/>');
    },
  },
  toolbox: {
    feature: {
      saveAsImage: {}
    }
  },
  legend: {
    left: 'center',
    type: 'scroll',
    top: -5,
  },
  dataZoom: [{
    show: true,
    height: 25,
    xAxisIndex: 0,
    bottom: 10,
  }],
  grid: {
    top: 'middle',
    left: '3%',
    right: '5.5%',
    bottom: '3%',
    height: '80%',
    containLabel: true,
  },
  xAxis: {
    type: 'time',
    name: '时间',
    axisLine: {
      lineStyle: {
        color: '#999',
      },
    },
    axisTick: {
      show: false,
    },
    min,
    max,
  },
  yAxis: {
    type: 'value',
    splitLine: {
      lineStyle: {
        type: 'dashed',
        color: '#DDD',
      },
    },
    nameTextStyle: {
      color: '#999',
    },
    name: '值',
  },
  series: (data || []).map(({ metric, values }) => ({
    name: (() => {
      if (metric.instance) {
        return `${metric.instance}`;
      } else {
        return `job:${metric.job}-task:${metric.task}`;
      }
    })(),
    data: values.map(item => ([item[0] * 1000, Number(item[1]).toFixed(2).replace('.00', '')])),
    type: 'line',
    // 线宽对齐 grafana 的 1px：主题里给折线定的是 2px，监控这种多条线叠在
    // 一起的场景太粗，交叠处会糊成一片
    lineStyle: { width: 1 },
    // 平时不画点，hover 时在交点冒一个(grafana 的行为)，比 symbol:'none'
    // 更容易看清当前读的是哪条线上的哪个点
    symbol: 'circle',
    showSymbol: false,
    symbolSize: 5,
  })),
});
