import React, { useState, useEffect, useRef } from 'react';
import styles from './Drawer.module.less';

export interface DrawerProps {
  children: React.ReactNode;
  width?: number | string;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  position?: 'left' | 'right';
  locked?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Drawer: React.FC<DrawerProps> = ({
  children,
  width = 320,
  isOpen = false,
  onOpen,
  onClose,
  position = 'left',
  className = '',
  style = {},
}) => {
  const [isVisible, setIsVisible] = useState(isOpen);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen]);


  const togglePanel = () => {
    setIsVisible(!isVisible);

    if (!isVisible) {
      onClose?.();
    } else {
      onOpen?.();
    }
  };

  const drawerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    ...style,
  };

  return (
    <div className={styles.drawerContainer}>
      <div
        ref={drawerRef}
        className={`
          ${styles.drawer} 
          ${styles[position]} 
          ${isVisible ? styles.open : ''} 
          ${className}
        `}
        style={drawerStyle}
      >
        <div className={styles.drawerContent}>
          {children}
        </div>
        <div className={styles.drawerControls} onClick={togglePanel}>
          <button
            className={`${styles.drawerControlButton} ${styles.toggleButton}`}
            title={isVisible ? "收起侧边栏" : "展开侧边栏"}
          >
            <span className={styles.arrowIcon}>
              {isVisible ? "▶" : "◀"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Drawer; 