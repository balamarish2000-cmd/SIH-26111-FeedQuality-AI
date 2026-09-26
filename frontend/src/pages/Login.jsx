import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_LANGUAGES } from '../locales';
import {
  ShieldCheck, Phone, Lock, Eye, EyeOff, ArrowRight,
  AlertCircle, CheckCircle2, Globe, FlaskConical,
  Warehouse, WifiOff, Activity
} from 'lucide-react';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { login, loading, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState(location.state?.registeredMobile || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState('');

  const flashMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!identifier.trim()) {
      setLocalError('Please enter your mobile number or email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    const res = await login(identifier.trim(), password, rememberMe);
    if (res.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem('feedguard_language', newLang);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--bg-primary, #fbf9f4)',
      fontFamily: 'var(--font-body)'
    }}>
      {/* ========================================================
          LEFT SIDE: FEED GUARD PRODUCT IDENTITY & VALUE PROPOSITION
          ======================================================== */}
      <div style={{
        flex: '1 1 50%',
        background: 'linear-gradient(150deg, #133a24 0%, #1e5e3a 55%, #2d6a4f 100%)',
        color: '#ffffff',
        padding: 'clamp(2rem, 5vw, 4rem)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }} className="login-left-pane">
        {/* Subtle background texture */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Main Logo & Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a7f3d0'
            }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                FEED GUARD
              </div>
              <div style={{ fontSize: '0.8rem', color: '#d1fae5', fontWeight: 500 }}>
                AI-Powered Feed & Silage Quality Testing for Dairy Farmers
              </div>
            </div>
          </div>

          {/* Headline & Description */}
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.65rem, 2.8vw, 2.25rem)',
            fontWeight: 800,
            lineHeight: 1.25,
            margin: '0 0 1.25rem 0',
            color: '#ffffff'
          }}>
            Rapid on-farm feed screening & spoilage detection in minutes.
          </h2>

          <p style={{
            fontSize: '0.96rem',
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.88)',
            maxWidth: 520,
            margin: '0 0 2.25rem 0'
          }}>
            Helping dairy farmers assess feed quality, identify potential contamination, and make better feeding and storage decisions using AI, sensors, and computer vision.
          </p>

          {/* 4 Professional Feature Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', maxWidth: 540 }}>
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 12,
              padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a7f3d0', fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>
                <FlaskConical size={16} />
                <span>AI Feed Screening</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>
                Nutritional quality and adulteration risk assessment
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 12,
              padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fef08a', fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>
                <Warehouse size={16} />
                <span>Silage Monitoring</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>
                Temperature, pH, moisture and spoilage monitoring
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 12,
              padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#93c5fd', fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>
                <WifiOff size={16} />
                <span>Offline-Ready</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>
                Continue testing and store results when connectivity is unavailable
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 12,
              padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbcfe8', fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>
                <Activity size={16} />
                <span>Farmer Advisory</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>
                Clear, actionable feeding and storage recommendations
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Footer Note */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: '2.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>
          Developed for Smart India Hackathon 2026
        </div>
      </div>

      {/* ========================================================
          RIGHT SIDE: PROFESSIONAL FARMER LOGIN FORM
          ======================================================== */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'clamp(1.5rem, 4vw, 3.5rem)',
        position: 'relative'
      }}>
        {/* Language selector in top right of login */}
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--bg-card, #ffffff)',
          padding: '5px 12px',
          borderRadius: 9999,
          border: '1px solid var(--border-subtle, #e8e2d5)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Globe size={15} style={{ color: 'var(--color-primary)' }} />
          <select
            value={i18n.language}
            onChange={handleLanguageChange}
            aria-label="Select Interface Language"
            style={{
              border: 'none',
              background: 'transparent',
              fontWeight: 700,
              fontSize: '0.82rem',
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

        {/* Login Card */}
        <div style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--bg-card, #ffffff)',
          borderRadius: 16,
          border: '1px solid var(--border-subtle, #e8e2d5)',
          boxShadow: '0 8px 30px rgba(35, 45, 30, 0.08)',
          padding: 'clamp(1.75rem, 3.5vw, 2.5rem)'
        }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.6rem',
              fontWeight: 800,
              margin: '0 0 6px 0',
              color: 'var(--text-primary)'
            }}>
              Farmer Login
            </h1>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Sign in to access your Feed Guard workspace.
            </p>
          </div>

          {/* Flash success messages (e.g. from registration or logout) */}
          {flashMessage && (
            <div className="alert alert-good" style={{ marginBottom: '1.25rem', fontSize: '0.84rem' }}>
              <CheckCircle2 size={16} />
              <span>{flashMessage}</span>
            </div>
          )}

          {/* Authentication Errors */}
          {(localError || authError) && (
            <div className="alert alert-warning" style={{ marginBottom: '1.25rem', fontSize: '0.84rem' }}>
              <AlertCircle size={16} />
              <span>{localError || authError}</span>
            </div>
          )}

          {/* Main Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.1rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                <Phone size={14} style={{ color: 'var(--color-primary)' }} />
                Mobile Number or Email Address
              </label>
              <input
                id="login-identifier"
                type="text"
                className="farmer-input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 9823045678 or farmer@kisanmail.in"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label htmlFor="login-password" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, fontSize: '0.85rem' }}>
                  <Lock size={14} style={{ color: 'var(--color-primary)' }} />
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
                >
                  Forgot Password?
                </Link>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="farmer-input"
                  style={{ paddingRight: 42 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}>
                Remember Me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px',
                fontSize: '0.98rem',
                fontWeight: 700,
                gap: 8
              }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : (
                <>
                  <span>Farmer Login</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Create Farmer Account Link */}
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle, #e8e2d5)',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              New dairy farmer?{' '}
              <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
                Create Farmer Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
