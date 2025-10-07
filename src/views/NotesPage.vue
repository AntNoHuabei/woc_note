<template>
  <NLayout class="notes-page-layout" has-sider>
    <!-- 左侧文件树面板 - 增加响应式控制 -->
    <NLayoutSider
      width="227"
      class="category-panel"
      :bordered="false"
      collapse-mode="width"
    >
      <!--分类-->
      <div style="padding: 16px; display: flex; flex-direction: column">
        <div class="category-header">
          <h2>分类</h2>
          <div class="header-actions">
            <NButton type="primary" quaternary circle>
              <template #icon>
                <CirclePlus />
              </template>
            </NButton>
          </div>
        </div>
        <Category v-model="categories" />
      </div>

      <div style="padding: 16px">
        <div class="category-header">
          <h2>标签</h2>
          <div class="header-actions">
            <NButton type="primary" quaternary circle>
              <template #icon>
                <CirclePlus />
              </template>
            </NButton>
          </div>
        </div>
        <Tags v-model="tags" />
      </div>
    </NLayoutSider>

    <!-- 右侧内容区域 -->
    <div class="right-content">
      <!-- 工具栏 -->
      <div class="notes-toolbar">
        <div class="toolbar-left">
          <!-- 返回按钮，仅在编辑模式下显示 -->
          <NButton
            v-if="isEditing"
            @click="exitEditMode"
            size="small"
            style="margin-right: 8px"
          >
            <template #icon>
              <ChevronLeft class="icon" />
            </template>
            返回列表
          </NButton>

          <!-- 搜索框，仅在列表模式下显示 -->
          <NInput
            v-if="!isEditing"
            v-model:value="searchKeyword"
            placeholder="搜索笔记"
            clearable
            size="small"
            style="width: 200px"
          >
            <template #prefix>
              <n-icon :component="Search" />
            </template>
          </NInput>
        </div>
        <div class="toolbar-right">
          <!-- 模式切换按钮，仅在列表模式下显示 -->
          <template v-if="!isEditing">
            <NButton
              :class="{ active: viewMode === 'grid' }"
              @click="switchToGridMode"
              size="small"
              style="margin-right: 8px"
            >
              <template #icon>
                <Grid3X3 class="icon" />
              </template>
            </NButton>
            <NButton
              :class="{ active: viewMode === 'list' }"
              @click="switchToListMode"
              size="small"
            >
              <template #icon>
                <List class="icon" />
              </template>
            </NButton>
          </template>
        </div>
      </div>

      <!-- 内容区域，根据状态切换显示笔记列表或编辑器 -->
      <div class="notes-content">
        <!-- 笔记列表模式 -->
        <div v-if="!isEditing" class="notes-list-container">
          <Notes
            v-model="notes"
            @note-click="handleNoteClick"
            @new-note="handleNewNote"
            :view-mode="viewMode"
          />
        </div>

        <!-- 编辑模式 -->
        <div v-else-if="selectedNote" class="editor-container">
          <Editor :note="selectedNote" @close="exitEditMode" />
        </div>
      </div>
    </div>
  </NLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NButton,
  NInput,
} from "naive-ui";
import {
  Search,
  Grid3X3,
  List,
  CirclePlus,
  ChevronLeft,
} from "lucide-vue-next";
import { useNotesStore } from "../store/notes";
import Tags from "../components/note/Tags.vue";
import Category from "../components/note/category.vue";
import Notes from "../components/note/notes.vue";
import Editor from "../components/note/editor.vue";
import { storeToRefs } from "pinia";
import type { Note } from "../types/note/tag";

const notesStore = useNotesStore();

const { tags, categories, notes } = storeToRefs(notesStore);
// 搜索关键词
const searchKeyword = ref("");

// 视图模式状态：grid 为卡片模式，list 为列表模式
const viewMode = ref<"grid" | "list">("grid");

// 编辑状态标志
const isEditing = ref(false);

// 当前选中的笔记
const selectedNote = ref<Note | null>(null);

// 切换到卡片模式
const switchToGridMode = () => {
  viewMode.value = "grid";
};

// 切换到列表模式
const switchToListMode = () => {
  viewMode.value = "list";
};

// 处理笔记点击事件
const handleNoteClick = (note: Note) => {
  // 进入编辑模式，隐藏列表
  isEditing.value = true;
  // 存储选中的笔记对象
  selectedNote.value = note;
};

// 退出编辑模式，返回列表
const exitEditMode = () => {
  isEditing.value = false;
  selectedNote.value = null;
  // 自动保存到数据库
  notesStore.saveToDatabase().catch((error) => {
    console.error("自动保存失败:", error);
  });
};

// 处理新建笔记事件
const handleNewNote = () => {
  // 创建一个新的笔记对象
  const newNote: Note = {
    id: Date.now().toString(), // 使用时间戳作为临时ID
    title: "无标题笔记",
    content: "",
    categoryId: "",
    tags: [],
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
  };

  notes.value.unshift(newNote);
  // 进入编辑模式
  isEditing.value = true;
  selectedNote.value = newNote;
};
</script>

<style scoped>
/* 优化样式，增加响应式和更好的空间分配 */
.notes-page-layout {
  height: 100%;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.category-panel {
  width: 226px;
  background-color: #fff;
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.1);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.category-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 优化工具栏布局 */
.notes-toolbar {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  gap: 16px;
  flex-wrap: wrap;
  height: 60px;
}

.right-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
}

.notes-content {
  flex: 1;
  overflow: hidden;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.icon {
  width: 16px;
  height: 16px;
}

/* 模式切换按钮样式 */
.toolbar-right .active {
  background-color: #e6f4ff;
  color: #1890ff;
}

/* 笔记列表容器样式 */
.notes-list-container {
  /* background: #fff; */
  /* border-radius: 8px; */
  /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); */
  max-height: 100%;
  overflow-y: auto;
}

/* 编辑器容器样式 */
.editor-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  height: 100%;
  min-height: 400px;
  overflow: hidden;
}
</style>
