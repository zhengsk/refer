import React from 'react';
import { fileOpen } from '../../../utils/fileAccess';
import Icon from '../../Icons';
import Tooltip from '../../Tooltip';

interface ImportToolProps {
  onImport: (jsonData: any) => void;
}

const ImportTool: React.FC<ImportToolProps> = ({ onImport }) => {
  const handleImport = async () => {
    try {
      const file = await fileOpen({
        mimeTypes: ['application/json'],
      });
      const jsonStr = await file.text();
      const jsonData = JSON.parse(jsonStr);
      onImport(jsonData);
    } catch (error) {
      console.error('导入文件失败:', error);
    }
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
