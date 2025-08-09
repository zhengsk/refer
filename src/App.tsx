import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/Home';
import CanvasPage from './pages/Canvas';
import GalleryPage from './pages/Gallery';
import SettingsPage from './pages/Settings';
import NotFoundPage from './pages/NotFound';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* 404 页面 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="canvas/:fileId" element={<CanvasPage />} />
        <Route path="canvas/new" element={<CanvasPage />} />
      </Routes>
    </Router>
  );
}

export default App;
