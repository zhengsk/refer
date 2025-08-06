import React from 'react';
import styles from './index.module.less';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaveTime: number | null;
  errorCount: number;
  pendingChanges: boolean;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isSaving,
  lastSaveTime,
  errorCount,
  pendingChanges
}) => {
  const getStatusText = () => {
    if (isSaving) return '保存中...';
    if (errorCount > 0) return `保存失败 (${errorCount})`;
    if (pendingChanges) return '待保存';
    if (lastSaveTime) return '已保存';
    return '未保存';
  };

  const getStatusClass = () => {
    if (isSaving) return styles.saving;
    if (errorCount > 0) return styles.error;
    if (pendingChanges) return styles.pending;
    if (lastSaveTime) return styles.saved;
    return styles.unsaved;
  };

  return (
    <div className={`${styles.autoSaveIndicator} ${getStatusClass()}`}>
      <div className={styles.dot} />
      <span className={styles.text}>{getStatusText()}</span>
    </div>
  );
};

export default AutoSaveIndicator; 
