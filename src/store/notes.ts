import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import { Category, Note } from "../types/note/tag";
import NotesDatabaseService from "../services/notesDatabaseService";
import { toRaw } from "vue";

export const useNotesStore = defineStore("notes", () => {
  // 使用 ref 和 reactive 定义响应式状态
  const notes = ref<Note[]>([]);
  const categories = ref<Category[]>([]);
  const tags = ref<string[]>([]);

  // 从数据库加载数据到store
  const loadFromDatabase = async () => {
    try {
      const data = await NotesDatabaseService.loadAllData();

      // 更新状态
      if (data.notes) notes.value = data.notes;
      if (data.categories) categories.value = data.categories;
      if (data.tags) tags.value = data.tags;
    } catch (error) {
      console.error("从数据库加载数据失败:", error);
    }
  };

  // 从store序列化数据到数据库
  const saveToDatabase = async () => {
    try {
      console.log(notes.value);
      console.log(categories.value);
      console.log(tags.value);
      await NotesDatabaseService.saveAllData({
        notes: structuredClone(toRaw(notes.value)),
        categories: structuredClone(toRaw(categories.value)),
        tags: structuredClone(toRaw(tags.value)),
      });
    } catch (error) {
      console.error("保存数据到数据库失败:", error);
    }
  };

  // 更新笔记
  const updateNote = (id: string, updates: Partial<Note>) => {
    const index = notes.value.findIndex((note) => note.id === id);
    if (index !== -1) {

      notes.value[index] = {
        ...toRaw(notes.value[index]),
        ...updates,
        updateTime: new Date().toLocaleString("zh-CN"),
      };
      console.log(notes.value[index]);
      // 自动保存到数据库
      saveToDatabase().catch((error) => {
        console.error("自动保存失败:", error);
      });
    }
  };

  // 创建新笔记
  const createNote = (note: Omit<Note, "id" | "createTime" | "updateTime">) => {
    const newNote: Note = {
      ...note,
      id: Date.now().toString(),
      createTime: new Date().toLocaleString("zh-CN"),
      updateTime: new Date().toLocaleString("zh-CN"),
    };
    notes.value.push(newNote);

    // 自动保存到数据库
    saveToDatabase().catch((error) => {
      console.error("自动保存失败:", error);
    });
  };

  // 删除笔记
  const deleteNote = (id: string) => {
    const index = notes.value.findIndex((note) => note.id === id);
    if (index !== -1) {
      notes.value.splice(index, 1);

      // 自动保存到数据库
      saveToDatabase().catch((error) => {
        console.error("自动保存失败:", error);
      });
    }
  };

  // 创建分类/文件夹 - 增加parentId参数
  const createCategory = (name: string, parentId: string | null = null) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      parentId,
      createTime: new Date().toLocaleString("zh-CN"),
    };
    categories.value.push(newCategory);
    // 自动保存到数据库
    saveToDatabase().catch((error) => {
      console.error("自动保存失败:", error);
    });
  };

  // 更新分类
  const updateCategory = (id: string, name: string) => {
    const index = categories.value.findIndex((category) => category.id === id);
    if (index !== -1) {
      categories.value[index].name = name;
      // 自动保存到数据库
      saveToDatabase().catch((error) => {
        console.error("自动保存失败:", error);
      });
    }
  };

  // 删除分类
  const deleteCategory = (id: string) => {
    const index = categories.value.findIndex((category) => category.id === id);
    if (index !== -1) {
      // 获取所有子分类ID
      const getChildCategoryIds = (parentId: string): string[] => {
        const childIds = categories.value
          .filter((cat) => cat.parentId === parentId)
          .map((cat) => cat.id);

        let allIds: string[] = [...childIds];
        for (const childId of childIds) {
          allIds = [...allIds, ...getChildCategoryIds(childId)];
        }

        return allIds;
      };

      const categoryIds = [id, ...getChildCategoryIds(id)];

      // 将相关笔记的分类设置为空，而不是删除笔记
      notes.value.forEach((note) => {
        if (categoryIds.includes(note.categoryId)) {
          note.categoryId = "";
          note.updateTime = new Date().toLocaleString("zh-CN");
        }
      });

      // 删除该分类及其所有子分类
      categories.value = categories.value.filter(
        (cat) => !categoryIds.includes(cat.id)
      );

      // 自动保存到数据库
      saveToDatabase().catch((error) => {
        console.error("自动保存失败:", error);
      });
    }
  };

  // 添加标签
  const addTag = (tag: string) => {
    if (!tags.value.includes(tag)) {
      tags.value.push(tag);
      // 自动保存到数据库
      saveToDatabase().catch((error) => {
        console.error("自动保存失败:", error);
      });
    }
  };

  // 删除标签
  const removeTag = (tag: string) => {
    const tagIndex = tags.value.indexOf(tag);
    if (tagIndex > -1) {
      // 检查是否有笔记使用该标签
      const hasNotesWithTag = notes.value.some((note) =>
        note.tags.includes(tag)
      );

      if (hasNotesWithTag) {
        // 如果有笔记使用该标签，从所有笔记中移除该标签
        notes.value.forEach((note) => {
          note.tags = note.tags.filter((t) => t !== tag);
          note.updateTime = new Date().toLocaleString("zh-CN");
        });
      }

      // 从标签列表中移除
      tags.value.splice(tagIndex, 1);

      // 自动保存到数据库
      saveToDatabase().catch((error) => {
        console.error("自动保存失败:", error);
      });
    }
  };

  // 移动笔记到其他分类
  const moveNoteToCategory = (noteId: string, categoryId: string) => {
    const note = notes.value.find((n) => n.id === noteId);
    if (note) {
      note.categoryId = categoryId;
      note.updateTime = new Date().toLocaleString("zh-CN");
      // 自动保存到数据库
      saveToDatabase().catch((error) => {
        console.error("自动保存失败:", error);
      });
    }
  };

  // 返回所有需要暴露的状态和方法
  return {
    // 状态
    notes,
    categories,
    tags,
    // 方法
    loadFromDatabase,
    saveToDatabase,
    updateNote,
    createNote,
    deleteNote,
    createCategory,
    updateCategory,
    deleteCategory,
    addTag,
    removeTag,
    moveNoteToCategory,
  };
});
