import Dexie from 'dexie';
import { Category, Note } from '../types/note/tag';

// 创建 Dexie 数据库实例
class NotesDatabase extends Dexie {
  notes!: Dexie.Table<Note, string>;
  categories!: Dexie.Table<Category, string>;
  tags!: Dexie.Table<{ id: string; name: string }, string>;
  metadata!: Dexie.Table<{ id: string; key: string; value: any }, string>;

  constructor() {
    super('NotesDatabase');
    this.version(1).stores({
      notes: 'id, categoryId, title, createTime, updateTime',
      categories: 'id, parentId, name, createTime',
      tags: 'id, name',
      metadata: 'id, key, value'
    });
  }
}

// 初始化数据库实例
const db = new NotesDatabase();

// 定义数据库服务接口
export interface NotesDBState {
  notes: Note[];
  categories: Category[];
  currentNoteId: string | null;
  currentCategoryId: string | null;
  isEditMode: boolean;
  tags: string[];
}

// 数据库服务类
export class NotesDatabaseService {
  /**
   * 从数据库加载所有数据
   */
  static async loadAllData(): Promise<Partial<NotesDBState>> {
    try {
      const result: Partial<NotesDBState> = {};
      
      // 加载笔记数据
      const notes = await db.notes.toArray();
      if (notes.length > 0) {
        result.notes = notes;
      }

      // 加载分类数据
      const categories = await db.categories.toArray();
      if (categories.length > 0) {
        result.categories = categories;
      }

      // 加载标签数据
      const tagRecords = await db.tags.toArray();
      if (tagRecords.length > 0) {
        result.tags = tagRecords.map(tag => tag.name);
      }

      // 加载元数据
      const metadata = await db.metadata.get('appState');
      if (metadata) {
        result.currentNoteId = metadata.value.currentNoteId || null;
        result.currentCategoryId = metadata.value.currentCategoryId || null;
        result.isEditMode = metadata.value.isEditMode || false;
      }

      console.log('数据加载成功');
      return result;
    } catch (error) {
      console.error('从数据库加载数据失败:', error);
      throw error;
    }
  }

  /**
   * 保存所有数据到数据库
   */
  static async saveAllData(state: NotesDBState): Promise<void> {
    try {
      // 清空现有数据并保存新数据
      await db.transaction('rw', db.notes, db.categories, db.tags, db.metadata, async () => {
        await db.notes.clear();
        await db.categories.clear();
        await db.tags.clear();
        await db.metadata.clear();

        // 保存笔记数据
        if (state.notes.length > 0) {
          await db.notes.bulkAdd(state.notes);
        }

        // 保存分类数据
        if (state.categories.length > 0) {
          await db.categories.bulkAdd(state.categories);
        }

        // 保存标签数据
        if (state.tags.length > 0) {
          const tagRecords = state.tags.map((name, index) => ({ id: index.toString(), name }));
          await db.tags.bulkAdd(tagRecords);
        }

        // 保存元数据
        await db.metadata.add({
          id: 'appState',
          key: 'appState',
          value: {
            currentNoteId: state.currentNoteId,
            currentCategoryId: state.currentCategoryId,
            isEditMode: state.isEditMode
          }
        });
      });

      console.log('数据保存成功');
    } catch (error) {
      console.error('保存数据到数据库失败:', error);
      throw error;
    }
  }

  /**
   * 检查数据库是否有数据
   */
  static async hasData(): Promise<boolean> {
    try {
      const noteCount = await db.notes.count();
      const categoryCount = await db.categories.count();
      return noteCount > 0 || categoryCount > 0;
    } catch (error) {
      console.error('检查数据库数据失败:', error);
      return false;
    }
  }

  /**
   * 清空所有数据
   */
  static async clearAllData(): Promise<void> {
    try {
      await db.transaction('rw', db.notes, db.categories, db.tags, db.metadata, async () => {
        await db.notes.clear();
        await db.categories.clear();
        await db.tags.clear();
        await db.metadata.clear();
      });
      console.log('所有数据已清空');
    } catch (error) {
      console.error('清空数据失败:', error);
      throw error;
    }
  }
}

// 导出单例
export default NotesDatabaseService;