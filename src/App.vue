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
          :is="activeTabs.find(tab => tab.path === activeTab)?.component"
          :key="activeTab"
        />
      </div>
    </main>
  </div>
</template>

<style>
/* 基础样式设置，适用于整个应用 */
:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;

  color: #0f0f0f;
  background-color: #f6f6f6;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

/* 重置默认样式，确保各组件样式一致性 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 应用容器 - 实现侧边栏+主内容区的布局 */
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar {
  width: 57px;
  background-color: #f0f0f0;
  color: #333;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  align-items: center;
}

.sidebar-header {
  padding: 16px 0;
  border-bottom: 1px solid #34495e;
  width: 100%;
  text-align: center;
}

.statusbar {
  width: calc(100vw-57px);
}

/* Logo样式 */
.logo {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 57px;
  height: 50px;
}

.logo-icon {
  font-size: 24px;
  /* color: #3498db; */
}

/* 导航菜单 */
.main-nav {
  flex: 1;
  padding: 0 0;
  width: 100%;
}

.main-nav ul {
  list-style: none;
}

.nav-item {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 14px 0;
  color: #333;
  cursor: pointer;
  transition: background-color 500ms ease;
  position: relative;
}

.nav-item:hover {
  background-color: #e3e3e3;
}

.nav-item.active {
  background-color: #e3e3e3;
  color: #333;
}

/* 为激活项添加左侧高亮边框 */
.nav-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background-color: #333333;
}

.nav-icon {
  font-size: 20px;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 内容包装器 */
.content-wrapper {
  height: calc(100vh - 50px);
  padding: 0;
}

/* 调整侧边栏按钮间距 */
.main-nav li {
  margin-bottom: 8px;
}

/* 调整新建按钮样式 */
.nav-item:hover .nav-icon {
  /* color: #3498db; */
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

/* 全局主题样式 - 只保留明亮和黑暗两种主题 */
body.theme-dark {
  background-color: #1a1a1a;
  color: #ffffff;
}

body.theme-dark .toolbar {
  background-color: #2d2d2d;
  border-bottom-color: #404040;
}

body.theme-dark .toolbar-left h2 {
  color: #ffffff;
}

body.theme-dark .content-wrapper {
  background-color: #1a1a1a;
}

/* 确保在暗色主题下链接也是可见的 */
body.theme-dark a {
  color: #8cb4ff;
}

body.theme-dark a:hover {
  color: #a8c6ff;
}

/* 响应式设计 - 确保在不同宽度的PC屏幕上都有良好体验 */
@media (max-width: 1024px) {
  /* 保持窄侧边栏设计 */
  .sidebar {
    width: 57px;
  }
}
.nav-tab-item {
  font-size: 14px;
}
</style>
