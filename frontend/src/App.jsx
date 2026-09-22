import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './i18n';
import './index.css';
import Layout from './components/Layout';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import SilageMonitor from './pages/SilageMonitor';
import Dashboard from './pages/Dashboard';
import QRTraceability from './pages/QRTraceability';
import AdvisoryHub from './pages/AdvisoryHub';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="analyze" element={<Analyze />} />
          <Route path="silage" element={<SilageMonitor />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="qr" element={<QRTraceability />} />
          <Route path="advisory" element={<AdvisoryHub />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
