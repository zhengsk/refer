import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReferCanvas from '../../Refer';
import styles from './index.module.less';

const CanvasPage: React.FC = () => {
  const { fileId } = useParams<{ fileId?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // 如果没有 fileId 参数且不是 'new'，重定向到新建画布
    if (!fileId) {
      navigate('/canvas/new', { replace: true });
    }
  }, [fileId, navigate]);

  // 渲染全屏的画布组件
  return (
    <div className={styles.canvasPage}>
      <ReferCanvas />
    </div>
  );
};

export default CanvasPage;
