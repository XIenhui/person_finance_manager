<template>
  <el-dialog
      v-model="visible"
      title="提示"
      width="400px"
      :before-close="handleClose"
  >
    <span>{{ message }}</span>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const visible = ref(true)

const handleConfirm = () => {
  emit('confirm')
  visible.value = false
}

const handleCancel = () => {
  emit('cancel')
  visible.value = false
}

const handleClose = (done) => {
  emit('cancel')
  done()
}
</script>