import { Canvas } from 'fabric';


// 扩展类型声明
declare module 'fabric' {
  interface CanvasEvents {
    'history:append': { json: string };
    'history:undo': { json: string };
    'history:redo': { json: string };
    'history:clear': {};
  }
}

// 创建扩展的 Canvas 类
export default class ReferCanvas extends Canvas {
  historyUndo: string[] = [];
  historyRedo: string[] = [];
  extraProps: string[] = ['selectable', 'editable'];
  historyNextState: string = '';
  historyProcessing: boolean = false;
  historyMaxSize: number = 30; // 历史记录最大条数

  constructor(el: string | HTMLCanvasElement, options?: any) {
    super(el, options);
    this._historyInit();
  }

  // 初始化历史功能
  _historyInit(): void {
    this.historyUndo = [];
    this.historyRedo = [];
    this.extraProps = ['selectable', 'editable'];
    this.historyNextState = this._historyNext();

    this.on(this._historyEvents());
  }

  // 清理历史相关资源
  override dispose(): Promise<boolean> {
    this._historyDispose();
    return super.dispose();
  }

  // 移除事件监听
  _historyDispose(): void {
    this.off(this._historyEvents());
  }

  // 返回当前画布状态的字符串
  _historyNext(): string {
    return JSON.stringify(this.toDatalessJSON(this.extraProps));
  }

  // 返回需要监听的事件映射
  _historyEvents(): Record<string, Function> {
    return {
      'object:added': (event: any) => { this._historySaveAction.bind(this)('object:added', event) },
      'object:removed': (event: any) => { this._historySaveAction.bind(this)('object:removed', event) },
      'object:modified': (event: any) => { this._historySaveAction.bind(this)('object:modified', event) },
      'object:rotated': (event: any) => { this._historySaveAction.bind(this)('object:rotated', event) },
      // 'object:skewing': (event: any) => { this._historySaveAction.bind(this)('object:skewing', event) },
      // 'object:scaled': (event: any) => { this._historySaveAction.bind(this)('object:scaled', event) },
    }
  }

  // 保存当前状态到历史栈
  _historySaveAction(event: string, eventData: any): void {
    console.log('event', event, eventData);
    if (this.historyProcessing) {
      return;
    }

    const nextState = this.historyNextState;

    // 检查是否与上一个状态相同，避免重复记录
    if (this.historyUndo.length > 0 && this.historyUndo[this.historyUndo.length - 1] === nextState) {
      this.historyNextState = this._historyNext();
      return;
    }

    this.historyUndo.push(nextState);

    // 限制历史栈大小
    if (this.historyUndo.length > this.historyMaxSize) {
      this.historyUndo.shift();
    }

    // 新增状态后清空重做栈
    this.historyRedo = [];

    this.historyNextState = this._historyNext();
    this.fire('history:append', { json: this.historyNextState });
  }

  // 手动添加历史记录
  createNewHistory(): void {
    this._historySaveAction('history:create:manual', {});
  }

  // 加载历史状态
  _loadHistory(history: string, event: 'history:undo' | 'history:redo', callback?: () => void): void {
    try {
      this.historyProcessing = true;
      this.loadFromJSON(history, () => {
        this.requestRenderAll();
        this.fire(event, { json: history });

        // 确保历史状态正确同步
        this.historyNextState = this._historyNext();
      }).finally(() => {
        this.historyProcessing = false;
        if (callback && typeof callback === 'function') {
          callback();
        }
      })
    } catch (error) {
      console.error('加载历史记录失败:', error);
      this.historyProcessing = false;
      if (callback && typeof callback === 'function') {
        callback();
      }
    }
  }

  // 撤销到上一状态
  undo(callback?: () => void): void {
    if (!this.canUndo()) {
      if (callback) callback();
      return;
    }

    // 如果历史处理中，不进行操作
    if (this.historyProcessing) {
      if (callback) callback();
      return;
    }

    const current = this._historyNext();
    const history = this.historyUndo.pop();

    if (history) {
      // 保存当前状态到重做栈
      this.historyRedo.push(current);

      // 限制重做栈大小
      if (this.historyRedo.length > this.historyMaxSize) {
        this.historyRedo.shift();
      }

      this._loadHistory(history, 'history:undo', callback);
    } else {
      if (callback) callback();
    }
  }

  // 重做操作
  redo(callback?: () => void): void {
    if (!this.canRedo()) {
      if (callback) callback();
      return;
    }

    // 如果历史处理中，不进行操作
    if (this.historyProcessing) {
      if (callback) callback();
      return;
    }

    const current = this._historyNext();
    const history = this.historyRedo.pop();

    if (history) {
      // 保存当前状态到撤销栈
      this.historyUndo.push(current);

      // 限制撤销栈大小
      if (this.historyUndo.length > this.historyMaxSize) {
        this.historyUndo.shift();
      }

      this._loadHistory(history, 'history:redo', callback);
    } else {
      if (callback) callback();
    }
  }

  // 是否可以撤销
  canUndo(): boolean {
    return this.historyUndo.length > 0;
  }

  // 是否可以重做
  canRedo(): boolean {
    return this.historyRedo.length > 0;
  }

  // 清除历史记录
  clearHistory(): void {
    this.historyUndo = [];
    this.historyRedo = [];
    this.fire('history:clear', {});
  }

  // 开启历史记录
  onHistory(): void {
    this.historyProcessing = false;
    // 开启时保存当前状态
    this._historySaveAction('onHistory', {});
  }

  // 关闭历史记录
  offHistory(): void {
    this.historyProcessing = true;
  }

  // 设置历史记录最大数量
  setHistoryMaxSize(size: number): void {
    if (size > 0) {
      this.historyMaxSize = size;

      // 调整当前历史栈大小
      while (this.historyUndo.length > this.historyMaxSize) {
        this.historyUndo.shift();
      }

      while (this.historyRedo.length > this.historyMaxSize) {
        this.historyRedo.shift();
      }
    }
  }
}
