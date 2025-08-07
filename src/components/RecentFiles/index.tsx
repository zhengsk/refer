import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../db';
import type { Refers } from '../../db';
import styles from './index.module.less';

interface RecentFilesProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (file: Refers) => void;
  onRename?: (file: Refers, newTitle: string) => void;
}

const RecentFiles: React.FC<RecentFilesProps> = ({
  visible,
  onClose,
  onSelect,
  onRename
}) => {
  const [files, setFiles] = useState<Refers[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingFile, setEditingFile] = useState<Refers | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      loadRecentFiles();

      const stopPropagation = (e: MouseEvent | KeyboardEvent) => {
        e.stopPropagation();
      };

      // 阻止冒泡
      overlayRef.current?.addEventListener('mousedown', stopPropagation);
      overlayRef.current?.addEventListener('keydown', stopPropagation);

      return () => {
        overlayRef.current?.removeEventListener('mousedown', stopPropagation);
        overlayRef.current?.removeEventListener('keydown', stopPropagation);
      };
    }
  }, [visible]);

  const loadRecentFiles = async () => {
    setLoading(true);
    try {
      const recentFiles = await db.refers
        .orderBy('updatedAt')
        .reverse()
        .limit(10)
        .toArray();

      setFiles(recentFiles);
    } catch (error) {
      console.error('加载最近文件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: Refers) => {
    onSelect(file);
    onClose();
  };

  const handleRename = (file: Refers) => {
    setEditingFile(file);
    setEditTitle(file.title);
  };

  const handleSaveRename = async () => {
    if (editingFile && editTitle.trim() && onRename) {
      try {
        await onRename(editingFile, editTitle.trim());
        // 更新本地文件列表
        setFiles(prev => prev.map(f =>
          f.id === editingFile.id
            ? { ...f, title: editTitle.trim() }
            : f
        ));
        setEditingFile(null);
        setEditTitle('');
      } catch (error) {
        console.error('重命名失败:', error);
      }
    }
  };

  const handleCancelRename = () => {
    setEditingFile(null);
    setEditTitle('');
  };

  // 重命名 回车保存 按下esc取消
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  // 格式化日期
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={onClose} ref={overlayRef} >
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>最近文件</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>加载中...</div>
          ) : files.length === 0 ? (
            <div className={styles.empty}>暂无保存的文件</div>
          ) : (
            <div className={styles.fileList}>
              {files.map((file) => (
                <div key={file.id} className={styles.fileItem} >
                  <div className={styles.fileInfo}>
                    {editingFile?.id === file.id ? (
                      <div className={styles.editContainer} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          className={styles.editInput}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDownCapture={(e) => handleKeyPress(e)}
                          onBlur={handleSaveRename}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div
                        className={styles.fileTitle}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(file);
                        }}>{file.title}</div>
                    )}
                    <div className={styles.fileDate}>
                      {formatDate(file.updatedAt)}
                    </div>
                  </div>
                  <div className={styles.fileActions}>
                    <button
                      className={styles.loadButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileClick(file);
                      }}
                    >
                      打开
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentFiles; 
