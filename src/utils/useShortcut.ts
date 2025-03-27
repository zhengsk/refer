import { useCallback, useEffect } from "react";
import isMatchKeys from "./isMatchKeys";

/**
 * 快捷键
 * @param keys 快捷键数组，支持 ['meta+t', 't'] 这样的格式
 * @param keyAction 事件类型
 * @param callback 回调函数
 * @param element 元素
 * @returns 
 */
export function useShortcut({
  keys,
  keyAction = 'keydown',
  callback,
  element = document,
}: {
  keys: string[];
  keyAction?: 'keydown' | 'keyup' | 'keypress';
  callback: (e: KeyboardEvent) => void;
  element: HTMLElement | Document | undefined;
}) {
  // 将组合键字符串转换为键数组
  const parseKeyString = (keyStr: string): string[] => {
    return keyStr.toLowerCase().split('+').map(k => k.trim());
  };

  const action = useCallback((e: KeyboardEvent) => {
    // 检查是否有任意一组快捷键匹配
    const isAnyKeyCombinationMatched = keys.some(keyStr => {
      const keyArray = parseKeyString(keyStr);
      return isMatchKeys({ keys: keyArray, event: e });
    });

    if (isAnyKeyCombinationMatched) {
      callback(e);
    }
  }, [keys, callback]) as EventListener;

  useEffect(() => {
    if (element) {
      element.addEventListener(keyAction, action);
    }

    return () => {
      if (element) {
        element.removeEventListener(keyAction, action);
      }
    }
  }, [keys, callback, element]);

  // 解除快捷键
  const dispose = useCallback(() => {
    if (element) {
      element.removeEventListener(keyAction, action);
    }
  }, [element, action]);

  return { dispose };
}
