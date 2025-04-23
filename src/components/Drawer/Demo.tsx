import React, { useState } from 'react';
import Drawer from './index';

const DrawerDemo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const handleLockChange = (locked: boolean) => {
    setIsLocked(locked);
  };

  return (
    <div style={{
      height: '100vh',
      position: 'relative',
      backgroundColor: '#1e1e1e',
      color: '#e8e8e8'
    }}>
      <button
        onClick={toggleDrawer}
        style={{
          margin: '20px',
          padding: '8px 16px',
          backgroundColor: '#404040',
          color: '#e8e8e8',
          border: '1px solid #505050',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {isOpen ? '关闭侧边栏' : '打开侧边栏'}
      </button>

      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        locked={isLocked}
        onLockChange={handleLockChange}
        width={280}
      >
        <div>
          <h3 style={{ color: '#e8e8e8', marginTop: 0 }}>侧边栏内容</h3>
          <p>这里是侧边栏的内容区域。您可以根据需要添加任何组件或内容。</p>
          <div style={{
            borderTop: '1px solid #404040',
            borderBottom: '1px solid #404040',
            margin: '12px 0',
            padding: '8px 0'
          }}>
            <div style={{ padding: '8px 0', cursor: 'pointer' }}>菜单项 1</div>
            <div style={{ padding: '8px 0', cursor: 'pointer' }}>菜单项 2</div>
            <div style={{ padding: '8px 0', cursor: 'pointer' }}>菜单项 3</div>
            <div style={{ padding: '8px 0', cursor: 'pointer' }}>菜单项 4</div>
            <div style={{ padding: '8px 0', cursor: 'pointer' }}>菜单项 5</div>
          </div>
        </div>
      </Drawer>

      <div style={{ padding: '20px' }}>
        <h2>主要内容区域</h2>
        <p>当前侧边栏状态：{isOpen ? '打开' : '关闭'}</p>
        <p>侧边栏锁定状态：{isLocked ? '已锁定' : '未锁定'}</p>
        <p>这里是应用的主要内容区域。</p>
      </div>
    </div>
  );
};

export default DrawerDemo; 