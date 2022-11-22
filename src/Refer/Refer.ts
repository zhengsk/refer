import { fabric } from 'fabric';
import type { Canvas, Image, Point } from 'fabric/fabric-impl';

export default class Refer {
  canvas: Canvas;

  constructor(fabricCanvas: Canvas ) {
    this.canvas = fabricCanvas;
    this.setDefaultStyle();
  }

  // Objeft default style
  private setDefaultStyle() {
    fabric.Object.prototype.set({
      transparentCorners: false,
      
      // border
      // borderDashArray: [5,5],
      borderColor: '#ff5967',
      borderScaleFactor: 2,

      // corner
      cornerSize: 10,
      cornerColor: '#ff5967',
      cornerStrokeColor: '#ffffff',
      cornerStyle: 'circle',

      // controls
      _controlsVisibility: {
        ml: false,
        mr: false,
        mb: false,
        mt: false,
        mtr: false,
      }
    });
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
    this.canvas.zoomToPoint(new fabric.Point(200, 200), 2);
  }

  addEventListener(eventName: string, callback: any) {
    this.canvas.on(eventName, callback);
  }

  zoomToPoint(point: Point, value: number) {
    this.canvas.zoomToPoint(point, value);
    return this;
  }

  dispose() {
    // TODO: destory canvas
    console.info('dispose');
  }
}