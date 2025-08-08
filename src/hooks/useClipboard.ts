import { FabricObject } from 'fabric';
import { useEffect } from 'react';
import ReferCreator from '../ReferCreator';
import { REFER_CLIPBOARD_TYPE, REFER_EMPTY } from '../constants/clipboard';

export const useClipboard = (
  ReferRef: React.MutableRefObject<ReferCreator | undefined>,
  canvasEl: React.RefObject<HTMLCanvasElement>,
  addFromDataTransfer: (DataTransferItemList: DataTransferItemList, event?: DragEvent | ClipboardEvent) => Promise<FabricObject[]> | any
) => {
  // 复制画布的内容
  useEffect(() => {
    const canvasDom = canvasEl.current;
    if (canvasDom) {
      const copyAction = (event: ClipboardEvent) => {
        if (ReferRef.current) {
          const activeObject = ReferRef.current.getActiveObject();
          if (activeObject) {
            event.preventDefault();
            ReferRef.current.copyElement(activeObject, event);
          }
        }
      };

      const ownerDocument = canvasDom.ownerDocument;
      ownerDocument.addEventListener('copy', copyAction);

      return () => {
        ownerDocument.removeEventListener('copy', copyAction);
      }
    }
  }, []);

  // 剪切
  useEffect(() => {
    const Refer = ReferRef.current;
    const canvasDom = canvasEl.current;

    if (Refer && canvasDom) {
      const cutAction = (event: ClipboardEvent) => {
        const activeObject = Refer.getActiveObject();
        if (activeObject) {
          event.preventDefault();
          Refer.copyElement(activeObject, event);
          Refer.deleteElement(activeObject);
        }
      };

      const ownerDocument = canvasDom.ownerDocument;
      ownerDocument.addEventListener('cut', cutAction);

      return () => {
        ownerDocument.removeEventListener('cut', cutAction);
      }
    }
  }, []);

  // 粘贴内容到画布
  useEffect(() => {
    const Refer = ReferRef.current;
    const canvasDom = canvasEl.current;
    if (Refer && canvasDom) {
      const pasteAction = (event: ClipboardEvent) => {
        event.preventDefault();

        // 粘贴系统剪贴板内容
        if (event?.clipboardData?.items) {
          const text = event.clipboardData?.getData(REFER_CLIPBOARD_TYPE);
          const items = text === REFER_EMPTY ? [] : event.clipboardData.items;

          addFromDataTransfer(items as DataTransferItemList).then((elements: FabricObject[]) => {
            if (elements && elements.length) {
              Refer.addElement(elements);
            } else {
              // 系统剪贴板没粘贴内容，则粘贴画布剪贴板内容
              Refer.pasteElement();
            }
          });
        }
      };

      const ownerDocument = canvasDom.ownerDocument;
      ownerDocument.addEventListener('paste', pasteAction);

      return () => {
        ownerDocument.removeEventListener('paste', pasteAction);
      }
    }
  }, [addFromDataTransfer]);
};
