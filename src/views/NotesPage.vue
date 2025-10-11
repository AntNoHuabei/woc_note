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
            <NButton
              type="primary"
              quaternary
              circle
              @click="showAddCategoryDialog"
            >
              <template #icon>
                <CirclePlus />
              </template>
            </NButton>
          </div>
        </div>
        <Category
          v-model="categories"
          @category-change="handleCategoryChange"
        />
      </div>

      <div style="padding: 16px">
        <div class="category-header">
          <h2>标签</h2>
          <div class="header-actions">
            <NButton type="primary" quaternary circle @click="showAddTagDialog">
              <template #icon>
                <CirclePlus />
              </template>
            </NButton>
          </div>
        </div>
        <Tags v-model="tags" @tags-change="handleTagsChange" />
      </div>
    </NLayoutSider>

    <!-- 右侧内容区域 -->
    <div class="right-content">
      <!-- 工具栏 -->
      <div class="notes-toolbar" v-if="!isEditing">
        <div class="toolbar-left">
          <!-- 搜索框，仅在列表模式下显示 -->
          <NInput
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
          <!-- 模式切换按钮 -->
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
        </div>
      </div>

      <!-- 内容区域，根据状态切换显示笔记列表或编辑器 -->
      <div class="notes-content">
        <!-- 笔记列表模式 -->
        <div v-if="!isEditing" class="notes-list-container">
          <Notes
            v-model="filteredNotes"
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

  <!-- 添加分类弹窗 -->
  <NModal
    v-model:show="isAddCategoryDialogVisible"
    title="添加分类"
    :closable="false"
    :mask-closable="false"
    preset="dialog"
  >
    <div style="padding: 20px 0">
      <NInput
        v-model:value="newCategoryName"
        placeholder="请输入分类名称"
        :maxlength="20"
        show-count
        @keyup.enter="handleAddCategory"
      />
    </div>
    <template #action>
      <NButton @click="isAddCategoryDialogVisible = false">取消</NButton>
      <NButton
        type="primary"
        @click="handleAddCategory"
        :disabled="!newCategoryName.trim()"
      >
        确定
      </NButton>
    </template>
  </NModal>

  <!-- 添加标签弹窗 -->
  <NModal
    v-model:show="isAddTagDialogVisible"
    title="添加标签"
    :closable="false"
    :mask-closable="false"
    preset="dialog"
  >
    <div style="padding: 20px 0">
      <NInput
        v-model:value="newTagName"
        placeholder="请输入标签名称"
        :maxlength="20"
        show-count
        @keyup.enter="handleAddTag"
      />
    </div>
    <template #action>
      <NButton @click="isAddTagDialogVisible = false">取消</NButton>
      <NButton
        type="primary"
        @click="handleAddTag"
        :disabled="!newTagName.trim()"
      >
        确定
      </NButton>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NButton,
  NInput,
  NDialog,
  NModal,
} from "naive-ui";
import {
  Search,
  Grid3X3,
  List,
  CirclePlus,
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

// 选中的分类ID
const selectedCategoryId = ref<string>("-1");

// 选中的标签列表
const selectedTagsList = ref<string[]>([]);

// 视图模式状态：grid 为卡片模式，list 为列表模式
const viewMode = ref<"grid" | "list">("grid");

// 编辑状态标志
const isEditing = ref(false);

// 当前选中的笔记
const selectedNote = ref<Note | null>(null);

// 添加分类相关的变量
const isAddCategoryDialogVisible = ref(false);
const newCategoryName = ref("");

// 添加标签相关的变量
const isAddTagDialogVisible = ref(false);
const newTagName = ref("");

// 筛选后的笔记列表
const filteredNotes = computed(() => {
  let result = notes.value;

  // 1. 按分类筛选
  if (selectedCategoryId.value !== "-1") {
    result = result.filter(
      (note) => note.categoryId === selectedCategoryId.value
    );
  }

  // 2. 按标签筛选（笔记必须包含所有选中的标签）
  if (selectedTagsList.value.length > 0) {
    result = result.filter((note) => {
      if (!note.tags || note.tags.length === 0) return false;
      return selectedTagsList.value.every((selectedTag) =>
        note.tags.includes(selectedTag)
      );
    });
  }

  // 3. 按搜索关键词筛选（标题或内容包含关键词）
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase();
    result = result.filter(
      (note) =>
        note.title.toLowerCase().includes(keyword) ||
        note.content.toLowerCase().includes(keyword)
    );
  }

  return result;
});

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

// 显示添加分类弹窗
const showAddCategoryDialog = () => {
  newCategoryName.value = "";
  isAddCategoryDialogVisible.value = true;
};

// 显示添加标签弹窗
const showAddTagDialog = () => {
  newTagName.value = "";
  isAddTagDialogVisible.value = true;
};

// 处理添加分类
const handleAddCategory = () => {
  const categoryName = newCategoryName.value.trim();
  if (categoryName) {
    notesStore.createCategory(categoryName);
    isAddCategoryDialogVisible.value = false;
  }
};

// 处理添加标签
const handleAddTag = () => {
  const tagName = newTagName.value.trim();
  if (tagName) {
    notesStore.addTag(tagName);
    isAddTagDialogVisible.value = false;
  }
};

// 处理分类变化
const handleCategoryChange = (categoryId: string) => {
  selectedCategoryId.value = categoryId;
};

// 处理标签变化
const handleTagsChange = (tags: string[]) => {
  selectedTagsList.value = tags;
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
  /* box-shadow: 1px 0 4px rgba(0, 0, 0, 0.1); */
  border-right: 1px solid #e5e7eb;
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
  width: calc(100% - 227px);
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
  /*  padding: 20px;*/
  box-sizing: border-box;
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
