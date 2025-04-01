/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-04-01 14:20:36
 * @LastEditors: zsk zsk526@qq.com
 * @LastEditTime: 2025-04-01 15:58:58
 * @FilePath: \refer\src\components\Tools\export\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from 'react';
import Icon from '../../Icons';
import Tooltip from '../../Tooltip';
import { saveAs } from '../../../utils/fileAccess';

interface ExportToolProps {
  onExport?: () => any;
}

const ExportTool: React.FC<ExportToolProps> = ({ onExport }) => {
  const handleExport = () => {
    try {
      const jsonData = onExport?.();
      if (jsonData) {
        saveAs({ dataStr: JSON.stringify(jsonData, null, 4) });
      }
    } catch (error) {
      console.error('导出文件失败:', error);
    }
  };
  return (
    <Tooltip content="导出" position="bottom">
      <Icon
        name="download-2-fill"
        onClick={handleExport}
      />
    </Tooltip>
  );
};

export default ExportTool; 
