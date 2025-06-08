<template>
  <div class="transaction-bill">
    <!-- 查询区域 -->
    <el-card shadow="never" class="query-card">
      <el-form :model="queryParams" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="交易类型">
              <el-select v-model="queryParams.type" placeholder="全部类型" clearable>
                <el-option label="收入" value="income" />
                <el-option label="支出" value="expense" />
                <el-option label="转账" value="transfer" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="账户">
              <el-select v-model="queryParams.account" placeholder="全部账户" clearable>
                <el-option
                    v-for="account in allAccounts"
                    :key="account"
                    :label="account"
                    :value="account"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="账目">
              <el-cascader
                  v-model="queryParams.category"
                  :options="categories"
                  :props="{ label: 'name', value: 'id', children: 'children' }"
                  placeholder="全部账目"
                  clearable
                  style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="时间范围">
              <el-date-picker
                  v-model="queryParams.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
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
            <el-button type="primary" @click="handleQuery">查询</el-button>
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
          :data="processedTransactions"
          border
          stripe
          style="width: 100%"
          v-loading="loading"
      >
        <el-table-column prop="id" label="交易编号" width="100" align="center" />
        <el-table-column prop="date" label="交易时间" width="150" sortable>
          <template #default="{ row }">
            {{ formatDate(row.date, 'YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>
        <el-table-column prop="account" label="账户" width="120">
          <template #default="{ row }">
            <span v-if="row.type !== 'transfer'">{{ row.account }}</span>
            <span v-else style="color: #888">转账: {{ row.sourceAccount }} → {{ row.account }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="账目" width="150">
          <template #default="{ row }">
            <el-tag
                v-if="row.type === 'transfer'"
                :type="row.amount > 0 ? 'success' : 'danger'"
                size="small"
            >
              {{ row.amount > 0 ? '转账-收入方' : '转账-支出方' }}
            </el-tag>
            <span v-else>{{ row.category }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120" align="right" sortable>
          <template #default="{ row }">
            <span :style="{ color: row.amount > 0 ? '#67C23A' : '#F56C6C' }">
              {{ row.amount > 0 ? '+' : '' }}{{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" />
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
    <TransactionDialog
        v-model="dialogVisible"
        :mode="dialogMode"
        :transaction="currentTransaction"
        :accounts="allAccounts"
        :categories="categories"
        @submit="handleDialogSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import TransactionDialog from './components/TransactionDialog.vue'
import dayjs from '@/utils/date'
import { formatDate, getCurrentDate } from '@/utils/date'
import {ElMessage, ElMessageBox} from "element-plus";

// 在查询参数初始化时使用 dayjs

// 模拟数据
const allAccounts = ref(['现金', '银行卡', '支付宝', '微信支付', '信用卡'])
const categories = ref([
  {
    id: 'income',
    name: '收入',
    children: [
      { id: 'salary', name: '工资' },
      { id: 'bonus', name: '奖金' },
      { id: 'investment', name: '投资收益' }
    ]
  },
  {
    id: 'expense',
    name: '支出',
    children: [
      { id: 'food', name: '餐饮' },
      { id: 'shopping', name: '购物' },
      { id: 'transport', name: '交通' },
      { id: 'entertainment', name: '娱乐' }
    ]
  }
])

const queryParams = ref({
  type: '',
  account: '',
  category: '',
  dateRange: [dayjs().subtract(30, 'day').toDate(), dayjs().toDate()],
  minAmount: '',
  maxAmount: '',
  pageNum: 1,
  pageSize: 10
})

// 原始交易数据（包含转账交易）
const rawTransactions = ref([
  { id: 1, date: '2023-06-15', type: 'expense', account: '支付宝', category: '餐饮', amount: -85, note: '午餐' },
  { id: 2, date: '2023-06-14', type: 'income', account: '银行卡', category: '工资', amount: 8000, note: '六月工资' },
  { id: 3, date: '2023-06-13', type: 'expense', account: '微信支付', category: '购物', amount: -299, note: 'T恤' },
  {
    id: 4,
    date: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    type: 'expense',
    account: '支付宝',
    category: '餐饮',
    amount: -85,
    note: '午餐'
  },
  {
    id: 5,
    date: '2023-06-12',
    type: 'transfer',
    account: '银行卡',
    sourceAccount: '支付宝',
    category: '转账',
    amount: -1000,
    note: '从支付宝转出',
    transferId: 4 // 转账交易关联ID
  },
  { id: 6, date: '2023-06-10', type: 'expense', account: '支付宝', category: '娱乐', amount: -120, note: '电影票' }
])

// 处理后的交易数据（拆分转账交易为两条记录）
const processedTransactions = computed(() => {
  return rawTransactions.value
      .filter(tx => {
        // 处理转账交易的显示逻辑
        if (tx.type === 'transfer') {
          // 如果是转账支出方，修改账目显示
          if (tx.amount < 0) {
            tx = { ...tx, category: '转账-支出方' }
          } else {
            tx = { ...tx, category: '转账-收入方' }
          }
        }
        return tx
      })
      .filter(tx => {
        // 应用查询条件过滤
        if (queryParams.value.type && tx.type !== queryParams.value.type) return false
        if (queryParams.value.account && tx.account !== queryParams.value.account) return false
        if (queryParams.value.category && tx.category !== queryParams.value.category[1]) return false
        if (queryParams.value.minAmount && Math.abs(tx.amount) < queryParams.value.minAmount) return false
        if (queryParams.value.maxAmount && Math.abs(tx.amount) > queryParams.value.maxAmount) return false

        if (queryParams.value.dateRange && queryParams.value.dateRange.length === 2) {
          const date = dayjs(tx.date)
          const start = dayjs(queryParams.value.dateRange[0])
          const end = dayjs(queryParams.value.dateRange[1])
          if (!date.isSameOrAfter(start) || !date.isSameOrBefore(end)) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
})

const loading = ref(false)
const total = ref(rawTransactions.value.length)
const dialogVisible = ref(false)
const dialogMode = ref('add')
const currentTransaction = ref(null)

// 查询方法
const handleQuery = () => {
  loading.value = true
  // 模拟API调用延迟
  setTimeout(() => {
    loading.value = false
  }, 300)
}

// 重置查询
const resetQuery = () => {
  queryParams.value = {
    type: '',
    account: '',
    category: '',
    dateRange: '',
    minAmount: '',
    maxAmount: '',
    pageNum: 1,
    pageSize: 10
  }
  handleQuery()
}

// 显示添加对话框
const showAddDialog = () => {
  dialogMode.value = 'add'
  currentTransaction.value = null
  dialogVisible.value = true
}

// 编辑交易
const handleEdit = (row) => {
  dialogMode.value = 'edit'
  currentTransaction.value = { ...row }

  // 如果是转账交易，需要特殊处理
  if (row.type === 'transfer') {
    const relatedTx = rawTransactions.value.find(
        tx => tx.transferId === row.transferId && tx.id !== row.id
    )
    currentTransaction.value = {
      ...row,
      transferAccount: row.amount > 0 ? row.sourceAccount : row.account,
      receiveAccount: row.amount > 0 ? row.account : row.sourceAccount,
      amount: Math.abs(row.amount)
    }
  }

  dialogVisible.value = true
}

// 删除交易
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
        `确定要删除这笔交易记录吗? ${row.type === 'transfer' ? '相关的转账记录也将被删除' : ''}`,
        '提示',
        { type: 'warning' }
    )

    // 如果是转账交易，删除相关联的两条记录
    if (row.type === 'transfer') {
      rawTransactions.value = rawTransactions.value.filter(
          tx => tx.transferId !== row.transferId
      )
    } else {
      rawTransactions.value = rawTransactions.value.filter(
          tx => tx.id !== row.id
      )
    }

    ElMessage.success('删除成功')
    handleQuery()
  } catch {
    // 用户取消了删除
  }
}

// 处理对话框提交
const handleDialogSubmit = (formData) => {
  if (dialogMode.value === 'add') {
    // 添加新交易
    const newId = Math.max(...rawTransactions.value.map(tx => tx.id), 0) + 1

    if (formData.type === 'transfer') {
      // 添加转账交易（两条记录）
      const transferId = newId
      rawTransactions.value.push({
        id: newId,
        date: formData.date,
        type: 'transfer',
        account: formData.receiveAccount,
        sourceAccount: formData.transferAccount,
        category: '转账',
        amount: +formData.amount,
        note: formData.note || `从${formData.transferAccount}转账`,
        transferId
      })
      rawTransactions.value.push({
        id: newId + 1,
        date: formData.date,
        type: 'transfer',
        account: formData.transferAccount,
        sourceAccount: formData.receiveAccount,
        category: '转账',
        amount: -formData.amount,
        note: formData.note || `转账到${formData.receiveAccount}`,
        transferId
      })
    } else {
      // 添加普通交易
      rawTransactions.value.push({
        id: newId,
        date: formData.date,
        type: formData.type,
        account: formData.account,
        category: formData.category[1],
        amount: formData.type === 'income' ? +formData.amount : -formData.amount,
        note: formData.note
      })
    }
  } else {
    // 更新交易
    const index = rawTransactions.value.findIndex(tx => tx.id === formData.id)

    if (index !== -1) {
      if (formData.type === 'transfer') {
        // 更新转账交易（需要更新两条记录）
        const transferId = formData.transferId || formData.id

        // 删除旧的转账记录
        rawTransactions.value = rawTransactions.value.filter(
            tx => tx.transferId !== transferId
        )

        // 添加更新后的转账记录
        rawTransactions.value.push({
          id: formData.id,
          date: formData.date,
          type: 'transfer',
          account: formData.receiveAccount,
          sourceAccount: formData.transferAccount,
          category: '转账',
          amount: +formData.amount,
          note: formData.note || `从${formData.transferAccount}转账`,
          transferId
        })
        rawTransactions.value.push({
          id: formData.id + 1,
          date: formData.date,
          type: 'transfer',
          account: formData.transferAccount,
          sourceAccount: formData.receiveAccount,
          category: '转账',
          amount: -formData.amount,
          note: formData.note || `转账到${formData.receiveAccount}`,
          transferId
        })
      } else {
        // 更新普通交易
        rawTransactions.value[index] = {
          id: formData.id,
          date: formData.date,
          type: formData.type,
          account: formData.account,
          category: formData.category[1],
          amount: formData.type === 'income' ? +formData.amount : -formData.amount,
          note: formData.note
        }
      }
    }
  }

  ElMessage.success(dialogMode.value === 'add' ? '添加成功' : '更新成功')
  dialogVisible.value = false
  handleQuery()
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped>
.transaction-bill {
  padding: 20px;
}

.query-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table .cell) {
  white-space: nowrap;
}
</style>