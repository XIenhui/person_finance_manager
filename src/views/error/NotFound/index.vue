<template>
  <div class="error-page">
    <div class="error-container">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面不存在</h2>
      <p class="error-description">您访问的页面可能已被移除、更名或暂时不可用</p>
      <div class="error-actions">
        <div class="error-actions">
          <span>页面导航:</span>
          <el-link type="primary" @click="goHome('/home')">Home</el-link>
        </div>
        <el-button style="width: 200px;" @click="goBack">返回上一页</el-button>
      </div>
    </div>
  </div>
</template>
<script>
  import { defineComponent } from 'vue';
  import { useRouter } from 'vue-router'
  export default defineComponent({
    name: 'NotFound',
    setup() {
      const router = useRouter()
      const goHome = (path) => {
        router.push(path)
      }
      const goBack = () => {
        router.go(-1)
      }
      return { goHome, goBack }
    },
  });
</script>
<style scoped>
.error-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background-color: #f5f5f5;
  padding: 20px;
}

.error-container {
  text-align: center;
  max-width: 600px;
  padding: 40px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.6s ease;
}

.error-illustration {
  margin-bottom: 30px;
}

.error-code {
  font-size: 72px;
  font-weight: 700;
  margin: 0 0 10px;
  line-height: 1;
}

.error-title {
  font-size: 24px;
  font-weight: 500;
  color: #333;
  margin: 0 0 16px;
}

.error-description {
  font-size: 16px;
  color: #666;
  margin: 0 0 30px;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>