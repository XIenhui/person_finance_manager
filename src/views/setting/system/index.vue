<template>
  <div class="settings-container">
    <el-card class="settings-card" shadow="never">
      <template #header>
        <div class="card-header">数据库连接设置</div>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="数据库类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型">
            <el-option label="SQLite" value="sqlite" />
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgres" />
          </el-select>
        </el-form-item>

        <el-form-item label="主机地址" prop="host" v-if="form.type !== 'sqlite'">
          <el-input v-model="form.host" placeholder="如 127.0.0.1" />
        </el-form-item>

        <el-form-item label="端口号" prop="port" v-if="form.type !== 'sqlite'">
          <el-input-number v-model="form.port" :min="0" :max="65535" controls-position="right" />
        </el-form-item>

        <el-form-item label="用户名" prop="user" v-if="form.type !== 'sqlite'">
          <el-input v-model="form.user" />
        </el-form-item>

        <el-form-item label="密码" prop="password" v-if="form.type !== 'sqlite'">
          <el-input v-model="form.password" show-password />
        </el-form-item>

        <el-form-item label="数据库名" prop="database">
          <el-input v-model="form.database" placeholder="数据库名称或 SQLite 文件名" />
        </el-form-item>

        <el-form-item>
          <el-button @click="testConnection">测试连接</el-button>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

// 表单数据
const form = reactive({
  type: 'sqlite',       // 默认数据库类型
  host: '',
  port: 3306,
  user: '',
  password: '',
  database: ''
})

const formRef = ref(null)

const rules = {
  type: [{ required: true, message: '请选择数据库类型', trigger: 'change' }],
  host: [{ required: true, message: '请输入主机地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口号', trigger: 'blur' }],
  user: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  database: [{ required: true, message: '请输入数据库名', trigger: 'blur' }]
}

// 保存设置（示例：可改为写入本地存储或调用 API）
const saveSettings = () => {
  formRef.value.validate(valid => {
    if (!valid) return
    // 保存到本地（如 localStorage）或后端
    localStorage.setItem('dbSettings', JSON.stringify(form))
    ElMessage.success('数据库设置已保存')
  })
}

// 模拟测试连接
const testConnection = () => {
  ElMessage.success(`已模拟连接到 ${form.type} 数据库`)
}
</script>

<style scoped>
.settings-container {
  width: 100%;
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
  background-color: #f5f7fa;
}

.settings-card {
  width: 100%;
  height: 100%;
  background-color: #fff;
  box-shadow: none;
  border: 1px solid #e4e7ed;
  padding: 24px;
  box-sizing: border-box;
  overflow: auto;
}

.card-header {
  font-weight: bold;
  font-size: 18px;
}
</style>
