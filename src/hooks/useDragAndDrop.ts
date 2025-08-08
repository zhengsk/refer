import { FabricObject } from 'fabric';
import { useEffect } from 'react';
import ReferCreator from '../ReferCreator';

export const useDragAndDrop = (
  ReferRef: React.MutableRefObject<ReferCreator | undefined>,
  addFromDataTransfer: (DataTransferItemList: DataTransferItemList, event?: DragEvent | ClipboardEvent) => Promise<FabricObject[]> | any,
  createNewCanvas: () => Promise<string | undefined>,
) => {
  // 拖拽本地文件到画布
  useEffect(() => {
    const Refer = ReferRef.current;

    if (Refer) {
      const dropAction = (originEvent: DragEvent) => {
        originEvent.preventDefault();

        const transferItemList = originEvent.dataTransfer?.items;
        if (transferItemList) {
          const JSONFile = [...transferItemList].find(item => item.type.match('^application/json'));
          if (JSONFile) { // 加载 refer 文件
            const textStr = JSONFile.getAsFile()?.text();
            textStr?.then(str => {
              try {
                // 新建画布
                createNewCanvas().then((fileId) => {
                  if (fileId) {
                    const json = JSON.parse(str);
                    return Refer.loadJSON(json).then(() => {
                      requestAnimationFrame(() => {
                        Refer.fitViewRect();
                      });
                    });
                  }
                });
              } catch {
                // Do nothing;
              }
            })
          }

          // 添加内容到画布上
          addFromDataTransfer(transferItemList, originEvent)?.then((elements: FabricObject[]) => {
            if (elements && elements.length) {
              Refer.addElement(elements);
            }
          });
        }
      }

      const dragoverAction = (event: DragEvent) => {
        event.preventDefault();
      }

      //必须在 dragover 事件中调用 event.preventDefault()，否则 drop 事件不会触发。
      document.addEventListener('dragover', dragoverAction);
      document.body.addEventListener('drop', dropAction);

      return () => {
        document.body.removeEventListener('drop', dropAction);
        document.removeEventListener('dragover', dragoverAction);
      }
    }
  }, []);

  return {};
};
