import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './i18n';
import './index.css';
import Layout from './components/Layout';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import HistoryReports from './pages/HistoryReports';
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
          <Route path="history" element={<HistoryReports />} />
          <Route path="reports" element={<HistoryReports />} />
          <Route path="advisory" element={<AdvisoryHub />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="silage" element={<SilageMonitor />} />
          <Route path="qr" element={<QRTraceability />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
