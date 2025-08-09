import React from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import styles from './index.module.less';

const HomePage: React.FC = () => {
  // 获取最近的作品
  const recentFiles = useLiveQuery(
    () => db.refers.orderBy('updatedAt').reverse().limit(6).toArray(),
    []
  );

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

      {/* 功能特色 */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>功能特色</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎨</div>
            <h3>直观的画布设计</h3>
            <p>拖拽式操作，支持多种设计元素，让创作变得简单</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💾</div>
            <h3>自动保存</h3>
            <p>实时自动保存你的作品，永不丢失创作灵感</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📱</div>
            <h3>响应式设计</h3>
            <p>完美适配各种设备，随时随地进行创作</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔄</div>
            <h3>版本历史</h3>
            <p>支持撤销重做，完整的操作历史记录</p>
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

      {/* 快速开始 */}
      <section className={styles.quickStart}>
        <h2 className={styles.sectionTitle}>快速开始</h2>
        <div className={styles.quickStartGrid}>
          <Link to="/canvas/new" className={styles.quickStartCard}>
            <div className={styles.quickStartIcon}>📝</div>
            <h3>新建画布</h3>
            <p>创建一个新的设计项目</p>
          </Link>
          <Link to="/gallery" className={styles.quickStartCard}>
            <div className={styles.quickStartIcon}>🖼️</div>
            <h3>打开作品</h3>
            <p>继续编辑已有的设计</p>
          </Link>
          <a
            href="#"
            className={styles.quickStartCard}
            onClick={(e) => {
              e.preventDefault();
              // 这里可以添加导入文件的逻辑
              alert('导入功能将在画布页面中提供');
            }}
          >
            <div className={styles.quickStartIcon}>📁</div>
            <h3>导入文件</h3>
            <p>导入外部设计文件</p>
          </a>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
