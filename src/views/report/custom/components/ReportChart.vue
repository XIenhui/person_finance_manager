<template>
  <div ref="chartRef" style="width: 100%; height: 100%;"></div>
</template>

<script>
import * as echarts from 'echarts';
import { onMounted, ref, watch, onBeforeUnmount } from 'vue';

export default {
  name: 'ReportChart',
  props: {
    incomeData: {
      type: Array,
      default: () => []
    },
    expenseData: {
      type: Array,
      default: () => []
    },
    showType: {
      type: String,
      default: 'income' // 'income', 'expense' or 'both'
    }
  },
  setup(props) {
    const chartRef = ref(null);
    let chartInstance = null;

    const initChart = () => {
      if (!chartRef.value) return;

      chartInstance = echarts.init(chartRef.value);
      updateChart();
    };

    const updateChart = () => {
      if (!chartInstance) return;

      const options = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          data: []
        },
        series: []
      };

      // 添加收入数据
      if (props.showType !== 'expense' && props.incomeData.length > 0) {
        options.legend.data.push(...props.incomeData.map(item => item.category_name));
        options.series.push({
          name: '收入',
          type: 'pie',
          radius: ['40%', '70%'],
          center: props.showType === 'both' ? ['30%', '50%'] : ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}: {d}%'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: true
          },
          data: props.incomeData.map(item => ({
            value: item.amount,
            name: item.category_name,
            itemStyle: { color: '#67C23A' }
          }))
        });
      }

      // 添加支出数据
      if (props.showType !== 'income' && props.expenseData.length > 0) {
        options.legend.data.push(...props.expenseData.map(item => item.category_name));
        options.series.push({
          name: '支出',
          type: 'pie',
          radius: ['40%', '70%'],
          center: props.showType === 'both' ? ['70%', '50%'] : ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}: {d}%'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: true
          },
          data: props.expenseData.map(item => ({
            value: item.amount,
            name: item.category_name,
            itemStyle: { color: '#F56C6C' }
          }))
        });
      }

      chartInstance.setOption(options);
    };

    const resizeChart = () => {
      if (chartInstance) {
        chartInstance.resize();
      }
    };

    onMounted(() => {
      initChart();
      window.addEventListener('resize', resizeChart);
    });

    onBeforeUnmount(() => {
      if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
      }
      window.removeEventListener('resize', resizeChart);
    });

    watch(
        () => [props.incomeData, props.expenseData, props.showType],
        () => {
          updateChart();
        },
        { deep: true }
    );

    return {
      chartRef
    };
  }
};
</script>