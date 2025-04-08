import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

interface RulerProps {
  canvas: fabric.Canvas;
  width: number;
  height: number;
  unit?: number; // 标尺单位，默认为 1
  fontSize?: number; // 字体大小，默认为 10
  color?: string; // 标尺颜色，默认为 #999
}

const Ruler: React.FC<RulerProps> = ({
  canvas,
  width,
  height,
  unit = 1,
  fontSize = 10,
  color = '#999'
}) => {
  const horizontalRulerRef = useRef<HTMLCanvasElement>(null);
  const verticalRulerRef = useRef<HTMLCanvasElement>(null);

  const drawRuler = () => {
    if (!horizontalRulerRef.current || !verticalRulerRef.current) return;

    const horizontalCtx = horizontalRulerRef.current.getContext('2d');
    const verticalCtx = verticalRulerRef.current.getContext('2d');

    if (!horizontalCtx || !verticalCtx) return;

    // 清空画布
    horizontalCtx.clearRect(0, 0, width, 20);
    verticalCtx.clearRect(0, 0, 20, height);

    // 设置样式
    horizontalCtx.fillStyle = color;
    verticalCtx.fillStyle = color;
    horizontalCtx.font = `${fontSize}px Arial`;
    verticalCtx.font = `${fontSize}px Arial`;

    // 获取画布的缩放和偏移
    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform;
    const offsetX = vpt[4];
    const offsetY = vpt[5];

    // 绘制水平标尺
    const startX = Math.floor(offsetX / (unit * zoom));
    const endX = Math.ceil((offsetX + width) / (unit * zoom));
    const stepX = Math.max(1, Math.floor(50 / (unit * zoom)));

    for (let x = startX; x <= endX; x += stepX) {
      const screenX = x * unit * zoom - offsetX;
      const value = x * unit;

      // 绘制刻度线
      horizontalCtx.beginPath();
      horizontalCtx.moveTo(screenX, 0);
      horizontalCtx.lineTo(screenX, 20);
      horizontalCtx.strokeStyle = color;
      horizontalCtx.stroke();

      // 绘制刻度值
      horizontalCtx.fillText(value.toString(), screenX + 2, 15);
    }

    // 绘制垂直标尺
    const startY = Math.floor(offsetY / (unit * zoom));
    const endY = Math.ceil((offsetY + height) / (unit * zoom));
    const stepY = Math.max(1, Math.floor(50 / (unit * zoom)));

    for (let y = startY; y <= endY; y += stepY) {
      const screenY = y * unit * zoom - offsetY;
      const value = y * unit;

      // 绘制刻度线
      verticalCtx.beginPath();
      verticalCtx.moveTo(0, screenY);
      verticalCtx.lineTo(20, screenY);
      verticalCtx.strokeStyle = color;
      verticalCtx.stroke();

      // 绘制刻度值
      verticalCtx.save();
      verticalCtx.translate(5, screenY + 2);
      verticalCtx.rotate(-Math.PI / 2);
      verticalCtx.fillText(value.toString(), 0, 0);
      verticalCtx.restore();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      drawRuler();
    };

    const handleZoom = () => {
      drawRuler();
    };

    canvas.on('mouse:wheel', handleScroll);
    canvas.on('mouse:down', handleScroll);
    canvas.on('mouse:move', handleScroll);
    canvas.on('mouse:up', handleScroll);
    canvas.on('object:moving', handleScroll);
    canvas.on('object:scaling', handleScroll);
    canvas.on('object:rotating', handleScroll);
    canvas.on('object:modified', handleScroll);
    canvas.on('viewport:scaled', handleZoom);

    drawRuler();

    return () => {
      canvas.off('mouse:wheel', handleScroll);
      canvas.off('mouse:down', handleScroll);
      canvas.off('mouse:move', handleScroll);
      canvas.off('mouse:up', handleScroll);
      canvas.off('object:moving', handleScroll);
      canvas.off('object:scaling', handleScroll);
      canvas.off('object:rotating', handleScroll);
      canvas.off('object:modified', handleScroll);
      canvas.off('viewport:scaled', handleZoom);
    };
  }, [canvas, width, height, unit, fontSize, color]);

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        width={width - 20}
        height={20}
        ref={horizontalRulerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: width,
          height: 20,
          borderBottom: '1px solid #ddd',
          zIndex: 1000
        }}
      />
      <canvas
        ref={verticalRulerRef}
        width={20}
        height={height}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 20,
          height: height,
          borderRight: '1px solid #ddd',
          zIndex: 1000
        }}
      />
    </div>
  );
};

export default Ruler; 
