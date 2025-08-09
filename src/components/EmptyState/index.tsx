import React from 'react';
import { Link } from 'react-router-dom';
import styles from './index.module.less';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  actionText,
  actionLink,
  onAction,
  size = 'medium'
}) => {
  return (
    <div className={`${styles.container} ${styles[size]}`}>
      <div className={styles.icon}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}

      {(actionText && (actionLink || onAction)) && (
        <div className={styles.action}>
          {actionLink ? (
            <Link to={actionLink} className={styles.actionButton}>
              {actionText}
            </Link>
          ) : (
            <button onClick={onAction} className={styles.actionButton}>
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
