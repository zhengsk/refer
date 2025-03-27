/**
 * 判断是否匹配快捷键
 * @param keys 快捷键
 * @param e 键盘事件
 * @returns 是否匹配
 */
export default function isMatchKeys({
  keys,
  event,
}: {
  keys: string[];
  event: KeyboardEvent;
}) {
  // 将传入的keys转换为小写，便于比较
  const targetKeys = keys.map(k => k.toLowerCase());

  // 获取当前按下的键
  const pressedKey = event.key.toLowerCase();

  // 检查修饰键的状态
  const modifiers = {
    'ctrl': event.ctrlKey,
    'shift': event.shiftKey,
    'alt': event.altKey,
    'meta': event.metaKey
  };

  // 计算目标快捷键中的修饰键数量
  const targetModifierCount = targetKeys.filter(key =>
    ['ctrl', 'control', 'shift', 'alt', 'meta', 'command'].includes(key)
  ).length;

  // 计算当前按下的修饰键数量
  const pressedModifierCount = Object.values(modifiers).filter(Boolean).length;

  // 如果按下的修饰键数量与目标不一致，直接返回
  if (pressedModifierCount !== targetModifierCount) {
    return;
  }

  // 检查所有指定的键是否都被按下
  const allKeysPressed = targetKeys.every(key => {
    // 检查修饰键
    if (key === 'ctrl' || key === 'control') return modifiers.ctrl;
    if (key === 'shift') return modifiers.shift;
    if (key === 'alt') return modifiers.alt;
    if (key === 'meta' || key === 'command') return modifiers.meta;

    // 检查普通键
    return key === pressedKey;
  });

  return allKeysPressed;
}