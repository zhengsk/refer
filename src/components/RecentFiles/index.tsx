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

      // 阻止冒泡
      const eventHandler = (e: MouseEvent | KeyboardEvent) => {
        e.stopPropagation();
      };
      document.addEventListener('mousedown', eventHandler, { capture: true });
      document.addEventListener('keydown', eventHandler, { capture: true });

      return () => {
        document.removeEventListener('mousedown', eventHandler, { capture: true });
        document.removeEventListener('keydown', eventHandler, { capture: true });
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

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
                <div
                  key={file.id}
                  className={styles.fileItem}
                  onClick={() => handleFileClick(file)}
                >
                  <div className={styles.fileInfo}>
                    {editingFile?.id === file.id ? (
                      <div className={styles.editContainer}>
                        <input
                          type="text"
                          className={styles.editInput}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={handleKeyPress}
                          onBlur={handleSaveRename}
                          autoFocus
                        />
                        <div className={styles.editActions}>
                          <button
                            className={styles.saveButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveRename();
                            }}
                          >
                            ✓
                          </button>
                          <button
                            className={styles.cancelButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelRename();
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.fileTitle}>{file.title}</div>
                    )}
                    <div className={styles.fileDate}>
                      {formatDate(file.updatedAt)}
                    </div>
                  </div>
                  <div className={styles.fileActions}>
                    <button
                      className={styles.renameButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRename(file);
                      }}
                      title="重命名"
                    >
                      编辑
                    </button>
                    <button
                      className={styles.loadButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileClick(file);
                      }}
                    >
                      打开文件
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
