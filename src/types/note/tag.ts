// 定义笔记类型
export interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  tags: string[];
  createTime: string;
  updateTime: string;
}

// 定义分类/文件夹类型，增加parentId支持层级结构
export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  createTime: string;
}
