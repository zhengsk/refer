import { Point } from 'fabric';
import type { ActiveSelection, FabricObject, IText, TEvent } from 'fabric/fabric-impl';
import { useCallback, useEffect, useState } from 'react';
import ReferCreator from '../ReferCreator';

export const useCanvasView = (
  ReferRef: React.MutableRefObject<ReferCreator | undefined>,
  canvasEl: React.RefObject<HTMLCanvasElement>
) => {
  const [zoom, setZoom] = useState(1);
  const element = document;

  // 元素自适应窗口展示切换
  const switchFitViewElement = useCallback((element?: FabricObject) => {
    const Refer = ReferRef.current;
    if (Refer) {
      if (!element) {
        element = Refer.getActiveObject();
      }
      const preViewStatus = Refer.preViewStatus;
      if (!preViewStatus) {
        Refer.fitViewElement({ element });
      } else if (preViewStatus.element !== element) {
        Refer.fitViewElement({ element, saveState: false });
      } else {
        Refer.restorePreViewStatus();
      }
    }
  }, []);

  // 双击自适应窗口
  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      if (!(element as any).referIsTextEditing) {
        Refer.addEventListener('mouse:dblclick', (e: TEvent & { target: FabricObject }) => {
          // 不处于文本编辑状态
          if (e.target.isType('i-text') && (e.target as IText).isEditing) {
            return;
          }

          // 自适应窗口
          switchFitViewElement(e.target);
        });
      }
    }
  }, [switchFitViewElement]);

  // 页面元素适配可视区域
  const allElementFitView = useCallback(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      const activeEle = Refer.getActiveObject();
      Refer.canvas.discardActiveObject();

      const ele = Refer.selectElement();
      Refer.fitViewElement({ element: ele, saveState: false });
      Refer.canvas.discardActiveObject();

      if (activeEle) {
        const elements = activeEle.isType('activeselection') ? (activeEle as ActiveSelection).getObjects() : activeEle;
        Refer.selectElement(elements);
      }
    }
  }, []);

  // 画布100%展示，以中心区域缩放
  const zoomCenterTo = useCallback((value = 1, relative = false) => {
    const Refer = ReferRef.current;
    if (Refer) {
      const centerPoint = Refer.canvas.getCenter();
      let point = new Point(centerPoint.left, centerPoint.top);
      if (relative) {
        value = Refer.getZoom() * value;
      }
      const zoom = Math.min(100, Math.max(0.01, value));
      Refer.zoomToPoint(point, zoom);
    }
  }, []);

  // 画布大小变化
  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      const handleResize = function () {
        if (ReferRef.current && ReferRef.current.canvas) {
          const canvas = ReferRef.current.canvas;
          canvas.setDimensions({
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
          });
          // canvas.requestRenderAll();
          // canvas.calcOffset();
        }
      };

      window.addEventListener('resize', handleResize, { passive: true });

      // 组件卸载时移除事件监听器
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // 画布缩放设置 zoom
  useEffect(() => {
    const canvasDom = canvasEl.current;
    if (canvasDom) {
      const Refer = ReferRef.current;
      if (Refer) {
        const action = (e: any) => {
          const zoom = Refer.getZoom();
          setZoom(zoom);
        };

        Refer.addEventListener('after:render', action);

        return () => {
          Refer.removeEventListener('after:render', action);
        }
      }
    }
  }, []);

  // 切换100%展示和内容自适应窗口
  const zoomToggle = useCallback(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      const zoom = Refer.getZoom();
      if (zoom !== 1) {
        zoomCenterTo();
      } else {
        allElementFitView();
      }
    }
  }, [zoomCenterTo, allElementFitView]);

  return {
    zoom,
    switchFitViewElement,
    allElementFitView,
    zoomCenterTo,
    zoomToggle,
  };
};
