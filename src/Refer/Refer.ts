import { fabric } from 'fabric';
import { Canvas, Image, Point } from 'fabric/fabric-impl';

export default class Refer {
  canvas: Canvas;

  constructor(fabricCanvas: Canvas ) {
    this.canvas = fabricCanvas;
  }

  addImg() {

  }

  addImgFromURL(src: string, callback?: (img: Image) => {}) {
    fabric.Image.fromURL(src, (oImg) => {
      this.canvas.add(oImg);
      callback?.call(this, oImg);
    });
  }

  fitViewElement(element: Element, callback?: () => {}) {
    this.canvas.zoomToPoint(new Point(200, 200), 2);
  }

  addEventListener(eventName: string, callback: any) {
    this.canvas.on(eventName, callback);
  }

  dispose() {
    // TODO: destory canvas
    console.info('dispose');
  }
}