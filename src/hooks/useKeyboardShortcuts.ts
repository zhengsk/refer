import type { FabricObject } from 'fabric/fabric-impl';
import ReferCreator from '../ReferCreator';
import { useShortcut } from '../utils/useShortcut';

export const useKeyboardShortcuts = (
  ReferRef: React.MutableRefObject<ReferCreator | undefined>,
  element: Document,
  {
    switchFitViewElement,
    allElementFitView,
    zoomCenterTo,
    forceSave,
    loadFromDatabase,
    createNewCanvas,
    addText,
  }: {
    switchFitViewElement: (element?: FabricObject) => void;
    allElementFitView: () => void;
    zoomCenterTo: (value?: number, relative?: boolean) => void;
    forceSave: () => Promise<void>;
    loadFromDatabase: () => Promise<void>;
    createNewCanvas: () => Promise<string | undefined>;
    addText: () => void;
  }
) => {
  // 键盘：删除选中元素 Delete、Backspace
  useShortcut({
    keys: ['Delete', 'Backspace'],
    callback: (e: KeyboardEvent) => {
      e.preventDefault();
      if (ReferRef.current) {
        ReferRef.current.deleteElement();
      }
    },
    element,
  });

  // 键盘 Command + A：全选
  useShortcut({
    keys: ['meta+a', 'ctrl+a'],
    callback: (e: KeyboardEvent) => {
      e.preventDefault();
      if (ReferRef.current) {
        ReferRef.current.selectElement();
      }
    },
    element,
  });

  // 键盘 F：元素自适应窗口展示切换  
  useShortcut({
    keys: ['f'],
    callback: (e: KeyboardEvent) => {
      switchFitViewElement();
    },
    element,
  });

  // 键盘 G：下一个元素自适应 
  useShortcut({
    keys: ['g', 'shift+g', 'ArrowLeft', 'ArrowRight'],
    callback: (e: KeyboardEvent) => {
      const Refer = ReferRef.current;
      if (Refer) {
        let currentElement = Refer.preViewStatus?.element || Refer.canvas.getActiveObject();
        if (!currentElement) { return; }

        const allElements = Refer.canvas.getObjects();
        let index = allElements.indexOf(currentElement);
        index += e.key === 'G' || e.key === 'ArrowLeft' ? -1 : 1;
        if (index > allElements.length - 1) { index = 0 }
        if (index < 0) { index = allElements.length }

        const targetEle = allElements[index];
        console.info(index, targetEle);
        switchFitViewElement(targetEle);
      }
    },
    element,
  });

  // 键盘 H：翻转元素
  useShortcut({
    keys: ['h', 'v'],
    callback: (e: KeyboardEvent) => {
      const Refer = ReferRef.current;
      if (Refer) {
        const direction = e.key === 'h' ? 'horizontal' : 'vertical';
        Refer.flipElement(Refer.getActiveObject(), direction);
      }
    },
    element,
  });

  // 键盘 R：旋转元素
  useShortcut({
    keys: ['r', 'shift+r'],
    callback: (e: KeyboardEvent) => {
      const Refer = ReferRef.current;
      if (Refer) {
        const rotation = e.shiftKey ? -90 : 90;
        const currentRotation = Refer.getActiveObject()?.get('angle') || 0;
        const targetRotation = Math.round((currentRotation + rotation) / 90) * 90;
        Refer.rotateElement(Refer.getActiveObject(), targetRotation);
      }
    },
    element,
  });

  // 键盘 0：缩放显示1:1 
  useShortcut({
    keys: ['0'],
    callback: (e: KeyboardEvent) => {
      e.preventDefault();
      zoomCenterTo();
    },
    element,
  });

  // 键盘 1：所有内容自适应到视窗
  useShortcut({
    keys: ['1'],
    callback: (e: KeyboardEvent) => {
      e.preventDefault();
      allElementFitView();
    },
    element,
  });

  // 键盘 -、 + ：缩放画布
  useShortcut({
    keys: ['-', '='],
    callback: (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === '-') {
        zoomCenterTo(2 / 3, true);
      } else if (e.key === '=') {
        zoomCenterTo(3 / 2, true);
      }
    },
    element,
  });

  // 键盘 Ctrl + z、 Ctrl + shift + z ：历史记录操作
  useShortcut({
    keys: ['meta+z', 'meta+shift+z', 'ctrl+z', 'ctrl+shift+z'],
    callback: (e: KeyboardEvent) => {
      e.preventDefault();
      const Refer = ReferRef.current;
      if (Refer) {
        e.shiftKey ? Refer?.redo() : Refer?.undo();
      }
    },
    element,
  });

  // 键盘：Copy Command + shift + C
  useShortcut({
    keys: ['meta+shift+c', 'ctrl+shift+c'],
    callback: async (e: KeyboardEvent) => {
      e.preventDefault();
      if (ReferRef.current) {
        const elements = ReferRef.current.getActiveObject();

        if (elements) {
          let imageDataURL: string | undefined;

          try {
            imageDataURL = elements.toDataURL({ format: 'png' });
          } catch (error) {
            console.warn('复制失败', error);
          }

          if (imageDataURL) {
            const res = await fetch(imageDataURL);
            const blob = await res.blob();
            const data = [new ClipboardItem({ [blob.type]: blob })];

            navigator.clipboard.write(data).then(() => {
              console.info('复制成功');
            });
          }
        }
      }
    },
    element,
  });

  // 键盘：Save Command + S
  useShortcut({
    keys: ['meta+s', 'ctrl+s'],
    callback: async (e: KeyboardEvent) => {
      e.preventDefault();
      await forceSave();
    },
    element,
  });

  // 键盘：Open Command + o
  useShortcut({
    keys: ['meta+o', 'ctrl+o'],
    callback: async (e: KeyboardEvent) => {
      e.preventDefault();
      if (ReferRef.current) {
        loadFromDatabase();
      }
    },
    element,
  });

  // 键盘：New Command + n
  useShortcut({
    keys: ['meta+n', 'ctrl+n'],
    callback: async (e: KeyboardEvent) => {
      e.preventDefault();
      createNewCanvas();
    },
    element,
  });

  // 键盘：添加文本 T
  useShortcut({
    element,
    keys: ['t'],
    callback: addText,
  });
};
