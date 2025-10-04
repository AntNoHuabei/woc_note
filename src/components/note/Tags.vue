<template>
  <div class="tags-container">
    <div style="height: 10px;width: 100%;">&nbsp;</div>
    <div
      v-for="tag in modelValue"
      :key="tag"
      :class="['tag', `tag-color-${getTagColorIndex(tag)}`, { 'selected': selectedTags.includes(tag) }]"
    >
      <div @click.stop="toggleSelectedTag(tag)" class="tag-content">
        <Tag :size="12" class="tag-icon" />
        <span class="tag-text">{{ tag }}</span>
        <span v-if="selectedTags.includes(tag)" class="selected-indicator">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M1.75 5L4 7.25L8.25 2.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>
      
      <NPopconfirm 
        placement="right"
        @positive-click="handleDeleteTag(tag)"
      >
        <template #trigger>
          <button
            class="delete-btn"
            @click.stop
            title="删除标签"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3.5 3.5L8.5 8.5M8.5 3.5L3.5 8.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </template>
    
          确定要删除标签"{{ tag }}"吗？<br>
          删除后，所有使用该标签的笔记将移除该标签。

      </NPopconfirm>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Tag } from "lucide-vue-next";
import { NPopconfirm } from "naive-ui";
import { ref, defineModel } from "vue";
import { useNotesStore } from "../../store/notes";

const modelValue = defineModel<string[]>({
  required: true,
  default: () => []
});

const selectedTags = ref<string[]>([]);
const notesStore = useNotesStore();

// 切换标签选择状态
const toggleSelectedTag = (tag: string) => {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tag);
  } else {
    selectedTags.value.push(tag);
  }
};

// 删除标签
const handleDeleteTag = (tag: string) => {
  notesStore.removeTag(tag);
  // 从选中的标签中移除已删除的标签
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tag);
  }
};

// 获取标签颜色索引
const getTagColorIndex = (tag: string): number => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  return Math.abs(hash) % 8;
};
</script>

<style scoped>
/* 现代化的标签容器 */
.tags-container {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

/* 基础标签样式 - 更精致的设计 */
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 18px;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 4px;
  border: 1.5px solid transparent;
  background-origin: border-box;
  position: relative;
  overflow: hidden;
  justify-content: space-between;
}

/* 标签内容区域 */
.tag-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 添加微妙的背景渐变和质感 */
.tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
}

/* 标签内部元素样式优化 */
.tag-icon {
  flex-shrink: 0;
  opacity: 0.85;
  transition: opacity 0.2s ease;
}

.tag-text {
  flex-shrink: 0;
  font-weight: 400;
  letter-spacing: 0.2px;
}

.selected-indicator {
  flex-shrink: 0;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 删除按钮样式 */
.delete-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  color: #999;
  opacity: 0;
  transition: all 0.2s ease;
}

.tag:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background-color: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
}

/* 悬停效果 - 更精致的反馈 */
.tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tag:hover .tag-icon {
  opacity: 1;
}

/* 选中状态 - 更明显的视觉变化 */
.tag.selected {
  transform: translateY(-1px) scale(1.03);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  font-weight: 500;
}

.tag.selected .selected-indicator {
  opacity: 1;
  transform: scale(1);
}

/* 8种精心挑选的柔和色彩方案 */
.tag-color-0 {
  background-color: #f0f7ff;
  color: #2979ff;
  border-color: #bbdefb;
}

.tag-color-0.selected {
  background-color: #2979ff;
  color: white;
  border-color: #1e88e5;
}

.tag-color-1 {
  background-color: #fce4ec;
  color: #e91e63;
  border-color: #f8bbd0;
}

.tag-color-1.selected {
  background-color: #e91e63;
  color: white;
  border-color: #c2185b;
}

.tag-color-2 {
  background-color: #e8f5e8;
  color: #4caf50;
  border-color: #c8e6c9;
}

.tag-color-2.selected {
  background-color: #4caf50;
  color: white;
  border-color: #388e3c;
}

.tag-color-3 {
  background-color: #fff3e0;
  color: #ff9800;
  border-color: #ffe0b2;
}

.tag-color-3.selected {
  background-color: #ff9800;
  color: white;
  border-color: #f57c00;
}

.tag-color-4 {
  background-color: #f3e5f5;
  color: #9c27b0;
  border-color: #e1bee7;
}

.tag-color-4.selected {
  background-color: #9c27b0;
  color: white;
  border-color: #7b1fa2;
}

.tag-color-5 {
  background-color: #e0f2f1;
  color: #009688;
  border-color: #b2dfdb;
}

.tag-color-5.selected {
  background-color: #009688;
  color: white;
  border-color: #00796b;
}

.tag-color-6 {
  background-color: #f5f5f5;
  color: #616161;
  border-color: #e0e0e0;
}

.tag-color-6.selected {
  background-color: #616161;
  color: white;
  border-color: #424242;
}

.tag-color-7 {
  background-color: #ede7f6;
  color: #673ab7;
  border-color: #d1c4e9;
}

.tag-color-7.selected {
  background-color: #673ab7;
  color: white;
  border-color: #5e35b1;
}

/* 添加脉冲动画效果提升视觉吸引力 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(41, 121, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(41, 121, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(41, 121, 255, 0);
  }
}

/* 为第一个选中的标签添加脉冲效果 */
.tag.selected:nth-child(1) {
  animation: pulse 1.5s ease-out;
}
</style>
