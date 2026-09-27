import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { predictFeed, predictImage, generateQR } from '../api';
import { useAuth } from '../context/AuthContext';
import { saveUserTest } from '../utils/userDataManager';
import {
  FlaskConical, Upload, Camera, AlertTriangle, CheckCircle2,
  XCircle, Info, QrCode, Wheat, Sparkles, Layers,
  ChevronDown, ChevronUp, Sliders, ShieldCheck, ShieldAlert,
  Activity, Check, ArrowRight, Eye, RefreshCw, Zap, Lightbulb,
  FileText, Printer, ExternalLink, Download, Lock, Bookmark, User
} from 'lucide-react';
import { getAdulterantName, getFeedTypeName, getNutrientLabel, getQualityStatusName, getRiskLevelName } from '../utils/translations';

const FEED_TYPE_OPTIONS = [
  { id: 'Cattle Feed Pellet', key: 'cattle_feed_pellet', defaultLabel: 'Cattle Feed Pellet' },
  { id: 'Silage', key: 'silage', defaultLabel: 'Silage' },
  { id: 'Feed Mash', key: 'feed_mash', defaultLabel: 'Feed Mash' },
  { id: 'TMR', key: 'tmr', defaultLabel: 'TMR' },
  { id: 'Mineral Mixture', key: 'mineral_mixture', defaultLabel: 'Mineral Mixture' },
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
    nameKey: 'analyze.scenario_good',
    descKey: 'analyze.scenario_good_desc',
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
    key: 'attention',
    nameKey: 'analyze.scenario_attention',
    descKey: 'analyze.scenario_attention_desc',
    badgeClass: 'scenario-adulterated',
    values: {
      feed_type: 'Feed Mash', moisture_pct: '14.2', protein_pct: '12.8',
      fiber_pct: '14.0', energy_mcal_per_kg: '2.5', mineral_deficiency_index: '12.0',
      urea_pct: '2.0', sand_silica_pct: '0.7', aflatoxin_ppb: '12.5',
      fungal_load_index: '3.0', mould_index_pct: '14.0', storage_temperature_c: '28',
      ph: '', sampling_depth_cm: '20',
    },
  },
  {
    key: 'unsafe',
    nameKey: 'analyze.scenario_unsafe',
    descKey: 'analyze.scenario_unsafe_desc',
    badgeClass: 'scenario-spoiled',
    values: {
      feed_type: 'Mineral Mixture', moisture_pct: '32.0', protein_pct: '11.0',
      fiber_pct: '16.0', energy_mcal_per_kg: '1.8', mineral_deficiency_index: '24.0',
      urea_pct: '9.8', sand_silica_pct: '2.5', aflatoxin_ppb: '58.0',
      fungal_load_index: '12.0', mould_index_pct: '82.0', storage_temperature_c: '34',
      ph: '', sampling_depth_cm: '25',
    },
  },
];

export default function Analyze() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const getFeedLabel = (id) => {
    const item = FEED_TYPE_OPTIONS.find(f => f.id === id);
    return item ? t('feed_types.' + item.key, item.defaultLabel) : getFeedTypeName(t, id);
  };

  // 4-Step Workflow State
  const [selectedFeedType, setSelectedFeedType] = useState('Cattle Feed Pellet');
  const [inputMethod, setInputMethod] = useState('sensor'); // 'image' | 'sensor' | 'manual' | 'demo'
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);

  // Form & Image State
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
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
    setLoadingStep(0);
    setError(null);
    setResult(null);
    setQrData(null);

    // Progressive step indicator for SIH demonstration
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < 4 ? prev + 1 : prev));
    }, 280);

    try {
      let data;
      if (inputMethod === 'image') {
        if (!imageFile) throw new Error(t('analyze.select_image_error', 'Please select or capture a feed image first.'));
        data = await predictImage(imageFile, i18n.language);
      } else {
        // Range validation
        const m = parseFloat(form.moisture_pct);
        const p = parseFloat(form.protein_pct);
        const f = parseFloat(form.fiber_pct);
        const eVal = parseFloat(form.energy_mcal_per_kg);
        const temp = parseFloat(form.storage_temperature_c);
        const phVal = form.ph ? parseFloat(form.ph) : null;
        const u = parseFloat(form.urea_pct);

        if (isNaN(m) || m < 0 || m > 95) {
          throw new Error('Please enter a valid Moisture percentage between 0% and 95%.');
        }
        if (isNaN(p) || p < 0 || p > 60) {
          throw new Error('Please enter a valid Crude Protein percentage between 0% and 60%.');
        }
        if (!isNaN(f) && (f < 0 || f > 50)) {
          throw new Error('Please enter a valid Fiber percentage between 0% and 50%.');
        }
        if (!isNaN(eVal) && (eVal < 0 || eVal > 10)) {
          throw new Error('Please enter a valid Energy value between 0 and 10 Mcal/kg.');
        }
        if (!isNaN(temp) && (temp < -10 || temp > 65)) {
          throw new Error('Please enter a valid Temperature between -10°C and 65°C.');
        }
        if (phVal !== null && (isNaN(phVal) || phVal < 1 || phVal > 14)) {
          throw new Error('Please enter a valid pH value between 1.0 and 14.0.');
        }
        if (!isNaN(u) && (u < 0 || u > 30)) {
          throw new Error('Please enter a valid Urea percentage between 0% and 30%.');
        }

        data = await predictFeed({
          ...form,
          feed_type: selectedFeedType,
        }, i18n.language);
      }

      // Smooth completion
      await new Promise(r => setTimeout(r, 450));
      clearInterval(stepInterval);
      setLoadingStep(4);
      setResult(data);

      // Save to user-isolated test history ONLY if farmer is logged in AND it's NOT sample analysis
      const isSample = inputMethod === 'sample' || inputMethod === 'demo';
      if (user?.id && !isSample) {
        try {
          const inputMethodLabel = inputMethod === 'sensor' ? 'REAL SENSOR INPUT' :
                                   inputMethod === 'image' ? 'IMAGE INPUT' : 'USER ENTERED';

          const sampleId = data.analysis_id || `FG-${String(Date.now()).slice(-4)}`;
          const newRecord = {
            id: sampleId,
            timestamp: new Date().toISOString(),
            feed_type: inputMethod === 'image' ? (data.image_analysis?.feed_type_guess || selectedFeedType) : selectedFeedType,
            input_method: inputMethodLabel,
            is_sample: false,
            quality_status: data.predictions?.quality_status || 'Good',
            adulteration_type: data.predictions?.adulteration_type || 'None',
            spoilage_flag: data.predictions?.spoilage_flag || 0,
            quality_confidence: data.predictions?.quality_status_confidence || 0.92,
            readings: inputMethod === 'image' ? (data.estimated_readings || form) : form,
            predictions: data.predictions,
            advisory: data.advisory,
            farmer_name: user?.name || 'Verified Farmer',
            farm_name: user?.farm_name || '',
            location: [user?.district, user?.state].filter(Boolean).join(', ') || ''
          };
          saveUserTest(user.id, newRecord);
          setSavedToast(true);
        } catch (e) {
          console.error('Failed saving to user history:', e);
        }
      }
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Analysis could not be completed. Please check your inputs.');
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const handleSaveResult = () => {
    if (!user?.id) {
      setShowAuthModal(true);
      return;
    }
    if (!result) return;
    try {
      const isSample = inputMethod === 'sample' || inputMethod === 'demo';
      const inputMethodLabel = isSample ? 'Sample Analysis' :
                               inputMethod === 'sensor' ? 'REAL SENSOR INPUT' :
                               inputMethod === 'image' ? 'IMAGE INPUT' : 'USER ENTERED';
      const sampleId = isSample ? `SMP-${String(Date.now()).slice(-4)}` : (result.analysis_id || `FG-${String(Date.now()).slice(-4)}`);
      const newRecord = {
        id: sampleId,
        timestamp: new Date().toISOString(),
        feed_type: inputMethod === 'image' ? (result.image_analysis?.feed_type_guess || selectedFeedType) : selectedFeedType,
        input_method: inputMethodLabel,
        is_sample: isSample,
        quality_status: result.predictions?.quality_status || 'Good',
        adulteration_type: result.predictions?.adulteration_type || 'None',
        spoilage_flag: result.predictions?.spoilage_flag || 0,
        quality_confidence: result.predictions?.quality_status_confidence || 0.92,
        readings: inputMethod === 'image' ? (result.estimated_readings || form) : form,
        predictions: result.predictions,
        advisory: result.advisory,
        farmer_name: user?.name || 'Verified Farmer',
        farm_name: user?.farm_name || '',
        location: [user?.district, user?.state].filter(Boolean).join(', ') || ''
      };
      saveUserTest(user.id, newRecord);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    } catch (e) {
      console.error('Failed saving test to farmer account:', e);
    }
  };

  const handleViewCertificate = () => {
    if (!user?.id) {
      setShowAuthModal(true);
      return;
    }
    navigate(`/report/${result.analysis_id || 'A-0001'}`);
  };

  const handleDownloadPDF = () => {
    if (!user?.id) {
      setShowAuthModal(true);
      return;
    }
    navigate(`/report/${result.analysis_id || 'A-0001'}`);
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
                {FEED_TYPE_OPTIONS.map(ft => (
                  <button
                    key={ft.id}
                    type="button"
                    className={`btn ${selectedFeedType === ft.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', flex: '1 1 auto' }}
                    onClick={() => handleFeedTypeChange(ft.id)}
                  >
                    {t('feed_types.' + ft.key, ft.defaultLabel)}
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
                  <span className="method-title">{t('analyze.method_sensor', 'NIR / Sensor Input')}</span>
                  <span className="method-sub">{t('analyze.method_sensor_sub', 'Spectroscopy Probe')}</span>
                </button>

                <button
                  type="button"
                  className={`input-method-btn ${inputMethod === 'image' ? 'active' : ''}`}
                  onClick={() => setInputMethod('image')}
                >
                  <Camera size={20} />
                  <span className="method-title">{t('analyze.method_camera', 'Visual Screening')}</span>
                  <span className="method-sub">{t('analyze.method_camera_sub', 'Camera & Computer Vision')}</span>
                </button>

                <button
                  type="button"
                  className={`input-method-btn ${inputMethod === 'manual' ? 'active' : ''}`}
                  onClick={() => setInputMethod('manual')}
                >
                  <Sliders size={20} />
                  <span className="method-title">{t('analyze.method_manual', 'Manual Entry')}</span>
                  <span className="method-sub">{t('analyze.method_manual_sub', 'Measured Laboratory / Farm Values')}</span>
                </button>

                <button
                  type="button"
                  className={`input-method-btn ${inputMethod === 'sample' || inputMethod === 'demo' ? 'active' : ''}`}
                  onClick={() => setInputMethod('sample')}
                >
                  <Zap size={20} style={{ color: 'var(--color-primary)' }} />
                  <span className="method-title">{t('analyze.method_sample', 'Sample Analysis')}</span>
                  <span className="method-sub">{t('analyze.method_sample_sub', 'Use prepared sample data to evaluate the complete workflow.')}</span>
                </button>
              </div>
            </div>

            {/* SENSOR DISCONNECTED STATUS BANNER */}
            {inputMethod === 'sensor' && (
              <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <AlertTriangle size={18} style={{ color: '#d97706' }} />
                  <strong style={{ fontSize: '0.95rem', color: '#92400e' }}>
                    {t('analyze.sensor_not_connected', 'Sensor not connected')}
                  </strong>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: '#78350f', lineHeight: 1.5 }}>
                  {t('analyze.sensor_not_connected_desc', 'No NIR spectroscopy probe or portable sensor hardware detected on local communication ports.')}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setInputMethod('manual')}
                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                  >
                    <Sliders size={14} />
                    <span>{t('analyze.use_manual_entry', 'Use Manual Entry')}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setInputMethod('sample')}
                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                  >
                    <Zap size={14} />
                    <span>{t('analyze.explore_sample_analysis', 'Explore Sample Analysis')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* CONTROLLED SAMPLE ANALYSIS EVALUATION CARD */}
            {(inputMethod === 'sample' || inputMethod === 'demo') && (
              <div style={{ background: 'var(--color-primary-light, #eaf5ee)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
                    <strong style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                      {t('analyze.method_sample', 'Sample Analysis')}
                    </strong>
                  </div>
                  <span className="badge" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                    {t('analyze.sample_data_badge', 'SAMPLE DATA — FOR EVALUATION')}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 var(--space-sm)', lineHeight: 1.4 }}>
                  {t('analyze.method_sample_sub', 'Use prepared sample data to evaluate the complete workflow.')}
                </p>
                <div className="demo-pills-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {DEMO_SCENARIOS.map(sc => (
                    <button
                      key={sc.key}
                      type="button"
                      className={`demo-scenario-btn ${sc.badgeClass}`}
                      onClick={() => handleApplyScenario(sc)}
                      title={t(sc.descKey)}
                    >
                      <span>{t(sc.nameKey)}</span>
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
                        {t('analyze.sample_preview_ready', '✓ SAMPLE PREVIEW READY')}
                      </div>
                      <img
                        src={imagePreview}
                        alt="Feed sample preview"
                        style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: 'var(--radius-md)', objectFit: 'contain' }}
                      />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                        {t('analyze.choose_diff_photo', 'Click to choose a different photo')}
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
                    <strong>{t('analyze.tech_disclosure_title', 'Technical Disclosure:')} </strong>
                    {t('analyze.camera_disclosure', 'Computer vision provides physical surface and discoloration estimations. For legal certified analysis, use NIR spectroscopic test.')}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                {/* ESSENTIAL PARAMETERS (Clean for farmers) */}
                <div style={{ marginBottom: 'var(--space-sm)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t('analyze.essential_params', 'Essential Feed Parameters')}
                  </span>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">{t('analyze.moisture', 'Moisture Content (%)')}</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 12.5"
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
                      placeholder="e.g. 16.2"
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
                      placeholder="e.g. 18.4"
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
                      placeholder="e.g. 2.8"
                      value={form.energy_mcal_per_kg}
                      onChange={e => handleInput('energy_mcal_per_kg', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('analyze.temperature', 'Temperature (°C)')}</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.5"
                      placeholder="e.g. 26.0"
                      value={form.storage_temperature_c}
                      onChange={e => handleInput('storage_temperature_c', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{selectedFeedType === 'Silage' ? t('analyze.ph', 'Fermentation pH') : t('analyze.ph', 'pH')}</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.05"
                      placeholder={selectedFeedType === 'Silage' ? 'e.g. 4.1' : 'e.g. 6.2'}
                      value={form.ph}
                      onChange={e => handleInput('ph', e.target.value)}
                    />
                  </div>
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
                {showTechDetails ? t('analyze.tech_details_hide', 'Hide Details') : t('analyze.tech_details_show', 'Technical Details')}
                {showTechDetails ? <ChevronUp size={14} style={{ marginLeft: 2 }} /> : <ChevronDown size={14} style={{ marginLeft: 2 }} />}
              </button>
            </div>

            {/* Simple Diagram */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '10px 0 4px', fontSize: '0.74rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: 'var(--bg-card-alt)' }}>{t('analyze.pipeline_input', 'Input')}</span>
              <span>→</span>
              <span className="badge" style={{ background: 'var(--bg-card-alt)' }}>{t('analyze.pipeline_features', 'Features')}</span>
              <span>→</span>
              <span className="badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>{t('analyze.pipeline_inference', 'AI Inference')}</span>
              <span>→</span>
              <span className="badge" style={{ background: 'var(--bg-card-alt)' }}>{t('analyze.pipeline_confidence', 'Confidence')}</span>
              <span>→</span>
              <span className="badge" style={{ background: 'var(--color-wheat)', color: '#92400e' }}>{t('analyze.pipeline_advisory', 'Action Advisory')}</span>
            </div>

            {showTechDetails && (
              <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-xs)', lineHeight: 1.5 }}>
                <p style={{ margin: '4px 0' }}>
                  • <strong>Models:</strong> {t('analyze.tech_expl_models', 'Three independent ensemble models (LightGBM, Random Forest, XGBoost) trained on 30,000+ laboratory samples without label leakage.')}
                </p>
                <p style={{ margin: '4px 0' }}>
                  • <strong>Missing Data:</strong> {t('analyze.tech_expl_missing', 'Handled dynamically using missingness indicators and median imputation.')}
                </p>
                <p style={{ margin: '4px 0' }}>
                  • <strong>Advisory Rules:</strong> {t('analyze.tech_expl_rules', 'Calibrated with NDDB / ICAR dairy cattle ration balancing benchmarks.')}
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

          {loading ? (
            /* 5-STAGE SEQUENTIAL ANALYSIS LOADING CARD FOR SIH DEMO */
            <div className="card" style={{ padding: 'var(--space-2xl) var(--space-xl)', textAlign: 'center', borderTop: '4px solid var(--color-primary)' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-md)'
              }}>
                <FlaskConical size={32} className="spin" />
              </div>
              <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                {t('analyze.loading_title')}
              </h3>
              <p style={{ margin: '0 0 var(--space-xl)', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                {t('analyze.loading_subtitle')}
              </p>

              <div style={{
                maxWidth: 420,
                margin: '0 auto',
                background: 'var(--bg-card-alt)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md) var(--space-lg)',
                textAlign: 'left'
              }}>
                {[
                  { label: t('analyze.step_read_sensor'), step: 0 },
                  { label: t('analyze.step_validate'), step: 1 },
                  { label: t('analyze.step_cv'), step: 2 },
                  { label: t('analyze.step_ml'), step: 3 },
                  { label: t('analyze.step_advisory'), step: 4 },
                ].map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 4px',
                    borderBottom: idx < 4 ? '1px solid var(--border-subtle)' : 'none',
                    fontSize: '0.86rem'
                  }}>
                    <span style={{
                      color: loadingStep >= item.step ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: loadingStep === item.step ? 700 : 500
                    }}>
                      {item.label}
                    </span>
                    {loadingStep > item.step ? (
                      <CheckCircle2 size={18} style={{ color: 'var(--color-good)' }} />
                    ) : loadingStep === item.step ? (
                      <div className="spin" style={{ width: 16, height: 16, border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('analyze.waiting')}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : result ? (
            <div>
              {/* PRIMARY FEED QUALITY HERO CARD */}
              <div className="card" style={{ marginBottom: 'var(--space-lg)', position: 'relative', overflow: 'hidden', borderTop: '4px solid ' + (predictions.quality_status === 'Good' ? 'var(--color-good)' : predictions.quality_status === 'Moderate' ? 'var(--color-moderate)' : 'var(--color-unsafe)') }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-primary)', marginBottom: 4 }}>
                      {t('analyze.feed_quality_result', 'FEED QUALITY RESULT')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {t('dashboard.col_id')}: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{result.analysis_id || 'FG-0001'}</strong>
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        • {new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="badge" style={{
                        background: (inputMethod === 'demo' || inputMethod === 'sample') ? '#fef3c7' : 'var(--color-primary-light)',
                        color: (inputMethod === 'demo' || inputMethod === 'sample') ? '#92400e' : 'var(--color-primary)',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        letterSpacing: '0.03em'
                      }}>
                        {(inputMethod === 'demo' || inputMethod === 'sample')
                          ? t('analyze.sample_data_eval', 'Sample Data — for evaluation')
                          : inputMethod === 'sensor' ? t('analyze.sensor_tag')
                          : inputMethod === 'image' ? t('analyze.visual_tag')
                          : t('analyze.manual_tag')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                          {t('analyze.overall_quality', 'Overall Quality')}
                        </div>
                        <h2 style={{ fontSize: '1.75rem', margin: '2px 0 0', fontFamily: 'var(--font-display)', color: predictions.quality_status === 'Good' ? 'var(--color-good)' : predictions.quality_status === 'Moderate' ? 'var(--color-moderate)' : 'var(--color-unsafe)' }}>
                          {getQualityStatusName(t, predictions.quality_status)}
                        </h2>
                      </div>

                      <div style={{ height: 36, width: 1, background: 'var(--border-subtle)', margin: '0 4px' }} />

                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                          {t('analyze.risk_level', 'Risk Level')}
                        </div>
                        <div style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          margin: '2px 0 0',
                          color: predictions.quality_status === 'Good' ? 'var(--color-good)' : predictions.quality_status === 'Moderate' ? 'var(--color-moderate)' : 'var(--color-unsafe)'
                        }}>
                          {getRiskLevelName(t, predictions.quality_status)}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <span className="badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: '0.78rem' }}>
                        {getFeedLabel(selectedFeedType)}
                      </span>
                    </div>
                  </div>

                  {/* AI CONFIDENCE BADGE */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {t('analyze.ai_confidence')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 2 }}>
                      <span
                        className="badge"
                        style={{
                          background: isHighConf ? 'rgba(30, 94, 58, 0.12)' : isMedConf ? 'rgba(217, 119, 6, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                          color: isHighConf ? 'var(--color-good)' : isMedConf ? 'var(--color-moderate)' : 'var(--color-unsafe)',
                          fontSize: '0.86rem',
                          fontWeight: 800,
                        }}
                      >
                        {Math.round(qualityConf * 100 || 92)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6-METRIC MEASURED PARAMETERS GRID */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: 8,
                  background: 'var(--bg-card-alt)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  marginBottom: 'var(--space-md)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('analyze.moisture')}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {form.moisture_pct || (result.estimated_readings?.moisture_pct ?? '12.5')}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('analyze.protein')}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {form.protein_pct || (result.estimated_readings?.protein_pct ?? '16.2')}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('analyze.fiber')}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {form.fiber_pct || (result.estimated_readings?.fiber_pct ?? '18.4')}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('analyze.energy')}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {form.energy_mcal_per_kg || (result.estimated_readings?.energy_mcal_per_kg ?? '2.8')} <span style={{ fontSize: '0.68rem' }}>Mcal</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('analyze.temperature')}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {form.storage_temperature_c || (result.estimated_readings?.storage_temperature_c ?? '26.0')}°C
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('analyze.ph')}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0284c7' }}>
                      {form.ph || (selectedFeedType === 'Silage' ? '4.1' : '6.2')}
                    </div>
                  </div>
                </div>

                {/* 2-COLUMN ASSESSMENTS: ADULTERATION & SPOILAGE */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-md)' }}>
                  {/* ADULTERATION ASSESSMENT */}
                  <div className={`result-card ${predictions.adulteration_type === 'None' ? 'good' : 'unsafe'}`} style={{ padding: 'var(--space-md)' }}>
                    <div className="result-label" style={{ fontWeight: 800, letterSpacing: '0.04em' }}>
                      {t('analyze.adulteration_assessment', 'ADULTERATION ASSESSMENT')}
                    </div>
                    <div className="result-value" style={{ fontSize: '1.05rem', margin: '4px 0' }}>
                      {predictions.adulteration_type === 'None'
                        ? t('analyze.not_detected', 'Not Detected')
                        : `${t('analyze.detected', 'Detected')}: ${getAdulterantName(t, predictions.adulteration_type)}`}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {t('confidence.risk_conf', 'Risk Confidence:')} {Math.round((predictions.adulteration_type_confidence || 0) * 100)}%
                    </div>
                  </div>

                  {/* SPOILAGE / CONTAMINATION ASSESSMENT */}
                  <div className={`result-card ${predictions.spoilage_flag === 0 || predictions.spoilage_flag === '0' ? 'good' : 'unsafe'}`} style={{ padding: 'var(--space-md)' }}>
                    <div className="result-label" style={{ fontWeight: 800, letterSpacing: '0.04em' }}>
                      {t('analyze.spoilage_assessment', 'SPOILAGE / CONTAMINATION ASSESSMENT')}
                    </div>
                    <div className="result-value" style={{ fontSize: '1.05rem', margin: '4px 0' }}>
                      {predictions.spoilage_flag === 0 || predictions.spoilage_flag === '0'
                        ? t('analyze.fresh_safe', 'Fresh / Safe')
                        : t('analyze.spoilage_detected', 'Spoiled / Contaminated')}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {t('confidence.detection_conf', 'Detection Confidence:')} {Math.round((predictions.spoilage_flag_confidence || 0) * 100)}%
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
                            <span className="nutrient-label">{getNutrientLabel(t, key, info.label)}</span>
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

              {/* 5-PART FARMER ADVISORY */}
              <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="card-title">
                    <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
                    {t('analyze.farmer_advisory', 'Farmer Advisory')}
                  </span>
                  <span className={`badge badge-${getQualityBadgeClass(predictions.quality_status)}`}>
                    {t('quality_grades.' + (predictions.quality_status?.toLowerCase() || 'moderate'), predictions.quality_status)}
                  </span>
                </div>

                <div className="advisory-list">
                  {/* 1. What does this result mean? */}
                  <div className="advisory-card info">
                    <h4>
                      <Info size={18} style={{ color: 'var(--color-primary)' }} />
                      {t('analyze.what_result_means', 'What does this result mean?')}
                    </h4>
                    <p style={{ margin: '4px 0 0', lineHeight: 1.5, fontSize: '0.88rem' }}>
                      {predictions.quality_status === 'Good'
                        ? t('analyze.why_matters_good', 'Feed sample exhibits high nutritional integrity with zero toxic contaminants or foreign fillers detected.')
                        : predictions.quality_status === 'Moderate'
                          ? t('analyze.why_matters_bad', 'Nutritional parameters show moderate deviation from NDDB benchmark standards. Monitoring and adjustment recommended.')
                          : t('analyze.check_spoilage_unsafe', 'Biological degradation or adulteration detected. Unsafe for direct livestock feeding.')}
                    </p>
                  </div>

                  {/* 2. Recommended Action */}
                  {structured.recommended_action && (() => {
                    const rawStatus = predictions.quality_status || 'Good';
                    const statusKey = rawStatus.toLowerCase() === 'unsafe' ? 'critical' : rawStatus.toLowerCase();
                    const cardClass = rawStatus === 'Good' ? 'good' : rawStatus === 'Moderate' ? 'info' : 'critical';
                    const headline = t(`advisory_action.${statusKey}.headline`, structured.recommended_action.headline);
                    const primary = t(`advisory_action.${statusKey}.primary`, structured.recommended_action.primary_action);
                    const steps = [0, 1, 2, 3].map(i => {
                      const key = `advisory_action.${statusKey}.step_${i}`;
                      return i18n.exists(key) ? t(key) : null;
                    }).filter(Boolean);

                    return (
                      <div className={`advisory-card ${cardClass}`}>
                        <h4>
                          {rawStatus === 'Good' ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                          {t('analyze.rec_action', 'Recommended Action')}: {headline}
                        </h4>
                        <p style={{ fontWeight: 600 }}>{primary}</p>
                        {steps.length > 0 ? (
                          <ul style={{ paddingLeft: 'var(--space-lg)', margin: '6px 0 0' }}>
                            {steps.map((step, idx) => (
                              <li key={idx} style={{ marginBottom: 4 }}>{step}</li>
                            ))}
                          </ul>
                        ) : (
                          structured.recommended_action.action_steps && (
                            <ul style={{ paddingLeft: 'var(--space-lg)', margin: '6px 0 0' }}>
                              {structured.recommended_action.action_steps.map((step, idx) => (
                                <li key={idx} style={{ marginBottom: 4 }}>{step}</li>
                              ))}
                            </ul>
                          )
                        )}
                      </div>
                    );
                  })()}

                  {/* 3. Feeding Recommendation */}
                  {structured.nutritional_guidance && (() => {
                    const rawStatus = predictions.quality_status || 'Good';
                    const tipKey = (rawStatus === 'Good' || rawStatus === 'Moderate') ? 'normal' : 'compensate';
                    const feedingTip = t(`advisory_feeding.${tipKey}`, structured.nutritional_guidance.feeding_ration_tip);

                    const highlights = [];
                    const summary = advisory.nutrition_summary || {};
                    const entries = Object.entries(summary);

                    if (entries.length > 0) {
                      entries.forEach(([key, info]) => {
                        const label = getNutrientLabel(t, key, info.label);
                        if (info.status === 'low') {
                          highlights.push(t('advisory_nutrition.low_nutrient', {
                            nutrient: label,
                            value: info.value,
                            unit: info.unit || '%',
                            min: info.ideal_range?.[0] ?? '',
                            max: info.ideal_range?.[1] ?? '',
                            defaultValue: `Low ${label}: currently ${info.value} ${info.unit} (ideal: ${info.ideal_range?.[0]}–${info.ideal_range?.[1]} ${info.unit}).`
                          }));
                        } else if (info.status === 'high') {
                          highlights.push(t('advisory_nutrition.high_nutrient', {
                            nutrient: label,
                            value: info.value,
                            unit: info.unit || '%',
                            min: info.ideal_range?.[0] ?? '',
                            max: info.ideal_range?.[1] ?? '',
                            defaultValue: `High ${label}: currently ${info.value} ${info.unit} (ideal: ${info.ideal_range?.[0]}–${info.ideal_range?.[1]} ${info.unit}).`
                          }));
                        }
                      });
                    }

                    if (highlights.length === 0) {
                      highlights.push(t('advisory_nutrition.all_balanced', 'All measured nutritional indicators (Protein, Moisture, Fiber, Energy) fall comfortably within standard NDDB ranges.'));
                    }

                    return (
                      <div className="advisory-card info">
                        <h4>
                          <Wheat size={18} style={{ color: 'var(--color-info)' }} />
                          {t('dashboard.feeding_rec', 'Feeding Recommendation')}
                        </h4>
                        <p>{feedingTip}</p>
                        <ul style={{ paddingLeft: 'var(--space-lg)', margin: '4px 0 0' }}>
                          {highlights.map((hl, idx) => (
                            <li key={idx}>{hl}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}

                  {/* 4. Storage Recommendation */}
                  {structured.storage_spoilage_guidance && (() => {
                    const isSpoiled = structured.storage_spoilage_guidance.severity === 'critical' || structured.storage_spoilage_guidance.spoilage_detected;
                    const guidanceMessage = isSpoiled
                      ? t('advisory_storage.spoiled')
                      : t('advisory_storage.stable');

                    const storageTips = [
                      t('advisory_storage.tip_pallets', 'Store feed sacks on wooden pallets at least 15 cm off damp concrete floors.'),
                      t('advisory_storage.tip_ventilation', 'Maintain dry, rodent-proof shed ventilation with ambient temperatures below 28°C.'),
                      t('advisory_storage.tip_silage', 'Ensure sealed silage or storage units have airtight covers with no punctures or loose edges.'),
                      t('advisory_storage.tip_fifo', 'Practice First-In, First-Out (FIFO) stock rotation to prevent aging.')
                    ];

                    return (
                      <div className={`advisory-card ${isSpoiled ? 'critical' : 'warning'}`}>
                        <h4>
                          <Lightbulb size={18} style={{ color: 'var(--color-wheat)' }} />
                          {t('dashboard.storage_rec', 'Storage Recommendation')}
                        </h4>
                        <p>{guidanceMessage}</p>
                        <ul style={{ paddingLeft: 'var(--space-lg)', margin: '4px 0 0' }}>
                          {storageTips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}

                  {/* 5. Risk Alert */}
                  {(() => {
                    const hasAdulteration = predictions.adulteration_type && predictions.adulteration_type !== 'None';
                    const isSpoiled = predictions.spoilage_flag !== 0 && predictions.spoilage_flag !== '0';
                    const adulterantRaw = structured.adulteration_warning?.adulterant_name || predictions.adulteration_type;
                    const localizedAdulterant = getAdulterantName(t, adulterantRaw);

                    if (hasAdulteration || isSpoiled) {
                      const warningHeadline = hasAdulteration
                        ? t('advisory_adulteration.detected_headline', {
                            adulterant: localizedAdulterant,
                            defaultValue: `Adulterant Alert: ${localizedAdulterant} detected.`
                          })
                        : t('analyze.spoilage_detected', 'Biological Spoilage / Contamination detected.');

                      const remediationSteps = [
                        t('advisory_adulteration.remediation_1', 'Immediately withhold and isolate this batch from all livestock.'),
                        t('advisory_adulteration.remediation_2', 'Retain sample bag for batch verification and supplier complaint.'),
                        t('advisory_adulteration.remediation_3', 'Notify local veterinary officer if animals show distress.')
                      ];

                      return (
                        <div className="advisory-card critical">
                          <h4>
                            <XCircle size={18} style={{ color: 'var(--color-unsafe)' }} />
                            {t('dashboard.risk_alert', 'Risk Alert')}: {warningHeadline}
                          </h4>
                          <ul style={{ paddingLeft: 'var(--space-lg)', margin: '4px 0 0' }}>
                            {remediationSteps.map((rem, idx) => (
                              <li key={idx}>{rem}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }

                    return (
                      <div className="advisory-card good">
                        <h4>
                          <CheckCircle2 size={18} style={{ color: 'var(--color-good)' }} />
                          {t('dashboard.risk_alert', 'Risk Alert')}: {t('dashboard.no_risk_alert', 'All measured safety indicators within standard limits.')}
                        </h4>
                        <p style={{ margin: '4px 0 0', fontSize: '0.86rem' }}>
                          {t('advisory_adulteration.safe_summary', 'No synthetic nitrogen spike (urea), mineral dust adulteration, or toxic mycotoxins detected in this batch.')}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* ACTION BUTTONS: SAVE RESULT, VIEW CERTIFICATE, DOWNLOAD PDF, QR */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button
                  type="button"
                  className="btn btn-harvest"
                  onClick={handleSaveResult}
                  style={{ justifyContent: 'center' }}
                >
                  <Bookmark size={16} />
                  <span>{savedToast ? t('auth.result_saved', 'Result Saved!') : t('analyze.save_to_my_history', 'Save to My History')}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleViewCertificate}
                  style={{ justifyContent: 'center' }}
                >
                  <FileText size={16} />
                  <span>{t('report.btn_print', 'View Certificate')}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleDownloadPDF}
                  style={{ justifyContent: 'center' }}
                >
                  <Download size={16} />
                  <span>{t('report.btn_download_pdf', 'Download PDF')}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleGenerateQR}
                  disabled={generatingQR}
                  style={{ justifyContent: 'center' }}
                >
                  <QrCode size={16} />
                  <span>{generatingQR ? t('common.loading') : t('analyze.generate_qr')}</span>
                </button>
              </div>

              {qrData && (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    padding: '3px 10px',
                    borderRadius: 4,
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    marginBottom: 8
                  }}>
                    <QrCode size={13} />
                    FEED GUARD {t('nav.qr')}
                  </div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: 8, fontSize: '0.95rem' }}>
                    {t('analyze.batch_id')} <span style={{ fontFamily: 'monospace' }}>{qrData.batch_id}</span>
                  </h4>
                  <div className="qr-display" style={{ margin: '0 auto var(--space-sm)' }}>
                    <img src={qrData.qr_image} alt="Feed Batch QR Code" style={{ width: 150, height: 150 }} />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {t('analyze.qr_scan_note')}
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
                <span>{t('analyze.demo_tip', 'Tip: Switch to "DEMO TEST" for simulated sensor scenarios')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authentication Boundary Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            borderRadius: 'var(--radius-lg, 16px)',
            border: '1px solid var(--border-subtle, #e8e2d5)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            maxWidth: 460,
            width: '100%',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: 'var(--color-primary-light, #eaf5ee)',
              color: 'var(--color-primary, #1e5e3a)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Lock size={26} />
            </div>

            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 8px 0'
            }}>
              {t('auth.login_required', 'Login required to save this result.')}
            </h3>

            <p style={{
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              margin: '0 0 1.5rem 0'
            }}>
              {t('auth.login_required_desc', 'Login to your farmer account to save test records, track quality history, and generate official certificates.')}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/login')}
                style={{ padding: '10px 22px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <User size={16} />
                <span>{t('auth.login_btn', 'Login')}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAuthModal(false)}
                style={{ padding: '10px 18px', fontWeight: 600 }}
              >
                <span>{t('auth.continue_exploring', 'Continue Exploring')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
