import { fabric } from 'fabric';
import { ActiveSelection, Canvas, Image, Object, Point } from 'fabric/fabric-impl';

export default class Refer {
  canvas: Canvas;
  dragMode: boolean;
  dragging: boolean;

  preViewStatus: {zoom: number, panPoint: Point} | undefined;
  clipboard: Object[] = [];

  constructor(fabricCanvas: Canvas ) {
    this.canvas = fabricCanvas;
    this.dragMode = false;
    this.dragging = false;

    this.setDefaultStyle();
    this.initDragMode();
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

  // Get canvas view status：zoom and absolute pan value
  setPreViewStatus() {
    const { canvas } = this;
    const zoom = canvas.getZoom();
    const vpCenter = canvas.getVpCenter();
    const center = canvas.getCenter();

    const panPoint = new fabric.Point(
      vpCenter.x * zoom - center.left,
      vpCenter.y * zoom - center.top
    );

    this.preViewStatus = {
      zoom,
      panPoint,
    }
  }

  // Restore preview status
  restorePreViewStatus() {
    if (this.preViewStatus) {
      const { zoom, panPoint } = this.preViewStatus;
      this.canvas.zoomToPoint(new fabric.Point(-panPoint.x, -panPoint.y ), zoom );
      this.canvas.absolutePan(panPoint);

      this.preViewStatus = undefined;
    }
  }

  // Fit element to viewport
  fitViewElement(element?: Object, callback?: () => {}) {
    const { canvas } = this;
    canvas.renderAll();
    const ele: Object = element || canvas.getActiveObject();
    
    if (ele) {
      this.setPreViewStatus(); // Save status

      const offset = 20;
      const zoom = canvas.getZoom();
      
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      
      const elementWidth = (ele.getScaledWidth() + offset) * zoom;
      const elementHeight = (ele.getScaledHeight() + offset) * zoom;
      
      const widthRatio = canvasWidth / (elementWidth);
      const heightRatio = canvasHeight / (elementHeight);

      const ratio = Math.min(widthRatio, heightRatio);

      const eleCenterPoint = ele.getCenterPoint();
      
      const absolutePanSize = new fabric.Point(
        (eleCenterPoint.x) * zoom  - canvasWidth / 2,
        (eleCenterPoint.y) * zoom  - canvasHeight / 2
      );
      canvas.absolutePan(absolutePanSize);
      
      // const canvasCenterPoint = canvas.getVpCenter();
      // const relativePanSize =  new fabric.Point(
      //   (canvasCenterPoint.x - eleCenterPoint.x) * zoom,
      //   (canvasCenterPoint.y - eleCenterPoint.y) * zoom
      // );
      // canvas.relativePan(relativePanSize);

      const eleRect = ele.getBoundingRect();
      const point = new fabric.Point(
        eleRect.left + eleRect.width / 2,
        eleRect.top + eleRect.height / 2
      );
      canvas.zoomToPoint(point, zoom * ratio);

      if (callback) { callback(); }
    }
  }

  addImgFromURL(src: string, callback?: (img: Image) => {}) {
    fabric.Image.fromURL(src, (oImg) => {
      this.canvas.add(oImg);
      callback?.call(this, oImg);
    });
  }

  addEventListener(eventName: string, callback: any) {
    this.canvas.on(eventName, callback);
  }

  removeEventListener(eventName: string, callback: any) {
    this.canvas.off(eventName, callback);
  }

  zoomToPoint(point: Point, value: number) {
    this.canvas.zoomToPoint(point, value);
    return this;
  }

  initDragMode() {
    let oPoint: Point;
    let oTransform: number[] = [];
    this.canvas.on('mouse:down', (e) => {
      if (this.dragMode) {
        this.dragging = true;
        if (e.pointer) {
          oPoint = e.pointer;
        }

        if (this.canvas.viewportTransform) {
          oTransform = this.canvas.viewportTransform;
        }

        this.canvas.setCursor('grabbing');
      }         
    });

    this.canvas.on('mouse:move', (e) => {
      if (this.dragMode) {
        this.canvas.setCursor('grab');
      }
      
      if (this.dragging && e.pointer) {
        const dx = e.pointer.x - oPoint?.x;
        const dy = e.pointer.y - oPoint?.y;
        const transform = [...oTransform]
        transform[4] += dx;
        transform[5] += dy;
        this.canvas.setViewportTransform(transform);

        this.canvas.setCursor('grabbing');
      }
    });

    this.canvas.on('mouse:up', (e) => {
      this.dragging = false;

      if (this.dragMode) {
        this.canvas.setCursor('grab');
      }
    });
  }

  setDragMode(draggable: boolean) {
    this.dragMode = draggable;
    this.canvas.setCursor( draggable ? 'grab' : 'default');
    this.canvas.interactive = !draggable;

    //  TODO: Not all object is selectable
    this.canvas.forEachObject(object => {
      object.selectable = !draggable;
    });
  }

  // Select element
  selectElement(elements?: Object | Object[]) {
    if (!elements) {
      elements = this.canvas.getObjects();
    } if (!Array.isArray(elements)) {
      elements = [elements];
    }

    const selection = new fabric.ActiveSelection(elements, { canvas: this.canvas });
    this.canvas.setActiveObject(selection);
    this.canvas.requestRenderAll();
  }

  // Delete element
  deleteElement(elements?: Object | Object[]) {
    if (!elements) {
      elements = this.canvas.getActiveObjects();
    } else if (!Array.isArray(elements)) {
      elements = [elements];
    }

    elements.forEach(ele => {
      this.canvas.remove(ele);
    });
    this.canvas.discardActiveObject();
  }

  // Copy element to clipboard
  copySelectElement(elements?: Object | Object[]) {
    if (!elements) {
      elements = [this.canvas.getActiveObject()];
    } if (!Array.isArray(elements)) {
      elements = [elements];
    }

    this.clipboard = [];
    elements.forEach(element => element.clone((cloned: Object) => {
      this.clipboard.push(cloned);
      console.info(this.clipboard);
    }));

  }

  // Paste clipboard element
  pasteElement(elements?: Object | Object[]) {
    if (!elements) {
      elements = this.canvas.getObjects();
    } if (!Array.isArray(elements)) {
      elements = [elements];
    }

    this.clipboard.forEach((ele) => {
      ele.clone((newEle: Object) => {
        this.canvas.discardActiveObject();

        const zoom = this.canvas.getZoom();
        newEle.set({
          left: (newEle.left as number) + 20 / zoom,
          top: (newEle.top as number) + 20 / zoom,
          evented: true,
        });

        if (newEle.type === 'activeSelection') {
          // active selection needs a reference to the canvas.
          newEle.canvas = this.canvas;
          (newEle as ActiveSelection).forEachObject((ele: Object) => {
            this.canvas.add(ele);
          });
          // this should solve the unselectability
          newEle.setCoords();
        } else {
          this.canvas.add(newEle);
        }

        this.canvas.setActiveObject(newEle);
        this.canvas.requestRenderAll();
      });
    })

    this.clipboard = [];
    elements.forEach(element => element.clone((cloned: Object) => {
      this.clipboard.push(cloned);
    }))
  }

  dispose() {
    // TODO: destory canvas
    console.info('dispose');
  }
}