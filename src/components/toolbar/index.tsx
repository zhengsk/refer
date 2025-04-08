// 工具栏
import React from 'react';
import styles from './index.module.less';
import FullscreenTool from '../Tools/fullscreen';
import ImportTool from '../Tools/import';
import ExportTool from '../Tools/export';
import Refer from '../../ReferCreator';

const Toolbar: React.FC<{
  importRefer: () => void;
  exportRefer: () => void;
}> = ({
  importRefer,
  exportRefer,
}) => {
    return (
      <div className={styles.toolbar}>
        <div className={styles.toolbarItem}>
          <ImportTool callback={importRefer} />
        </div>
        <div className={styles.toolbarItem}>
          <ExportTool callback={exportRefer} />
        </div>
        <div className={styles.toolbarItem}>
          <FullscreenTool />
        </div>
      </div>
    )
  }

export default Toolbar;
