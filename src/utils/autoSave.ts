import { throttle } from 'lodash';
import { useCallback, useEffect, useRef } from 'react';

/**
 * 自动保存工具函数
 * 提供节流、状态管理等功能
 */

export interface AutoSaveOptions {
  throttle?: number; // 节流间隔时间（毫秒）
  maxRetries?: number; // 最大重试次数
  retryDelay?: number; // 重试延迟时间（毫秒）
  onSaveStart?: () => void; // 开始保存回调
  onSaveSuccess?: (fileId: string) => void; // 保存成功回调
  onSaveError?: (error: Error) => void; // 保存失败回调
  onSaveComplete?: () => void; // 保存完成回调
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSaveTime: number | null;
  errorCount: number;
  pendingChanges: boolean;
}

export class AutoSaveManager {
  private options: Required<AutoSaveOptions>;
  private state: AutoSaveState;
  private throttledSave: ReturnType<typeof throttle>;
  private saveFunction: () => Promise<string>;

  constructor(
    saveFunction: () => Promise<string>,
    options: AutoSaveOptions = {}
  ) {
    this.saveFunction = saveFunction;
    this.options = {
      throttle: 5000, // 默认5秒节流
      maxRetries: 3,
      retryDelay: 1000,
      onSaveStart: () => { },
      onSaveSuccess: () => { },
      onSaveError: () => { },
      onSaveComplete: () => { },
      ...options
    };

    this.state = {
      isSaving: false,
      lastSaveTime: null,
      errorCount: 0,
      pendingChanges: false
    };

    // 使用 lodash 的节流方法
    this.throttledSave = throttle(() => {
      this.performSave();
    }, this.options.throttle, {
      leading: false,
      trailing: true   // 最后一次调用也会执行
    });
  }

  /**
   * 触发自动保存
   */
  public save(): void {
    this.state.pendingChanges = true;
    this.throttledSave();
  }

  /**
   * 强制保存（跳过所有限制）
   */
  public async forceSave(): Promise<void> {
    this.throttledSave.cancel();
    await this.performSave();
  }

  /**
   * 执行保存操作
   */
  private async performSave(): Promise<void> {
    // 如果正在保存，跳过
    if (this.state.isSaving) {
      return;
    }

    this.state.isSaving = true;
    this.state.pendingChanges = false;
    this.options.onSaveStart();

    try {
      const fileId = await this.saveFunction();

      this.state.lastSaveTime = Date.now();
      this.state.errorCount = 0;
      this.options.onSaveSuccess(fileId);
    } catch (error) {
      this.state.errorCount++;

      if (this.state.errorCount <= this.options.maxRetries) {
        // 重试
        setTimeout(() => {
          this.performSave();
        }, this.options.retryDelay);
      } else {
        this.options.onSaveError(error as Error);
      }
    } finally {
      this.state.isSaving = false;
      this.options.onSaveComplete();
    }
  }

  /**
   * 获取当前状态
   */
  public getState(): AutoSaveState {
    return { ...this.state };
  }

  /**
   * 重置状态
   */
  public reset(): void {
    this.state = {
      isSaving: false,
      lastSaveTime: null,
      errorCount: 0,
      pendingChanges: false
    };

    // 取消节流函数
    this.throttledSave.cancel();
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.reset();
  }
}

/**
 * React Hook for AutoSave
 */
export function useAutoSave(
  saveFunction: (...args: any[]) => Promise<string>,
  options: AutoSaveOptions = {}
) {
  const autoSaveRef = useRef<AutoSaveManager | null>(null);
  const saveFunctionRef = useRef(saveFunction);
  const optionsRef = useRef(options);

  // 更新最新的函数和选项
  saveFunctionRef.current = saveFunction;
  optionsRef.current = options;

  useEffect(() => {
    // 只在组件挂载时创建一次实例
    autoSaveRef.current = new AutoSaveManager(
      (...args: any[]) => saveFunctionRef.current(...args),
      optionsRef.current
    );

    return () => {
      if (autoSaveRef.current) {
        autoSaveRef.current.destroy();
      }
    };
  }, []);

  const save = useCallback(() => {
    autoSaveRef.current?.save();
  }, []);

  const forceSave = useCallback(async () => {
    await autoSaveRef.current?.forceSave();
  }, []);

  const getState = useCallback(() => {
    return autoSaveRef.current?.getState() || {
      isSaving: false,
      lastSaveTime: null,
      errorCount: 0,
      pendingChanges: false
    };
  }, []);

  return {
    save,
    forceSave,
    getState
  };
} 
