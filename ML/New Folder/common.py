"""Shared feature definitions and preprocessing for the SIH26111 feed-quality models.

The dataset simulates readings from a low-cost IoT feed-quality sensor kit.
Every model consumes the SAME raw sensor + metadata panel a field device can
actually measure, and predicts one of three labels:

  - quality_status      : overall grade  (Good / Moderate / Poor / Unsafe)
  - adulteration_type   : detected adulterant (None / Urea Adulteration / ...)
  - spoilage_flag       : binary spoilage indicator (0 / 1)

Design choices (see README.md for the full rationale):
  * device_id is EXCLUDED as a feature. It is a 150-level identifier for the
    physical sensor unit; a model that leans on it would not generalize to
    new devices deployed in the field, and EDA showed no real device-level
    signal (label distribution is ~constant across devices).
  * sample_id / batch_id / collection_timestamp are EXCLUDED (identifiers /
    timestamps only; EDA found no seasonal or time-drift signal at all).
  * firmware_version IS kept (only 3 known values, could reflect sensor
    calibration differences across firmware releases).
  * The three targets are predicted INDEPENDENTLY from raw sensor features
    only (no target-to-target leakage), because in real deployment a device
    knows none of the three labels in advance -- all three are outputs.
  * ph is missing for ~73% of rows (it is essentially Silage-only, a
    fermentation-quality measure). Missingness is informative, so imputation
    uses SimpleImputer(add_indicator=True) rather than dropping the column.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder

DATA_PATH = Path(__file__).parent / "SIH26111_production_ml_dataset.csv"

NUMERIC_FEATURES = [
    "moisture_pct",
    "protein_pct",
    "fiber_pct",
    "energy_mcal_per_kg",
    "mineral_deficiency_index",
    "urea_pct",
    "sand_silica_pct",
    "aflatoxin_ppb",
    "fungal_load_index",
    "mould_index_pct",
    "storage_temperature_c",
    "ph",
    "sampling_depth_cm",
    "measurement_repeat",
]

CATEGORICAL_FEATURES = [
    "feed_type",
    "firmware_version",
]

FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES

TARGETS = ["quality_status", "spoilage_flag", "adulteration_type"]

# Natural class ordering (worst -> best / absent) used for readable report tables.
CLASS_ORDER = {
    "quality_status": ["Unsafe", "Poor", "Moderate", "Good"],
    "spoilage_flag": [0, 1],
    "adulteration_type": [
        "None",
        "Excess Salt",
        "Mineral Imbalance",
        "Sand/Silica Contamination",
        "Urea Adulteration",
        "Mould/Fungal Contamination",
    ],
}


def load_dataset() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH, dtype={"measurement_repeat": "float64"})
    # pandas' read_csv treats the literal string "None" as a missing-value
    # token by default. Here "None" is a legitimate adulteration_type
    # category (no adulterant detected), so undo that misparse.
    df["adulteration_type"] = df["adulteration_type"].fillna("None")
    return df


def split_dataset(df: pd.DataFrame) -> dict[str, pd.DataFrame]:
    splits = {}
    for name in ["train", "validation", "test"]:
        splits[name] = df[df["split"] == name].reset_index(drop=True)
    return splits


def build_preprocessor() -> ColumnTransformer:
    """Fresh preprocessing pipeline: median-impute + missing-indicators for
    numeric sensor readings, one-hot encode the two low-cardinality
    categoricals. Safe for tree ensembles and linear baselines alike.
    """
    numeric_pipeline = Pipeline(
        steps=[
            ("impute", SimpleImputer(strategy="median", add_indicator=True)),
        ]
    )

    try:
        categorical_encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:  # older scikit-learn
        categorical_encoder = OneHotEncoder(handle_unknown="ignore", sparse=False)

    categorical_pipeline = Pipeline(steps=[("onehot", categorical_encoder)])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, NUMERIC_FEATURES),
            ("cat", categorical_pipeline, CATEGORICAL_FEATURES),
        ]
    )
    return preprocessor


def get_xy(df: pd.DataFrame, target: str) -> tuple[pd.DataFrame, pd.Series]:
    X = df[FEATURE_COLUMNS].copy()
    y = df[target].copy()
    return X, y


class DataFrameSelector:
    """Selects/orders columns and returns a DataFrame unchanged -- no
    imputation, no encoding. Used as the "preprocess" step for CatBoost,
    which handles missing numeric values and raw categorical columns
    natively (and usually better than a manual impute+one-hot step).
    """

    def __init__(self, columns: list[str]):
        self.columns = columns

    def fit(self, X, y=None):
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        return X[self.columns]

    def get_feature_names_out(self, input_features=None) -> np.ndarray:
        return np.array(self.columns)


def build_catboost_preprocessor() -> DataFrameSelector:
    return DataFrameSelector(FEATURE_COLUMNS)


class LabeledPipeline:
    """Wraps one or more fitted sklearn Pipelines (preprocessor + classifier)
    together with the shared LabelEncoder, so predict() hands back the
    original human-readable labels (e.g. "Unsafe") instead of raw class
    indices. This is the object that actually gets saved to disk per target.

    With a single member this is just a labeled model. With several members
    (e.g. the best RandomForest + best LightGBM + best XGBoost found by a
    search) it becomes a soft-voting ensemble: predict_proba averages every
    member's probabilities before predict() takes the argmax.
    """

    def __init__(
        self,
        pipelines: list[tuple[str, Pipeline]],
        label_encoder: LabelEncoder,
        target: str,
        feature_columns: list[str],
    ):
        self.pipelines = pipelines  # list of (name, fitted Pipeline)
        self.label_encoder = label_encoder
        self.target = target
        self.feature_columns = feature_columns

    @property
    def member_names(self) -> list[str]:
        return [name for name, _ in self.pipelines]

    def predict_proba(self, X: pd.DataFrame) -> pd.DataFrame:
        X = X[self.feature_columns]
        probs = np.mean([pipe.predict_proba(X) for _, pipe in self.pipelines], axis=0)
        return pd.DataFrame(probs, columns=self.label_encoder.classes_, index=X.index)

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        proba = self.predict_proba(X)
        idx = np.argmax(proba.values, axis=1)
        return self.label_encoder.classes_[idx]

    def get_feature_names_out(self) -> list[str]:
        _, pipe = self.pipelines[0]
        preprocessor = pipe.named_steps["preprocess"]
        try:
            return list(preprocessor.get_feature_names_out())
        except Exception:
            return [f"feature_{i}" for i in range(pipe.named_steps["classifier"].n_features_in_)]

    def get_feature_importances(self) -> "pd.Series | None":
        """Importances from the first (primary) member only -- importances
        from different model families aren't on comparable scales, so they
        aren't averaged across an ensemble.
        """
        _, pipe = self.pipelines[0]
        clf = pipe.named_steps["classifier"]
        names = self.get_feature_names_out()
        if hasattr(clf, "feature_importances_"):
            return pd.Series(clf.feature_importances_, index=names).sort_values(ascending=False)
        if hasattr(clf, "coef_"):
            importance = np.abs(clf.coef_).mean(axis=0)
            return pd.Series(importance, index=names).sort_values(ascending=False)
        return None
