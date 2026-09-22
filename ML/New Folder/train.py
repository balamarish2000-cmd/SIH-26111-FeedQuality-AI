"""Train, select, and save production models for SIH26111 feed-quality data.

For each of the three targets (quality_status, spoilage_flag,
adulteration_type):
  1. Fit several candidate model families on the 'train' split only.
  2. Score every candidate on the untouched 'validation' split (macro-F1 is
     the selection metric -- appropriate here because the classes are
     imbalanced and the minority classes, e.g. "Unsafe" or a specific
     adulterant, matter just as much as the majority "Good"/"None" class).
  3. Report validation metrics for every candidate (model_comparison.json/png)
     and a detailed classification report for the winner.
  4. Refit the winning model family on train+validation combined (all
     labeled non-test data) -- this is the artifact that gets saved and is
     what would actually ship.
  5. Evaluate that shipped artifact once on the held-out 'test' split for an
     unbiased estimate of real-world performance, and save confusion-matrix /
     feature-importance figures.

Run: .venv/bin/python train.py
"""

from __future__ import annotations

import json
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
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

import joblib
from lightgbm import LGBMClassifier
from xgboost import XGBClassifier

from common import (
    CLASS_ORDER,
    FEATURE_COLUMNS,
    TARGETS,
    LabeledPipeline,
    build_preprocessor,
    get_xy,
    load_dataset,
    split_dataset,
)
from plotting import (
    plot_class_distribution,
    plot_confusion_matrix,
    plot_feature_importance,
    plot_model_comparison,
)

ROOT = Path(__file__).parent
MODELS_DIR = ROOT / "models"
REPORTS_DIR = ROOT / "reports"
FIGURES_DIR = REPORTS_DIR / "figures"
for d in (MODELS_DIR, REPORTS_DIR, FIGURES_DIR):
    d.mkdir(parents=True, exist_ok=True)

RANDOM_STATE = 42


def candidate_models() -> dict:
    """Model family -> list of (config_name, estimator_factory). Each
    factory takes no args and returns a fresh unfitted classifier so every
    candidate can be cloned/refit cleanly.
    """
    return {
        "LogisticRegression": [
            ("default", lambda: LogisticRegression(
                max_iter=3000, C=1.0, class_weight="balanced", random_state=RANDOM_STATE
            )),
        ],
        "RandomForest": [
            ("n300_dNone", lambda: RandomForestClassifier(
                n_estimators=300, max_depth=None, min_samples_leaf=1,
                class_weight="balanced_subsample", random_state=RANDOM_STATE, n_jobs=-1,
            )),
            ("n500_d16", lambda: RandomForestClassifier(
                n_estimators=500, max_depth=16, min_samples_leaf=2,
                class_weight="balanced_subsample", random_state=RANDOM_STATE, n_jobs=-1,
            )),
        ],
        "LightGBM": [
            ("n400_lr05", lambda: LGBMClassifier(
                n_estimators=400, num_leaves=31, learning_rate=0.05,
                class_weight="balanced", random_state=RANDOM_STATE, verbosity=-1,
            )),
            ("n600_lr03", lambda: LGBMClassifier(
                n_estimators=600, num_leaves=63, learning_rate=0.03,
                class_weight="balanced", random_state=RANDOM_STATE, verbosity=-1,
            )),
        ],
        "XGBoost": [
            ("n400_lr05", lambda: XGBClassifier(
                n_estimators=400, max_depth=6, learning_rate=0.05,
                random_state=RANDOM_STATE,
            )),
            ("n600_lr03", lambda: XGBClassifier(
                n_estimators=600, max_depth=8, learning_rate=0.03,
                random_state=RANDOM_STATE,
            )),
        ],
    }


def needs_sample_weight(model_family: str) -> bool:
    return model_family == "XGBoost"


def fit_pipeline(estimator_factory, X_train, y_train_enc, model_family: str) -> Pipeline:
    pipe = Pipeline(steps=[("preprocess", build_preprocessor()), ("classifier", estimator_factory())])
    if needs_sample_weight(model_family):
        weights = compute_sample_weight("balanced", y_train_enc)
        pipe.fit(X_train, y_train_enc, classifier__sample_weight=weights)
    else:
        pipe.fit(X_train, y_train_enc)
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


def train_target(df_train, df_val, df_test, target: str, comparison_results: dict) -> dict:
    print(f"\n{'='*70}\nTarget: {target}\n{'='*70}")

    X_train, y_train_raw = get_xy(df_train, target)
    X_val, y_val_raw = get_xy(df_val, target)
    X_test, y_test_raw = get_xy(df_test, target)

    label_encoder = LabelEncoder().fit(pd.concat([y_train_raw, y_val_raw, y_test_raw], ignore_index=True))
    y_train = label_encoder.transform(y_train_raw)
    y_val = label_encoder.transform(y_val_raw)

    candidates = candidate_models()
    leaderboard = []
    fitted = {}

    for family, configs in candidates.items():
        for config_name, factory in configs:
            model_name = f"{family}/{config_name}"
            t0 = time.time()
            pipe = fit_pipeline(factory, X_train, y_train, family)
            fit_seconds = time.time() - t0

            y_val_pred = pipe.predict(X_val)
            metrics = evaluate(y_val, y_val_pred, label_encoder)
            leaderboard.append(
                {
                    "model": model_name,
                    "family": family,
                    "val_accuracy": metrics["accuracy"],
                    "val_macro_f1": metrics["macro_f1"],
                    "val_balanced_accuracy": metrics["balanced_accuracy"],
                    "fit_seconds": round(fit_seconds, 1),
                }
            )
            fitted[model_name] = (family, factory, pipe, metrics)
            print(
                f"  {model_name:<28} val_macro_f1={metrics['macro_f1']:.4f}  "
                f"val_acc={metrics['accuracy']:.4f}  ({fit_seconds:.1f}s)"
            )

    leaderboard.sort(key=lambda r: (r["val_macro_f1"], r["val_balanced_accuracy"]), reverse=True)
    best_name = leaderboard[0]["model"]
    best_family, best_factory, best_val_pipe, best_val_metrics = fitted[best_name]
    print(f"  -> selected: {best_name} (val_macro_f1={leaderboard[0]['val_macro_f1']:.4f})")

    # Per-family best macro-F1, for the model-comparison chart.
    family_best = {}
    for row in leaderboard:
        fam = row["family"]
        if fam not in family_best or row["val_macro_f1"] > family_best[fam]:
            family_best[fam] = row["val_macro_f1"]
    comparison_results[target] = family_best

    # Refit the winning config on train+validation (all labeled non-test data).
    X_trainval = pd.concat([X_train, X_val], ignore_index=True)
    y_trainval_raw = pd.concat([y_train_raw, y_val_raw], ignore_index=True)
    y_trainval = label_encoder.transform(y_trainval_raw)
    final_pipe = fit_pipeline(best_factory, X_trainval, y_trainval, best_family)

    y_test = label_encoder.transform(y_test_raw)
    y_test_pred = final_pipe.predict(X_test)
    test_metrics = evaluate(y_test, y_test_pred, label_encoder)
    print(
        f"  FINAL (train+val -> test) macro_f1={test_metrics['macro_f1']:.4f}  "
        f"acc={test_metrics['accuracy']:.4f}  bal_acc={test_metrics['balanced_accuracy']:.4f}"
    )

    labeled = LabeledPipeline([(best_name, final_pipe)], label_encoder, target, FEATURE_COLUMNS)
    model_path = MODELS_DIR / f"{target}_model.joblib"
    joblib.dump(labeled, model_path)
    print(f"  saved -> {model_path.relative_to(ROOT)}")

    labels_ordered = ordered_labels(target, label_encoder)
    perm = [test_metrics["labels"].index(label) for label in labels_ordered]
    cm_reordered = np.array(test_metrics["confusion_matrix"])[np.ix_(perm, perm)]
    plot_confusion_matrix(
        cm_reordered,
        labels_ordered,
        f"{target} -- test-set confusion matrix (row %)",
        FIGURES_DIR / f"{target}_confusion_matrix.png",
    )

    importances = labeled.get_feature_importances()
    if importances is not None:
        plot_feature_importance(
            importances, f"{target} -- feature importance ({best_family})",
            FIGURES_DIR / f"{target}_feature_importance.png",
        )

    return {
        "target": target,
        "best_model": best_name,
        "best_family": best_family,
        "leaderboard": leaderboard,
        "validation_metrics_of_selected": best_val_metrics,
        "test_metrics_of_shipped_model": test_metrics,
        "n_train": len(X_train),
        "n_validation": len(X_val),
        "n_test": len(X_test),
        "n_train_plus_validation": len(X_trainval),
    }


def main():
    print("Loading dataset...")
    df = load_dataset()
    splits = split_dataset(df)
    print(f"  train={len(splits['train'])}  validation={len(splits['validation'])}  test={len(splits['test'])}")

    for target in TARGETS:
        y_all = df[target]
        plot_class_distribution(
            y_all, f"{target} -- class distribution (full dataset, n={len(df)})",
            FIGURES_DIR / f"{target}_class_distribution.png",
            order=CLASS_ORDER.get(target),
        )

    comparison_results = {}
    all_results = {}
    for target in TARGETS:
        all_results[target] = train_target(
            splits["train"], splits["validation"], splits["test"], target, comparison_results
        )

    plot_model_comparison(
        comparison_results, "Best validation macro-F1 by model family",
        FIGURES_DIR / "model_comparison.png",
    )

    summary_path = REPORTS_DIR / "metrics.json"
    with open(summary_path, "w") as f:
        json.dump(all_results, f, indent=2, default=float)
    print(f"\nFull metrics written -> {summary_path.relative_to(ROOT)}")

    write_text_report(all_results)


def write_text_report(all_results: dict) -> None:
    lines = ["SIH26111 Feed Quality Models -- Training Report", "=" * 60, ""]
    for target, res in all_results.items():
        tm = res["test_metrics_of_shipped_model"]
        lines.append(f"## {target}")
        lines.append(f"Selected model : {res['best_model']}")
        lines.append(
            f"Data sizes     : train={res['n_train']}  validation={res['n_validation']}  "
            f"test={res['n_test']}  (shipped model fit on train+validation={res['n_train_plus_validation']})"
        )
        lines.append("")
        lines.append("Validation leaderboard (all candidates):")
        for row in res["leaderboard"]:
            lines.append(
                f"  {row['model']:<28} macro_f1={row['val_macro_f1']:.4f}  "
                f"acc={row['val_accuracy']:.4f}  bal_acc={row['val_balanced_accuracy']:.4f}  "
                f"({row['fit_seconds']}s)"
            )
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

    report_path = REPORTS_DIR / "training_report.txt"
    report_path.write_text("\n".join(lines))
    print(f"Text report written -> {report_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
