import React, { useEffect, useRef, useState } from 'react';
import styles from './index.module.less';

interface MenuPosition {
  x: number;
  y: number;
}

export interface MenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface MenuDivider {
  divider: boolean;
}

interface ContextMenuProps {
  items: (MenuItem | MenuDivider)[];
  visible: boolean;
  position: MenuPosition;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  visible,
  position,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className={styles.contextMenu}
      style={{ left: position.x, top: position.y }}
      ref={menuRef}
    >
      {items.map((item, index) => {
        if ('divider' in item) {
          return <div className={styles.divider} key={index} />;
        }

        return (
          <div
            key={index}
            className={`${styles.menuItem} ${item.disabled ? styles.disabled : ''}`}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
          >
            {item.icon && <span className={styles.icon}>{item.icon}</span>}
            <span className={styles.label}>{item.label}</span>
          </div>
        )
      })}
    </div>
  );
};

export default ContextMenu; 