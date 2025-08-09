import React from 'react';
import styles from './index.module.less';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'info';
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  trend,
  trendValue,
  color = 'primary'
}) => {
  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {icon && <div className={styles.icon}>{icon}</div>}
      </div>

      <div className={styles.content}>
        <div className={styles.value}>{value}</div>

        {trend && trendValue && (
          <div className={`${styles.trend} ${styles[trend]}`}>
            <span className={styles.trendIcon}>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            </span>
            <span className={styles.trendValue}>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
