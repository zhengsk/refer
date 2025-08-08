import type { TEvent } from 'fabric/fabric-impl';
import { useEffect } from 'react';
import ReferCreator from '../ReferCreator';

export const useCanvasInteractions = (
  ReferRef: React.MutableRefObject<ReferCreator | undefined>,
  canvasEl: React.RefObject<HTMLCanvasElement>
) => {
  // 鼠标滚动缩放或移动画布
  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      Refer.addEventListener('mouse:wheel', (e: TEvent<WheelEvent> & { pointer: any }) => {
        const event = e.e;
        event.preventDefault();
        const zoom = Refer.getZoom();

        // 按住ctrl键，滚动鼠标滚轮，缩放画布
        if (event.ctrlKey || event.metaKey) {
          let ratio = event.deltaY * (Number.isInteger(event.deltaY) ? 0.003 : 0.002);
          if (event.shiftKey) {
            ratio *= 5;
          } else if (event.altKey) {
            ratio *= 0.1;
          }

          const newZoom = Math.min(100, Math.max(0.01, zoom * (1 - ratio)));
          Refer.zoomToPoint(e.pointer, newZoom);
        } else { // 不按住ctrl键，滚动鼠标滚轮，移动画布
          // 滚动，移动画布
          let dx = -event.deltaX;
          let dy = -event.deltaY;

          // 按住shift键，切换水平和垂直切换
          if (event.shiftKey) {
            const temp = dx;
            dx = dy;
            dy = temp;
          }

          Refer.moveViewportBy(dx, dy);
        }
      });
    }
  }, []);

  // 移动画布: 空格键 或 鼠标中间
  useEffect(() => {
    const canvasDom = canvasEl.current;
    if (canvasDom) {
      const ownerDocument = canvasDom.ownerDocument;

      const keydownAction = (e: KeyboardEvent | MouseEvent) => {
        if ((e as KeyboardEvent).key === ' ' || (e as MouseEvent).button === 1) {
          if (ReferRef.current && !ReferRef.current.dragMode) {
            e.preventDefault();
            ReferRef.current.setDragMode(true);
          }
        }
      }

      const keyupAction = (e: KeyboardEvent | MouseEvent) => {
        if ((e as KeyboardEvent).key === ' ' || (e as MouseEvent).button === 1) {
          if (ReferRef.current) {
            ReferRef.current.setDragMode(false);
          }
        }
      }

      ownerDocument.addEventListener('keydown', keydownAction);
      ownerDocument.addEventListener('keyup', keyupAction);

      ownerDocument.addEventListener('mousedown', keydownAction);
      ownerDocument.addEventListener('mouseup', keyupAction);

      return () => {
        ownerDocument.removeEventListener('keydown', keydownAction);
        ownerDocument.removeEventListener('keyup', keyupAction);

        ownerDocument.removeEventListener('mousedown', keydownAction);
        ownerDocument.removeEventListener('mouseup', keyupAction);
      }
    }
  }, []);
};
