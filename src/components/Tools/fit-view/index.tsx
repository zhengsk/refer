import React from 'react';
import Icon from '../../icons';

interface FitViewToolProps {
  callback?: () => void;
}

const FitViewTool: React.FC<FitViewToolProps> = ({ callback }) => {
  const handleClick = () => {
    callback?.();
  };

  return (
    <div
      className="tool-item"
      onClick={handleClick}
      title="适应所有元素"
    >
      <Icon name="fullscreen-line" />
    </div>
  );
};

export default FitViewTool;
