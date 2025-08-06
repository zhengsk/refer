import React from 'react';
import Icon from '../../icons';
import Tooltip from '../../Tooltip';

const RecentTool: React.FC<{ callback: () => void }> = ({ callback }) => {
  const handleRecent = () => {
    callback();
  };

  return (
    <Tooltip content="最近文件" position="bottom">
      <Icon
        name="open-refer"
        onClick={handleRecent}
      />
    </Tooltip>
  );
};

export default RecentTool; 
