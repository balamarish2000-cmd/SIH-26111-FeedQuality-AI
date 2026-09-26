import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { generateQR } from '../api';
import { useAuth } from '../context/AuthContext';
import { getUserTests } from '../utils/userDataManager';
import {
  FileText, Search, Filter, RefreshCw, Printer,
  CheckCircle2, AlertTriangle, XCircle, Info, QrCode,
  Wheat, Calendar, Clock, ChevronRight, X, ExternalLink,
  ShieldCheck, ShieldAlert, Sparkles, Download, ArrowRight
} from 'lucide-react';
import { getAdulterantName, getFeedTypeName, getQualityStatusName, getRiskLevelName } from '../utils/translations';

const FEED_TYPE_FILTERS = [
  { id: 'All', key: 'all_feed_types', defaultLabel: 'All Feed Types' },
  { id: 'Cattle Feed Pellet', key: 'cattle_feed_pellet', defaultLabel: 'Cattle Feed Pellet' },
  { id: 'Silage', key: 'silage', defaultLabel: 'Silage' },
  { id: 'Feed Mash', key: 'feed_mash', defaultLabel: 'Feed Mash' },
  { id: 'TMR', key: 'tmr', defaultLabel: 'TMR' },
  { id: 'Mineral Mixture', key: 'mineral_mixture', defaultLabel: 'Mineral Mixture' },
];

const QUALITY_FILTERS = [
  { id: 'All', key: 'all_grades', defaultLabel: 'All Quality Grades' },
  { id: 'Good', key: 'good', defaultLabel: 'Good' },
  { id: 'Moderate', key: 'moderate', defaultLabel: 'Moderate' },
  { id: 'Poor', key: 'poor', defaultLabel: 'Poor' },
  { id: 'Unsafe', key: 'unsafe', defaultLabel: 'Unsafe' },
];

const RISK_FILTERS = [
  { id: 'All', key: 'all_risk_levels', defaultLabel: 'All Risk Levels' },
  { id: 'Low', key: 'low', defaultLabel: 'Low Risk' },
  { id: 'Medium', key: 'medium', defaultLabel: 'Moderate Risk' },
  { id: 'High', key: 'high', defaultLabel: 'High Risk' },
];

const INPUT_METHOD_FILTERS = [
  { id: 'All', key: 'all_input_methods', defaultLabel: 'All Input Methods' },
  { id: 'REAL SENSOR INPUT', key: 'sensor_tag', defaultLabel: 'NIR / Sensor Input' },
  { id: 'IMAGE INPUT', key: 'visual_tag', defaultLabel: 'Visual Screening' },
  { id: 'USER ENTERED', key: 'manual_tag', defaultLabel: 'Farmer Entered Data' },
  { id: 'SIMULATED DATA', key: 'simulated_tag', defaultLabel: 'Simulated Sensor Data' },
];

export default function HistoryReports() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const getFeedLabel = (id) => {
    const item = FEED_TYPE_FILTERS.find(f => f.id === id);
    if (!item) return getFeedTypeName(t, id);
    return item.id === 'All' ? t('common.all_feed_types', item.defaultLabel) : t('feed_types.' + item.key, item.defaultLabel);
  };

  const getQualityLabel = (q) => {
    const item = QUALITY_FILTERS.find(f => f.id === q);
    if (!item) return getQualityStatusName(t, q);
    return item.id === 'All' ? t('common.all_grades', item.defaultLabel) : t('quality_grades.' + item.key, item.defaultLabel);
  };

  const getRiskFilterLabel = (id) => {
    const item = RISK_FILTERS.find(r => r.id === id);
    if (!item) return getRiskLevelName(t, id);
    return item.id === 'All' ? t('history.all_risk_levels', item.defaultLabel) : t('risk_levels.' + item.key, item.defaultLabel);
  };

  const getInputMethodFilterLabel = (id) => {
    const item = INPUT_METHOD_FILTERS.find(im => im.id === id);
    if (!item) return id;
    return item.id === 'All' ? t('history.all_input_methods', item.defaultLabel) : t('analyze.' + item.key, item.defaultLabel);
  };

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [feedType, setFeedType] = useState('All');
  const [qualityStatus, setQualityStatus] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [inputMethodFilter, setInputMethodFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Selected report for modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalQR, setModalQR] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);

  const fetchHistory = useCallback(() => {
    setLoading(true);
    try {
      // Isolate tests strictly to the authenticated farmer
      const userTests = getUserTests(user?.id);
      let filtered = [...userTests];

      if (feedType !== 'All') {
        filtered = filtered.filter(item => item.feed_type === feedType);
      }
      if (qualityStatus !== 'All') {
        filtered = filtered.filter(item => item.quality_status === qualityStatus);
      }
      if (riskFilter !== 'All') {
        filtered = filtered.filter(item => {
          const itemRisk = item.quality_status === 'Good' ? 'Low' : item.quality_status === 'Moderate' ? 'Medium' : 'High';
          return itemRisk === riskFilter;
        });
      }
      if (inputMethodFilter !== 'All') {
        filtered = filtered.filter(item => (item.input_method || 'USER ENTERED') === inputMethodFilter);
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(item =>
          (item.id && item.id.toLowerCase().includes(q)) ||
          (item.feed_type && item.feed_type.toLowerCase().includes(q)) ||
          (item.quality_status && item.quality_status.toLowerCase().includes(q)) ||
          (item.input_method && item.input_method.toLowerCase().includes(q))
        );
      }

      setHistory(filtered);
      setError(null);
    } catch (err) {
      setError(err.message || 'Unable to load test history.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, feedType, qualityStatus, riskFilter, inputMethodFilter, search]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const stats = useMemo(() => {
    const total = history.length;
    const good = history.filter(h => h.quality_status === 'Good').length;
    const moderate = history.filter(h => h.quality_status === 'Moderate').length;
    const warning = history.filter(h => h.quality_status === 'Poor' || h.quality_status === 'Unsafe').length;
    const goodRate = total > 0 ? Math.round((good / total) * 100) : 0;
    return { total, good, moderate, warning, goodRate };
  }, [history]);

  const handleOpenReport = async (report) => {
    setSelectedReport(report);
    setModalQR(null);
  };

  const handleCreateQR = async (report) => {
    setGeneratingQR(true);
    try {
      const qr = await generateQR(
        report.advisory || { quality_grade: report.quality_status },
        report.readings || { feed_type: report.feed_type }
      );
      setModalQR(qr);
    } catch (err) {
      console.error('Failed to generate QR:', err);
    } finally {
      setGeneratingQR(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getBadgeClass = (quality) => {
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1>{t('history.title', 'Feed Quality Reports & Audit History')}</h1>
          <p>{t('history.subtitle', 'Traceable batch records, preliminary nutritional assessments, and historical trends.')}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          <button
            className="btn btn-secondary"
            onClick={fetchHistory}
            title={t('common.refresh', 'Refresh')}
          >
            <RefreshCw size={15} />
            {t('common.refresh', 'Refresh')}
          </button>
          <button
            className="btn btn-primary"
            onClick={handlePrint}
            title={t('history.print_records', 'Print Summary')}
          >
            <Printer size={15} />
            {t('history.print_records', 'Print Records')}
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="stats-bar" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="stat">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-text">{t('history.total_records', 'Total Tests Conducted')}</div>
        </div>
        <div className="stat">
          <div className="stat-number" style={{ color: 'var(--color-good)' }}>{stats.goodRate}%</div>
          <div className="stat-text">{t('history.safe_ratio', 'Optimal Quality Ratio')}</div>
        </div>
        <div className="stat">
          <div className="stat-number" style={{ color: 'var(--color-moderate)' }}>{stats.moderate}</div>
          <div className="stat-text">{t('history.moderate_count', 'Moderate / Borderline')}</div>
        </div>
        <div className="stat">
          <div className="stat-number" style={{ color: stats.warning > 0 ? 'var(--color-unsafe)' : 'var(--color-good)' }}>
            {stats.warning}
          </div>
          <div className="stat-text">{t('history.warning_count', 'High Risk / Unsafe')}</div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md) var(--space-lg)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder={t('history.search_placeholder', 'Search Sample ID, feed type, or quality...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Feed Type Filter */}
          <div style={{ flex: '0 1 170px' }}>
            <select
              className="form-select"
              value={feedType}
              onChange={(e) => setFeedType(e.target.value)}
              aria-label="Filter by Feed Type"
            >
              {FEED_TYPE_FILTERS.map(ft => (
                <option key={ft.id} value={ft.id}>{getFeedLabel(ft.id)}</option>
              ))}
            </select>
          </div>

          {/* Quality Filter */}
          <div style={{ flex: '0 1 150px' }}>
            <select
              className="form-select"
              value={qualityStatus}
              onChange={(e) => setQualityStatus(e.target.value)}
              aria-label="Filter by Quality Status"
            >
              {QUALITY_FILTERS.map(q => (
                <option key={q.id} value={q.id}>{getQualityLabel(q.id)}</option>
              ))}
            </select>
          </div>

          {/* Risk Filter */}
          <div style={{ flex: '0 1 140px' }}>
            <select
              className="form-select"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              aria-label="Filter by Risk Level"
            >
              {RISK_FILTERS.map(rf => (
                <option key={rf.id} value={rf.id}>{getRiskFilterLabel(rf.id)}</option>
              ))}
            </select>
          </div>

          {/* Input Method Filter */}
          <div style={{ flex: '0 1 150px' }}>
            <select
              className="form-select"
              value={inputMethodFilter}
              onChange={(e) => setInputMethodFilter(e.target.value)}
              aria-label="Filter by Input Method"
            >
              {INPUT_METHOD_FILTERS.map(im => (
                <option key={im.id} value={im.id}>{getInputMethodFilterLabel(im.id)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table / List View */}
      {loading ? (
        <div className="loading-spinner" />
      ) : error ? (
        <div className="alert alert-warning">
          <AlertTriangle size={18} /> {error}
        </div>
      ) : history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
          <Wheat size={54} style={{ opacity: 0.3, color: 'var(--color-primary)', margin: '0 auto var(--space-md)' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 6, fontSize: '1.25rem', fontWeight: 700 }}>
            {t('dashboard.no_records_yet')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: 440, margin: '0 auto var(--space-lg)', lineHeight: 1.5 }}>
            {t('dashboard.empty_state_desc')}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/analyze')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.65rem 1.4rem' }}
          >
            + {t('dashboard.start_feed_test')}
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive" style={{ margin: 0 }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>{t('dashboard.col_id')}</th>
                  <th>{t('dashboard.col_date')}</th>
                  <th>{t('dashboard.col_feed')}</th>
                  <th>{t('dashboard.col_grade')}</th>
                  <th>{t('analyze.risk_level')}</th>
                  <th>{t('analyze.pipeline_input')}</th>
                  <th style={{ textAlign: 'right' }}>{t('history.col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const dateStr = item.timestamp
                    ? new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'N/A';
                  const itemRisk = item.quality_status === 'Good' ? 'Low' : item.quality_status === 'Moderate' ? 'Medium' : 'High';
                  const riskColor = itemRisk === 'Low' ? 'var(--color-good)' : itemRisk === 'Medium' ? 'var(--color-moderate)' : 'var(--color-unsafe)';

                  return (
                    <tr
                      key={item.id}
                      style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                      onClick={() => handleOpenReport(item)}
                    >
                      <td>
                        <strong style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace' }}>
                          <FileText size={15} />
                          {item.id}
                        </strong>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {dateStr}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{getFeedLabel(item.feed_type)}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${getBadgeClass(item.quality_status)}`}>
                          {getQualityLabel(item.quality_status)}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: riskColor, fontWeight: 700, fontSize: '0.82rem' }}>
                          {getRiskLevelName(t, item.quality_status)}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{
                          fontSize: '0.72rem',
                          background: (item.input_method || '').includes('SIMULATED') ? '#fef3c7' : 'var(--bg-card-alt)',
                          color: (item.input_method || '').includes('SIMULATED') ? '#92400e' : 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          {item.input_method === 'REAL SENSOR INPUT' ? t('analyze.sensor_tag') :
                           item.input_method === 'IMAGE INPUT' ? t('analyze.visual_tag') :
                           item.input_method === 'USER ENTERED' ? t('analyze.manual_tag') :
                           item.input_method === 'SIMULATED DATA' ? t('analyze.simulated_tag') :
                           item.input_method}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReport(item);
                            }}
                            title={t('dashboard.action_view')}
                          >
                            {t('dashboard.action_view')}
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/report/${item.id}`);
                            }}
                            title={t('report.btn_download_pdf')}
                          >
                            <Download size={13} />
                          </button>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReport(item);
                              handleCreateQR(item);
                            }}
                            title={t('history.view_qr')}
                          >
                            <QrCode size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Inspection Modal */}
      {selectedReport && (
        <div className="modal-backdrop" onClick={() => setSelectedReport(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge" style={{ marginBottom: 4, background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                  {getFeedLabel(selectedReport.feed_type)}
                </span>
                <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>
                  {t('history.report_for', 'Analysis Report')}: {selectedReport.id}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {selectedReport.timestamp ? new Date(selectedReport.timestamp).toLocaleString() : ''}
                </div>
              </div>
              <button
                className="btn-icon"
                onClick={() => setSelectedReport(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: 'var(--space-lg)' }}>
              {/* Quality & Safety Highlight */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <div className={`result-card ${getBadgeClass(selectedReport.quality_status)}`}>
                  <div className="result-label">{t('analyze.quality', 'Quality Grade')}</div>
                  <div className="result-value">{getQualityLabel(selectedReport.quality_status)}</div>
                </div>

                <div className={`result-card ${selectedReport.adulteration_type === 'None' || !selectedReport.adulteration_type ? 'good' : 'unsafe'}`}>
                  <div className="result-label">{t('analyze.adulteration', 'Adulteration')}</div>
                  <div className="result-value" style={{ fontSize: '1.05rem' }}>
                    {getAdulterantName(t, selectedReport.adulteration_type)}
                  </div>
                </div>

                <div className={`result-card ${selectedReport.spoilage_flag === 1 ? 'unsafe' : 'good'}`}>
                  <div className="result-label">{t('analyze.spoilage', 'Spoilage Risk')}</div>
                  <div className="result-value">
                    {selectedReport.spoilage_flag === 1 ? t('common.spoiled', 'Spoiled') : t('common.not_spoiled', 'Fresh / Safe')}
                  </div>
                </div>
              </div>

              {/* Structured 5-Part Advisory (if available) */}
              {selectedReport.advisory?.structured_advisory && (
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
                    {t('analyze.ai_recommendation_title', 'AI Agronomic Recommendation')}
                  </h3>

                  {/* Quality Interpretation */}
                  <div className="advisory-card good" style={{ marginBottom: 'var(--space-sm)' }}>
                    <h4 style={{ fontSize: '0.88rem' }}>{t('advisory_action.' + (selectedReport.quality_status?.toLowerCase() || 'good') + '_headline', selectedReport.advisory.structured_advisory.quality_interpretation?.headline)}</h4>
                    <p style={{ fontSize: '0.84rem' }}>{t('advisory_quality.' + (selectedReport.quality_status?.toLowerCase() || 'moderate'), selectedReport.advisory.structured_advisory.quality_interpretation?.explanation)}</p>
                    {selectedReport.advisory.structured_advisory.quality_interpretation?.confidence_note && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {selectedReport.advisory.structured_advisory.quality_interpretation.confidence_note}
                      </div>
                    )}
                  </div>

                  {/* Recommended Action */}
                  <div className="advisory-card warning">
                    <h4 style={{ fontSize: '0.88rem' }}>{t('advisory_action.' + (selectedReport.quality_status?.toLowerCase() || 'good') + '_headline', selectedReport.advisory.structured_advisory.recommended_action?.headline)}</h4>
                    <p style={{ fontSize: '0.84rem', fontWeight: 600 }}>{t('advisory_action.' + (selectedReport.quality_status?.toLowerCase() || 'good') + '_primary', selectedReport.advisory.structured_advisory.recommended_action?.primary_action)}</p>
                    {selectedReport.advisory.structured_advisory.recommended_action?.action_steps && (
                      <ul style={{ paddingLeft: 'var(--space-lg)', margin: '4px 0 0', fontSize: '0.82rem' }}>
                        {selectedReport.advisory.structured_advisory.recommended_action.action_steps.map((st, idx) => (
                          <li key={idx}>{st}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Nutritional Breakdown Table */}
              {selectedReport.readings && (
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: 'var(--space-xs)', color: 'var(--text-secondary)' }}>
                    {t('analyze.nutrition_analysis', 'Measured Nutritional Parameters')}
                  </h4>
                  <div className="nutrient-grid">
                    {['moisture_pct', 'protein_pct', 'fiber_pct', 'energy_mcal_per_kg'].map(key => {
                      const val = selectedReport.readings[key];
                      if (val === undefined || val === null) return null;
                      const labels = {
                        moisture_pct: t('analyze.moisture', 'Moisture (%)'),
                        protein_pct: t('analyze.protein', 'Crude Protein (%)'),
                        fiber_pct: t('analyze.fiber', 'Fiber (%)'),
                        energy_mcal_per_kg: t('analyze.energy', 'Energy (Mcal/kg)'),
                      };
                      return (
                        <div key={key} className="nutrient-card normal">
                          <span className="nutrient-label">{labels[key] || key}</span>
                          <div className="nutrient-val">{Number(val).toFixed(1)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* QR Traceability Certificate */}
              <div style={{ textAlign: 'center', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-subtle)' }}>
                {modalQR ? (
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>
                      {t('qr.verified_title', 'Cryptographic QR Certificate')}
                    </h4>
                    <img src={modalQR.qr_image} alt="Batch QR" style={{ width: 140, height: 140, margin: '0 auto 8px', borderRadius: 8 }} />
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {t('qr.batch_id', 'Batch Verification ID:')} {modalQR.batch_id}
                    </p>
                  </div>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleCreateQR(selectedReport)}
                    disabled={generatingQR}
                  >
                    <QrCode size={16} />
                    {generatingQR ? t('common.loading', 'Generating...') : t('analyze.generate_qr', 'Generate QR Certificate')}
                  </button>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedReport(null)}>
                {t('common.close', 'Close')}
              </button>
              <button className="btn btn-primary" onClick={handlePrint}>
                <Printer size={15} />
                {t('history.print_btn', 'Print Certificate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
