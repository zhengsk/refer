import React from 'react';
import Icon from '../../icons';
import Tooltip from '../../Tooltip';

const LoadTool: React.FC<{ callback: () => void }> = ({ callback }) => {
  const handleLoad = () => {
    callback();
  };

  return (
    <Tooltip content="从数据库加载" position="bottom">
      <Icon
        name="download-2-fill"
        onClick={handleLoad}
      />
    </Tooltip>
  );
};

export default LoadTool; 
