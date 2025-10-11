<script setup lang="ts">
import { ref, markRaw } from "vue";
import { useAppStore } from "./store/app";
import StatusBar from "./components/StatusBar.vue";

// 导入图标
import {
  NotebookPen,
  Drill,
  GitGraph,
  Code,
  Flag,
  Plus,
} from "lucide-vue-next";

// 导入页面组件
import NotesPage from "./views/NotesPage.vue";
import WorkContentPage from "./views/WorkContentPage.vue";
import CodeRepositoryPage from "./views/CodeRepositoryPage.vue";
import WeeklyReportPage from "./views/WeeklyReportPage.vue";

import { NTab, NTabs } from "naive-ui";

const appStore = useAppStore();
// 当前激活的标签页
const activeTab = ref("/notes");

// 导航菜单项
const menuItems = [
  {
    path: "/notes",
    name: "笔记",
    icon: markRaw(NotebookPen),
    component: markRaw(NotesPage),
  },
  {
    path: "/work-content",
    name: "工作内容",
    icon: markRaw(Drill),
    component: markRaw(WorkContentPage),
  },
  {
    path: "/code-repository",
    name: "代码仓库",
    icon: markRaw(GitGraph),
    component: markRaw(CodeRepositoryPage),
  },
  {
    path: "/weekly-report",
    name: "周报",
    icon: markRaw(Flag),
    component: markRaw(WeeklyReportPage),
  },
];

// 活跃的标签页列表 - 默认只包含笔记
const activeTabs = ref([
  {
    path: "/notes",
    name: "笔记",
    component: markRaw(NotesPage),
    isClosable: false,
  },
]);

// 处理标签页切换
const handleTabChange = (tabPath: string) => {
  activeTab.value = tabPath;
  // 如果切换的标签页不存在于活跃标签页列表中，则添加它
  if (!activeTabs.value.find((tab) => tab.path === tabPath)) {
    const menuItem = menuItems.find((item) => item.path === tabPath);
    if (menuItem) {
      activeTabs.value.push({
        path: menuItem.path,
        name: menuItem.name,
        component: menuItem.component,
        isClosable: true, // 非第一个标签页都可以关闭
      });
    }
  }
};

// 处理标签页关闭
const handleTabClose = (tabPath: string | number) => {
  // 过滤掉要关闭的标签页
  const newTabs = activeTabs.value.filter((tab) => tab.path !== tabPath);

  // 如果关闭的是当前活跃标签页，则切换到第一个可用标签页
  if (tabPath === activeTab.value && newTabs.length > 0) {
    activeTab.value = newTabs[0].path;
  }

  activeTabs.value = newTabs;
};

// 新建标签页
const handleCreateTab = () => {
  // 生成唯一的ID
  const uniqueId = Date.now().toString();
  const newTab = {
    path: `/notes-${uniqueId}`,
    name: `笔记-${uniqueId.substring(uniqueId.length - 4)}`,
    component: markRaw(NotesPage),
    isClosable: true,
  };

  activeTabs.value.push(newTab);
  activeTab.value = newTab.path;
};
</script>

<template>
  <div class="app-container">
    <!-- 左侧导航栏 -->
    <aside class="sidebar">
      <div class="logo">
        <!--logo-->
      </div>
      <nav class="main-nav">
        <ul>
          <li v-for="item in menuItems" :key="item.path">
            <div
              class="nav-item"
              :class="{ active: activeTab === item.path }"
              :title="item.name"
              @click="handleTabChange(item.path)"
            >
              <component :is="item.icon" class="nav-icon" :size="20" />
            </div>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 状态栏组件 - 固定在顶部 -->
      <StatusBar class="statusbar">
        <template v-slot:content>
          <NTabs
            tab-class="nav-tab-item"
            v-model:value="activeTab"
            addable
            closable
            type="card"
            class="full-height-tabs"
            @close="handleTabClose"
            @add="handleCreateTab"
          >
            <NTab
              v-for="tab in activeTabs"
              :key="tab.path"
              :label="tab.name"
              :name="tab.path"
              :closable="tab.isClosable"
            />
          </NTabs>
        </template>
      </StatusBar>
      <!-- 使用动态组件渲染当前激活的标签页内容 -->
      <div class="content-wrapper">
        <component
          :is="activeTabs.find((tab) => tab.path === activeTab)?.component"
          :key="activeTab"
        />
      </div>
    </main>
  </div>
</template>

<style scoped lang="less">
:root {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  font-weight: 400;
  color: #111827;
  background-color: #ffffff;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #fafbfc;
}

.sidebar {
  width: 60px;
  background: linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%);
  color: #111827;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.06);
  align-items: center;
  // border-right: 1px solid #e5e7eb;
  position: relative;
  z-index: 10;
}

.sidebar-header {
  padding: 16px 0;
  border-bottom: 1px solid #e5e7eb;
  width: 100%;
  text-align: center;
}

.statusbar {
  width: calc(100vw - 60px);
}

.logo {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 50px;
  // border-bottom: 1px solid #e5e7eb;
}

.logo-icon {
  font-size: 24px;
}

.main-nav {
  flex: 1;
  padding: 12px 0;
  width: 100%;
}

.main-nav ul {
  list-style: none;
  padding: 0 8px;
}

.nav-item {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 0;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border-radius: 10px;
  margin-bottom: 6px;
}

.nav-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
  border-radius: 0 3px 3px 0;
  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item:hover {
  background: #f3f4f6;
  color: #2563eb;
}

.nav-item:hover::before {
  height: 50%;
}

.nav-item.active {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.nav-item.active::before {
  height: 60%;
}

.nav-icon {
  font-size: 20px;
  transition: transform 0.3s ease;
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
}

.nav-item.active .nav-icon {
  transform: scale(1.05);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
}

.content-wrapper {
  height: calc(100vh - 50px);
  padding: 0;
  overflow: hidden;
}

/* 调整侧边栏按钮间距 */
.main-nav li {
  margin-bottom: 0;
}

/* 全屏高度的标签页 */
.full-height-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.full-height-tabs .el-tabs__content {
  flex: 1;
  overflow: auto;
  padding: 0;
}

.full-height-tabs .el-tab-pane {
  height: 100%;
  padding: 0;
}

/* 标签页样式优化 */
:deep(.n-tabs .n-tabs-nav) {
  background: transparent;
  padding: 0;
}

:deep(.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab) {
  padding: 10px 18px;
  color: #6b7280;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  margin: 0 4px;
  background: transparent;
  border: 1px solid transparent;
  box-shadow: none;
  position: relative;
  letter-spacing: 0.01em;
}

:deep(.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab::before) {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0 0 8px 8px;
}

:deep(.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab:hover) {
  color: #2563eb;
  background: linear-gradient(to bottom, #fefefe 0%, #f9fafb 100%);
  border-color: #e5e7eb;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

:deep(.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab:hover::before) {
  opacity: 0;
}

:deep(
    .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active
  ) {
  color: #2563eb;
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  transform: none;
}

:deep(
    .n-tabs
      .n-tabs-nav.n-tabs-nav--card-type
      .n-tabs-tab.n-tabs-tab--active::before
  ) {
  opacity: 1;
  height: 2px;
}

:deep(
    .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab .n-tabs-tab__close
  ) {
  color: #9ca3af;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 6px;
  border-radius: 4px;
  padding: 2px;
  opacity: 0;
  pointer-events: none;
}

:deep(
    .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab:hover .n-tabs-tab__close
  ) {
  opacity: 1;
  pointer-events: auto;
}

:deep(
    .n-tabs
      .n-tabs-nav.n-tabs-nav--card-type
      .n-tabs-tab
      .n-tabs-tab__close:hover
  ) {
  color: #dc2626;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.15);
}

:deep(.n-tabs .n-tabs-tab-pad) {
  border: none;
}

:deep(.n-tabs .n-tabs-pad) {
  border: none;
}

/* 暗色主题 */
body.theme-dark {
  background-color: #1f2937;
  color: #f9fafb;
}

body.theme-dark .app-container {
  background: #111827;
}

body.theme-dark .sidebar {
  background: linear-gradient(to bottom, #1f2937 0%, #111827 100%);
  border-right-color: #374151;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.3);
}

body.theme-dark .logo {
  border-bottom-color: #374151;
}

body.theme-dark .nav-item {
  color: #9ca3af;
}

body.theme-dark .nav-item:hover {
  background: #374151;
  color: #60a5fa;
}

body.theme-dark .nav-item.active {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: #93c5fd;
}

body.theme-dark .main-content {
  background: #111827;
}

body.theme-dark .content-wrapper {
  background-color: #111827;
}

body.theme-dark a {
  color: #60a5fa;
}

body.theme-dark a:hover {
  color: #93c5fd;
}

/* 暗色主题标签页样式 */
body.theme-dark :deep(.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab) {
  background: transparent;
  border-color: transparent;
  color: #9ca3af;
  box-shadow: none;
}

body.theme-dark
  :deep(.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab:hover) {
  color: #60a5fa;
  background: linear-gradient(to bottom, #1f2937 0%, #1a202c 100%);
  border-color: #374151;
  box-shadow: 0 2px 6px rgba(96, 165, 250, 0.15), 0 1px 3px rgba(0, 0, 0, 0.3);
}

body.theme-dark
  :deep(.n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab:hover::before) {
  opacity: 0;
}

body.theme-dark
  :deep(
    .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active
  ) {
  color: #93c5fd;
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

body.theme-dark
  :deep(
    .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab.n-tabs-tab--active::before
  ) {
  opacity: 1;
  height: 2px;
  background: linear-gradient(90deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%);
}

body.theme-dark
  :deep(
    .n-tabs .n-tabs-nav.n-tabs-nav--card-type .n-tabs-tab .n-tabs-tab__close
  ) {
  color: #6b7280;
}

body.theme-dark
  :deep(
    .n-tabs
      .n-tabs-nav.n-tabs-nav--card-type
      .n-tabs-tab
      .n-tabs-tab__close:hover
  ) {
  color: #f87171;
  background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
  box-shadow: 0 2px 4px rgba(248, 113, 113, 0.25);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .sidebar {
    width: 60px;
  }

  .statusbar {
    width: calc(100vw - 60px);
  }
}
</style>
