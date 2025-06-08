<template>
  <div class="header">
    <div class="titleWrapper" :class="{ 'collapsed': isCollapse }">
      <el-icon><school /></el-icon>
      <transition name="title-fade">
        <span class="title" v-show="!isCollapse">{{ title }}</span>
      </transition>
    </div>
    <div class="contraction">
      <el-button v-show="!isCollapse" @click="setContraction(true)">
        <el-icon size="18"><Fold /></el-icon>
      </el-button>
      <el-button v-show="isCollapse" @click="setContraction(false)">
        <el-icon size="18"><Expand /></el-icon>
      </el-button>
    </div>
    <div class="subTitleWrapper">
      <span> {{ subTitle }}</span>
    </div>
  </div>
</template>

<script>
import {defineComponent, ref, watch} from 'vue';
import { useMainStore } from '@/store/index.js'
import {Expand, Fold, School} from "@element-plus/icons-vue";
export default defineComponent({
  name: 'Header',
  components: {School, Expand, Fold},
  setup() {
    const store = useMainStore();
    const title = ref(store.title);
    const curSymbol = ref();
    const subTitle = ref(store.subTitle);
    const isCollapse = ref(store.menuCollapse);
    const setContraction = (state) => {
      isCollapse.value = !isCollapse.value;
      store.commit('changeMenuCollapse', state);
    }
    watch(() => store.title,
        (newVal) => title.value = newVal,
        {deep: true, immediate: true}
    )
    watch(() => store.subTitle,
        (newVal) => subTitle.value = newVal,
        {deep: true, immediate: true}
    )
    return {
      title,
      subTitle,
      curSymbol,
      isCollapse,
      setContraction,
    };
  },
});
</script>

<style scoped>
.header {
  margin: 0;
  height: 100%;
  background-color: white;
  white-space: nowrap;
  border-bottom: 1px solid rgba(96, 96, 96, 0.1);
  display: flex;
  justify-content: left;
  align-items: center;
  text-align: center;
}
.titleWrapper {
  height: 100%;
  padding-right: 10px;
  border-right: 1px solid rgba(96, 96, 96, 0.1);
  display: inline-flex;
  align-items: center;
  font-size: 16px;
  color: #3461c7;
  font-weight: 600;
  transition:
      width 0.5s ease;
  overflow: hidden;
}
.titleWrapper:not(.collapsed) {
  width: 280px;
}
.titleWrapper.collapsed {
  width: 61px;;
  padding-right: 0;
}
.logo {
  width: 30px;
  height: 30px;
  margin: 0 8px 0 18px;
  flex-shrink: 0;
}
.title {
  white-space: nowrap;
  transform-origin: left center;
}
.subTitleWrapper {
  height: 100%;
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.contraction {
  height: 100%;
}
.contraction .el-button {
  margin: 0;
  height: 100%;
  border: none;
}
.title-fade-enter-active,
.title-fade-leave-active {
  transition: all 0.3s ease;
}

.title-fade-enter-from,
.title-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
