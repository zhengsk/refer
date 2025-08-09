import React, { useState, useEffect } from 'react';
import { db } from '../../db';
import styles from './index.module.less';

interface SettingsData {
  autoSave: boolean;
  autoSaveInterval: number;
  canvasBackgroundColor: string;
  gridVisible: boolean;
  snapToGrid: boolean;
  theme: 'light' | 'dark' | 'system';
}

const defaultSettings: SettingsData = {
  autoSave: true,
  autoSaveInterval: 5000,
  canvasBackgroundColor: '#ffffff',
  gridVisible: false,
  snapToGrid: false,
  theme: 'light'
};

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const [storageSize, setStorageSize] = useState('0 KB');

  // 加载设置
  useEffect(() => {
    loadSettings();
    loadStorageInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = localStorage.getItem('refer-settings');
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const files = await db.refers.toArray();
      setTotalFiles(files.length);

      // 估算存储大小（简化计算）
      const estimatedSize = files.reduce((total: number, file: any) => {
        const nameSize = (file.title || '').length * 2; // UTF-16 字符
        const dataSize = file.content ? JSON.stringify(file.content).length * 2 : 0;
        return total + nameSize + dataSize + 100; // 额外开销
      }, 0);

      setStorageSize(formatBytes(estimatedSize));
    } catch (error) {
      console.error('加载存储信息失败:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const saveSettings = async () => {
    try {
      localStorage.setItem('refer-settings', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('保存设置失败:', error);
      alert('保存设置失败，请重试。');
    }
  };

  const resetSettings = () => {
    if (window.confirm('确定要重置所有设置吗？')) {
      setSettings(defaultSettings);
    }
  };

  const clearAllData = async () => {
    const confirmed = window.confirm(
      '确定要清除所有数据吗？这将删除所有保存的作品，此操作不可撤销！'
    );

    if (confirmed) {
      const doubleConfirmed = window.confirm(
        '最后确认：真的要删除所有作品和数据吗？'
      );

      if (doubleConfirmed) {
        try {
          await db.refers.clear();
          localStorage.removeItem('refer-settings');
          setSettings(defaultSettings);
          loadStorageInfo();
          alert('所有数据已清除。');
        } catch (error) {
          console.error('清除数据失败:', error);
          alert('清除数据失败，请重试。');
        }
      }
    }
  };

  const exportData = async () => {
    try {
      const files = await db.refers.toArray();
      const data = {
        files,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `refer-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出数据失败:', error);
      alert('导出数据失败，请重试。');
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (!data.files || !Array.isArray(data.files)) {
          alert('无效的备份文件格式。');
          return;
        }

        const confirmed = window.confirm(
          `确定要导入备份数据吗？这将替换现有的 ${data.files.length} 个文件。`
        );

        if (confirmed) {
          await db.refers.clear();
          await db.refers.bulkAdd(data.files);

          if (data.settings) {
            setSettings({ ...defaultSettings, ...data.settings });
            localStorage.setItem('refer-settings', JSON.stringify(data.settings));
          }

          loadStorageInfo();
          alert('数据导入成功！');
        }
      } catch (error) {
        console.error('导入数据失败:', error);
        alert('导入数据失败，请检查文件格式。');
      }
    };

    reader.readAsText(file);
    // 清除输入值，允许重复选择同一文件
    event.target.value = '';
  };

  return (
    <div className={styles.settingsPage}>
      <h1>设置</h1>

      {/* 常规设置 */}
      <section className={styles.section}>
        <h2>常规设置</h2>

        <div className={styles.settingGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => setSettings(prev => ({ ...prev, autoSave: e.target.checked }))}
            />
            启用自动保存
          </label>
          <p className={styles.description}>
            自动保存你的作品，避免意外丢失
          </p>
        </div>

        {settings.autoSave && (
          <div className={styles.settingGroup}>
            <label className={styles.label}>
              自动保存间隔（秒）
              <input
                type="number"
                min="1"
                max="60"
                value={settings.autoSaveInterval / 1000}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  autoSaveInterval: parseInt(e.target.value) * 1000
                }))}
                className={styles.numberInput}
              />
            </label>
          </div>
        )}

        <div className={styles.settingGroup}>
          <label className={styles.label}>
            主题
            <select
              value={settings.theme}
              onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as any }))}
              className={styles.select}
            >
              <option value="light">浅色</option>
              <option value="dark">深色</option>
              <option value="system">跟随系统</option>
            </select>
          </label>
        </div>
      </section>

      {/* 画布设置 */}
      <section className={styles.section}>
        <h2>画布设置</h2>

        <div className={styles.settingGroup}>
          <label className={styles.label}>
            画布背景色
            <input
              type="color"
              value={settings.canvasBackgroundColor}
              onChange={(e) => setSettings(prev => ({ ...prev, canvasBackgroundColor: e.target.value }))}
              className={styles.colorInput}
            />
          </label>
        </div>

        <div className={styles.settingGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={settings.gridVisible}
              onChange={(e) => setSettings(prev => ({ ...prev, gridVisible: e.target.checked }))}
            />
            显示网格
          </label>
        </div>

        <div className={styles.settingGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={settings.snapToGrid}
              onChange={(e) => setSettings(prev => ({ ...prev, snapToGrid: e.target.checked }))}
            />
            吸附到网格
          </label>
        </div>
      </section>

      {/* 存储信息 */}
      <section className={styles.section}>
        <h2>存储信息</h2>

        <div className={styles.storageInfo}>
          <div className={styles.storageItem}>
            <span className={styles.storageLabel}>作品数量：</span>
            <span className={styles.storageValue}>{totalFiles} 个</span>
          </div>
          <div className={styles.storageItem}>
            <span className={styles.storageLabel}>占用空间：</span>
            <span className={styles.storageValue}>{storageSize}</span>
          </div>
        </div>
      </section>

      {/* 数据管理 */}
      <section className={styles.section}>
        <h2>数据管理</h2>

        <div className={styles.actionButtons}>
          <button onClick={exportData} className={styles.button}>
            导出数据
          </button>

          <label className={styles.button}>
            导入数据
            <input
              type="file"
              accept=".json"
              onChange={importData}
              style={{ display: 'none' }}
            />
          </label>

          <button
            onClick={clearAllData}
            className={`${styles.button} ${styles.dangerButton}`}
          >
            清除所有数据
          </button>
        </div>
      </section>

      {/* 操作按钮 */}
      <div className={styles.footer}>
        <button
          onClick={resetSettings}
          className={`${styles.button} ${styles.secondaryButton}`}
        >
          重置设置
        </button>

        <button
          onClick={saveSettings}
          className={`${styles.button} ${styles.primaryButton}`}
        >
          {saved ? '已保存 ✓' : '保存设置'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
