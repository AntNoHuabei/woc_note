<template>
  <div class="tags-container">
    <div style="height: 10px;width: 100%;">&nbsp;</div>
    <div
      v-for="(tag, index) in modelValue"
      :key="tag"
      :class="['tag', { 'selected': selectedTags.includes(tag) }]"
      :data-color-index="index % 8"
    >
      <div @click.stop="toggleSelectedTag(tag)" class="tag-content">
        <span class="tag-text">{{ tag }}</span>
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

// 定义 emit
const emit = defineEmits<{
  "tags-change": [tags: string[]];
}>();

// 切换标签选择状态
const toggleSelectedTag = (tag: string) => {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tag);
  } else {
    selectedTags.value.push(tag);
  }
  emit("tags-change", selectedTags.value);
};

// 删除标签
const handleDeleteTag = (tag: string) => {
  notesStore.removeTag(tag);
  // 从选中的标签中移除已删除的标签
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tag);
  }
};

</script>

<style scoped>
.tags-container {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
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
  gap: 6px;
}

.tag-content {
  display: inline-flex;
  align-items: center;
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

.tag-text {
  flex-shrink: 0;
}

.delete-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: scale(0.9);
}

.tag:hover .delete-btn {
  opacity: 1;
  transform: scale(1);
}

.delete-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(220, 38, 38, 0.3);
  color: #dc2626;
  transform: scale(1.1);
}

.tag:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  filter: brightness(0.95);
}

.tag.selected {
  transform: translateY(-2px) scale(1.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  filter: brightness(0.9);
}

/* 8种活泼配色 - 书签样式 */
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
</style>
