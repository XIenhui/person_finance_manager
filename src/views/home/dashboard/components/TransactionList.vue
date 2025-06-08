<template>
  <el-table :data="transactions" style="width: 100%" stripe class="com-table">
    <el-table-column prop="transaction_date" label="交易时间" width="180" sortable>
      <template #default="{ row }">
        {{ formatDate(row.transaction_date, 'YYYY-MM-DD HH:mm:ss') }}
      </template>
    </el-table-column>
    <el-table-column prop="accountName" label="账户" width="100">
      <template #default="{ row }">
        <span style="margin-right: 8px">{{ row.account_name }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="categoryName" label="账目" width="80">
      <template #default="{ row }">
        <el-tag
            v-if="row.transaction_type === 'TRANSFER'"
            :type="row.amount > 0 ? 'success' : 'danger'"
            size="small"
        >
          {{ row.amount > 0 ? '转账-收入方' : '转账-支出方' }}
        </el-tag>
        <span v-else>{{ row.category_name }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="amount" label="金额" width="100" align="right" sortable>
      <template #default="{ row }">
            <span :style="{ color: row.amount > 0 ? '#67C23A' : '#F56C6C' }">
              {{ row.amount > 0 ? '+' : '' }}{{ formatAmount(row.amount) }}
            </span>
      </template>
    </el-table-column>
    <el-table-column prop="balance_after" label="余额" width="100" align="right" sortable>
      <template #default="{ row }">
            <span :style="{ color: row.balance_after > 0 ? '#67C23A' : '#F56C6C' }">
              {{ formatAmount(row.balance_after) }}
            </span>
      </template>
    </el-table-column>
    <el-table-column prop="transaction_date" label="创建时间" width="180" sortable>
      <template #default="{ row }">
        {{ formatDate(row.created_at, 'YYYY-MM-DD HH:mm:ss') }}
      </template>
    </el-table-column>
    <el-table-column prop="transaction_date" label="更新时间" width="180" sortable>
      <template #default="{ row }">
        {{ formatDate(row.updated_at, 'YYYY-MM-DD HH:mm:ss') }}
      </template>
    </el-table-column>
    <el-table-column prop="description" label="备注"/>
  </el-table>
</template>

<script setup>
import {formatDate} from "@/utils/date.js";
import AccountTypeTag from "@/components/UI/AccountTypeTag.vue";

defineProps({
  transactions: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete'])
const formatAmount = (amount) => {
  return Number(amount).toFixed(2)
}
const handleEdit = (transaction) => {
  emit('edit', transaction)
}

const handleDelete = (transaction) => {
  emit('delete', transaction)
}
</script>
<style scoped>
  .com-table {
    height: 500px;
  }
</style>