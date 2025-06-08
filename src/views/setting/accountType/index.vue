<template>
  <div class="account-type-page">
    <!-- 搜索与操作区域 -->
    <el-card class="mb-4" shadow="always">
      <div class="com-search">
        <el-row :gutter="12" class="mb-2" align="middle">
          <el-col :span="8">
            <el-input
                v-model="searchKeyword"
                placeholder="请输入类型名称"
                clearable
                @keyup.enter="getList"
                @clear="getList"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="getList" :icon="Search">搜索</el-button>
          </el-col>
          <el-col :span="12" class="text-right">
            <el-button type="primary" @click="handleAdd" :icon="Plus">新增账户类型</el-button>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="always">
      <el-table
          v-loading="tableLoading"
          :data="accountTypes"
          stripe
          style="width: 100%"
          :empty-text="'暂无账户类型，请点击新增'"
          @sort-change="handleSortChange"
      >
        <el-table-column prop="name" label="类型名称" min-width="150" sortable />
        <el-table-column prop="icon" label="图标" min-width="100">
          <template #default="{row}">
            <el-icon v-if="row.icon">
              <component :is="row.icon" />
            </el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="color" label="颜色" width="180">
          <template #default="{row}">
            <el-tag
                v-if="row.color"
                :color="row.color"
                effect="dark"
                disable-transitions
                :style="{border: row.color || '#ffffff'}"
            >
              {{ row.color }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="显示效果" min-width="180">
          <template #default="{ row }">
            <account-type-tag :info="row"></account-type-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_digital" label="电子账户" min-width="100" align="center">
          <template #default="{row}">
            <el-tag disable-transitions :type="row.is_digital ? 'success' : 'info'">
              {{ row.is_digital ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="can_overdraft" label="允许透支" min-width="100" align="center">
          <template #default="{row}">
            <el-tag disable-transitions :type="row.can_overdraft ? 'success' : 'info'">
              {{ row.can_overdraft ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <el-button
                size="small"
                type="primary"
                @click="handleEdit(scope.row)"
                :icon="Edit"
            >编辑</el-button>
            <el-button
                size="small"
                type="danger"
                @click="handleDelete(scope.row)"
                :icon="Delete"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
        :title="dialogTitle"
        v-model="dialogVisible"
        width="600px"
        :close-on-click-modal="false"
    >
      <el-form
          :model="form"
          :rules="rules"
          ref="formRef"
          label-width="120px"
          label-position="right"
      >
        <el-form-item label="类型名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入类型名称" clearable />
        </el-form-item>

        <el-form-item label="图标" prop="icon">
          <el-select v-model="form.icon" placeholder="请选择图标" clearable>
            <el-option
                v-for="item in iconOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            >
              <span style="margin-right: 10px">
                <el-icon><component :is="item.value" /></el-icon>
              </span>
              <span>{{ item.label }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="form.color" show-alpha />
          <el-input
              v-model="form.color"
              placeholder="或直接输入颜色值"
              clearable
              style="width: 200px; margin-left: 10px"
          />
        </el-form-item>

        <el-form-item label="是否电子账户" prop="is_digital">
          <el-switch v-model="form.is_digital" active-text="是" inactive-text="否" />
        </el-form-item>

        <el-form-item label="是否允许透支" prop="can_overdraft">
          <el-switch v-model="form.can_overdraft" active-text="是" inactive-text="否" />
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input
              v-model="form.remark"
              type="textarea"
              :rows="3"
              placeholder="可填写备注信息"
              maxlength="200"
              show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Search, Plus, Edit, Delete,
  CreditCard, Wallet, Money, Coin
} from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import {reqList, reqAdd, reqDelete, reqEdit} from '@/views/setting/accountType/api.js'
import AccountTypeTag from "@/components/UI/AccountTypeTag.vue";

// 图标选项
const iconOptions = [
  { value: 'CreditCard', label: '信用卡' },
  { value: 'Wallet', label: '钱包' },
  { value: 'Money', label: '现金' },
  { value: 'Coin', label: '硬币' },
]

// 数据和状态
const accountTypes = ref([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const searchKeyword = ref('')
const tableLoading = ref(false)
const submitLoading = ref(false)
const sortParams = ref({})

// 弹窗相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const dialogTitle = computed(() => (isEdit.value ? '编辑账户类型' : '新增账户类型'))
const formRef = ref(null)

// 表单数据
const form = reactive({
  id: null,
  name: '',
  icon: '',
  color: '',
  is_digital: false,
  can_overdraft: false,
  remark: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入类型名称', trigger: 'blur' },
    { max: 20, message: '长度不能超过20个字符', trigger: 'blur' }
  ],
  icon: [
    { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
  ],
  color: [
    { max: 30, message: '长度不能超过30个字符', trigger: 'blur' }
  ],
  remark: [
    { max: 200, message: '长度不能超过200个字符', trigger: 'blur' }
  ]
}
const setLoading = (time = 200) => {
  tableLoading.value = true
  const timer = setTimeout(() => {
    tableLoading.value = false
    clearTimeout(timer);
  }, time)
}
// 方法
const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    is_digital: row.is_digital,
    can_overdraft: row.can_overdraft,
    remark: row.remark
  })
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除账户类型 "${row.name}" 吗？`, '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    beforeClose: (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true
        confirmDel(row.id).finally(() => {
          instance.confirmButtonLoading = false
          done()
        })
      } else {
        done()
      }
    }
  }).catch(() => {})
}

const confirmDel = async (id) => {
  try {
    const res = await reqDelete(id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  }
}

const getList = async () => {
  try {
    tableLoading.value = true
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchKeyword.value,
      ...sortParams.value
    }
    const res = await reqList(params)
    if (res.code === 200) {
      accountTypes.value = res.data.records || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '获取数据失败')
  } finally {
    setLoading();
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  getList()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  getList()
}

const handleSortChange = ({ column, prop, order }) => {
  if (prop && order) {
    sortParams.value = {
      sortField: prop,
      sortOrder: order === 'ascending' ? 'asc' : 'desc'
    }
  } else {
    sortParams.value = {}
  }
  getList()
}

const addType = async () => {
  try {
    submitLoading.value = true
    const res = await reqAdd(form)
    if (res.code === 200) {
      ElMessage.success('添加成功')
      dialogVisible.value = false
      getList()
    } else {
      ElMessage.error(res.message || '添加失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '添加失败')
  } finally {
    submitLoading.value = false
  }
}

const editType = async () => {
  try {
    submitLoading.value = true
    const res = await reqEdit(form.id, form)
    if (res.code === 200) {
      ElMessage.success('更新成功')
      dialogVisible.value = false
      getList()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '更新失败')
  } finally {
    submitLoading.value = false
  }
}

const submitForm = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        editType()
      } else {
        addType()
      }
    }
  })
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    name: '',
    icon: '',
    color: '',
    is_digital: false,
    can_overdraft: false,
    remark: ''
  })
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 初始化
onMounted(() => {
  getList()
})
</script>

<style scoped>
.account-type-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
}

.mb-4 {
  margin-bottom: 16px;
}

.com-search {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.el-table {
  flex: 1;
}
:deep(.table-card .el-card__body) {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
  gap: 12px;
}
.pagination {
  height: 30px;
  display: flex;
  justify-content: flex-end;
}

.text-right {
  text-align: right;
}

.function {
  display: flex;
  justify-content: center;
  gap: 8px;
}
</style>