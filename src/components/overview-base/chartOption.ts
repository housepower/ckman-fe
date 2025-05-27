import { format } from 'date-fns';
import { groupBy } from 'lodash-es';
import { MetricData } from '@/models';
export const chartOption = (data: MetricData[], min: number, max: number) => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
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
    symbol: 'none',
    lineStyle: {
      color: '#C9A100', // 新增线条颜色配置
      width: 2
    },
    itemStyle: {
      color: '#C9A100' // 统一数据点颜色
    },
    
    areaStyle: {
      color: {
        colorStops: [
          {
            offset: 0,
            color: 'rgba(201, 161, 0, 0.3)', // 主题色#C9A100 + 原透明度
          },
          {
            offset: 1,
            color: 'rgba(201, 161, 0, 0.1)', // 主题色#C9A100 + 原透明度
          }
        ]
      }
    },
  })),
});
