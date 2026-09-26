import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { checkHealth } from '../api';
import { SUPPORTED_LANGUAGES } from '../locales';
import { useAuth } from '../context/AuthContext';
import {
  getUserNotifications, markNotificationsAsRead
} from '../utils/userDataManager';
import {
  FlaskConical, Warehouse, LayoutDashboard,
  QrCode, BookOpen, Menu, X, Globe, Sun, Moon,
  ShieldCheck, FileText, User, LogOut,
  ChevronDown, Bell, CheckCircle2,
  Building2, WifiOff
} from 'lucide-react';

const mainNavItems = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/analyze', icon: FlaskConical, labelKey: 'nav.analyze' },
  { path: '/silage', icon: Warehouse, labelKey: 'nav.silage' },
  { path: '/history', icon: FileText, labelKey: 'nav.history' },
  { path: '/qr', icon: QrCode, labelKey: 'nav.qr' },
  { path: '/advisory', icon: BookOpen, labelKey: 'nav.advisory' },
];

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('feedquality_theme') || 'light');
  const [backendOnline, setBackendOnline] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Check backend health & notifications
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

    if (user?.id) {
      setNotifications(getUserNotifications(user.id));
    }

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('feedquality_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem('feedguard_language', newLang);
  };

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/login', {
      state: { message: 'Logged out successfully.' },
      replace: true
    });
  };

  const handleToggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (!notificationsOpen && user?.id) {
      markNotificationsAsRead(user.id);
      setNotifications(getUserNotifications(user.id));
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Professional Status Strip */}
      <div className="kisan-banner">
        <div className="kisan-banner-left" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.02em' }}>
            FEED GUARD
          </span>
          <span style={{ opacity: 0.65, fontSize: '0.75rem' }}>|</span>
          <span style={{ fontSize: '0.76rem', opacity: 0.9 }}>
            AI-Powered Feed & Silage Quality Testing
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {backendOnline ? (
            <span className="kisan-banner-pill pill-online">
              <span className="pulse-dot" />
              <span>AI Engine Online</span>
            </span>
          ) : (
            <span className="kisan-banner-pill pill-offline">
              <WifiOff size={12} />
              <span>Offline Mode (Field Ready)</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <header className="navbar">
        <div className="nav-container">
          {/* Brand Identity */}
          <NavLink to="/dashboard" className="nav-brand" style={{ textDecoration: 'none' }}>
            <div className="brand-icon" style={{
              background: 'var(--color-primary-light, #eaf5ee)',
              color: 'var(--color-primary, #1e5e3a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              padding: '6px',
              boxShadow: '0 2px 8px rgba(30, 94, 58, 0.15)'
            }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="brand-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '0.03em' }}>
                FEED GUARD
              </div>
              <div className="brand-subtitle" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                {t('brand.subtitle', 'AI-Powered Feed & Silage Quality Testing for Dairy Farmers')}
              </div>
            </div>
          </NavLink>

          {/* Desktop Nav Links */}
          <nav className="nav-links" style={{ display: mobileMenuOpen ? 'flex' : undefined }}>
            {mainNavItems.map(({ path, icon: Icon, labelKey }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={16} />
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>

          {/* Nav Controls: Language, Notifications, Theme, Profile */}
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Language Selector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--bg-card-alt, #f8f5ee)',
              padding: '4px 9px',
              borderRadius: 'var(--radius-full, 9999px)',
              border: '1px solid var(--border-color, #e8e2d5)'
            }}>
              <Globe size={14} style={{ color: 'var(--color-primary)' }} />
              <select
                className="lang-select"
                value={i18n.language}
                onChange={handleLanguageChange}
                aria-label="Select Language"
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  outline: 'none',
                  color: 'var(--text-primary)'
                }}
              >
                {SUPPORTED_LANGUAGES.map(({ code, native, name }) => (
                  <option key={code} value={code}>
                    {native} ({name})
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Bell Icon */}
            <div style={{ position: 'relative' }}>
              <button
                className="theme-btn"
                onClick={handleToggleNotifications}
                title="Notifications"
                aria-label="Notifications"
                style={{ position: 'relative' }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--color-unsafe, #dc2626)'
                  }} />
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: 300,
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-color, #e8e2d5)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-lg)',
                  padding: '12px',
                  zIndex: 1000
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>Notifications</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{notifications.length} total</span>
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      No new notifications.
                    </div>
                  ) : (
                    <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {notifications.map((n) => (
                        <div key={n.id} style={{
                          padding: '8px',
                          borderRadius: 6,
                          background: n.read ? 'transparent' : 'var(--color-primary-light, #eaf5ee)',
                          fontSize: '0.78rem'
                        }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</div>
                          <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{n.message}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              className="theme-btn"
              onClick={toggleTheme}
              title="Toggle Dark/Light Mode"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Farmer User Avatar / Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 7, borderRadius: 'var(--radius-full)' }}
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-expanded={profileDropdownOpen}
                aria-label="Farmer profile menu"
              >
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'var(--color-primary, #1e5e3a)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {user?.name?.charAt(0) || 'F'}
                </div>
                <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {user?.name || 'Farmer'}
                </span>
                <ChevronDown size={14} />
              </button>

              {profileDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    width: 230,
                    background: 'var(--bg-card, #ffffff)',
                    border: '1px solid var(--border-color, #e8e2d5)',
                    borderRadius: 'var(--radius-md, 12px)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '8px',
                    zIndex: 1000
                  }}
                >
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)', marginBottom: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                      {user?.name || 'Farmer'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                      {user?.role || 'Dairy Farmer'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {user?.farm_name || user?.mobile}
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      fontSize: '0.84rem',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <User size={15} style={{ color: 'var(--color-primary)' }} />
                    <span>Farmer Profile</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      fontSize: '0.84rem',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <Building2 size={15} style={{ color: 'var(--color-wheat)' }} />
                    <span>Farm Details</span>
                  </Link>

                  <Link
                    to="/history"
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      fontSize: '0.84rem',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <FileText size={15} style={{ color: 'var(--color-info)' }} />
                    <span>Sample History</span>
                  </Link>

                  <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

                  {/* Guaranteed Working Logout Button */}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      fontSize: '0.84rem',
                      color: 'var(--color-unsafe, #dc2626)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                      fontWeight: 700
                    }}
                  >
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              className="theme-btn mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              style={{ display: 'none' }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="main-content" style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/analyze" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <FlaskConical size={18} />
          <span>Analyze</span>
        </NavLink>
        <NavLink to="/silage" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Warehouse size={18} />
          <span>Silage</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={18} />
          <span>History</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <User size={18} />
          <span>Profile</span>
        </NavLink>
      </div>

      {/* Professional Footer */}
      <footer className="footer no-print">
        <div className="footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: 'var(--color-primary)' }}>
            <ShieldCheck size={20} />
            <span>FEED GUARD</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              — AI-Powered Feed & Silage Quality Testing for Dairy Farmers
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', margin: '8px 0', fontSize: '0.82rem' }}>
            <Link to="/analyze" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Feed Analysis</Link>
            <Link to="/silage" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Silage Monitoring</Link>
            <Link to="/advisory" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Farmer Advisory</Link>
            <Link to="/history" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Sample History</Link>
            <Link to="/qr" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>QR Reports</Link>
          </div>

          <p style={{ margin: '4px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Developed for Smart India Hackathon 2026 • Screening technology compliant with ICAR & NDDB cattle nutritional standards.
          </p>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            © 2026 FEED GUARD. Test. Detect. Protect.
          </div>
        </div>
      </footer>
    </div>
  );
}
