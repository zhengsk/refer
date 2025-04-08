import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import styles from './index.module.less';

interface RulerProps {
  canvas: fabric.Canvas;
}

const Ruler: React.FC<RulerProps> = ({ canvas }) => {
  const horizontalRulerRef = useRef<HTMLDivElement>(null);
  const verticalRulerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvas || !horizontalRulerRef.current || !verticalRulerRef.current) return;

    const updateRulers = () => {
      const vpt = canvas.viewportTransform;
      const zoom = canvas.getZoom();
      const offset = canvas.calcOffset() as unknown as { left: number; top: number };

      // 更新水平标尺
      const horizontalRuler = horizontalRulerRef.current;
      if (horizontalRuler) {
        horizontalRuler.style.transform = `translateX(${offset.left}px)`;
        horizontalRuler.style.width = `${canvas.width}px`;
      }

      // 更新垂直标尺
      const verticalRuler = verticalRulerRef.current;
      if (verticalRuler) {
        verticalRuler.style.transform = `translateY(${offset.top}px)`;
        verticalRuler.style.height = `${canvas.height}px`;
      }
    };

    canvas.on('after:render', updateRulers);
    window.addEventListener('resize', updateRulers);

    return () => {
      canvas.off('after:render', updateRulers);
      window.removeEventListener('resize', updateRulers);
    };
  }, [canvas]);

  return (
    <div className={styles.rulerContainer}>
      <div className={styles.horizontalRuler} ref={horizontalRulerRef} />
      <div className={styles.verticalRuler} ref={verticalRulerRef} />
    </div>
  );
};

export default Ruler; 
