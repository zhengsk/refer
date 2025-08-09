import React from 'react';
import styles from './index.module.less';

interface LoadingStateProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullPage?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  size = 'medium',
  text = '加载中...',
  fullPage = false
}) => {
  const containerClass = fullPage ? styles.fullPageContainer : styles.container;

  return (
    <div className={containerClass}>
      <div className={`${styles.spinner} ${styles[size]}`}>
        <div className={styles.spinnerInner}></div>
      </div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
};

export default LoadingState;
