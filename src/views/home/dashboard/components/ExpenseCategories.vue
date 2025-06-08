<template>
  <div class="expense-categories">
    <el-empty v-if="filteredData.length === 0" description="暂无支出数据" />
    <div v-else style="width: 100%">
      <el-scrollbar style="height: 240px;width: 100%">
        <div class="category-list">
          <div v-for="item in filteredData" :key="item.category" class="category-item">
            <div class="category-info">
              <div class="category-color" :style="{ backgroundColor: item.color }"></div>
              <div class="category-name">{{ item.category }}</div>
            </div>
            <div class="category-amount">
              <span class="percentage">{{ item.percentage }}%</span>
              <span class="amount">¥{{ item.amount.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  period: {
    type: String,
    default: 'month'
  }
})

// 模拟数据
const expenseData = ref({
  day: [],
  month: [],
  year: []
})

const filteredData = computed(() => {
  const data = expenseData.value[props.period] || []
  const total = data.reduce((sum, item) => sum + item.amount, 0)

  return data.map(item => ({
    ...item,
    percentage: total > 0 ? Math.round((item.amount / total) * 100) : 0
  }))
})

const chartData = computed(() => ({
  labels: filteredData.value.map(item => item.category),
  datasets: [
    {
      data: filteredData.value.map(item => item.amount),
      backgroundColor: filteredData.value.map(item => item.color)
    }
  ]
}))

const chartOptions = ref({
  responsive: true,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || ''
          const value = context.raw || 0
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const percentage = Math.round((value / total) * 100)
          return `${label}: ¥${value.toLocaleString()} (${percentage}%)`
        }
      }
    }
  }
})
</script>

<style scoped>
.expense-categories {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.chart-container {
  flex: 1;
  height: 250px;
}

.category-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed var(--el-border-color);
}

.category-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.category-name {
  font-size: 14px;
}

.category-amount {
  display: flex;
  gap: 15px;
}

.percentage {
  color: var(--el-text-color-secondary);
  min-width: 40px;
  text-align: right;
}

.amount {
  min-width: 80px;
  text-align: right;
  font-weight: 500;
}

@media (max-width: 768px) {
  .expense-categories {
    flex-direction: column;
  }
}
</style>