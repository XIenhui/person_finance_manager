<template>
  <el-form :model="form" label-position="top">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="类型">
          <el-radio-group v-model="form.type" @change="typeChange">
            <el-radio-button value="income">收入</el-radio-button>
            <el-radio-button value="expense">支出</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="金额">
          <el-input-number
              v-model="form.amount"
              :min="0"
              :controls="false"
              placeholder="0.00"
              style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="isTrans ? '源账户' : '账户'">
          <account-select
              v-model="form.account"
              :immediate="true"
              :placeholder="form.type === 'income' ? '选择收入账户' : '选择支出账户'"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <template v-if="isTrans">
          <el-form-item label="目的账户">
            <account-select
                v-model="form.account_to"
                :immediate="true"
                :placeholder="form.type === 'income' ? '选择收入账户' : '选择支出账户'"
            />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="账目">
            <category-select
                v-model="form.category"
                :placeholder="form.type === 'income' ? '选择收入分类' : '选择支出分类'"
            ></category-select>
          </el-form-item>
        </template>
      </el-col>
    </el-row>

    <el-form-item>
      <el-button type="primary" @click="submitForm" style="width: 100%">保存</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref } from 'vue'
import CategorySelect from "@/components/select/CategorySelect.vue";
import AccountSelect from "@/components/select/AccountSelect.vue";

const emit = defineEmits(['submit'])
const isTrans = ref(false);
const form = ref({
  type: 'expense',
  amount: 0,
  category: '',
  account: '',
  account_to: '',
})
const typeChange = () => {
  isTrans.value = form.value.type === 'transfer'
}
const submitForm = () => {
  if (!form.value.amount || !form.value.category || !form.value.account) {
    return
  }

  emit('comfirm')

  // 重置表单
  form.value.amount = 0
  form.value.category = ''
  form.value.account = ''
}
</script>