<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <div class="main-container">
    <header class="header">
      <h1>工作内容</h1>
      <div class="nav-buttons">
        <button @click="router.push('/notes')" class="nav-button">
          笔记
        </button>
        <button @click="router.push('/code-repository')" class="nav-button">
          代码仓库
        </button>
        <button @click="router.push('/weekly-report')" class="nav-button">
          周报
        </button>
      </div>
    </header>
    
    <main class="content">
      <div class="empty-state">
        <h2>工作内容页面</h2>
        <p>此页面用于管理和展示工作内容。</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.main-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-buttons {
  display: flex;
  gap: 10px;
}

.nav-button {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.nav-button:hover {
  background-color: #e0e0e0;
}

.content {
  flex: 1;
  padding: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
</style>