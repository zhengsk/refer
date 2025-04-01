import React, { useState, useRef, useEffect } from 'react';
import styles from './Tooltip.module.less';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipTrigger = 'hover' | 'click';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPosition;
  trigger?: TooltipTrigger;
  className?: string;
  style?: React.CSSProperties;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  trigger = 'hover',
  className = '',
  style = {},
}) => {
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setVisible(!visible);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        trigger === 'click' &&
        visible &&
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, trigger]);

  return (
    <div
      className={`${styles.container} ${className}`}
      style={style}
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          className={`${styles.content} ${styles[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip; 
