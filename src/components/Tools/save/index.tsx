import React from 'react';
import Icon from '../../icons';
import Tooltip from '../../Tooltip';
import styles from './index.module.less';

const SaveTool: React.FC<{ callback: () => void }> = ({ callback }) => {
  const handleSave = () => {
    callback();
  };

  return (
    <Tooltip content="保存" position="bottom">
      <Icon
        name="save"
        onClick={handleSave}
      />
    </Tooltip>
  );
};

export default SaveTool; 
