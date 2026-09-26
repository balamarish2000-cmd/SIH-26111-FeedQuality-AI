import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_LANGUAGES } from '../locales';
import {
  User, Phone, Mail, MapPin, Building2, Layers,
  Globe, Save, CheckCircle2, ShieldCheck, Database,
  LogOut, FileText, Sliders, KeyRound, AlertTriangle, Check
} from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Gujarat', 'Haryana',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha',
  'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
];

export default function Profile() {
  const { t } = useTranslation();
  const { user, updateProfile, resetPassword, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'farm' | 'security' | 'settings'

  const [form, setForm] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    email: user?.email || '',
    state: user?.state || 'Maharashtra',
    district: user?.district || '',
    village: user?.village || '',
    farm_name: user?.farm_name || '',
    cattle_count: user?.cattle_count || '',
    preferred_language: user?.preferred_language || 'en',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Change Password State
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChange = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setSavedSuccess(false);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const res = await updateProfile(form);
    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword.length < 6) {
      setPasswordError(t('auth.err_password_short'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('auth.err_password_match'));
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await resetPassword(user?.mobile || user?.email, passwordForm.newPassword);
      if (res.success) {
        setPasswordSuccess(t('auth.password_updated_success'));
        setPasswordForm({ newPassword: '', confirmPassword: '' });
      } else {
        setPasswordError(res.error || t('auth.auth_error'));
      }
    } catch (err) {
      setPasswordError(err.message || t('auth.auth_error'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ maxWidth: 840, margin: 'var(--space-xl) auto', padding: '0 var(--space-md)' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <User size={26} style={{ color: 'var(--color-primary)' }} />
            {t('auth.profile_title')}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
            {t('auth.profile_subtitle')}
          </p>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--color-good-bg)',
          border: '1px solid var(--color-good-border)',
          color: 'var(--color-good)',
          padding: '4px 14px',
          borderRadius: 9999,
          fontSize: '0.8rem',
          fontWeight: 700
        }}>
          <ShieldCheck size={14} />
          <span>{t('profile.account_verified')}</span>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="card" style={{
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-lg)',
        background: 'linear-gradient(135deg, #f0f7f3 0%, #ffffff 100%)',
        border: '1px solid var(--color-good-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 800
            }}>
              {(user?.name || 'F')[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: '0 0 4px', color: 'var(--text-primary)' }}>
                {user?.name || t('profile.registered_farmer')}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span><strong>{t('auth.farm_name')}:</strong> {user?.farm_name || t('profile.family_farm')}</span>
                <span>•</span>
                <span><strong>{t('silage.location')}:</strong> {[user?.village, user?.district, user?.state].filter(Boolean).join(', ') || ''}</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <div>{t('auth.mobile')}: <strong>{user?.mobile || t('profile.not_set')}</strong></div>
            {user?.email && <div>{t('auth.email')}: <strong>{user.email}</strong></div>}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 'var(--space-lg)',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: 4,
        overflowX: 'auto'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'profile' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'profile' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <User size={15} />
          <span>{t('profile.tab_details')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('farm')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'farm' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'farm' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <Building2 size={15} />
          <span>{t('profile.tab_farm')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'security' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'security' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <KeyRound size={15} />
          <span>{t('profile.tab_security')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'settings' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'settings' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <Sliders size={15} />
          <span>{t('profile.tab_settings')}</span>
        </button>
      </div>

      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        {savedSuccess && (
          <div className="alert alert-good" style={{ marginBottom: 'var(--space-lg)' }}>
            <CheckCircle2 size={18} />
            <span>{t('auth.profile_saved')}</span>
          </div>
        )}

        {/* TAB 1: Profile Details Form */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                {t('profile.identity_title')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('profile.identity_desc')}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={14} style={{ color: 'var(--color-primary)' }} />
                  {t('auth.full_name')}
                </label>
                <input
                  type="text"
                  className="farmer-input"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} style={{ color: 'var(--color-primary)' }} />
                  {t('auth.mobile')}
                </label>
                <input
                  type="tel"
                  className="farmer-input"
                  value={form.mobile}
                  onChange={e => handleChange('mobile', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} style={{ color: 'var(--color-primary)' }} />
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  className="farmer-input"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="farmer@kisanmail.in"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-md)' }}>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ color: 'var(--color-unsafe)', borderColor: 'rgba(220, 38, 38, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <LogOut size={16} />
                <span>{t('nav.logout')}</span>
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ minWidth: 160, justifyContent: 'center' }}
              >
                <Save size={16} />
                <span>{loading ? t('profile.saving') : t('profile.save_btn')}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Dairy Farm Operations */}
        {activeTab === 'farm' && (
          <form onSubmit={handleProfileSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                {t('profile.farm_heading')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('profile.farm_desc')}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={14} style={{ color: 'var(--color-primary)' }} />
                  {t('auth.farm_name')}
                </label>
                <input
                  type="text"
                  className="farmer-input"
                  value={form.farm_name}
                  onChange={e => handleChange('farm_name', e.target.value)}
                  placeholder="e.g. Krishna Dairy Farm"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                  {t('auth.village')}
                </label>
                <input
                  type="text"
                  className="farmer-input"
                  value={form.village}
                  onChange={e => handleChange('village', e.target.value)}
                  placeholder="e.g. Baramati"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={14} style={{ color: 'var(--color-primary)' }} />
                  {t('auth.cattle_count')}
                </label>
                <input
                  type="number"
                  className="farmer-input"
                  value={form.cattle_count}
                  onChange={e => handleChange('cattle_count', e.target.value)}
                  min="0"
                  placeholder="e.g. 15"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-md)' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ minWidth: 160, justifyContent: 'center' }}
              >
                <Save size={16} />
                <span>{loading ? t('profile.saving') : t('profile.save_farm_btn')}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Change Password */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                {t('profile.change_pwd_title')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('profile.change_pwd_desc')}
              </p>
            </div>

            {passwordError && (
              <div className="alert alert-warning" style={{ marginBottom: 'var(--space-md)' }}>
                <AlertTriangle size={18} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="alert alert-good" style={{ marginBottom: 'var(--space-md)' }}>
                <CheckCircle2 size={18} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">{t('profile.new_password_label')}</label>
                <input
                  type="password"
                  className="farmer-input"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('profile.confirm_new_password_label')}</label>
                <input
                  type="password"
                  className="farmer-input"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-md)' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={passwordLoading}
                style={{ minWidth: 180, justifyContent: 'center' }}
              >
                <KeyRound size={16} />
                <span>{passwordLoading ? t('profile.updating_pwd') : t('profile.update_pwd_btn')}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: Regional Settings */}
        {activeTab === 'settings' && (
          <form onSubmit={handleProfileSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                {t('profile.regional_title')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('profile.regional_desc')}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                  {t('auth.state')}
                </label>
                <select
                  className="farmer-select"
                  value={form.state}
                  onChange={e => handleChange('state', e.target.value)}
                >
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('auth.district')}</label>
                <input
                  type="text"
                  className="farmer-input"
                  value={form.district}
                  onChange={e => handleChange('district', e.target.value)}
                  placeholder="e.g. Pune"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Globe size={14} style={{ color: 'var(--color-primary)' }} />
                  {t('auth.preferred_language')}
                </label>
                <select
                  className="farmer-select"
                  value={form.preferred_language}
                  onChange={e => handleChange('preferred_language', e.target.value)}
                >
                  {SUPPORTED_LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.native} ({l.name})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-md)' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ minWidth: 160, justifyContent: 'center' }}
              >
                <Save size={16} />
                <span>{loading ? t('profile.saving') : t('profile.save_settings_btn')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
