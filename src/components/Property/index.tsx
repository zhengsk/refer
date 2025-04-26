import React, { useState, useEffect, useMemo } from 'react';
import styles from './index.module.less';
import { FabricObject } from 'fabric';
import { FabricImage } from 'fabric/fabric-impl';

export interface PropertyProps {
  elements: FabricObject[] | undefined;
}

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
          {/* 显示图片尺寸 */}
          <div className={styles.size}>
            <div>宽：{imageElements[0].width} px</div>
            <div>高：{imageElements[0].height} px</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Drawer); 