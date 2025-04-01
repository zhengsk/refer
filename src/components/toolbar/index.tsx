// 工具栏
import React from 'react';
import styles from './index.module.less';
import FullscreenTool from '../Tools/fullscreen';
import ImportTool from '../Tools/import';
import ExportTool from '../Tools/export';

const Toolbar: React.FC = () => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarItem}>
        <ImportTool />
      </div>
      <div className={styles.toolbarItem}>
        <ExportTool />
      </div>
      <div className={styles.toolbarItem}>
        <FullscreenTool />
      </div>
    </div>
  )
}

export default Toolbar;
