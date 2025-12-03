import { Options } from 'highcharts';

export const barChart: Options = {
  chart: {
    type: 'bar',
  },
  credits: {
    enabled: false,
  },
  title: {
    text: 'Total patients',
  },
  yAxis: {
    visible: false,
    gridLineColor: '#fff',
  },
  legend: {
    enabled: false,
  },
  xAxis: {
    lineColor: '#fff',
    categories: [
      'Male',
      'Female',
    ],
  },

  plotOptions: {
    series: {
      borderRadius: 5,
    } as any,
  },

  series: [
    {
      type: 'bar',
      color: '#506ef9',
      data: [
        { y: 20.9},
        { y: 71.5 }
      ],
    },
  ],
};