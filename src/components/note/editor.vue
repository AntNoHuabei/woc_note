<template>
  <div class="editor-container">
    <!-- 编辑器头部 -->
    <div class="editor-header">
      <input
        v-if="note"
        v-model="note.title"
        class="editor-title-input"
        placeholder="无标题笔记"
        @blur="handleTitleBlur"
      />
      <h3 v-else class="editor-title">无标题笔记</h3>
    </div>

    <!-- 分类和标签选择区域 -->
    <div v-if="note" class="editor-meta">
      <div class="meta-item">
        <label class="meta-label">分类：</label>
        <select
          :value="note.categoryId || ''"
          class="category-select"
          @change="handleCategoryChange"
        >
          <option value="">未分类</option>
          <option
            v-for="category in notesStore.categories"
            :key="category.id"
            :value="category.id"
          >
            {{ getCategoryPath(category) }}
          </option>
        </select>
      </div>

      <div class="meta-item">
        <label class="meta-label">标签：</label>
        <div class="tag-selector">
          <span
            v-for="tag in notesStore.tags"
            :key="tag"
            :class="['tag-option', { selected: note.tags.includes(tag) }]"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </span>
          <input
            v-model="newTag"
            @keyup.enter="addNewTag"
            placeholder="添加标签"
            class="new-tag-input"
          />
        </div>
      </div>
    </div>

    <!-- vditor编辑器容器 -->
    <div ref="editorRef" class="editor-content"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import Vditor from "vditor";
import "vditor/dist/index.css";
import type { Note, Category } from "../../types/note/tag";
import { useNotesStore } from "../../store/notes";

const notesStore = useNotesStore();

// 从父组件接收笔记对象
const note = defineModel<Note>("note");

const editorRef = ref<HTMLDivElement>();
const newTag = ref("");
let vditorInstance: Vditor | null = null;

// 初始化编辑器
onMounted(() => {
  if (editorRef.value && note.value) {
    vditorInstance = new Vditor(editorRef.value, {
      value: note.value.content || "",
      mode: "wysiwyg", // 所见即所得模式
      cache: {
        enable: false,
      },
      upload: {
        accept: "image/*",
        url: "/api/upload",
        fieldName: "file",
      },
      input: (value) => {
        if (note.value) {
          notesStore.updateNote(note.value.id, {
            content: value,
            updateTime: new Date().toLocaleString("zh-CN"),
          });
        }
      },
    });
  }
});

// 处理标题失焦事件
const handleTitleBlur = () => {
  if (note.value) {
    notesStore.updateNote(note.value.id, {
      title: note.value.title,
      updateTime: new Date().toLocaleString("zh-CN"),
    });
  }
};

// 处理分类变更
const handleCategoryChange = (event: Event) => {
  if (!note.value) return;

  const selectElement = event.target as HTMLSelectElement;
  const categoryId = selectElement.value;

  notesStore.moveNoteToCategory(note.value.id, categoryId);
};

// 切换标签选择状态
const toggleTag = (tag: string) => {
  if (!note.value) return;

  // 创建新数组避免直接修改原数组
  const currentTags = [...note.value.tags];
  const tagIndex = currentTags.indexOf(tag);

  if (tagIndex > -1) {
    currentTags.splice(tagIndex, 1);
  } else {
    currentTags.push(tag);
  }
  note.value.tags = currentTags;
  note.value.updateTime = new Date().toLocaleString("zh-CN");
  // notesStore.updateNote(note.value.id, {
  //   tags: currentTags,
  //   updateTime: new Date().toLocaleString("zh-CN")
  // });
};

// 添加新标签
const addNewTag = () => {
  if (!note.value || !newTag.value.trim()) return;

  const tag = newTag.value.trim();

  // 先通过store添加标签
  notesStore.addTag(tag);

  // 然后将标签添加到当前笔记
  const currentTags = [...note.value.tags];
  if (!currentTags.includes(tag)) {
    currentTags.push(tag);
    notesStore.updateNote(note.value.id, {
      tags: currentTags,
      updateTime: new Date().toLocaleString("zh-CN"),
    });
  }

  newTag.value = "";
};

// 获取分类的完整路径
const getCategoryPath = (category: Category): string => {
  const getParentName = (parentId: string | null): string => {
    if (!parentId) return "";
    const parent = notesStore.categories.find((cat) => cat.id === parentId);
    if (!parent) return "";
    const grandParentName = getParentName(parent.parentId);
    return grandParentName ? `${grandParentName}/${parent.name}` : parent.name;
  };

  const parentPath = getParentName(category.parentId);
  return parentPath ? `${parentPath}/${category.name}` : category.name;
};

// 监听笔记对象变化
watch(
  () => note,
  (newNote) => {
    if (newNote && newNote.value) {
      if (vditorInstance) {
        vditorInstance.setValue(newNote.value.content || "");
      }
    }
  },
  { deep: true }
);

// 组件卸载时销毁编辑器实例
onBeforeUnmount(() => {
  if (vditorInstance) {
    vditorInstance.destroy();
    vditorInstance = null;
  }
});
</script>

<style scoped>
.editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.editor-header {
  padding: 16px 20px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.editor-title-input {
  border: none;
  background: transparent;
  font-size: 18px;
  font-weight: 500;
  color: #333;
  flex: 1;
  padding: 4px 0;
  outline: none;
  font-family: inherit;
}

/* 分类和标签选择区域样式 */
.editor-meta {
  padding: 12px 20px;
  background-color: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-label {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.category-select {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  background-color: #fff;
  outline: none;
  min-width: 150px;
}

.category-select:hover {
  border-color: #40a9ff;
}

.category-select:focus {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  flex: 1;
  min-width: 300px;
}

.tag-option {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #fff;
}

.tag-option:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.tag-option.selected {
  background-color: #e6f4ff;
  border-color: #40a9ff;
  color: #40a9ff;
}

.new-tag-input {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 16px;
  font-size: 13px;
  outline: none;
  min-width: 120px;
}

.new-tag-input:hover {
  border-color: #40a9ff;
}

.new-tag-input:focus {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.editor-content {
  /* flex: 1; */
  height: 800px;
  overflow-x: auto;
  overflow-y: auto;
}

/* vditor编辑器样式调整 */
:deep(.vditor) {
  height: 100%;
  border: none;
  font-size: 14px;
}

:deep(.vditor-content) {
  height: calc(100% - 50px);
}
</style>
