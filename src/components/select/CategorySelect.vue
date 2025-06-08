<template>
  <el-tree-select
      v-model="selectedValue"
      :data="treeData"
      :props="defaultProps"
      :placeholder="placeholder"
      check-strictly
      clearable
      filterable
      @change="handleChange"
      @clear="handleClear"
      @focus="handleFocus"
  >
    <template #default="{ node, data }">
      <div class="custom-tree-node">
        <div class="node-content">
          <span class="node-name">{{ data.name }}</span>
          <el-tag v-show="!data.parent_id" :type="getTagType(data.type)" size="small">
            {{ getTypeName(data.type) }}
          </el-tag>
        </div>
      </div>
    </template>
  </el-tree-select>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import {reqList} from "@/views/setting/category/api.js";
import {ElMessage} from "element-plus";
import {Delete, Plus} from "@element-plus/icons-vue";

const props = defineProps({
  modelValue: [Number, String],
  placeholder: {
    type: String,
    default: '请选择账目'
  },
  defaultOptions: {
    type: Array,
    default: () => []
  }
})
const getTypeName = (type) => {
  return type === 'income' ? '收入' : type === 'expense' ? '支出' : '资产'
}

// 获取标签类型
const getTagType = (type) => {
  return type === 'income' ? 'success' : type === 'expense' ? 'danger' : 'warning'
}
const emit = defineEmits(['update:modelValue', 'change'])
const defaultProps = {
  children: 'children',
  value: 'id',
  label: 'name',
  code: 'code',
}
const selectedValue = ref(props.modelValue)
const treeData = ref([])

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  selectedValue.value = newVal
})

const getList = async () => {
  try {
    const res = await reqList()
    if (res.code === 200 && res.data) {
      treeData.value = res.data
      console.log(treeData.value)
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    ElMessage.error('加载分类树失败')
    console.error(error)
  }
}
// 搜索处理
const handleSearch = (query) => {

}

const handleFocus = () => {

}
// 处理选择变化
const handleChange = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}

// 处理清空
const handleClear = () => {
  emit('update:modelValue', null)
  emit('change', null)
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.el-select {
  width: 100%;
}
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}
.node-content {
 display: flex;
 align-items: center;
 gap: 8px;
}

.node-name {
  font-weight: 500;
}
</style>