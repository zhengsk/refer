import Dexie, { type EntityTable } from 'dexie';

interface Refers {
  id?: number; // 自增主键，可选，因为新增时不需要提供
  fileId: string; // 自定义唯一主键
  title: string;
  createdAt: number;
  updatedAt: number;

  content?: string; // 文件内容
}

const db = new Dexie('ReferDB') as Dexie & {
  refers: EntityTable<
    Refers,
    'fileId' // 只使用 fileId 作为主键
  >;
};

// Schema declaration:
db.version(1).stores({
  refers: '++id, &fileId, title,  createdAt, updatedAt' // id 自增，fileId 唯一索引
});

export { db };
export type { Refers };

