<template>
  <el-scrollbar style="width: 100%; height: 250px">
    <div class="account-balance">
      <el-empty v-if="accounts.length === 0" description="暂无账户数据" />
      <div v-for="account in accounts" :key="account.id" class="account-item">
        <div class="account-info">
          <div class="account-name">{{ account.account_name }}</div>
          <div class="account-type">{{ account.type }}</div>
        </div>
        <div class="account-amount">
          <span class="currency">{{ account.currency }}</span>
          {{ account.balance.toLocaleString() }}
        </div>
      </div>
    </div>
  </el-scrollbar>
  <div class="total-balance">
    <span>总余额:</span>
    <span class="amount">
        {{ totalBalance.toLocaleString() }}
      </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  accounts: {
    type: Array,
    required: true
  }
})

const totalBalance = computed(() => {
  return props.accounts.reduce((sum, account) => sum + Number(account.balance), 0)
})
</script>

<style scoped>
.account-balance {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
}

.account-info {
  display: flex;
  flex-direction: column;
}

.account-name {
  font-weight: 500;
  margin-bottom: 3px;
}

.account-type {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.account-amount {
  font-weight: 600;
  font-size: 16px;
}

.currency {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-right: 3px;
}

.total-balance {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--el-border-color);
  font-weight: 500;
}

.total-balance .amount {
  font-weight: 600;
  color: var(--el-color-primary);
}
</style>