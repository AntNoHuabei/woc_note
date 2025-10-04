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
        @click="handleNoteClick(note)"
      >
        <div class="note-header">
          <h3 class="note-title">{{ note.title }}</h3>
          <p class="note-time">{{ formatTime(note.updateTime) }}</p>
        </div>
        <div class="note-content">
          {{ stripMarkdown(note.content).substring(0, 100) }}...
        </div>
        <div class="note-tags">
          <span v-for="tag in note.tags" :key="tag" class="tag">{{ tag }}</span>
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

      <div
        v-for="note in modelValue"
        :key="note.id"
        class="note-list-item"
        @click="handleNoteClick(note)"
      >
        <div class="note-list-main">
          <h3 class="note-list-title">{{ note.title }}</h3>
          <p class="note-list-content">
            {{ stripMarkdown(note.content).substring(0, 150) }}...
          </p>
        </div>
        <div class="note-list-meta">
          <p class="note-list-time">{{ formatTime(note.updateTime) }}</p>
          <div class="note-list-tags">
            <span v-for="tag in note.tags" :key="tag" class="tag">{{
              tag
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { NButton } from "naive-ui";
import { Grid3X3, List, Plus } from "lucide-vue-next";
import type { Note } from "../../types/note/tag";

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

// 处理笔记点击事件
const handleNoteClick = (note: Note) => {
  emit("note-click", note);
};

// 处理新建笔记事件
const handleNewNote = () => {
  emit("new-note");
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
</script>

<style scoped>
.notes-container {
  /* padding: 20px; */
  height: 100%;
  /* display: flex; */
  /* flex-direction: column; */
  /* 移除重复的背景色设置，让组件继承父组件的背景色 */
  overflow-y: auto;
}

/* 卡片模式样式 */
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  padding-bottom: 20px; /* 添加底部内边距，避免最后一排卡片被遮挡 */
}

/* 新建笔记卡片 */
.new-note-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 2px dashed #d9d9d9;
}

.new-note-card:hover {
  border-color: #1890ff;
  background-color: #f0f7ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.15);
}

.new-note-card-content {
  text-align: center;
  color: #999;
}

.new-note-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 10px;
}

.new-note-text {
  margin: 0;
  font-size: 16px;
}

/* 笔记卡片样式优化 */
.note-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border-top: 3px solid #1890ff; /* 增强顶部视觉效果 */
}

.note-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.note-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}

.note-card:hover::before {
  opacity: 1;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.note-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-time {
  margin: 0;
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.note-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0; /* 为标签区域添加顶部边框，增强底部视觉效果 */
  margin-top: 12px;
}

.tag {
  font-size: 12px;
  color: #1890ff;
  background-color: #e6f4ff;
  padding: 4px 12px;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.tag:hover {
  background-color: #1890ff;
  color: white;
}

/* 列表模式样式 */
.notes-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  padding-bottom: 20px; /* 添加底部内边距，避免最后一项被遮挡 */
}

/* 新建笔记列表项 */
.new-note-list-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 2px dashed #d9d9d9;
}

.new-note-list-item:hover {
  border-color: #1890ff;
  background-color: #f0f7ff;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.15);
}

.new-note-list-icon {
  width: 24px;
  height: 24px;
  color: #999;
}

.new-note-list-text {
  font-size: 16px;
  color: #999;
}

/* 笔记列表项样式优化 */
.note-list-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  border-left: 4px solid #1890ff; /* 设置左侧蓝色边框，增强顶部视觉效果 */
  border-bottom: 1px solid #f0f0f0; /* 添加底部边框，平衡视觉效果 */
}

.note-list-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  background-color: #fafafa;
}

.note-list-main {
  flex: 1;
  min-width: 0;
}

.note-list-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.note-list-content {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-list-meta {
  margin-left: 24px;
  min-width: 150px;
}

.note-list-time {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #999;
  text-align: right;
}

.note-list-tags {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.note-list-tags .tag {
  white-space: nowrap;
}

/* 滚动条样式优化 */
.notes-grid::-webkit-scrollbar,
.notes-list::-webkit-scrollbar {
  width: 8px;
}

.notes-grid::-webkit-scrollbar-track,
.notes-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.notes-grid::-webkit-scrollbar-thumb,
.notes-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.notes-grid::-webkit-scrollbar-thumb:hover,
.notes-list::-webkit-scrollbar-thumb:hover {
  background: #555;
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
}
</style>
