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
  Lightbulb, MapPin, Activity, Thermometer, Flame,
  Sun, TrendingDown, TrendingUp, ShieldAlert, ShieldCheck,
  Clock, Gauge, ArrowRight
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
  const [selectedUnit, setSelectedUnit] = useState(0);

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

  const storageUnits = data.storage_units || [];
  const currentUnit = storageUnits[selectedUnit] || storageUnits[0];
  const history = currentUnit?.history || [];
  const tempAnalysis = currentUnit?.temperature_analysis || {
    core_temp_c: currentUnit?.temperature_c ?? 22.0,
    ambient_temp_c: currentUnit?.ambient_temperature_c ?? 28.0,
    differential_c: (currentUnit?.temperature_c ?? 22.0) - (currentUnit?.ambient_temperature_c ?? 28.0),
    thermal_zone: (currentUnit?.temperature_c ?? 22.0) <= 25 ? 'optimal' : (currentUnit?.temperature_c ?? 22.0) <= 30 ? 'warning' : 'critical',
    heating_risk: (currentUnit?.temperature_c ?? 22.0) <= 25 ? 'low' : (currentUnit?.temperature_c ?? 22.0) <= 30 ? 'moderate' : 'high',
    fermentation_phase: 'stable_storage',
    aerobic_stability_hours: 65,
    thermal_stability_score: 94,
    max_24h_temp: 23.5,
    min_24h_temp: 20.5
  };

  const isCooler = (tempAnalysis.differential_c ?? 0) <= 0;
  const zoneColor = tempAnalysis.thermal_zone === 'optimal'
    ? 'var(--color-good)'
    : tempAnalysis.thermal_zone === 'warning'
      ? 'var(--color-moderate)'
      : 'var(--color-unsafe)';

  // Chart 1: Core Temp vs Ambient Shed Temp (24h Trend)
  const tempChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { color: 'var(--text-secondary)', font: { size: 11, family: 'inherit', weight: '600' } }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1c261e',
        bodyColor: '#48544a',
        borderColor: '#e8e2d5',
        borderWidth: 1,
        padding: 10
      },
    },
    scales: {
      x: {
        ticks: { color: 'var(--text-muted)', font: { size: 10 } },
        grid: { display: false }
      },
      y: {
        ticks: {
          color: 'var(--text-muted)',
          font: { size: 10 },
          callback: (v) => `${v}°C`
        },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
    },
  };

  const tempHistoryChart = {
    labels: history.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        label: `${t('silage.core_temp')} (°C)`,
        data: history.map(h => h.temperature_c),
        borderColor: '#d97706',
        backgroundColor: 'rgba(217, 119, 6, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        borderWidth: 2.5,
      },
      {
        label: `${t('silage.ambient_temp')} (°C)`,
        data: history.map(h => h.ambient_temperature_c || 28),
        borderColor: '#2563eb',
        borderDash: [5, 4],
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.35,
        pointRadius: 1.5,
        borderWidth: 1.8,
      },
    ],
  };

  // Chart 2: pH and Moisture Telemetry (24h Trend)
  const chemistryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { color: 'var(--text-secondary)', font: { size: 11, family: 'inherit', weight: '600' } }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1c261e',
        bodyColor: '#48544a',
        borderColor: '#e8e2d5',
        borderWidth: 1
      },
    },
    scales: {
      x: {
        ticks: { color: 'var(--text-muted)', font: { size: 10 } },
        grid: { display: false }
      },
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'pH', color: 'var(--color-primary)' },
        min: 3.5,
        max: 6.0,
        ticks: { color: 'var(--text-muted)', font: { size: 10 } },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'Moisture (%)', color: '#0284c7' },
        min: 40,
        max: 85,
        ticks: { color: 'var(--text-muted)', font: { size: 10 } },
        grid: { display: false }
      }
    },
  };

  const chemistryHistoryChart = {
    labels: history.map(h => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        label: t('silage.ph_gauge'),
        data: history.map(h => h.ph),
        borderColor: '#1e5e3a',
        backgroundColor: 'rgba(30, 94, 58, 0.1)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        yAxisID: 'y',
      },
      {
        label: `${t('silage.moisture_gauge')} (%)`,
        data: history.map(h => h.moisture_pct),
        borderColor: '#0284c7',
        backgroundColor: 'transparent',
        borderDash: [4, 4],
        tension: 0.35,
        pointRadius: 1.5,
        yAxisID: 'y1',
      },
    ],
  };

  return (
    <div>
      {/* Page Title & Mission Subtitle */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1>{t('silage.title')}</h1>
          <p>{t('silage.subtitle')}</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600 }}>
          <Activity size={14} />
          <span>{t('silage.simulated_telemetry_badge', 'Simulated IoT Telemetry Stream — Demonstration Mode')}</span>
        </div>
      </div>

      {/* Silage Golden Rule Banner */}
      <div className="problem-banner" style={{ background: 'var(--color-primary-light)', borderLeftColor: 'var(--color-primary)', borderColor: 'var(--color-good-border)' }}>
        <Lightbulb size={24} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <h3 style={{ color: 'var(--color-primary)', marginBottom: 2 }}>{t('silage.silage_tip_title')}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{t('silage.silage_tip_desc')}</p>
        </div>
      </div>

      {/* Real-time Storage & Thermal Alerts */}
      {data.alerts && data.alerts.length > 0 && (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          {data.alerts.map((alert, i) => {
            const isWarning = alert.type === 'warning';
            const alertText = alert.message_key
              ? t(`silage.${alert.message_key}`, { unit: alert.unit_number, val: alert.val })
              : alert.message;

            return (
              <div key={i} className={`alert alert-${isWarning ? 'warning' : 'info'}`} style={{ marginBottom: 'var(--space-xs)' }}>
                {isWarning ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                <span>
                  {alert.unit_number > 0 && (
                    <strong>{t('silage.unit_name', { num: alert.unit_number })}: </strong>
                  )}
                  {alertText}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Storage Unit Selector Tabs (Trench/Pit, Silo Bag, Drum/Tower) */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {t('silage.unit_select')}
          </span>
          <button
            className="btn btn-secondary"
            onClick={fetchData}
            title={t('common.refresh', 'Refresh Telemetry')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
          >
            <RefreshCw size={13} style={{ marginRight: 4 }} />
            {t('common.refresh', 'Refresh')}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          {storageUnits.map((u, i) => {
            const isSelected = selectedUnit === i;
            const unitTypeKey = `type_${u.storage_type_key || 'pit_trench'}`;
            return (
              <button
                key={u.unit_id || i}
                className={`unit-tab-btn ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedUnit(i)}
                style={{ flex: '1 1 200px' }}
              >
                <div className="unit-tab-name">
                  <Warehouse size={16} />
                  <span>{t('silage.unit_name', { num: u.unit_number || i + 1 })}</span>
                </div>
                <div className="unit-tab-type">
                  {t(`silage.${unitTypeKey}`)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {currentUnit && (
        <div>
          {/* ============================================================ */}
          {/* FEATURE 1: DEDICATED TEMPERATURE & THERMAL STABILITY ANALYSIS */}
          {/* ============================================================ */}
          <div className="temp-analysis-card">
            {/* Section Header */}
            <div className="temp-header">
              <div className="temp-header-titles">
                <h2>
                  <Thermometer size={22} style={{ color: '#d97706' }} />
                  {t('silage.temp_analysis_title')}
                </h2>
                <p>{t('silage.temp_analysis_subtitle')}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                <span className="badge" style={{ background: `${zoneColor}18`, color: zoneColor, padding: '6px 12px', fontSize: '0.82rem', fontWeight: 700 }}>
                  {tempAnalysis.thermal_zone === 'optimal' ? <ShieldCheck size={14} style={{ marginRight: 4 }} /> : <ShieldAlert size={14} style={{ marginRight: 4 }} />}
                  {t(`silage.zone_${tempAnalysis.thermal_zone || 'optimal'}`)}
                </span>
              </div>
            </div>

            {/* Differential Comparison Hero (Core vs Ambient vs Delta) */}
            <div className="temp-differential-grid">
              {/* Core Internal Temperature */}
              <div className="temp-readout-card">
                <div className="temp-readout-label">
                  <Thermometer size={14} style={{ color: '#d97706' }} />
                  {t('silage.core_temp')}
                </div>
                <div className="temp-readout-val" style={{ color: zoneColor }}>
                  {tempAnalysis.core_temp_c ?? currentUnit.temperature_c}°C
                </div>
                <div className="temp-readout-sub">
                  {t('silage.thermal_zone')}: {t(`silage.zone_${tempAnalysis.thermal_zone || 'optimal'}`)}
                </div>
              </div>

              {/* Thermal Differential Delta Box */}
              <div className="temp-diff-center">
                <div className="temp-diff-tag">
                  {t('silage.temp_differential')}
                </div>
                <div className="temp-diff-val" style={{ color: isCooler ? 'var(--color-good)' : 'var(--color-moderate)' }}>
                  {tempAnalysis.differential_c > 0 ? `+${tempAnalysis.differential_c}` : tempAnalysis.differential_c}°C
                </div>
                <div
                  className="temp-diff-badge"
                  style={{
                    background: isCooler ? 'rgba(30, 94, 58, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                    color: isCooler ? 'var(--color-good)' : 'var(--color-moderate)'
                  }}
                >
                  {isCooler ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                  <span>{isCooler ? t('silage.diff_cool') : t('silage.diff_warm')}</span>
                </div>
              </div>

              {/* Ambient Shed Climate Temperature */}
              <div className="temp-readout-card">
                <div className="temp-readout-label">
                  <Sun size={14} style={{ color: '#2563eb' }} />
                  {t('silage.ambient_temp')}
                </div>
                <div className="temp-readout-val" style={{ color: 'var(--text-primary)' }}>
                  {tempAnalysis.ambient_temp_c ?? currentUnit.ambient_temperature_c ?? 28}°C
                </div>
                <div className="temp-readout-sub">
                  {t('silage.location')}: {t(`silage.loc_${currentUnit.location_key || 'north_field'}`)}
                </div>
              </div>
            </div>

            {/* Thermal Safety Zone Scale Bar */}
            <div className="thermal-zone-block">
              <div className="thermal-zone-bar-labels">
                <span style={{ color: '#1e5e3a' }}>● {t('silage.zone_optimal')}</span>
                <span style={{ color: '#d97706' }}>● {t('silage.zone_warning')}</span>
                <span style={{ color: '#dc2626' }}>● {t('silage.zone_critical')}</span>
              </div>
              <div className="thermal-zone-track">
                <div className="thermal-zone-segment zone-optimal-seg" title="15°C–25°C Optimal" />
                <div className="thermal-zone-segment zone-warning-seg" title="26°C–32°C Warning" />
                <div className="thermal-zone-segment zone-critical-seg" title=">32°C Critical" />
              </div>
            </div>

            {/* Thermal KPIs Grid */}
            <div className="thermal-kpis-grid">
              <div className="thermal-kpi-card">
                <div className="thermal-kpi-title">{t('silage.stability_score')}</div>
                <div className="thermal-kpi-value" style={{ color: 'var(--color-primary)' }}>
                  {tempAnalysis.thermal_stability_score || 94}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> / 100</span>
                </div>
                <div className="thermal-kpi-sub">
                  {t('silage.spoilage_risk')}: {t(`common.${currentUnit.spoilage_risk_key || 'low'}`)}
                </div>
              </div>

              <div className="thermal-kpi-card">
                <div className="thermal-kpi-title">{t('silage.aerobic_stability_hours')}</div>
                <div className="thermal-kpi-value" style={{ color: 'var(--color-good)' }}>
                  {tempAnalysis.aerobic_stability_hours || 65}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> hrs</span>
                </div>
                <div className="thermal-kpi-sub">
                  {t('silage.heating_risk')}: {t(`silage.heating_risk_${tempAnalysis.heating_risk || 'low'}`)}
                </div>
              </div>

              <div className="thermal-kpi-card">
                <div className="thermal-kpi-title">{t('silage.max_24h')} / {t('silage.min_24h')}</div>
                <div className="thermal-kpi-value" style={{ fontSize: '1.15rem' }}>
                  <span style={{ color: '#d97706' }}>{tempAnalysis.max_24h_temp ?? 23.6}°C</span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
                  <span style={{ color: 'var(--color-good)' }}>{tempAnalysis.min_24h_temp ?? 20.4}°C</span>
                </div>
                <div className="thermal-kpi-sub">{t('silage.fluctuation_24h', '24h Fluctuation')}</div>
              </div>

              <div className="thermal-kpi-card">
                <div className="thermal-kpi-title">{t('silage.fermentation_phase')}</div>
                <div className="thermal-kpi-value" style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {t(`silage.phase_${tempAnalysis.fermentation_phase || 'stable_storage'}`)}
                </div>
                <div className="thermal-kpi-sub">
                  {t('silage.days_sealed')}: {currentUnit.days_since_sealing}
                </div>
              </div>
            </div>

            {/* Actionable Thermal Management Advisory for Farmers */}
            <div className={`thermal-advisory-banner thermal-advisory-${tempAnalysis.thermal_zone || 'optimal'}`}>
              <Lightbulb size={22} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ display: 'block', marginBottom: 3 }}>
                  {t('silage.temp_advisory_title')}
                </strong>
                <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {t(`silage.temp_advisory_${tempAnalysis.thermal_zone || 'optimal'}`)}
                </p>
              </div>
            </div>

            {/* 24-Hour Core vs Ambient Temperature Dual-Line Chart */}
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                <Activity size={16} style={{ color: '#d97706' }} />
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  {t('silage.temp_chart_title')}
                </span>
              </div>
              <div style={{ height: '260px', width: '100%' }}>
                <Line data={tempHistoryChart} options={tempChartOptions} />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* FEATURE 2: SILAGE FERMENTATION CHEMISTRY & TELEMETRY GAUGES */}
          {/* ============================================================ */}
          <div className="gauges-grid">
            <GaugeCard
              value={currentUnit.ph}
              unit="pH"
              label={t('silage.ph_gauge')}
              color={currentUnit.ph <= 4.5 ? 'var(--color-good)' : 'var(--color-moderate)'}
              statusText={currentUnit.ph <= 4.5 ? t('common.good') : t('common.moderate')}
            />
            <GaugeCard
              value={currentUnit.temperature_c}
              unit="°C"
              label={t('silage.temp_gauge')}
              color={currentUnit.temperature_c <= 25 ? 'var(--color-good)' : 'var(--color-moderate)'}
              statusText={currentUnit.temperature_c <= 25 ? t('common.good') : t('common.moderate')}
            />
            <GaugeCard
              value={currentUnit.moisture_pct}
              unit="%"
              label={t('silage.moisture_gauge')}
              color="var(--color-wheat)"
              statusText={currentUnit.moisture_pct >= 60 && currentUnit.moisture_pct <= 70 ? t('common.good') : t('common.moderate')}
            />
            <GaugeCard
              value={currentUnit.co2_ppm}
              unit="ppm"
              label={t('silage.co2_gauge')}
              color="var(--color-primary)"
              statusText={t('common.good')}
            />
          </div>

          {/* Storage Unit Metadata Stats Bar */}
          <div className="stats-bar" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="stat">
              <div className="stat-text">{t('silage.storage_type')}</div>
              <div className="stat-number" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {t(`silage.type_${currentUnit.storage_type_key || 'pit_trench'}`)}
              </div>
            </div>
            <div className="stat">
              <div className="stat-text">{t('silage.quality_status')}</div>
              <div className="stat-number" style={{ fontSize: '1.25rem', color: 'var(--color-good)' }}>
                {t(`common.${currentUnit.fermentation_quality_key || 'good'}`)}
              </div>
            </div>
            <div className="stat">
              <div className="stat-text">{t('silage.days_sealed')}</div>
              <div className="stat-number" style={{ fontSize: '1.25rem' }}>
                {currentUnit.days_since_sealing}
              </div>
            </div>
            <div className="stat">
              <div className="stat-text">{t('silage.location')}</div>
              <div className="stat-number" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {t(`silage.loc_${currentUnit.location_key || 'north_field'}`)}
              </div>
            </div>
          </div>

          {/* 24-Hour Fermentation Trends (pH & Moisture) */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Activity size={18} style={{ color: 'var(--color-primary)' }} />
                {t('silage.history_title')}
              </span>
            </div>
            <div style={{ height: '280px', width: '100%' }}>
              <Line data={chemistryHistoryChart} options={chemistryChartOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
