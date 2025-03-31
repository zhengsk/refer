// 工具栏
import React from 'react';
import styles from './index.module.less';
import FullscreenTool from '../tools/fullscreen';

const Toolbar: React.FC = () => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarItem}>
        <FullscreenTool />
      </div>
    </div>
  )
}

export default Toolbar;
