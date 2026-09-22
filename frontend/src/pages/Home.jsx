import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Camera, MessageSquare, QrCode, Warehouse, WifiOff,
  Shield, ArrowRight, FlaskConical, AlertTriangle,
  CheckCircle2, Wheat, HeartHandshake, FileText, Activity,
  Sparkles, Check, ArrowDown
} from 'lucide-react';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const valueSteps = [
    {
      num: '01',
      titleKey: 'home.val_test_title',
      defaultTitle: 'TEST',
      descKey: 'home.val_test_desc',
      defaultDesc: 'Collect a representative sample of cattle feed pellets, silage, mash, or TMR at farm level.',
      color: 'var(--color-primary)',
    },
    {
      num: '02',
      titleKey: 'home.val_analyze_title',
      defaultTitle: 'ANALYZE',
      descKey: 'home.val_analyze_desc',
      defaultDesc: 'Rapid multi-target ML inference via camera photo or portable NIR sensor readings in under 10 seconds.',
      color: 'var(--color-wheat)',
    },
    {
      num: '03',
      titleKey: 'home.val_understand_title',
      defaultTitle: 'UNDERSTAND',
      descKey: 'home.val_understand_desc',
      defaultDesc: 'Plain-language quality interpretation, transparent AI confidence score, and specific adulteration risks.',
      color: 'var(--color-good)',
    },
    {
      num: '04',
      titleKey: 'home.val_act_title',
      defaultTitle: 'ACT',
      descKey: 'home.val_act_desc',
      defaultDesc: 'Immediate feeding ration adjustments, storage spoilage remedies, and verifiable QR certificates.',
      color: 'var(--color-terracotta)',
    },
  ];

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
          {t('home.hero_badge', 'SIH 2024 — Problem Statement 26111: Dairy Cattle Nutrition')}
        </div>
        <h1>{t('home.title', 'Smart Feed Quality Testing')}</h1>
        <p>{t('home.subtitle', 'AI-powered feed and silage quality assessment with actionable farmer guidance.')}</p>
        <div className="hero-cta">
          <button
            className="btn btn-harvest btn-lg"
            onClick={() => navigate('/analyze')}
          >
            <FlaskConical size={20} />
            {t('home.cta', 'TEST FEED')}
            <ArrowRight size={18} />
          </button>
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => navigate('/history')}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}
          >
            <FileText size={18} />
            {t('home.secondary_cta', 'VIEW REPORTS')}
          </button>
        </div>
      </section>

      {/* Problem Alert Banner */}
      <div className="problem-banner">
        <AlertTriangle size={24} className="problem-banner-icon" />
        <div>
          <h3>{t('home.problem_alert_title', 'Why Feed Quality Testing is Vital for Every Dairy Farmer')}</h3>
          <p>{t('home.problem_alert_desc', 'Substandard feed and spoiled silage cause 25–40% loss in daily milk production, mastitis, and reproductive failure. Traditional testing labs take 5–10 days and cost ₹2,000+ per test. Our digital AI testing delivers instant, affordable farm-gate results.')}</p>
        </div>
      </div>

      {/* 4-Stage Value Flow: TEST -> ANALYZE -> UNDERSTAND -> ACT */}
      <section className="workflow-section" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2 className="section-heading">
          <Sparkles size={22} style={{ color: 'var(--color-primary)' }} />
          {t('home.value_heading', 'The Farmer Decision-Support Journey')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
          {valueSteps.map((step) => (
            <div key={step.num} className="workflow-card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: step.color
              }} />
              <div className="workflow-card-num" style={{ background: step.color }}>{step.num}</div>
              <h3 style={{ marginTop: 'var(--space-xs)', color: 'var(--text-primary)' }}>
                {t(step.titleKey, step.defaultTitle)}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {t(step.descKey, step.defaultDesc)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Bar with Transparent Benchmark Context */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="stats-bar">
          <div className="stat">
            <div className="stat-number">30,000+</div>
            <div className="stat-text">{t('home.stats_analyses', 'ML Training Samples')}</div>
          </div>
          <div className="stat">
            <div className="stat-number" style={{ color: 'var(--color-good)' }}>98.3%</div>
            <div className="stat-text">{t('home.stats_accuracy', 'Validation Accuracy')}</div>
          </div>
          <div className="stat">
            <div className="stat-number">&lt; 10s</div>
            <div className="stat-text">{t('home.stats_speed', 'Farm-Gate Testing Speed')}</div>
          </div>
          <div className="stat">
            <div className="stat-number">5</div>
            <div className="stat-text">{t('home.stats_languages', 'Regional Languages')}</div>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
          {t('home.stats_disclaimer', 'Evaluated on ICAR/NDDB dairy cattle nutrition benchmarks and verified spectroscopy datasets.')}
        </p>
      </div>

      {/* Core Platform Pillars Grid */}
      <div className="features-grid">
        {features.map(({ icon: Icon, titleKey, descKey, color }) => (
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
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', background: 'var(--bg-card-alt)', marginTop: 'var(--space-xl)' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          fontWeight: 700,
          marginBottom: 'var(--space-md)',
          color: 'var(--color-primary)',
        }}>
          {t('home.tech_title', 'Built with Open Agritech Standards')}
        </h3>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-sm)',
          justifyContent: 'center',
        }}>
          {[
            'NIR Spectroscopy Models',
            'LightGBM Multi-Target ML',
            'Computer Vision Feature Extraction',
            'ICAR / NDDB Nutritional Standards',
            'Cryptographic SHA-256 QR Verification',
            'Low-Connectivity Ready Architecture'
          ].map(tech => (
            <span
              key={tech}
              className="badge"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                padding: '6px 14px',
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
              }}
            >
              <Check size={13} style={{ color: 'var(--color-primary)', marginRight: 4 }} />
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
