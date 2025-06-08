<template>
  <div class="daily-report">
    <el-card shadow="never" class="query-card">
      <el-form :inline="true" :model="queryForm">
        <el-form-item label="报表日期">
          <el-date-picker
              v-model="queryForm.date"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              @change="getList"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getList">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="report-card" v-loading="tableLoading">
      <template v-if="reportData" >
        <div class="report-header">
          <div class="summary-row">
            <div class="summary-item income">
              <div class="label">总收入</div>
              <div class="amount">¥{{ formatAmount(reportData.total_income) }}</div>
            </div>
            <div class="summary-item expense">
              <div class="label">总支出</div>
              <div class="amount">¥{{ formatAmount(reportData.total_expense) }}</div>
            </div>
            <div class="summary-item net" :class="{ negative: reportData.net_income < 0 }">
              <div class="label">净收入</div>
              <div class="amount">¥{{ formatAmount(reportData.net_income) }}</div>
            </div>
            <div class="summary-item">
              <div class="label">交易数</div>
              <div class="amount">{{ reportData.transaction_count }}</div>
            </div>
          </div>
        </div>

        <el-row :gutter="20" class="detail-sections">
          <el-col :span="12">
            <el-card shadow="never" class="table-card">
              <div slot="header" class="section-header">
                <span>收入明细</span>
                <span class="total">合计: ¥{{ formatAmount(reportData.total_income) }}</span>
              </div>
              <el-table :data="reportData.income_details" stripe class="com-table">
                <el-table-column prop="category_name" label="账目" />
                <el-table-column prop="amount" label="金额" align="right">
                  <template #default="{ row }">
                    <span class="income-amount">¥{{ formatAmount(row.amount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="占比" align="right">
                  <template #default="{ row }">
                    {{ calculatePercentage(row.amount, reportData.total_income) }}%
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never" class="table-card">
              <div slot="header" class="section-header">
                <span>支出明细</span>
                <span class="total">合计: ¥{{ formatAmount(reportData.total_expense) }}</span>
              </div>
              <el-table :data="reportData.expense_details" stripe class="com-table">
                <el-table-column prop="category_name" label="账目" />
                <el-table-column prop="amount" label="金额" align="right">
                  <template #default="{ row }">
                    <span class="expense-amount">¥{{ formatAmount(row.amount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="占比" align="right">
                  <template #default="{ row }">
                    {{ calculatePercentage(row.amount, reportData.total_expense) }}%
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </template>
      <template v-else class="no-data">
        <el-empty description="暂无报表数据" />
      </template>
    </el-card>
  </div>
</template>

<script>
import {formatDate, getCurrentDate} from '@/utils/date';
import { reqList } from './api.js'
export default {
  name: 'DailyReport',
  data() {
    return {
      tableLoading: false,
      queryForm: {
        date: getCurrentDate('YYYY-MM-DD') // 默认当天
      },
      reportData: null
    }
  },
  mounted() {
    this.getList()
  },
  methods: {
    setLoading(time = 200)  {
      this.tableLoading = true
      const timer = setTimeout(() => {
        this.tableLoading = false
        clearTimeout(timer);
      }, time)
    },
    formatDate,
    formatAmount(amount) {
      return Number(amount || 0).toFixed(2)
    },
    calculatePercentage(amount, total) {
      if (!total || total === 0) return 0
      return ((amount / total) * 100).toFixed(1)
    },
    async getList() {
      if (!this.queryForm.date) return

      try {
        this.tableLoading = true
        const res = await reqList({date: formatDate(this.queryForm.date, 'YYYY-MM-DD')})
        this.reportData = res.data
      } catch (error) {
        console.error('获取报表数据失败:', error)
        this.$message.error(error || '获取报表数据失败')
      } finally {
        this.setLoading()
      }
    }
  }
}
</script>

<style scoped>
.daily-report {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px)
}

.query-card {
  margin-bottom: 20px;
  height: 80px;
}

.report-card {
  height: 100%;
}

.report-header {
  height: 100px;
  text-align: center;
}

.report-header h2 {
  margin-bottom: 20px;
  color: #333;
}

.com-table {
  height: 100%;
}

:deep(.report-card .el-card__body) {
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.table-card {
  height: 100%;
}

.summary-row {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 20px;
}

.summary-item {
  padding: 20px;
  border-radius: 4px;
  text-align: center;
  min-width: 150px;
}

.summary-item .label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.summary-item .amount {
  font-size: 24px;
  font-weight: bold;
}

.summary-item.income {
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
}

.summary-item.income .amount {
  color: #67c23a;
}

.summary-item.expense {
  background-color: #fef0f0;
  border: 1px solid #fde2e2;
}

.summary-item.expense .amount {
  color: #f56c6c;
}

.summary-item.net {
  background-color: #f4f4f5;
  border: 1px solid #e9e9eb;
}

.summary-item.net .amount {
  color: #909399;
}

.summary-item.net.negative .amount {
  color: #f56c6c;
}

.detail-sections {
  margin-top: 20px;
  flex: 1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header .total {
  font-weight: bold;
}

.income-amount {
  color: #67c23a;
}

.expense-amount {
  color: #f56c6c;
}

.no-data {
  padding: 50px 0;
  text-align: center;
}
</style>