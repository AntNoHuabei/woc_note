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

// 选择分类（单选逻辑）
const selectCategory = (categoryId: string) => {
  selectedCategoryId.value = categoryId;
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
}

.category-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 2px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border-left: 3px solid transparent;
  justify-content: space-between;
}

.category-item:hover {
  background-color: #f0f2f5;
}

.category-item.selected {
  background-color: #e6f1ff;
  border-left-color: #2979ff;
  font-weight: 500;
}

.category-icon {
  margin-right: 8px;
  flex-shrink: 0;
}

.category-item.selected .category-icon {
  color: #2979ff;
}

.category-text {
  font-size: 14px;
  color: #333;
  flex: 1;
}

.category-item.selected .category-text {
  color: #2979ff;
}

.delete-btn {
  width: 24px;
  height: 24px;
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

.category-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background-color: #f5f5f5;
  color: #ff4d4f;
}
</style>
