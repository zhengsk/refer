import React from 'react';
import Icon from '../../Icons';
import Tooltip from '../../Tooltip';

const ImportTool: React.FC<{ callback: () => void }> = ({ callback }) => {
  const handleImport = () => {
    callback();
  };

  return (
    <Tooltip content="导入" position="bottom">
      <Icon
        name="upload-2-fill"
        onClick={handleImport}
      />
    </Tooltip>
  );
};

export default ImportTool; 
