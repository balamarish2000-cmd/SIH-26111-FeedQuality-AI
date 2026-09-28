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
  if (!key && !fallbackLabel) return '';
  const raw = String(key || fallbackLabel || '').trim();
  const lower = raw.toLowerCase();

  // Match known nutrient parameters directly to localized clean names
  if (lower.includes('protein')) return t('nutrients.protein', 'Protein');
  if (lower.includes('moist')) return t('nutrients.moisture', 'Moisture');
  if (lower.includes('fiber') || lower.includes('fibre')) return t('nutrients.fiber', 'Fiber');
  if (lower.includes('energy') || lower.includes('mcal')) return t('nutrients.energy', 'Energy');
  if (lower.includes('urea')) return t('nutrients.urea', 'Urea');
  if (lower.includes('sand') || lower.includes('silica')) return t('nutrients.sand', 'Sand / Silica');
  if (lower.includes('aflatoxin')) return t('nutrients.aflatoxin', 'Aflatoxin');
  if (lower.includes('fungal')) return t('nutrients.fungal', 'Fungal Load');
  if (lower.includes('mould') || lower.includes('mold')) return t('nutrients.mould', 'Mould Index');
  if (lower.includes('temp')) return t('nutrients.temperature', 'Temperature');
  if (lower.includes('ph')) return t('nutrients.ph', 'pH');
  if (lower.includes('depth')) return t('nutrients.depth', 'Sampling Depth');
  if (lower.includes('mineral')) return t('nutrients.mineral', 'Mineral Index');

  const cleanKey = lower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return t('nutrients.' + cleanKey, t('analyze.' + cleanKey, fallbackLabel || key));
}

/**
 * Localize feeding recommendation dynamically based on report quality status.
 */
export function getLocalizedFeedingTip(t, advisory, qualityStatus) {
  const rawStatus = String(qualityStatus || advisory?.quality_status || 'Good').toLowerCase();
  const tipKey = (rawStatus === 'good' || rawStatus === 'moderate') ? 'normal' : 'compensate';
  return t(`advisory_feeding.${tipKey}`, advisory?.feeding_recommendation || advisory?.structured_advisory?.nutritional_guidance?.feeding_ration_tip || '');
}

/**
 * Localize storage recommendation dynamically based on spoilage flag.
 */
export function getLocalizedStorageTip(t, advisory, spoilageFlag) {
  const isSpoiled = spoilageFlag !== undefined && spoilageFlag !== null && spoilageFlag !== 0 && spoilageFlag !== '0';
  return isSpoiled
    ? t('advisory_storage.spoiled', 'Critical Spoilage Risk: Quarantine batch immediately and inspect storage humidity.')
    : t('advisory_storage.stable', 'Store feed sacks on elevated wooden pallets in a cool, well-ventilated dry space.');
}

/**
 * Localize farmer advisory / recommended action dynamically.
 */
export function getLocalizedFarmerAction(t, advisory, qualityStatus) {
  const rawStatus = String(qualityStatus || advisory?.quality_status || 'Good').toLowerCase();
  if (rawStatus === 'good') {
    return t('analyze.action_good', t('advisory_action.good.primary', 'Feed directly according to standard daily ration balance.'));
  }
  if (rawStatus === 'moderate') {
    return t('analyze.action_moderate', t('advisory_action.moderate.primary', 'Adjust concentrate proportions and supplement with mineral mixture.'));
  }
  return t('analyze.action_unsafe', t('advisory_action.critical.primary', 'Do not feed this batch to any dairy cattle or calves.'));
}

/**
 * Translate risk levels (Low Risk, Moderate Risk, High Risk, Critical Risk).
 */
export function getRiskLevelName(t, rawRisk) {
  if (!rawRisk) return t('risk_levels.low', 'Low Risk');
  const lower = String(rawRisk).toLowerCase().trim();
  if (lower.includes('low') || lower === 'good' || lower === 'safe') return t('risk_levels.low', 'Low Risk');
  if (lower.includes('mod') || lower.includes('med') || lower.includes('caution') || lower.includes('attention')) return t('risk_levels.medium', 'Moderate Risk');
  if (lower.includes('crit')) return t('risk_levels.critical', 'Critical Risk');
  if (lower.includes('high') || lower.includes('poor') || lower.includes('unsafe')) return t('risk_levels.high', 'High Risk');
  return t('risk_levels.' + lower, rawRisk);
}
