<template>
  <div class="notes-container">
    <!-- 笔记列表 - 卡片模式 -->
    <div v-if="viewMode === 'grid'" class="notes-grid">
      <!-- 新建笔记卡片 -->
      <div class="new-note-card" @click="handleNewNote">
        <div class="new-note-card-content">
          <Plus class="new-note-icon" />
          <p class="new-note-text">创建新笔记</p>
        </div>
      </div>

      <div
        v-for="note in modelValue"
        :key="note.id"
        class="note-card"
        @click.stop="handleNoteClick(note)"
      >
        <div class="note-header">
          <h3 class="note-title">{{ note.title }}</h3>
          <div 
            class="note-meta"
            :class="{ 'no-category': !getCategoryName(note.categoryId) }"
          >
            <span
              v-if="getCategoryName(note.categoryId)"
              class="category-badge"
            >
              {{ getCategoryName(note.categoryId) }}
            </span>
            <span class="note-time">{{ formatTime(note.updateTime) }}</span>
          </div>
        </div>
        <div 
          class="note-content"
          :class="{ 'no-tags': !note.tags || note.tags.length === 0 }"
        >
          {{ stripMarkdown(note.content).substring(0, 100) }}...
        </div>
        <div v-if="note.tags && note.tags.length > 0" class="note-tags">
          <span 
            v-for="(tag, index) in note.tags" 
            :key="tag" 
            class="tag"
            :data-color-index="index % 8"
          >
            {{ tag }}
          </span>
        </div>
        <div class="note-actions">
          <button
            class="delete-button"
            @click.stop="showDeleteDialog(note)"
            title="删除笔记"
          >
            <Delete :size="18" />
          </button>
        </div>
      </div>
    </div>

    <!-- 笔记列表 - 列表模式 -->
    <div v-else class="notes-list">
      <!-- 新建笔记列表项 -->
      <div class="new-note-list-item" @click="handleNewNote">
        <Plus class="new-note-list-icon" />
        <span class="new-note-list-text">创建新笔记</span>
      </div>

      <div v-for="note in modelValue" :key="note.id" class="note-list-item">
        <div class="note-list-main" @click.stop="handleNoteClick(note)">
          <div 
            class="note-list-header"
            :class="{ 'no-category': !getCategoryName(note.categoryId) }"
          >
            <h3 class="note-list-title">{{ note.title }}</h3>
            <span
              v-if="getCategoryName(note.categoryId)"
              class="category-badge"
            >
              {{ getCategoryName(note.categoryId) }}
            </span>
          </div>
          <p 
            class="note-list-content"
            :class="{ 'no-tags': !note.tags || note.tags.length === 0 }"
          >
            {{ stripMarkdown(note.content).substring(0, 150) }}...
          </p>
        </div>
        <div class="note-list-meta">
          <p class="note-list-time">{{ formatTime(note.updateTime) }}</p>
          <div v-if="note.tags && note.tags.length > 0" class="note-list-tags">
            <span 
              v-for="(tag, index) in note.tags" 
              :key="tag" 
              class="tag"
              :data-color-index="index % 8"
            >
              {{ tag }}
            </span>
          </div>
        </div>
        <div class="note-list-actions">
          <button
            class="delete-button"
            @click.stop="showDeleteDialog(note)"
            title="删除笔记"
          >
            <Delete :size="18" />
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 - 修改为与添加分类弹窗一致的风格 -->
    <NModal
      v-model:show="deleteDialogVisible"
      title="删除笔记"
      :closable="false"
      :mask-closable="false"
      preset="dialog"
    >
      <div style="padding: 20px 0">
        确定要删除笔记 "{{ selectedNote?.title }}" 吗？此操作不可恢复。
      </div>
      <template #action>
        <NButton @click="cancelDelete">取消</NButton>
        <NButton type="primary" danger @click="handleDeleteNote"
          >确定删除</NButton
        >
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { NButton, NModal } from "naive-ui";
import { Grid3X3, List, Plus, Delete } from "lucide-vue-next";
import type { Note } from "../../types/note/tag";
import { useNotesStore } from "../../store/notes";

// 获取笔记store
const notesStore = useNotesStore();

// 定义组件的 props
const modelValue = defineModel<Note[]>({
  required: true,
  default: () => [],
});

// 从父组件接收视图模式
const props = defineProps<{
  viewMode: "grid" | "list";
}>();

// 定义组件的事件
const emit = defineEmits<{
  "note-click": [note: Note];
  "new-note": [];
}>();

// 删除相关变量
const deleteDialogVisible = ref(false);
const selectedNote = ref<Note | null>(null);

// 处理笔记点击事件
const handleNoteClick = (note: Note) => {
  emit("note-click", note);
};

// 处理新建笔记事件
const handleNewNote = () => {
  emit("new-note");
};

// 显示删除确认对话框
const showDeleteDialog = (note: Note) => {
  selectedNote.value = note;
  deleteDialogVisible.value = true;
};

// 取消删除
const cancelDelete = () => {
  deleteDialogVisible.value = false;
  selectedNote.value = null;
};

// 处理删除笔记
const handleDeleteNote = () => {
  if (selectedNote.value) {
    notesStore.deleteNote(selectedNote.value.id);
    deleteDialogVisible.value = false;
    selectedNote.value = null;
  }
};

// 格式化时间显示
const formatTime = (timeString: string) => {
  // 这里可以根据需要实现更复杂的时间格式化逻辑
  return timeString;
};

// 简单的 Markdown 去除函数
const stripMarkdown = (content: string) => {
  // 这只是一个简单的实现，实际应用中可能需要更复杂的处理
  return content
    .replace(/#+\s+/g, "")
    .replace(/\*\*|\*/g, "")
    .replace(/`{1,3}/g, "")
    .replace(/\n+/g, " ")
    .trim();
};

// 通过分类ID获取分类名称
const getCategoryName = (categoryId: string): string => {
  if (!categoryId || !notesStore.categories.length) return "";
  const category = notesStore.categories.find((cat) => cat.id === categoryId);
  return category ? category.name : "";
};
</script>

<style scoped>
.notes-container {
  height: 100%;
  overflow-y: auto;
  background: #ffffff;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  padding-right: 16px;
  padding-bottom: 32px;
}

.new-note-card {
  background: linear-gradient(to bottom, #ffffff 0%, #fefefe 100%);
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 170px;
  border: 2px dashed #d1d5db;
  position: relative;
  overflow: hidden;
}

.new-note-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(37, 99, 235, 0.02) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.new-note-card:hover {
  border-color: #2563eb;
  background: #ffffff;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
}

.new-note-card:hover::after {
  opacity: 1;
}

.new-note-card-content {
  text-align: center;
  color: #6b7280;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.new-note-card:hover .new-note-card-content {
  color: #2563eb;
}

.new-note-icon {
  width: 38px;
  height: 38px;
  margin-bottom: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.65;
}

.new-note-card:hover .new-note-icon {
  transform: scale(1.1);
  opacity: 1;
}

.new-note-text {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.note-card {
  background: linear-gradient(to bottom, #ffffff 0%, #fefefe 100%);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.note-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.note-card:hover::before {
  opacity: 1;
}

.note-card:hover {
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06);
  transform: translateY(-4px);
  border-color: #d1d5db;
}

.note-header {
  margin-bottom: 18px;
  position: relative;
}

.note-title {
  margin: 0 0 14px 0;
  font-size: 17px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
  letter-spacing: -0.02em;
}

.note-card:hover .note-title {
  color: #2563eb;
}

.note-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 22px;
  flex-wrap: wrap;
}

.note-meta.no-category {
  min-height: 18px;
}

.note-time {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  font-weight: 500;
  line-height: 1.5;
  display: flex;
  align-items: center;
  padding: 2px 8px;
  background: #f9fafb;
  border-radius: 4px;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  font-size: 11px;
  font-weight: 600;
  color: #1e40af;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 6px;
  transition: all 0.3s ease;
  letter-spacing: 0.02em;
  box-shadow: 0 1px 2px rgba(30, 64, 175, 0.08);
}

.category-badge:hover {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(30, 64, 175, 0.12);
}

.note-content {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.65;
  margin-bottom: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
  transition: color 0.3s ease;
}

.note-content.no-tags {
  padding-bottom: 4px;
}

.note-card:hover .note-content {
  color: #1f2937;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 14px;
  border-top: 1px solid #f3f4f6;
  margin-top: 16px;
}

.tag {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px 3px 6px;
  border-radius: 3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.02em;
  position: relative;
  padding-left: 10px;
  text-transform: uppercase;
}

.tag::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 3px 0 0 3px;
  opacity: 0.8;
}

.tag[data-color-index="0"] {
  color: #dc2626;
  background: #fee2e2;
}
.tag[data-color-index="0"]::before {
  background: #dc2626;
}

.tag[data-color-index="1"] {
  color: #ea580c;
  background: #ffedd5;
}
.tag[data-color-index="1"]::before {
  background: #ea580c;
}

.tag[data-color-index="2"] {
  color: #ca8a04;
  background: #fef3c7;
}
.tag[data-color-index="2"]::before {
  background: #ca8a04;
}

.tag[data-color-index="3"] {
  color: #16a34a;
  background: #dcfce7;
}
.tag[data-color-index="3"]::before {
  background: #16a34a;
}

.tag[data-color-index="4"] {
  color: #0891b2;
  background: #cffafe;
}
.tag[data-color-index="4"]::before {
  background: #0891b2;
}

.tag[data-color-index="5"] {
  color: #2563eb;
  background: #dbeafe;
}
.tag[data-color-index="5"]::before {
  background: #2563eb;
}

.tag[data-color-index="6"] {
  color: #7c3aed;
  background: #ede9fe;
}
.tag[data-color-index="6"]::before {
  background: #7c3aed;
}

.tag[data-color-index="7"] {
  color: #db2777;
  background: #fce7f3;
}
.tag[data-color-index="7"]::before {
  background: #db2777;
}

.tag:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  filter: brightness(0.95);
}

.note-actions {
  position: absolute;
  top: 18px;
  right: 18px;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
  transform: scale(0.9);
}

.note-card:hover .note-actions {
  opacity: 1;
  transform: scale(1);
}

.delete-button {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid #e5e7eb;
  padding: 7px;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.delete-button:hover {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
  border-color: #fca5a5;
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}

.notes-list {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  padding-right: 16px;
  padding-bottom: 32px;
  background: #ffffff;
}

.new-note-list-item {
  background: linear-gradient(to right, #ffffff 0%, #fefefe 100%);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 14px;
  border: 2px dashed #d1d5db;
  position: relative;
  overflow: hidden;
}

.new-note-list-item::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(37, 99, 235, 0.02) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.new-note-list-item:hover {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
  transform: translateX(3px);
}

.new-note-list-item:hover::after {
  opacity: 1;
}

.new-note-list-icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
  transition: all 0.3s ease;
  opacity: 0.65;
  position: relative;
  z-index: 1;
}

.new-note-list-item:hover .new-note-list-icon {
  color: #2563eb;
  transform: scale(1.1);
  opacity: 1;
}

.new-note-list-text {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  transition: color 0.3s ease;
  letter-spacing: 0.02em;
  position: relative;
  z-index: 1;
}

.new-note-list-item:hover .new-note-list-text {
  color: #2563eb;
}

.note-list-item {
  background: linear-gradient(to right, #ffffff 0%, #fefefe 100%);
  border-radius: 12px;
  padding: 22px 26px;
  margin-bottom: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.note-list-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.note-list-item:hover::before {
  opacity: 1;
}

.note-list-item:hover {
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06);
  border-color: #d1d5db;
  transform: translateX(3px);
}

.note-list-main {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.note-list-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  min-height: 24px;
  flex-wrap: wrap;
}

.note-list-header.no-category {
  min-height: 20px;
  margin-bottom: 8px;
}

.note-list-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  line-height: 1.5;
  flex: 1;
  transition: color 0.3s ease;
  letter-spacing: -0.02em;
}

.note-list-item:hover .note-list-title {
  color: #2563eb;
}

.note-list-content {
  margin: 0;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.65;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
}

.note-list-content.no-tags {
  padding-bottom: 4px;
}

.note-list-item:hover .note-list-content {
  color: #1f2937;
}

.note-list-meta {
  margin-left: 28px;
  min-width: 130px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.note-list-time {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  text-align: right;
  font-weight: 500;
  line-height: 1.5;
  padding: 2px 8px;
  background: #f9fafb;
  border-radius: 4px;
  display: inline-block;
}

.note-list-tags {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 7px;
  margin-top: 10px;
}

.note-list-tags .tag {
  white-space: nowrap;
}

.note-list-actions {
  margin-left: 20px;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
  transform: scale(0.9);
}

.note-list-item:hover .note-list-actions {
  opacity: 1;
  transform: scale(1);
}

.notes-grid::-webkit-scrollbar,
.notes-list::-webkit-scrollbar {
  width: 10px;
}

.notes-grid::-webkit-scrollbar-track,
.notes-list::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}

.notes-grid::-webkit-scrollbar-thumb,
.notes-list::-webkit-scrollbar-thumb {
  background: #e4e4e7;
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: all 0.25s ease;
}

.notes-grid::-webkit-scrollbar-thumb:hover,
.notes-list::-webkit-scrollbar-thumb:hover {
  background: #a1a1aa;
  background-clip: padding-box;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notes-grid {
    grid-template-columns: 1fr;
  }

  .note-list-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .note-list-meta {
    margin-left: 0;
    min-width: auto;
    width: 100%;
  }

  .note-list-time,
  .note-list-tags {
    text-align: left;
    align-items: flex-start;
  }

  .note-list-actions {
    margin-left: 0;
    align-self: flex-end;
  }
}
</style>
