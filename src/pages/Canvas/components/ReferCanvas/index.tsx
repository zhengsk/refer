import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReferCreator from '../../../../ReferCreator';
import styles from './index.module.less';
import Toolbar from '../../../../components/toolbar';
import ContextMenu from '../../../../components/context-menu';
import Drawer from '../../../../components/Drawer';
import Property from '../../../../components/Property';
import AutoSaveIndicator from '../../../../components/AutoSaveIndicator';
import RecentFiles from '../../../../components/RecentFiles';

// 导入自定义 Hook
import { useCanvasInitialization } from '../../../../hooks/useCanvasInitialization';
import { useCanvasInteractions } from '../../../../hooks/useCanvasInteractions';
import { useFileOperations } from '../../../../hooks/useFileOperations';
import { useKeyboardShortcuts } from '../../../../hooks/useKeyboardShortcuts';
import { useDragAndDrop } from '../../../../hooks/useDragAndDrop';
import { useClipboard } from '../../../../hooks/useClipboard';
import { useCanvasView } from '../../../../hooks/useCanvasView';
import { useElementSelection } from '../../../../hooks/useElementSelection';
import { useContextMenu } from '../../../../hooks/useContextMenu';
import { useAutoSave } from '../../../../utils/autoSave';
import { useAddFromDataTransfer } from '../../../../hooks/useAddFromDataTransfer';
import db from '../../../../db';

const vw = document.documentElement.clientWidth;
const vh = document.documentElement.clientHeight;

const ReferCanvas = () => {
  const navigate = useNavigate();
  const { fileId } = useParams<{ fileId?: string }>();
  const ReferRef = useRef<ReferCreator>();
  const canvasEl = useRef<HTMLCanvasElement | null>(null);
  const [recentFilesVisible, setRecentFilesVisible] = useState(false);
  const element = document;

  // 使用画布初始化 Hook
  useCanvasInitialization(ReferRef, canvasEl);

  // 使用文件操作 Hook
  const {
    currentFileId,
    currentFileIdRef,
    loadFromDatabase,
    loadFile,
    renameFile,
    deleteFile,
    saveReferFile,
    exportRefer,
    importRefer,
    createNewCanvas,
  } = useFileOperations(ReferRef);

  // 处理文件 ID 参数和加载数据库
  useEffect(() => {
    if (fileId && fileId !== 'new') {
      // 如果有特定的文件 ID，先获取文件对象再加载
      db.refer.get(fileId).then((file) => {
        if (file && file.fileId) {
          loadFile(file as any).then(() => {
            requestAnimationFrame(() => {
              ReferRef.current?.fitViewRect();
            });
          });
        }
      });
    } else {
      // 否则加载最近的文件或创建新文件
      if (fileId === 'new') {
        createNewCanvas();
      } else {
        loadFromDatabase().then(() => {
          requestAnimationFrame(() => {
            ReferRef.current?.fitViewRect();
          });
        });
      }
    }
  }, [fileId, loadFromDatabase, loadFile, createNewCanvas]);

  // 使用画布视图 Hook
  const {
    zoom,
    switchFitViewElement,
    allElementFitView,
    zoomCenterTo,
    zoomToggle,
  } = useCanvasView(ReferRef, canvasEl);

  // 使用元素选择 Hook
  const {
    selectedElements,
    isPropertyLocked,
    setIsPropertyLocked,
    addText,
  } = useElementSelection(ReferRef);

  // 使用右键菜单 Hook
  const {
    contextMenu,
    setContextMenu,
    getMenuItems,
  } = useContextMenu(ReferRef);

  // 自动保存状态
  const [autoSaveState, setAutoSaveState] = useState({
    isSaving: false,
    lastSaveTime: null as number | null,
    errorCount: 0,
    pendingChanges: false
  });

  // 自动保存功能
  const { save: triggerAutoSave, forceSave } = useAutoSave(
    saveReferFile,
    {
      throttle: 5000, // 5秒节流
      maxRetries: 3,
      retryDelay: 2000,
      onSaveStart: () => {
        setAutoSaveState(prev => ({ ...prev, isSaving: true }));
      },
      onSaveSuccess: (fileId: string) => {
        console.info('onSaveSuccess', fileId);
        setAutoSaveState(prev => ({
          ...prev,
          isSaving: false,
          lastSaveTime: Date.now(),
          errorCount: 0,
          pendingChanges: false,
        }));
      },
      onSaveError: (error: Error) => {
        console.error('自动保存失败:', error);
        setAutoSaveState(prev => ({
          ...prev,
          isSaving: false,
          errorCount: prev.errorCount + 1
        }));
      },
      onSaveComplete: () => {
        setAutoSaveState(prev => ({ ...prev, isSaving: false }));
      }
    }
  );

  // 监听画布变化事件
  const handleCanvasModified = useCallback(() => {
    setAutoSaveState(prev => ({ ...prev, pendingChanges: true }));
    triggerAutoSave();
  }, [triggerAutoSave]);

  // 监听画布变化事件
  useEffect(() => {
    const Refer = ReferRef.current;
    if (Refer) {
      Refer.addEventListener('object:modified', handleCanvasModified);
      Refer.addEventListener('object:added', handleCanvasModified);
      Refer.addEventListener('object:removed', handleCanvasModified);

      return () => {
        Refer.removeEventListener('object:modified', handleCanvasModified);
        Refer.removeEventListener('object:added', handleCanvasModified);
        Refer.removeEventListener('object:removed', handleCanvasModified);
      };
    }
  }, [handleCanvasModified]);

  // 页面卸载时强制保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (autoSaveState.pendingChanges) {
        forceSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [forceSave, autoSaveState.pendingChanges]);

  // 使用画布交互 Hook
  useCanvasInteractions(ReferRef, canvasEl);

  // 使用拖拽或粘贴对象（dataTransfer）到画布 Hook
  const { addFromDataTransfer } = useAddFromDataTransfer(ReferRef);

  // 使用拖拽 Hook
  useDragAndDrop(ReferRef, addFromDataTransfer, createNewCanvas);

  // 使用剪贴板 Hook
  useClipboard(ReferRef, canvasEl, addFromDataTransfer);

  // 使用键盘快捷键 Hook
  useKeyboardShortcuts(ReferRef, element, {
    switchFitViewElement,
    allElementFitView,
    zoomCenterTo,
    forceSave,
    loadFromDatabase,
    createNewCanvas,
    addText,
  });

  // 显示最近文件
  const showRecentFiles = useCallback(() => {
    setRecentFilesVisible(true);
  }, []);

  return (
    <div>
      <canvas
        width={vw}
        height={vh}
        ref={canvasEl}
      />
      {/* Logo */}
      <div className={styles.logo}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/')}
          title="返回首页"
        >
          ←
        </button>
        <a href='https://huaban.com'>
          <img
            src='https://st0.dancf.com/static/02/202201151128-a455.svg'
            title='花瓣网'
            width={24}
            height={24}
          />
        </a>
        <span className={styles.siteName}>花瓣参考</span>
      </div>

      {/* zoom */}
      <div className={styles.zoom} onClick={zoomToggle}>
        {`${Math.floor(zoom * 100)}%`}
      </div>

      {/* 自动保存状态指示器 */}
      <div className={styles.autoSaveStatus}>
        <AutoSaveIndicator {...autoSaveState} />
      </div>

      {/* 工具栏 */}
      <Toolbar
        importRefer={importRefer}
        exportRefer={exportRefer}
        newCanvas={createNewCanvas}
        showRecentFiles={showRecentFiles}
      />

      {/* 右侧栏 */}
      <Drawer
        isOpen={isPropertyLocked}
        position='right'
      >
        <Property
          elements={selectedElements}
          isLocked={isPropertyLocked}
          onLockChange={setIsPropertyLocked}
        />
      </Drawer>

      {/* 添加右键菜单 */}
      <ContextMenu
        items={getMenuItems()}
        visible={contextMenu.visible}
        position={contextMenu.position}
        event={contextMenu.event}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
      />

      {/* 最近文件 */}
      <RecentFiles
        currentFileId={currentFileId}
        visible={recentFilesVisible}
        onClose={() => setRecentFilesVisible(false)}
        onSelect={loadFile}
        onRename={renameFile}
        onDelete={deleteFile}
      />
    </div>
  )
};

export default ReferCanvas;
