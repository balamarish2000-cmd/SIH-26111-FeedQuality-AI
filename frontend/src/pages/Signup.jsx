import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, User, Phone, Mail, Lock, MapPin,
  Building2, Layers, ArrowRight, AlertCircle, Eye, EyeOff
} from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Gujarat', 'Haryana',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha',
  'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
];

export default function Signup() {
  const { t, i18n } = useTranslation();
  const { signup, loading, authError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    farm_name: '',
    village: '',
    district: '',
    state: 'Maharashtra',
    password: '',
    confirmPassword: '',
    cattle_count: '12',
    preferred_language: i18n.language || 'en',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Field validations
    if (!form.name.trim()) {
      setLocalError('Full Name is required.');
      return;
    }
    const cleanMobile = form.mobile.replace(/[^0-9]/g, '');
    if (cleanMobile.length < 10) {
      setLocalError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!form.farm_name.trim()) {
      setLocalError('Farm or Dairy Name is required.');
      return;
    }
    if (!form.district.trim()) {
      setLocalError('District is required.');
      return;
    }
    if (!form.state) {
      setLocalError('State is required.');
      return;
    }
    if (form.password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match. Please verify.');
      return;
    }

    const res = await signup(form);
    if (res.success) {
      // Redirect to Login with confirmation flash message
      navigate('/login', {
        state: {
          registered: true,
          registeredMobile: form.mobile.trim(),
          message: 'Account created successfully. Please sign in with your credentials.'
        },
        replace: true
      });
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: 'var(--space-xl) auto', padding: '0 var(--space-md)' }}>
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
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 6px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            Create Farmer Account
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
            Register your dairy operation to screen feed quality, monitor silage, and track batch safety.
          </p>
        </div>

        {/* Error Notification */}
        {(localError || authError) && (
          <div className="alert alert-warning" style={{ marginBottom: 'var(--space-lg)', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{localError || authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Row 1: Full Name & Mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={14} style={{ color: 'var(--color-primary)' }} />
                Full Name *
              </label>
              <input
                type="text"
                className="farmer-input"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="e.g. Suresh Kumar"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={14} style={{ color: 'var(--color-primary)' }} />
                Mobile Number *
              </label>
              <input
                type="tel"
                className="farmer-input"
                value={form.mobile}
                onChange={e => handleChange('mobile', e.target.value)}
                placeholder="e.g. 9876543210"
                required
              />
            </div>
          </div>

          {/* Row 2: Email & Farm Name */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} style={{ color: 'var(--color-primary)' }} />
                Email Address (Optional)
              </label>
              <input
                type="email"
                className="farmer-input"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="farmer@kisanmail.in"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={14} style={{ color: 'var(--color-primary)' }} />
                Farm / Dairy Name *
              </label>
              <input
                type="text"
                className="farmer-input"
                value={form.farm_name}
                onChange={e => handleChange('farm_name', e.target.value)}
                placeholder="e.g. Balaji Dairy Farm"
                required
              />
            </div>
          </div>

          {/* Row 3: Village/Town & District */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                Village / Town
              </label>
              <input
                type="text"
                className="farmer-input"
                value={form.village}
                onChange={e => handleChange('village', e.target.value)}
                placeholder="e.g. Anand"
              />
            </div>

            <div className="form-group">
              <label className="form-label">District *</label>
              <input
                type="text"
                className="farmer-input"
                value={form.district}
                onChange={e => handleChange('district', e.target.value)}
                placeholder="e.g. Anand"
                required
              />
            </div>
          </div>

          {/* Row 4: State & Cattle Count */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">State *</label>
              <select
                className="farmer-select"
                value={form.state}
                onChange={e => handleChange('state', e.target.value)}
                required
              >
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={14} style={{ color: 'var(--color-primary)' }} />
                Estimated Cattle Count
              </label>
              <input
                type="number"
                className="farmer-input"
                value={form.cattle_count}
                onChange={e => handleChange('cattle_count', e.target.value)}
                min="1"
              />
            </div>
          </div>

          {/* Row 5: Password & Confirm Password */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} style={{ color: 'var(--color-primary)' }} />
                Password * (min 6 chars)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="farmer-input"
                  style={{ paddingRight: 40 }}
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
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

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} style={{ color: 'var(--color-primary)' }} />
                Confirm Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="farmer-input"
                  style={{ paddingRight: 40 }}
                  value={form.confirmPassword}
                  onChange={e => handleChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  aria-label="Toggle confirm password view"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.98rem', fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? 'Registering Account...' : (
              <>
                <span>Create Farmer Account</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Existing Account Footer Link */}
        <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
              Farmer Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
