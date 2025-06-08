<template>
  <div class="page">
    <!-- 顶部标题和统计卡片 -->
    <div class="header">
      <div class="stats-cards">
        <el-card shadow="hover" class="stat-card income">
          <div class="card-content">
            <div class="card-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="card-text">
              <div class="card-title">本月收入</div>
              <div class="card-value" v-if="stats.month_income?.amount">
                ¥{{ stats.month_income?.amount }}
              </div>
              <div class="card-change" v-if="stats.month_income?.amount">
                {{ stats.month_income?.growth_rate }}% 变化
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="stat-card expense">
          <div class="card-content">
            <div class="card-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="card-text">
              <div class="card-title">本月支出</div>
              <div class="card-value" v-if="stats.month_expense?.amount">
                ¥{{ stats.month_expense?.amount }}
              </div>
              <div class="card-change" v-if="stats.month_expense?.amount">
                {{ `${stats.month_expense?.growth_rate}% 变化` }}
              </div>
            </div>
          </div>
        </el-card>

<!--        <el-card shadow="hover" class="stat-card budget">-->
<!--          <div class="card-content">-->
<!--            <div class="card-icon">-->
<!--              <el-icon><PieChart /></el-icon>-->
<!--            </div>-->
<!--            <div class="card-text">-->
<!--              <div class="card-title">预算剩余</div>-->
<!--              <div class="card-value">-->
<!--                {{ stats.restBudget?.value ?  stats.restBudget.value : '暂无预算' }}-->
<!--              </div>-->
<!--              <div v-show="stats.restBudget?.value" class="card-change">-->
<!--                剩余{{ stats.restBudget?.rest }}%-->
<!--              </div>-->
<!--            </div>-->
<!--          </div>-->
<!--        </el-card>-->


        <el-card shadow="hover" class="stat-card useful">
          <div class="card-content">
            <div class="card-icon">
              <el-icon><Coin /></el-icon>
            </div>
            <div class="card-text">
              <div class="card-title">可用余额</div>
              <div class="card-value">¥{{ stats.total_rest?.amount ?? '--' }}</div>
              <div class="card-change" v-if="stats.total_rest?.amount">
                本月计划待消费 ¥{{ 0 }}
              </div>
              <div class="card-change" v-if="stats.total_rest?.amount">
                预计剩余 ¥{{ stats.total_rest?.amount - 0  }}
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="stat-card net-worth">
          <div class="card-content">
            <div class="card-icon">
              <el-icon><Coin /></el-icon>
            </div>
            <div class="card-text">
              <div class="card-title">净资产</div>
              <div class="card-value">¥{{ stats.total_assets?.amount }}</div>
              <div class="card-change" v-if="stats.total_assets?.amount">
                {{ stats.total_assets?.growth_rate }}% 变化
              </div>
              <div class="card-change" v-if="stats.total_assets?.amount">
                {{ (stats.month_income?.amount - stats.month_expense?.amount).toFixed(2) }} 变化
              </div>
            </div>
          </div>
        </el-card>

      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 左侧内容 -->
      <div class="left-section">
        <!-- 快速添加交易 -->
        <el-card shadow="hover" class="quick-add-card">
          <template #header>
            <div class="card-header">
              <span>快速记录交易</span>
              <el-button type="primary" size="small" @click="dialogVisible = true">
                完整表单
              </el-button>
            </div>
          </template>
          <QuickTransactionForm @confirm="getTransList"></QuickTransactionForm>
        </el-card>

        <!-- 最近交易 -->
        <el-card shadow="hover" class="recent-transactions">
          <template #header>
            <div class="card-header">
              <span>最近交易</span>
              <el-link type="primary" underline="never" @click="goToTransactions">
                查看全部 <el-icon><ArrowRight /></el-icon>
              </el-link>
            </div>
          </template>
          <TransactionList :transactions="recentTransactions" />
        </el-card>
      </div>

      <!-- 右侧内容 -->
      <div class="right-section">
        <!-- 预算状态 -->
        <el-card shadow="hover" class="budget-status">
          <template #header>
            <div class="card-header">
              <span>预算状态</span>
              <el-link type="primary" underline="never" @click="goToBudgets">
                管理预算 <el-icon><ArrowRight /></el-icon>
              </el-link>
            </div>
          </template>
          <BudgetProgress :budgets="budgets" />
        </el-card>

        <!-- 账户余额 -->
        <el-card shadow="hover" class="account-balance">
          <template #header>
            <div class="card-header">
              <span>账户余额</span>
              <el-link type="primary" underline="never" @click="goToAccounts">
                管理账户 <el-icon><ArrowRight /></el-icon>
              </el-link>
            </div>
          </template>
          <AccountBalance :accounts="accounts" />
        </el-card>

        <!-- 支出分类 -->
        <el-card shadow="hover" class="expense-categories">
          <template #header>
            <div class="card-header">
              <span>支出分类</span>
              <el-select
                  v-model="categoryPeriod"
                  size="small"
                  style="width: 100px; margin-left: 10px;"
              >
                <el-option label="今日" value="day" />
                <el-option label="本月" value="month" />
                <el-option label="本年" value="year" />
              </el-select>
              <el-link type="primary" underline="never" @click="goToReport">
                完整报表 <el-icon><ArrowRight /></el-icon>
              </el-link>
            </div>
          </template>
          <ExpenseCategories :period="categoryPeriod" />
        </el-card>
      </div>
    </div>

    <TransactionDialog
        v-model="dialogVisible"
        :mode="'add'"
        @confirm="handleDialogSubmit"
    />
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue'
import { useRouter } from 'vue-router'
import {
  TrendCharts,
  Money,
  PieChart,
  Coin,
  ArrowRight
} from '@element-plus/icons-vue'

// 组件
import QuickTransactionForm from './components/QuickTransactionForm.vue'
import TransactionList from './components/TransactionList.vue'
import BudgetProgress from './components/BudgetProgress.vue'
import AccountBalance from './components/AccountBalance.vue'
import ExpenseCategories from './components/ExpenseCategories.vue'
import TransactionDialog from "@/views/business/transaction/components/MuitiTransactionDialog.vue";
import {reqAccountList, reqStat, reqTransList} from "@/views/home/dashboard/api.js";
import {ElMessage} from "element-plus";

const router = useRouter()
const dialogVisible = ref(false);
// 数据
const stats = ref({
  month_income: {},
  month_expense: {},
  total_rest: {},
  total_assets: {},
})
const recentTransactions = ref([])
const budgets = ref([])
const accounts = ref([])
const categoryPeriod = ref('month')


const handleDialogSubmit = () => {

}
const getStat = () => {
  reqStat().then((res) => {
    if (res.code === 200 && res.data) {
      stats.value = res.data
    }
  }).catch((error) =>{
    ElMessage.error(error)
  })
}
const getAccount = () => {
  reqAccountList().then((res) => {
    if (res.code === 200 && res.data) {
      accounts.value = res.data.records || []
    }
  }).catch((error) =>{
    ElMessage.error(error)
  })
}
const getTransList = () => {
  reqTransList().then((res) => {
    if (res.code === 200 && res.data) {
      recentTransactions.value = res.data.list || []
    }
  }).catch((error) =>{
    ElMessage.error(error)
  })
}
const goToTransactions = () => {
  router.push('/business/transaction')
}
const goToBudgets = () => {
  router.push('/account/budget')
}
const goToAccounts = () => {
  router.push('/account/manage')
}
const goToReport = () => {
  router.push(`/report/category`)
}
onMounted(() => {
  getStat();
  getAccount();
  getTransList();
})
</script>

<style scoped>

.page {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header {
  height: 110px;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 500;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  border-top: 4px solid transparent;
}

.stat-card.income {
  border-top-color: var(--el-color-success);
}

.stat-card.expense {
  border-top-color: var(--el-color-danger);
}

.stat-card.useful {
  border-top-color: var(--el-color-warning);
}

.stat-card.net-worth {
  border-top-color: var(--el-color-primary);
}

.card-content {
  display: flex;
  align-items: center;
}

.card-icon {
  margin-right: 15px;
  font-size: 28px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card.income .card-icon {
  background-color: rgba(var(--el-color-success-rgb), 0.1);
  color: var(--el-color-success);
}

.stat-card.expense .card-icon {
  background-color: rgba(var(--el-color-danger-rgb), 0.1);
  color: var(--el-color-danger);
}

.stat-card.useful .card-icon {
  background-color: rgba(var(--el-color-warning-rgb), 0.1);
  color: var(--el-color-warning);
}

.stat-card.net-worth .card-icon {
  background-color: rgba(var(--el-color-primary-rgb), 0.1);
  color: var(--el-color-primary);
}

.card-title {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 5px;
}

.card-value {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 5px;
}

.card-change {
  font-size: 12px;
}

.main-content {
  width: 100%;
  display: flex;
  gap: 12px;
}

.left-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.right-section {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .main-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>