import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import StatsCard from '../../components/StatsCard';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import styles from './index.module.less';

const GalleryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'modifyDate' | 'createDate' | 'name'>('modifyDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: '0 KB',
    recentCount: 0,
    oldestDate: ''
  });

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

  // 计算统计数据
  useEffect(() => {
    if (allFiles) {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentCount = allFiles.filter(file =>
        new Date(file.updatedAt) >= sevenDaysAgo
      ).length;

      const estimatedSize = allFiles.reduce((total, file) => {
        const nameSize = (file.title || '').length * 2;
        const dataSize = file.content ? JSON.stringify(file.content).length * 2 : 0;
        return total + nameSize + dataSize + 100;
      }, 0);

      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      const oldestFile = allFiles.reduce((oldest, file) =>
        new Date(file.createdAt) < new Date(oldest.createdAt) ? file : oldest
        , allFiles[0]);

      setStats({
        totalFiles: allFiles.length,
        totalSize: formatBytes(estimatedSize),
        recentCount,
        oldestDate: oldestFile ? new Date(oldestFile.createdAt).toLocaleDateString('zh-CN') : ''
      });

      setIsLoading(false);
    }
  }, [allFiles]);

  // 批量选择功能
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const selectAllFiles = () => {
    setSelectedFiles(filteredFiles.map(file => file.fileId));
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const bulkDelete = async () => {
    if (selectedFiles.length === 0) return;

    const confirmed = window.confirm(
      `确定要删除 ${selectedFiles.length} 个作品吗？此操作不可撤销。`
    );

    if (confirmed) {
      try {
        await db.refers.where('fileId').anyOf(selectedFiles).delete();
        setSelectedFiles([]);
      } catch (error) {
        console.error('批量删除失败:', error);
        alert('删除失败，请重试。');
      }
    }
  };

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
        <div className={styles.headerContent}>
          <h1>作品库</h1>
          <p className={styles.headerSubtitle}>管理和浏览你的所有设计作品</p>
        </div>
        <div className={styles.headerActions}>
          <Link to="/canvas/new" className={styles.newButton}>
            <span className={styles.buttonIcon}>➕</span>
            新建作品
          </Link>
        </div>
      </div>

      {/* 统计概览 */}
      {isLoading ? (
        <LoadingState size="small" text="加载统计数据..." />
      ) : (
        <div className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <StatsCard
              title="总作品数"
              value={stats.totalFiles}
              icon="📊"
              subtitle="累计创作"
              color="primary"
            />
            <StatsCard
              title="近期活跃"
              value={stats.recentCount}
              icon="🔥"
              subtitle="最近7天更新"
              color="success"
              trend={stats.recentCount > 0 ? 'up' : 'neutral'}
              trendValue={`${stats.recentCount} 个`}
            />
            <StatsCard
              title="存储空间"
              value={stats.totalSize}
              icon="💾"
              subtitle="数据占用"
              color="info"
            />
            <StatsCard
              title="创作历史"
              value={stats.oldestDate || '--'}
              icon="📅"
              subtitle="最早作品"
              color="warning"
            />
          </div>
        </div>
      )}

      {/* 搜索和控制 */}
      <div className={styles.controls}>
        <div className={styles.leftControls}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="搜索作品名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={styles.clearButton}
              >
                ✕
              </button>
            )}
          </div>

          {selectedFiles.length > 0 && (
            <div className={styles.bulkActions}>
              <span className={styles.selectedCount}>
                已选择 {selectedFiles.length} 项
              </span>
              <button onClick={clearSelection} className={styles.actionBtn}>
                取消选择
              </button>
              <button onClick={bulkDelete} className={styles.deleteBtn}>
                批量删除
              </button>
            </div>
          )}
        </div>

        <div className={styles.rightControls}>
          <div className={styles.viewModeToggle}>
            <button
              onClick={() => setViewMode('grid')}
              className={`${styles.viewModeBtn} ${viewMode === 'grid' ? styles.active : ''}`}
              title="网格视图"
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`${styles.viewModeBtn} ${viewMode === 'list' ? styles.active : ''}`}
              title="列表视图"
            >
              ☰
            </button>
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
              title={sortOrder === 'desc' ? '降序' : '升序'}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>

          {filteredFiles.length > 0 && (
            <button onClick={selectAllFiles} className={styles.selectAllBtn}>
              全选
            </button>
          )}
        </div>
      </div>

      {/* 作品数量统计 */}
      <div className={styles.stats}>
        共 {filteredFiles.length} 个作品
        {searchTerm && ` (搜索 "${searchTerm}" 的结果)`}
      </div>

      {/* 作品展示区域 */}
      {filteredFiles.length === 0 ? (
        searchTerm ? (
          <EmptyState
            icon="🔍"
            title="没有找到相关作品"
            description={`搜索 "${searchTerm}" 没有匹配的结果，尝试其他关键词或清空搜索条件`}
            actionText="清空搜索"
            onAction={() => setSearchTerm('')}
            size="medium"
          />
        ) : (
          <EmptyState
            icon="🎨"
            title="还没有任何作品"
            description="开始你的创作之旅，创建第一个设计作品吧！"
            actionText="立即开始"
            actionLink="/canvas/new"
            size="large"
          />
        )
      ) : (
        <div className={`${styles.grid} ${viewMode === 'list' ? styles.listView : ''}`}>
          {filteredFiles.map((file) => (
            <div
              key={file.fileId}
              className={`${styles.card} ${selectedFiles.includes(file.fileId) ? styles.selected : ''}`}
            >
              {/* 选择框 */}
              <div className={styles.selectBox}>
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.fileId)}
                  onChange={() => toggleFileSelection(file.fileId)}
                  className={styles.selectCheckbox}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <Link to={`/canvas/${file.fileId}`} className={styles.cardLink}>
                <div className={styles.preview}>
                  <div className={styles.placeholderPreview}>
                    <span className={styles.previewIcon}>🎨</span>
                    <span className={styles.previewText}>无预览</span>
                  </div>
                  {/* 可以在这里添加真实的缩略图预览 */}
                </div>

                <div className={styles.cardContent}>
                  <h3 className={styles.title}>{file.title}</h3>
                  <div className={styles.metadata}>
                    <div className={styles.dateInfo}>
                      <span className={styles.dateLabel}>修改:</span>
                      <span className={styles.dateValue}>{formatDate(file.updatedAt)}</span>
                    </div>
                    <div className={styles.dateInfo}>
                      <span className={styles.dateLabel}>创建:</span>
                      <span className={styles.dateValue}>{formatDate(file.createdAt)}</span>
                    </div>
                  </div>

                  {/* 文件状态标签 */}
                  <div className={styles.tags}>
                    {new Date(file.updatedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000 && (
                      <span className={styles.tag}>最近更新</span>
                    )}
                  </div>
                </div>
              </Link>

              <div className={styles.actions}>
                <Link
                  to={`/canvas/${file.fileId}`}
                  className={styles.actionButton}
                  title="编辑"
                >
                  <span className={styles.actionIcon}>✏️</span>
                </Link>
                <button
                  onClick={(e) => handleDelete(file.fileId, e)}
                  className={`${styles.actionButton} ${styles.deleteAction}`}
                  title="删除"
                >
                  <span className={styles.actionIcon}>🗑️</span>
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
