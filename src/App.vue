<template>
  <div id="app">
    <el-container style="height: 100vh">
      <el-header style="padding: 0; height: 42px; width: 100%; z-index: 1">
        <Header v-show="!isNotFound" />
      </el-header>
      <div style="display: flex; height: 100%">
        <Sidebar v-show="!isNotFound" />
        <el-scrollbar style="height: calc(100vh - 60px); width: 100%">
          <el-main style="height: 100%; padding-bottom: 0">
            <div class="router-container">
              <router-view v-slot="{ Component }">
                <transition name="fade-transform" mode="out-in">
                    <component :is="Component" />
                </transition>
              </router-view>
            </div>
          </el-main>
        </el-scrollbar>
      </div>
    </el-container>
  </div>
</template>
<script>
  import { ref, defineComponent, watch } from 'vue';
  import Sidebar from '@/components/Sidebar.vue';
  import Header from '@/components/Header.vue';
  import { useMainStore } from '@/store/index.js';

  export default defineComponent({
    name: 'Index',
    components: { Sidebar, Header },
    setup() {
      const store = useMainStore();
      const isNotFound = ref(false);
      watch(
        () => store.notFound,
        (newVal) => {
          isNotFound.value = newVal;
        },
        { immediate: true, deep: true }
      );
      return { isNotFound };
    },
  });
</script>
<style>
  :root {
    --el-color-primary: #386bf8 !important;
  }
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: left;
    width: 100%;
    height: 100%;
  }
  body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    color: #2c3e50;
    background-color: #f8fcfc;
  }
  .router-container {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 630px;
  }
  .fade-transform-leave-active,
  .fade-transform-enter-active {
    transition: all 0.2s;
  }
  .fade-transform-enter-from {
    opacity: 0;
    transform: translateX(-30px);
  }
  .fade-transform-leave-to {
    opacity: 0;
    transform: translateX(30px);
  }
</style>
