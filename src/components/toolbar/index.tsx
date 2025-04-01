// 工具栏
import React from 'react';
import styles from './index.module.less';
import FullscreenTool from '../Tools/fullscreen';
import ImportTool from '../Tools/import';
import ExportTool from '../Tools/export';

interface ToolbarProps {
  onImport: (jsonData: any) => void;
  onExport: () => any;
}

const Toolbar: React.FC<ToolbarProps> = ({ onImport, onExport }) => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarItem}>
        <ImportTool onImport={onImport} />
      </div>
      <div className={styles.toolbarItem}>
        <ExportTool onExport={onExport} />
      </div>
      <div className={styles.toolbarItem}>
        <FullscreenTool />
      </div>
    </div>
  )
}

export default Toolbar;
