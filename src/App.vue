<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Application } from './native/application';
import { AppManager } from './native/appManager';
import { apps } from './constants/apps';

const miniWindow = ref<HTMLDivElement>();
let wx: Application;
onMounted(() => {
  wx = new Application(miniWindow.value as HTMLElement);
})
const openMiniApp = (app: any) => {
  AppManager.openApp(app, wx);
}

/**
 * AppManager

用于创建一个小程序App和关闭小程序的入口管理类

MiniApp

小程序的实例类，这个类将完成小程序的初始化和调度管理工作

Application

基础应用类，这个类主要是用来模拟实现客户端挂载小程序，管理小程序的推入推出；
 */
</script>

<template>
  <main class="container w-screen h-screen bg-gray-100 p-6 box-border overflow-x-hidden flex flex-col gap-6">
    <div
      class="app-item flex items-center gap-4 px-4 py-2 rounded-md bg-white shadow-md cursor-pointer hover:bg-gray-200 overflow-hidden"
      v-for="app in apps" :key="app.appId" @click="openMiniApp(app)">
      <img class="app-logo w-10 h-10 rounded-md" :src="app.logo" />
      <span class="text-base">{{ app.name }}</span>
    </div>
  </main>
  <Teleport to="body">
    <div class="mini-body absolute top-0 left-0 z-10" ref="miniWindow"></div>
  </Teleport>
</template>