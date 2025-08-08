import { useCallback, useEffect, useState } from 'react';
import ReferCreator from '../ReferCreator';
import type { MenuList } from '../components/context-menu';

export const useContextMenu = (
  ReferRef: React.MutableRefObject<ReferCreator | undefined>
) => {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    event: MouseEvent | undefined;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    event: undefined,
  });

  // 处理右键菜单项点击
  const handleCopy = useCallback(() => {
    if (ReferRef.current) {
      ReferRef.current.copyElement();
    }
  }, []);

  const handlePaste = useCallback((event?: MouseEvent | ClipboardEvent) => {
    if (ReferRef.current) {
      const point = ReferRef.current.canvas.getScenePoint(event as MouseEvent);
      ReferRef.current.pasteElement(undefined, point);
    }
  }, []);

  const handleDelete = useCallback(() => {
    if (ReferRef.current) {
      ReferRef.current.deleteElement();
    }
  }, []);

  const handleBringToFront = useCallback(() => {
    if (ReferRef.current) {
      const ele = ReferRef.current.getActiveObject();
      ReferRef.current.bringToFront(ele);
    }
  }, []);

  const handleSendToBack = useCallback(() => {
    if (ReferRef.current) {
      const ele = ReferRef.current.getActiveObject();
      ReferRef.current.sendToBack(ele);
    }
  }, []);

  // 定义菜单项
  const getMenuItems: () => MenuList = useCallback(() => {
    const Refer = ReferRef.current;
    const hasActiveObject = Refer?.getActiveObject();

    return [
      {
        label: '复制',
        onClick: handleCopy,
        disabled: !hasActiveObject,
      },
      {
        label: '粘贴',
        onClick: handlePaste,
      },
      {
        label: '删除',
        onClick: handleDelete,
        disabled: !hasActiveObject,
      },
      {
        divider: true,
      },
      {
        label: '置于顶层',
        onClick: handleBringToFront,
        disabled: !hasActiveObject,
      },
      {
        label: '置于底层',
        onClick: handleSendToBack,
        disabled: !hasActiveObject,
      },
    ];
  }, [handleCopy, handlePaste, handleDelete, handleBringToFront, handleSendToBack]);

  // 添加右键菜单事件监听
  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      const canvasElement = Refer.canvas.wrapperEl;

      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();

        setContextMenu({
          event: e,
          visible: true,
          position: { x: e.clientX, y: e.clientY },
        });
      };

      canvasElement.addEventListener('contextmenu', handleContextMenu);

      return () => {
        canvasElement.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, []);

  return {
    contextMenu,
    setContextMenu,
    getMenuItems,
  };
};
