import { fabric } from 'fabric';
import type { IEvent, Point } from 'fabric/fabric-impl';
import { useRef, useEffect } from 'react'
import Refer from './Refer';

const vw = document.documentElement.clientWidth;
const vh = document.documentElement.clientHeight;

const ReferCanvas = () => {
  const canvasEl = useRef(null);
  useEffect(() => {
    const options = { };
    const canvas = new fabric.Canvas(canvasEl.current, options);
    const ReferInstance = new Refer(canvas);

    ReferInstance.addImgFromURL('https://gd-hbimg.huaban.com/c5300f7aff47943aa4fb9d56b8dc764a4c5076aed3245-FaxWud_fw480webp');

    ReferInstance.addEventListener('mouse:wheel', (e: IEvent) => {
      const event = e.e as WheelEvent;
      const zoom = ReferInstance.canvas.getZoom();
      const newZoom = Math.min(50, Math.max(0.02, zoom * (event.deltaY > 0 ? 0.9 : 1.1)));
      ReferInstance.zoomToPoint(e.pointer as Point, newZoom);
    })

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