# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Feed Guard (SIH 2024, problem 26111): a Flask API that scores dairy feed/silage sensor readings with three scikit-learn models (quality grade, adulteration type, spoilage flag), wraps the result in a rule-based advisory, and serves a React 19 + Vite SPA. Deployed on Vercel as two services (`vercel.json`): `/api/*` → `backend/app.py:app`, everything else → `frontend/`.

**The README is partly stale**: it describes 5 languages (there are 13), a 14-feature input list (the real contract is `FEATURE_COLUMNS` in `backend/ml/common.py`: 14 numeric + `feed_type`, `firmware_version`), and a file layout that no longer exists. Trust the code.

## Commands

```bash
# Backend (http://localhost:5000, health: /api/health)
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py

# Frontend (http://localhost:5173; Vite proxies /api → :5000)
cd frontend && npm install
npm run dev          # npm run build / npm run preview
node scripts/audit-translations.js   # key-parity check of all locales against en.js

# ML training (separate, heavier env: LightGBM/XGBoost/CatBoost)
cd "ML/New Folder" && uv venv .venv && uv pip install -p .venv -r requirements.txt
.venv/bin/python train.py    # baseline sweep → models/ + reports/
.venv/bin/python refine.py   # ~30 min extended search + ensembling
.venv/bin/python predict.py  # score example readings with saved models
```

There is no test suite or linter configured for either side. To exercise the backend without a server, use Flask's test client (`import app; app.app.test_client()`) from inside `backend/`.

## Architecture

### Backend (`backend/`)
- `app.py` — all routes. Every route is registered twice (`/x` and `/api/x`) so it works both behind the Vite proxy and Vercel's rewrite. `app = Flask(...)` must stay at the top of the file: Vercel imports `app:app`, and module imports below it are wrapped in try/except so a failing import sets `STARTUP_ERROR` (reported by `/api/health`) instead of crashing the function. Models are lazy-loaded by `get_predictor()` on the first predict call.
- A custom `SafeJSONProvider` converts NaN/Inf to `null` in every response. Blank sensor fields are deliberately passed to the models as NaN (the pipelines median-impute with missing-indicators), so this is load-bearing — bare `NaN` breaks `JSON.parse` in the browser.
- **All state is in memory**: `analysis_history` (seeded with 50 random demo records at import) and the QR store in `qr_system.py`. Nothing persists across restarts, and on Vercel a QR generated on one instance won't verify on another.
- `ml/` is a **copy** of `ML/New Folder/{common.py,predict.py,models/}`. After retraining, copy the new `.joblib` files and any `common.py` change into `backend/ml/`. The pickles reference `common.LabeledPipeline`, which is why `app.py` registers `common` in `sys.modules` before unpickling. The currently deployed models are RandomForest-only, so the backend doesn't need LightGBM/XGBoost; if a retrain picks an XGBoost/LightGBM ensemble, add those to `backend/requirements.txt`.
- `advisory.py` — `generate_advisory(readings, predictions, lang)` returns legacy English `advisories`/`nutrition_summary`/etc. plus `structured_advisory` (the 5-part farmer report). Readings use `None` for "not measured" (NaN is normalized at the entry point). Localization is mostly done by emitting i18n keys (`title_key`, `bullet_keys`, `params`) that the frontend translates; some inline per-language strings live in `I18N_ADVISORY` and local dicts.
- `image_analyzer.py` — heuristic color/texture features from a photo → *estimated* readings fed to the same models. `cv2` is optional (PIL fallback).
- `qr_system.py` — HMAC-SHA256 (`QR_SECRET_KEY`) signed batch certificates rendered as base64 PNG QR codes.

### Frontend (`frontend/src/`)
- Plain `fetch` wrappers in `api.js` (base `/api`). Pages in `pages/`, shell/nav/connectivity badge in `components/Layout.jsx`, routes + `ProtectedRoute` in `App.jsx`.
- **Auth and per-user data are client-side.** `context/AuthContext.jsx` uses Supabase when `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set (schema in `supabase_schema.sql`), otherwise falls back to a localStorage account registry with a seeded reference account. `utils/userDataManager.js` stores each user's tests/silage/notifications in localStorage keys scoped by user id — separate from the backend's global `analysis_history`.
- **i18n**: `i18n.js` + `locales/{13 langs}.js`, registered in `locales/index.js`; `ur` switches the document to RTL. `en.js` is the source of truth. When adding UI text, add the key to all 13 locale files and run `audit-translations.js`. `utils/translations.js` maps raw backend strings (feed types, adulterant names, etc.) to translation keys — use it rather than rendering backend labels directly. The `scripts/inject-*.cjs` / `merge-*.cjs` scripts are one-off bulk injectors used for past locale batches.
