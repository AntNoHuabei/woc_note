<template>
  <div class="editor-container">
    <!-- 编辑器头部 -->
    <div class="editor-header">
      <NButton text class="back-button" @click="emit('close')">
        <template #icon>
          <ChevronLeft :size="20" />
        </template>
      </NButton>
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
            v-for="(tag, index) in notesStore.tags"
            :key="tag"
            :class="['tag-option', { selected: note.tags.includes(tag) }]"
            :data-color-index="index % 8"
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
import { NButton } from "naive-ui";
import { ChevronLeft } from "lucide-vue-next";
import Vditor from "vditor";
import "vditor/dist/index.css";
import type { Note, Category } from "../../types/note/tag";
import { useNotesStore } from "../../store/notes";

const notesStore = useNotesStore();

// 从父组件接收笔记对象
const note = defineModel<Note>("note");

// 定义事件
const emit = defineEmits<{
  close: [];
}>();

const editorRef = ref<HTMLDivElement>();
const newTag = ref("");
let vditorInstance: Vditor | null = null;

// 初始化编辑器
onMounted(() => {
  if (editorRef.value && note.value) {
    vditorInstance = new Vditor(editorRef.value, {
      toolbar: [
        "undo",
        "redo",
        "emoji",
        "headings",
        "bold",
        "italic",
        "strike",
        "|",
        "line",
        "quote",
        "list",
        "table",
        "list",
        "ordered-list",
        "check",
        "outdent",
        "indent",
        "code",
        "inline-code",
        "insert-after",
        "insert-before",
        "link",

        "edit-mode",
        "outline",
        "code-theme",
        "br",
      ],
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
  const currentTags = note.value.tags;
  const tagIndex = currentTags.indexOf(tag);

  if (tagIndex > -1) {
    currentTags.splice(tagIndex, 1);
  } else {
    currentTags.push(tag);
  }
  //note.value.tags = currentTags;
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
  background: linear-gradient(to bottom, #ffffff 0%, #fefefe 100%);
  /* border-radius: 12px; */
  overflow: hidden;
  /* padding: 0 20px; */
  /* box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04); */
  /* border: 1px solid #e5e7eb; */
}

.editor-header {
  box-sizing: border-box;
  padding: 20px 24px;
  background: linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%);
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  align-items: center;
  position: relative;
}

.back-button {
  color: #6b7280;
  transition: all 0.3s ease;
  flex-shrink: 0;
  padding: 4px;
  border-radius: 6px;
}

.back-button:hover {
  color: #2563eb;
  background: #f3f4f6;
}

.editor-header::after {
  content: "";
  position: absolute;
  bottom: -3px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
  opacity: 0.6;
}

.editor-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  flex: 1;
  letter-spacing: -0.02em;
}

.editor-title-input {
  border: none;
  background: transparent;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  flex: 1;
  padding: 6px 0;
  outline: none;
  font-family: inherit;
  letter-spacing: -0.02em;
  transition: color 0.3s ease;
}

.editor-title-input:focus {
  color: #2563eb;
}

/* 分类和标签选择区域样式 */
.editor-meta {
  padding: 16px 24px;
  background: linear-gradient(to bottom, #fafbfc 0%, #f9fafb 100%);
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-label {
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.category-select {
  padding: 8px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  outline: none;
  min-width: 160px;
  color: #111827;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.category-select:hover {
  border-color: #2563eb;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
}

.category-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px 3px 6px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.02em;
  position: relative;
  padding-left: 10px;
  text-transform: uppercase;
  opacity: 0.5;
}

.tag-option::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 3px 0 0 3px;
  opacity: 0.8;
}

.tag-option[data-color-index="0"] {
  color: #dc2626;
  background: #fee2e2;
}
.tag-option[data-color-index="0"]::before {
  background: #dc2626;
}

.tag-option[data-color-index="1"] {
  color: #ea580c;
  background: #ffedd5;
}
.tag-option[data-color-index="1"]::before {
  background: #ea580c;
}

.tag-option[data-color-index="2"] {
  color: #ca8a04;
  background: #fef3c7;
}
.tag-option[data-color-index="2"]::before {
  background: #ca8a04;
}

.tag-option[data-color-index="3"] {
  color: #16a34a;
  background: #dcfce7;
}
.tag-option[data-color-index="3"]::before {
  background: #16a34a;
}

.tag-option[data-color-index="4"] {
  color: #0891b2;
  background: #cffafe;
}
.tag-option[data-color-index="4"]::before {
  background: #0891b2;
}

.tag-option[data-color-index="5"] {
  color: #2563eb;
  background: #dbeafe;
}
.tag-option[data-color-index="5"]::before {
  background: #2563eb;
}

.tag-option[data-color-index="6"] {
  color: #7c3aed;
  background: #ede9fe;
}
.tag-option[data-color-index="6"]::before {
  background: #7c3aed;
}

.tag-option[data-color-index="7"] {
  color: #db2777;
  background: #fce7f3;
}
.tag-option[data-color-index="7"]::before {
  background: #db2777;
}

.tag-option:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  filter: brightness(0.95);
  opacity: 1;
}

.tag-option.selected {
  opacity: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transform: scale(1.05);
}

.new-tag-input {
  padding: 6px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  min-width: 140px;
  background: white;
  color: #111827;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.new-tag-input::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

.new-tag-input:hover {
  border-color: #2563eb;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
}

.new-tag-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.editor-content {
  box-sizing: border-box;
  flex: 1;
  height: 800px;
  overflow-x: auto;
  overflow-y: auto;
  background: white;
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
