<template>
  <div class="transaction-trend-chart">
    <div class="chart-header">
      <h3>交易趋势</h3>
      <el-select v-model="timeRange" size="small" style="width: 120px">
        <el-option label="最近7天" value="7d" />
        <el-option label="最近30天" value="30d" />
        <el-option label="最近3个月" value="3m" />
        <el-option label="最近1年" value="1y" />
      </el-select>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const chartRef = ref(null)
const timeRange = ref('30d')
let chartInstance = null

// 模拟数据
const generateData = () => {
  const days = timeRange.value === '7d' ? 7 :
      timeRange.value === '30d' ? 30 :
          timeRange.value === '3m' ? 90 : 365

  const dates = []
  const incomeData = []
  const expenseData = []

  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    dates.push(`${date.getMonth() + 1}/${date.getDate()}`)

    incomeData.push(Math.round(Math.random() * 1000 + 500))
    expenseData.push(Math.round(Math.random() * 800 + 200))
  }

  return { dates, incomeData, expenseData }
}

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)

  const { dates, incomeData, expenseData } = generateData()

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
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
      data: ['收入', '支出']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        interval: Math.floor(dates.length / 7) // 显示适量的标签
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '收入',
        type: 'bar',
        stack: 'total',
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
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          color: '#F56C6C'
        },
        data: expenseData.map(item => -item) // 支出显示为负数
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

watch(timeRange, () => {
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
.transaction-trend-chart {
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
  height: 300px;
}
</style>