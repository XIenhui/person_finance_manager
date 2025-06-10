<template>
  <div class="daily-report">
    <el-card shadow="never" class="query-card">
    <el-form :model="queryForm" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="5">
          <el-form-item label="时间范围">
            <el-select v-model="timeRangeType" @change="handleTimeRangeTypeChange">
              <el-option label="指定日期" value="date" />
              <el-option label="指定月份" value="month" />
              <el-option label="指定年份" value="year" />
              <el-option label="自定义范围" value="custom" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="14" v-if="timeRangeType === 'date'">
          <el-form-item label="选择日期">
            <el-date-picker
                v-model="queryForm.date"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                @change="getList"
            />
          </el-form-item>
        </el-col>
        <el-col :span="14" v-if="timeRangeType === 'month'">
          <el-form-item label="选择月份">
            <el-date-picker
                v-model="queryForm.month"
                type="month"
                placeholder="选择月份"
                value-format="YYYY-MM"
                @change="getList"
            />
          </el-form-item>
        </el-col>

        <el-col :span="14" v-if="timeRangeType === 'year'">
          <el-form-item label="选择年份">
            <el-date-picker
                v-model="queryForm.year"
                type="year"
                placeholder="选择年份"
                value-format="YYYY"
                @change="getList"
            />
          </el-form-item>
        </el-col>

        <template v-if="timeRangeType === 'custom'">
          <el-col :span="14" style="display: flex;">
            <el-form-item label="开始时间">
              <el-date-picker
                  v-model="queryForm.timeRange"
                  type="datetimerange"
                  placeholder="选择时间范围"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  @change="handleDateRangeChange"
              />
            </el-form-item>
          </el-col>
        </template>

        <el-col :span="5">
          <el-form-item label="余额调整" label-width="120px">
            <el-switch
                v-model="queryForm.show_adjust"
                :active-value="1"
                :inactive-value="0"
                @change="getList"
            >
            </el-switch>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="5">
          <el-form-item label="交易类型">
            <el-select v-model="queryForm.type" clearable placeholder="全部类型"
                       @change="getList">
              <el-option label="收入" value="income" />
              <el-option label="支出" value="expense" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="5">
          <el-form-item label="账目级别">
            <el-select v-model="queryForm.categoryLevel" clearable placeholder="全部级别"
                       @change="getList">
              <el-option label="一级分类" :value="1" />
              <el-option label="二级分类" :value="2" />
              <el-option label="三级分类" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="父账目">
            <category-select
                v-model="queryForm.parentCategoryId"
                placeholder="请选择账目"
                @change="getList"
                style="width: 100%"
            ></category-select>
          </el-form-item>
        </el-col>

        <el-col :span="8" style="text-align: right;">
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="primary" @click="getList">查询</el-button>
        </el-col>
      </el-row>
    </el-form>
  </el-card>

    <el-card shadow="never" class="report-card" v-loading="tableLoading">
      <div class="report-header">
        <div class="summary-row">
          <div class="summary-item income">
            <span class="label">总收入</span>
            <span class="amount">¥{{ formatAmount(reportData.summary?.total_income ?? 0) }}</span>
          </div>
          <div class="summary-item expense">
            <span class="label">总支出</span>
            <span class="amount">¥{{ formatAmount(reportData.summary?.total_expense ?? 0) }}</span>
          </div>
          <div
            class="summary-item net"
            :class="
            {
              negative: reportData.summary?.net_income < 0,
              positive: reportData.summary?.net_income > 0
            }"
          >
            <span class="label">净收入</span>
            <span class="amount">¥{{ formatAmount(reportData.summary?.net_income ?? 0) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">交易数</span>
            <span class="amount">{{ reportData.summary?.transaction_count ?? 0 }}</span>
          </div>
        </div>
        <div>
          <el-button type="primary" @click="changeSummary">
            {{ `切换${summaryType === 'table' ? '图示' : '表格'}` }}
          </el-button>
        </div>
      </div>
      <template v-if="reportData.summary?.transaction_count">
        <template v-if="summaryType === 'table'">
          <el-row :gutter="20" class="detail-sections">
            <el-col
                v-if="queryForm.type !== 'expense'"
                :span="queryForm.type === 'income' ? 24 : 12"
                style="height: 100%"
            >
              <el-card shadow="never" class="table-card">
                <div slot="header" class="section-header">
                  <span>收入明细</span>
                  <span class="total">合计: ¥{{ formatAmount(reportData.summary.total_income) }}</span>
                </div>
                <el-table :data="reportData.details.income" stripe class="com-table">
                  <el-table-column prop="category_name" label="账目" />
                  <el-table-column prop="amount" label="金额" align="right" sortable>
                    <template #default="{ row }">
                      <span class="income-amount">¥{{ formatAmount(row.amount) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="占比" align="right">
                    <template #default="{ row }">
                      {{ calculatePercentage(row.amount, reportData.summary.total_income) }}%
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-col>
            <el-col
                v-if="queryForm.type !== 'income'"
                :span="queryForm.type === 'expense' ? 24 : 12"
                style="height: 100%"
            >
              <el-card shadow="never" class="table-card" >
                <div slot="header" class="section-header">
                  <span>支出明细</span>
                  <span class="total">合计: ¥{{ formatAmount(reportData.summary.total_expense) }}</span>
                </div>
                <el-table :data="reportData.details.expense" stripe class="com-table">
                  <el-table-column prop="category_name" label="账目" />
                  <el-table-column prop="amount" label="金额" align="right" sortable>
                    <template #default="{ row }">
                      <span class="expense-amount">¥{{ formatAmount(row.amount) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="占比" align="right">
                    <template #default="{ row }">
                      {{ calculatePercentage(row.amount, reportData.summary.total_expense) }}%
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-col>
          </el-row>
        </template>
        <template v-else>
          <div class="chart-container">
            <ReportChart
                :income-data="reportData.details.income"
                :expense-data="reportData.details.expense"
                :show-type="queryForm.type || 'both'"
            />
          </div>
        </template>
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
import dayjs from "dayjs";
import CategorySelect from "@/components/select/CategorySelect.vue";
import ReportChart from "@/views/report/custom/components/ReportChart.vue";
export default {
  name: 'DailyReport',
  components: {CategorySelect, ReportChart},
  data() {
    return {
      summaryType: 'table',
      tableLoading: false,
      timeRangeType: 'date',
      queryForm: {
        date: getCurrentDate('YYYY-MM-DD'),
        month: '',
        year: '',
        timeRange: [],
        type: '',
        show_adjust: 0,
        categoryLevel: '',
        parentCategoryId: ''
      },
      reportData: '',
      parentCategories: []
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
    changeSummary() {
      this.summaryType = this.summaryType === 'table' ? 'chart' : 'table'
      this.setLoading()
    },
    handleDateRangeChange() {
      this.getList()
    },
    handleTimeRangeTypeChange() {
      // 切换时间范围类型时清空其他时间字段
      this.queryForm.date = '';
      this.queryForm.month = '';
      this.queryForm.year = '';
      this.queryForm.startTime = '';
      this.queryForm.endTime = '';

      // 设置默认值
      if (this.timeRangeType === 'date') {
        this.queryForm.date = dayjs().format('YYYY-MM-DD');
      } else if (this.timeRangeType === 'month') {
        this.queryForm.month = dayjs().format('YYYY-MM');
      } else if (this.timeRangeType === 'year') {
        this.queryForm.year = dayjs().format('YYYY');
      } else {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - 30)
        this.queryForm.timeRange = [formatDate(startDate), formatDate(endDate)]
      }
      this.getList()
    },
    resetQuery() {
      this.queryForm = {
        date: dayjs().format('YYYY-MM-DD'),
        month: '',
        year: '',
        timeRange: [],
        type: '',
        show_adjust: 0,
        categoryLevel: '',
        parentCategoryId: ''
      };
      this.timeRangeType = 'date';
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
      try {
        // 构建查询参数
        const params = {
          type: this.queryForm.type,
          categoryLevel: this.queryForm.categoryLevel,
          parentCategoryId: Array.isArray(this.queryForm.parentCategoryId)
              ? this.queryForm.parentCategoryId[this.queryForm.parentCategoryId.length - 1]
              : this.queryForm.parentCategoryId,
          show_adjust: this.queryForm.show_adjust,
        };

        // 设置时间参数
        if (this.timeRangeType === 'date') {
          params.date = this.queryForm.date;
        } else if (this.timeRangeType === 'month') {
          params.month = this.queryForm.month;
        } else if (this.timeRangeType === 'year') {
          params.year = this.queryForm.year;
        } else if (this.timeRangeType === 'custom') {
          if (this.queryForm.timeRange[0]) {
            params.startTime = this.queryForm.timeRange[0];
          }
          if (this.queryForm.timeRange[1]) {
            params.endTime = this.queryForm.timeRange[1];
          }
        }

        this.tableLoading = true
        // 调用API获取报表数据
        const res = await reqList(params);
        this.reportData = res.data;
      } catch (error) {
        console.error('获取报表数据失败:', error);
        this.$message.error('获取报表数据失败');
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
  height: 120px;
}

.report-card {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.report-header {
  display: flex;
  justify-content: space-between;
  height: 36px;
  text-align: center;
}

.report-header h2 {
  margin-bottom: 20px;
  color: #333;
}

.com-table {

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
  justify-content: start;
  gap: 12px;
}

.summary-item {
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 8px;
  border-radius: 4px;
  min-width: 120px;
  line-height: 16px;
}

.summary-item .label {
  color: #666;
}

.summary-item .amount {
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

.summary-item.net.positive .amount {
  color: #67c23a;
}

.detail-sections {
  flex: 1;
  min-height: 0;
}

.section-header {
  height: 20px;
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
.chart-container {
  width: 100%;
  height: calc(100% - 60px); /* 减去汇总信息的高度 */
  margin-top: 20px;
}
</style>