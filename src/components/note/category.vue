<template>
  <div class="category-container">
    <div
      class="category-item"
      :class="{ selected: selectedCategoryId === '-1' }"
      @click="selectCategory('-1')"
    >
      <Folder :size="16" class="category-icon" />
      <span class="category-text">全部</span>
    </div>

    <template v-for="category in modelValue" :key="category.id">
      <div
        class="category-item"
        :class="{ selected: selectedCategoryId === category.id }"
        @click="selectCategory(category.id)"
      >
        <Folder :size="16" class="category-icon" />
        <span class="category-text">{{ category.name }}</span>
        <NPopconfirm
          placement="right"
          @positive-click="handleConfirmDelete(category.id, category.name)"
        >
          <template #trigger>
            <button class="delete-btn" @click.stop title="删除分类">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </template>

          确定要删除分类"{{ category.name }}"吗？<br />
          删除后，该分类下的所有笔记将变为未分类。
        </NPopconfirm>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { defineModel, ref } from "vue";
import { Folder } from "lucide-vue-next";
import { NPopconfirm } from "naive-ui";
import { Category } from "../../types/note/tag";
import { useNotesStore } from "../../store/notes";

const modelValue = defineModel<Category[]>({
  required: true,
  default: () => [],
});

// 选中的分类ID
const selectedCategoryId = ref<string>("-1");
const notesStore = useNotesStore();

// 定义 emit
const emit = defineEmits<{
  "category-change": [categoryId: string];
}>();

// 选择分类（单选逻辑）
const selectCategory = (categoryId: string) => {
  selectedCategoryId.value = categoryId;
  emit("category-change", categoryId);
};

// 确认删除分类
const handleConfirmDelete = (categoryId: string, categoryName: string) => {
  notesStore.deleteCategory(categoryId);
  // 确保删除后不会选中不存在的分类
  if (selectedCategoryId.value === categoryId) {
    selectedCategoryId.value = "-1";
  }
};
</script>

<style lang="less" scoped>
.category-container {
  width: 100%;
  padding: 4px 6px;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  justify-content: space-between;
  background: white;
  border: 1px solid transparent;
}

.category-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #2563eb;
  opacity: 0;
  border-radius: 8px 0 0 8px;
  transition: opacity 0.25s ease;
}

.category-item:hover {
  background: #f9fafb;
  border-color: #e5e7eb;
}

.category-item:hover::before {
  opacity: 0.3;
}

.category-item.selected {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.category-item.selected::before {
  opacity: 1;
}

.category-icon {
  margin-right: 8px;
  flex-shrink: 0;
  transition: all 0.25s ease;
  color: #6b7280;
}

.category-item:hover .category-icon {
  color: #2563eb;
}

.category-item.selected .category-icon {
  color: #2563eb;
}

.category-text {
  font-size: 13px;
  color: #111827;
  flex: 1;
  font-weight: 500;
  transition: color 0.25s ease;
}

.category-item:hover .category-text {
  color: #2563eb;
}

.category-item.selected .category-text {
  color: #1e40af;
  font-weight: 600;
}

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
  color: #9ca3af;
  opacity: 0;
  transition: all 0.25s ease;
}

.category-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #fef2f2;
  color: #dc2626;
}
</style>
