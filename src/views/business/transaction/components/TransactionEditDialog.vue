<template>
  <el-dialog
      v-model="visible"
      :title="mode === 'add' ? '添加交易' : '编辑交易'"
      width="600px"
  >
    <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="top"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="交易类型" prop="type">
            <el-radio-group v-model="form.type" :disabled="mode !== 'add'">
              <el-radio-button value="income">收入</el-radio-button>
              <el-radio-button value="expense">支出</el-radio-button>
              <!--              <el-radio-button v-if="mode === 'add'" value="transfer">转账</el-radio-button>-->
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="交易日期" prop="date">
            <el-date-picker
                :disabled="mode !== 'add'"
                v-model="form.date"
                type="datetime"
                placeholder="选择日期"
                style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <template v-if="form.type === 'transfer'">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="转出账户" prop="transferAccount">
              <account-select
                  v-model="form.transferAccount"
                  :immediate="true"
                  placeholder="请选择账户"
                  style="width: 100%"
                  @change="handleAccountChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="转入账户" prop="receiveAccount">
              <account-select
                  v-model="form.receiveAccount"
                  :immediate="true"
                  placeholder="请选择账户"
                  style="width: 100%"
                  @change="handleAccountChange"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <template v-else>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="form.type === 'income' ? '收入账户' : '支出账户'" prop="account">
              <account-select
                  v-model="form.account"
                  :immediate="true"
                  :placeholder="form.type === 'income' ? '选择收入账户' : '选择支出账户'"
                  @change="handleAccountChange"
                  :disabled="mode !== 'add'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账目分类" prop="category">
              <category-select
                  v-model="form.category"
                  :placeholder="form.type === 'income' ? '选择收入分类' : '选择支出分类'"
                  @change="handleCategoryChange"
              ></category-select>
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item :label="form.type === 'transfer' ? '转账金额' : '交易金额'" prop="amount">
            <el-input-number
                v-model="form.amount"
                :min="0"
                :precision="2"
                :controls="false"
                placeholder="0.00"
                style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注" prop="note">
            <el-input
                v-model="form.note"
                placeholder="可选备注"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submitForm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import {computed, ref, watch} from 'vue'
import {formatDate, getCurrentDate} from '@/utils/date'
import dayjs from "dayjs";
import AccountSelect from "@/components/select/AccountSelect.vue";
import CategorySelect from "@/components/select/CategorySelect.vue";
import {reqAdd, reqEdit} from "@/views/business/transaction/api.js";
import {ElMessage} from "element-plus";

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

const formRef = ref(null)
const form = ref({
  type: 'expense',
  date: getCurrentDate('YYYY-MM-DD'),
  account: '',
  category: '',
  amount: '',
  note: '',
  transferAccount: '',
  receiveAccount: ''
})

const rules = {
  type: [{ required: true, message: '请选择交易类型', trigger: 'change' }],
  date: [{ required: true, message: '请选择交易日期', trigger: 'change' }],
  account: [{ required: true, message: '请选择账户', trigger: 'change' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  transferAccount: [{ required: true, message: '请选择转出账户', trigger: 'change' }],
  receiveAccount: [{
    required: true,
    validator: (rule, value, callback) => {
      if (!value) {
        callback(new Error('请选择转入账户'))
      } else if (value === form.value.transferAccount) {
        callback(new Error('转入账户不能与转出账户相同'))
      } else {
        callback()
      }
    },
    trigger: 'change'
  }]
}
const resetForm = () => {
  form.value = {
    type: 'expense',
    date: new Date(),
    account: '',
    category: [],
    amount: '',
    note: '',
    transferAccount: '',
    receiveAccount: ''
  }
}
const handleCategoryChange = (data) => {
  console.log(data)
}
const handleAccountChange = (data) => {
  // console.log(data)
}
// 监听交易数据变化
watch(() => props.transaction, (val) => {
  if (val) {
    form.value = {
      id: val.id,
      type: val.type,
      date: val.date ? dayjs(val.date).format('YYYY-MM-DD HH:mm:ss')
          : getCurrentDate('YYYY-MM-DD HH:mm:ss'),
      account: val.account,
      category: val.category,
      amount: Math.abs(val.amount),
      note: val.note,
      transferAccount: val.transferAccount || '',
      receiveAccount: val.receiveAccount || '',
      transferId: val.transferId
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

// 重置表单


// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate()

    const formData = { ...form.value }
    if (formData.type !== 'transfer') {
      delete formData.transferAccount
      delete formData.receiveAccount
    }
    const params = {
      id: formData.id,
      transaction_type: formData.type,
      transaction_date: formatDate(formData.date),
      amount: formData.amount,
      description: formData.note,
      account_id: formData.account,
      category_id: formData.category,
      // 如果是转账交易
      ...(formData.type === 'transfer' && {
        payer: formData.transferAccount,
        payee: formData.receiveAccount
      })
    }
    console.log(params)
    if (props.mode === 'add') {
      await reqAdd(params)
      ElMessage.success('添加成功')
    } else {
      await reqEdit(formData.id, params)
      ElMessage.success('更新成功')
    }
    emit('confirm')
  } catch (error) {
    console.error(`${props.mode.value === 'add' ? '添加' : '更新'}交易失败:`, error)
    ElMessage.error(error || '提交失败')
  }
}

</script>