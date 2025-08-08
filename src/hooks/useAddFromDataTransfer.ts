import { FabricImage, FabricObject } from "fabric";
import type { TPointerEvent } from "fabric/fabric-impl";
import { useCallback } from "react";
import ReferCreator from "../ReferCreator";

export const useAddFromDataTransfer = (ReferRef: React.MutableRefObject<ReferCreator | undefined>) => {
  // 拖拽或粘贴对象（dataTransfer）到画布
  const addFromDataTransfer = useCallback((DataTransferItemList: DataTransferItemList, event?: DragEvent | ClipboardEvent) => {

    const Refer = ReferRef.current;
    const addedElements: (Promise<FabricObject | undefined> | Promise<(FabricObject | undefined)[]>)[] = [];


    if (Refer) {
      // Position to canvas center
      let inVpCenter = true; // 显示在画布中间
      const offsetPoint = Refer.canvas.getVpCenter();

      // Position to event point
      if (event && event instanceof DragEvent) {
        inVpCenter = false;
        const pointer = Refer.canvas.getScenePoint(event as TPointerEvent);
        offsetPoint.setXY(pointer.x, pointer.y);
      }

      const items = DataTransferItemList || [];
      const appendedMap: { [key: string]: boolean } = {}; // Prevent add repeat
      let appendLength = 0;
      const zoom = Refer.getZoom();

      // When has HTML then skip file type
      const hasHtml = [...items].some(item => item.type.match('^text/html'));

      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if ((item.kind === 'string') && (item.type.match('^text/plain'))) {
          // Add Text node
          const newElePromise = new Promise<FabricObject | undefined>((resolve) => {
            item.getAsString((data) => {
              const newEle = Refer.createText({ text: data });
              resolve(newEle);
            })
          });
          addedElements.push(newElePromise);
        } else if ((item.kind === 'string') && (item.type.match('^text/html'))) {
          const htmlPromise = new Promise<Array<FabricObject | undefined>>((resolve) => {
            // Get image from html
            item.getAsString(html => {
              const div = document.createElement('div');
              div.innerHTML = html;
              const imgs = div.querySelectorAll('img');

              const imgsPromise = [...imgs].map(img => {
                if (!appendedMap[img.src]) {
                  let offset = offsetPoint.scalarAdd(appendLength * 20 / zoom);
                  appendedMap[img.src] = true;
                  appendLength += 1;

                  return new Promise<FabricObject | undefined>((resolve) => {
                    const newImg = new Image();
                    newImg.onload = function () {
                      // 图片显示高度为300px
                      const imageHeight = 300;
                      const scale = imageHeight / newImg.height;
                      const imageWidth = newImg.width * scale;

                      const renderWidth = imageWidth / zoom;
                      const renderHeight = imageHeight / zoom;

                      const imageSrc = img.src;
                      const imageOptions = {
                        scaleX: scale / zoom,
                        scaleY: scale / zoom,
                        left: offsetPoint.x - renderWidth / 2,
                        top: offsetPoint.y - renderHeight / 2,
                      };

                      FabricImage.fromURL(imageSrc, {}, imageOptions)
                        .then((imageObject) => {
                          resolve(imageObject);
                        }).catch(() => {
                          resolve(undefined);
                        });
                    };

                    // 图片加载失败
                    newImg.onerror = () => {
                      resolve(undefined);
                    }

                    newImg.src = img.src;
                  });
                }
              });

              resolve(Promise.all(imgsPromise));
            });
          });
          addedElements.push(htmlPromise);
        } else if ((item.kind === 'string') && (item.type.match('^text/uri-list'))) {
          const newElePromise = new Promise<FabricObject | undefined>((resolve) => {
            // url
            item.getAsString(src => {
              if (!appendedMap[src]) {
                appendedMap[src] = true;
                appendLength += 1;

                const newImg = new Image();
                newImg.onload = function () {
                  const imageHeight = 300;
                  const scale = imageHeight / newImg.height;
                  const imageWidth = newImg.width * scale;

                  const renderWidth = imageWidth / zoom;
                  const renderHeight = imageHeight / zoom;

                  const imageOptions = {
                    scaleX: scale / zoom,
                    scaleY: scale / zoom,
                    left: offsetPoint.x - renderWidth / 2,
                    top: offsetPoint.y - renderHeight / 2,
                  };

                  FabricImage.fromURL(src, {}, imageOptions).then((imageObject) => {
                    resolve(imageObject);
                  }).catch(() => {
                    resolve(undefined);
                  });
                };

                // 图片加载失败
                newImg.onerror = () => {
                  resolve(undefined);
                }

                newImg.src = src;
              }
            });
          });
          addedElements.push(newElePromise);
        } else if (!hasHtml && (item.kind === 'file') && (item.type.match('^image/'))) {
          // Drag items item is an image file
          const file = item.getAsFile();
          if (file && /^image\/*/.test(file.type)) {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            const waitForLoad: Promise<FabricObject> = new Promise((resolve) => {
              let offset = offsetPoint;
              reader.addEventListener('load', () => {
                const zoom = Refer.getZoom();

                const img = new Image();
                img.onload = function () {
                  // 图片显示高度为300px
                  const imageHeight = 300;
                  const scale = imageHeight / img.height;
                  const imageWidth = img.width * scale;

                  const renderWidth = imageWidth / zoom;
                  const renderHeight = imageHeight / zoom;

                  const imageSrc = reader.result as string;
                  const imageOptions = {
                    scaleX: scale / zoom,
                    scaleY: scale / zoom,
                    left: offset.x - renderWidth / 2,
                    top: offset.y - renderHeight / 2,
                  };

                  FabricImage.fromURL(imageSrc, {}, imageOptions)
                    .then((imageObject) => {
                      resolve(imageObject);
                    });
                };
                img.src = reader.result as string;
              });
            });

            appendLength += 1;
            addedElements.push(waitForLoad);
          }
        }
      }

      return Promise.all(addedElements).then(elements => {
        if (elements.length === 0) {
          return null;
        }

        // 多维数组，需要扁平化
        const flatElements = elements.flat();

        // 总宽度
        const totalWidth = flatElements.reduce((acc: number, item, index) => {
          return acc + (item?.getScaledWidth() || 0) + (index > 0 ? 20 : 0);
        }, 0);

        // 设置第一个元素的位置
        flatElements[0]!.set('left', offsetPoint.x - totalWidth / 2);

        // 如果元素是图片，则需要设置为 active
        const newElements = flatElements.reduce((acc: FabricObject[], item, index) => {
          if (Array.isArray(item)) {
            const newElements = item.filter(ele => ele);
            Array.prototype.push.apply(acc, newElements);
          } else if (item !== undefined) {
            if (acc.length > 0) {
              const prevEle = acc[acc.length - 1];
              const prevLeft = prevEle.get('left');
              const prevWidth = prevEle.getScaledWidth();
              const newLeft = prevLeft + prevWidth + 20;

              // 重新设置元素的 left 位置
              item.set('left', newLeft);
            }

            acc.push(item);
          }
          return acc;
        }, []);

        return newElements;
      });
    }
  }, []);

  return {
    addFromDataTransfer,
  }
}
