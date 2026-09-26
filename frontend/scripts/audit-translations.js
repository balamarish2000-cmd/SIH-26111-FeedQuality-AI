// Audit translations across all 13 locales
import en from '../src/locales/en.js';
import hi from '../src/locales/hi.js';
import ta from '../src/locales/ta.js';
import te from '../src/locales/te.js';
import kn from '../src/locales/kn.js';
import ml from '../src/locales/ml.js';
import mr from '../src/locales/mr.js';
import bn from '../src/locales/bn.js';
import gu from '../src/locales/gu.js';
import pa from '../src/locales/pa.js';
import orLocale from '../src/locales/or.js';
import asLocale from '../src/locales/as.js';
import ur from '../src/locales/ur.js';

const locales = {
  hi, ta, te, kn, ml, mr, bn, gu, pa, or: orLocale, as: asLocale, ur
};

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      keys = keys.concat(getKeys(obj[k], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = new Set(getKeys(en));
console.log(`Total EN keys: ${enKeys.size}`);

let totalErrors = 0;

for (const [lang, data] of Object.entries(locales)) {
  const langKeys = new Set(getKeys(data));
  const missingInLang = [...enKeys].filter(k => !langKeys.has(k));
  const extraInLang = [...langKeys].filter(k => !enKeys.has(k));
  
  // Check empty
  const emptyKeys = [];
  function checkEmpty(obj, prefix = '') {
    for (const k of Object.keys(obj)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (typeof obj[k] === 'string' && obj[k].trim() === '') {
        emptyKeys.push(fullKey);
      } else if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
        checkEmpty(obj[k], fullKey);
      }
    }
  }
  checkEmpty(data);

  if (missingInLang.length > 0 || emptyKeys.length > 0) {
    totalErrors += missingInLang.length + emptyKeys.length;
    console.log(`[${lang}] Missing: ${missingInLang.length}, Extra: ${extraInLang.length}, Empty: ${emptyKeys.length}`);
    if (missingInLang.length > 0) {
      console.log(`  Sample missing keys in ${lang}:`, missingInLang.slice(0, 10));
    }
  } else {
    console.log(`[${lang}] ✓ 100% Complete (${langKeys.size} keys, 0 missing, ${extraInLang.length} extra)`);
  }
}

if (totalErrors === 0) {
  console.log('\nSUCCESS: All locales have 100% key parity with EN!');
} else {
  console.log(`\nATTENTION: Found ${totalErrors} missing or empty keys across locales.`);
}
