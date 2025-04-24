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
  const [imageSrcs, setImageSrcs] = useState<string[]>([]);

  useEffect(() => {
    if (elements?.length) {
      const imageSrcs = elements.map((element) => {
        if (element.type === 'image') {
          return (element as FabricImage).getSrc();
        }
        return '';
      });
      setImageSrcs(imageSrcs);
    }
  }, [elements]);

  return (
    <div className={styles.container}>
      <div className={styles.imageContainer}>
        {imageSrcs.map((imageSrc) => (
          <div className={styles.image}>
            <img src={imageSrc} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(Drawer); 