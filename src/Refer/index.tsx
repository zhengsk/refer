import { fabric } from 'fabric';
import type { IEvent, Point, Object } from 'fabric/fabric-impl';
import { useRef, useEffect, useState, useCallback } from 'react'
import ReferCreator from './Refer';

const vw = document.documentElement.clientWidth;
const vh = document.documentElement.clientHeight;

const ReferCanvas = () => {
  const ReferRef = useRef<ReferCreator>();
  const canvasEl = useRef<HTMLCanvasElement|null>(null);
  // const {isFitviewMode, setIsFitViewMode} = useState(false);


  useEffect(() => {
    const options = { preserveObjectStacking: true };
    const canvas = new fabric.Canvas(canvasEl.current, options);
    const Refer = new ReferCreator(canvas);

    ReferRef.current = Refer;
    (window as any).Refer = Refer;

    var rect = new fabric.Rect({
      left: -10,
      top: -10,
      fill: 'red',
      width: 20,
      height: 20,
    });
    Refer.canvas.add(rect);

    Refer.addImgFromURL({
      src: 'https://gd-hbimg.huaban.com/13b957418c1f59260285f0ba664fd222b2c78fd581db-ElxX5H_fw1200',
      inVpCenter: true,
    });
    Refer.addImgFromURL({
      src: 'https://gd-hbimg.huaban.com/54a1785cfc4b7d196884a63fdc510d85ab323fb039ffb-fxWgbl',
      inVpCenter: true,
    });

    return () => {
      canvas.dispose();
      Refer.dispose();
    }
  }, []);

  // 鼠标滚动缩放画布
  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      Refer.addEventListener('mouse:wheel', (e: IEvent) => {
        const event = e.e as WheelEvent;
        const zoom = Refer.getZoom();
        const newZoom = Math.min(100, Math.max(0.01, zoom * (event.deltaY > 0 ? 0.9 : 1.1)));
        Refer.zoomToPoint(e.pointer as Point, newZoom);
      });
    }
  }, []);

  // 移动画布
  useEffect(() => {
    const canvasDom = canvasEl.current;
    if (canvasDom) {
      const ownerDocument = canvasDom.ownerDocument;

      const keydownAction = (e: KeyboardEvent) => {
        if (e.key === ' ') {
          if (ReferRef.current && !ReferRef.current.dragMode) {
            e.preventDefault();
            ReferRef.current.setDragMode(true);
          }
        }
      }

      const keyupAction = (e: KeyboardEvent) => {
        if (e.key === ' ') {
          if (ReferRef.current) {
            ReferRef.current.setDragMode(false);
          }
        }
      }

      ownerDocument.addEventListener('keydown', keydownAction);
      ownerDocument.addEventListener('keyup', keyupAction);

      return () => {
        ownerDocument.removeEventListener('keydown', keydownAction);
        ownerDocument.addEventListener('keyup', keyupAction);
      }
    }
  }, []);

  // 键盘：删除选中元素
  useEffect(() => {
    const canvasDom = canvasEl.current;
    if (canvasDom) {
      const ownerDocument = canvasDom.ownerDocument;

      const keydownAction = (e: KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (ReferRef.current) {
            e.preventDefault();
            ReferRef.current.deleteElement();
          }
        }
      }
      ownerDocument.addEventListener('keydown', keydownAction);

      return () => {
        ownerDocument.removeEventListener('keydown', keydownAction);
      }
    }
  }, []);

  // 元素自适应窗口展示切换
  const switchFitViewElement = useCallback((element?: Object) => {
    const Refer = ReferRef.current;
    if (Refer) {
      if (!element) {
        element = Refer.getActiveObject();
      }
      const preViewStatus = Refer.preViewStatus;
      if (!preViewStatus) {
        Refer.fitViewElement({ element });
      } else if(preViewStatus.element !== element) {
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
      Refer.addEventListener('mouse:dblclick', (e: IEvent) => {
        if (e.target) {
          switchFitViewElement(e.target);
        }
      });
    }
  }, []);

  // 拖拽或粘贴对象（dataTransfer）到画布
  const addFromDataTransfer = useCallback((DataTransferItemList: DataTransferItemList | undefined, event?: DragEvent) => {

    const Refer = ReferRef.current;
    const addedElements: (Promise<Object | undefined> | Promise<(Object | undefined)[]>)[] = [];
    
    
    if (Refer) {
      // Position to canvas center
      let inVpCenter = true; // 显示在画布中间
      const offsetPoint = Refer.canvas.getVpCenter();

      // Position to event point
      if (event) {
        inVpCenter = false;
        const pointer = Refer.canvas.getPointer(event);
        offsetPoint.setXY(pointer.x, pointer.y);
      }

      const items = DataTransferItemList || [];
      const appendedMap: {[key: string]: boolean} = {}; // Prevent add repeat
      let appendLength = 0;
      const zoom = Refer.getZoom();

      // When has HTML then skip file type
      const hasHtml = [...items].some(item => item.type.match('^text/html'));

      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if ((item.kind === 'string') && (item.type.match('^text/plain'))) {
          // Add Text node

        } else if ((item.kind === 'string') && (item.type.match('^text/html'))) {
          const htmlPromise = new Promise<Array<Object | undefined>>((resolve) => {
            // Get image from html
            item.getAsString(html => {
              const div = document.createElement('div');
              div.innerHTML = html;
              const imgs = div.querySelectorAll('img');

              const imgsPromise  = [...imgs].map(img => {
                if (!appendedMap[img.src]) {
                  let offset = offsetPoint.scalarAdd(appendLength * 20 / zoom);
                  
                  appendedMap[img.src] = true;
                  appendLength += 1;

                  // TODO: Get Large image src OR srcset
                  return new Promise<Object>(resolve => {
                    Refer.addImgFromURL({
                      src: img.src, 
                      callback: (ele) => { resolve(ele); }, 
                      imageOptions: { left: offset.x, top: offset.y, },
                      inVpCenter,
                    });
                  });
                }
              });

              resolve(Promise.all(imgsPromise));
            });
          });
          addedElements.push(htmlPromise);
        } else if ((item.kind === 'string') && (item.type.match('^text/uri-list'))) {
          const newElePromise = new Promise<Object | undefined>((resolve) => {
            // url
            item.getAsString(src => {
              if (!appendedMap[src]) {
                let offset = offsetPoint.scalarAdd(appendLength * 20 / zoom);
                Refer.addImgFromURL({
                  src,
                  callback: (ele) => { resolve(ele); },
                  imageOptions: { left: offset.x, top: offset.y, },
                  inVpCenter,
                });
  
                appendedMap[src] = true;
                appendLength += 1;
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

            const waitForLoad: Promise<Object> = new Promise((resolve) => {
              let offset = offsetPoint.scalarAdd(appendLength * 20 / zoom);
              reader.addEventListener('load', function(e) {
                Refer.addImgFromURL({
                  src: this.result as string,
                  callback: (ele) => { resolve(ele); },
                  imageOptions: { left: offset.x, top: offset.y, },
                  inVpCenter,
                });
              });
            });
            
            appendLength += 1;
            addedElements.push(waitForLoad);
          }
        }
      }
    }

    return Promise.all(addedElements).then(elements => {
      return elements.reduce((acc: Object[], item) => {
        if (Array.isArray(item)) {
          const newEles: Object[] = item.filter(ele => ele) as Object[];
          Array.prototype.push.apply(acc, newEles);
        } else if (item !== undefined) {
          acc.push(item);
        }
        return acc;
      }, []);
    });
  }, []);

  // 拖拽本地文件到画布
  useEffect(() => {
    const Refer = ReferRef.current;

    if (Refer) {
      const dropAction = (event: IEvent) => {
        const originEvent = event.e as DragEvent;
        originEvent.preventDefault();
  
        const items = originEvent.dataTransfer?.items;
        addFromDataTransfer(items, originEvent)
          .then((eles) => {
            Refer.selectElement(eles);
          });
      }

      Refer.addEventListener('drop', dropAction);

      return () => {
        Refer.removeEventListener('drop', dropAction);
      }
    }
  }, []);

  // 复制画布的内容
  useEffect(() => {
    const canvasDom = canvasEl.current;
    if (canvasDom) {
      const copyAction = (e: ClipboardEvent) => {
        if (ReferRef.current) {
          if (ReferRef.current.getActiveObject()) {
            e.preventDefault();
            ReferRef.current.copyElement(undefined, e);
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

  // 粘贴内容到画布
  useEffect(() => {
    const canvasDom = canvasEl.current;
    if (canvasDom) {
      const pasteAction = (e: ClipboardEvent) => {
        e.preventDefault();

        // 粘贴系统剪贴板内容
        addFromDataTransfer(e.clipboardData?.items).then(eles => {
          if (eles.length) {
            ReferRef.current?.selectElement(eles);
          } else {
            // 系统剪贴板没粘贴内容，则粘贴画布剪贴板内容
            ReferRef.current?.pasteElement();
          }
        }); 
      };

      const ownerDocument = canvasDom.ownerDocument;
      ownerDocument.addEventListener('paste', pasteAction);

      return () => {
        ownerDocument.removeEventListener('paste', pasteAction);
      }
    }

  }, []);

  // 键盘：全选 Command + A
  useEffect(() => {
    const canvasDom = canvasEl.current;
    if (canvasDom) {
      const ownerDocument = canvasDom.ownerDocument;

      const keydownAction = (e: KeyboardEvent) => {
        if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
          if (ReferRef.current) {
            e.preventDefault();
            ReferRef.current.selectElement();
          }
        }
      }
      ownerDocument.addEventListener('keydown', keydownAction);

      return () => {
        ownerDocument.removeEventListener('keydown', keydownAction);
      }
    }
  }, []);

  // 键盘：元素自适应窗口展示切换 F 
  useEffect(() => {
    const canvasDom = canvasEl.current;
    if (canvasDom) {
      const ownerDocument = canvasDom.ownerDocument;

      const keydownAction = (e: KeyboardEvent) => {
        if (e.key === 'f' && (!e.ctrlKey && !e.metaKey)) {
          switchFitViewElement();
        }
      }
      ownerDocument.addEventListener('keydown', keydownAction);

      return () => {
        ownerDocument.removeEventListener('keydown', keydownAction);
      }
    }
  }, []);

  // 键盘：下一个元素自适应 G
  useEffect(() => {
    const canvasDom = canvasEl.current;
    if (canvasDom) {
      const ownerDocument = canvasDom.ownerDocument;

      const keydownAction = (e: KeyboardEvent) => {
        if (
          (
            e.key === 'g'||
            e.key === 'G'||
            e.key === 'ArrowLeft'||
            e.key === 'ArrowRight'
          ) && (!e.ctrlKey && !e.metaKey)
        ) {
          const Refer = ReferRef.current;
          if (Refer) {
            let currentElement = Refer.preViewStatus?.element || Refer.canvas.getActiveObject();
            const allElements = Refer.canvas.getObjects();
            let index = allElements.indexOf(currentElement);
            index += (e.key === 'G' || e.key === 'ArrowLeft') ? -1 : 1;
            if (index > allElements.length - 1) { index = 0 }
            if (index < 0) { index = allElements.length }
            
            const targetEle = allElements[index];
            console.info(index, targetEle);
            switchFitViewElement(targetEle);
          }
        }
      }
      ownerDocument.addEventListener('keydown', keydownAction);

      return () => {
        ownerDocument.removeEventListener('keydown', keydownAction);
      }
    }
  }, []);

  // 选中元素直接移到最前面
  useEffect(() => {
    const Ref = ReferRef.current;
    if (Ref) {
      const bringToFront = () => {
        const ele = Ref.getActiveObject();
        Ref.bringToFront(ele);
      }
      Ref.addEventListener('selection:created', bringToFront);
      Ref.addEventListener('selection:updated', bringToFront);
    }
  }, []);

  // 键盘：Copy Command + C
  // useEffect(() => {
  //   const canvasDom = canvasEl.current;
  //   if (canvasDom) {
  //     const ownerDocument = canvasDom.ownerDocument;

  //     const keydownAction = (e: KeyboardEvent) => {
  //       if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
  //         if (ReferRef.current) {
  //           e.preventDefault();
  //           ReferRef.current.copyElement(undefined, e);
  //         }
  //       }
  //     }
  //     ownerDocument.addEventListener('keydown', keydownAction);

  //     return () => {
  //       ownerDocument.removeEventListener('keydown', keydownAction);
  //     }
  //   }
  // }, []);

  // 画布大小变化
  useEffect(() => {
    const Ref = ReferRef.current;
    if (Ref) {
      window.addEventListener('resize', function (){
        const canvas = Ref.canvas;
        canvas.setWidth(document.documentElement.clientWidth);
        canvas.setHeight(document.documentElement.clientHeight);
        canvas.requestRenderAll();
        canvas.calcOffset();
      }, {passive: true});
    }
  }, []);

  return (
    <canvas
      width={vw}
      height={vh}
      ref={canvasEl}
    />
  )
};

export default ReferCanvas;