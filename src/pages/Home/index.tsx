import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import StatsCard from '../../components/StatsCard';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import styles from './index.module.less';

const HomePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFiles: 0,
    todayFiles: 0,
    weekFiles: 0,
    totalSize: '0 KB'
  });

  // 获取最近的作品
  const recentFiles = useLiveQuery(
    () => db.refers.orderBy('updatedAt').reverse().limit(6).toArray(),
    []
  );

  // 获取所有文件用于统计
  const allFiles = useLiveQuery(
    () => db.refers.toArray(),
    []
  );

  // 计算统计数据
  useEffect(() => {
    if (allFiles) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const todayFiles = allFiles.filter(file =>
        new Date(file.createdAt) >= today
      ).length;

      const weekFiles = allFiles.filter(file =>
        new Date(file.createdAt) >= weekAgo
      ).length;

      // 计算大致存储大小
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

      setStats({
        totalFiles: allFiles.length,
        todayFiles,
        weekFiles,
        totalSize: formatBytes(estimatedSize)
      });

      setIsLoading(false);
    }
  }, [allFiles]);

  return (
    <div className={styles.homePage}>
      {/* 欢迎区域 */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>欢迎使用花瓣参考</h1>
          <p className={styles.subtitle}>
            专业的创意设计工具，让你的灵感自由飞翔
          </p>
          <div className={styles.actionButtons}>
            <Link to="/canvas/new" className={styles.primaryButton}>
              开始创作
            </Link>
            <Link to="/gallery" className={styles.secondaryButton}>
              浏览作品库
            </Link>
          </div>
        </div>
        <div className={styles.heroImage}>
          <div className={styles.canvasPreview}>
            <div className={styles.canvasFrame}>
              <div className={styles.canvasContent}>
                <div className={styles.mockElement}></div>
                <div className={styles.mockElement}></div>
                <div className={styles.mockElement}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 使用统计 */}
      <section className={styles.stats}>
        <h2 className={styles.sectionTitle}>使用统计</h2>
        {isLoading ? (
          <LoadingState size="small" text="加载统计数据..." />
        ) : (
          <div className={styles.statsGrid}>
            <StatsCard
              title="总作品数"
              value={stats.totalFiles}
              icon="📊"
              subtitle="累计创作"
              color="primary"
            />
            <StatsCard
              title="今日创作"
              value={stats.todayFiles}
              icon="🎨"
              subtitle="新增作品"
              color="success"
              trend={stats.todayFiles > 0 ? 'up' : 'neutral'}
              trendValue={stats.todayFiles > 0 ? `+${stats.todayFiles}` : '无'}
            />
            <StatsCard
              title="本周创作"
              value={stats.weekFiles}
              icon="📈"
              subtitle="活跃度"
              color="info"
              trend={stats.weekFiles > stats.todayFiles ? 'up' : 'neutral'}
              trendValue={`${stats.weekFiles} 个`}
            />
            <StatsCard
              title="存储占用"
              value={stats.totalSize}
              icon="💾"
              subtitle="数据大小"
              color="warning"
            />
          </div>
        )}
      </section>

      {/* 功能特色 */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>功能特色</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎨</div>
            <h3>直观的画布设计</h3>
            <p>拖拽式操作，支持多种设计元素，让创作变得简单直观</p>
            <div className={styles.featureDetails}>
              <span className={styles.badge}>智能对齐</span>
              <span className={styles.badge}>多图层管理</span>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💾</div>
            <h3>云端同步</h3>
            <p>实时自动保存到本地，支持数据导入导出，永不丢失创作灵感</p>
            <div className={styles.featureDetails}>
              <span className={styles.badge}>自动保存</span>
              <span className={styles.badge}>离线可用</span>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🚀</div>
            <h3>高性能渲染</h3>
            <p>基于Canvas的高性能渲染引擎，流畅处理复杂设计</p>
            <div className={styles.featureDetails}>
              <span className={styles.badge}>60FPS</span>
              <span className={styles.badge}>无限画布</span>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎯</div>
            <h3>精准编辑</h3>
            <p>支持像素级精准编辑，丰富的快捷键操作，提升创作效率</p>
            <div className={styles.featureDetails}>
              <span className={styles.badge}>快捷键</span>
              <span className={styles.badge}>网格吸附</span>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📱</div>
            <h3>多端适配</h3>
            <p>响应式设计，完美适配桌面、平板、手机等各种设备</p>
            <div className={styles.featureDetails}>
              <span className={styles.badge}>触控支持</span>
              <span className={styles.badge}>手势操作</span>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔄</div>
            <h3>历史管理</h3>
            <p>完整的撤销重做系统，操作历史一目了然，轻松回退到任意状态</p>
            <div className={styles.featureDetails}>
              <span className={styles.badge}>无限撤销</span>
              <span className={styles.badge}>状态快照</span>
            </div>
          </div>
        </div>
      </section>

      {/* 最新功能 */}
      <section className={styles.newFeatures}>
        <h2 className={styles.sectionTitle}>✨ 最新功能</h2>
        <div className={styles.newFeaturesList}>
          <div className={styles.newFeatureItem}>
            <div className={styles.newFeatureIcon}>🌙</div>
            <div className={styles.newFeatureContent}>
              <h3>暗色模式</h3>
              <p>全新的暗色主题，减少眼疲劳，提供更舒适的创作体验</p>
              <span className={styles.newBadge}>NEW</span>
            </div>
          </div>
          <div className={styles.newFeatureItem}>
            <div className={styles.newFeatureIcon}>🎭</div>
            <div className={styles.newFeatureContent}>
              <h3>样式系统</h3>
              <p>统一的设计语言和组件库，确保界面的一致性和美观性</p>
              <span className={styles.newBadge}>NEW</span>
            </div>
          </div>
          <div className={styles.newFeatureItem}>
            <div className={styles.newFeatureIcon}>⚡</div>
            <div className={styles.newFeatureContent}>
              <h3>性能优化</h3>
              <p>大幅提升渲染性能，减少内存占用，带来更流畅的操作体验</p>
              <span className={styles.improvedBadge}>IMPROVED</span>
            </div>
          </div>
        </div>
      </section>

      {/* 最近作品 */}
      {recentFiles && recentFiles.length > 0 && (
        <section className={styles.recentWorks}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>最近作品</h2>
            <Link to="/gallery" className={styles.viewAllLink}>
              查看全部 →
            </Link>
          </div>
          <div className={styles.worksGrid}>
            {recentFiles.map((file: any) => (
              <Link
                key={file.fileId}
                to={`/canvas/${file.fileId}`}
                className={styles.workCard}
              >
                <div className={styles.workPreview}>
                  <div className={styles.placeholderPreview}>
                    <span>无预览</span>
                  </div>
                </div>
                <div className={styles.workInfo}>
                  <h4 className={styles.workTitle}>{file.title}</h4>
                  <p className={styles.workDate}>
                    {new Date(file.updatedAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 用户指南 */}
      <section className={styles.userGuide}>
        <h2 className={styles.sectionTitle}>📚 使用指南</h2>
        <div className={styles.guideGrid}>
          <div className={styles.guideCard}>
            <div className={styles.guideStep}>1</div>
            <h3>创建画布</h3>
            <p>点击"开始创作"或"新建画布"按钮，创建你的第一个设计项目</p>
          </div>
          <div className={styles.guideCard}>
            <div className={styles.guideStep}>2</div>
            <h3>添加元素</h3>
            <p>使用工具栏添加图片、文本、形状等设计元素到画布中</p>
          </div>
          <div className={styles.guideCard}>
            <div className={styles.guideStep}>3</div>
            <h3>编辑调整</h3>
            <p>拖拽、缩放、旋转元素，使用属性面板调整样式和位置</p>
          </div>
          <div className={styles.guideCard}>
            <div className={styles.guideStep}>4</div>
            <h3>保存分享</h3>
            <p>系统自动保存作品，也可以导出为图片或保存到作品库中</p>
          </div>
        </div>
      </section>

      {/* 快速开始 */}
      <section className={styles.quickStart}>
        <h2 className={styles.sectionTitle}>🚀 快速开始</h2>
        <div className={styles.quickStartGrid}>
          <Link to="/canvas/new" className={styles.quickStartCard}>
            <div className={styles.quickStartIcon}>📝</div>
            <h3>新建画布</h3>
            <p>创建一个全新的设计项目，开始你的创作之旅</p>
            <div className={styles.cardFooter}>
              <span className={styles.shortcut}>Ctrl + N</span>
            </div>
          </Link>
          <Link to="/gallery" className={styles.quickStartCard}>
            <div className={styles.quickStartIcon}>🖼️</div>
            <h3>作品库</h3>
            <p>浏览、管理你的所有设计作品，继续未完成的创作</p>
            <div className={styles.cardFooter}>
              <span className={styles.shortcut}>Ctrl + O</span>
            </div>
          </Link>
          <Link to="/settings" className={styles.quickStartCard}>
            <div className={styles.quickStartIcon}>⚙️</div>
            <h3>设置偏好</h3>
            <p>个性化你的创作环境，调整画布、快捷键等设置</p>
            <div className={styles.cardFooter}>
              <span className={styles.shortcut}>配置优化</span>
            </div>
          </Link>
          <a
            href="#"
            className={styles.quickStartCard}
            onClick={(e) => {
              e.preventDefault();
              window.open('https://github.com/your-repo', '_blank');
            }}
          >
            <div className={styles.quickStartIcon}>📖</div>
            <h3>查看文档</h3>
            <p>详细的使用教程和API文档，快速掌握所有功能</p>
            <div className={styles.cardFooter}>
              <span className={styles.shortcut}>在线帮助</span>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
