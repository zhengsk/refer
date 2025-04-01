/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-04-01 13:48:17
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-04-01 14:27:54
 * @FilePath: \refer\src\components\Tools\fullscreen\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 全屏工具
import React from 'react';
import Icon from '../../Icons';
import Tooltip from '../../Tooltip';

const FullscreenTool = () => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Tooltip content={isFullscreen ? '退出全屏' : '全屏'} position="bottom">
      <Icon
        name={isFullscreen ? 'fullscreen-exit-line' : 'fullscreen-line'}
        onClick={toggleFullscreen}
      />
    </Tooltip>
  );
};

export default FullscreenTool;
