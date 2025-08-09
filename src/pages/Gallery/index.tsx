import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import styles from './index.module.less';

const GalleryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'modifyDate' | 'createDate' | 'name'>('modifyDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 获取所有文件
  const allFiles = useLiveQuery(
    () => {
      // 映射排序字段
      const sortField = sortBy === 'modifyDate' ? 'updatedAt' :
        sortBy === 'createDate' ? 'createdAt' :
          sortBy === 'name' ? 'title' : 'updatedAt';

      let query = db.refers.orderBy(sortField);
      if (sortOrder === 'desc') {
        query = query.reverse();
      }
      return query.toArray();
    },
    [sortBy, sortOrder]
  );

  // 过滤文件
  const filteredFiles = allFiles?.filter(file =>
    file.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDelete = async (fileId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (window.confirm('确定要删除这个作品吗？此操作不可撤销。')) {
      try {
        await db.refers.where('fileId').equals(fileId).delete();
      } catch (error) {
        console.error('删除文件失败:', error);
        alert('删除失败，请重试。');
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className={styles.galleryPage}>
      {/* 页面头部 */}
      <div className={styles.header}>
        <h1>作品库</h1>
        <Link to="/canvas/new" className={styles.newButton}>
          新建作品
        </Link>
      </div>

      {/* 搜索和排序 */}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="搜索作品..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.sortControls}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={styles.sortSelect}
          >
            <option value="modifyDate">修改时间</option>
            <option value="createDate">创建时间</option>
            <option value="name">名称</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={styles.sortOrderButton}
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {/* 作品数量统计 */}
      <div className={styles.stats}>
        共 {filteredFiles.length} 个作品
        {searchTerm && ` (搜索 "${searchTerm}" 的结果)`}
      </div>

      {/* 作品网格 */}
      {filteredFiles.length === 0 ? (
        <div className={styles.emptyState}>
          {searchTerm ? (
            <>
              <h3>没有找到相关作品</h3>
              <p>尝试其他关键词或清空搜索条件</p>
            </>
          ) : (
            <>
              <h3>还没有任何作品</h3>
              <p>创建你的第一个设计作品吧！</p>
              <Link to="/canvas/new" className={styles.createFirstButton}>
                立即开始
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredFiles.map((file) => (
            <div key={file.fileId} className={styles.card}>
              <Link to={`/canvas/${file.fileId}`} className={styles.cardLink}>
                <div className={styles.preview}>
                  <div className={styles.placeholderPreview}>
                    <span>无预览</span>
                  </div>
                </div>

                <div className={styles.cardContent}>
                  <h3 className={styles.title}>{file.title}</h3>
                  <div className={styles.metadata}>
                    <p className={styles.date}>
                      修改: {formatDate(file.updatedAt)}
                    </p>
                    <p className={styles.date}>
                      创建: {formatDate(file.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>

              <div className={styles.actions}>
                <Link
                  to={`/canvas/${file.fileId}`}
                  className={styles.actionButton}
                  title="编辑"
                >
                  ✏️
                </Link>
                <button
                  onClick={(e) => handleDelete(file.fileId, e)}
                  className={styles.actionButton}
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
