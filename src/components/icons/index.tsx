import React from 'react';
import styles from './index.module.less';

interface IconProps {
  name: string;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const Icon: React.FC<IconProps> = ({ name, className = '', onClick, style }) => {
  const [svgContent, setSvgContent] = React.useState<string>('');

  React.useEffect(() => {
    const loadSvg = async () => {
      try {
        const text = await import(`../../assets/icons/${name}.svg?raw`);
        setSvgContent(text.default);
      } catch (err) {
        console.error('Error loading icon:', err);
      }
    };

    loadSvg();
  }, [name]);

  if (!svgContent) {
    return null;
  }

  return (
    <span
      className={`${styles.icon} ${className}`}
      onClick={onClick}
      style={style}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default Icon;
