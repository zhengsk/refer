import React, { useState, useEffect, useRef } from 'react';
import db, { type Refers } from '../../db';
import styles from './index.module.less';

interface RecentFilesProps {
  visible: boolean;
  currentFileId: string | null;
  onClose: () => void;
  onSelect: (file: Refers) => void;
  onRename?: (file: Refers, newTitle: string) => void;
  onDelete?: (file: Refers) => void;
}

const RecentFiles: React.FC<RecentFilesProps> = ({
  visible,
  currentFileId,
  onClose,
  onSelect,
  onRename,
  onDelete
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
      // 只获取需要的字段，提高性能
      const recentFiles = await db.refer.list({
        fields: ['fileId', 'title', 'createdAt'],
        limit: 10,
        orderBy: 'createdAt',
        order: 'desc'
      });

      setFiles(recentFiles as Refers[]);
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
          f.fileId === editingFile.fileId
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

  const handleDelete = async (file: Refers) => {
    if (window.confirm('确定删除该文件吗？')) {
      if (onDelete) {
        try {
          await onDelete(file);
          // 从本地文件列表中移除
          setFiles(prev => prev.filter(f => f.fileId !== file.fileId));
        } catch (error) {
          console.error('删除文件失败:', error);
        }
      }
    }
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
                <div key={file.fileId} className={styles.fileItem} >
                  <div className={styles.fileInfo}>
                    {editingFile?.fileId === file.fileId ? (
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
                        }}>
                        <span className={styles.currentFileIcon}>{file.fileId === currentFileId ? '·' : ''}</span>
                        {file.title}
                      </div>
                    )}
                    <div className={styles.fileDate}>
                      {formatDate(file.createdAt)}
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
                    {onDelete && (
                      <button
                        className={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file);
                        }}
                        title="删除"
                      >
                        ×
                      </button>
                    )}
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
