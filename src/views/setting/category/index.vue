<template>
  <div class="category-management">
    <!-- 左侧分类树 -->
    <div class="left-panel">
      <el-card shadow="never" class="search-card">
        <div class="search-area">
          <el-input
            v-model="filterText"
            placeholder="输入分类名称过滤(回车确认)"
            clearable
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="action-buttons">
          <el-button type="primary" plain style="width: 100%" @click="handleAddRoot">
            <el-icon><Plus /></el-icon> 添加一级分类
          </el-button>
        </div>
      </el-card>

      <el-card shadow="never" class="tree-card">
        <el-scrollbar style="height: calc(100% - 20px)">
          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="defaultProps"
            :filter-node-method="filterNode"
            node-key="id"
            default-expand-all
            highlight-current
            :current-node-key="currentNodeKey"
            :expand-on-click-node="false"
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <div class="custom-tree-node">
                <div class="node-content">
                  <span class="node-name">{{ node.label }}</span>
                  <el-tag :type="getTagType(data.type)" size="small">
                    {{ getTypeName(data.type) }}
                  </el-tag>
                  <el-tag v-show="!data.is_active" size="small">
                    {{ '禁用' }}
                  </el-tag>
                  <el-tag v-show="!data.in_statistics" size="small">
                    {{ '不统计' }}
                  </el-tag>
                </div>
                <div class="node-actions">
                  <el-link type="primary" size="small" @click.stop="handleAddChild(data)">
                    <el-icon><Plus /></el-icon>
                  </el-link>
                  <el-link type="danger" size="small" @click="handleDelete(data)">
                    <el-icon><Delete /></el-icon>
                  </el-link>
                </div>
              </div>
            </template>
          </el-tree>
        </el-scrollbar>
      </el-card>
    </div>

    <!-- 右侧编辑面板 -->
    <div class="right-panel">
      <el-card shadow="never" class="edit-card">
        <template #header>
          <div class="card-header">
            <span>{{ form.id ? '编辑分类' : '新增分类' }}</span>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          v-loading="formLoading"
        >
          <el-form-item label="分类名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入分类名称" />
          </el-form-item>

          <el-form-item label="分类编码" prop="code">
            <el-input v-model="form.code" placeholder="自动生成" disabled />
          </el-form-item>

          <el-form-item label="分类类型" prop="type">
            <el-select
              v-model="form.type"
              placeholder="请选择分类类型"
              :disabled="!!form.id || !!form.parent_id"
            >
              <el-option label="收入" value="income" />
              <el-option label="支出" value="expense" />
            </el-select>
          </el-form-item>

          <el-form-item label="上级分类" prop="parent_id">
            <el-tree-select
              v-model="form.parent_id"
              :data="treeData"
              :props="defaultProps"
              check-strictly
              placeholder="无 (一级分类)"
              :disabled="!!form.id || isRootNode"
              clearable
            />
          </el-form-item>

          <el-form-item label="状态">
            <el-switch
              v-model="form.is_active"
              active-text="启用"
              inactive-text="禁用"
              :active-value="1"
              :inactive-value="0"
              :disabled="hasChildren(currentNode)"
            />
          </el-form-item>

          <el-form-item label="是否纳入统计">
            <el-switch
              v-model="form.in_statistics"
              active-text="是"
              inactive-text="否"
              :active-value="1"
              :inactive-value="0"
              :disabled="hasChildren(currentNode)"
            />
          </el-form-item>

          <el-form-item label="图标" prop="icon">
            <el-input v-model="form.icon" placeholder="输入图标名称" />
          </el-form-item>

          <el-form-item label="描述" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="可填写分类描述"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="submitForm">保存</el-button>
            <el-button @click="resetForm" v-if="!form.id">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watch, onMounted } from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { Plus, Search, Edit, Delete } from '@element-plus/icons-vue';
  import { reqList, reqDetail, reqAdd, reqEdit, reqDelete } from './api.ts';

  // 树形数据
  const treeRef = ref();
  const filterText = ref('');
  const treeData = ref([]);
  const isRootNode = ref(false);
  const currentNode = ref(null);
  const currentNodeKey = ref(null);
  const defaultProps = {
    children: 'children',
    value: 'id',
    label: 'name',
  };

  // 表单数据
  const formRef = ref();
  const formLoading = ref(false);
  const form = ref({
    id: null,
    name: '',
    code: '',
    type: '',
    parent_id: null,
    is_active: 1,
    icon: '',
    description: '',
    in_statistics: 1,
  });

  // 表单验证规则
  const rules = {
    name: [
      { required: true, message: '请输入分类名称', trigger: 'blur' },
      { max: 50, message: '长度不能超过50个字符', trigger: 'blur' },
    ],
    type: [{ required: true, message: '请选择分类类型', trigger: 'change' }],
    description: [{ max: 200, message: '长度不能超过200个字符', trigger: 'blur' }],
  };

  // 加载分类树
  const getList = async () => {
    try {
      const res = await reqList();
      if (res.code === 200 && res.data) {
        treeData.value = res.data;
        console.log(treeData.value);
      } else {
        ElMessage.error(res.message || '获取数据失败');
      }
    } catch (error) {
      ElMessage.error('加载分类树失败');
      console.error(error);
    }
  };

  const filterNode = (value, data) => {
    if (!value) return true;
    return data.name.includes(value);
  };

  // 搜索处理
  const handleSearch = () => {
    treeRef.value.filter(filterText.value);
  };

  // 获取分类类型名称
  const getTypeName = (type) => {
    return type === 'income' ? '收入' : type === 'expense' ? '支出' : '资产';
  };

  // 获取标签类型
  const getTagType = (type) => {
    return type === 'income' ? 'success' : type === 'expense' ? 'danger' : 'warning';
  };

  // 检查是否有子节点
  const hasChildren = (data) => {
    return data?.children?.length > 0 || treeData.value.some((item) => item.parent_id === data?.id);
  };

  // 节点点击事件
  const handleNodeClick = (data) => {
    currentNode.value = data;
    currentNodeKey.value = data.id;
    Object.assign(form.value, {
      id: data.id,
      name: data.name,
      code: data.code,
      type: data.type,
      parent_id: data.parent_id,
      is_active: data.is_active,
      icon: data.icon,
      description: data.description,
      in_statistics: data.in_statistics,
    });
  };

  // 添加一级分类
  const handleAddRoot = () => {
    resetForm();
    currentNodeKey.value = null;
    isRootNode.value = true;
  };

  // 添加子分类
  const handleAddChild = (data) => {
    resetForm();
    currentNodeKey.value = null;
    form.value.parent_id = data.id;
    form.value.type = data.type; // 子分类继承父分类类型
  };

  // 删除分类
  const handleDelete = async (data) => {
    if (!data.id) return;

    try {
      await ElMessageBox.confirm(
        `确定要删除分类 "${data.name}" 吗？${
          hasChildren(data) ? '请确保该分类下的所有子分类已被删除' : ''
        }`,
        '提示',
        { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' }
      );

      const res = await reqDelete(data.id);
      if (res.code === 200) {
        ElMessage.success('删除成功');
      } else {
        ElMessage.error(res.message || '删除失败');
      }
      await getList();
      resetForm();
    } catch (error) {
      console.error('删除失败:', error);
      ElMessage.error(error || '删除失败');
    }
  };

  // 重置表单
  const resetForm = () => {
    form.value = {
      id: null,
      name: '',
      code: '',
      type: '',
      parent_id: null,
      is_active: 1,
      icon: '',
      description: '',
      in_statistics: 1,
    };
    isRootNode.value = false;
    currentNode.value = null;
    currentNodeKey.value = null;
    if (formRef.value) {
      formRef.value.resetFields();
    }
  };

  // 提交表单
  const submitForm = async () => {
    try {
      await formRef.value.validate();
      formLoading.value = true;
      if (form.value.id) {
        // 更新分类
        const res = await reqEdit(form.value.id, form.value);
        if (res.code === 200) {
          ElMessage.success('更新成功');
        } else {
          ElMessage.error(res.message || '更新失败');
        }
        ElMessage.success('更新成功');
      } else {
        // 新增分类
        const res = await reqAdd(form.value);
        if (res.code === 200) {
          ElMessage.success('添加成功');
        } else {
          ElMessage.error(res.message || '添加失败');
        }
      }
      await getList();
      resetForm();
    } catch (error) {
      console.error('保存失败:', error);
      ElMessage.error(error || '添加失败');
    } finally {
      formLoading.value = false;
    }
  };

  // 初始化加载数据
  onMounted(() => {
    getList();
  });
</script>

<style scoped>
  .category-management {
    display: flex;
    height: calc(100vh - 84px);
    gap: 8px;
    box-sizing: border-box;
  }

  .left-panel {
    width: 350px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .right-panel {
    flex: 1;
  }

  .search-card {
    height: 125px;
  }

  :deep(.search-card .el-card__body) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tree-card {
    flex: 1;
  }

  :deep(.tree-card .el-card__body) {
    padding: 8px;
    height: 100%;
  }

  .edit-card {
    height: 100%;
  }

  .edit-card {
    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .search-area {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .action-buttons {
    display: flex;
    justify-content: center;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

  .node-actions {
    display: flex;
    gap: 8px;
    visibility: hidden;
  }

  .el-tree-node__content:hover .node-actions {
    visibility: visible;
  }

  :deep(.el-tree) {
    height: 100%;
  }

  :deep(.el-tree-node__content) {
    height: 36px;
  }
</style>
