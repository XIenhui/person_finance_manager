<template>
  <div class="monthly-comparison-chart">
    <div class="chart-header">
      <h3>月度收支对比</h3>
      <el-select v-model="year" size="small" style="width: 100px">
        <el-option label="2023" value="2023" />
        <el-option label="2022" value="2022" />
        <el-option label="2021" value="2021" />
      </el-select>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const chartRef = ref(null)
const year = ref('2023')
let chartInstance = null

// 模拟数据
const generateData = () => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  const incomeData = months.map(() => Math.round(Math.random() * 10000 + 5000))
  const expenseData = months.map(() => Math.round(Math.random() * 8000 + 3000))
  const balanceData = months.map((_, index) => incomeData[index] - expenseData[index])

  return { months, incomeData, expenseData, balanceData }
}

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)

  const { months, incomeData, expenseData, balanceData } = generateData()

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      formatter: params => {
        let result = `${params[0].axisValue}<br>`
        params.forEach(item => {
          result += `${item.marker} ${item.seriesName}: ¥${item.value}<br>`
        })
        return result
      }
    },
    legend: {
      data: ['收入', '支出', '结余']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: months,
        axisPointer: {
          type: 'shadow'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '金额',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      {
        type: 'value',
        name: '结余',
        axisLabel: {
          formatter: '¥{value}'
        }
      }
    ],
    series: [
      {
        name: '收入',
        type: 'bar',
        barGap: 0,
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          color: '#67C23A'
        },
        data: incomeData
      },
      {
        name: '支出',
        type: 'bar',
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          color: '#F56C6C'
        },
        data: expenseData
      },
      {
        name: '结余',
        type: 'line',
        yAxisIndex: 1,
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          color: '#409EFF'
        },
        data: balanceData
      }
    ]
  }

  chartInstance.setOption(option)
}

// 响应式调整图表大小
const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', resizeChart)
})

watch(year, () => {
  initChart()
})

// 组件卸载时清理
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', resizeChart)
})
</script>

<style scoped>
.monthly-comparison-chart {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.chart-container {
  width: 100%;
  height: 350px;
}
</style>