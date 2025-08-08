import type { ActiveSelection, FabricObject } from 'fabric/fabric-impl';
import { useCallback, useEffect, useState } from 'react';
import ReferCreator from '../ReferCreator';

export const useElementSelection = (
  ReferRef: React.MutableRefObject<ReferCreator | undefined>
) => {
  const [selectedElements, setSelectedElements] = useState<FabricObject[] | undefined>(undefined);
  const [isPropertyLocked, setIsPropertyLocked] = useState(false);

  // 选中元素直接移到最前面
  useEffect(() => {
    const Ref = ReferRef.current;
    if (Ref) {
      const bringToFront = () => {
        Ref.bringToFront();
      }
      Ref.addEventListener('selection:created', bringToFront);
      Ref.addEventListener('selection:updated', bringToFront);
    }
  }, []);

  // 监听元素选择事件
  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      Refer.addEventListener('selection:created', (e: any) => {
        setSelectedElements(e.selected);
      });

      Refer.addEventListener('selection:updated', (e: any) => {
        setSelectedElements(e.selected);
      });

      Refer.addEventListener('selection:cleared', (e: any) => {
        setSelectedElements(undefined);
      });
    }
  }, []);

  // 添加文本
  const addText = useCallback(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      const zoom = Refer.getZoom();
      const fontSize = 50 / zoom;

      Refer.addText({ text: 'Hello Refer!' });
    }
  }, []);

  // 对象拖拽时按住Option/Ctrl键复制的功能
  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      let cloneCreated = false;
      let originalObject: FabricObject | null = null;

      const handleObjectMoving = (e: any) => {
        // 按住 Option 键 或 Ctrl 键
        const isOptionKeyPressed = e.e.altKey || e.e.metaKey;

        if (isOptionKeyPressed && !cloneCreated && e.target) {
          // 保存原始对象并标记已创建克隆
          originalObject = e.target;
          cloneCreated = true;

          // TODO: 设置鼠标样式
          // Refer.canvas.set({
          //   hoverCursor: 'copy',
          //   movingCursor: 'copy'
          // });

          // 因为复制是异步的，所以需要先获取原始对象的位置
          const originalPosition = {
            left: originalObject!.left,
            top: originalObject!.top
          };

          // 克隆对象, 复制一份元素，保留在原来的位置上
          originalObject!.clone().then((cloned: FabricObject) => {
            let clonedObjects: FabricObject[];

            // 使用原始对象的位置设置克隆对象
            cloned.set(originalPosition);

            // 如果克隆对象多个元素的选中状态
            if (cloned.type === 'activeselection') {
              clonedObjects = (cloned as ActiveSelection).getObjects();
            } else {
              clonedObjects = [cloned];
            }

            // 获取 originalObject 的 index
            const index = Refer.canvas.getObjects().indexOf(originalObject! as FabricObject);

            // 添加到画布并选中
            Refer.canvas.insertAt(index, ...clonedObjects);
            Refer.canvas.requestRenderAll();
          });
        }
      };

      const handleObjectModified = () => {
        // 重置标记，为下一次操作做准备
        cloneCreated = false;
        originalObject = null;
      };

      // 添加Fabric事件监听
      Refer.addEventListener('object:moving', handleObjectMoving); // 移动对象
      Refer.addEventListener('object:modified', handleObjectModified); // 移动完成

      return () => {
        Refer.removeEventListener('object:moving', handleObjectMoving);
        Refer.removeEventListener('object:modified', handleObjectModified);
      };
    }
  }, []);

  return {
    selectedElements,
    isPropertyLocked,
    setIsPropertyLocked,
    addText,
  };
};
