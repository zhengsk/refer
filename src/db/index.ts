import { generateHashId } from '../utils/hashId';
import { db, type Refers } from './db';
export { db, type Refers };

// 定义可选的字段类型
type RefersFields = keyof Refers;

// 对 refer 表的增删改查
const refer = {
  // 新增
  add: async (refer: Omit<Refers, 'id' | 'fileId' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();

    const fileId = await generateHashId({
      title: refer.title,
      now,
      random01: Math.random(),
      random02: Math.random(),
    });

    await db.refers.add({
      ...refer,
      fileId,
      createdAt: now,
      updatedAt: now
    });

    return {
      fileId,
    };
  },

  // 保存
  update: async (refer: Partial<Refers> & { fileId: string }) => {
    const now = Date.now();
    return await db.refers.where('fileId').equals(refer.fileId).modify({
      ...refer,
      updatedAt: now
    });
  },

  // 获取 - 支持字段选择
  get: async (fileId: string, fields?: RefersFields[]) => {
    const result = await db.refers.get({
      fileId,
    });

    if (!result) return null;

    if (fields && fields.length > 0) {
      // 只返回指定字段
      const filtered: Partial<Refers> = {};
      fields.forEach(field => {
        if (field in result) {
          (filtered as any)[field] = result[field];
        }
      });
      return filtered;
    }

    return result;
  },

  // 获取列表 - 支持字段选择
  list: async (options?: {
    fields?: RefersFields[];
    limit?: number;
    orderBy?: 'createdAt' | 'updatedAt';
    order?: 'asc' | 'desc';
  }) => {
    const { fields, limit, orderBy = 'updatedAt', order = 'desc' } = options || {};

    let query = db.refers.orderBy(orderBy);
    if (order === 'desc') {
      query = query.reverse();
    }
    if (limit) {
      query = query.limit(limit);
    }

    const results = await query.toArray();

    if (fields && fields.length > 0) {
      // 只返回指定字段
      return results.map(result => {
        const filtered: Partial<Refers> = {};
        fields.forEach(field => {
          if (field in result) {
            (filtered as any)[field] = result[field];
          }
        });
        return filtered;
      });
    }

    return results;
  },

  // 删除
  delete: async (fileId: string) => {
    return await db.refers.where('fileId').equals(fileId).delete();
  }
}

export default ({
  refer,
  instance: db,
});
