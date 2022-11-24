import { fabric } from 'fabric';
import type { IEvent, Point } from 'fabric/fabric-impl';
import { useRef, useEffect, useState } from 'react'
import Refer from './Refer';

const vw = document.documentElement.clientWidth;
const vh = document.documentElement.clientHeight;

const ReferCanvas = () => {
  const canvasEl = useRef(null);
  
  useEffect(() => {
    const options = { };
    const canvas = new fabric.Canvas(canvasEl.current, options);
    const ReferInstance = new Refer(canvas);
    (window as any).Refer = ReferInstance;

    ReferInstance.addImgFromURL('https://gd-hbimg.huaban.com/c5300f7aff47943aa4fb9d56b8dc764a4c5076aed3245-FaxWud_fw480webp');

    // 鼠标滚动缩放
    ReferInstance.addEventListener('mouse:wheel', (e: IEvent) => {
      const event = e.e as WheelEvent;
      const zoom = ReferInstance.canvas.getZoom();
      const newZoom = Math.min(50, Math.max(0.02, zoom * (event.deltaY > 0 ? 0.9 : 1.1)));
      ReferInstance.zoomToPoint(e.pointer as Point, newZoom);
    });

    // 拖拽本地图片
    ReferInstance.addEventListener('drop', (e: IEvent) => {
      const originEvent = e.e as DragEvent;
      originEvent.preventDefault();

      const files = originEvent.dataTransfer?.files;
      if (files) {
        for (const file of files) {
          if (/^image\/*/.test(file.type)) {
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
      ReferInstance.fitViewElement();
    });

    return () => {
      canvas.dispose();
      ReferInstance.dispose();
    }
  }, []);

  // Drop image
  // useEffect(() => {
  //   debugger;
  //   const canvasDom = canvasEl.current;
  //   if (canvasDom) {
  //     (canvasDom as HTMLElement).addEventListener('drop', (e) => {
  //       e.preventDefault();
  //       debugger;
  //       console.info(e.dataTransfer);
  //     })
  //   }
  // }, []);

  return (
    <canvas
      width={vw}
      height={vh}
      ref={canvasEl}
    />
  )
};

export default ReferCanvas;