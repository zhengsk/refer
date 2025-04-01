import { useCallback } from 'react';
import styles from './ZoomTool.module.less';

interface ZoomToolProps {
  zoom: number;
  onZoomToggle: () => void;
}

const ZoomTool = ({ zoom, onZoomToggle }: ZoomToolProps) => {
  return (
    <div className={styles.zoom} onClick={onZoomToggle}>
      {`${Math.floor(zoom * 100)}%`}
    </div>
  );
};

export default ZoomTool; 
