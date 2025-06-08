<template>
  <el-dialog
      v-model="visible"
      :title="mode === 'add' ? '添加交易' : '编辑交易'"
      :fullscreen="true"
      class="full-dialog"
  >
    <div class="transaction-items">
      <div
          v-for="(item, index) in form.items"
          :key="index"
          class="transaction-item"
      >
        <el-form
            :ref="el => formRefs[index] = el"
            :model="item"
            :rules="rules"
            label-width="80px"
        >
          <el-form-item label="类型" prop="type">
            <el-radio-group v-model="item.type" :disabled="mode !== 'add'" style="width: 120px">
              <el-radio-button value="income">收入</el-radio-button>
              <el-radio-button value="expense">支出</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="日期" prop="date">
            <el-date-picker
                v-model="item.date"
                type="datetime"
                placeholder="选择日期"
                style="width: 180px"
                :disabled="mode !== 'add'"
            />
          </el-form-item>

          <el-form-item :label="item.type === 'income' ? '收入账户' : '支出账户'" prop="account">
            <account-select
                v-model="item.account"
                :placeholder="item.type === 'income' ? '选择收入账户' : '选择支出账户'"
                style="width: 160px"
                :disabled="mode !== 'add'"
            />
          </el-form-item>

          <el-form-item label="分类" prop="category">
            <category-select
                v-model="item.category"
                :placeholder="item.type === 'income' ? '选择收入分类' : '选择支出分类'"
                style="width: 160px"
            />
          </el-form-item>

          <el-form-item label="金额" prop="amount">
            <el-input-number
                v-model="item.amount"
                :min="0"
                :precision="2"
                :controls="false"
                placeholder="0.00"
                style="width: 100px"
            />
          </el-form-item>

          <el-form-item label="备注" prop="note">
            <el-input
                type="textarea"
                v-model="item.note"
                placeholder="可选备注"
                style="width: 250px"
            />
          </el-form-item>
        </el-form>

        <div class="item-actions">
          <el-link
              @click="duplicateItem(index)"
              title="复制此项"
          >
            <el-icon><CopyDocument /></el-icon>
          </el-link>
          <el-link
              @click="removeItem(index)"
              title="删除此项"
              v-if="form.items.length > 1"
          >
            <el-icon><Delete /></el-icon>
          </el-link>
        </div>
      </div>
      <div class="add-item">
        <el-link @click="addItem">
          <el-icon><Plus /></el-icon> 添加交易项
        </el-link>
      </div>
    </div>


    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { formatDate, getCurrentDate } from '@/utils/date'
import dayjs from "dayjs"
import AccountSelect from "@/components/select/AccountSelect.vue"
import CategorySelect from "@/components/select/CategorySelect.vue"
import { reqAdd, reqEdit } from "@/views/business/transaction/api.js"
import { ElMessage } from "element-plus"
import { CopyDocument, Delete, Plus } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean,
  mode: {
    type: String,
    default: 'add'
  },
  transaction: Object,
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRefs = ref([])
const form = ref({
  items: [
    {
      type: 'expense',
      date: getCurrentDate('YYYY-MM-DD'),
      account: '',
      category: '',
      amount: NaN,
      note: ''
    }
  ]
})

const rules = {
  type: [{ required: true, message: '请选择交易类型', trigger: 'change' }],
  date: [{ required: true, message: '请选择交易日期', trigger: 'change' }],
  account: [{ required: true, message: '请选择账户', trigger: 'change' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }]
}

// 添加新交易项
const addItem = () => {
  form.value.items.push({
    type: 'expense',
    date: getCurrentDate('YYYY-MM-DD'),
    account: '',
    category: '',
    amount: NaN,
    note: ''
  })
}

// 复制交易项
const duplicateItem = (index) => {
  const itemToCopy = { ...form.value.items[index] }
  form.value.items.splice(index + 1, 0, itemToCopy)
}

// 删除交易项
const removeItem = (index) => {
  form.value.items.splice(index, 1)
}

// 重置表单
const resetForm = () => {
  form.value = {
    items: [
      {
        type: 'expense',
        date: getCurrentDate('YYYY-MM-DD'),
        account: '',
        category: '',
        amount: NaN,
        note: ''
      }
    ]
  }
}

watch(() => props.transaction, (val) => {
  if (val) {
    form.value = {
      items: [
        {
          id: val.id,
          type: val.type,
          date: val.date ? dayjs(val.date).format('YYYY-MM-DD HH:mm:ss') : getCurrentDate('YYYY-MM-DD HH:mm:ss'),
          account: val.account,
          category: val.category,
          amount: Math.abs(val.amount),
          note: val.note
        }
      ]
    }
  } else {
    resetForm()
  }
}, { immediate: true })

watch(() => props.modelValue, (val) => {
  if (!val && !props.transaction) {
    resetForm()
  }
}, { immediate: true })

const submitForm = async () => {
  try {
    const validations = await Promise.all(formRefs.value.map(formRef => formRef.validate()))
    if (validations.some(valid => !valid)) return
  } catch (error) {
      console.error(`${props.mode === 'add' ? '添加' : '更新'}交易失败:`, error)
      ElMessage.error(error.message || '提交失败')
    }
  try {
    const requests = form.value.items.map(item => {
      return  {
        transaction_type: item.type,
        transaction_date: formatDate(item.date),
        amount: item.amount,
        description: item.note,
        account_id: item.account,
        category_id: item.category
      }
    })
    await reqAdd(requests)
    ElMessage.success(props.mode === 'add' ? '添加成功' : '更新成功')
    emit('confirm')
    visible.value = false
  } catch (error) {
    console.error(`${props.mode === 'add' ? '添加' : '更新'}交易失败:`, error)
    ElMessage.error(error || '提交失败')
  }
}
</script>

<style scoped>
.transaction-items {
  height: calc(100vh - 180px);
  overflow-y: auto;
  padding: 0 10px;
}

.transaction-item {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.transaction-item :deep(.el-form) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  flex: 1;
}

.transaction-item :deep(.el-form-item) {
  margin-bottom: 0;
  align-items: center;
}

.item-actions {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 6px;
  padding-top: 10px;
  min-width: 50px;
}

.add-item {
  margin-top: 10px;
  text-align: center;
}

.dialog-footer {
  position: sticky;
  bottom: 0;
  background-color: #fff;
  padding: 12px 20px;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.04);
  text-align: right;
}

:deep(.el-dialog__body) {
  padding: 10px 20px;
}
</style>
