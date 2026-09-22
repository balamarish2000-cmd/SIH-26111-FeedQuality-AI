"""Extended model search for SIH26111 -- pushes past train.py's baseline
sweep to get the best achievable accuracy/macro-F1 per target.

What this adds on top of train.py:
  * A 4th model family, CatBoost, with its own native-categorical /
    native-missing-value preprocessing path (no impute/one-hot needed).
  * A much wider randomized hyperparameter search per family (not 2
    hand-picked configs) -- N_ITER random draws plus train.py's own known
    configs re-included as a floor, so this search can never do worse than
    the original baseline.
  * A soft-voting ensemble stage: after the search, the best config found
    for each family is combined (2-way / 3-way / 4-way) and every
    combination is scored on validation too. Whichever single model or
    ensemble wins on validation is the one that gets shipped.
  * Refit-on-(train+validation), single untouched-test evaluation, exactly
    like train.py, for the winning choice only.

Run: .venv/bin/python refine.py [n_iter_per_family]   (default 20)
"""

from __future__ import annotations

import json
import random
import sys
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from catboost import CatBoostClassifier
from lightgbm import LGBMClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder
from sklearn.utils.class_weight import compute_sample_weight
from xgboost import XGBClassifier

from common import (
    CATEGORICAL_FEATURES,
    CLASS_ORDER,
    FEATURE_COLUMNS,
    TARGETS,
    LabeledPipeline,
    build_catboost_preprocessor,
    build_preprocessor,
    get_xy,
    load_dataset,
    split_dataset,
)
from plotting import plot_confusion_matrix, plot_feature_importance

ROOT = Path(__file__).parent
MODELS_DIR = ROOT / "models"
REPORTS_DIR = ROOT / "reports"
FIGURES_DIR = REPORTS_DIR / "figures"
RANDOM_STATE = 42

N_ITER = int(sys.argv[1]) if len(sys.argv) > 1 else 20


# ---------------------------------------------------------------------------
# Hyperparameter samplers. Each returns a dict of estimator kwargs.
# ---------------------------------------------------------------------------

def sample_rf_config(rng: random.Random) -> dict:
    return dict(
        n_estimators=rng.choice([200, 300, 400, 500, 600, 800]),
        max_depth=rng.choice([None, 8, 12, 16, 20, 24]),
        min_samples_leaf=rng.choice([1, 2, 3, 5, 8]),
        min_samples_split=rng.choice([2, 4, 8]),
        max_features=rng.choice(["sqrt", "log2", 0.5, 0.7, None]),
    )


def sample_lgbm_config(rng: random.Random) -> dict:
    return dict(
        n_estimators=rng.choice([200, 300, 400, 500, 600, 800, 1000]),
        num_leaves=rng.choice([15, 31, 63, 95, 127]),
        max_depth=rng.choice([-1, 6, 8, 10, 12]),
        learning_rate=rng.choice([0.01, 0.02, 0.03, 0.05, 0.07, 0.1]),
        min_child_samples=rng.choice([5, 10, 20, 30, 50]),
        subsample=rng.choice([0.6, 0.7, 0.8, 0.9, 1.0]),
        colsample_bytree=rng.choice([0.6, 0.7, 0.8, 0.9, 1.0]),
        reg_alpha=rng.choice([0, 0.01, 0.1, 0.5, 1.0]),
        reg_lambda=rng.choice([0, 0.01, 0.1, 0.5, 1.0]),
    )


def sample_xgb_config(rng: random.Random) -> dict:
    return dict(
        n_estimators=rng.choice([200, 300, 400, 500, 600, 800, 1000]),
        max_depth=rng.choice([3, 4, 5, 6, 7, 8, 9]),
        learning_rate=rng.choice([0.01, 0.02, 0.03, 0.05, 0.07, 0.1]),
        min_child_weight=rng.choice([1, 2, 3, 5, 8]),
        subsample=rng.choice([0.6, 0.7, 0.8, 0.9, 1.0]),
        colsample_bytree=rng.choice([0.6, 0.7, 0.8, 0.9, 1.0]),
        reg_alpha=rng.choice([0, 0.01, 0.1, 0.5, 1.0]),
        reg_lambda=rng.choice([0.5, 1.0, 1.5, 2.0]),
        gamma=rng.choice([0, 0.1, 0.5, 1.0]),
    )


def sample_catboost_config(rng: random.Random) -> dict:
    return dict(
        iterations=rng.choice([200, 300, 400, 500, 600, 800]),
        depth=rng.choice([4, 5, 6, 7, 8, 9, 10]),
        learning_rate=rng.choice([0.01, 0.02, 0.03, 0.05, 0.07, 0.1]),
        l2_leaf_reg=rng.choice([1, 3, 5, 7, 9]),
        border_count=rng.choice([32, 64, 128, 254]),
    )


# Known-good configs from train.py's own sweep, re-included as a floor so
# this search is a strict superset and can never regress vs the baseline.
SEED_CONFIGS = {
    "RandomForest": [
        dict(n_estimators=300, max_depth=None, min_samples_leaf=1, min_samples_split=2, max_features="sqrt"),
        dict(n_estimators=500, max_depth=16, min_samples_leaf=2, min_samples_split=2, max_features="sqrt"),
    ],
    "LightGBM": [
        dict(n_estimators=400, num_leaves=31, max_depth=-1, learning_rate=0.05, min_child_samples=20,
             subsample=1.0, colsample_bytree=1.0, reg_alpha=0, reg_lambda=0),
        dict(n_estimators=600, num_leaves=63, max_depth=-1, learning_rate=0.03, min_child_samples=20,
             subsample=1.0, colsample_bytree=1.0, reg_alpha=0, reg_lambda=0),
    ],
    "XGBoost": [
        dict(n_estimators=400, max_depth=6, learning_rate=0.05, min_child_weight=1,
             subsample=1.0, colsample_bytree=1.0, reg_alpha=0, reg_lambda=1.0, gamma=0),
        dict(n_estimators=600, max_depth=8, learning_rate=0.03, min_child_weight=1,
             subsample=1.0, colsample_bytree=1.0, reg_alpha=0, reg_lambda=1.0, gamma=0),
    ],
    "CatBoost": [],
}

FAMILIES = ["RandomForest", "LightGBM", "XGBoost", "CatBoost"]
SAMPLERS = {
    "RandomForest": sample_rf_config,
    "LightGBM": sample_lgbm_config,
    "XGBoost": sample_xgb_config,
    "CatBoost": sample_catboost_config,
}
NEEDS_SAMPLE_WEIGHT = {"RandomForest": False, "LightGBM": False, "XGBoost": True, "CatBoost": False}


def make_estimator(family: str, cfg: dict):
    if family == "RandomForest":
        return RandomForestClassifier(random_state=RANDOM_STATE, n_jobs=-1, class_weight="balanced_subsample", **cfg)
    if family == "LightGBM":
        return LGBMClassifier(random_state=RANDOM_STATE, class_weight="balanced", verbosity=-1, subsample_freq=1, **cfg)
    if family == "XGBoost":
        return XGBClassifier(random_state=RANDOM_STATE, **cfg)
    if family == "CatBoost":
        return CatBoostClassifier(
            random_state=RANDOM_STATE, cat_features=CATEGORICAL_FEATURES,
            auto_class_weights="Balanced", verbose=False, thread_count=-1, **cfg,
        )
    raise ValueError(family)


def preprocessor_for(family: str):
    return build_catboost_preprocessor if family == "CatBoost" else build_preprocessor


def fit_candidate(family: str, cfg: dict, X, y_enc) -> Pipeline:
    pipe = Pipeline(steps=[("preprocess", preprocessor_for(family)()), ("classifier", make_estimator(family, cfg))])
    if NEEDS_SAMPLE_WEIGHT[family]:
        weights = compute_sample_weight("balanced", y_enc)
        pipe.fit(X, y_enc, classifier__sample_weight=weights)
    else:
        pipe.fit(X, y_enc)
    return pipe


def evaluate(y_true_enc, y_pred_enc, label_encoder: LabelEncoder) -> dict:
    y_true = label_encoder.inverse_transform(y_true_enc)
    y_pred = label_encoder.inverse_transform(y_pred_enc)
    labels = list(label_encoder.classes_)
    report = classification_report(y_true, y_pred, labels=labels, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "balanced_accuracy": balanced_accuracy_score(y_true, y_pred),
        "macro_f1": f1_score(y_true, y_pred, average="macro", zero_division=0),
        "weighted_f1": f1_score(y_true, y_pred, average="weighted", zero_division=0),
        "classification_report": report,
        "confusion_matrix": cm.tolist(),
        "labels": labels,
    }


def ordered_labels(target: str, label_encoder: LabelEncoder) -> list:
    preferred = CLASS_ORDER.get(target)
    known = list(label_encoder.classes_)
    if preferred is None:
        return known
    ordered = [c for c in preferred if c in known]
    ordered += [c for c in known if c not in ordered]
    return ordered


def ensemble_proba(members: list[tuple[str, Pipeline]], X) -> np.ndarray:
    return np.mean([pipe.predict_proba(X) for _, pipe in members], axis=0)


def refine_target(df_train, df_val, df_test, target: str, n_iter: int) -> dict:
    print(f"\n{'='*70}\nTarget: {target}  (search budget: {n_iter} random configs/family + seeds)\n{'='*70}")
    t_start = time.time()

    X_train, y_train_raw = get_xy(df_train, target)
    X_val, y_val_raw = get_xy(df_val, target)
    X_test, y_test_raw = get_xy(df_test, target)

    label_encoder = LabelEncoder().fit(pd.concat([y_train_raw, y_val_raw, y_test_raw], ignore_index=True))
    y_train = label_encoder.transform(y_train_raw)
    y_val = label_encoder.transform(y_val_raw)

    rng = random.Random(RANDOM_STATE + hash(target) % 10_000)

    search_log = []
    best_per_family: dict[str, dict] = {}  # family -> {config, pipe, metrics}

    for family in FAMILIES:
        configs = list(SEED_CONFIGS[family])
        seen = set(tuple(sorted(c.items())) for c in configs)
        while len(configs) < len(SEED_CONFIGS[family]) + n_iter:
            cfg = SAMPLERS[family](rng)
            key = tuple(sorted(cfg.items()))
            if key in seen:
                continue
            seen.add(key)
            configs.append(cfg)

        for i, cfg in enumerate(configs):
            t0 = time.time()
            try:
                pipe = fit_candidate(family, cfg, X_train, y_train)
            except Exception as exc:
                print(f"  [{family} {i+1}/{len(configs)}] FAILED: {exc}")
                continue
            fit_seconds = time.time() - t0
            y_val_pred = pipe.predict(X_val)
            metrics = evaluate(y_val, y_val_pred, label_encoder)
            search_log.append({
                "family": family, "config": cfg, "val_macro_f1": metrics["macro_f1"],
                "val_accuracy": metrics["accuracy"], "val_balanced_accuracy": metrics["balanced_accuracy"],
                "fit_seconds": round(fit_seconds, 1),
            })
            print(
                f"  [{family:<14} {i+1:>2}/{len(configs)}] macro_f1={metrics['macro_f1']:.4f} "
                f"acc={metrics['accuracy']:.4f} ({fit_seconds:.1f}s)"
            )
            if family not in best_per_family or metrics["macro_f1"] > best_per_family[family]["metrics"]["macro_f1"]:
                best_per_family[family] = {"config": cfg, "pipe": pipe, "metrics": metrics}

    # --- Ensembling stage: combine the best-of-each-family pipelines -------
    ranked_families = sorted(best_per_family, key=lambda f: best_per_family[f]["metrics"]["macro_f1"], reverse=True)
    print("\n  Best single model per family (validation):")
    for fam in ranked_families:
        print(f"    {fam:<14} macro_f1={best_per_family[fam]['metrics']['macro_f1']:.4f}")

    candidates = []  # list of (label, members, metrics)
    for fam in ranked_families:
        candidates.append((fam, [(fam, best_per_family[fam]["pipe"])], best_per_family[fam]["metrics"]))

    for k in range(2, len(ranked_families) + 1):
        top_k_families = ranked_families[:k]
        members = [(fam, best_per_family[fam]["pipe"]) for fam in top_k_families]
        proba = ensemble_proba(members, X_val)
        y_val_pred = np.argmax(proba, axis=1)
        metrics = evaluate(y_val, y_val_pred, label_encoder)
        label = f"Ensemble({'+'.join(top_k_families)})"
        candidates.append((label, members, metrics))
        print(f"    {label:<40} macro_f1={metrics['macro_f1']:.4f}")

    candidates.sort(key=lambda c: c[2]["macro_f1"], reverse=True)
    winner_label, winner_members_val, winner_val_metrics = candidates[0]
    print(f"\n  -> WINNER: {winner_label} (val_macro_f1={winner_val_metrics['macro_f1']:.4f})")

    # --- Refit the winning member(s) on train+validation -------------------
    X_trainval = pd.concat([X_train, X_val], ignore_index=True)
    y_trainval_raw = pd.concat([y_train_raw, y_val_raw], ignore_index=True)
    y_trainval = label_encoder.transform(y_trainval_raw)

    winner_families = [name for name, _ in winner_members_val]
    final_members = []
    for fam in winner_families:
        cfg = best_per_family[fam]["config"]
        final_pipe = fit_candidate(fam, cfg, X_trainval, y_trainval)
        final_members.append((fam, final_pipe))

    y_test = label_encoder.transform(y_test_raw)
    test_proba = ensemble_proba(final_members, X_test)
    y_test_pred = np.argmax(test_proba, axis=1)
    test_metrics = evaluate(y_test, y_test_pred, label_encoder)
    print(
        f"  FINAL (train+val -> test) macro_f1={test_metrics['macro_f1']:.4f}  "
        f"acc={test_metrics['accuracy']:.4f}  bal_acc={test_metrics['balanced_accuracy']:.4f}"
    )

    labeled = LabeledPipeline(final_members, label_encoder, target, FEATURE_COLUMNS)
    model_path = MODELS_DIR / f"{target}_model.joblib"
    joblib.dump(labeled, model_path)
    print(f"  saved -> {model_path.relative_to(ROOT)}  (members: {labeled.member_names})")

    labels_ordered = ordered_labels(target, label_encoder)
    perm = [test_metrics["labels"].index(label) for label in labels_ordered]
    cm_reordered = np.array(test_metrics["confusion_matrix"])[np.ix_(perm, perm)]
    plot_confusion_matrix(
        cm_reordered, labels_ordered, f"{target} -- test-set confusion matrix (row %), {winner_label}",
        FIGURES_DIR / f"{target}_confusion_matrix.png",
    )

    importances = labeled.get_feature_importances()
    if importances is not None:
        plot_feature_importance(
            importances, f"{target} -- feature importance (primary member: {winner_families[0]})",
            FIGURES_DIR / f"{target}_feature_importance.png",
        )

    elapsed = time.time() - t_start
    print(f"  target wall time: {elapsed/60:.1f} min")

    return {
        "target": target,
        "winner": winner_label,
        "winner_families": winner_families,
        "search_log": search_log,
        "candidate_summaries": [
            {"label": lbl, "val_macro_f1": m["macro_f1"], "val_accuracy": m["accuracy"]}
            for lbl, _, m in candidates
        ],
        "validation_metrics_of_winner": winner_val_metrics,
        "test_metrics_of_shipped_model": test_metrics,
        "n_train": len(X_train), "n_validation": len(X_val), "n_test": len(X_test),
        "n_train_plus_validation": len(X_trainval),
        "elapsed_seconds": round(elapsed, 1),
    }


def main():
    print(f"Loading dataset... (search budget = {N_ITER} random configs per family per target)")
    df = load_dataset()
    splits = split_dataset(df)
    print(f"  train={len(splits['train'])}  validation={len(splits['validation'])}  test={len(splits['test'])}")

    all_results = {}
    for target in TARGETS:
        all_results[target] = refine_target(splits["train"], splits["validation"], splits["test"], target, N_ITER)

    summary_path = REPORTS_DIR / "refinement_metrics.json"
    with open(summary_path, "w") as f:
        json.dump(all_results, f, indent=2, default=float)
    print(f"\nFull refinement metrics written -> {summary_path.relative_to(ROOT)}")

    write_text_report(all_results)


def write_text_report(all_results: dict) -> None:
    lines = ["SIH26111 Feed Quality Models -- Refinement Report", "=" * 60, ""]
    for target, res in all_results.items():
        tm = res["test_metrics_of_shipped_model"]
        lines.append(f"## {target}")
        lines.append(f"Winner: {res['winner']}  (search took {res['elapsed_seconds']/60:.1f} min)")
        lines.append("")
        lines.append("Candidate summary (single-family bests + ensembles), by validation macro-F1:")
        for c in sorted(res["candidate_summaries"], key=lambda c: c["val_macro_f1"], reverse=True):
            lines.append(f"  {c['label']:<40} macro_f1={c['val_macro_f1']:.4f}  acc={c['val_accuracy']:.4f}")
        lines.append("")
        lines.append(
            f"HELD-OUT TEST performance of shipped model: "
            f"accuracy={tm['accuracy']:.4f}  macro_f1={tm['macro_f1']:.4f}  "
            f"balanced_accuracy={tm['balanced_accuracy']:.4f}  weighted_f1={tm['weighted_f1']:.4f}"
        )
        lines.append("")
        lines.append("Per-class test metrics:")
        for label in tm["labels"]:
            cr = tm["classification_report"][str(label)]
            lines.append(
                f"  {str(label):<28} precision={cr['precision']:.3f}  recall={cr['recall']:.3f}  "
                f"f1={cr['f1-score']:.3f}  support={int(cr['support'])}"
            )
        lines.append("")
        lines.append("-" * 60)
        lines.append("")

    report_path = REPORTS_DIR / "refinement_report.txt"
    report_path.write_text("\n".join(lines))
    print(f"Text report written -> {report_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
