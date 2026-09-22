import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { checkHealth } from '../api';
import {
  Home, FlaskConical, Warehouse, LayoutDashboard,
  QrCode, BookOpen, Menu, X, Globe, Sun, Moon,
  PhoneCall, ShieldCheck, Wheat, FileText, ChevronDown
} from 'lucide-react';

const primaryNavItems = [
  { path: '/', icon: Home, labelKey: 'nav.home' },
  { path: '/analyze', icon: FlaskConical, labelKey: 'nav.test_feed' },
  { path: '/history', icon: FileText, labelKey: 'nav.reports' },
  { path: '/advisory', icon: BookOpen, labelKey: 'nav.advisory' },
];

const secondaryNavItems = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/silage', icon: Warehouse, labelKey: 'nav.silage' },
  { path: '/qr', icon: QrCode, labelKey: 'nav.qr' },
];

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
];

export default function Layout() {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('feedquality_theme') || 'light');
  const [backendOnline, setBackendOnline] = useState(true);

  // Monitor connectivity
  useEffect(() => {
    let mounted = true;
    const verifyConnection = async () => {
      const res = await checkHealth();
      if (mounted) {
        setBackendOnline(res.status === 'ok');
      }
    };
    verifyConnection();
    const interval = setInterval(verifyConnection, 25000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('feedquality_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Kisan Helpline & Connectivity Banner */}
      <div className="kisan-banner">
        <div className="kisan-banner-left">
          <PhoneCall size={14} />
          <span>{t('nav.helpline')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {backendOnline ? (
            <span className="kisan-banner-pill pill-online">
              <span className="pulse-dot" />
              {t('nav.ai_service_online', 'AI Service Online')}
            </span>
          ) : (
            <span className="kisan-banner-pill pill-offline">
              {t('nav.low_connectivity', 'Low-Connectivity Mode')}
            </span>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <header className="navbar">
        <div className="nav-container">
          <NavLink to="/" className="nav-brand">
            <div className="brand-icon">
              <Wheat size={24} />
            </div>
            <div>
              <div className="brand-title">{t('nav.brand_title')}</div>
              <div className="brand-subtitle">{t('nav.brand_subtitle')}</div>
            </div>
          </NavLink>

          {/* Nav Links: Primary (Feed Testing, Reports, Advisory) + Secondary Tools */}
          <nav className="nav-links" style={{ display: mobileMenuOpen ? 'flex' : undefined }}>
            {primaryNavItems.map(({ path, icon: Icon, labelKey }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={16} />
                {t(labelKey)}
              </NavLink>
            ))}

            {/* Visual separator for secondary tools on desktop */}
            <div
              className="nav-divider"
              style={{
                width: 1,
                height: 20,
                background: 'var(--border-subtle)',
                margin: '0 4px',
                display: mobileMenuOpen ? 'none' : 'block'
              }}
            />

            {secondaryNavItems.map(({ path, icon: Icon, labelKey }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
                style={{ opacity: 0.9 }}
              >
                <Icon size={15} />
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>

          {/* Controls: Language & Theme Toggle */}
          <div className="nav-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Globe size={16} style={{ color: 'var(--text-muted)' }} />
              <select
                className="lang-select"
                value={i18n.language}
                onChange={handleLanguageChange}
                aria-label={t('nav.language')}
              >
                {languages.map(({ code, label }) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </div>

            <button
              className="theme-btn"
              onClick={toggleTheme}
              title={t('nav.theme_toggle')}
              aria-label={t('nav.theme_toggle')}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              className="theme-btn"
              style={{ display: 'none' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--color-primary)' }}>
            <ShieldCheck size={18} />
            <span>SIH 2024 Problem Statement 26111 — Ministry of Fisheries, Animal Husbandry & Dairying</span>
          </div>
          <p>{t('nav.footer_text')}</p>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            © 2026 KisanDoodh FeedQuality AI — Designed for Rural Dairy Farmers & Cattle Cooperatives.
          </div>
        </div>
      </footer>
    </div>
  );
}
