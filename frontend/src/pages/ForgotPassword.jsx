import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, Phone, Lock, ArrowRight,
  CheckCircle2, ArrowLeft, AlertCircle, Info, Eye, EyeOff
} from 'lucide-react';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError(t('auth.err_enter_identifier'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.err_password_short'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.err_password_match'));
      return;
    }

    setLoading(true);
    const res = await resetPassword(identifier.trim(), newPassword);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.error || t('auth.auth_error'));
    }
  };

  return (
    <div style={{ maxWidth: 460, margin: 'var(--space-2xl) auto', padding: '0 var(--space-md)' }}>
      <div className="card" style={{ padding: 'var(--space-xl)', borderTop: '4px solid var(--color-primary)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            marginBottom: 'var(--space-sm)'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: '1.45rem', margin: '0 0 6px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            {t('auth.reset_title')}
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
            {t('auth.reset_subtitle')}
          </p>
        </div>

        {/* Gateway Disclosure Notice */}
        <div style={{
          background: 'var(--bg-card-alt, #f8f5ee)',
          border: '1px solid var(--border-subtle, #e8e2d5)',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 'var(--space-lg)',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          lineHeight: 1.45
        }}>
          <Info size={16} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }} />
          <span>
            {t('auth.service_notice')}
          </span>
        </div>

        {error && (
          <div className="alert alert-warning" style={{ marginBottom: 'var(--space-md)', fontSize: '0.84rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
            <CheckCircle2 size={46} style={{ color: 'var(--color-good)', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.15rem', margin: '0 0 6px', color: 'var(--text-primary)' }}>
              {t('auth.password_updated_success')}
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
              {t('auth.password_updated_desc')}
            </p>
            <button
              onClick={() => navigate('/login', { state: { message: t('auth.password_updated_desc') } })}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>{t('auth.proceed_login')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.1rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                <Phone size={14} style={{ color: 'var(--color-primary)' }} />
                {t('auth.identifier_label')} *
              </label>
              <input
                type="text"
                className="farmer-input"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={t('auth.identifier_placeholder')}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.1rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                <Lock size={14} style={{ color: 'var(--color-primary)' }} />
                {t('auth.password')} *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="farmer-input"
                  style={{ paddingRight: 40 }}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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
                    color: 'var(--text-muted)'
                  }}
                  aria-label="Toggle password view"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                <Lock size={14} style={{ color: 'var(--color-primary)' }} />
                {t('auth.confirm_password')} *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="farmer-input"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.98rem', fontWeight: 700 }}
              disabled={loading}
            >
              {loading ? t('auth.updating_password') : (
                <>
                  <span>{t('auth.update_password_btn')}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center' }}>
              <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <ArrowLeft size={14} />
                {t('auth.back_to_login')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
