<template>
  <div class="account-flow-chart">
    <div class="chart-header">
      <h3>账户流水趋势</h3>
      <div>
        <el-select v-model="timeRange" size="small" style="width: 120px; margin-right: 10px">
          <el-option label="最近7天" value="7d" />
          <el-option label="最近30天" value="30d" />
          <el-option label="最近3个月" value="3m" />
        </el-select>
        <el-select v-model="account" size="small" style="width: 150px">
          <el-option label="全部账户" value="all" />
          <el-option label="中国银行" value="bank1" />
          <el-option label="支付宝" value="alipay" />
          <el-option label="微信支付" value="wechat" />
          <el-option label="现金" value="cash" />
        </el-select>
      </div>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const chartRef = ref(null)
const timeRange = ref('30d')
const account = ref('all')
let chartInstance = null

// 模拟数据
const generateData = () => {
  const days = timeRange.value === '7d' ? 7 :
      timeRange.value === '30d' ? 30 : 90

  const dates = []
  const inData = []
  const outData = []
  const balanceData = []

  let balance = 10000 // 初始余额

  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    dates.push(`${date.getMonth() + 1}/${date.getDate()}`)

    const inAmount = Math.round(Math.random() * 2000 + 500)
    const outAmount = Math.round(Math.random() * 1500 + 300)

    inData.push(inAmount)
    outData.push(outAmount)

    balance = balance + inAmount - outAmount
    balanceData.push(balance)
  }

  return { dates, inData, outData, balanceData }
}

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)

  const { dates, inData, outData, balanceData } = generateData()

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: params => {
        let result = `${params[0].axisValue}<br>`
        params.forEach(item => {
          const value = item.seriesName === '余额' ?
              `¥${item.value.toLocaleString()}` :
              `¥${Math.abs(item.value).toLocaleString()}`
          result += `${item.marker} ${item.seriesName}: ${value}<br>`
        })
        return result
      }
    },
    legend: {
      data: ['收入', '支出', '余额']
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
        boundaryGap: false,
        data: dates
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '收支金额',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      {
        type: 'value',
        name: '账户余额',
        axisLabel: {
          formatter: '¥{value}'
        }
      }
    ],
    series: [
      {
        name: '收入',
        type: 'line',
        stack: 'total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          color: '#67C23A'
        },
        data: inData
      },
      {
        name: '支出',
        type: 'line',
        stack: 'total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          color: '#F56C6C'
        },
        data: outData.map(item => -item) // 支出显示为负数
      },
      {
        name: '余额',
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

watch([timeRange, account], () => {
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
.account-flow-chart {
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