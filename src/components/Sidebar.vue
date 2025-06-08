<template>
  <div class="sideWrapper">
    <el-menu
        class="el-menu-vertical-demo"
        unique-opened
        :default-active="activeItem"
        :collapse="isCollapse"
        @open="handleOpen"
        @close="handleClose"
    >
      <template v-for="item in list" :key="item.path">
        <!-- 子菜单 -->
        <el-sub-menu v-if="item.children?.length" :index="item.path">
          <template #title>
            <component :is="item.icon" />
            <span style="margin-left: 8px">{{ item.label }}</span>
          </template>
          <el-menu-item
              v-for="child in item.children"
              :key="child.path"
              class="singleItem"
              @click="router.push(child.path)"
              :index="child.path"
          >
            <component :is="child.icon" />
            <span style="margin-left: 8px">{{ child.label }}</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 普通菜单项 -->

        <el-tooltip
            v-else
            effect="light"
            placement="right"
            :disabled="!isCollapse"
            :content="item.label"
        >
          <el-menu-item
              class="singleItem"
              @click="router.push(item.path)"
              :index="item.path"
          >
            <component :is="item.icon" />
            <span style="margin-left: 8px">{{ item.label }}</span>
          </el-menu-item>
        </el-tooltip>
      </template>
    </el-menu>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
import { useMainStore } from '@/store/index.js'
import { ref, watch } from "vue";

export default {
  setup() {
    const router = useRouter();
    const store = useMainStore();
    const activeItem = ref('');
    const isCollapse = ref(store.menuCollapse);
    const list = ref(store.curList);
    const handleOpen = () => {
      //TODO
    };
    const handleClose = () => {
      //TODO
    };
    watch(() => router.currentRoute.value.fullPath,
        () => {
          activeItem.value = router.currentRoute.value.fullPath;
        },
        {deep: true, immediate: true}
    )
    watch(() => store.menuCollapse,
        (newVal) => {
          isCollapse.value = newVal;
        },
        {deep: true, immediate: true}
    )
    watch(() => store.curList,
        (newVal) => {
          list.value = newVal;
        },
        {deep: true, immediate: true}
    )
    return { isCollapse, list, router, activeItem, handleOpen, handleClose };
  },
};
</script>

<style scoped>
.sideWrapper {
  background-color: white;
}
.singleItem {
  font-size: 14px;
  font-weight: normal;
  height: 50px;
  display: flex;
  justify-content: left;
  align-items: center;
  text-align: center;
}
.el-menu-vertical-demo:not(.el-menu--collapse) {
   width: 200px;
 }
.el-menu-vertical-demo.el-menu--collapse  {
  width: 61px;
}
.el-menu-vertical-demo.el-menu--collapse .el-menu-item  {
  padding-right: 0;
}
.el-menu-item:hover {
  background-color: #f0f7ff;
  color: #386BF8;
}
</style>
