import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  base: "./",
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: [".ts", ".js", ".json", ".vue", ".less", ".*"],
  },

  build: {
    outDir: "dist", // 明确指定输出目录
    assetsDir: "assets", // 资源文件目录
    emptyOutDir: true, // 构建前清空输出目录
    rollupOptions: {
      input: {
        main: "./index.html" // 默认入口文件路径
      },
      output: {
        // 入口文件命名规则
        entryFileNames: "assets/js/[name]-[hash].js",
        // 代码分割后的 chunk 文件名
        chunkFileNames: "assets/js/[name]-[hash].js",
        // 静态资源文件名
        assetFileNames: ({ name }) => {
          const ext = name?.split('.').pop()
          if (/\.(png|jpe?g|gif|svg|webp)$/.test(name ?? '')) {
            return "assets/images/[name]-[hash][extname]"
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(name ?? '')) {
            return "assets/fonts/[name]-[hash][extname]"
          }
          if (/\.css$/.test(name ?? '')) {
            return "assets/css/[name]-[hash][extname]"
          }
          return "assets/other/[name]-[hash][extname]"
        }
      }
    }
  }
})
