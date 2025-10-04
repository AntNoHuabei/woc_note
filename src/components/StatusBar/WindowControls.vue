<template>
  <div class="window-controls">
    <button
      class="window-control-btn minimize-btn"
      @click="handleMinimize"
      @mouseenter="buttonHovered = 'minimize'"
      @mouseleave="buttonHovered = null"
      :class="{ hovered: buttonHovered === 'minimize' }"
      title="最小化"
    >
      <Minus :size="16" />
    </button>
    <button
      class="window-control-btn maximize-btn"
      @click="handleMaximize"
      @mouseenter="buttonHovered = 'maximize'"
      @mouseleave="buttonHovered = null"
      :class="{ hovered: buttonHovered === 'maximize' }"
      title="最大化"
    >
      <Maximize :size="16" />
    </button>
    <button
      class="window-control-btn close-btn"
      @click="handleClose"
      @mouseenter="buttonHovered = 'close'"
      @mouseleave="buttonHovered = null"
      :class="{ hovered: buttonHovered === 'close' }"
      title="关闭"
    >
      <X :size="16" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import { Window } from "@tauri-apps/api/window";

const appWindow = new Window("main");

const buttonHovered = ref<string | null>(null);
import { Minus, Maximize, X } from "lucide-vue-next";

// 在Web环境中，这些功能只能模拟，实际应用中会被Tauri或Electron的原生API替代
const handleMinimize = () => {
  appWindow.minimize();
  // 实际应用中，这里会调用Tauri的API：invoke('minimize_window')
};

const handleMaximize = () => {
  appWindow.isMaximized().then((isMaximized) => {
    console.log(isMaximized);
    if (isMaximized) {
      appWindow.unmaximize();
    } else {
      appWindow.maximize();
    }
  });
};

const handleClose = () => {
  appWindow.close();
  // 实际应用中，这里会调用Tauri的API：invoke('close_window')
};
</script>

<style scoped>
.window-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.window-control-btn {
  width: 45px;
  height: 50px;
  border: none;
  border-radius: 4px;
  background-color: transparent;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

/* 基础悬停效果 */
.window-control-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
  transform: scale(1.05);
}

/* 最小化按钮悬停效果 */
.minimize-btn:hover {
  background-color: rgba(52, 152, 219, 0.3);
}

.minimize-btn:hover svg {
  color: #3498db;
}

/* 最大化按钮悬停效果 */
.maximize-btn:hover {
  background-color: rgba(46, 204, 113, 0.3);
}

.maximize-btn:hover svg {
  color: #2ecc71;
}

/* 关闭按钮悬停效果 */
.close-btn:hover {
  background-color: #e74c3c;
  transform: scale(1.1);
}

.close-btn:hover svg {
  color: white;
}

/* 黑暗主题适配 */
:global(body.theme-dark) .window-control-btn {
  color: white;
}

:global(body.theme-dark) .window-control-btn:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

:global(body.theme-dark) .minimize-btn:hover {
  background-color: rgba(52, 152, 219, 0.2);
}

:global(body.theme-dark) .maximize-btn:hover {
  background-color: rgba(46, 204, 113, 0.2);
}

:global(body.theme-dark) .window-control-btn::after {
  background-color: rgba(255, 255, 255, 0.02);
}
</style>
