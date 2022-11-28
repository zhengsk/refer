import { fabric } from 'fabric';
import type { IEvent, Point } from 'fabric/fabric-impl';
import { useRef, useEffect, useState, useCallback } from 'react'
import ReferCreator from './Refer';

const vw = document.documentElement.clientWidth;
const vh = document.documentElement.clientHeight;

const ReferCanvas = () => {
  const ReferRef = useRef<ReferCreator>();
  const canvasEl = useRef<HTMLCanvasElement|null>(null);
  // const {isFitviewMode, setIsFitViewMode} = useState(false);


  useEffect(() => {
    const options = { };
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


    // var circle = new fabric.Circle({
    //   left: 240-10,
    //   top: 666-10,
    //   fill: 'yellow',
    //   radius: 10,
    // });
    // Refer.canvas.add(circle);


    Refer.addImgFromURL('https://gd-hbimg.huaban.com/c5300f7aff47943aa4fb9d56b8dc764a4c5076aed3245-FaxWud');
    Refer.addImgFromURL('https://gd-hbimg.huaban.com/54a1785cfc4b7d196884a63fdc510d85ab323fb039ffb-fxWgbl');


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
        const zoom = Refer.canvas.getZoom();
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
        if (e.code === 'Space' || e.key === ' ') {
          if (ReferRef.current && !ReferRef.current.dragMode) {
            e.preventDefault();
            ReferRef.current.setDragMode(true);
          }
        }
      }

      const keyupAction = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.key === ' ') {
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

  // 删除选中元素
  useEffect(() => {
    const canvasDom = canvasEl.current;
    if (canvasDom) {
      const ownerDocument = canvasDom.ownerDocument;

      const keydownAction = (e: KeyboardEvent) => {
        if (e.code === 'Delete' || e.key === 'Delete') {
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

  // 双击自适应窗口
  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      Refer.addEventListener('mouse:dblclick', (e: IEvent) => {
        if (!Refer.preViewStatus) {
          Refer.fitViewElement();
        } else {
          Refer.restorePreViewStatus();
        }
      });
    }
  }, []);

  // 拖拽或粘贴对象（dataTransfer）到画布
  const addFromDataTransfer = useCallback((DataTransferItemList: DataTransferItemList | undefined) => {
    const Refer = ReferRef.current
    if (Refer) {
      const items = DataTransferItemList || [];
      const appendedMap: {[key: string]: boolean} = {}; // Prevent add repeat

      // When has HTML then skip file type
      const hasHtml = [...items].some(item => item.type.match('^text/html'));

      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if ((item.kind === 'string') && (item.type.match('^text/plain'))) {
          // Add Text node
        } else if ((item.kind === 'string') && (item.type.match('^text/html'))) {
          // Get image from html
          item.getAsString(html => {
            const div = document.createElement('div');
            div.innerHTML = html;
            const imgs = div.querySelectorAll('img');
            imgs.forEach(img => {
              if (!appendedMap[img.src]) {
                console.count('html');
                console.info(img.src);
                // TODO: Get Large image src OR srcset
                Refer.addImgFromURL(img.src);
                appendedMap[img.src] = true;
              }
            });
          });
  
        } else if ((item.kind === 'string') && (item.type.match('^text/uri-list'))) {
          // url
          item.getAsString(src => {
            if (!appendedMap[src]) {
              console.count('uri-list');
              Refer.addImgFromURL(src);
              appendedMap[src] = true;
            }
          });
        } else if (!hasHtml && (item.kind === 'file') && (item.type.match('^image/'))) {
          // Drag items item is an image file
          const file = item.getAsFile();
          if (file && /^image\/*/.test(file.type)) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            console.count('file');
            reader.addEventListener('load', function(e) {
              Refer.addImgFromURL(this.result as string);
            });
          }
        }
      }
    }
  }, []);

  // 拖拽本地文件到画布
  useEffect(() => {
    const Refer = ReferRef.current;

    if (Refer) {
      const dropAction = (e: IEvent) => {
        const originEvent = e.e as DragEvent;
        originEvent.preventDefault();
  
        const items = originEvent.dataTransfer?.items;
        addFromDataTransfer(items);
      }

      Refer.addEventListener('drop', dropAction);

      return () => {
        Refer.removeEventListener('drop', dropAction);
      }
    }
  }, []);

  // 粘贴内容到画布
  useEffect(() => {
    const canvasDom = canvasEl.current;
    if (canvasDom) {
      const pasteAction = (e: ClipboardEvent) => {
        e.preventDefault();
        addFromDataTransfer(e.clipboardData?.items);
      };

      const ownerDocument = canvasDom.ownerDocument;
      ownerDocument.addEventListener('paste', pasteAction);

      return () => {
        ownerDocument.removeEventListener('paste', pasteAction);
      }
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