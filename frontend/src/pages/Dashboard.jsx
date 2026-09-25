import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getDashboardStats } from '../api';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import {
  BarChart3, AlertTriangle, TrendingUp, Activity, Package, ShieldAlert,
  CheckCircle2, Layers, Warehouse
} from 'lucide-react';
import {
  getAdulterantName,
  getFeedTypeName,
  getQualityStatusName,
  getRegionName
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedFilter, setFeedFilter] = useState('All');
  const [qualityFilter, setQualityFilter] = useState('All');

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner" />;
  if (!stats) return <div className="alert alert-warning"><AlertTriangle size={18} /> Failed to load dashboard data</div>;

  const chartPlugins = {
    legend: { labels: { color: 'var(--text-secondary)', font: { size: 11, family: 'inherit' } } },
    tooltip: { backgroundColor: '#ffffff', titleColor: '#1c261e', bodyColor: '#48544a', borderColor: '#e8e2d5', borderWidth: 1 },
  };

  const qualityChart = {
    labels: Object.keys(stats.quality_distribution).map(k => t('quality_grades.' + k.toLowerCase(), k)),
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
      y: { ticks: { color: 'var(--text-muted)', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
    },
  };

  const lineOptions = {
    ...barOptions,
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: chartPlugins,
    cutout: '65%',
  };

  const totalAdulterations = Object.values(stats.adulteration_distribution).reduce((a, b) => a + b, 0);
  const goodRatio = stats.total_analyses > 0
    ? (((stats.quality_distribution['Good'] || 0) / stats.total_analyses) * 100).toFixed(1)
    : '0';

  return (
    <div>
      <div className="page-header">
        <h1>{t('dashboard.title')}</h1>
        <p>{t('dashboard.subtitle')}</p>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="stats-bar">
        <div className="stat">
          <div className="stat-number">{stats.total_analyses}</div>
          <div className="stat-text">{t('dashboard.total')}</div>
        </div>
        <div className="stat">
          <div className="stat-number" style={{ color: 'var(--color-good)' }}>{goodRatio}%</div>
          <div className="stat-text">{t('dashboard.safe_rate')}</div>
        </div>
        <div className="stat">
          <div className="stat-number">3</div>
          <div className="stat-text">{t('dashboard.active_storage_units')}</div>
        </div>
        <div className="stat">
          <div className="stat-number" style={{ color: totalAdulterations > 0 ? 'var(--color-unsafe)' : 'var(--color-good)' }}>
            {totalAdulterations}
          </div>
          <div className="stat-text">{t('dashboard.adulterations_found')}</div>
        </div>
      </div>

      {/* 3 Main Visual Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        {/* Quality Distribution Doughnut */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Activity size={18} style={{ color: 'var(--color-primary)' }} />
              {t('dashboard.quality_dist')}
            </span>
          </div>
          <div style={{ height: '240px', position: 'relative' }}>
            <Doughnut data={qualityChart} options={doughnutOptions} />
          </div>
        </div>

        {/* Feed Type Breakdown Bar */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Layers size={18} style={{ color: 'var(--color-wheat)' }} />
              {t('dashboard.feed_types')}
            </span>
          </div>
          <div style={{ height: '240px' }}>
            <Bar data={feedTypeChart} options={barOptions} />
          </div>
        </div>

        {/* Monthly Trend Line */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <TrendingUp size={18} style={{ color: 'var(--color-good)' }} />
              {t('dashboard.trend')}
            </span>
          </div>
          <div style={{ height: '240px' }}>
            <Line data={trendChart} options={lineOptions} />
          </div>
        </div>
      </div>

      {/* Contamination Frequency Cards */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <span className="card-title">
            <ShieldAlert size={18} style={{ color: 'var(--color-unsafe)' }} />
            {t('dashboard.adulteration_breakdown')}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
          {Object.entries(stats.adulteration_distribution).map(([type, count]) => (
            <div key={type} style={{
              padding: 'var(--space-md)',
              background: 'var(--color-unsafe-bg)',
              border: '1px solid var(--color-unsafe-border)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-unsafe-text)', marginBottom: 4 }}>
                {getAdulterantName(t, type)}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-unsafe)' }}>
                {count} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{t('dashboard.cases', 'cases')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Analyses Audit Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <span className="card-title">
            <Package size={18} style={{ color: 'var(--color-primary)' }} />
            {t('dashboard.recent')}
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <select
              value={feedFilter}
              onChange={e => setFeedFilter(e.target.value)}
              className="farmer-select"
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              <option value="All">{t('common.all_feed_types', 'All Feed Types')}</option>
              <option value="Cattle Feed Pellet">{t('feed_types.cattle_feed_pellet', 'Cattle Feed Pellet')}</option>
              <option value="Silage">{t('feed_types.silage', 'Silage')}</option>
              <option value="Feed Mash">{t('feed_types.feed_mash', 'Feed Mash')}</option>
              <option value="TMR">{t('feed_types.tmr', 'TMR')}</option>
              <option value="Mineral Mixture">{t('feed_types.mineral_mixture', 'Mineral Mixture')}</option>
            </select>
            <select
              value={qualityFilter}
              onChange={e => setQualityFilter(e.target.value)}
              className="farmer-select"
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              <option value="All">{t('common.all_grades', 'All Qualities')}</option>
              <option value="Good">{t('quality_grades.good', 'Good')}</option>
              <option value="Moderate">{t('quality_grades.moderate', 'Moderate')}</option>
              <option value="Poor">{t('quality_grades.poor', 'Poor')}</option>
              <option value="Unsafe">{t('quality_grades.unsafe', 'Unsafe')}</option>
            </select>
          </div>
        </div>
        <div className="table-responsive">
          <table className="farmer-table">
            <thead>
              <tr>
                <th>{t('dashboard.col_id')}</th>
                <th>{t('dashboard.col_date')}</th>
                <th>{t('dashboard.col_feed')}</th>
                <th>{t('dashboard.col_grade')}</th>
                <th>{t('dashboard.col_adulterant')}</th>
                <th>{t('dashboard.col_spoilage')}</th>
                <th>{t('dashboard.col_farmer')}</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_analyses
                .filter(rec => (feedFilter === 'All' || rec.feed_type === feedFilter))
                .filter(rec => (qualityFilter === 'All' || rec.quality_status === qualityFilter))
                .map((rec) => (
                <tr key={rec.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{rec.id}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {new Date(rec.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>{getFeedTypeName(t, rec.feed_type)}</td>
                  <td>
                    <span className={`badge badge-${getBadgeClass(rec.quality_status)}`}>
                      {getQualityStatusName(t, rec.quality_status)}
                    </span>
                  </td>
                  <td>
                    {rec.adulteration_type === 'None' || !rec.adulteration_type ? (
                      <span style={{ color: 'var(--color-good)', fontWeight: 600 }}>{t('common.none')}</span>
                    ) : (
                      <span style={{ color: 'var(--color-unsafe)', fontWeight: 700 }}>
                        {getAdulterantName(t, rec.adulteration_type)}
                      </span>
                    )}
                  </td>
                  <td>
                    {rec.spoilage_flag === 1 ? (
                      <span className="badge badge-unsafe">{t('common.spoiled')}</span>
                    ) : (
                      <span className="badge badge-good">{t('common.not_spoiled')}</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {getRegionName(t, rec.region) || rec.farmer_id || t('regions.farm_gate', 'Farm Gate')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
