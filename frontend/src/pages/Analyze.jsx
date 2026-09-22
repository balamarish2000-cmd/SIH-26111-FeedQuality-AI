import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { predictFeed, predictImage, generateQR } from '../api';
import {
  FlaskConical, Upload, Camera, AlertTriangle, CheckCircle2,
  XCircle, Info, QrCode, Wheat, Sparkles, Layers
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
  moisture_pct: '',
  protein_pct: '',
  fiber_pct: '',
  energy_mcal_per_kg: '',
  mineral_deficiency_index: '',
  urea_pct: '',
  sand_silica_pct: '',
  aflatoxin_ppb: '',
  fungal_load_index: '',
  mould_index_pct: '',
  storage_temperature_c: '',
  ph: '',
  sampling_depth_cm: '20',
};

const PRESETS = [
  {
    key: 'good',
    labelKey: 'analyze.preset_good',
    values: {
      feed_type: 'Cattle Feed Pellet', moisture_pct: '8.5', protein_pct: '16.2',
      fiber_pct: '11.0', energy_mcal_per_kg: '3.1', mineral_deficiency_index: '6.0',
      urea_pct: '1.1', sand_silica_pct: '0.3', aflatoxin_ppb: '1.2',
      fungal_load_index: '1.0', mould_index_pct: '4.0', storage_temperature_c: '24',
      ph: '', sampling_depth_cm: '20',
    },
  },
  {
    key: 'silage',
    labelKey: 'analyze.preset_silage',
    values: {
      feed_type: 'Silage', moisture_pct: '65.0', protein_pct: '9.5',
      fiber_pct: '28.0', energy_mcal_per_kg: '2.3', mineral_deficiency_index: '9.0',
      urea_pct: '1.4', sand_silica_pct: '0.8', aflatoxin_ppb: '2.0',
      fungal_load_index: '1.5', mould_index_pct: '8.0', storage_temperature_c: '22',
      ph: '4.1', sampling_depth_cm: '35',
    },
  },
  {
    key: 'contaminated',
    labelKey: 'analyze.preset_contaminated',
    values: {
      feed_type: 'Feed Mash', moisture_pct: '45.0', protein_pct: '13.0',
      fiber_pct: '15.0', energy_mcal_per_kg: '1.9', mineral_deficiency_index: '18.0',
      urea_pct: '1.8', sand_silica_pct: '1.0', aflatoxin_ppb: '55.0',
      fungal_load_index: '11.0', mould_index_pct: '78.0', storage_temperature_c: '33',
      ph: '', sampling_depth_cm: '25',
    },
  },
  {
    key: 'adulterated',
    labelKey: 'analyze.preset_adulterated',
    values: {
      feed_type: 'Mineral Mixture', moisture_pct: '10.0', protein_pct: '14.0',
      fiber_pct: '9.0', energy_mcal_per_kg: '2.6', mineral_deficiency_index: '20.0',
      urea_pct: '9.5', sand_silica_pct: '0.5', aflatoxin_ppb: '3.0',
      fungal_load_index: '2.0', mould_index_pct: '6.0', storage_temperature_c: '27',
      ph: '', sampling_depth_cm: '15',
    },
  },
];

function getResultClass(quality) {
  const map = { Good: 'good', Moderate: 'moderate', Poor: 'poor', Unsafe: 'unsafe' };
  return map[quality] || 'moderate';
}

function getSeverityIcon(severity) {
  switch (severity) {
    case 'critical': return <XCircle size={18} style={{ color: 'var(--color-unsafe)' }} />;
    case 'warning': return <AlertTriangle size={18} style={{ color: 'var(--color-moderate)' }} />;
    case 'good': return <CheckCircle2 size={18} style={{ color: 'var(--color-good)' }} />;
    default: return <Info size={18} style={{ color: 'var(--color-info)' }} />;
  }
}

export default function Analyze() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('manual');
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [qrData, setQrData] = useState(null);
  const fileInputRef = useRef(null);

  const handleInput = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePreset = (presetValues) => {
    setForm(presetValues);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setQrData(null);

    try {
      const data = await predictFeed(form);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageAnalysis = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setQrData(null);

    try {
      const data = await predictImage(imageFile);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!result) return;
    try {
      const qr = await generateQR(result.advisory, form);
      setQrData(qr);
    } catch (err) {
      setError(err.message);
    }
  };

  const predictions = result?.predictions || {};
  const advisory = result?.advisory || {};

  return (
    <div>
      <div className="page-header">
        <h1>{t('analyze.title')}</h1>
        <p>{t('analyze.subtitle')}</p>
      </div>

      <div className="two-col">
        {/* Left: Input Form */}
        <div>
          {/* Tabs */}
          <div className="tab-buttons">
            <button
              className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              <FlaskConical size={16} style={{ display: 'inline', marginRight: 6 }} />
              {t('analyze.tab_manual')}
            </button>
            <button
              className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
              onClick={() => setActiveTab('image')}
            >
              <Camera size={16} style={{ display: 'inline', marginRight: 6 }} />
              {t('analyze.tab_image')}
            </button>
          </div>

          {activeTab === 'manual' ? (
            <div className="card">
              {/* Presets */}
              <div className="presets-container">
                <span className="presets-label">{t('analyze.presets_title')}</span>
                <div className="presets-grid">
                  {PRESETS.map(({ key, labelKey, values }) => (
                    <button
                      key={key}
                      type="button"
                      className="preset-pill"
                      onClick={() => handlePreset(values)}
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                  <label className="form-label">{t('analyze.feed_type')}</label>
                  <select
                    className="form-select"
                    value={form.feed_type}
                    onChange={e => handleInput('feed_type', e.target.value)}
                  >
                    {FEED_TYPES.map(ft => (
                      <option key={ft} value={ft}>{ft}</option>
                    ))}
                  </select>
                </div>

                <div className="form-grid">
                  {[
                    ['moisture_pct', t('analyze.moisture'), '8.5'],
                    ['protein_pct', t('analyze.protein'), '16.0'],
                    ['fiber_pct', t('analyze.fiber'), '11.0'],
                    ['energy_mcal_per_kg', t('analyze.energy'), '3.0'],
                    ['mineral_deficiency_index', t('analyze.mineral'), '6.0'],
                    ['urea_pct', t('analyze.urea'), '1.1'],
                    ['sand_silica_pct', t('analyze.sand'), '0.3'],
                    ['aflatoxin_ppb', t('analyze.aflatoxin'), '1.2'],
                    ['fungal_load_index', t('analyze.fungal'), '1.0'],
                    ['mould_index_pct', t('analyze.mould'), '4.0'],
                    ['storage_temperature_c', t('analyze.temperature'), '24'],
                    ['ph', t('analyze.ph'), '4.1'],
                    ['sampling_depth_cm', t('analyze.depth'), '20'],
                  ].map(([field, label, placeholder]) => (
                    <div key={field} className="form-group">
                      <label className="form-label">{label}</label>
                      <input
                        className="form-input"
                        type="number"
                        step="any"
                        placeholder={placeholder}
                        value={form[field]}
                        onChange={e => handleInput(field, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                  style={{ width: '100%', marginTop: 'var(--space-md)', justifyContent: 'center' }}
                >
                  {loading ? (
                    <><div className="loading-spinner" style={{ width: 18, height: 18, margin: 0, borderWidth: 2 }} /> {t('analyze.analyzing')}</>
                  ) : (
                    <><FlaskConical size={18} /> {t('analyze.analyze_btn')}</>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="card">
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
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                {imagePreview ? (
                  <img src={imagePreview} alt="Feed preview" style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: 'var(--radius-md)' }} />
                ) : (
                  <>
                    <div className="upload-icon">📸</div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {t('analyze.upload_title')}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {t('analyze.upload_desc')}
                    </p>
                  </>
                )}
              </div>

              {imageFile && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleImageAnalysis}
                  disabled={loading}
                  style={{ width: '100%', marginTop: 'var(--space-md)', justifyContent: 'center' }}
                >
                  {loading ? (
                    <><div className="loading-spinner" style={{ width: 18, height: 18, margin: 0, borderWidth: 2 }} /> {t('analyze.analyzing')}</>
                  ) : (
                    <><Upload size={18} /> {t('analyze.upload_btn')}</>
                  )}
                </button>
              )}

              {/* Image analysis visual notes */}
              {result?.image_analysis && (
                <div style={{ marginTop: 'var(--space-lg)' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>
                    {t('analyze.image_notes_title')}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                    {t('analyze.detected_feed_type')}{' '}
                    <strong style={{ color: 'var(--color-primary)' }}>{result.image_analysis.feed_type_guess}</strong>
                  </p>
                  {result.image_analysis.analysis_notes?.map((note, i) => (
                    <div key={i} className="alert alert-info" style={{ marginBottom: 4 }}>
                      <Info size={14} /> {note}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Results Display */}
        <div>
          {error && (
            <div className="alert alert-warning">
              <AlertTriangle size={18} /> {error}
            </div>
          )}

          {result && (
            <div>
              {/* 3 Main Diagnostic Cards */}
              <div className="result-grid">
                <div className={`result-card ${getResultClass(predictions.quality_status)}`}>
                  <div className="result-label">{t('analyze.quality')}</div>
                  <div className="result-value">{predictions.quality_status}</div>
                  <div className="result-confidence">
                    {t('analyze.confidence')}: {(predictions.quality_status_confidence * 100).toFixed(1)}%
                  </div>
                  <div className="confidence-bar">
                    <div className="fill" style={{
                      width: `${predictions.quality_status_confidence * 100}%`,
                      background: 'currentColor',
                    }} />
                  </div>
                </div>

                <div className={`result-card ${predictions.adulteration_type === 'None' ? 'good' : 'unsafe'}`}>
                  <div className="result-label">{t('analyze.adulteration')}</div>
                  <div className="result-value" style={{ fontSize: '1.15rem' }}>
                    {predictions.adulteration_type === 'None' ? t('common.none') : predictions.adulteration_type}
                  </div>
                  <div className="result-confidence">
                    {t('analyze.confidence')}: {(predictions.adulteration_type_confidence * 100).toFixed(1)}%
                  </div>
                  <div className="confidence-bar">
                    <div className="fill" style={{
                      width: `${predictions.adulteration_type_confidence * 100}%`,
                      background: 'currentColor',
                    }} />
                  </div>
                </div>

                <div className={`result-card ${predictions.spoilage_flag === 0 || predictions.spoilage_flag === '0' ? 'good' : 'unsafe'}`}>
                  <div className="result-label">{t('analyze.spoilage')}</div>
                  <div className="result-value">
                    {predictions.spoilage_flag === 0 || predictions.spoilage_flag === '0' ? t('common.not_spoiled') : t('common.spoiled')}
                  </div>
                  <div className="result-confidence">
                    {t('analyze.confidence')}: {(predictions.spoilage_flag_confidence * 100).toFixed(1)}%
                  </div>
                  <div className="confidence-bar">
                    <div className="fill" style={{
                      width: `${predictions.spoilage_flag_confidence * 100}%`,
                      background: 'currentColor',
                    }} />
                  </div>
                </div>
              </div>

              {/* Nutritional Analysis Summary */}
              {advisory.nutrition_summary && Object.keys(advisory.nutrition_summary).length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">
                      <Wheat size={18} style={{ color: 'var(--color-primary)' }} />
                      {t('analyze.nutrition_analysis')}
                    </span>
                  </div>
                  <div className="nutrient-grid">
                    {Object.entries(advisory.nutrition_summary).map(([key, info]) => {
                      const statusClass = info.status === 'normal' ? 'normal' : info.status === 'high' ? 'high' : 'low';
                      const statusLabel = info.status === 'normal' ? t('analyze.status_normal') : info.status === 'high' ? t('analyze.status_high') : t('analyze.status_low');
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
                            {t('analyze.ideal_range')} {info.ideal_range[0]}–{info.ideal_range[1]} {info.unit}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Farmer Advisories List */}
              {advisory.advisories && advisory.advisories.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">
                      <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
                      {t('analyze.advisory_title')}
                    </span>
                    <span className={`badge badge-${getResultClass(advisory.quality_grade)}`}>
                      {advisory.quality_grade}
                    </span>
                  </div>
                  <div className="advisory-list">
                    {advisory.advisories.map((adv, i) => (
                      <div key={i} className={`advisory-card ${adv.severity}`}>
                        <h4>{getSeverityIcon(adv.severity)} {adv.title}</h4>
                        <p>{adv.message}</p>
                        {adv.actions && (
                          <ul>
                            {adv.actions.map((act, j) => (
                              <li key={j}>{act}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QR Certificate Generator */}
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn btn-secondary" onClick={handleGenerateQR}>
                  <QrCode size={18} />
                  {t('analyze.generate_qr')}
                </button>
              </div>

              {qrData && (
                <div className="card" style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
                    {t('analyze.batch_id')} {qrData.batch_id}
                  </h4>
                  <div className="qr-display">
                    <img src={qrData.qr_image} alt="Feed Batch QR Code" />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {t('analyze.qr_scan_note')}
                  </p>
                </div>
              )}
            </div>
          )}

          {!result && !error && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
              <Wheat size={48} style={{ opacity: 0.3, color: 'var(--color-primary)', margin: '0 auto var(--space-md)' }} />
              <h3 style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1rem' }}>
                {t('analyze.empty_state')}
              </h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
