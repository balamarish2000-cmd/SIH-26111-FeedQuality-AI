import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getSilageMonitor } from '../api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import {
  Warehouse, AlertTriangle, CheckCircle2, RefreshCw,
  Lightbulb, MapPin, Calendar, Activity, Info
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function GaugeCard({ value, unit, label, color, statusText }) {
  return (
    <div className="gauge-card">
      <div className="gauge-circle" style={{ borderColor: `${color}33`, background: `${color}08` }}>
        <div className="gauge-value" style={{ color }}>{value}</div>
        <div className="gauge-unit">{unit}</div>
      </div>
      <div className="gauge-title">{label}</div>
      {statusText && (
        <span className="badge" style={{ marginTop: 6, background: `${color}15`, color }}>
          {statusText}
        </span>
      )}
    </div>
  );
}

export default function SilageMonitor() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBunker, setSelectedBunker] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const result = await getSilageMonitor();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <div className="loading-spinner" />;
  if (error) return <div className="alert alert-warning"><AlertTriangle size={18} /> {error}</div>;
  if (!data) return null;

  const bunker = data.bunkers[selectedBunker];
  const history = bunker?.history || [];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: 'var(--text-secondary)', font: { size: 11, family: 'inherit' } } },
      tooltip: { backgroundColor: '#ffffff', titleColor: '#1c261e', bodyColor: '#48544a', borderColor: '#e8e2d5', borderWidth: 1 },
    },
    scales: {
      x: { ticks: { color: 'var(--text-muted)', font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: 'var(--text-muted)', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
    },
  };

  const historyChart = {
    labels: history.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        label: t('silage.ph_gauge'),
        data: history.map(h => h.ph),
        borderColor: '#1e5e3a',
        backgroundColor: 'rgba(30, 94, 58, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 1,
      },
      {
        label: t('silage.temp_gauge') + ' (°C)',
        data: history.map(h => h.temperature_c),
        borderColor: '#d97706',
        backgroundColor: 'rgba(217, 119, 6, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 1,
      },
    ],
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('silage.title')}</h1>
        <p>{t('silage.subtitle')}</p>
      </div>

      {/* Silage Golden Rule Banner */}
      <div className="problem-banner" style={{ background: 'var(--color-primary-light)', borderLeftColor: 'var(--color-primary)', borderColor: 'var(--color-good-border)' }}>
        <Lightbulb size={24} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <h3 style={{ color: 'var(--color-primary)', marginBottom: 2 }}>{t('silage.silage_tip_title')}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{t('silage.silage_tip_desc')}</p>
        </div>
      </div>

      {/* Active Alerts */}
      {data.alerts?.map((alert, i) => (
        <div key={i} className={`alert alert-${alert.type === 'warning' ? 'warning' : 'info'}`}>
          {alert.type === 'warning' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span><strong>{alert.bunker}:</strong> {alert.message}</span>
        </div>
      ))}

      {/* Bunker Selector Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: 6 }}>
          {t('silage.bunker_select')}
        </span>
        {data.bunkers.map((b, i) => (
          <button
            key={b.bunker_id}
            className={`btn ${selectedBunker === i ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            onClick={() => setSelectedBunker(i)}
          >
            <Warehouse size={15} />
            {b.name}
          </button>
        ))}
        <button
          className="btn btn-secondary"
          onClick={fetchData}
          style={{ marginLeft: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {bunker && (
        <div>
          {/* Real-time Telemetry Dials */}
          <div className="gauges-grid">
            <GaugeCard
              value={bunker.ph}
              unit="pH"
              label={t('silage.ph_gauge')}
              color={bunker.ph <= 4.5 ? 'var(--color-good)' : 'var(--color-moderate)'}
              statusText={bunker.ph <= 4.5 ? t('common.good') : t('common.moderate')}
            />
            <GaugeCard
              value={bunker.temperature_c}
              unit="°C"
              label={t('silage.temp_gauge')}
              color={bunker.temperature_c <= 28 ? 'var(--color-good)' : 'var(--color-moderate)'}
              statusText={bunker.temperature_c <= 28 ? t('common.good') : t('common.moderate')}
            />
            <GaugeCard
              value={bunker.moisture_pct}
              unit="%"
              label={t('silage.moisture_gauge')}
              color="var(--color-wheat)"
              statusText={bunker.moisture_pct >= 60 && bunker.moisture_pct <= 70 ? t('common.good') : t('common.moderate')}
            />
            <GaugeCard
              value={bunker.co2_ppm}
              unit="ppm"
              label={t('silage.co2_gauge')}
              color="var(--color-primary)"
              statusText={t('common.good')}
            />
          </div>

          {/* Bunker Metadata Cards */}
          <div className="stats-bar" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="stat">
              <div className="stat-text">{t('silage.quality_status')}</div>
              <div className="stat-number" style={{ fontSize: '1.4rem', color: bunker.fermentation_quality === 'Good' ? 'var(--color-good)' : 'var(--color-moderate)' }}>
                {bunker.fermentation_quality}
              </div>
            </div>
            <div className="stat">
              <div className="stat-text">{t('silage.days_sealed')}</div>
              <div className="stat-number" style={{ fontSize: '1.4rem' }}>
                {bunker.days_since_sealing}
              </div>
            </div>
            <div className="stat">
              <div className="stat-text">{t('silage.spoilage_risk')}</div>
              <div className="stat-number" style={{ fontSize: '1.4rem', color: bunker.spoilage_risk === 'Low' ? 'var(--color-good)' : 'var(--color-moderate)' }}>
                {bunker.spoilage_risk}
              </div>
            </div>
            <div className="stat">
              <div className="stat-text">{t('silage.location')}</div>
              <div className="stat-number" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {bunker.location}
              </div>
            </div>
          </div>

          {/* 24-Hour Trend Chart */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Activity size={18} style={{ color: 'var(--color-primary)' }} />
                {t('silage.history_title')}
              </span>
            </div>
            <div style={{ height: '300px', width: '100%' }}>
              <Line data={historyChart} options={chartOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
