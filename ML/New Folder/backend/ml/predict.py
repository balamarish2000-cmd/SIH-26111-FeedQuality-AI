"""Example: load the trained SIH26111 models and score new sensor readings.

This is what a backend / edge device integration would call: feed it one or
more raw sensor readings (a dict or a small DataFrame with the columns below)
and get back the predicted quality grade, adulteration type, and spoilage
flag, each with the model's confidence.

Run: .venv/bin/python predict.py
"""

from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd

from common import FEATURE_COLUMNS, TARGETS

ROOT = Path(__file__).parent
MODELS_DIR = ROOT / "models"


class FeedQualityPredictor:
    """Loads all three per-target models and scores new readings together."""

    def __init__(self, models_dir: Path = MODELS_DIR):
        self.models = {}
        for target in TARGETS:
            path = models_dir / f"{target}_model.joblib"
            if not path.exists():
                raise FileNotFoundError(f"Missing trained model: {path}. Run train.py first.")
            self.models[target] = joblib.load(path)

    def predict(self, readings: pd.DataFrame) -> pd.DataFrame:
        missing = [c for c in FEATURE_COLUMNS if c not in readings.columns]
        if missing:
            raise ValueError(f"Input is missing required columns: {missing}")

        out = pd.DataFrame(index=readings.index)
        for target, model in self.models.items():
            pred = model.predict(readings)
            proba = model.predict_proba(readings)
            confidence = proba.max(axis=1).values
            out[target] = pred
            out[f"{target}_confidence"] = confidence.round(3)
        return out


def example_readings() -> pd.DataFrame:
    """A few hand-picked example readings spanning good/borderline/unsafe feed,
    with realistic values for each feed_type. Columns match FEATURE_COLUMNS
    exactly -- this is the contract a real sensor device / ingestion API
    must satisfy. Unmeasured fields (e.g. ph for non-silage feed) are NaN,
    which the trained pipeline handles via its missing-value imputation.
    """
    rows = [
        # Clean cattle feed pellet -- expect Good.
        dict(
            feed_type="Cattle Feed Pellet", moisture_pct=8.5, protein_pct=16.2, fiber_pct=11.0,
            energy_mcal_per_kg=3.1, mineral_deficiency_index=6.0, urea_pct=1.1, sand_silica_pct=0.3,
            aflatoxin_ppb=1.2, fungal_load_index=1.0, mould_index_pct=4.0, storage_temperature_c=24.0,
            ph=float("nan"), sampling_depth_cm=20.0, firmware_version="1.2.0", measurement_repeat=2,
        ),
        # Well-fermented silage -- expect Good/Moderate, ph present.
        dict(
            feed_type="Silage", moisture_pct=65.0, protein_pct=9.5, fiber_pct=28.0,
            energy_mcal_per_kg=2.3, mineral_deficiency_index=9.0, urea_pct=1.4, sand_silica_pct=0.8,
            aflatoxin_ppb=2.0, fungal_load_index=1.5, mould_index_pct=8.0, storage_temperature_c=22.0,
            ph=4.1, sampling_depth_cm=35.0, firmware_version="1.2.0", measurement_repeat=1,
        ),
        # Heavily mould-contaminated feed mash -- expect Poor/Unsafe, Mould/Fungal.
        dict(
            feed_type="Feed Mash", moisture_pct=45.0, protein_pct=13.0, fiber_pct=15.0,
            energy_mcal_per_kg=1.9, mineral_deficiency_index=18.0, urea_pct=1.8, sand_silica_pct=1.0,
            aflatoxin_ppb=55.0, fungal_load_index=11.0, mould_index_pct=78.0, storage_temperature_c=33.0,
            ph=float("nan"), sampling_depth_cm=25.0, firmware_version="1.0.0", measurement_repeat=3,
        ),
        # Urea-adulterated mineral mixture -- expect Unsafe / Urea Adulteration.
        dict(
            feed_type="Mineral Mixture", moisture_pct=10.0, protein_pct=14.0, fiber_pct=9.0,
            energy_mcal_per_kg=2.6, mineral_deficiency_index=20.0, urea_pct=9.5, sand_silica_pct=0.5,
            aflatoxin_ppb=3.0, fungal_load_index=2.0, mould_index_pct=6.0, storage_temperature_c=27.0,
            ph=float("nan"), sampling_depth_cm=15.0, firmware_version="1.1.0", measurement_repeat=2,
        ),
    ]
    df = pd.DataFrame(rows)
    return df[FEATURE_COLUMNS]


def main():
    predictor = FeedQualityPredictor()
    readings = example_readings()
    results = predictor.predict(readings)

    combined = pd.concat([readings, results], axis=1)
    pd.set_option("display.width", 160)
    pd.set_option("display.max_columns", 30)
    print("\nInput readings + predictions:\n")
    display_cols = [
        "feed_type", "quality_status", "quality_status_confidence",
        "adulteration_type", "adulteration_type_confidence",
        "spoilage_flag", "spoilage_flag_confidence",
    ]
    print(combined[display_cols].to_string())


if __name__ == "__main__":
    main()
