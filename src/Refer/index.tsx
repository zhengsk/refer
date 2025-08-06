import { Canvas, Rect, Point, FabricImage, FabricText, ActiveSelection } from 'fabric';
import type { TEvent, FabricObject, TPointerEvent, IText } from 'fabric/fabric-impl';
import { useRef, useEffect, useState, useCallback } from 'react'
import ReferCreator from '../ReferCreator';
import { saveAs, fileOpen } from '../utils/fileAccess';
import { db } from '../db';
import styles from './index.module.less';
import { useShortcut } from '../utils/useShortcut';
import Toolbar from '../components/toolbar';
import ContextMenu from '../components/context-menu';
import type { MenuList } from '../components/context-menu';
import { REFER_CLIPBOARD_TYPE, REFER_EMPTY } from '../constants/clipboard';
import Drawer from '../components/Drawer';
import Property from '../components/Property';
import { useAutoSave } from '../utils/autoSave';
import AutoSaveIndicator from '../components/AutoSaveIndicator';
const vw = document.documentElement.clientWidth;
const vh = document.documentElement.clientHeight;

const ReferCanvas = () => {
  const ReferRef = useRef<ReferCreator>();
  const canvasEl = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedElements, setSelectedElements] = useState<FabricObject[] | undefined>(undefined);
  const [isPropertyLocked, setIsPropertyLocked] = useState(false);
  const [currentReferId, setCurrentReferId] = useState<number | null>(null);
  const [autoSaveState, setAutoSaveState] = useState({
    isSaving: false,
    lastSaveTime: null as number | null,
    errorCount: 0,
    pendingChanges: false
  });
  // const {isFitviewMode, setIsFitViewMode} = useState(false);
  const element = document;

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    event: MouseEvent | undefined;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    event: undefined,
  });

  // 初始化一个画布
  useEffect(() => {
    const options = { preserveObjectStacking: true };
    const Refer = new ReferCreator(canvasEl.current as HTMLCanvasElement, options);

    ReferRef.current = Refer;
    (window as any).Refer = Refer;

    // 监听文本编辑状态, 添加到element上, 用户快捷键监听是判断是否处于文本编辑状态
    Refer.addEventListener('text:editing:entered', () => {
      (element as any).referIsTextEditing = true;
    });
    Refer.addEventListener('text:editing:exited', () => {
      (element as any).referIsTextEditing = false;
    });

    // 加载数据库中的refer
    try {
      loadFromDatabase();
    } catch (error) {
      // 添加一个红色矩形
      const rect = new Rect({
        left: -100,
        top: -100,
        fill: 'red',
        width: 200,
        height: 200,
      });
      Refer.canvas.add(rect);

      // 添加图片
      Refer.addImgFromURL({
        src: 'https://gd-hbimg.huaban.com/13b957418c1f59260285f0ba664fd222b2c78fd581db-ElxX5H_fw1200',
        inVpCenter: true,
      });
      Refer.addImgFromURL({
        src: 'https://gd-hbimg.huaban.com/54a1785cfc4b7d196884a63fdc510d85ab323fb039ffb-fxWgbl',
        inVpCenter: true,
      });
      Refer.addImgFromURL({
        src: 'https://gd-hbimg.huaban.com/608c2098a0dc521aaf7294df06409fd0c3cc503c4bc04-DgtQ5V',
        inVpCenter: true,
      });
    }

    return () => {
      Refer.dispose();
    }
  }, []);

  // 鼠标滚动缩放或移动画布
  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      Refer.addEventListener('mouse:wheel', (e: TEvent<WheelEvent> & { pointer: Point }) => {
        const event = e.e;
        event.preventDefault();
        const zoom = Refer.getZoom();

        // 按住ctrl键，滚动鼠标滚轮，缩放画布
        if (event.ctrlKey || event.metaKey) {
          let ratio = event.deltaY * (Number.isInteger(event.deltaY) ? 0.003 : 0.002);
          if (event.shiftKey) {
            ratio *= 5;
          } else if (event.altKey) {
            ratio *= 0.1;
          }

          const newZoom = Math.min(100, Math.max(0.01, zoom * (1 - ratio)));
          Refer.zoomToPoint(e.pointer, newZoom);
        } else { // 不按住ctrl键，滚动鼠标滚轮，移动画布
          // 滚动，移动画布
          let dx = -event.deltaX;
          let dy = -event.deltaY;

          // 按住shift键，切换水平和垂直切换
          if (event.shiftKey) {
            const temp = dx;
            dx = dy;
            dy = temp;
          }

          Refer.moveViewportBy(dx, dy);
        }
      });
    }
  }, []);

  // 移动画布: 空格键 或 鼠标中间
  useEffect(() => {
    const canvasDom = canvasEl.current;
    if (canvasDom) {
      const ownerDocument = canvasDom.ownerDocument;

      const keydownAction = (e: KeyboardEvent | MouseEvent) => {
        if ((e as KeyboardEvent).key === ' ' || (e as MouseEvent).button === 1) {
          if (ReferRef.current && !ReferRef.current.dragMode) {
            e.preventDefault();
            ReferRef.current.setDragMode(true);
          }
        }
      }

      const keyupAction = (e: KeyboardEvent | MouseEvent) => {
        if ((e as KeyboardEvent).key === ' ' || (e as MouseEvent).button === 1) {
          if (ReferRef.current) {
            ReferRef.current.setDragMode(false);
          }
        }
      }

      ownerDocument.addEventListener('keydown', keydownAction);
      ownerDocument.addEventListener('keyup', keyupAction);

      ownerDocument.addEventListener('mousedown', keydownAction);
      ownerDocument.addEventListener('mouseup', keyupAction);

      return () => {
        ownerDocument.removeEventListener('keydown', keydownAction);
        ownerDocument.removeEventListener('keyup', keyupAction);

        ownerDocument.removeEventListener('mousedown', keydownAction);
        ownerDocument.removeEventListener('mouseup', keyupAction);
      }
    }
  }, []);

  // 键盘：删除选中元素 Delete、Backspace
  useShortcut({
    keys: ['Delete', 'Backspace'],
    callback: (e: KeyboardEvent) => {
      e.preventDefault();
      if (ReferRef.current) {
        ReferRef.current.deleteElement();
      }
    },
    element,
  });

  // 元素自适应窗口展示切换
  const switchFitViewElement = useCallback((element?: FabricObject) => {
    const Refer = ReferRef.current;
    if (Refer) {
      if (!element) {
        element = Refer.getActiveObject();
      }
      const preViewStatus = Refer.preViewStatus;
      if (!preViewStatus) {
        Refer.fitViewElement({ element });
      } else if (preViewStatus.element !== element) {
        Refer.fitViewElement({ element, saveState: false });
      } else {
        Refer.restorePreViewStatus();
      }
    }
  }, []);

  // 双击自适应窗口
  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      if (!(element as any).referIsTextEditing) {
        Refer.addEventListener('mouse:dblclick', (e: TEvent & { target: FabricObject }) => {
          // 不处于文本编辑状态
          if (e.target.isType('i-text') && (e.target as IText).isEditing) {
            return;
          }

          // 自适应窗口
          switchFitViewElement(e.target);
        });
      }
    }
  }, []);

  // 拖拽或粘贴对象（dataTransfer）到画布
  const addFromDataTransfer = useCallback((DataTransferItemList: DataTransferItemList, event?: DragEvent | ClipboardEvent) => {

    const Refer = ReferRef.current;
    const addedElements: (Promise<FabricObject | undefined> | Promise<(FabricObject | undefined)[]>)[] = [];


    if (Refer) {
      // Position to canvas center
      let inVpCenter = true; // 显示在画布中间
      const offsetPoint = Refer.canvas.getVpCenter();

      // Position to event point
      if (event && event instanceof DragEvent) {
        inVpCenter = false;
        const pointer = Refer.canvas.getScenePoint(event as TPointerEvent);
        offsetPoint.setXY(pointer.x, pointer.y);
      }

      const items = DataTransferItemList || [];
      const appendedMap: { [key: string]: boolean } = {}; // Prevent add repeat
      let appendLength = 0;
      const zoom = Refer.getZoom();

      // When has HTML then skip file type
      const hasHtml = [...items].some(item => item.type.match('^text/html'));

      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if ((item.kind === 'string') && (item.type.match('^text/plain'))) {
          // Add Text node
          const newElePromise = new Promise<FabricObject | undefined>((resolve) => {
            item.getAsString((data) => {
              const newEle = Refer.createText({ text: data });
              resolve(newEle);
            })
          });
          addedElements.push(newElePromise);
        } else if ((item.kind === 'string') && (item.type.match('^text/html'))) {
          const htmlPromise = new Promise<Array<FabricObject | undefined>>((resolve) => {
            // Get image from html
            item.getAsString(html => {
              const div = document.createElement('div');
              div.innerHTML = html;
              const imgs = div.querySelectorAll('img');

              const imgsPromise = [...imgs].map(img => {
                if (!appendedMap[img.src]) {
                  let offset = offsetPoint.scalarAdd(appendLength * 20 / zoom);
                  appendedMap[img.src] = true;
                  appendLength += 1;

                  return new Promise<FabricObject | undefined>((resolve) => {
                    const newImg = new Image();
                    newImg.onload = function () {
                      // 图片显示高度为300px
                      const imageHeight = 300;
                      const scale = imageHeight / newImg.height;
                      const imageWidth = newImg.width * scale;

                      const renderWidth = imageWidth / zoom;
                      const renderHeight = imageHeight / zoom;

                      const imageSrc = img.src;
                      const imageOptions = {
                        scaleX: scale / zoom,
                        scaleY: scale / zoom,
                        left: offsetPoint.x - renderWidth / 2,
                        top: offsetPoint.y - renderHeight / 2,
                      };

                      FabricImage.fromURL(imageSrc, {}, imageOptions)
                        .then((imageObject) => {
                          resolve(imageObject);
                        }).catch(() => {
                          resolve(undefined);
                        });
                    };

                    // 图片加载失败
                    newImg.onerror = () => {
                      resolve(undefined);
                    }

                    newImg.src = img.src;
                  });
                }
              });

              resolve(Promise.all(imgsPromise));
            });
          });
          addedElements.push(htmlPromise);
        } else if ((item.kind === 'string') && (item.type.match('^text/uri-list'))) {
          const newElePromise = new Promise<FabricObject | undefined>((resolve) => {
            // url
            item.getAsString(src => {
              if (!appendedMap[src]) {
                appendedMap[src] = true;
                appendLength += 1;

                const newImg = new Image();
                newImg.onload = function () {
                  const imageHeight = 300;
                  const scale = imageHeight / newImg.height;
                  const imageWidth = newImg.width * scale;

                  const renderWidth = imageWidth / zoom;
                  const renderHeight = imageHeight / zoom;

                  const imageOptions = {
                    scaleX: scale / zoom,
                    scaleY: scale / zoom,
                    left: offsetPoint.x - renderWidth / 2,
                    top: offsetPoint.y - renderHeight / 2,
                  };

                  FabricImage.fromURL(src, {}, imageOptions).then((imageObject) => {
                    resolve(imageObject);
                  }).catch(() => {
                    resolve(undefined);
                  });
                };

                // 图片加载失败
                newImg.onerror = () => {
                  resolve(undefined);
                }

                newImg.src = src;
              }
            });
          });
          addedElements.push(newElePromise);
        } else if (!hasHtml && (item.kind === 'file') && (item.type.match('^image/'))) {
          // Drag items item is an image file
          const file = item.getAsFile();
          if (file && /^image\/*/.test(file.type)) {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            const waitForLoad: Promise<FabricObject> = new Promise((resolve) => {
              let offset = offsetPoint;
              reader.addEventListener('load', () => {
                const zoom = Refer.getZoom();

                const img = new Image();
                img.onload = function () {
                  // 图片显示高度为300px
                  const imageHeight = 300;
                  const scale = imageHeight / img.height;
                  const imageWidth = img.width * scale;

                  const renderWidth = imageWidth / zoom;
                  const renderHeight = imageHeight / zoom;

                  const imageSrc = reader.result as string;
                  const imageOptions = {
                    scaleX: scale / zoom,
                    scaleY: scale / zoom,
                    left: offset.x - renderWidth / 2,
                    top: offset.y - renderHeight / 2,
                  };

                  FabricImage.fromURL(imageSrc, {}, imageOptions)
                    .then((imageObject) => {
                      resolve(imageObject);
                    });
                };
                img.src = reader.result as string;
              });
            });

            appendLength += 1;
            addedElements.push(waitForLoad);
          }
        }
      }

      return Promise.all(addedElements).then(elements => {
        if (elements.length === 0) {
          return null;
        }

        // 多维数组，需要扁平化
        const flatElements = elements.flat();

        // 总宽度
        const totalWidth = flatElements.reduce((acc: number, item, index) => {
          return acc + (item?.getScaledWidth() || 0) + (index > 0 ? 20 : 0);
        }, 0);

        // 设置第一个元素的位置
        flatElements[0]!.set('left', offsetPoint.x - totalWidth / 2);

        // 如果元素是图片，则需要设置为 active
        const newElements = flatElements.reduce((acc: FabricObject[], item, index) => {
          if (Array.isArray(item)) {
            const newElements = item.filter(ele => ele);
            Array.prototype.push.apply(acc, newElements);
          } else if (item !== undefined) {
            if (acc.length > 0) {
              const prevEle = acc[acc.length - 1];
              const prevLeft = prevEle.get('left');
              const prevWidth = prevEle.getScaledWidth();
              const newLeft = prevLeft + prevWidth + 20;

              // 重新设置元素的 left 位置
              item.set('left', newLeft);
            }

            acc.push(item);
          }
          return acc;
        }, []);

        return newElements;
      });
    }
  }, []);

  // 页面元素适配可视区域
  const allElementFitView = useCallback(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      const activeEle = Refer.getActiveObject();
      Refer.canvas.discardActiveObject();

      const ele = Refer.selectElement();
      Refer.fitViewElement({ element: ele, saveState: false });
      Refer.canvas.discardActiveObject();

      if (activeEle) {
        const elements = activeEle.isType('activeselection') ? (activeEle as ActiveSelection).getObjects() : activeEle;
        Refer.selectElement(elements);
      }
    }
  }, []);

  // 画布100%展示，以中心区域缩放
  const zoomCenterTo = useCallback((value = 1, relative = false) => {
    const Refer = ReferRef.current;
    if (Refer) {
      const centerPoint = Refer.canvas.getCenter();
      let point = new Point(centerPoint.left, centerPoint.top);
      if (relative) {
        value = Refer.getZoom() * value;
      }
      const zoom = Math.min(100, Math.max(0.01, value));
      Refer.zoomToPoint(point, zoom);
    }
  }, []);

  // 拖拽本地文件到画布
  useEffect(() => {
    const Refer = ReferRef.current;

    if (Refer) {
      const dropAction = (originEvent: DragEvent) => {
        originEvent.preventDefault();

        const transferItemList = originEvent.dataTransfer?.items;
        if (transferItemList) {
          const JSONFile = [...transferItemList].find(item => item.type.match('^application/json'));
          if (JSONFile) { // 加载 refer 文件
            const textStr = JSONFile.getAsFile()?.text();
            textStr?.then(str => {
              try {
                const json = JSON.parse(str);
                return Refer.loadJSON(json).then(() => {
                  Refer.canvas.requestRenderAll();
                })
              } catch {
                // Do nothing;
              }
            })
          }

          // @ts-ignore
          addFromDataTransfer(transferItemList, originEvent).then((elements) => {
            if (elements && elements.length) {
              Refer.addElement(elements);
            }
          });
        }

      }

      const dragoverAction = (event: DragEvent) => {
        event.preventDefault();
      }

      //必须在 dragover 事件中调用 event.preventDefault()，否则 drop 事件不会触发。
      document.addEventListener('dragover', dragoverAction);
      document.body.addEventListener('drop', dropAction);

      return () => {
        document.body.removeEventListener('drop', dropAction);
        document.removeEventListener('dragover', dragoverAction);
      }
    }
  }, []);

  // 复制画布的内容
  useEffect(() => {
    const canvasDom = canvasEl.current;
    if (canvasDom) {
      const copyAction = (event: ClipboardEvent) => {
        if (ReferRef.current) {
          const activeObject = ReferRef.current.getActiveObject();
          if (activeObject) {
            event.preventDefault();
            ReferRef.current.copyElement(activeObject, event);
          }
        }
      };

      const ownerDocument = canvasDom.ownerDocument;
      ownerDocument.addEventListener('copy', copyAction);

      return () => {
        ownerDocument.removeEventListener('copy', copyAction);
      }
    }

  }, []);

  // 剪切
  useEffect(() => {
    const Refer = ReferRef.current;
    const canvasDom = canvasEl.current;

    if (Refer && canvasDom) {
      const cutAction = (event: ClipboardEvent) => {
        const activeObject = Refer.getActiveObject();
        if (activeObject) {
          event.preventDefault();
          Refer.copyElement(activeObject, event);
          Refer.deleteElement(activeObject);
        }
      };

      const ownerDocument = canvasDom.ownerDocument;
      ownerDocument.addEventListener('cut', cutAction);

      return () => {
        ownerDocument.removeEventListener('cut', cutAction);
      }
    }
  }, []);

  // 粘贴内容到画布
  useEffect(() => {
    const Refer = ReferRef.current;
    const canvasDom = canvasEl.current;
    if (Refer && canvasDom) {
      const pasteAction = (event: ClipboardEvent) => {
        event.preventDefault();

        // 粘贴系统剪贴板内容
        if (event?.clipboardData?.items) {
          const text = event.clipboardData?.getData(REFER_CLIPBOARD_TYPE);
          const items = text === REFER_EMPTY ? [] : event.clipboardData.items;

          // @ts-ignore
          addFromDataTransfer(items).then(elements => {
            if (elements && elements.length) {
              Refer.addElement(elements);
            } else {
              // 系统剪贴板没粘贴内容，则粘贴画布剪贴板内容
              Refer.pasteElement();
            }
          });
        }
      };

      const ownerDocument = canvasDom.ownerDocument;
      ownerDocument.addEventListener('paste', pasteAction);

      return () => {
        ownerDocument.removeEventListener('paste', pasteAction);
      }
    }

  }, []);

  // 键盘 Command + A：全选
  useShortcut({
    keys: ['meta+a', 'ctrl+a'],
    callback: (e: KeyboardEvent) => {
      e.preventDefault();
      if (ReferRef.current) {
        ReferRef.current.selectElement();
      }
    },
    element,
  });

  // 键盘 F：元素自适应窗口展示切换  
  useShortcut({
    keys: ['f'],
    callback: (e: KeyboardEvent) => {
      switchFitViewElement();
    },
    element,
  });

  // 键盘 G：下一个元素自适应 
  useShortcut({
    keys: ['g', 'shift+g', 'ArrowLeft', 'ArrowRight'],
    callback: (e: KeyboardEvent) => {
      const Refer = ReferRef.current;
      if (Refer) {
        let currentElement = Refer.preViewStatus?.element || Refer.canvas.getActiveObject();
        if (!currentElement) { return; }

        const allElements = Refer.canvas.getObjects();
        let index = allElements.indexOf(currentElement);
        index += e.key === 'G' || e.key === 'ArrowLeft' ? -1 : 1;
        if (index > allElements.length - 1) { index = 0 }
        if (index < 0) { index = allElements.length }

        const targetEle = allElements[index];
        console.info(index, targetEle);
        switchFitViewElement(targetEle);
      }
    },
    element,
  });

  // 键盘 H：翻转元素
  useShortcut({
    keys: ['h', 'v'],
    callback: (e: KeyboardEvent) => {
      const Refer = ReferRef.current;
      if (Refer) {
        const direction = e.key === 'h' ? 'horizontal' : 'vertical';
        Refer.flipElement(Refer.getActiveObject(), direction);
      }
    },
    element,
  });

  // 键盘 R：旋转元素
  useShortcut({
    keys: ['r', 'shift+r'],
    callback: (e: KeyboardEvent) => {
      const Refer = ReferRef.current;
      if (Refer) {
        const rotation = e.shiftKey ? -90 : 90;
        const currentRotation = Refer.getActiveObject()?.get('angle') || 0;
        const targetRotation = Math.round((currentRotation + rotation) / 90) * 90;
        Refer.rotateElement(Refer.getActiveObject(), targetRotation);
      }
    },
    element,
  });


  // 键盘 0：缩放显示1:1 
  useShortcut({
    keys: ['0'],
    callback: (e: KeyboardEvent) => {
      e.preventDefault();
      zoomCenterTo();
    },
    element,
  });

  // 键盘 1：所有内容自适应到视窗
  useShortcut({
    keys: ['1'],
    callback: (e: KeyboardEvent) => {
      e.preventDefault();
      allElementFitView();
    },
    element,
  });

  // 键盘 -、 + ：缩放画布
  useShortcut({
    keys: ['-', '='],
    callback: (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === '-') {
        zoomCenterTo(2 / 3, true);
      } else if (e.key === '=') {
        zoomCenterTo(3 / 2, true);
      }
    },
    element,
  });

  // 键盘 Ctrl + z、 Ctrl + shift + z ：历史记录操作
  useShortcut({
    keys: ['meta+z', 'meta+shift+z', 'ctrl+z', 'ctrl+shift+z'],
    callback: (e: KeyboardEvent) => {
      e.preventDefault();
      const Refer = ReferRef.current;
      if (Refer) {
        e.shiftKey ? Refer?.redo() : Refer?.undo();
      }
    },
    element,
  });

  // 选中元素直接移到最前面
  useEffect(() => {
    const Ref = ReferRef.current;
    if (Ref) {
      const bringToFront = () => {
        Ref.bringToFront();
      }
      Ref.addEventListener('selection:created', bringToFront);
      Ref.addEventListener('selection:updated', bringToFront);
    }
  }, []);

  // 键盘：Copy Command + shift + C
  useShortcut({
    keys: ['meta+shift+c', 'ctrl+shift+c'],
    callback: async (e: KeyboardEvent) => {
      e.preventDefault();
      if (ReferRef.current) {
        const elements = ReferRef.current.getActiveObject();

        if (elements) {
          let imageDataURL: string | undefined;

          try {
            imageDataURL = elements.toDataURL({ format: 'png' });
          } catch (error) {
            console.warn('复制失败', error);
          }

          if (imageDataURL) {
            const res = await fetch(imageDataURL);
            const blob = await res.blob();
            const data = [new ClipboardItem({ [blob.type]: blob })];

            navigator.clipboard.write(data).then(() => {
              console.info('复制成功');
            });
          }
        }
      }
    },
    element,
  });

  // 导出 refer 文件
  const exportRefer = useCallback(async () => {
    if (ReferRef.current) {
      const jsonData = ReferRef.current.exportJSON();
      saveAs({ dataStr: JSON.stringify(jsonData, null, 4) });
    }
  }, []);

  // 键盘：Save Command + S
  useShortcut({
    keys: ['meta+s', 'ctrl+s'],
    callback: async (e: KeyboardEvent) => {
      e.preventDefault();
      await forceSave();
    },
    element,
  });

  // 导入 refer 文件
  const importRefer = useCallback(async () => {
    if (ReferRef.current) {
      const file = await fileOpen({
        mimeTypes: ['application/json'],
      });
      try {
        const jsonStr = await file.text();
        const jsonData = JSON.parse(jsonStr);
        return ReferRef.current.loadJSON(jsonData);
      } catch {
        // Do nothing
      }
    }
  }, []);

  // 从数据库加载数据
  const loadFromDatabase = useCallback(async () => {
    if (ReferRef.current) {
      try {
        // 获取最新的数据
        const latestReferFile = await db.refers.orderBy('updatedAt').reverse().first();
        if (latestReferFile) {
          const jsonData = JSON.parse(latestReferFile.content);
          await ReferRef.current.loadJSON(jsonData);
          // 记录当前加载的文件ID
          setCurrentReferId(latestReferFile.id);
          console.info('从数据库加载数据成功，文件ID:', latestReferFile.id);
        }
      } catch (error) {
        console.error('从数据库加载数据失败:', error);
      }
    }
  }, []);

  // 共用的保存函数
  const saveReferFile = useCallback(async ({ forceNew = false }: { forceNew?: boolean } = {}) => {
    if (ReferRef.current) {
      const jsonData = ReferRef.current.exportJSON();
      const content = JSON.stringify(jsonData);
      const now = Date.now();

      try {
        if (currentReferId && !forceNew) {
          // 更新现有文件
          await db.refers.update(currentReferId, {
            content,
            updatedAt: now,
          });
          console.info('数据已更新到数据库，文件ID:', currentReferId);
        } else {
          // 创建新文件
          const title = `Refer_${new Date().toLocaleString()}`;
          const newReferFileId = await db.refers.add({
            title,
            content,
            createdAt: now,
            updatedAt: now,
          });
          console.info('数据已保存到数据库，新文件ID:', newReferFileId);
          return newReferFileId;
        }
      } catch (error) {
        console.error('保存到数据库失败:', error);
      }
    }
  }, [currentReferId]);

  // 自动保存功能
  const { save: triggerAutoSave, forceSave } = useAutoSave(
    saveReferFile,
    {
      throttle: 5000, // 5秒节流
      maxRetries: 3,
      retryDelay: 2000,
      onSaveStart: () => {
        setAutoSaveState(prev => ({ ...prev, isSaving: true }));
      },
      onSaveSuccess: () => {
        setAutoSaveState(prev => ({
          ...prev,
          isSaving: false,
          lastSaveTime: Date.now(),
          errorCount: 0,
          pendingChanges: false,
        }));
      },
      onSaveError: (error) => {
        console.error('自动保存失败:', error);
        setAutoSaveState(prev => ({
          ...prev,
          isSaving: false,
          errorCount: prev.errorCount + 1
        }));
      },
      onSaveComplete: () => {
        setAutoSaveState(prev => ({ ...prev, isSaving: false }));
      }
    }
  );

  // 页面卸载时强制保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (autoSaveState.pendingChanges) {
        forceSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [forceSave, autoSaveState.pendingChanges]);

  // 监听画布变化事件
  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      const handleCanvasModified = () => {
        setAutoSaveState(prev => ({ ...prev, pendingChanges: true }));
        triggerAutoSave();
      };

      Refer.addEventListener('object:modified', handleCanvasModified);
      Refer.addEventListener('object:added', handleCanvasModified);
      Refer.addEventListener('object:removed', handleCanvasModified);

      return () => {
        Refer.removeEventListener('object:modified', handleCanvasModified);
        Refer.removeEventListener('object:added', handleCanvasModified);
        Refer.removeEventListener('object:removed', handleCanvasModified);
      };
    }
  }, [triggerAutoSave]);

  // 新建画布
  const newCanvas = useCallback(async () => {
    if (ReferRef.current) {
      try {
        // 清空当前画布
        ReferRef.current.canvas.clear();

        // 重置当前文件ID，表示这是一个新文件
        setCurrentReferId(null);

        // 立即保存数据到数据库，强制创建新文件
        const newReferFileId = await saveReferFile({ forceNew: true });

        if (newReferFileId) {
          setCurrentReferId(newReferFileId);
          console.info('新建画布成功');
        }
      } catch (error) {
        console.error('新建画布失败:', error);
      }
    }
  }, [saveReferFile]);

  // 键盘：Open Command + o
  useShortcut({
    keys: ['meta+o', 'ctrl+o'],
    callback: async (e: KeyboardEvent) => {
      e.preventDefault();
      if (ReferRef.current) {
        loadFromDatabase();
      }
    },
    element,
  });

  // 键盘：New Command + n
  useShortcut({
    keys: ['meta+n', 'ctrl+n'],
    callback: async (e: KeyboardEvent) => {
      e.preventDefault();
      newCanvas();
    },
    element,
  });

  // 画布大小变化
  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      const handleResize = function () {
        if (ReferRef.current && ReferRef.current.canvas) {
          const canvas = ReferRef.current.canvas;
          canvas.setDimensions({
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
          });
          // canvas.requestRenderAll();
          // canvas.calcOffset();
        }
      };

      window.addEventListener('resize', handleResize, { passive: true });

      // 组件卸载时移除事件监听器
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // 画布缩放设置 zoom
  useEffect(() => {
    const canvasDom = canvasEl.current;
    if (canvasDom) {
      const Refer = ReferRef.current;
      if (Refer) {
        const action = (e: any) => {
          const zoom = Refer.getZoom();
          setZoom(zoom);
        };

        Refer.addEventListener('after:render', action);

        return () => {
          Refer.removeEventListener('after:render', action);
        }
      }
    }
  }, []);

  // 切换100%展示和内容自适应窗口
  const zoomToggle = useCallback(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      const zoom = Refer.getZoom();
      if (zoom !== 1) {
        zoomCenterTo();
      } else {
        allElementFitView();
      }
    }
  }, []);

  // 添加文本
  const addText = useCallback(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      const zoom = Refer.getZoom();
      const fontSize = 50 / zoom;

      Refer.addText({ text: 'Hello Refer!' });
    }
  }, []);

  // 键盘：添加文本 T
  useShortcut({
    element,
    keys: ['t'],
    callback: addText,
  });

  // 处理右键菜单项点击
  const handleCopy = useCallback(() => {
    if (ReferRef.current) {
      ReferRef.current.copyElement();
    }
  }, []);

  const handlePaste = useCallback((event?: MouseEvent | ClipboardEvent) => {
    if (ReferRef.current) {
      const point = ReferRef.current.canvas.getScenePoint(event as MouseEvent);
      ReferRef.current.pasteElement(undefined, point);
    }
  }, []);

  const handleDelete = useCallback(() => {
    if (ReferRef.current) {
      ReferRef.current.deleteElement();
    }
  }, []);

  const handleBringToFront = useCallback(() => {
    if (ReferRef.current) {
      const ele = ReferRef.current.getActiveObject();
      ReferRef.current.bringToFront(ele);
    }
  }, []);

  const handleSendToBack = useCallback(() => {
    if (ReferRef.current) {
      const ele = ReferRef.current.getActiveObject();
      ReferRef.current.sendToBack(ele);
    }
  }, []);

  // 定义菜单项
  const getMenuItems: () => MenuList = useCallback(() => {
    const Refer = ReferRef.current;
    const hasActiveObject = Refer?.getActiveObject();

    return [
      {
        label: '复制',
        onClick: handleCopy,
        disabled: !hasActiveObject,
      },
      {
        label: '粘贴',
        onClick: handlePaste,
      },
      {
        label: '删除',
        onClick: handleDelete,
        disabled: !hasActiveObject,
      },
      {
        divider: true,
      },
      {
        label: '置于顶层',
        onClick: handleBringToFront,
        disabled: !hasActiveObject,
      },
      {
        label: '置于底层',
        onClick: handleSendToBack,
        disabled: !hasActiveObject,
      },
    ];
  }, [handleCopy, handlePaste, handleDelete, handleBringToFront, handleSendToBack]);

  // 添加右键菜单事件监听
  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      const canvasElement = Refer.canvas.wrapperEl;

      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();

        setContextMenu({
          event: e,
          visible: true,
          position: { x: e.clientX, y: e.clientY },
        });
      };

      canvasElement.addEventListener('contextmenu', handleContextMenu);

      return () => {
        canvasElement.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, []);

  // 对象拖拽时按住Option/Ctrl键复制的功能
  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      let cloneCreated = false;
      let originalObject: FabricObject | null = null;

      const handleObjectMoving = (e: TEvent & { target: FabricObject }) => {
        // 按住 Option 键 或 Ctrl 键
        const isOptionKeyPressed = e.e.altKey || e.e.metaKey;

        if (isOptionKeyPressed && !cloneCreated && e.target) {
          // 保存原始对象并标记已创建克隆
          originalObject = e.target;
          cloneCreated = true;

          // TODO: 设置鼠标样式
          // Refer.canvas.set({
          //   hoverCursor: 'copy',
          //   movingCursor: 'copy'
          // });

          // 因为复制是异步的，所以需要先获取原始对象的位置
          const originalPosition = {
            left: originalObject.left,
            top: originalObject.top
          };

          // 克隆对象, 复制一份元素，保留在原来的位置上
          originalObject.clone().then((cloned: FabricObject) => {
            let clonedObjects: FabricObject[];

            // 使用原始对象的位置设置克隆对象
            cloned.set(originalPosition);

            // 如果克隆对象多个元素的选中状态
            if (cloned.type === 'activeselection') {
              clonedObjects = (cloned as ActiveSelection).getObjects();
            } else {
              clonedObjects = [cloned];
            }

            // 获取 originalObject 的 index
            const index = Refer.canvas.getObjects().indexOf(originalObject as FabricObject);

            // 添加到画布并选中
            Refer.canvas.insertAt(index, ...clonedObjects);
            Refer.canvas.requestRenderAll();
          });
        }
      };

      const handleObjectModified = () => {
        // 重置标记，为下一次操作做准备
        cloneCreated = false;
        originalObject = null;
      };

      // 添加Fabric事件监听
      Refer.addEventListener('object:moving', handleObjectMoving); // 移动对象
      Refer.addEventListener('object:modified', handleObjectModified); // 移动完成

      return () => {
        Refer.removeEventListener('object:moving', handleObjectMoving);
        Refer.removeEventListener('object:modified', handleObjectModified);
      };
    }
  }, []);

  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      Refer.addEventListener('selection:created', (e: any) => {
        setSelectedElements(e.selected);
      });

      Refer.addEventListener('selection:updated', (e: any) => {
        setSelectedElements(e.selected);
      });

      Refer.addEventListener('selection:cleared', (e: any) => {
        setSelectedElements(undefined);
      });
    }
  }, []);

  return (
    <div>
      <canvas
        width={vw}
        height={vh}
        ref={canvasEl}
      />
      {/* Logo */}
      <div className={styles.logo}>
        <a href='https://huaban.com'>
          <img
            src='https://st0.dancf.com/static/02/202201151128-a455.svg'
            title='花瓣网'
            width={24}
            height={24}
          />
        </a>
        <span className={styles.siteName}>花瓣参考</span>
      </div>

      {/* zoom */}
      <div className={styles.zoom} onClick={zoomToggle}>
        {`${Math.floor(zoom * 100)}%`}
      </div>

      {/* 自动保存状态指示器 */}
      <div className={styles.autoSaveStatus}>
        <AutoSaveIndicator {...autoSaveState} />
      </div>

      {/* 工具栏 */}
      <Toolbar
        importRefer={importRefer}
        exportRefer={exportRefer}
        loadFromDatabase={loadFromDatabase}
        newCanvas={newCanvas}
      />

      {/* 右侧栏 */}
      <Drawer
        isOpen={selectedElements !== undefined || isPropertyLocked}
        position='right'
      >
        <Property
          elements={selectedElements}
          isLocked={isPropertyLocked}
          onLockChange={setIsPropertyLocked}
        />
      </Drawer>

      {/* 添加右键菜单 */}
      <ContextMenu
        items={getMenuItems()}
        visible={contextMenu.visible}
        position={contextMenu.position}
        event={contextMenu.event}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
      />
    </div>
  )
};

export default ReferCanvas;