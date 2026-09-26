import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserDashboardStats, getUserSilage } from '../utils/userDataManager';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import {
  AlertTriangle, TrendingUp, Activity, ShieldAlert,
  CheckCircle2, Layers, Warehouse, PlusCircle, QrCode, FileText,
  ArrowRight, ShieldCheck, MapPin, Sparkles, ExternalLink
} from 'lucide-react';
import {
  getAdulterantName,
  getFeedTypeName,
  getQualityStatusName
} from '../utils/translations';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
);

const QUALITY_COLORS = {
  Good: '#16a34a',
  Moderate: '#d97706',
  Poor: '#ea580c',
  Unsafe: '#dc2626',
  Unknown: '#717d72',
};

function getBadgeClass(quality) {
  return { Good: 'good', Moderate: 'moderate', Poor: 'poor', Unsafe: 'unsafe' }[quality] || 'info';
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [silageData, setSilageData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load dynamically calculated stats strictly isolated for the active farmer
  useEffect(() => {
    if (user?.id) {
      const userStats = getUserDashboardStats(user.id);
      const userSilage = getUserSilage(user.id);
      setStats(userStats);
      setSilageData(userSilage);
      setLoading(false);
    }
  }, [user]);

  if (loading || !stats) {
    return (
      <div style={{ maxWidth: 800, margin: 'var(--space-2xl) auto', textAlign: 'center', padding: 'var(--space-xl)' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading your farm workspace...</p>
      </div>
    );
  }

  const chartPlugins = {
    legend: { labels: { color: 'var(--text-secondary)', font: { size: 11, family: 'inherit' } } },
    tooltip: { backgroundColor: '#ffffff', titleColor: '#1c261e', bodyColor: '#48544a', borderColor: '#e8e2d5', borderWidth: 1 },
  };

  const hasTests = stats.total_analyses > 0;
  const goodCount = stats.quality_distribution['Good'] || 0;
  const attentionCount = stats.quality_distribution['Moderate'] || 0;
  const unsafeCount = (stats.quality_distribution['Poor'] || 0) + (stats.quality_distribution['Unsafe'] || 0);
  const totalAdulterations = Object.values(stats.adulteration_distribution || {}).reduce((a, b) => a + b, 0);

  const qualityChart = {
    labels: Object.keys(stats.quality_distribution).map(k => getQualityStatusName(t, k)),
    datasets: [{
      data: Object.values(stats.quality_distribution),
      backgroundColor: Object.keys(stats.quality_distribution).map(k => QUALITY_COLORS[k] || '#717d72'),
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 6,
    }],
  };

  const feedTypeChart = {
    labels: Object.keys(stats.feed_type_distribution).map(k => getFeedTypeName(t, k)),
    datasets: [{
      label: t('dashboard.samples_tested', 'Samples Tested'),
      data: Object.values(stats.feed_type_distribution),
      backgroundColor: ['#1e5e3a', '#d97706', '#c2410c', '#2d6a4f', '#b45309'],
      borderWidth: 0,
      borderRadius: 6,
    }],
  };

  const trendChart = {
    labels: stats.monthly_trend.map(m => m.month),
    datasets: [{
      label: t('dashboard.monthly_tests', 'Monthly Tests'),
      data: stats.monthly_trend.map(m => m.count),
      borderColor: '#1e5e3a',
      backgroundColor: 'rgba(30, 94, 58, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#1e5e3a',
      pointRadius: 4,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: chartPlugins,
    scales: {
      x: { ticks: { color: 'var(--text-muted)', font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: 'var(--text-muted)', font: { size: 10 }, stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
    },
  };

  const lineOptions = { ...barOptions };
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: chartPlugins,
    cutout: '65%',
  };

  const latestReport = stats.recent_analyses?.[0];

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto' }}>
      {/* ========================================================
          1. DASHBOARD WELCOME & FARM DETAILS SECTION
          ======================================================== */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-subtle, #e8e2d5)',
        borderRadius: 'var(--radius-lg, 16px)',
        padding: 'clamp(1.25rem, 2.5vw, 1.75rem)',
        marginBottom: 'var(--space-lg, 1.5rem)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--color-primary-light, #eaf5ee)',
                color: 'var(--color-primary, #1e5e3a)',
                padding: '3px 10px',
                borderRadius: 9999,
                fontSize: '0.74rem',
                fontWeight: 800,
                letterSpacing: '0.02em'
              }}>
                <ShieldCheck size={14} />
                FEED GUARD
              </span>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(22, 163, 74, 0.1)',
                color: 'var(--color-good, #16a34a)',
                padding: '3px 10px',
                borderRadius: 9999,
                fontSize: '0.74rem',
                fontWeight: 700
              }}>
                <CheckCircle2 size={13} />
                Account Active
              </span>
            </div>

            {/* Display: "Welcome, [Farmer Name]" */}
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.5rem, 2.4vw, 1.95rem)',
              fontWeight: 800,
              margin: '6px 0 4px 0',
              color: 'var(--text-primary)'
            }}>
              Welcome, {user?.name || 'Farmer'}
            </h1>

            {/* Below: "[Farm Name] • [Location]" */}
            <p style={{
              fontSize: '0.92rem',
              color: 'var(--text-secondary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
              <span>
                {user?.farm_name || 'Dairy Farm'}
                {user?.district ? ` • ${user.district}, ${user.state || 'India'}` : ''}
                {user?.cattle_count ? ` • ${user.cattle_count} Cattle` : ''}
              </span>
            </p>
          </div>

          <div style={{
            background: 'var(--bg-card-alt, #f8f5ee)',
            border: '1px solid var(--border-subtle, #e8e2d5)',
            borderRadius: 'var(--radius-md, 12px)',
            padding: '10px 14px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Dairy Operation ID
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
              {user?.id || 'FARMER'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              {user?.mobile}
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div style={{
          marginTop: '1.25rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle, #e8e2d5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Farmer Actions
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Primary Action Button */}
            <button
              className="btn btn-primary"
              onClick={() => navigate('/analyze')}
              style={{
                padding: '10px 18px',
                fontSize: '0.9rem',
                fontWeight: 800,
                boxShadow: '0 2px 8px rgba(30, 94, 58, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <PlusCircle size={18} />
              <span>+ New Feed Test</span>
            </button>

            {/* Secondary Action Buttons */}
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/silage')}
              style={{ padding: '9px 14px', fontSize: '0.84rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Warehouse size={16} />
              <span>+ Silage Test</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => navigate('/history')}
              style={{ padding: '9px 14px', fontSize: '0.84rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <FileText size={16} />
              <span>View History</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => navigate('/qr')}
              style={{ padding: '9px 14px', fontSize: '0.84rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <QrCode size={16} />
              <span>Scan / Verify QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. 5 CLEAN STATISTIC CARDS (Dynamically Calculated)
          ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--space-md, 1rem)',
        marginBottom: 'var(--space-lg, 1.5rem)'
      }}>
        {/* Total Tests */}
        <div className="stat" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div className="stat-number">{stats.total_analyses}</div>
          <div className="stat-text">Total Tests</div>
        </div>

        {/* Good Quality */}
        <div className="stat" style={{ borderLeft: '4px solid var(--color-good)' }}>
          <div className="stat-number" style={{ color: 'var(--color-good)' }}>{goodCount}</div>
          <div className="stat-text">Good Quality</div>
        </div>

        {/* Requires Attention */}
        <div className="stat" style={{ borderLeft: '4px solid var(--color-moderate)' }}>
          <div className="stat-number" style={{ color: 'var(--color-moderate)' }}>{attentionCount}</div>
          <div className="stat-text">Requires Attention</div>
        </div>

        {/* Unsafe / Rejected */}
        <div className="stat" style={{ borderLeft: '4px solid var(--color-unsafe)' }}>
          <div className="stat-number" style={{ color: 'var(--color-unsafe)' }}>{unsafeCount}</div>
          <div className="stat-text">Unsafe / Rejected</div>
        </div>

        {/* Adulterations Detected */}
        <div className="stat" style={{ borderLeft: '4px solid #b45309' }}>
          <div className="stat-number" style={{ color: totalAdulterations > 0 ? 'var(--color-unsafe)' : 'var(--color-good)' }}>
            {totalAdulterations}
          </div>
          <div className="stat-text">Adulterations Detected</div>
        </div>
      </div>

      {/* ========================================================
          3. MAIN CONTENT: EMPTY STATES OR REAL DATA
          ======================================================== */}
      {!hasTests ? (
        /* PROFESSIONAL EMPTY STATES FOR NEW FARMER ACCOUNT */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
          {/* Feed Analysis Empty State Card */}
          <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center', borderTop: '4px solid var(--color-primary)' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-md)'
            }}>
              <Activity size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', margin: '0 0 6px', color: 'var(--text-primary)' }}>
              No feed analysis yet
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto var(--space-lg)', lineHeight: 1.5 }}>
              Start your first feed test to see nutritional quality, contamination risk and farmer recommendations.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/analyze')}
              style={{ padding: '10px 20px', fontSize: '0.92rem', fontWeight: 700 }}
            >
              <PlusCircle size={16} />
              <span>Start Feed Test</span>
            </button>
          </div>

          {/* Silage Monitoring Empty State Card */}
          <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center', borderTop: '4px solid #0284c7' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(2, 132, 199, 0.1)',
              color: '#0284c7',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-md)'
            }}>
              <Warehouse size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', margin: '0 0 6px', color: 'var(--text-primary)' }}>
              No silage monitoring data yet
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto var(--space-lg)', lineHeight: 1.5 }}>
              Connect your sensors or enter measurements to begin monitoring fermentation temperature, moisture, and pH.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/silage')}
              style={{ padding: '10px 20px', fontSize: '0.92rem', fontWeight: 700 }}
            >
              <Warehouse size={16} />
              <span>Open Silage Monitor</span>
            </button>
          </div>
        </div>
      ) : (
        /* POPULATED DATA: LATEST ADVISORY & SILAGE MONITOR */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-md, 1rem)',
          marginBottom: 'var(--space-lg, 1.5rem)'
        }}>
          {/* Card A: Latest AI Screening Advisory */}
          <div className="card" style={{ borderTop: '4px solid var(--color-primary)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
                <span className="card-title" style={{ margin: 0, fontSize: '1rem' }}>
                  Latest AI Screening Advisory
                </span>
              </div>
              {latestReport && (
                <span className={`badge badge-${getBadgeClass(latestReport.quality_status)}`} style={{ fontWeight: 700 }}>
                  {latestReport.quality_status?.toUpperCase()}
                </span>
              )}
            </div>

            <div style={{
              background: 'var(--bg-card-alt, #f8f5ee)',
              borderRadius: 'var(--radius-sm, 8px)',
              padding: '12px 14px',
              margin: '10px 0',
              border: '1px solid var(--border-subtle, #e8e2d5)'
            }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                SAMPLE: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{latestReport?.id}</strong> • {latestReport?.feed_type}
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {latestReport?.advisory?.farmer_advisory || 'Nutritional screening completed. Review recommendations below.'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Recorded on {new Date(latestReport?.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <Link
                to={`/report/${latestReport?.id}`}
                style={{
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>View Full Report</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Card B: Visual Analytics Charts */}
          <div className="card" style={{ borderTop: '4px solid #0284c7' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title" style={{ margin: 0, fontSize: '1rem' }}>
                <Activity size={18} style={{ color: '#0284c7' }} />
                <span>Quality Distribution</span>
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {stats.total_analyses} Tested
              </span>
            </div>
            <div style={{ height: '180px', position: 'relative', marginTop: 10 }}>
              <Doughnut data={qualityChart} options={doughnutOptions} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          4. RECENT ACTIVITY TABLE
          ======================================================== */}
      <div className="card" style={{ marginBottom: 'var(--space-2xl, 3rem)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
            Recent Activity
          </span>
          {hasTests && (
            <Link to="/history" style={{ fontSize: '0.82rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700 }}>
              View All History →
            </Link>
          )}
        </div>

        {!hasTests ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
            <FileText size={36} style={{ opacity: 0.25, margin: '0 auto 8px' }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No recent activity.</div>
            <div style={{ fontSize: '0.8rem', marginTop: 2 }}>
              Tests you record will appear here with sample quality and risk status.
            </div>
          </div>
        ) : (
          <div className="table-responsive" style={{ margin: 0 }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Sample ID</th>
                  <th>Feed Type</th>
                  <th>Date</th>
                  <th>Quality</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_analyses.map((item) => {
                  const isClean = item.adulteration_type === 'None' || !item.adulteration_type;
                  const dateStr = item.timestamp
                    ? new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'N/A';

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                          {item.id}
                        </strong>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{item.feed_type}</span>
                      </td>
                      <td style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        {dateStr}
                      </td>
                      <td>
                        <span className={`badge badge-${getBadgeClass(item.quality_status)}`}>
                          {item.quality_status}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          color: item.quality_status === 'Good' ? 'var(--color-good)' : item.quality_status === 'Moderate' ? 'var(--color-moderate)' : 'var(--color-unsafe)'
                        }}>
                          {item.quality_status === 'Good' ? 'Low Risk' : item.quality_status === 'Moderate' ? 'Moderate Risk' : 'High Risk'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Completed
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/report/${item.id}`}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', textDecoration: 'none' }}
                        >
                          View Report
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
