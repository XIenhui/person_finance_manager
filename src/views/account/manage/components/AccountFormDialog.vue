<template>
  <el-dialog
      v-model="visible"
      :title="title"
      width="600px"
      :close-on-click-modal="false"
      @close="handleCancel"
  >
    <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        label-position="right"
    >
      <el-form-item label="账户名称" prop="account_name">
        <el-input
            v-model="formData.account_name"
            placeholder="请输入账户名称"
            clearable
            maxlength="50"
            show-word-limit
        />
      </el-form-item>

      <el-form-item label="账户类型" prop="type_id">
        <account-type-select
            v-model="formData.type_id"
            :immediate="true"
            :placeholder="'请选择账户类型'"
            @change="handleTypeChange"
        />
      </el-form-item>

      <el-form-item label="账号/卡号" prop="account_number">
        <el-input
            v-model="formData.account_number"
            placeholder="请输入账号或卡号"
            clearable
            maxlength="50"
        />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="初始余额" prop="balance" >
            <el-input-number
                :disabled="isEdit"
                v-model="formData.balance"
                :min="-999999999"
                :max="999999999"
                :precision="2"
                :controls="false"
                placeholder="请输入初始余额"
                style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="货币类型" prop="currency">
            <el-select
                v-model="formData.currency"
                placeholder="请选择货币"
                style="width: 100%"
            >
              <el-option
                  v-for="currency in currencyOptions"
                  :key="currency.value"
                  :label="currency.label"
                  :value="currency.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属机构" prop="institution">
            <el-input
                v-model="formData.institution"
                placeholder="请输入所属银行或机构"
                clearable
                maxlength="100"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="信用额度" prop="credit_limit" v-if="showCreditLimit">
            <el-input-number
                v-model="formData.credit_limit"
                :min="0"
                :precision="2"
                :controls="false"
                placeholder="请输入信用额度"
                style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开户日期" prop="opening_date">
            <el-date-picker
                v-model="formData.opening_date"
                type="date"
                placeholder="选择开户日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="账户状态" prop="is_active">
            <el-switch
                v-model="formData.is_active"
                :active-value="1"
                :inactive-value="0"
                active-text="启用"
                inactive-text="禁用"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="备注信息" prop="remark">
        <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="可填写备注信息"
            maxlength="200"
            show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel" :disabled="loading">取消</el-button>
      <el-button
          type="primary"
          @click="handleSubmit"
          :loading="loading"
      >
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AccountTypeSelect from '@/components/select/AccountTypeSelect.vue'

const props = defineProps({
  modelValue: Boolean,
  title: String,
  formData: {
    type: Object,
    required: true
  },
  loading: Boolean
})

const emit = defineEmits(['update:modelValue', 'submit', 'cancel'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref(null)
const isEdit = computed(() => !!props.formData.id)

// 货币选项
const currencyOptions = [
  { value: 'CNY', label: '人民币 (CNY)' },
  { value: 'USD', label: '美元 (USD)' },
  { value: 'EUR', label: '欧元 (EUR)' },
  { value: 'JPY', label: '日元 (JPY)' },
  { value: 'HKD', label: '港币 (HKD)' }
]

// 表单验证规则
const rules = {
  account_name: [
    { required: true, message: '请输入账户名称', trigger: 'blur' },
    { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
  ],
  type_id: [
    { required: true, message: '请选择账户类型', trigger: 'change' }
  ],
  account_number: [
    { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
  ],
  balance: [
    { required: true, message: '请输入初始余额', trigger: 'blur' }
  ],
  institution: [
    { max: 100, message: '长度不能超过100个字符', trigger: 'blur' }
  ],
  remark: [
    { max: 200, message: '长度不能超过200个字符', trigger: 'blur' }
  ]
}

// 是否显示信用额度字段
const showCreditLimit = computed(() => {
  return props.formData.type_id === 2 // 假设2是信用卡类型ID
})

// 处理账户类型变化
const handleTypeChange = (value, item) => {
  // 如果是信用卡类型且信用额度为空，设置默认值
  if (value === 2 && !props.formData.credit_limit) {
    props.formData.credit_limit = 10000
  }
}

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      emit('submit', props.formData)
    }
  })
}

const handleCancel = () => {
  formRef.value.resetFields()
  emit('cancel')
}
</script>

<style scoped>
:deep(.el-date-editor.el-input),
:deep(.el-date-editor.el-input__inner) {
  width: 100%;
}

:deep(.el-select) {
  width: 100%;
}
</style>