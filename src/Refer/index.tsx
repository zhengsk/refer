import { fabric } from 'fabric';
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

    ReferInstance.addEventListener('mouse:wheel', (e: WheelEvent) => {
      console.info(e);
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