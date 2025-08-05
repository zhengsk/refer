import React from 'react';
import Icon from '../../icons';
import Tooltip from '../../Tooltip';

const NewTool: React.FC<{ callback: () => void }> = ({ callback }) => {
  const handleNew = () => {
    callback();
  };

  return (
    <Tooltip content="新建画布" position="bottom">
      <Icon
        name="new-refer"
        onClick={handleNew}
      />
    </Tooltip>
  );
};

export default NewTool; 
