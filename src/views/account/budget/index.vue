<template>
  <div class="page-wrapper">
    <!-- 标题和操作按钮 -->
    <el-row justify="space-between" style="margin-bottom: 20px;">
      <h2>预算管理</h2>
      <el-button type="primary" @click="handleAdd">新增预算</el-button>
    </el-row>

    <!-- 预算表格 -->
    <el-table :data="budgetList" border stripe style="width: 100%;">
      <el-table-column prop="category" label="分类" width="150" />
      <el-table-column prop="amount" label="预算金额" width="120">
        <template #default="{ row }">¥ {{ row.amount.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="used" label="本月支出" width="120">
        <template #default="{ row }">¥ {{ row.used.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="使用进度">
        <template #default="{ row }">
          <el-progress
              :percentage="Math.min((row.used / row.amount) * 100, 100)"
              :status="getProgressStatus(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 合计信息 -->
    <div class="summary-bar">
      <span>预算总额：¥ {{ totalBudget.toFixed(2) }}</span>
      <span>本月支出总额：¥ {{ totalUsed.toFixed(2) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';

const budgetList = ref([
  { id: 1, category: '餐饮', amount: 1000, used: 650 },
  { id: 2, category: '交通', amount: 500, used: 200 },
  { id: 3, category: '购物', amount: 800, used: 950 }
]);

const totalBudget = computed(() => budgetList.value.reduce((sum, b) => sum + b.amount, 0));
const totalUsed = computed(() => budgetList.value.reduce((sum, b) => sum + b.used, 0));

const getProgressStatus = (row) => {
  const percent = row.used / row.amount;
  if (percent > 1) return 'exception';
  if (percent > 0.8) return 'warning';
  return 'success';
};

const handleAdd = () => {
  ElMessage.info("打开新增预算表单（模拟）");
};

const handleEdit = (row) => {
  ElMessage.info(`编辑预算分类：${row.category}`);
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确认删除「${row.category}」预算？`, '提示', {
    type: 'warning'
  }).then(() => {
    budgetList.value = budgetList.value.filter((b) => b.id !== row.id);
    ElMessage.success("删除成功");
  });
};
</script>

<style scoped>
.page-wrapper {
  padding: 20px;
}

.summary-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  font-weight: bold;
}
</style>
