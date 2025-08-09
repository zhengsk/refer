import React from 'react';
import { Link } from 'react-router-dom';
import styles from './index.module.less';

const NotFoundPage: React.FC = () => {
  return (
    <div className={styles.notFoundPage}>
      <div className={styles.content}>
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>页面未找到</h2>
        <p className={styles.description}>
          抱歉，您访问的页面不存在或已被删除。
        </p>
        <div className={styles.actions}>
          <Link to="/" className={styles.homeButton}>
            返回首页
          </Link>
          <Link to="/gallery" className={styles.galleryButton}>
            浏览作品库
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
