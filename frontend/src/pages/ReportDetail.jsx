import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getHistoryDetail, generateQR } from '../api';
import { useAuth } from '../context/AuthContext';
import { getUserTests } from '../utils/userDataManager';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2,
  Printer, Share2, ArrowLeft, QrCode, Calendar, Clock,
  MapPin, User, Wheat, Sparkles, Download, Copy, Check
} from 'lucide-react';
import {
  getAdulterantName,
  getFeedTypeName,
  getQualityStatusName,
  getNutrientLabel
} from '../utils/translations';

export default function ReportDetail() {
  const { reportId } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        // First check user isolated storage
        const userTests = getUserTests(user?.id);
        const match = userTests.find(x => x.id === reportId || x.sample_id === reportId);
        if (match) {
          setReport(match);
          const qrRes = await generateQR(match.advisory || {}, match.readings || {});
          setQrCodeData(qrRes);
          setLoading(false);
          return;
        }

        const res = await getHistoryDetail(reportId);
        if (res.success && res.record) {
          setReport(res.record);
          // Generate QR for certificate
          const qrRes = await generateQR(
            res.record.advisory || { quality_grade: res.record.quality_status },
            res.record.readings || { feed_type: res.record.feed_type }
          );
          setQrCodeData(qrRes);
        } else {
          setError('Analysis report not found.');
        }
      } catch (err) {
        // Fallback to localStorage saved tests
        try {
          const localTests = JSON.parse(localStorage.getItem('feedguard_saved_tests') || '[]');
          const match = localTests.find(x => x.id === reportId || x.sample_id === reportId);
          if (match) {
            setReport(match);
            const qrRes = await generateQR(match.advisory || {}, match.readings || {});
            setQrCodeData(qrRes);
          } else {
            setError(err.message || 'Report not found.');
          }
        } catch (e) {
          setError('Unable to load report.');
        }
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [reportId, user?.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURI(`Feed Guard Quality Report: ${report?.id} - Grade: ${report?.quality_status}. View report: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 780, margin: 'var(--space-2xl) auto', textAlign: 'center', padding: 'var(--space-2xl)' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>{t('common.loading', 'Loading test certificate...')}</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ maxWidth: 600, margin: 'var(--space-2xl) auto', padding: '0 var(--space-md)' }}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <AlertTriangle size={40} style={{ color: 'var(--color-moderate)', margin: '0 auto 12px' }} />
          <h2 style={{ margin: '0 0 8px' }}>Report Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            We could not locate an analysis report matching ID "{reportId}".
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/history')}>
            <ArrowLeft size={16} />
            Back to Sample History
          </button>
        </div>
      </div>
    );
  }

  const isGood = report.quality_status === 'Good';
  const isModerate = report.quality_status === 'Moderate';
  const statusColor = isGood ? 'var(--color-good)' : isModerate ? 'var(--color-moderate)' : 'var(--color-unsafe)';

  const readings = report.readings || {};
  const advisory = report.advisory || {};
  const structured = advisory.structured_advisory || {};

  return (
    <div style={{ maxWidth: 880, margin: 'var(--space-xl) auto', padding: '0 var(--space-md)' }}>
      {/* Top Action Bar (Hidden on print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          {t('common.back_to_dashboard', 'Back')}
        </button>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleCopyLink}>
            {copied ? <Check size={16} style={{ color: 'var(--color-good)' }} /> : <Copy size={16} />}
            {copied ? t('qr.copied', 'Copied!') : t('qr.copy_link', 'Copy Link')}
          </button>
          <button className="btn btn-secondary" onClick={handleWhatsAppShare}>
            <Share2 size={16} />
            {t('qr.share_whatsapp', 'WhatsApp')}
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            {t('report.btn_download_pdf', 'Download PDF / Print')}
          </button>
        </div>
      </div>

      {/* Official Certificate Card */}
      <div className="printable-report card" style={{
        padding: 'var(--space-2xl)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        background: '#ffffff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        {/* Certificate Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid var(--color-primary-light)',
          paddingBottom: 'var(--space-lg)',
          marginBottom: 'var(--space-xl)',
          flexWrap: 'wrap',
          gap: 'var(--space-md)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <ShieldCheck size={32} style={{ color: 'var(--color-primary)' }} />
              <div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.04em' }}>
                  FEED GUARD
                </span>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-wheat-dark)', textTransform: 'uppercase' }}>
                  Test. Detect. Protect.
                </div>
              </div>
            </div>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '6px 0 2px' }}>
              {t('report.subtitle', 'Smart AI-Enabled Rapid Feed and Silage Screening Certificate')}
            </h2>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('report.report_id', 'Certificate ID')}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {report.id}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
              {new Date(report.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-md)',
          background: 'var(--bg-card-alt)',
          padding: 'var(--space-md) var(--space-lg)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-xl)'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('report.feed_type', 'Feed Commodity')}
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {getFeedTypeName(t, report.feed_type)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('report.batch_id', 'Batch Number')}
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              {report.batch_id || 'BATCH-' + report.id.slice(-4)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('report.farmer_name', 'Dairy Producer')}
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {report.farmer_name || report.farmer_id || user?.name || 'Verified Producer'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('report.farm_name', 'Farm / Dairy')}
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {report.farm_name || user?.farm_name || report.region || 'Registered Dairy Farm'}
            </div>
          </div>
        </div>

        {/* 3 Main Result Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
          <div className="card" style={{ borderLeft: `6px solid ${statusColor}`, padding: 'var(--space-md)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('report.quality_status', 'Safety Screening Grade')}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: statusColor, margin: '4px 0' }}>
              {getQualityStatusName(t, report.quality_status)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {isGood ? 'Safe for high-lactation cattle' : isModerate ? 'Monitor consumption rate' : 'Do not feed without remediation'}
            </div>
          </div>

          <div className="card" style={{ borderLeft: `6px solid ${report.adulteration_type === 'None' || !report.adulteration_type ? 'var(--color-good)' : 'var(--color-unsafe)'}`, padding: 'var(--space-md)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('report.adulteration_status', 'Adulteration Finding')}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: report.adulteration_type === 'None' ? 'var(--color-good)' : 'var(--color-unsafe)', margin: '6px 0' }}>
              {getAdulterantName(t, report.adulteration_type)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {report.adulteration_type === 'None' ? 'No chemical spikes detected' : 'Bulk or nitrogen adulteration suspected'}
            </div>
          </div>

          <div className="card" style={{ borderLeft: `6px solid ${report.spoilage_flag === 1 ? 'var(--color-unsafe)' : 'var(--color-good)'}`, padding: 'var(--space-md)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('report.spoilage_status', 'Biological Spoilage')}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: report.spoilage_flag === 1 ? 'var(--color-unsafe)' : 'var(--color-good)', margin: '6px 0' }}>
              {report.spoilage_flag === 1 ? t('common.spoiled', 'Spoiled ✕') : t('common.not_spoiled', 'Fresh & Safe ✓')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {report.spoilage_flag === 1 ? 'Elevated fungal/aflatoxin risk' : 'Aerobic & microbial stability intact'}
            </div>
          </div>
        </div>

        {/* Nutritional Parameter Scorecard */}
        {Object.keys(readings).length > 0 && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wheat size={18} style={{ color: 'var(--color-primary)' }} />
              {t('report.nutritional_parameters', 'Nutritional Parameter Scorecard')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-sm)' }}>
              {readings.moisture_pct !== undefined && (
                <div className="nutrient-card normal">
                  <span className="nutrient-label">{getNutrientLabel(t, 'moisture_pct', 'Moisture')}</span>
                  <div className="nutrient-val">{readings.moisture_pct}%</div>
                </div>
              )}
              {readings.protein_pct !== undefined && (
                <div className="nutrient-card normal">
                  <span className="nutrient-label">{getNutrientLabel(t, 'protein_pct', 'Protein')}</span>
                  <div className="nutrient-val">{readings.protein_pct}%</div>
                </div>
              )}
              {readings.fiber_pct !== undefined && (
                <div className="nutrient-card normal">
                  <span className="nutrient-label">{getNutrientLabel(t, 'fiber_pct', 'Fiber')}</span>
                  <div className="nutrient-val">{readings.fiber_pct}%</div>
                </div>
              )}
              {readings.energy_mcal_per_kg !== undefined && (
                <div className="nutrient-card normal">
                  <span className="nutrient-label">{getNutrientLabel(t, 'energy_mcal_per_kg', 'Energy')}</span>
                  <div className="nutrient-val">{readings.energy_mcal_per_kg} <span style={{ fontSize: '0.7rem' }}>Mcal/kg</span></div>
                </div>
              )}
              {readings.urea_pct !== undefined && (
                <div className="nutrient-card normal">
                  <span className="nutrient-label">{getNutrientLabel(t, 'urea_pct', 'Urea')}</span>
                  <div className="nutrient-val">{readings.urea_pct}%</div>
                </div>
              )}
              {readings.sand_silica_pct !== undefined && (
                <div className="nutrient-card normal">
                  <span className="nutrient-label">{getNutrientLabel(t, 'sand_silica_pct', 'Sand/Silica')}</span>
                  <div className="nutrient-val">{readings.sand_silica_pct}%</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Advisory Section */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
            {t('report.ai_advisory', 'AI Agronomic Advisory & Feeding Guidance')}
          </h3>
          <div className="advisory-card good" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
              {advisory.farmer_advisory || 'Feed parameters meet acceptable nutritional safety ranges for dairy cattle maintenance.'}
            </p>
          </div>
        </div>

        {/* Certificate Verification Footer & QR */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '2px solid var(--border-color)',
          paddingTop: 'var(--space-lg)',
          flexWrap: 'wrap',
          gap: 'var(--space-md)'
        }}>
          <div style={{ maxWidth: 460 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
              {t('report.qr_label', 'Official Verification QR Code')}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 8px' }}>
              {t('report.qr_sub', 'Scan with any smartphone camera to verify digital authenticity on the Feed Guard registry.')}
            </p>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {t('report.official_disclaimer', 'NOTICE: This certificate reflects a digital rapid-screening evaluation. While highly accurate, confirmatory wet-chemistry analysis is recommended for legal disputes or acute herd toxicology.')}
            </div>
          </div>

          {qrCodeData?.qr_data_url && (
            <div style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <img
                src={qrCodeData.qr_data_url}
                alt="Verification QR Code"
                style={{ width: 110, height: 110, display: 'block' }}
              />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                FEED GUARD VERIFIED
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
