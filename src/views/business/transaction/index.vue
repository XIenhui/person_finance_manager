<template>
  <div class="transaction-bill">
    <!-- 查询区域 -->
    <el-card shadow="never" class="query-card">
      <el-form :model="queryParams" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="交易类型">
              <el-select
                  v-model="queryParams.type"
                  placeholder="全部类型"
                  clearable
                  @change="handleQuery"
              >
                <el-option label="收入" value="income" />
                <el-option label="支出" value="expense" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="账户">
              <account-select
                  v-model="queryParams.accountId"
                  :immediate="true"
                  placeholder="请选择账户"
                  @change="handleAccountChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="账目">
              <category-select
                  v-model="queryParams.categoryId"
                  placeholder="请选择账目"
                  @change="handleCategoryChange"
              ></category-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="时间范围">
              <el-date-picker
                  v-model="queryParams.dateRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  @change="getList"
                  style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="金额范围">
              <el-input-number
                  v-model="queryParams.minAmount"
                  placeholder="最小值"
                  :min="0"
                  :controls="false"
                  style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label-width="10px">
              <el-input-number
                  v-model="queryParams.maxAmount"
                  placeholder="最大值"
                  :min="queryParams.minAmount || 0"
                  :controls="false"
                  style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" style="text-align: right; padding-top: 5px">
            <el-button @click="resetQuery">重置</el-button>
            <el-button type="primary" @click="() => handleQuery()">查询</el-button>
            <el-button type="success" @click="showAddDialog">
              <el-icon><Plus /></el-icon> 添加交易
            </el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card shadow="never" class="table-card">
      <el-table
          v-loading="tableLoading"
          :data="transactionList"
          stripe
          style="width: 100%;height: 100%;"
      >
        <el-table-column prop="transaction_no" label="交易编号" width="120" align="center" sortable/>
        <el-table-column prop="transaction_date" label="交易时间" width="180" sortable>
          <template #default="{ row }">
            {{ formatDate(row.transaction_date, 'YYYY-MM-DD HH:mm:ss') }}
          </template>
        </el-table-column>
        <el-table-column prop="accountName" label="账户" width="300">
          <template #default="{ row }">
            <span style="margin-right: 8px">{{ row.account_name }}</span>
            <account-type-tag :info="{
              name: row.type_name,
              color: row.type_color,
              icon: row.type_icon
            }"></account-type-tag>
            <el-tag
                v-if="row.is_digital"
                size="small"
                effect="plain"
                style="margin-left: 8px"
                disable-transitions
            >
              电子
            </el-tag>
            <el-tag
                v-if="row.can_overdraft"
                size="small"
                type="warning"
                effect="plain"
                style="margin-left: 4px"
                disable-transitions
            >
              透支
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="账目" width="150">
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
        <el-table-column prop="amount" label="金额" width="120" align="right" sortable>
          <template #default="{ row }">
            <span :style="{ color: row.amount > 0 ? '#67C23A' : '#F56C6C' }">
              {{ row.amount > 0 ? '+' : '' }}{{ formatAmount(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance_after" label="余额" width="120" align="right" sortable>
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
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
            v-model:current-page="queryParams.pageNum"
            v-model:page-size="queryParams.pageSize"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleQuery"
            @current-change="handleQuery"
        />
      </div>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <MuitiTransactionDialog
        v-model="dialogVisible"
        :mode="'add'"
        @confirm="handleDialogSubmit"
    />
    <TransactionEditDialog
        v-model="editDialogVisible"
        :mode="'edit'"
        :transaction="currentTransaction"
        @confirm="handleEditDialogSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import TransactionDialog from './components/MuitiTransactionDialog.vue'
import { formatDate } from '@/utils/date'
import { ElMessage, ElMessageBox } from 'element-plus'
import AccountSelect from '@/components/select/AccountSelect.vue'
import {
  reqList,
  reqAdd,
  reqEdit,
  reqDelete,
} from './api.js'
import CategorySelect from "@/components/select/CategorySelect.vue";
import AccountTypeTag from "@/components/UI/AccountTypeTag.vue";
import dayjs from "dayjs";
import MuitiTransactionDialog from "@/views/business/transaction/components/MuitiTransactionDialog.vue";
import TransactionEditDialog from "@/views/business/transaction/components/TransactionEditDialog.vue";

// 查询参数
const queryParams = ref({
  type: '',
  accountId: '',
  categoryId: '',
  dateRange: [],
  minAmount: NaN,
  maxAmount: NaN,
  pageNum: 1,
  pageSize: 10
})
const tableLoading = ref(false)
// 数据列表
const transactionList = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const editDialogVisible = ref(false)
const dialogMode = ref('add')
const currentTransaction = ref(null)

// 格式化金额显示
const formatAmount = (amount) => {
  return Number(amount).toFixed(2)
}
const setLoading = (time = 200) => {
  tableLoading.value = true
  const timer = setTimeout(() => {
    tableLoading.value = false
    clearTimeout(timer);
  }, time)
}
// 获取交易列表
const getList = async () => {
  try {
    tableLoading.value = true

    // 构造API请求参数
    const params = {
      page: queryParams.value.pageNum,
      pageSize: queryParams.value.pageSize,
      transactionType: queryParams.value.type,
      accountId: queryParams.value.accountId,
      categoryId: queryParams.value.categoryId,
      startTime: queryParams.value.dateRange?.[0]
          ? formatDate(queryParams.value.dateRange[0], 'YYYY-MM-DD HH:mm:ss')
          : '',
      endTime: queryParams.value.dateRange?.[1]
          ? formatDate(queryParams.value.dateRange[1], 'YYYY-MM-DD HH:mm:ss')
          : '',
      minAmount: Number.isNaN(queryParams.value.minAmount) ? '' : queryParams.value.minAmount,
      maxAmount: Number.isNaN(queryParams.value.maxAmount) ? '' : queryParams.value.maxAmount,
    }

    const res = await reqList(params)
    transactionList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取交易列表失败:', error)
    ElMessage.error('获取交易列表失败')
  } finally {
    setLoading()
  }
}

const handleAccountChange = () => {
  handleQuery()
}

const handleCategoryChange = () => {
  handleQuery()
}

const handleQuery = (page = 1) => {
  queryParams.value.pageNum = page
  getList()
}

// 重置查询
const resetQuery = () => {
  queryParams.value = {
    type: '',
    accountId: '',
    categoryId: '',
    dateRange: [],
    minAmount: NaN,
    maxAmount: NaN,
    pageNum: 1,
    pageSize: 10
  }
  handleQuery()
}

// 显示添加对话框
const showAddDialog = () => {
  currentTransaction.value = null
  dialogVisible.value = true
}

// 编辑交易
const handleEdit = (row) => {

  // 根据API返回的数据结构转换
  currentTransaction.value = {
    id: row.id,
    type: row.transaction_type,
    date: row.transaction_date,
    account: row.account_id,
    category: row.category_id,
    amount: Math.abs(row.amount),
    note: row.note,
    // 如果是转账交易
    ...(row.transaction_type === 'transfer' && {
      transferAccount: row.payer,
      receiveAccount: row.payee,
    })
  }

  editDialogVisible.value = true
}

// 删除交易
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
        `确定要删除这笔交易记录吗? ${row.transactionType === 'TRANSFER' ? '相关的转账记录也将被删除' : ''}`,
        '提示',
        {
          type: 'warning',
          confirmButtonText: '确认',
          cancelButtonText: '取消',
        }
    )

    await reqDelete(row.id)
    ElMessage.success('删除成功')
    getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除交易失败:', error)
      ElMessage.error('删除交易失败')
    }
  }
}

// 处理对话框提交
const handleDialogSubmit =  () => {
  dialogVisible.value = false
  getList()
}
const handleEditDialogSubmit =  () => {
  editDialogVisible.value = false
  getList()
}

// 初始化数据
onMounted(() => {
  // 设置默认时间范围为最近30天
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 30)
  queryParams.value.dateRange = [startDate, endDate]

  getList()
})
</script>

<style scoped>
.transaction-bill {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px)
}

.query-card {
  margin-bottom: 20px;
  height: 144px;
}

.table-card {
  height: 100%;
}

.pagination {
  height: 30px;
  display: flex;
  justify-content: flex-end;
}
:deep(.table-card .el-card__body) {
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>