import { useEffect } from 'react';
import ReferCreator from '../ReferCreator';

export const useCanvasInitialization = (
  ReferRef: React.MutableRefObject<ReferCreator | undefined>,
  canvasEl: React.RefObject<HTMLCanvasElement>,
) => {
  const element = document;

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

    return () => {
      Refer.dispose();
    }
  }, []);
};
