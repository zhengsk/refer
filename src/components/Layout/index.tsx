import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import styles from './index.module.less';

const Layout: React.FC = () => {
  const location = useLocation();
  const isCanvasPage = location.pathname.startsWith('/canvas');

  // 如果是画布页面，不显示导航栏，全屏显示
  if (isCanvasPage) {
    return <Outlet />;
  }

  return (
    <div className={styles.layout}>
      {/* 顶部导航栏 */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <img
            src='https://st0.dancf.com/static/02/202201151128-a455.svg'
            alt='花瓣网'
            width={24}
            height={24}
          />
          <span className={styles.siteName}>花瓣参考</span>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/"
            className={({ isActive }) => isActive ? styles.activeLink : styles.navLink}
          >
            首页
          </NavLink>
          <NavLink
            to="/gallery"
            className={({ isActive }) => isActive ? styles.activeLink : styles.navLink}
          >
            作品库
          </NavLink>
          <NavLink
            to="/canvas/new"
            className={({ isActive }) => isActive ? styles.activeLink : styles.navLink}
          >
            新建画布
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => isActive ? styles.activeLink : styles.navLink}
          >
            设置
          </NavLink>
        </nav>
      </header>

      {/* 主内容区域 */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* 底部信息 */}
      <footer className={styles.footer}>
        <p>&copy; 2024 花瓣参考 - 创意设计工具</p>
      </footer>
    </div>
  );
};

export default Layout;
