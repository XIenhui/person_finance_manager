<template>
  <div class="category-pie-chart">
    <div class="chart-header">
      <h3>支出分类占比</h3>
      <el-select v-model="timeRange" size="small" style="width: 120px">
        <el-option label="本月" value="month" />
        <el-option label="本季度" value="quarter" />
        <el-option label="本年" value="year" />
      </el-select>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const chartRef = ref(null)
const timeRange = ref('month')
let chartInstance = null

// 模拟数据
const generateData = () => {
  const categories = [
    '餐饮', '购物', '交通', '娱乐', '住房', '医疗', '教育', '其他'
  ]

  const data = categories.map(category => {
    let value
    if (timeRange.value === 'month') {
      value = Math.round(Math.random() * 3000 + 500)
    } else if (timeRange.value === 'quarter') {
      value = Math.round(Math.random() * 9000 + 1500)
    } else {
      value = Math.round(Math.random() * 36000 + 6000)
    }

    return {
      name: category,
      value: value
    }
  })

  // 按值排序
  return data.sort((a, b) => b.value - a.value)
}

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)

  const data = generateData()

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: data.map(item => item.name)
    },
    series: [
      {
        name: '支出分类',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold',
            formatter: '{b}\n¥{c} ({d}%)'
          }
        },
        labelLine: {
          show: false
        },
        data: data
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
.category-pie-chart {
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