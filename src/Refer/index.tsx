import { fabric } from 'fabric';
import type { IEvent, Point } from 'fabric/fabric-impl';
import { useRef, useEffect, useState } from 'react'
import Refer from './Refer';

const vw = document.documentElement.clientWidth;
const vh = document.documentElement.clientHeight;

const ReferCanvas = () => {
  const canvasEl = useRef(null);
  const {isFitviewMode, setIsFitViewMode} = useState(false);
  
  useEffect(() => {
    const options = { };
    const canvas = new fabric.Canvas(canvasEl.current, options);
    const ReferInstance = new Refer(canvas);
    (window as any).Refer = ReferInstance;

    var rect = new fabric.Rect({
      left: -10,
      top: -10,
      fill: 'red',
      width: 20,
      height: 20,
    });

    ReferInstance.canvas.add(rect);

    var circle = new fabric.Circle({
      left: 240-10,
      top: 666-10,
      fill: 'yellow',
      radius: 10,
    });
    ReferInstance.canvas.add(circle);


    ReferInstance.addImgFromURL('https://gd-hbimg.huaban.com/c5300f7aff47943aa4fb9d56b8dc764a4c5076aed3245-FaxWud');
    ReferInstance.addImgFromURL('https://gd-hbimg.huaban.com/54a1785cfc4b7d196884a63fdc510d85ab323fb039ffb-fxWgbl');

    // 鼠标滚动缩放
    ReferInstance.addEventListener('mouse:wheel', (e: IEvent) => {
      const event = e.e as WheelEvent;
      const zoom = ReferInstance.canvas.getZoom();
      const newZoom = Math.min(100, Math.max(0.01, zoom * (event.deltaY > 0 ? 0.9 : 1.1)));
      ReferInstance.zoomToPoint(e.pointer as Point, newZoom);
    });

    // 拖拽本地图片
    ReferInstance.addEventListener('drop', (e: IEvent) => {
      const originEvent = e.e as DragEvent;
      originEvent.preventDefault();

      const items = originEvent.dataTransfer?.items || [];
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
              // TODO: Get Large image src OR srcset
              ReferInstance.addImgFromURL(img.src);
            });
          });

        } else if ((item.kind === 'string') && (item.type.match('^text/uri-list'))) {
          // url
          item.getAsString(src => {
            ReferInstance.addImgFromURL(src);
          });
        } else if ((item.kind === 'file') && (item.type.match('^image/'))) {
          // Drag items item is an image file
          const file = item.getAsFile();
          if (file && /^image\/*/.test(file.type)) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.addEventListener('load', function(e) {
              ReferInstance.addImgFromURL(this.result as string);
              console.info(this.result);
            });
          }
        }
      }
    });

    // 双击自适应窗口
    ReferInstance.addEventListener('mouse:dblclick', (e: IEvent) => {
      const { zoom, panPoint } = ReferInstance.getViewStatus();
      ReferInstance.fitViewElement();

      setTimeout(() => {
        ReferInstance.canvas.zoomToPoint(new fabric.Point(-panPoint.x, -panPoint.y ), zoom );
        ReferInstance.canvas.absolutePan(panPoint);
      }, 2000);
    });

    // ReferInstance.canvas.map

    return () => {
      canvas.dispose();
      ReferInstance.dispose();
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