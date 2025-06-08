<template>
  <el-select
      v-model="selectedValue"
      filterable
      remote
      reserve-keyword
      :remote-method="handleSearch"
      :loading="accountTypeState.fetching"
      :placeholder="placeholder"
      clearable
      @change="handleChange"
      @clear="handleClear"
      @focus="handleFocus"
  >
    <el-option
        v-for="item in accountTypeState.data"
        :key="item.id"
        :label="item.name"
        :value="item.id"
    >
      <div style="display: flex; align-items: center">
        <account-type-tag :info="item"></account-type-tag>
        <el-tag
            v-if="item.is_digital"
            size="small"
            effect="plain"
            style="margin-left: 8px"
        >
          电子
        </el-tag>
        <el-tag
            v-if="item.can_overdraft"
            size="small"
            type="warning"
            effect="plain"
            style="margin-left: 4px"
        >
          透支
        </el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { CreditCard } from '@element-plus/icons-vue'
import { useAccountTypeRemote } from '@/utils/selectRemote.js'
import AccountTypeTag from "@/components/UI/AccountTypeTag.vue";

const props = defineProps({
  modelValue: [Number, String],
  placeholder: {
    type: String,
    default: '请选择账户类型'
  },
  immediate: {
    type: Boolean,
    default: false
  },
  defaultOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const selectedValue = ref(props.modelValue)
const { accountTypeState, fetchAccountTypes } = useAccountTypeRemote({
  immediate: props.immediate,
  defaultOptions: props.defaultOptions
})

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  selectedValue.value = newVal
})

// 搜索处理
const handleSearch = (query) => {
  fetchAccountTypes(query)
}

// 处理选择变化
const handleChange = (value) => {
  emit('update:modelValue', value)
  const selectedItem = accountTypeState.data.find(item => item.value === value)
  emit('change', value, selectedItem)
}

// 处理清空
const handleClear = () => {
  emit('update:modelValue', null)
  emit('change', null, null)
}

// 处理获取焦点
const handleFocus = () => {
  if (accountTypeState.data.length === 0 && !accountTypeState.loaded) {
    fetchAccountTypes()
  }
}

// 暴露方法
defineExpose({
  refresh: fetchAccountTypes,
  getOptions: () => accountTypeState.data
})
</script>

<style scoped>
.el-select {
  width: 100%;
}
</style>