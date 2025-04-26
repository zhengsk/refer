import React, { useState, useEffect, useMemo } from 'react';
import styles from './index.module.less';
import { FabricObject } from 'fabric';
import { FabricImage } from 'fabric/fabric-impl';

export interface PropertyProps {
  elements: FabricObject[] | undefined;
}

// 获取图片格式
const getImageFormat = (src: string) => {
  // base64 图片格式
  if (src.startsWith('data:image/')) {
    return src.split(';')[0].split('/')[1];
  }

  return src.split('.').pop();
};

const Drawer: React.FC<PropertyProps> = ({
  elements,
}) => {
  const [imageElements, setImageElements] = useState<FabricImage[]>([]);

  useEffect(() => {
    if (elements?.length) {
      const imageElements = elements.filter((element) => {
        return element.type === 'image';
      });
      setImageElements(imageElements as FabricImage[]);
    }
  }, [elements]);

  return (
    <div className={styles.container}>
      {/* 显示图片 */}
      <div className={styles.imageContainer}>
        {imageElements.map((element) => (
          <div className={styles.image}>
            <img src={element.getSrc()} />
          </div>
        ))}

      </div>

      {/* 显示图片尺寸 */}
      {imageElements.length === 1 && (
        <div className={styles.empty}>
          <div>
            {/* 显示图片尺寸 */}
            <div>尺寸：{imageElements[0].width}px x {imageElements[0].height}px</div>

            {/* 显示图片颜色 */}
            <div>下载图片：<a href={imageElements[0].getSrc()} download>下载</a></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Drawer); 