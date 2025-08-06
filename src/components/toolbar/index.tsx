// 工具栏
import React from 'react';
import styles from './index.module.less';
import FullscreenTool from '../Tools/fullscreen';
import ImportTool from '../Tools/import';
import ExportTool from '../Tools/export';
import SaveTool from '../Tools/save';
import NewTool from '../Tools/new';
import RecentTool from '../Tools/recent';

const Toolbar: React.FC<{
  importRefer?: () => void;
  exportRefer?: () => void;
  saveRefer?: () => void;
  newCanvas?: () => void;
  showRecentFiles?: () => void;
}> = ({
  importRefer,
  exportRefer,
  saveRefer,
  newCanvas,
  showRecentFiles,
}) => {
    return (
      <div className={styles.toolbar}>
        {
          // 新建
          newCanvas && (
            <div className={styles.toolbarItem}>
              <NewTool callback={newCanvas} />
            </div>
          )
        }
        {
          // 保存
          saveRefer && (
            <div className={styles.toolbarItem} style={{ display: 'none' }}>
              <SaveTool callback={saveRefer} />
            </div>
          )
        }
        {
          // 最近文件
          showRecentFiles && (
            <div className={styles.toolbarItem}>
              <RecentTool callback={showRecentFiles} />
            </div>
          )
        }
        {
          // 导入
          importRefer && (
            <div className={styles.toolbarItem}>
              <ImportTool callback={importRefer} />
            </div>
          )
        }
        {
          // 导出
          exportRefer && (
            <div className={styles.toolbarItem}>
              <ExportTool callback={exportRefer} />
            </div>
          )
        }

        {/* 全屏 */}
        <div className={styles.toolbarItem}>
          <FullscreenTool />
        </div>
      </div>
    )
  }

export default Toolbar;
