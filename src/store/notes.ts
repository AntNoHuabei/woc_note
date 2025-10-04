import { defineStore } from "pinia";
import { Category, Note } from "../types/note/tag";
import NotesDatabaseService from "../services/notesDatabaseService";

interface NotesState {
  notes: Note[];
  categories: Category[];
  currentNoteId: string | null;
  currentCategoryId: string | null;
  isEditMode: boolean;
  tags: string[];
}

export const useNotesStore = defineStore("notes", {
  state: (): NotesState => ({
    notes: [],
    categories: [],
    currentNoteId: null,
    currentCategoryId: null,
    isEditMode: false,
    tags: [],
  }),

  getters: {},

  actions: {
    // 从数据库加载数据到store
    async loadFromDatabase() {
      try {
        const data = await NotesDatabaseService.loadAllData();

        // 更新状态
        if (data.notes) this.notes = data.notes;
        if (data.categories) this.categories = data.categories;
        if (data.tags) this.tags = data.tags;
        if (data.currentNoteId !== undefined)
          this.currentNoteId = data.currentNoteId;
        if (data.currentCategoryId !== undefined)
          this.currentCategoryId = data.currentCategoryId;
        if (data.isEditMode !== undefined) this.isEditMode = data.isEditMode;
      } catch (error) {
        console.error("从数据库加载数据失败:", error);
      }
    },

    // 从store序列化数据到数据库
    async saveToDatabase() {
      try {
        await NotesDatabaseService.saveAllData({
          notes: this.notes,
          categories: this.categories,
          tags: this.tags,
          currentNoteId: this.currentNoteId,
          currentCategoryId: this.currentCategoryId,
          isEditMode: this.isEditMode,
        });
      } catch (error) {
        console.error("保存数据到数据库失败:", error);
      }
    },

    // 设置当前选中的笔记
    setCurrentNoteId(id: string | null) {
      this.currentNoteId = id;
      this.isEditMode = false;
      // 自动保存到数据库
      this.saveToDatabase().catch((error) => {
        console.error("自动保存失败:", error);
      });
    },

    // 设置当前分类
    setCurrentCategoryId(id: string | null) {
      this.currentCategoryId = id;
      // 自动保存到数据库
      this.saveToDatabase().catch((error) => {
        console.error("自动保存失败:", error);
      });
    },

    // 切换编辑模式
    toggleEditMode() {
      this.isEditMode = !this.isEditMode;
      // 自动保存到数据库
      this.saveToDatabase().catch((error) => {
        console.error("自动保存失败:", error);
      });
    },

    // 更新笔记
    updateNote(id: string, updates: Partial<Note>) {
      const index = this.notes.findIndex((note) => note.id === id);
      if (index !== -1) {
        this.notes[index] = {
          ...this.notes[index],
          ...updates,
          updateTime: new Date().toLocaleString("zh-CN"),
        };
        // 自动保存到数据库
        this.saveToDatabase().catch((error) => {
          console.error("自动保存失败:", error);
        });
      }
    },

    // 创建新笔记
    createNote(note: Omit<Note, "id" | "createTime" | "updateTime">) {
      const newNote: Note = {
        ...note,
        id: Date.now().toString(),
        createTime: new Date().toLocaleString("zh-CN"),
        updateTime: new Date().toLocaleString("zh-CN"),
      };
      this.notes.push(newNote);
      this.currentNoteId = newNote.id;
      this.isEditMode = true;
      // 自动保存到数据库
      this.saveToDatabase().catch((error) => {
        console.error("自动保存失败:", error);
      });
    },

    // 删除笔记
    deleteNote(id: string) {
      const index = this.notes.findIndex((note) => note.id === id);
      if (index !== -1) {
        this.notes.splice(index, 1);
        if (this.currentNoteId === id) {
          this.currentNoteId = null;
        }
        // 自动保存到数据库
        this.saveToDatabase().catch((error) => {
          console.error("自动保存失败:", error);
        });
      }
    },

    // 创建分类/文件夹 - 增加parentId参数
    createCategory(name: string, parentId: string | null = null) {
      const newCategory: Category = {
        id: Date.now().toString(),
        name,
        parentId,
        createTime: new Date().toLocaleString("zh-CN"),
      };
      this.categories.push(newCategory);
      // 自动保存到数据库
      this.saveToDatabase().catch((error) => {
        console.error("自动保存失败:", error);
      });
    },

    // 更新分类
    updateCategory(id: string, name: string) {
      const index = this.categories.findIndex((category) => category.id === id);
      if (index !== -1) {
        this.categories[index].name = name;
        // 自动保存到数据库
        this.saveToDatabase().catch((error) => {
          console.error("自动保存失败:", error);
        });
      }
    },

    // 删除分类
    deleteCategory(id: string) {
      const index = this.categories.findIndex((category) => category.id === id);
      if (index !== -1) {
        // 获取所有子分类ID
        const getChildCategoryIds = (parentId: string): string[] => {
          const childIds = this.categories
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
        this.notes.forEach((note) => {
          if (categoryIds.includes(note.categoryId)) {
            note.categoryId = "";
            note.updateTime = new Date().toLocaleString("zh-CN");
          }
        });

        // 删除该分类及其所有子分类
        this.categories = this.categories.filter(
          (cat) => !categoryIds.includes(cat.id)
        );

        // 如果当前选中的是被删除的分类，清除选择
        if (categoryIds.includes(this.currentCategoryId || "")) {
          this.currentCategoryId = null;
        }

        // 自动保存到数据库
        this.saveToDatabase().catch((error) => {
          console.error("自动保存失败:", error);
        });
      }
    },

    // 添加标签
    addTag(tag: string) {
      if (!this.tags.includes(tag)) {
        this.tags.push(tag);
        // 自动保存到数据库
        this.saveToDatabase().catch((error) => {
          console.error("自动保存失败:", error);
        });
      }
    },

    // 删除标签
    removeTag(tag: string) {
      const tagIndex = this.tags.indexOf(tag);
      if (tagIndex > -1) {
        // 检查是否有笔记使用该标签
        const hasNotesWithTag = this.notes.some((note) =>
          note.tags.includes(tag)
        );

        if (hasNotesWithTag) {
          // 如果有笔记使用该标签，从所有笔记中移除该标签
          this.notes.forEach((note) => {
            note.tags = note.tags.filter((t) => t !== tag);
            note.updateTime = new Date().toLocaleString("zh-CN");
          });
        }

        // 从标签列表中移除
        this.tags.splice(tagIndex, 1);

        // 自动保存到数据库
        this.saveToDatabase().catch((error) => {
          console.error("自动保存失败:", error);
        });
      }
    },

    // 移动笔记到其他分类
    moveNoteToCategory(noteId: string, categoryId: string) {
      const note = this.notes.find((n) => n.id === noteId);
      if (note) {
        note.categoryId = categoryId;
        note.updateTime = new Date().toLocaleString("zh-CN");
        // 自动保存到数据库
        this.saveToDatabase().catch((error) => {
          console.error("自动保存失败:", error);
        });
      }
    },
  },
});
