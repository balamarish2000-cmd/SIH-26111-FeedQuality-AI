"""Computer-vision feed analysis via smartphone camera.

This module simulates what a portable NIR spectroscopy + camera system would
do: extract visual features from a feed image (colour distribution, texture
metrics, brightness) and map them to approximate sensor readings that the
trained ML models can consume.

In a production device this would be replaced by actual spectroscopic hardware,
but for the SIH demo this shows the pipeline end-to-end: image → features →
ML prediction → advisory.
"""

from __future__ import annotations

import math
import random
from io import BytesIO

import cv2
import numpy as np
from PIL import Image


def analyze_feed_image(image_bytes: bytes) -> dict:
    """Analyze a feed image and estimate sensor readings.

    Parameters
    ----------
    image_bytes : bytes
        Raw image file bytes (JPEG/PNG).

    Returns
    -------
    dict with:
      - estimated_readings: dict of approximate sensor values
      - visual_features: dict of extracted image features
      - feed_type_guess: str
      - analysis_notes: list[str]
    """
    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image. Ensure it is a valid JPEG/PNG.")

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # ---- Extract visual features ----
    features = {}

    # Color statistics
    mean_rgb = img_rgb.mean(axis=(0, 1))
    features["mean_r"] = float(mean_rgb[0])
    features["mean_g"] = float(mean_rgb[1])
    features["mean_b"] = float(mean_rgb[2])
    features["brightness"] = float(img_hsv[:, :, 2].mean())
    features["saturation"] = float(img_hsv[:, :, 1].mean())
    features["hue_mean"] = float(img_hsv[:, :, 0].mean())

    # Green/dark patches → potential mould indicator
    green_mask = (img_hsv[:, :, 0] > 30) & (img_hsv[:, :, 0] < 85) & (img_hsv[:, :, 1] > 40)
    features["green_ratio"] = float(green_mask.sum() / green_mask.size)

    dark_mask = img_hsv[:, :, 2] < 60
    features["dark_ratio"] = float(dark_mask.sum() / dark_mask.size)

    # Texture: Laplacian variance (sharpness / granularity)
    laplacian_var = cv2.Laplacian(img_gray, cv2.CV_64F).var()
    features["texture_variance"] = float(laplacian_var)

    # Uniformity: std of gray
    features["gray_std"] = float(img_gray.std())

    # ---- Guess feed type from colour ----
    feed_type_guess = _guess_feed_type(features)

    # ---- Map visual features → approximate sensor readings ----
    readings = _estimate_readings(features, feed_type_guess)

    # ---- Analysis notes ----
    notes = []
    if features["green_ratio"] > 0.15:
        notes.append("Significant green patches detected — possible mould growth")
    if features["dark_ratio"] > 0.3:
        notes.append("Dark regions detected — possible spoilage or contamination")
    if features["brightness"] < 80:
        notes.append("Image is quite dark — results may be less accurate. Try better lighting.")
    if features["texture_variance"] < 50:
        notes.append("Low texture variance — image may be blurry. Try holding camera steady.")
    if not notes:
        notes.append("Image quality is acceptable for analysis")

    return {
        "estimated_readings": readings,
        "visual_features": {k: round(v, 3) for k, v in features.items()},
        "feed_type_guess": feed_type_guess,
        "analysis_notes": notes,
    }


def _guess_feed_type(features: dict) -> str:
    """Heuristic feed-type classification from colour/texture."""
    brightness = features["brightness"]
    green_ratio = features["green_ratio"]
    saturation = features["saturation"]

    if green_ratio > 0.3 and saturation > 60:
        return "Silage"
    if brightness > 160 and saturation < 40:
        return "Mineral Mixture"
    if features["texture_variance"] > 500 and brightness > 100:
        return "Cattle Feed Pellet"
    if brightness < 120 and features["gray_std"] > 40:
        return "Feed Mash"
    return "TMR"


def _estimate_readings(features: dict, feed_type: str) -> dict:
    """Map visual features to approximate sensor readings.

    These are rough estimates — the real system would use NIR spectroscopy.
    The mapping is designed to produce realistic-looking values that
    demonstrate the pipeline end-to-end.
    """
    brightness = features["brightness"]
    green_ratio = features["green_ratio"]
    dark_ratio = features["dark_ratio"]
    texture = features["texture_variance"]
    saturation = features["saturation"]

    # Base values per feed type (typical healthy feed)
    bases = {
        "Cattle Feed Pellet": {"moisture": 9.5, "protein": 16, "fiber": 11, "energy": 3.0},
        "Silage": {"moisture": 63, "protein": 9.5, "fiber": 28, "energy": 2.3},
        "Feed Mash": {"moisture": 14, "protein": 14, "fiber": 12, "energy": 2.6},
        "Mineral Mixture": {"moisture": 8, "protein": 2, "fiber": 2, "energy": 0.5},
        "TMR": {"moisture": 42, "protein": 15, "fiber": 20, "energy": 2.5},
    }
    base = bases.get(feed_type, bases["Cattle Feed Pellet"])

    # Adjust based on visual features
    moisture_adj = (brightness - 128) / 128 * -5  # darker → moister
    protein_adj = (saturation - 80) / 80 * 2
    mould_risk = min(green_ratio * 100, 90)  # green ratio → mould
    spoilage_risk = min(dark_ratio * 50, 40)

    # Small random noise for realism
    def jitter(val, pct=0.05):
        return val * (1 + random.uniform(-pct, pct))

    readings = {
        "feed_type": feed_type,
        "moisture_pct": round(jitter(max(2, base["moisture"] + moisture_adj)), 1),
        "protein_pct": round(jitter(max(1, base["protein"] + protein_adj)), 1),
        "fiber_pct": round(jitter(base["fiber"]), 1),
        "energy_mcal_per_kg": round(jitter(base["energy"]), 2),
        "mineral_deficiency_index": round(jitter(8 + dark_ratio * 15), 1),
        "urea_pct": round(jitter(1.2), 2),
        "sand_silica_pct": round(jitter(0.5 + texture / 2000), 2),
        "aflatoxin_ppb": round(jitter(2.0 + mould_risk * 0.6), 1),
        "fungal_load_index": round(jitter(1.5 + mould_risk * 0.12), 1),
        "mould_index_pct": round(jitter(5 + mould_risk * 0.8), 1),
        "storage_temperature_c": round(jitter(25), 1),
        "ph": round(jitter(4.2 if feed_type == "Silage" else float("nan")), 1)
             if feed_type == "Silage" else None,
        "sampling_depth_cm": round(jitter(20), 1),
        "firmware_version": "1.2.0",
        "measurement_repeat": 1,
    }

    return readings
