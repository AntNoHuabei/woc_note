<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "../store/app";
import WindowControls from "./StatusBar/WindowControls.vue";

const appStore = useAppStore();

onMounted(() => {
  // 初始化时更新一次时间
  appStore.updateCurrentTime();
});
</script>

<template>
  <div class="status-bar">
    <!-- 中间区域留空 -->
    <div class="status-bar-center">
      <!-- 去除工作台文字 -->
      <slot name="content"></slot>
    </div>

    <!-- 右侧功能区 -->
    <div class="status-bar-right">
      <!-- 移动时间显示到右侧 -->
      <!-- <span class="current-time">{{ appStore.currentTime }}</span> -->

      <!-- 主题切换器 -->
      <!-- <ThemeSelector class="status-bar-item" /> -->

      <!-- 隔离元素 -->
      <!-- <div class="status-bar-divider"></div> -->

      <!-- 窗口控制按钮 -->
      <WindowControls class="status-bar-item" />
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  height: 50px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  padding: 0 0;
  /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); */
  z-index: 1000;
  user-select: none;
  app-region: drag;
  border-bottom: 1px solid #e5e7eb;
  
}

/* 黑暗主题适配 */
:global(body.theme-dark) .status-bar {
  background-color: #1a1a1a;
  border-bottom: 1px solid #333;
  color: white;
}

.status-bar-center {
  /* display: flex; */
  /* align-items: center; */
  /* flex: 1; */
  /* justify-content: center; */
  max-width: calc(100% - 280px);
  app-region: no-drag;
}

/* 移除工作台标题样式 */

/* 调整时间样式 - 移动到右侧后更突出显示 */
.current-time {
  font-size: 13px;
  color: #bdc3c7;
  margin-right: 8px;
  font-family: "Courier New", monospace;
}

.status-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 隔离元素样式 */
.status-bar-divider {
  width: 1px;
  height: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.5px;
}

/* 黑暗主题适配 */
:global(body.theme-dark) .status-bar {
  background-color: #1a1a1a;
  border-bottom: 1px solid #333;
}

:global(body.theme-dark) .current-time {
  color: #a0a0a0;
}

:global(body.theme-dark) .status-bar-divider {
  background-color: rgba(255, 255, 255, 0.1);
}
.status-bar-item {
  app-region: no-drag;
}
</style>
