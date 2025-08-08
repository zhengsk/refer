import { useCallback, useRef, useState } from 'react';
import ReferCreator from '../ReferCreator';
import db, { type Refers } from '../db';
import { fileOpen, saveAs } from '../utils/fileAccess';

export const useFileOperations = (
  ReferRef: React.MutableRefObject<ReferCreator | undefined>
) => {
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const currentFileIdRef = useRef<string>();

  // 从数据库加载数据
  const loadFromDatabase = useCallback(async (ref?: React.MutableRefObject<ReferCreator | undefined>) => {
    const Refer = ref?.current || ReferRef.current;
    if (Refer) {
      try {
        // 获取最新的数据，只获取需要的字段
        const latestFile = await db.refer.list({
          fields: ['fileId', 'content'],
          limit: 1,
          orderBy: 'updatedAt',
          order: 'desc'
        });

        if (latestFile && latestFile.length > 0) {
          const file = latestFile[0];
          if (file.fileId && file.content) {
            const jsonData = JSON.parse(file.content || '');
            await Refer.loadJSON(jsonData);

            // 记录当前加载的文件ID
            setCurrentFileId(file.fileId);
            currentFileIdRef.current = file.fileId;

            console.info('从数据库加载数据成功，文件ID:', file.fileId);
          }
        }
      } catch (error) {
        console.error('从数据库加载数据失败:', error);
      }
    }
  }, []);

  // 加载指定文件
  const loadFile = useCallback(async (file: Refers) => {
    if (ReferRef.current) {
      try {
        const refer = await db.refer.get(file.fileId) as Refers;
        if (!refer) {
          throw new Error('文件不存在');
        }

        const jsonData = JSON.parse(refer.content || '');
        await ReferRef.current.loadJSON(jsonData);

        setCurrentFileId(refer.fileId);
        currentFileIdRef.current = refer.fileId;

        console.info('加载文件成功，文件ID:', refer.fileId);
      } catch (error) {
        console.error('加载文件失败:', error);
      }
    }
  }, []);

  // 重命名文件
  const renameFile = useCallback(async (file: Refers, newTitle: string) => {
    try {
      const res = await db.refer.update({
        fileId: file.fileId,
        title: newTitle
      });
      console.info('文件重命名成功', res);
    } catch (error) {
      console.error('文件重命名失败:', error);
      throw error;
    }
  }, []);

  // 删除文件
  const deleteFile = useCallback(async (file: Refers) => {
    try {
      const res = await db.refer.delete(file.fileId);
      console.info('文件删除成功', res);

      // 如果删除的是当前打开的文件，清空当前文件ID
      if (currentFileId === file.fileId) {
        setCurrentFileId(null);
        currentFileIdRef.current = undefined;
      }
    } catch (error) {
      console.error('文件删除失败:', error);
      throw error;
    }
  }, [currentFileId]);

  // 共用的保存函数
  const saveReferFile = useCallback(async ({
    forceNew = false
  }: {
    forceNew?: boolean
  } = {}): Promise<string> => {
    if (ReferRef.current) {
      const jsonData = ReferRef.current.exportJSON();
      const content = JSON.stringify(jsonData);

      const fileId = currentFileIdRef.current;
      try {
        if (fileId && !forceNew) {
          // 更新现有文件 
          await db.refer.update({
            fileId,
            content,
          });
          console.info('数据已更新到数据库，文件ID:', fileId);
          return fileId;
        } else {
          // 创建新文件
          const title = `Refer_${new Date().toLocaleString()}`;
          const result = await db.refer.add({
            title,
            content,
          });
          console.info('数据已保存到数据库，新文件ID:', result.fileId);
          return result.fileId;
        }
      } catch (error) {
        console.error('保存到数据库失败:', error);
        throw error;
      }
    }
    throw new Error('ReferRef is not available');
  }, []);

  // 导出 refer 文件
  const exportRefer = useCallback(async () => {
    if (ReferRef.current) {
      const jsonData = ReferRef.current.exportJSON();
      saveAs({ dataStr: JSON.stringify(jsonData, null, 4) });
    }
  }, []);

  // 导入 refer 文件
  const importRefer = useCallback(async () => {
    if (ReferRef.current) {
      const file = await fileOpen({
        mimeTypes: ['application/json'],
      });
      try {
        const jsonStr = await file.text();
        const jsonData = JSON.parse(jsonStr);
        return ReferRef.current.loadJSON(jsonData);
      } catch {
        // Do nothing
      }
    }
  }, []);

  // 新建画布
  const createNewCanvas = useCallback(async (): Promise<string | undefined> => {
    if (ReferRef.current) {
      try {
        // 清空当前画布
        ReferRef.current.canvas.clear();

        // 重置当前文件ID，表示这是一个新文件
        setCurrentFileId(null);
        currentFileIdRef.current = undefined;

        // 立即保存数据到数据库
        const newReferFileId = await saveReferFile({ forceNew: true });

        if (newReferFileId) {
          setCurrentFileId(newReferFileId);
          currentFileIdRef.current = newReferFileId;

          console.info('新建画布成功');

          return newReferFileId;
        }
      } catch (error) {
        console.error('新建画布失败:', error);
      }
    }
  }, [saveReferFile]);

  return {
    currentFileId,
    currentFileIdRef,
    loadFromDatabase,
    loadFile,
    renameFile,
    deleteFile,
    saveReferFile,
    exportRefer,
    importRefer,
    createNewCanvas,
  };
};
