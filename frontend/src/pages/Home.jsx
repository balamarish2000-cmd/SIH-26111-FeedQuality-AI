import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Camera, MessageSquare, QrCode, Warehouse, WifiOff,
  Shield, ArrowRight, FlaskConical, AlertTriangle,
  CheckCircle2, Wheat, HeartHandshake, FileCheck
} from 'lucide-react';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    { icon: Zap, titleKey: 'home.feature1_title', descKey: 'home.feature1_desc', color: 'var(--color-primary)' },
    { icon: Camera, titleKey: 'home.feature2_title', descKey: 'home.feature2_desc', color: 'var(--color-wheat)' },
    { icon: MessageSquare, titleKey: 'home.feature3_title', descKey: 'home.feature3_desc', color: 'var(--color-good)' },
    { icon: QrCode, titleKey: 'home.feature4_title', descKey: 'home.feature4_desc', color: 'var(--color-terracotta)' },
    { icon: Warehouse, titleKey: 'home.feature5_title', descKey: 'home.feature5_desc', color: 'var(--color-primary)' },
    { icon: WifiOff, titleKey: 'home.feature6_title', descKey: 'home.feature6_desc', color: 'var(--color-clay)' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">
          <Shield size={15} />
          {t('home.hero_badge')}
        </div>
        <h1>{t('home.title')}</h1>
        <p>{t('home.subtitle')}</p>
        <div className="hero-cta">
          <button
            className="btn btn-harvest btn-lg"
            onClick={() => navigate('/analyze')}
          >
            <FlaskConical size={20} />
            {t('home.cta')}
            <ArrowRight size={18} />
          </button>
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => navigate('/silage')}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}
          >
            <Warehouse size={18} />
            {t('home.secondary_cta')}
          </button>
        </div>
      </section>

      {/* Problem Statement Alert Banner */}
      <div className="problem-banner">
        <AlertTriangle size={24} className="problem-banner-icon" />
        <div>
          <h3>{t('home.problem_alert_title')}</h3>
          <p>{t('home.problem_alert_desc')}</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat">
          <div className="stat-number">30,000+</div>
          <div className="stat-text">{t('home.stats_analyses')}</div>
        </div>
        <div className="stat">
          <div className="stat-number">98.3%</div>
          <div className="stat-text">{t('home.stats_accuracy')}</div>
        </div>
        <div className="stat">
          <div className="stat-number">5,000+</div>
          <div className="stat-text">{t('home.stats_farmers')}</div>
        </div>
        <div className="stat">
          <div className="stat-number">5</div>
          <div className="stat-text">{t('home.stats_languages')}</div>
        </div>
      </div>

      {/* 3-Step Farmer Workflow */}
      <section className="workflow-section">
        <h2 className="section-heading">
          <Wheat size={24} style={{ color: 'var(--color-primary)' }} />
          {t('home.how_it_works_title')}
        </h2>
        <div className="workflow-grid">
          <div className="workflow-card">
            <div className="workflow-card-num">1</div>
            <h3>{t('home.step1_title')}</h3>
            <p>{t('home.step1_desc')}</p>
          </div>
          <div className="workflow-card">
            <div className="workflow-card-num">2</div>
            <h3>{t('home.step2_title')}</h3>
            <p>{t('home.step2_desc')}</p>
          </div>
          <div className="workflow-card">
            <div className="workflow-card-num">3</div>
            <h3>{t('home.step3_title')}</h3>
            <p>{t('home.step3_desc')}</p>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <div className="features-grid">
        {features.map(({ icon: Icon, titleKey, descKey, color }, idx) => (
          <div key={titleKey} className="feature-card">
            <div
              className="feature-icon"
              style={{ background: 'var(--color-primary-light)', color }}
            >
              <Icon size={24} />
            </div>
            <h3>{t(titleKey)}</h3>
            <p>{t(descKey)}</p>
          </div>
        ))}
      </div>

      {/* Agritech Standards Callout */}
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', background: 'var(--bg-card-alt)' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          fontWeight: 700,
          marginBottom: 'var(--space-md)',
          color: 'var(--color-primary)',
        }}>
          {t('home.tech_title')}
        </h3>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-sm)',
          justifyContent: 'center',
        }}>
          {['NIR Spectroscopy', 'LightGBM Multi-Target ML', 'Computer Vision Edge AI', 'BIS Dairy Nutrition Standards', 'Cryptographic SHA-256 QR', 'PWA Offline Storage'].map(tech => (
            <span
              key={tech}
              className="badge"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                padding: '6px 14px',
                fontSize: '0.8rem',
              }}
            >
              <CheckCircle2 size={12} style={{ color: 'var(--color-good)', marginRight: 4 }} />
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
