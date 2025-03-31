// 全屏工具
import React from 'react';
import Icon from '../icons';

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
    <Icon
      name={isFullscreen ? 'fullscreen-exit-line' : 'fullscreen-line'}
      onClick={toggleFullscreen}
    />
  );
};

export default FullscreenTool;
