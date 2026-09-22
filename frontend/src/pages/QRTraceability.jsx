import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { verifyQR, getQRBatches } from '../api';
import {
  QrCode, Search, ShieldCheck, CheckCircle2, XCircle,
  Package, Clock, AlertTriangle, Shield, Check, Copy
} from 'lucide-react';

export default function QRTraceability() {
  const { t } = useTranslation();
  const [batchId, setBatchId] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const data = await getQRBatches();
      setBatches(data.batches || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!batchId.trim()) return;
    setLoading(true);
    setVerifyResult(null);
    setVerifyError(null);
    try {
      const result = await verifyQR(batchId.trim());
      setVerifyResult(result);
    } catch (err) {
      setVerifyError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('qr.title')}</h1>
        <p>{t('qr.subtitle')}</p>
      </div>

      <div className="two-col">
        {/* Left Column: Search & Verification Result */}
        <div>
          {/* Search Card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Search size={18} style={{ color: 'var(--color-primary)' }} />
                {t('qr.verify_box_title')}
              </span>
            </div>

            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label className="form-label">{t('qr.scan_input_label')}</label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <input
                    className="form-input"
                    placeholder="e.g. FQ-20260922-A1B2C3D4"
                    value={batchId}
                    onChange={e => setBatchId(e.target.value)}
                    style={{ flex: 1, fontFamily: 'monospace' }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? t('common.loading') : t('qr.verify_btn')}
                  </button>
                </div>
              </div>
            </form>

            {verifyError && (
              <div className="alert alert-warning" style={{ marginTop: 'var(--space-md)' }}>
                <AlertTriangle size={18} /> {verifyError}
              </div>
            )}

            {/* Verification Result Certificate */}
            {verifyResult && (
              <div style={{ marginTop: 'var(--space-lg)' }}>
                {verifyResult.valid ? (
                  <div style={{
                    padding: 'var(--space-xl)',
                    background: 'var(--color-good-bg)',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px solid var(--color-good-border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                      <CheckCircle2 size={28} style={{ color: 'var(--color-good)' }} />
                      <div>
                        <h3 style={{ color: 'var(--color-good-text)', fontSize: '1.1rem', fontWeight: 800 }}>
                          {t('qr.verified_title')}
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-good-text)', opacity: 0.85 }}>
                          {t('qr.verified_desc')}
                        </p>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gap: 'var(--space-xs)',
                      background: 'rgba(255,255,255,0.7)',
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      {[
                        [t('qr.batch_id_label'), verifyResult.batch_id],
                        [t('qr.test_date_label'), new Date(verifyResult.timestamp).toLocaleString()],
                        [t('qr.feed_type_label'), verifyResult.feed_type],
                        [t('qr.quality_grade_label'), verifyResult.quality_status],
                        [t('qr.scan_count_label'), verifyResult.verified_count],
                      ].map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: 'var(--space-xl)',
                    background: 'var(--color-unsafe-bg)',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px solid var(--color-unsafe-border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <XCircle size={28} style={{ color: 'var(--color-unsafe)' }} />
                      <div>
                        <h3 style={{ color: 'var(--color-unsafe-text)', fontSize: '1.05rem', fontWeight: 700 }}>
                          {t('qr.invalid_title')}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {verifyResult.error || 'Batch not found.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* How QR Verification Protects Farmers */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />
                {t('qr.how_it_works_title')}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {[
                t('qr.how_step1'),
                t('qr.how_step2'),
                t('qr.how_step3'),
                t('qr.how_step4'),
              ].map((stepText, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-sm)',
                  padding: '8px 12px',
                  background: 'var(--bg-card-alt)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                }}>
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    flexShrink: 0,
                    marginTop: 1,
                  }}>
                    {idx + 1}
                  </div>
                  <span>{stepText}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Registered Batches Registry */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Package size={18} style={{ color: 'var(--color-wheat)' }} />
                {t('qr.batches_title')}
              </span>
              <span className="badge badge-good">{batches.length} Certified</span>
            </div>

            {batches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
                <QrCode size={48} style={{ opacity: 0.2, margin: '0 auto var(--space-md)' }} />
                <p>{t('analyze.empty_state')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {batches.map(batch => (
                  <div
                    key={batch.batch_id}
                    style={{
                      padding: 'var(--space-md)',
                      background: 'var(--bg-card-alt)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-sm)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                        {batch.batch_id}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {batch.feed_type} • {new Date(batch.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-good">{batch.quality_status || 'Certified'}</span>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          setBatchId(batch.batch_id);
                          verifyQR(batch.batch_id).then(setVerifyResult).catch(console.error);
                        }}
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
