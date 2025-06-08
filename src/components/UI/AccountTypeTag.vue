<template>
  <el-tag
      v-if="info.name"
      :color="info.color || '#ffffff'"
      effect="dark"
      class="name-tag"
      disable-transitions
      :style="{'border-color': info.color || '#000000'}"
  >
    <div style="display: flex;align-items: center">
      <el-icon v-if="info.icon" class="mr-1">
        <component :is="info.icon" />
      </el-icon>
      <span :style="{color: info.color ? '#ffffff' : '#000000' }">{{ info.name }}</span>
    </div>
  </el-tag>
</template>

<script setup>
const props = defineProps({
  info: {
    type: Object,
    default: () => {}
  },
})
</script>

<style scoped>
.name-tag {
  border: 1px solid;
}
</style>