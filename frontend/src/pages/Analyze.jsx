import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { predictFeed, predictImage, generateQR } from '../api';
import {
  FlaskConical, Upload, Camera, AlertTriangle, CheckCircle2,
  XCircle, Info, QrCode, Wheat, Sparkles, Layers,
  ChevronDown, ChevronUp, Sliders, ShieldCheck, ShieldAlert,
  Activity, Check, ArrowRight, Eye, RefreshCw, Zap, Lightbulb
} from 'lucide-react';

const FEED_TYPES = [
  'Cattle Feed Pellet',
  'Silage',
  'Feed Mash',
  'TMR',
  'Mineral Mixture',
];

const INITIAL_FORM = {
  feed_type: 'Cattle Feed Pellet',
  moisture_pct: '9.0',
  protein_pct: '17.0',
  fiber_pct: '11.0',
  energy_mcal_per_kg: '3.0',
  mineral_deficiency_index: '6.0',
  urea_pct: '1.0',
  sand_silica_pct: '0.3',
  aflatoxin_ppb: '1.5',
  fungal_load_index: '1.0',
  mould_index_pct: '3.0',
  storage_temperature_c: '24',
  ph: '',
  sampling_depth_cm: '20',
};

const DEMO_SCENARIOS = [
  {
    key: 'good',
    name: 'GOOD FEED',
    labelKey: 'analyze.scenario_good',
    desc: 'Clean balanced cattle feed pellet, high protein, safe for lactation',
    badgeClass: 'scenario-good',
    values: {
      feed_type: 'Cattle Feed Pellet', moisture_pct: '8.5', protein_pct: '17.5',
      fiber_pct: '11.0', energy_mcal_per_kg: '3.2', mineral_deficiency_index: '5.0',
      urea_pct: '1.0', sand_silica_pct: '0.2', aflatoxin_ppb: '1.0',
      fungal_load_index: '0.8', mould_index_pct: '3.5', storage_temperature_c: '23',
      ph: '', sampling_depth_cm: '20',
    },
  },
  {
    key: 'adulterated',
    name: 'ADULTERATED FEED',
    labelKey: 'analyze.scenario_adulterated',
    desc: 'Mineral mixture spiked with 9.5% synthetic urea to falsely elevate nitrogen',
    badgeClass: 'scenario-adulterated',
    values: {
      feed_type: 'Mineral Mixture', moisture_pct: '10.0', protein_pct: '14.0',
      fiber_pct: '9.0', energy_mcal_per_kg: '2.6', mineral_deficiency_index: '20.0',
      urea_pct: '9.5', sand_silica_pct: '0.5', aflatoxin_ppb: '3.0',
      fungal_load_index: '2.0', mould_index_pct: '6.0', storage_temperature_c: '27',
      ph: '', sampling_depth_cm: '15',
    },
  },
  {
    key: 'spoiled',
    name: 'HIGH-RISK / SPOILED',
    labelKey: 'analyze.scenario_spoiled',
    desc: 'Mouldy feed mash with damp moisture and dangerous 55 ppb aflatoxin',
    badgeClass: 'scenario-spoiled',
    values: {
      feed_type: 'Feed Mash', moisture_pct: '45.0', protein_pct: '13.0',
      fiber_pct: '15.0', energy_mcal_per_kg: '1.9', mineral_deficiency_index: '18.0',
      urea_pct: '1.8', sand_silica_pct: '1.0', aflatoxin_ppb: '55.0',
      fungal_load_index: '11.0', mould_index_pct: '78.0', storage_temperature_c: '33',
      ph: '', sampling_depth_cm: '25',
    },
  },
];

export default function Analyze() {
  const { t } = useTranslation();

  // 4-Step Workflow State
  const [selectedFeedType, setSelectedFeedType] = useState('Cattle Feed Pellet');
  const [inputMethod, setInputMethod] = useState('sensor'); // 'image' | 'sensor' | 'manual' | 'demo'
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);

  // Form & Image State
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const fileInputRef = useRef(null);

  const handleFeedTypeChange = (type) => {
    setSelectedFeedType(type);
    setForm(prev => ({
      ...prev,
      feed_type: type,
      ph: type === 'Silage' ? (prev.ph || '4.1') : '',
    }));
  };

  const handleInput = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyScenario = (scenario) => {
    setSelectedFeedType(scenario.values.feed_type);
    setForm(scenario.values);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setQrData(null);

    try {
      if (inputMethod === 'image') {
        if (!imageFile) throw new Error('Please select or capture a feed image first.');
        const data = await predictImage(imageFile);
        setResult(data);
      } else {
        const data = await predictFeed({
          ...form,
          feed_type: selectedFeedType,
        });
        setResult(data);
      }
    } catch (err) {
      setError(err.message || 'Analysis could not be completed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!result) return;
    setGeneratingQR(true);
    try {
      const qr = await generateQR(result.advisory, form);
      setQrData(qr);
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingQR(false);
    }
  };

  const predictions = result?.predictions || {};
  const advisory = result?.advisory || {};
  const structured = advisory.structured_advisory || {};

  // Confidence Level Determination
  const qualityConf = predictions.quality_status_confidence || 0;
  const isHighConf = qualityConf >= 0.80;
  const isMedConf = qualityConf >= 0.60 && qualityConf < 0.80;
  const isLowConf = qualityConf < 0.60 && qualityConf > 0;

  const getQualityBadgeClass = (quality) => {
    switch (quality) {
      case 'Good': return 'good';
      case 'Moderate': return 'moderate';
      case 'Poor': return 'poor';
      case 'Unsafe': return 'unsafe';
      default: return 'moderate';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>{t('analyze.title', 'Smart Feed Quality Testing')}</h1>
        <p>{t('analyze.subtitle', 'Evaluate nutritional parameters, detect adulterants, and verify cattle feed safety in real time.')}</p>
      </div>

      <div className="two-col">
        {/* ======================================================== */}
        {/* LEFT COLUMN: 4-STEP FARMER WORKFLOW                      */}
        {/* ======================================================== */}
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            {/* STEP 1: Select Feed Type */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-xs)' }}>
                <span className="badge" style={{ background: 'var(--color-primary)', color: '#ffffff' }}>STEP 1</span>
                <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
                  {t('analyze.step1_label', 'Select Feed Type')}
                </label>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                {FEED_TYPES.map(ft => (
                  <button
                    key={ft}
                    type="button"
                    className={`btn ${selectedFeedType === ft ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', flex: '1 1 auto' }}
                    onClick={() => handleFeedTypeChange(ft)}
                  >
                    {ft}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2: Choose Input Method */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-xs)' }}>
                <span className="badge" style={{ background: 'var(--color-primary)', color: '#ffffff' }}>STEP 2</span>
                <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
                  {t('analyze.step2_label', 'Choose Input Method')}
                </label>
              </div>

              <div className="input-method-grid">
                <button
                  type="button"
                  className={`input-method-btn ${inputMethod === 'sensor' ? 'active' : ''}`}
                  onClick={() => setInputMethod('sensor')}
                >
                  <FlaskConical size={20} />
                  <span className="method-title">{t('analyze.method_sensor', 'Sensor / NIR Data')}</span>
                  <span className="method-sub">Spectroscopy Probe</span>
                </button>

                <button
                  type="button"
                  className={`input-method-btn ${inputMethod === 'image' ? 'active' : ''}`}
                  onClick={() => setInputMethod('image')}
                >
                  <Camera size={20} />
                  <span className="method-title">{t('analyze.method_camera', 'Camera / Photo')}</span>
                  <span className="method-sub">Computer Vision</span>
                </button>

                <button
                  type="button"
                  className={`input-method-btn ${inputMethod === 'manual' ? 'active' : ''}`}
                  onClick={() => setInputMethod('manual')}
                >
                  <Sliders size={20} />
                  <span className="method-title">{t('analyze.method_manual', 'Manual Values')}</span>
                  <span className="method-sub">Farmer Measurement</span>
                </button>

                <button
                  type="button"
                  className={`input-method-btn ${inputMethod === 'demo' ? 'active' : ''}`}
                  onClick={() => setInputMethod('demo')}
                >
                  <Zap size={20} style={{ color: '#d97706' }} />
                  <span className="method-title" style={{ color: '#d97706' }}>DEMO MODE</span>
                  <span className="method-sub">Controlled Scenarios</span>
                </button>
              </div>
            </div>

            {/* CONTROLLED DEMO MODE CARD */}
            {inputMethod === 'demo' && (
              <div className="demo-mode-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Sparkles size={16} style={{ color: '#d97706' }} />
                  <strong style={{ fontSize: '0.86rem', color: '#92400e' }}>
                    {t('analyze.demo_mode_title', 'Live Demonstration Scenarios')}
                  </strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 var(--space-xs)' }}>
                  {t('analyze.demo_mode_desc', 'Click a scenario below to populate verified sample parameters and run through actual ML inference.')}
                </p>
                <div className="demo-pills-row">
                  {DEMO_SCENARIOS.map(sc => (
                    <button
                      key={sc.key}
                      type="button"
                      className={`demo-scenario-btn ${sc.badgeClass}`}
                      onClick={() => handleApplyScenario(sc)}
                    >
                      <span>{sc.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* INPUT FORM: CAMERA PHOTO OR SENSOR/MANUAL METRICS */}
            {inputMethod === 'image' ? (
              <div>
                <div
                  className="upload-zone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                  onDragLeave={e => { e.currentTarget.classList.remove('drag-over'); }}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('drag-over');
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  style={{ marginBottom: 'var(--space-md)' }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  {imagePreview ? (
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 6 }}>
                        ✓ SAMPLE PREVIEW READY
                      </div>
                      <img
                        src={imagePreview}
                        alt="Feed sample preview"
                        style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: 'var(--radius-md)', objectFit: 'contain' }}
                      />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                        Click to choose a different photo
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="upload-icon">📸</div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {t('analyze.upload_title', 'Take Photo of Feed or Upload Image')}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {t('analyze.upload_desc', 'Hold camera close to feed pellets or silage surface under natural light')}
                      </p>
                    </>
                  )}
                </div>

                <div className="alert alert-info" style={{ fontSize: '0.78rem', marginBottom: 'var(--space-md)' }}>
                  <Info size={14} />
                  <span>
                    <strong>Technical Disclosure:</strong> Computer vision provides physical surface and discoloration estimations. For legal certified analysis, use NIR spectroscopic test.
                  </span>
                </div>
              </div>
            ) : (
              <div>
                {/* ESSENTIAL PARAMETERS (Clean for farmers) */}
                <div style={{ marginBottom: 'var(--space-sm)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Essential Feed Parameters
                  </span>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">{t('analyze.moisture', 'Moisture Content (%)')}</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 9.5"
                      value={form.moisture_pct}
                      onChange={e => handleInput('moisture_pct', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('analyze.protein', 'Crude Protein (%)')}</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 17.0"
                      value={form.protein_pct}
                      onChange={e => handleInput('protein_pct', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('analyze.fiber', 'Crude Fiber (%)')}</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 11.0"
                      value={form.fiber_pct}
                      onChange={e => handleInput('fiber_pct', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('analyze.energy', 'Energy (Mcal/kg)')}</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 3.0"
                      value={form.energy_mcal_per_kg}
                      onChange={e => handleInput('energy_mcal_per_kg', e.target.value)}
                    />
                  </div>

                  {selectedFeedType === 'Silage' && (
                    <div className="form-group">
                      <label className="form-label">{t('analyze.ph', 'Fermentation pH')}</label>
                      <input
                        className="form-input"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 4.1"
                        value={form.ph}
                        onChange={e => handleInput('ph', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* PROGRESSIVE DISCLOSURE: ADVANCED MEASUREMENTS ACCORDION */}
                <button
                  type="button"
                  className="accordion-toggle"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{ marginTop: 'var(--space-md)' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sliders size={16} />
                    {t('analyze.advanced_toggle', 'Advanced Laboratory & NIR Measurements')}
                  </span>
                  {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showAdvanced && (
                  <div className="form-grid" style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-md)', background: 'var(--bg-card-alt)', borderRadius: 'var(--radius-md)' }}>
                    <div className="form-group">
                      <label className="form-label">{t('analyze.urea', 'Urea Content (%)')}</label>
                      <input
                        className="form-input"
                        type="number"
                        step="0.1"
                        value={form.urea_pct}
                        onChange={e => handleInput('urea_pct', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('analyze.sand', 'Sand / Silica (%)')}</label>
                      <input
                        className="form-input"
                        type="number"
                        step="0.1"
                        value={form.sand_silica_pct}
                        onChange={e => handleInput('sand_silica_pct', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('analyze.aflatoxin', 'Aflatoxin B1 (ppb)')}</label>
                      <input
                        className="form-input"
                        type="number"
                        step="0.1"
                        value={form.aflatoxin_ppb}
                        onChange={e => handleInput('aflatoxin_ppb', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('analyze.fungal', 'Fungal Load Index')}</label>
                      <input
                        className="form-input"
                        type="number"
                        step="0.1"
                        value={form.fungal_load_index}
                        onChange={e => handleInput('fungal_load_index', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('analyze.mould', 'Mould Index (%)')}</label>
                      <input
                        className="form-input"
                        type="number"
                        step="0.1"
                        value={form.mould_index_pct}
                        onChange={e => handleInput('mould_index_pct', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('analyze.temperature', 'Storage Temp (°C)')}</label>
                      <input
                        className="form-input"
                        type="number"
                        step="0.1"
                        value={form.storage_temperature_c}
                        onChange={e => handleInput('storage_temperature_c', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('analyze.mineral', 'Mineral Deficiency Index')}</label>
                      <input
                        className="form-input"
                        type="number"
                        step="0.1"
                        value={form.mineral_deficiency_index}
                        onChange={e => handleInput('mineral_deficiency_index', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('analyze.depth', 'Sampling Depth (cm)')}</label>
                      <input
                        className="form-input"
                        type="number"
                        step="1"
                        value={form.sampling_depth_cm}
                        onChange={e => handleInput('sampling_depth_cm', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Primary Action Button */}
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <button
                type="button"
                className="btn btn-harvest btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" style={{ width: 18, height: 18, margin: 0, borderWidth: 2 }} />
                    <span>{t('analyze.analyzing', 'Running AI Prediction...')}</span>
                  </>
                ) : (
                  <>
                    <FlaskConical size={18} />
                    <span>{t('analyze.analyze_btn', 'ANALYZE FEED')}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI TRANSPARENCY: HOW AI WORKS */}
          <div className="card" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={16} />
                {t('analyze.how_ai_works_title', 'How Our AI Works')}
              </span>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowTechDetails(!showTechDetails)}
                style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
              >
                {showTechDetails ? 'Hide Details' : 'Technical Details'}
                {showTechDetails ? <ChevronUp size={14} style={{ marginLeft: 2 }} /> : <ChevronDown size={14} style={{ marginLeft: 2 }} />}
              </button>
            </div>

            {/* Simple Diagram */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '10px 0 4px', fontSize: '0.74rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: 'var(--bg-card-alt)' }}>Input</span>
              <span>→</span>
              <span className="badge" style={{ background: 'var(--bg-card-alt)' }}>Features</span>
              <span>→</span>
              <span className="badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>AI Inference</span>
              <span>→</span>
              <span className="badge" style={{ background: 'var(--bg-card-alt)' }}>Confidence</span>
              <span>→</span>
              <span className="badge" style={{ background: 'var(--color-wheat)', color: '#92400e' }}>Action Advisory</span>
            </div>

            {showTechDetails && (
              <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-xs)', lineHeight: 1.5 }}>
                <p style={{ margin: '4px 0' }}>
                  • <strong>Models:</strong> Three independent ensemble models (LightGBM, Random Forest, XGBoost) trained on 30,000+ laboratory samples without label leakage.
                </p>
                <p style={{ margin: '4px 0' }}>
                  • <strong>Missing Data:</strong> Handled dynamically using missingness indicators and median imputation.
                </p>
                <p style={{ margin: '4px 0' }}>
                  • <strong>Advisory Rules:</strong> Calibrated with NDDB / ICAR dairy cattle ration balancing benchmarks.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: STEP 4 - RESULTS & ACTIONABLE GUIDANCE     */}
        {/* ======================================================== */}
        <div>
          {error && (
            <div className="alert alert-warning" style={{ marginBottom: 'var(--space-md)' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div>
              {/* PRIMARY FEED QUALITY HERO CARD */}
              <div className="card" style={{ marginBottom: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: predictions.quality_status === 'Good' ? 'var(--color-good)' : predictions.quality_status === 'Moderate' ? 'var(--color-moderate)' : 'var(--color-unsafe)'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                      Overall Diagnostic Assessment
                    </span>
                    <h2 style={{ fontSize: '1.75rem', margin: '2px 0', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                      {predictions.quality_status || 'Assessed'}
                    </h2>
                    <span className="badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: '0.78rem' }}>
                      {selectedFeedType}
                    </span>
                  </div>

                  {/* AI CONFIDENCE BADGE */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      AI Confidence
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span
                        className="badge"
                        style={{
                          background: isHighConf ? 'rgba(30, 94, 58, 0.12)' : isMedConf ? 'rgba(217, 119, 6, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                          color: isHighConf ? 'var(--color-good)' : isMedConf ? 'var(--color-moderate)' : 'var(--color-unsafe)',
                          fontSize: '0.84rem',
                          fontWeight: 800,
                        }}
                      >
                        {isHighConf ? 'HIGH CONFIDENCE' : isMedConf ? 'MEDIUM CONFIDENCE' : 'LOW CONFIDENCE'} ({Math.round(qualityConf * 100)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* LOW CONFIDENCE CAUTION ALERT */}
                {isLowConf && (
                  <div className="alert alert-warning" style={{ margin: 'var(--space-xs) 0 var(--space-md)' }}>
                    <AlertTriangle size={16} />
                    <span>
                      <strong>Verification Note:</strong> AI prediction confidence is low (&lt;60%). Please verify sample freshness or conduct laboratory testing before making ration modifications.
                    </span>
                  </div>
                )}

                {/* Plain-Language Explanation */}
                <div style={{ background: 'var(--bg-card-alt)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                    What This Result Means
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {structured.quality_interpretation?.explanation || 'Feed parameters have been evaluated against standard nutritional benchmarks.'}
                  </p>
                </div>

                {/* 2-Column Risk Summary: Adulteration & Spoilage */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  {/* Adulteration Card */}
                  <div className={`result-card ${predictions.adulteration_type === 'None' ? 'good' : 'unsafe'}`} style={{ padding: 'var(--space-md)' }}>
                    <div className="result-label">{t('analyze.adulteration', 'Adulteration Status')}</div>
                    <div className="result-value" style={{ fontSize: '1.05rem', margin: '4px 0' }}>
                      {predictions.adulteration_type === 'None' ? t('common.none', 'None (Clean)') : predictions.adulteration_type}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Risk Confidence: {Math.round((predictions.adulteration_type_confidence || 0) * 100)}%
                    </div>
                  </div>

                  {/* Spoilage Card */}
                  <div className={`result-card ${predictions.spoilage_flag === 0 || predictions.spoilage_flag === '0' ? 'good' : 'unsafe'}`} style={{ padding: 'var(--space-md)' }}>
                    <div className="result-label">{t('analyze.spoilage', 'Biological Spoilage')}</div>
                    <div className="result-value" style={{ fontSize: '1.05rem', margin: '4px 0' }}>
                      {predictions.spoilage_flag === 0 || predictions.spoilage_flag === '0' ? t('common.not_spoiled', 'Fresh / Safe') : t('common.spoiled', 'Spoiled / Toxic')}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Detection Confidence: {Math.round((predictions.spoilage_flag_confidence || 0) * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* NUTRITIONAL SUMMARY CARD */}
              {advisory.nutrition_summary && Object.keys(advisory.nutrition_summary).length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                  <div className="card-header">
                    <span className="card-title">
                      <Wheat size={18} style={{ color: 'var(--color-primary)' }} />
                      {t('analyze.nutrition_analysis', 'Nutritional Balance Scorecard')}
                    </span>
                  </div>
                  <div className="nutrient-grid">
                    {Object.entries(advisory.nutrition_summary).map(([key, info]) => {
                      const statusClass = info.status === 'normal' ? 'normal' : info.status === 'high' ? 'high' : 'low';
                      const statusLabel = info.status === 'normal' ? t('analyze.status_normal', 'Normal') : info.status === 'high' ? t('analyze.status_high', 'Excessive') : t('analyze.status_low', 'Deficient');
                      return (
                        <div key={key} className={`nutrient-card ${statusClass}`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="nutrient-label">{info.label}</span>
                            <span className="badge" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>{statusLabel}</span>
                          </div>
                          <div className="nutrient-val">
                            {info.value} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{info.unit}</span>
                          </div>
                          <div className="nutrient-ideal">
                            {t('analyze.ideal_range', 'Ideal:')} {info.ideal_range[0]}–{info.ideal_range[1]} {info.unit}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5-PART AI ADVISORY & RECOMMENDED ACTIONS */}
              <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                  <span className="card-title">
                    <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
                    {t('analyze.advisory_title', 'AI Agronomic Recommendations')}
                  </span>
                  <span className={`badge badge-${getQualityBadgeClass(predictions.quality_status)}`}>
                    {predictions.quality_status}
                  </span>
                </div>

                <div className="advisory-list">
                  {/* Part 1: Recommended Action Card */}
                  {structured.recommended_action && (
                    <div className={`advisory-card ${predictions.quality_status === 'Good' ? 'good' : predictions.quality_status === 'Moderate' ? 'info' : 'critical'}`}>
                      <h4>
                        {predictions.quality_status === 'Good' ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                        {structured.recommended_action.headline}
                      </h4>
                      <p style={{ fontWeight: 600 }}>{structured.recommended_action.primary_action}</p>
                      {structured.recommended_action.action_steps && (
                        <ul style={{ paddingLeft: 'var(--space-lg)', margin: '6px 0 0' }}>
                          {structured.recommended_action.action_steps.map((step, idx) => (
                            <li key={idx} style={{ marginBottom: 4 }}>{step}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Part 2: Nutritional Guidance */}
                  {structured.nutritional_guidance && (
                    <div className="advisory-card info">
                      <h4>
                        <Wheat size={18} style={{ color: 'var(--color-info)' }} />
                        Nutritional Guidance & Daily Feeding Ration
                      </h4>
                      <p>{structured.nutritional_guidance.feeding_ration_tip}</p>
                      {structured.nutritional_guidance.highlights && (
                        <ul style={{ paddingLeft: 'var(--space-lg)', margin: '4px 0 0' }}>
                          {structured.nutritional_guidance.highlights.map((hl, idx) => (
                            <li key={idx}>{hl}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Part 3: Adulteration Warning (if applicable) */}
                  {structured.adulteration_warning?.detected && (
                    <div className="advisory-card critical">
                      <h4>
                        <XCircle size={18} style={{ color: 'var(--color-unsafe)' }} />
                        {structured.adulteration_warning.warning_message}
                      </h4>
                      <ul style={{ paddingLeft: 'var(--space-lg)', margin: '4px 0 0' }}>
                        {structured.adulteration_warning.remediation?.map((rem, idx) => (
                          <li key={idx}>{rem}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Part 4: Storage & Spoilage Tips */}
                  {structured.storage_spoilage_guidance && (
                    <div className={`advisory-card ${structured.storage_spoilage_guidance.severity === 'critical' ? 'critical' : 'warning'}`}>
                      <h4>
                        <Lightbulb size={18} style={{ color: 'var(--color-wheat)' }} />
                        Feed Storage & Spoilage Prevention
                      </h4>
                      <p>{structured.storage_spoilage_guidance.guidance_message}</p>
                      <ul style={{ paddingLeft: 'var(--space-lg)', margin: '4px 0 0' }}>
                        {structured.storage_spoilage_guidance.storage_tips?.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* QR TRACEABILITY BATCH CERTIFICATE */}
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleGenerateQR}
                  disabled={generatingQR}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <QrCode size={18} />
                  {generatingQR ? t('common.loading', 'Generating...') : t('analyze.generate_qr', 'Generate Certified Batch QR')}
                </button>
              </div>

              {qrData && (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
                    {t('analyze.batch_id', 'Batch Certificate ID:')} {qrData.batch_id}
                  </h4>
                  <div className="qr-display" style={{ margin: '0 auto var(--space-sm)' }}>
                    <img src={qrData.qr_image} alt="Feed Batch QR Code" style={{ width: 150, height: 150 }} />
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {t('analyze.qr_scan_note', 'Scan this tamper-evident QR code to verify feed safety and nutritional parameters.')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* EMPTY INITIAL STATE */
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
              <Wheat size={54} style={{ opacity: 0.25, color: 'var(--color-primary)', margin: '0 auto var(--space-md)' }} />
              <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>
                {t('analyze.ready_to_test_title', 'Ready to Test Feed')}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: 380, margin: '0 auto var(--space-lg)', lineHeight: 1.5 }}>
                {t('analyze.ready_to_test_desc', 'Select your feed type and input method on the left, then click ANALYZE FEED to generate your AI diagnosis.')}
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, background: 'var(--color-primary-light)', padding: '6px 14px', borderRadius: 'var(--radius-full)' }}>
                <Zap size={14} />
                <span>Tip: Switch to "DEMO MODE" for rapid testing scenarios</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
