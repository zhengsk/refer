import { ActiveSelection, FabricImage, FabricObject, InteractiveFabricObject, IText, Point, util } from 'fabric';
import type { CanvasEvents, FabricText, IImageOptions, ITextOptions, TMat2D, } from 'fabric/fabric-impl';
import { REFER_CLIPBOARD_TYPE, REFER_EMPTY } from '../constants/clipboard';
import { removeFromArray } from '../utils/tools';
import ReferCanvas from './extensions/history';

export default class Refer {
  public canvas: ReferCanvas;
  public dragMode: boolean;
  public dragging: boolean;
  public textEditing: boolean;
  public textEditingElement: IText | undefined;

  public preViewStatus: {
    zoom: number,
    center: Point,
    element: FabricObject,
  } | undefined;

  public clipboard: FabricObject[] = [];

  constructor(canvasEl: HTMLCanvasElement, options?: any) {
    this.canvas = new ReferCanvas(canvasEl, options);
    this.dragMode = false;
    this.dragging = false;
    this.textEditing = false;

    this.setDefaultStyle(); // 设置默认样式
    this.initDragMode(); // 初始化拖拽模式
    this.bindTextEditingEvent(); // 绑定事件，判断是否处于文本编辑状态
  }

  // Object default style
  private setDefaultStyle() {
    InteractiveFabricObject.ownDefaults = {
      ...InteractiveFabricObject.ownDefaults,

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
    };
  }

  getActiveObject() {
    return this.canvas.getActiveObject();
  }

  // 添加对象
  addElement(object: FabricObject | FabricObject[], {
    isActive = true,
  }: {
    isActive?: boolean,
  } = {}) {
    if (Array.isArray(object)) {
      this.canvas.add(...object);
    } else {
      this.canvas.add(object);
    }

    if (isActive) {
      // 选中所有元素
      this.selectElement(object);
    }
  }

  // 添加图片
  addImg() {

  }

  getZoom() {
    return this.canvas.getZoom();
  }

  setZoom(zoom = 1) {
    return this.canvas.setZoom(zoom);
  }

  // Get canvas view status：zoom and absolute pan value
  setPreViewStatus(element: FabricObject) {
    const { canvas } = this;
    const zoom = canvas.getZoom();
    const center = canvas.getVpCenter();

    this.preViewStatus = {
      zoom,
      center,
      element,
    }
  }

  // Restore preview status
  restorePreViewStatus() {
    if (this.preViewStatus) {
      this.animateToPoint({
        point: this.preViewStatus.center,
        targetZoom: this.preViewStatus.zoom,
      });

      this.preViewStatus = undefined;
    }
  }

  // 平滑动画到指定点和缩放
  animateToPoint({
    point,
    targetZoom,
    duration = 200,
  }: {
    point: Point,
    targetZoom: number,
    duration?: number,
  }) {
    const canvas = this.canvas;

    // 获取当前画布状态
    const currentZoom = canvas.getZoom();
    const startPoint = new Point(canvas.viewportTransform[4], canvas.viewportTransform[5]);

    // 计算目标对象在视口中居中时的最终平移值
    const viewportCenter = {
      x: canvas.width / 2 / targetZoom,
      y: canvas.height / 2 / targetZoom
    };

    // 计算最终需要平移到的位置
    const endPoint = new Point(
      -point.x * targetZoom + viewportCenter.x * targetZoom,
      -point.y * targetZoom + viewportCenter.y * targetZoom
    );

    if (duration !== 0) {
      // 创建动画
      util.animate({
        startValue: 0,
        endValue: 100,
        duration: duration,
        easing: util.ease.easeOutCubic, // 使用缓动函数使动画更平滑
        onChange: function (value) {
          const progress = value / 100;

          // 计算当前缩放值
          const zoom = currentZoom + (targetZoom - currentZoom) * progress;

          // 计算当前平移值
          const translateX = startPoint.x + (endPoint.x - startPoint.x) * progress;
          const translateY = startPoint.y + (endPoint.y - startPoint.y) * progress;

          // 应用变换
          const vpt = canvas.viewportTransform!;
          vpt[0] = vpt[3] = zoom;
          vpt[4] = translateX;
          vpt[5] = translateY;

          canvas.setViewportTransform(vpt);
          canvas.requestRenderAll();
        }
      });
    } else {
      const vpt = canvas.viewportTransform!;
      vpt[0] = vpt[3] = targetZoom;
      vpt[4] = endPoint.x;
      vpt[5] = endPoint.y;

      canvas.setViewportTransform(vpt);
      canvas.requestRenderAll();
    }
  }

  // 平滑动画到对象
  animateToObject({
    object,
    targetZoom,
    duration = 200,
  }: {
    object: FabricObject,
    targetZoom: number,
    duration?: number,
  }) {
    const canvas = this.canvas;

    // 计算目标对象在视口中居中时的最终平移值
    const point = object.getCenterPoint();

    this.animateToPoint({
      point,
      targetZoom,
      duration,
    });
  }

  fitViewElement({
    element,
    callback,
    saveState = true,
  }: {
    element?: FabricObject,
    callback?: () => {},
    saveState?: boolean,
  } = {}) {
    const { canvas } = this;
    canvas.renderAll();
    const ele: FabricObject = element || canvas.getActiveObject() as FabricObject;

    if (ele) {
      if (saveState) {
        this.setPreViewStatus(ele); // Save status
      } else if (this.preViewStatus) { // Just save element
        this.preViewStatus.element = ele;
      }

      const offset = 0;
      const zoom = canvas.getZoom();

      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();

      const elementWidth = (ele.getScaledWidth() + offset) * zoom;
      const elementHeight = (ele.getScaledHeight() + offset) * zoom;

      const widthRatio = canvasWidth / (elementWidth);
      const heightRatio = canvasHeight / (elementHeight);

      const ratio = Math.min(widthRatio, heightRatio);

      // 在该点上添加一个点
      this.animateToObject({
        object: ele,
        targetZoom: zoom * ratio,
      });

      if (callback) { callback(); }
    }
  }

  async addImgFromURL({
    src,
    callback,
    imageOptions = {},
    inVpCenter = false,
  }: {
    src: string,
    callback?: (img: FabricImage) => void,
    imageOptions?: IImageOptions,
    inVpCenter?: boolean,
  }) {
    try {
      const oImg = await FabricImage.fromURL(src, {}, imageOptions);
      if (inVpCenter) {
        const centerPoint = this.canvas.getVpCenter();
        oImg.left = centerPoint.x - (oImg.width || 0) / 2;
        oImg.top = centerPoint.y - (oImg.height || 0) / 2;
      }
      this.canvas.add(oImg);
      callback?.call(this, oImg);
    } catch (error) {
      console.error(error);
    }
  }

  // Create Text element
  createText({
    text = '',
    opts = { fill: '#ed5e77', },
    inVpCenter = true
  }: {
    text: string,
    opts?: ITextOptions,
    inVpCenter?: boolean
  }): FabricText {
    var textEle = new IText(text, opts);

    if (inVpCenter) {
      const centerPoint = this.canvas.getVpCenter();
      textEle.left = centerPoint.x - textEle.getScaledWidth() / 2;
      textEle.top = centerPoint.y - textEle.getScaledHeight() / 2;
    }

    return textEle;
  }

  // Add Text element
  addText({
    text = '',
    opts = { fill: '#ed5e77', },
    inVpCenter = true
  }: {
    text: string,
    opts?: ITextOptions,
    inVpCenter?: boolean
  }): FabricText {
    const textEle = this.createText({ text, opts, inVpCenter });
    this.canvas.add(textEle);
    return textEle;
  }

  addEventListener(eventName: keyof CanvasEvents, callback: any) {
    this.canvas.on(eventName, callback);
  }

  removeEventListener(eventName: keyof CanvasEvents, callback: any) {
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
      if (this.dragMode || (e.e as MouseEvent).button === 1) {
        this.dragging = true;
        if (e.viewportPoint) {
          oPoint = e.viewportPoint;
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

      if (this.dragging && e.viewportPoint) {
        const dx = e.viewportPoint.x - oPoint?.x;
        const dy = e.viewportPoint.y - oPoint?.y;
        const transform = [...oTransform]
        transform[4] += dx;
        transform[5] += dy;
        this.canvas.setViewportTransform(transform as TMat2D);

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
    this.canvas.setViewportTransform(newTransform as TMat2D);
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
  selectElement(elements?: FabricObject | FabricObject[]): FabricObject {
    this.canvas.discardActiveObject();

    if (!elements) {
      elements = this.canvas.getObjects();
    } if (!Array.isArray(elements)) {
      elements = [elements];
    }

    const selection = new ActiveSelection(elements, { canvas: this.canvas });
    this.canvas.setActiveObject(selection);
    this.canvas.requestRenderAll();
    return selection;
  }

  // Delete element
  deleteElement(elements?: FabricObject | FabricObject[]) {
    if (!elements) {
      elements = this.canvas.getActiveObjects();
    } else if (!Array.isArray(elements)) {
      elements = [elements];
    }

    elements.forEach(ele => {
      if (ele.type === 'activeselection') {
        (ele as ActiveSelection).getObjects().forEach(obj => {
          this.canvas.remove(obj);
        });
      } else {
        this.canvas.remove(ele);
      }
    });

    this.canvas.discardActiveObject();
  }

  // Copy element to clipboard
  copyElement(elements?: FabricObject | FabricObject[], event?: ClipboardEvent) {
    if (!elements) {
      elements = [this.canvas.getActiveObject() as FabricObject];
    } if (!Array.isArray(elements)) {
      elements = [elements];
    }

    this.clipboard = [];

    if (event && elements.length) {
      event.clipboardData?.setData(REFER_CLIPBOARD_TYPE, REFER_EMPTY);

      return Promise.all(elements.map(element => element.clone())).then(cloned => {
        this.clipboard.push(...cloned);
      });
    }
  }

  // Paste clipboard element
  pasteElement(elements?: FabricObject | FabricObject[]) {
    if (!elements) {
      elements = this.clipboard;
    } else if (!Array.isArray(elements)) {
      elements = [elements];
    }

    this.clipboard.forEach((ele) => {
      this.canvas.discardActiveObject();
      const zoom = this.canvas.getZoom();
      const offset = 20 / zoom;

      ele.clone().then((newEle: FabricObject) => {
        newEle.set({
          left: (newEle.left as number) + offset,
          top: (newEle.top as number) + offset,
        });

        if (newEle.type === 'activeselection') {
          // active selection needs a reference to the canvas.
          (newEle as ActiveSelection).forEachObject((ele: FabricObject) => {
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
    elements.forEach(async (element) => {
      const cloned = await element.clone();
      this.clipboard.push(cloned);
    });
  }

  // 设置画布的activeObject的层级
  setElementIndex(index: number, element?: FabricObject) {
    if (!element) {
      element = this.canvas._activeObject;

      if (!element) {
        return this;
      }
    }

    const activeSelection = this.canvas._activeObject;
    if (element === activeSelection && element.type === 'activeselection') {
      const objs = (element as ActiveSelection).getObjects();

      // 移除元素
      for (let i = 0; i < objs.length; i++) {
        const obj = objs[i];
        removeFromArray(this.canvas._objects, obj);
      }

      // 插入元素
      this.canvas._objects.splice(index, 0, ...objs);
    } else {
      removeFromArray(this.canvas._objects, element);
      this.canvas._objects.push(element);
    }

    this.canvas.requestRenderAll();
    return this;
  }

  // Bring to front
  bringToFront(element?: FabricObject) {
    this.setElementIndex(this.canvas._objects.length, element);
  }

  // Bring to back
  bringToBack(element?: FabricObject) {
    this.setElementIndex(0, element);
  }

  // Send to back
  sendToBack(element?: FabricObject) {
    if (!element) {
      element = this.canvas.getActiveObject();
    }
    // element?.sendToBack();
    this.canvas.requestRenderAll();
  }

  dispose() {
    // TODO: history dispose

    // dispose canvas
    this.canvas.dispose();
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
      this.canvas.loadFromJSON(jsonData, resolve).then(() => {
        this.canvas.requestRenderAll();
      });
    });
  }
}