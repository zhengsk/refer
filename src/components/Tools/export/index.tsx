/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-04-01 14:20:36
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-04-01 14:24:31
 * @FilePath: \refer\src\components\Tools\export\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from 'react';
import Icon from '../../Icons';
import Tooltip from '../../Tooltip';
import styles from './index.module.less';

const ExportTool: React.FC = () => {
  const handleExport = () => {
    // TODO: 实现导出功能
    console.log('导出功能待实现');
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
