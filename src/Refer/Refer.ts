import { fabric } from 'fabric';
import 'fabric-history'; // history https://www.npmjs.com/package/fabric-history
import type {
  ActiveSelection,
  Canvas as FabricCanvas,
  IImageOptions,
  Image,
  IText,
  ITextOptions,
  Object,
  Point,
  Text,
} from 'fabric/fabric-impl';

interface Canvas extends FabricCanvas {
  undo(): void;
  redo(): void;
  wrapperEl: HTMLCanvasElement;
}

export default class Refer {
  public canvas: Canvas;
  public dragMode: boolean;
  public dragging: boolean;
  public textEditing: boolean;
  public textEditingElement: IText | undefined;

  public preViewStatus: { zoom: number, panPoint: Point, element: Object } | undefined;
  public clipboard: Object[] = [];

  constructor(fabricCanvas: Canvas) {
    this.canvas = fabricCanvas;
    this.dragMode = false;
    this.dragging = false;
    this.textEditing = false;

    this.setDefaultStyle(); // 设置默认样式
    this.initDragMode(); // 初始化拖拽模式
    this.bindTextEditingEvent(); // 绑定事件，判断是否处于文本编辑状态
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

  getActiveObject() {
    return this.canvas.getActiveObject();
  }

  addImg() {

  }

  getZoom() {
    return this.canvas.getZoom();
  }

  setZoom(zoom = 1) {
    return this.canvas.setZoom(zoom);
  }



  // Get canvas view status：zoom and absolute pan value
  setPreViewStatus(element: Object) {
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
      element,
    }
  }

  // Restore preview status
  restorePreViewStatus() {
    if (this.preViewStatus) {
      const { zoom, panPoint } = this.preViewStatus;
      this.canvas.zoomToPoint(new fabric.Point(-panPoint.x, -panPoint.y), zoom);
      this.canvas.absolutePan(panPoint);

      this.preViewStatus = undefined;
    }
  }

  // Fit element to viewport
  fitViewElement({
    element,
    callback,
    saveState = true,
  }: {
    element?: Object,
    callback?: () => {},
    saveState?: boolean,
  } = {}) {
    const { canvas } = this;
    canvas.renderAll();
    const ele: Object = element || canvas.getActiveObject();

    if (ele) {
      if (saveState) {
        this.setPreViewStatus(ele); // Save status
      } else if (this.preViewStatus) { // Just save element
        this.preViewStatus.element = ele;
      }

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
        (eleCenterPoint.x) * zoom - canvasWidth / 2,
        (eleCenterPoint.y) * zoom - canvasHeight / 2
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

  addImgFromURL({ src, callback, imageOptions = {}, inVpCenter = false }: {
    src: string,
    callback?: (img: Image) => void,
    imageOptions?: IImageOptions,
    inVpCenter?: boolean,
  }) {
    fabric.Image.fromURL(src, (oImg) => {
      if (inVpCenter) {
        const centerPoint = this.canvas.getVpCenter();
        oImg.left = centerPoint.x - (oImg.width || 0) / 2;
        oImg.top = centerPoint.y - (oImg.height || 0) / 2;
      }
      this.canvas.add(oImg);
      callback?.call(this, oImg);
    }, imageOptions);
  }

  // Add Text element
  addText(text: string = '', opts: ITextOptions = {
    fill: '#ed5e77',
  }): Text {
    var textEle = new fabric.IText(text, opts);
    const centerPoint = this.canvas.getVpCenter();

    textEle.set({
      left: centerPoint.x - textEle.getScaledWidth() / 2,
      top: centerPoint.y - textEle.getScaledHeight() / 2,
    });

    this.canvas.add(textEle);
    return textEle;
  }

  addEventListener(eventName: string, callback: any) {
    this.canvas.on(eventName, callback);
  }

  removeEventListener(eventName: string, callback: any) {
    this.canvas.off(eventName, callback);
  }

  zoomToPoint(point: Point, zoom: number) {
    this.canvas.zoomToPoint(point, zoom);
    return this;
  }

  // 初始化拖拽模式
  initDragMode() {
    let oPoint: Point;
    let oTransform: number[] = [];
    this.canvas.fireMiddleClick = true; // 启用中键
    this.canvas.on('mouse:down', (e) => {
      if (this.dragMode || e.button === 2) {
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

  // 移动画布
  moveViewportBy(dx: number, dy: number) {
    const oTransform = this.canvas.viewportTransform;
    const newTransform = oTransform ? [...oTransform] : [];
    newTransform[4] += dx;
    newTransform[5] += dy;
    this.canvas.setViewportTransform(newTransform);
    return this;
  }

  // 绑定事件，判断是否处于文本编辑状态
  bindTextEditingEvent() {
    this.canvas.on('text:editing:entered', (e) => {
      this.textEditing = true;
      this.textEditingElement = e.target as IText;
    });

    this.canvas.on('text:editing:exited', (e) => {
      this.textEditing = false;
    });
  }

  setDragMode(draggable: boolean) {
    this.dragMode = draggable;
    this.canvas.setCursor(draggable ? 'grab' : 'default');
    this.canvas.interactive = !draggable;
    this.canvas.selection = !draggable;

    //  TODO: Not all object is selectable
    this.canvas.forEachObject(object => {
      object.selectable = !draggable;
    });
  }

  // Select element
  selectElement(elements?: Object | Object[]): Object {
    this.canvas.discardActiveObject();

    if (!elements) {
      elements = this.canvas.getObjects();
    } if (!Array.isArray(elements)) {
      elements = [elements];
    }

    const selection = new fabric.ActiveSelection(elements, { canvas: this.canvas });
    this.canvas.setActiveObject(selection);
    this.canvas.requestRenderAll();
    return selection;
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
  copyElement(elements?: Object | Object[], event?: ClipboardEvent) {
    if (!elements) {
      elements = [this.canvas.getActiveObject()];
    } if (!Array.isArray(elements)) {
      elements = [elements];
    }

    this.clipboard = [];
    elements.forEach(element => element.clone((cloned: Object) => {
      this.clipboard.push(cloned);
    }));

    if (event) {
      event.clipboardData?.setData('text/plain', '');
    }
  }

  // Paste clipboard element
  pasteElement(elements?: Object | Object[]) {
    if (!elements) {
      elements = this.clipboard;
    } else if (!Array.isArray(elements)) {
      elements = [elements];
    }

    this.clipboard.forEach((ele) => {
      this.canvas.discardActiveObject();
      const zoom = this.canvas.getZoom();
      const offset = 20 / zoom;

      ele.clone((newEle: Object) => {
        newEle.set({
          left: (newEle.left as number) + offset,
          top: (newEle.top as number) + offset,
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

      ele.left = (ele.left || 0) + offset;
      ele.top = (ele.top || 0) + offset;
    })

    this.clipboard = [];
    elements.forEach(element => element.clone((cloned: Object) => {
      this.clipboard.push(cloned);
    }))
  }

  // Bring to front
  bringToFront(element?: Object) {
    if (!element) {
      element = this.canvas.getActiveObject();
    }
    this.canvas.bringToFront(element);
  }

  dispose() {
    // TODO: destory canvas
    console.info('dispose');
  }

  // history undo
  undo() {
    this.canvas?.undo();
  }

  // history redo
  redo() {
    this.canvas?.redo();
  }

  // save json
  exportJSON() {
    return this.canvas.toDatalessJSON();
  }

  // load json
  loadJSON(jsonData: string | object) {
    return new Promise((resolve, reject) => {
      this.canvas.loadFromJSON(jsonData, resolve);
    });
  }
}