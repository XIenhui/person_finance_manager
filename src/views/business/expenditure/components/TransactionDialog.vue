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
            <el-radio-group v-model="form.type">
              <el-radio-button label="income">收入</el-radio-button>
              <el-radio-button label="expense">支出</el-radio-button>
              <el-radio-button label="transfer">转账</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="交易日期" prop="date">
            <el-date-picker
                v-model="form.date"
                type="date"
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
              <el-select
                  v-model="form.transferAccount"
                  placeholder="选择转出账户"
                  style="width: 100%"
              >
                <el-option
                    v-for="account in accounts"
                    :key="account"
                    :label="account"
                    :value="account"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="转入账户" prop="receiveAccount">
              <el-select
                  v-model="form.receiveAccount"
                  placeholder="选择转入账户"
                  style="width: 100%"
              >
                <el-option
                    v-for="account in accounts"
                    :key="account"
                    :label="account"
                    :value="account"
                    :disabled="account === form.transferAccount"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </template>
      <template v-else>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="form.type === 'income' ? '收入账户' : '支出账户'" prop="account">
              <el-select
                  v-model="form.account"
                  :placeholder="form.type === 'income' ? '选择收入账户' : '选择支出账户'"
                  style="width: 100%"
              >
                <el-option
                    v-for="account in accounts"
                    :key="account"
                    :label="account"
                    :value="account"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账目分类" prop="category">
              <el-cascader
                  v-model="form.category"
                  :options="categories"
                  :props="{ label: 'name', value: 'id', children: 'children' }"
                  :placeholder="form.type === 'income' ? '选择收入分类' : '选择支出分类'"
                  style="width: 100%"
                  :disabled="form.type === 'transfer'"
              />
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
import { getCurrentDate } from '@/utils/date'
import dayjs from "dayjs";

const props = defineProps({
  modelValue: Boolean,
  mode: {
    type: String,
    default: 'add'
  },
  transaction: Object,
  accounts: Array,
  categories: Array
})

const emit = defineEmits(['update:modelValue', 'submit'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref(null)
const form = ref({
  type: 'expense',
  date: getCurrentDate('YYYY-MM-DD'),
  account: '',
  category: [],
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
// 监听交易数据变化
watch(() => props.transaction, (val) => {
  if (val) {
    form.value = {
      id: val.id,
      type: val.type,
      date: val.date ? dayjs(val.date).format('YYYY-MM-DD') : getCurrentDate('YYYY-MM-DD'),
      account: val.account,
      category: val.type === 'income' ? ['income', val.category] : ['expense', val.category],
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

    emit('submit', formData)
  } catch (error) {
    console.error('表单验证失败', error)
  }
}
</script>