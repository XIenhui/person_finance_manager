<template>
  <div class="account-management-page">
    <!-- 搜索和操作区域 -->
    <el-card shadow="never" class="search-card com-search">
      <el-form :inline="true" :model="searchForm">
        <div class="search-area">
          <el-form-item label="账户名称">
            <el-input
                style="width: 150px"
                v-model="searchForm.keyword"
                placeholder="请输入账户名称"
                clearable
                @keyup.enter="handleSearch"
                @clear="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="账户类型">
            <account-type-select
                style="width: 150px"
                v-model="searchForm.type_id"
                :immediate="true"
                :placeholder="'请选择账户类型'"
                @change="handleTypeChange"
            ></account-type-select>
          </el-form-item>

          <el-form-item label="状态">
            <el-select
                style="width: 100px"
                v-model="searchForm.is_active"
                placeholder="全部状态"
                clearable
                @change="handleStateChange"
            >
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <div style="display: flex;flex-wrap: nowrap
.">
              <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </div>
          </el-form-item>
        </div>
      </el-form>

      <div class="action-buttons">
        <el-button @click="exportAccounts" :icon="Download">导出</el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card com-table">
      <el-table
          :data="tableData"
          v-loading="tableLoading"
          stripe
          style="width: 100%"
          :empty-text="emptyText"
          @sort-change="handleSortChange"
      >
        <el-table-column prop="account_name" label="账户名称" min-width="150" sortable="custom" />
        <el-table-column prop="account_number" label="账号" min-width="180" />
        <el-table-column prop="typeName" label="账户类型" min-width="120">
          <template #default="{row}">
            <account-type-tag :info="{
              name: row.type_name,
              color: row.type_color,
              icon: row.type_icon,
            }"></account-type-tag>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" min-width="150" align="right" sortable="custom">
          <template #default="{row}">
            <span :class="{'text-success': row.balance > 0, 'text-danger': row.balance < 0}">
              {{ formatCurrency(row.balance, row.currency) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="currency" label="货币" min-width="80" align="center" />
        <el-table-column prop="is_active" label="状态" min-width="100" align="center">
          <template #default="{row}">
            <span :style="{ color: row.is_active ? 'green' : 'red'}">
              {{ row.is_active ? '启用': '禁用' }}
            </span>
<!--            <el-switch-->
<!--                v-model="row.is_active"-->
<!--                :active-value="1"-->
<!--                :inactive-value="0"-->
<!--                @change="handleStatusChange(row)"-->
<!--            />-->
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="创建时间" min-width="160" sortable="custom">
          <template #default="{row}">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" min-width="160" sortable="custom">
          <template #default="{row}">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{row}">
            <div class="function">
              <el-button
                  size="small"
                  type="primary"
                  @click="viewDetails(row)"
              >详情</el-button>
              <el-button
                  size="small"
                  type="primary"
              >日志</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.size"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <account-form-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        :form-data="formData"
        :account-types="accountTypeOptions"
        :loading="dialogLoading"
        @submit="handleSubmit"
        @cancel="dialogVisible = false"
    />
  </div>
</template>

<script setup>
  import { ref, reactive, computed, onMounted } from 'vue'
  import {
    Search, Plus, Edit, Delete, View, Download
  } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { formatDate } from '@/utils/date.js'
  import { formatCurrency } from "@/utils/currency.js";
  import AccountFormDialog from './components/AccountFormDialog.vue'
  import {
    reqList,
    reqAdd,
    reqDetail,
    reqEdit,
    reqDelete,
    reqChangeStatus,
  } from './api.ts'
  import AccountTypeSelect from "@/components/select/AccountTypeSelect.vue";
  import AccountTypeTag from "@/components/UI/AccountTypeTag.vue";

  // 数据状态
  const tableLoading = ref(false)
  const dialogVisible = ref(false)
  const dialogLoading = ref(false)
  const isEditMode = ref(false)
  const tableData = ref([])
  const accountTypeOptions = ref([])

  // 搜索表单
  const searchForm = reactive({
    keyword: '',
    type_id: '',
    is_active: '',
  })

  // 分页配置
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  // 排序配置
  const sortParams = reactive({
    sortField: null,
    sortOrder: null
  })

  // 表单数据
  const formData = reactive({
    id: null,
    account_name: '',
    type_id: null,
    account_number: '',
    currency: 'CNY',
    balance: 0,
    institution: '',
    credit_limit: null,
    opening_date: null,
    is_active: 1,
    remark: ''
  })

  // 计算属性
  const dialogTitle = computed(() => isEditMode.value ? '编辑账户' : '新增账户')
  const emptyText = computed(() =>
      tableLoading.value ? '加载中...' : '暂无账户数据，请点击新增按钮创建账户'
  )
  const setLoading = (time = 200) => {
    tableLoading.value = true
    const timer = setTimeout(() => {
      tableLoading.value = false
      clearTimeout(timer);
    }, time)
  }
  // 方法
  const getList = async () => {
    try {
      tableLoading.value = true
      const params = {
        page: pagination.current,
        size: pagination.size,
        ...searchForm,
        ...sortParams
      }
      const res = await reqList(params)
      if (res.code === 200 && res.data) {
        if (res.data.records) {
          tableData.value = res.data.records
        }
        pagination.total = res.data.total ?? 0
      } else {
        ElMessage.error(res.message || '获取数据失败')
      }
    } catch (error) {
      console.error('获取账户列表失败:', error)
      ElMessage.error('获取账户列表失败')
    } finally {
      setLoading()
    }
  }

  const handleSearch = () => {
    pagination.current = 1
    getList()
  }

  const resetSearch = () => {
    searchForm.keyword = ''
    searchForm.type_id = null
    searchForm.is_active = null
    handleSearch()
  }

  const handleAdd = () => {
    isEditMode.value = false
    resetFormData()
    dialogVisible.value = true
  }

  const handleEdit = (row) => {
    isEditMode.value = true
    Object.assign(formData, row)
    dialogVisible.value = true
  }

  const handleDelete = async (row) => {
    try {
      await ElMessageBox.confirm(
          `确定要删除账户 "${row.account_name}" 吗？${row.balance !== 0 ? '该账户余额不为零，删除后相关交易记录将无法关联！' : ''}`,
          '提示',
          {
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            distinguishCancelAndClose: true
          }
      )

      const res = await reqDelete(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        getList()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      if (error === 'cancel') {
        ElMessage.info('已取消删除')
      } else {
        console.error('删除账户失败:', error)
        ElMessage.error(error)
      }
    }
  }
  const setStatus = async (is_active, id) => {
    try {
      const res = await reqChangeStatus(is_active, id)
      if (res.code === 200) {
        ElMessage.success('操作成功')
      } else {
        ElMessage.error(res.message || '操作失败')
      }
      getList()
    } catch (error) {
      console.error('状态修改失败:', error)
      ElMessage.error(error)
    }
  }
  const handleStatusChange = (row) => {
    setStatus(row.is_active, row.id);
  }

  const handleSubmit = async (formData) => {
    try {
      dialogLoading.value = true
      if (isEditMode.value) {
        const res = await reqEdit(formData.id, formData)
        if (res.code === 200) {
          ElMessage.success('账户更新成功')
          dialogVisible.value = false
          getList()
        } else {
          ElMessage.error(res.message || '账户创建失败')
        }
      } else {
        const res = await reqAdd(formData)
        if (res.code === 200) {
          ElMessage.success('账户创建成功')
          dialogVisible.value = false
          getList()
        } else {
          ElMessage.error(res.message || '账户创建失败')
        }
      }
    } catch (error) {
      console.error('保存账户失败:', error)
      ElMessage.error(error.message || '保存账户失败')
    } finally {
      dialogLoading.value = false
    }
  }

  const handleSizeChange = (size) => {
    pagination.size = size
    getList()
  }

  const handlePageChange = (page) => {
    pagination.current = page
    getList()
  }
  const handleTypeChange = (data) => {
    console.log(data)
    handleSearch()
  }
  const handleStateChange = (data) => {
    if(!data && data !== 0) searchForm.is_active = '';
    handleSearch()
  }
  const handleSortChange = ({ prop, order }) => {
    if (prop && order) {
      sortParams.sortField = prop
      sortParams.sortOrder = order === 'ascending' ? 'asc' : 'desc'
    } else {
      sortParams.sortField = null
      sortParams.sortOrder = null
    }
    getList()
  }

  const viewDetails = (row) => {
    // 跳转到账户详情页
    // router.push(`/account/detail/${row.id}`)
  }

  const exportAccounts = async () => {
    // try {
    //   const params = {
    //     ...searchForm,
    //     ...sortParams
    //   }
    //   await exportAccountData(params)
    //   ElMessage.success('导出成功')
    // } catch (error) {
    //   console.error('导出失败:', error)
    //   ElMessage.error('导出失败')
    // }
  }

  const resetFormData = () => {
    Object.assign(formData, {
      id: null,
      account_name: '',
      type_id: null,
      account_number: '',
      currency: 'CNY',
      balance: 0,
      institution: '',
      credit_limit: null,
      opening_date: null,
      is_active: 1,
      remark: ''
    })
  }

  // 初始化
  onMounted(() => {
    getList()
  })
</script>

<style scoped>
.account-management-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
}

.search-card {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.search-area {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  text-align: center;
  flex-wrap: nowrap;
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

.action-buttons {
  display: flex;
  justify-content: flex-start;
  gap: 12px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.text-success {
  color: var(--el-color-success);
}

.text-danger {
  color: var(--el-color-danger);
}
</style>