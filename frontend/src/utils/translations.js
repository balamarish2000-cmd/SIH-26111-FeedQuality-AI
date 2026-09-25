/**
 * Feed Guard — Comprehensive Multilingual Translation Utilities
 * 
 * Provides robust fallbacks and normalization for dynamic data returned from
 * ML models, backend APIs, IoT telemetry, and mock datasets.
 */

/**
 * Translate adulteration types reliably across all supported languages.
 * Handles strings like "Sand/Silica Contamination", "Mould/Fungal Contamination",
 * "Urea Adulteration", "None", with any combination of slashes, spaces, or casing.
 */
export function getAdulterantName(t, rawType) {
  if (!rawType) return t('adulterants.none', 'None (Clean)');
  const s = String(rawType).trim();
  if (s === 'None' || s === 'Clean' || s.toLowerCase() === 'none' || s.toLowerCase() === 'clean') {
    return t('adulterants.none', 'None (Clean)');
  }
  const lower = s.toLowerCase();
  if (lower.includes('sand') || lower.includes('silica')) {
    return t('adulterants.sand_silica_contamination', 'Sand / Silica Contamination');
  }
  if (lower.includes('mould') || lower.includes('mold') || lower.includes('fungal')) {
    return t('adulterants.mould_fungal_contamination', 'Mould / Fungal Contamination');
  }
  if (lower.includes('urea')) {
    return t('adulterants.urea_adulteration', 'Urea Adulteration');
  }
  const key = lower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return t('adulterants.' + key, rawType);
}

/**
 * Translate feed types reliably across all supported languages.
 */
export function getFeedTypeName(t, rawType) {
  if (!rawType || rawType === 'All') return t('common.all_feed_types', 'All Feed Types');
  const lower = String(rawType).toLowerCase().trim();
  if (lower.includes('pellet') || lower.includes('concentrate')) {
    return t('feed_types.cattle_feed_pellet', 'Cattle Feed Pellet');
  }
  if (lower.includes('corn') && lower.includes('silage')) {
    return t('feed_types.corn_silage', 'Corn Silage');
  }
  if (lower.includes('silage')) {
    return t('feed_types.silage', 'Silage');
  }
  if (lower.includes('tmr') || lower.includes('total mixed')) {
    return t('feed_types.tmr', 'Total Mixed Ration (TMR)');
  }
  if (lower.includes('mineral')) {
    return t('feed_types.mineral_mixture', 'Mineral Mixture');
  }
  if (lower.includes('mash') || lower.includes('mixed forage')) {
    return t('feed_types.feed_mash', 'Feed Mash');
  }
  if (lower.includes('green') || lower.includes('fodder')) {
    return t('feed_types.green_fodder', 'Green Fodder');
  }
  const key = lower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return t('feed_types.' + key, rawType);
}

/**
 * Translate quality status grades (Good, Moderate, Poor, Unsafe).
 */
export function getQualityStatusName(t, rawStatus) {
  if (!rawStatus || rawStatus === 'All') return t('common.all_grades', 'All Quality Grades');
  const lower = String(rawStatus).toLowerCase().trim();
  if (lower === 'good') return t('quality_grades.good', 'Good');
  if (lower === 'moderate') return t('quality_grades.moderate', 'Moderate');
  if (lower === 'poor') return t('quality_grades.poor', 'Poor');
  if (lower === 'unsafe') return t('quality_grades.unsafe', 'Unsafe');
  return t('quality_grades.' + lower, rawStatus);
}

/**
 * Translate region and farm origin names.
 */
export function getRegionName(t, region) {
  if (!region) return '';
  const lower = String(region).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return t('regions.' + lower, region);
}

/**
 * Map nutrient parameter keys to their localized names.
 */
export const NUTRIENT_KEY_MAP = {
  moisture_pct: 'moisture',
  protein_pct: 'protein',
  fiber_pct: 'fiber',
  energy_mcal_per_kg: 'energy',
  mineral_deficiency_index: 'mineral',
  urea_pct: 'urea',
  sand_silica_pct: 'sand',
  aflatoxin_ppb: 'aflatoxin',
  fungal_load_index: 'fungal',
  mould_index_pct: 'mould',
  storage_temperature_c: 'temperature',
  ph: 'ph',
  sampling_depth_cm: 'depth',
};

export function getNutrientLabel(t, key, fallbackLabel) {
  const i18nKey = NUTRIENT_KEY_MAP[key];
  if (i18nKey) {
    return t('analyze.' + i18nKey, fallbackLabel || key);
  }
  return fallbackLabel || key;
}
