import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'url'; // 从 url 模块导入所需函数
import { resolve } from 'path';

// 获取当前文件的目录路径
const __dirname = fileURLToPath(new URL('.', import.meta.url));

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [vue(), tailwindcss()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'), // 将 @ 指向 src 目录
      '@components': resolve(__dirname, './src/components'), // 自定义其他别名
    },
  },
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));