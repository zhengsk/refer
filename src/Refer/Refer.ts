import { fabric } from 'fabric';
import { Canvas, Image, Object } from 'fabric/fabric-impl';

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

  fitViewElement(element?: Object, callback?: () => {}) {
    const { canvas } = this;
    canvas.renderAll();
    const ele: Object = element || canvas.getActiveObject();
    
    if (ele) {
      const zoom = canvas.getZoom();
      
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      
      const elementWidth = ele.getScaledWidth() * zoom;
      const elementHeight = ele.getScaledHeight() * zoom;
      
      const widthRatio = canvasWidth / elementWidth;
      const heightRatio = canvasHeight / elementHeight;

      console.info(elementWidth, elementHeight);
      
      
      const ratio = Math.min(widthRatio, heightRatio);
      

      const eleCenterPoint = ele.getCenterPoint();
      const canvasCenterPoint = canvas.getVpCenter();
      console.info(canvasCenterPoint, eleCenterPoint);
      console.info(canvasCenterPoint.x - eleCenterPoint.x, canvasCenterPoint.y - eleCenterPoint.y);
      
      const panSize =  new fabric.Point(
        (canvasCenterPoint.x - eleCenterPoint.x) * zoom,
        (canvasCenterPoint.y - eleCenterPoint.y) * zoom
      );
      
      canvas.setZoom(zoom * ratio);
      // canvas.zoomToPoint(canvasCenterPoint, zoom * ratio);

      // canvas.relativePan(panSize);

    }
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