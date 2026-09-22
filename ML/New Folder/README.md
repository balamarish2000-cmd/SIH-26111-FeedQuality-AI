# SIH26111 -- Feed Quality ML Models

Trains three production classifiers on `SIH26111_production_ml_dataset.csv`
(30,000 readings from a low-cost livestock feed-quality sensor kit), each
predicting a different label from the same raw sensor panel:

| Target | Type | Meaning |
|---|---|---|
| `quality_status` | 4-class | Overall grade: Good / Moderate / Poor / Unsafe |
| `adulteration_type` | 6-class | Detected adulterant, or "None" |
| `spoilage_flag` | binary | Is the batch spoiled |

## Quickstart

```bash
uv venv .venv
uv pip install -p .venv -r requirements.txt
.venv/bin/python train.py     # baseline sweep: 4 families x ~2 configs, saves models + reports/figures
.venv/bin/python refine.py    # extended search: 4 families x ~20 random configs + ensembling (~30 min)
.venv/bin/python predict.py   # demo: score new sensor readings with the saved models
```

## Data handling

- The CSV already ships a stratified `train` / `validation` / `test` split
  (checked: every `batch_id` falls entirely within one split, so there's no
  batch-level leakage across them). That split is used as-is throughout --
  no re-shuffling.
- **Features** are the 14 raw sensor readings (moisture, protein, fiber,
  energy, mineral-deficiency index, urea %, sand/silica %, aflatoxin ppb,
  fungal load, mould index, storage temperature, pH, sampling depth,
  measurement repeat) plus `feed_type` and `firmware_version`.
- **Excluded from features:** `sample_id`, `batch_id`, `collection_timestamp`
  (checked for seasonal drift across the full 20-month span -- none found),
  and `device_id`. `device_id` is a 150-level identifier for the physical
  sensor unit; EDA showed no real per-device signal (label distributions are
  ~constant across devices), and a model that leaned on it wouldn't
  generalize to new devices deployed in the field.
- `ph` is ~73% missing -- it's essentially a Silage-only fermentation-quality
  measurement (96% present for Silage, ~0% for every other feed type).
  Missingness is informative, so it's handled with median imputation plus an
  explicit missing-indicator column rather than being dropped.
- The three targets are predicted **independently** from sensor features only
  (never from each other). In real deployment a device knows none of the
  three labels in advance -- all three are outputs, so training one target on
  another would be leakage that can't be replicated at inference time.
- Data-loading gotcha worth flagging: `adulteration_type`'s majority class is
  the literal string `"None"` (no adulterant found). pandas' `read_csv`
  treats `"None"` as a missing-value token by default, which silently
  corrupted that column until `common.load_dataset()` explicitly restores it
  (`fillna("None")`) after loading.

## Modeling approach

**Baseline (`train.py`):** for each target, 7 candidates (Logistic Regression,
2x Random Forest, 2x LightGBM, 2x XGBoost, all class-balanced) fit on `train`,
scored on `validation` by **macro-F1** -- the right selection metric here
because classes are imbalanced and a rare-but-dangerous class (e.g. "Unsafe",
or a specific adulterant) matters as much as the majority class.

**Refinement (`refine.py`):** adds CatBoost as a 4th family (with its own
native categorical/missing-value handling, no impute/one-hot needed), then
runs ~20 randomized hyperparameter configs per family per target (86
candidates/target total, including the baseline's own configs as a floor so
this search is a strict superset), plus a soft-voting ensemble stage over the
best config found per family. Whichever single model or ensemble wins on
validation is refit on `train + validation` and is the candidate that gets
shipped -- **except for `adulteration_type`, where the raw search winner was
overridden; see finding 3 below.** `test` is never touched until that final,
once-only evaluation.

## Results (held-out test set, after refinement)

| Target | Accuracy | Macro-F1 | Balanced accuracy | Shipped model |
|---|---|---|---|---|
| `quality_status` | 71.6% | 0.760 | 0.762 | Ensemble (XGBoost + LightGBM) |
| `spoilage_flag` | 99.96% | 0.999 | 0.9998 | Random Forest |
| `adulteration_type` | 98.3% | 0.832 | 0.833 | Random Forest (accuracy-favoring, see finding 3) |

`spoilage_flag` was already at its ceiling in the baseline sweep and the
refinement search confirmed that (identical winner, identical numbers).
`quality_status` improved modestly and cleanly (an XGBoost+LightGBM ensemble
beat every single model on both accuracy and macro-F1 at once).
`adulteration_type` is where the interesting result is -- see finding 3.

Full leaderboards (every candidate tried, baseline and refined), every
confusion matrix, and the full per-class breakdown are in
`reports/training_report.txt` / `reports/metrics.json` (baseline) and
`reports/refinement_report.txt` / `reports/refinement_metrics.json`
(refinement, including the override rationale for `adulteration_type`).

### Three findings worth knowing before demoing this

1. **`quality_status` mistakes are safe mistakes.** The confusion matrix
   (`reports/figures/quality_status_confusion_matrix.png`) shows essentially
   all errors fall between *adjacent* grades (Poor <-> Moderate, Moderate <->
   Good). Good is confused with Unsafe 0% of the time in either direction --
   the model never calls genuinely unsafe feed safe, or vice versa.

2. **`adulteration_type` cannot detect "Excess Salt"** -- confirmed
   statistically, not just from the confusion matrix: the standardized mean
   difference (Cohen's d) between "Excess Salt" and "None" samples is <= 0.11
   on *every single sensor feature*, i.e. negligible. Every other adulterant
   has a sensor channel that measures it directly (urea_pct for Urea
   Adulteration, sand_silica_pct, mineral_deficiency_index, mould/fungal/
   aflatoxin readings for Mould/Fungal Contamination) -- but there is no
   salt/sodium/conductivity channel in this panel, so there is no signal to
   learn for that one class. This is a sensor-panel gap, not a fixable
   modeling issue -- if detecting salt adulteration matters for the
   submission, add an electrical-conductivity or sodium sensor to the device.

3. **The refinement search's raw macro-F1 winner for `adulteration_type` was
   overridden, and it's worth understanding why.** The best-by-macro-F1
   config (RandomForest, val macro_f1=0.8383) got there by occasionally (6.8%
   of the time) guessing "Excess Salt" correctly -- but finding 2 already
   proved that class has no real signal, so that 6.8% is noise fit to this
   particular split, not a real capability. Chasing it cost real accuracy:
   `None` recall dropped from 98.7% (original baseline) to 96.0%, i.e. more
   clean batches flagged as false alarms. A different RandomForest config
   (found in the same search) matches the raw winner exactly on all 4
   *genuinely* detectable adulterants (100% precision/recall on Mineral
   Imbalance, Mould/Fungal Contamination, Sand/Silica Contamination, and Urea
   Adulteration, in both configs), scores 0% on the unlearnable class instead
   of chasing it, and as a result **dominates both the raw search winner and
   the original baseline on accuracy, macro-F1, and balanced accuracy
   simultaneously** -- no config anywhere in the 86-candidate search does
   that except this one. That's the model actually shipped in `models/`. The
   general lesson: macro-F1 (or any metric) is only as trustworthy as the
   labels it's averaging over -- when one class has been shown to be
   unlearnable, a model "improving" on it is a red flag to double-check, not
   a result to report at face value. Full numbers for both configs are in
   `reports/refinement_report.txt`.

## Files

```
common.py       feature/target definitions, preprocessing pipelines, LabeledPipeline wrapper (supports ensembles)
plotting.py     report chart helpers (palette + chart specs from the dataviz skill)
train.py        baseline sweep: 4 families x ~2 configs each, saves models + reports
refine.py       extended sweep: 4 families x ~20 random configs + ensembling, saves models + reports
predict.py      FeedQualityPredictor -- loads saved models, scores new readings end-to-end
models/         *_model.joblib -- one self-contained (preprocessing + classifier[s]) pipeline per target
reports/        training_report.txt / metrics.json       (baseline sweep)
                refinement_report.txt / refinement_metrics.json  (extended sweep + override rationale)
                figures/*.png  (always reflects the currently-shipped model per target)
requirements.txt  exact installed versions (uv pip freeze)
```

## Using the trained models in other code

```python
from predict import FeedQualityPredictor
import pandas as pd

predictor = FeedQualityPredictor()
readings = pd.DataFrame([{...}])  # columns: see common.FEATURE_COLUMNS
result = predictor.predict(readings)  # quality_status, adulteration_type, spoilage_flag + confidences
```

## Possible next steps

- Treat `quality_status` as ordinal (e.g. ordinal logistic / CORAL) instead
  of plain multiclass -- errors are already adjacent-only (finding 1), so
  this would likely tighten macro-F1 further without much added complexity.
  `quality_status`'s weakest class, "Moderate" (precision 0.57 / recall
  0.62), barely moved between the baseline and the 86-candidate refinement
  search -- that's a sign it's an intrinsically ambiguous middle class in
  the data/labels, not a tuning gap, so ordinal modeling (which is aware
  "Moderate" sits between "Poor" and "Good" rather than treating all
  mistakes as equally wrong) is a more promising lever than further search.
- Add a conductivity/sodium sensor channel to make "Excess Salt" detectable
  (findings 2-3) -- no amount of modeling can substitute for that signal
  simply not being measured.
- The randomized search in `refine.py` was 20 draws/family/target with fixed
  bounded ranges; a guided search (Optuna/Bayesian) seeded near the best
  regions found here could plausibly squeeze out a bit more, but based on
  where the 86-candidate search plateaued, expect diminishing returns
  everywhere except possibly the ordinal-modeling angle above.
