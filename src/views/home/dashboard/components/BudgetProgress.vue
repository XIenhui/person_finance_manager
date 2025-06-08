<template>
  <el-scrollbar style="width: 100%; height: 250px">
    <div class="budget-progress">
      <el-empty v-if="budgets.length === 0" description="暂无预算数据" />
      <div v-for="budget in budgets" :key="budget.category" class="budget-item">
        <div class="budget-header">
          <span class="budget-category">{{ budget.category }}</span>
          <span class="budget-amount">
          ¥{{ budget.spent }} / ¥{{ budget.budget }}
        </span>
        </div>
        <el-progress
            :percentage="budget.progress"
            :color="getProgressColor(budget.progress)"
            :show-text="false"
        />
        <div class="budget-footer">
        <span class="budget-remaining">
          剩余 ¥{{ budget.budget - budget.spent }}
        </span>
          <span class="budget-percentage">
          {{ budget.progress }}%
        </span>
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>

<script setup>
defineProps({
  budgets: {
    type: Array,
    required: true
  }
})

const getProgressColor = (percentage) => {
  if (percentage > 90) return '#f56c6c'
  if (percentage > 70) return '#e6a23c'
  return '#67c23a'
}
</script>

<style scoped>
.budget-progress {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.budget-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.budget-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.budget-category {
  font-weight: 500;
}

.budget-amount {
  color: var(--el-text-color-secondary);
}

.budget-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

:deep(.el-progress-bar) {
  padding-right: 0;
  margin-right: 0;
}
</style>