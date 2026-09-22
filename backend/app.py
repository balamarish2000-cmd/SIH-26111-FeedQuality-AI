"""Flask API server for the SIH26111 Feed Quality Testing System.

Serves the trained ML models via REST endpoints and provides:
  - Feed quality prediction from sensor readings
  - Image-based feed analysis
  - AI-powered nutritional advisories
  - QR-based batch traceability
  - Dashboard analytics
  - Simulated IoT silage monitoring
"""

from __future__ import annotations

import math
import os
import sys
import random
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np

# Add the ML directory to path so we can import the trained predictor
ML_DIR = Path(__file__).parent.parent / "ML" / "New Folder"
sys.path.insert(0, str(ML_DIR))

from predict import FeedQualityPredictor
from common import FEATURE_COLUMNS

from advisory import generate_advisory
from qr_system import generate_qr, verify_qr, get_all_batches
from image_analyzer import analyze_feed_image

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app)

# Load ML models once at startup
print("Loading ML models...")
try:
    predictor = FeedQualityPredictor(models_dir=ML_DIR / "models")
    print("Models loaded successfully.")
except FileNotFoundError as e:
    print(f"WARNING: {e}")
    predictor = None

# In-memory analysis history
analysis_history: list[dict] = []

# Pre-seed some dashboard data
def _seed_history():
    """Generate realistic historical data for the dashboard demo."""
    feed_types = ["Cattle Feed Pellet", "Silage", "Feed Mash", "TMR", "Mineral Mixture"]
    qualities = ["Good", "Good", "Good", "Moderate", "Moderate", "Poor", "Unsafe"]
    regions = ["Maharashtra", "Gujarat", "Punjab", "Rajasthan", "Tamil Nadu",
               "Uttar Pradesh", "Karnataka", "Madhya Pradesh"]

    for i in range(50):
        days_ago = random.randint(0, 90)
        ts = (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()
        ft = random.choice(feed_types)
        q = random.choice(qualities)
        analysis_history.append({
            "id": f"HIST-{i:04d}",
            "timestamp": ts,
            "feed_type": ft,
            "quality_status": q,
            "adulteration_type": random.choice(["None", "None", "None", "None",
                                                  "Urea Adulteration",
                                                  "Sand/Silica Contamination",
                                                  "Mould/Fungal Contamination"]),
            "spoilage_flag": 1 if q == "Unsafe" and random.random() > 0.5 else 0,
            "region": random.choice(regions),
            "farmer_id": f"F-{random.randint(1000, 9999)}",
        })

_seed_history()

def _sanitize_for_json(obj):
    """Recursively replace NaN/Inf floats with None so output is 100% RFC-8259 valid JSON."""
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if isinstance(obj, dict):
        return {k: _sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize_for_json(v) for v in obj]
    return obj


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "models_loaded": predictor is not None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


@app.route("/api/predict", methods=["POST"])
def predict():
    """Run feed quality prediction on sensor readings.

    Expects JSON body with sensor reading fields matching FEATURE_COLUMNS.
    Returns predictions, confidence scores, and full advisory.
    """
    if predictor is None:
        return jsonify({"error": "ML models not loaded"}), 503

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON body provided"}), 400

    # Build DataFrame from input
    try:
        readings = {}
        for col in FEATURE_COLUMNS:
            val = data.get(col)
            if val is None or val == "" or (isinstance(val, float) and math.isnan(val)):
                readings[col] = float("nan") if col in (
                    "moisture_pct", "protein_pct", "fiber_pct",
                    "energy_mcal_per_kg", "mineral_deficiency_index",
                    "urea_pct", "sand_silica_pct", "aflatoxin_ppb",
                    "fungal_load_index", "mould_index_pct",
                    "storage_temperature_c", "ph",
                    "sampling_depth_cm", "measurement_repeat",
                ) else val
            else:
                # Try to cast numeric
                if col not in ("feed_type", "firmware_version"):
                    try:
                        val = float(val)
                    except (ValueError, TypeError):
                        pass
                readings[col] = val

        # Defaults for optional fields
        readings.setdefault("firmware_version", "1.2.0")
        readings.setdefault("measurement_repeat", 1)
        readings.setdefault("sampling_depth_cm", 20.0)

        df = pd.DataFrame([readings])
        results = predictor.predict(df)

        predictions = {}
        for col in results.columns:
            val = results.iloc[0][col]
            if isinstance(val, (np.integer,)):
                val = int(val)
            elif isinstance(val, (np.floating,)):
                val = float(val)
            predictions[col] = val

        # Generate advisory
        advisory = generate_advisory(readings, predictions)

        # Store in history
        record = {
            "id": f"A-{len(analysis_history):04d}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "feed_type": readings.get("feed_type", "Unknown"),
            "quality_status": predictions.get("quality_status", "Unknown"),
            "adulteration_type": predictions.get("adulteration_type", "None"),
            "spoilage_flag": predictions.get("spoilage_flag", 0),
            "readings": _sanitize_for_json(readings),
            "predictions": _sanitize_for_json(predictions),
        }
        analysis_history.append(record)

        return jsonify({
            "success": True,
            "predictions": predictions,
            "advisory": advisory,
            "analysis_id": record["id"],
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/predict/image", methods=["POST"])
def predict_image():
    """Analyze a feed image and run ML prediction.

    Expects multipart form with an 'image' file.
    """
    if predictor is None:
        return jsonify({"error": "ML models not loaded"}), 503

    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image_file = request.files["image"]
    image_bytes = image_file.read()

    try:
        # Step 1: Analyze image → estimated readings
        image_analysis = analyze_feed_image(image_bytes)
        readings = image_analysis["estimated_readings"]

        # Handle None pH → NaN for pandas
        if readings.get("ph") is None:
            readings["ph"] = float("nan")

        # Step 2: Run ML prediction
        df = pd.DataFrame([readings])
        results = predictor.predict(df)

        predictions = {}
        for col in results.columns:
            val = results.iloc[0][col]
            if isinstance(val, (np.integer,)):
                val = int(val)
            elif isinstance(val, (np.floating,)):
                val = float(val)
            predictions[col] = val

        # Step 3: Generate advisory
        advisory = generate_advisory(readings, predictions)

        # Store in history
        record = {
            "id": f"IMG-{len(analysis_history):04d}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "feed_type": readings.get("feed_type", "Unknown"),
            "quality_status": predictions.get("quality_status", "Unknown"),
            "adulteration_type": predictions.get("adulteration_type", "None"),
            "spoilage_flag": predictions.get("spoilage_flag", 0),
            "source": "image",
        }
        analysis_history.append(record)

        return jsonify({
            "success": True,
            "image_analysis": {
                "feed_type_guess": image_analysis["feed_type_guess"],
                "visual_features": image_analysis["visual_features"],
                "analysis_notes": image_analysis["analysis_notes"],
            },
            "estimated_readings": {k: v for k, v in readings.items()
                                    if not (isinstance(v, float) and math.isnan(v))},
            "predictions": predictions,
            "advisory": advisory,
            "analysis_id": record["id"],
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/qr/generate", methods=["POST"])
def qr_generate():
    """Generate a QR code for a completed analysis."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    analysis_result = data.get("analysis_result", {})
    readings = data.get("readings", {})

    result = generate_qr(analysis_result, readings)
    return jsonify({"success": True, **result})


@app.route("/api/qr/verify/<batch_id>", methods=["GET"])
def qr_verify(batch_id: str):
    """Verify a QR code by batch ID."""
    result = verify_qr(batch_id)
    return jsonify(result)


@app.route("/api/qr/batches", methods=["GET"])
def qr_batches():
    """List all QR-registered batches."""
    return jsonify({"batches": get_all_batches()})


@app.route("/api/dashboard/stats", methods=["GET"])
def dashboard_stats():
    """Aggregated analytics for the cloud dashboard."""
    total = len(analysis_history)
    quality_dist = {}
    feed_type_dist = {}
    adulteration_dist = {}
    spoilage_count = 0
    monthly_counts = {}

    for rec in analysis_history:
        q = rec.get("quality_status", "Unknown")
        quality_dist[q] = quality_dist.get(q, 0) + 1

        ft = rec.get("feed_type", "Unknown")
        feed_type_dist[ft] = feed_type_dist.get(ft, 0) + 1

        a = rec.get("adulteration_type", "None")
        if a != "None":
            adulteration_dist[a] = adulteration_dist.get(a, 0) + 1

        if rec.get("spoilage_flag") == 1:
            spoilage_count += 1

        ts = rec.get("timestamp", "")[:7]  # YYYY-MM
        if ts:
            monthly_counts[ts] = monthly_counts.get(ts, 0) + 1

    return jsonify({
        "total_analyses": total,
        "quality_distribution": quality_dist,
        "feed_type_distribution": feed_type_dist,
        "adulteration_distribution": adulteration_dist,
        "spoilage_count": spoilage_count,
        "spoilage_rate": round(spoilage_count / max(total, 1) * 100, 1),
        "monthly_trend": [{"month": k, "count": v}
                          for k, v in sorted(monthly_counts.items())],
        "recent_analyses": [_sanitize_for_json(r) for r in sorted(analysis_history, key=lambda x: x.get("timestamp", ""),
                                   reverse=True)[:10]],
    })


@app.route("/api/silage/monitor", methods=["GET"])
def silage_monitor():
    """Simulated real-time IoT silage monitoring data.

    In production, this would read from actual IoT sensors via MQTT/HTTP.
    For demo, generates realistic fluctuating values.
    """
    import time
    t = time.time()

    # Simulate 3 silage bunkers
    bunkers = []
    for i in range(3):
        base_ph = 4.0 + 0.3 * i
        base_temp = 22 + 2 * i
        base_moisture = 62 + 3 * i

        bunkers.append({
            "bunker_id": f"BNK-{i+1:02d}",
            "name": f"Silage Bunker {i+1}",
            "location": ["North Field", "Main Barn", "Storage Shed"][i],
            "ph": round(base_ph + 0.2 * math.sin(t / 300 + i), 2),
            "temperature_c": round(base_temp + 1.5 * math.sin(t / 600 + i * 2), 1),
            "moisture_pct": round(base_moisture + 2 * math.sin(t / 400 + i * 3), 1),
            "co2_ppm": round(800 + 200 * math.sin(t / 500 + i), 0),
            "fermentation_quality": ["Good", "Good", "Moderate"][i],
            "days_since_sealing": [45, 28, 12][i],
            "spoilage_risk": ["Low", "Low", "Medium"][i],
            "mould_detected": False,
            "last_reading": datetime.now(timezone.utc).isoformat(),
            "history": _generate_silage_history(base_ph, base_temp, base_moisture, i),
        })

    return jsonify({
        "bunkers": bunkers,
        "alerts": _silage_alerts(bunkers),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


def _generate_silage_history(base_ph, base_temp, base_moisture, seed):
    """Generate 24h of simulated silage readings."""
    history = []
    now = datetime.now(timezone.utc)
    for h in range(24):
        t = (now - timedelta(hours=23 - h)).isoformat()
        history.append({
            "timestamp": t,
            "ph": round(base_ph + 0.1 * math.sin(h / 3 + seed), 2),
            "temperature_c": round(base_temp + 2 * math.sin(h / 4 + seed), 1),
            "moisture_pct": round(base_moisture + 1.5 * math.sin(h / 5 + seed), 1),
        })
    return history


def _silage_alerts(bunkers):
    alerts = []
    for b in bunkers:
        if b["ph"] > 4.5:
            alerts.append({
                "bunker": b["name"],
                "type": "warning",
                "message": f"pH at {b['ph']} — above optimal fermentation range (3.8–4.5)",
            })
        if b["temperature_c"] > 28:
            alerts.append({
                "bunker": b["name"],
                "type": "warning",
                "message": f"Temperature at {b['temperature_c']}°C — above recommended (<28°C)",
            })
    if not alerts:
        alerts.append({
            "bunker": "All",
            "type": "info",
            "message": "All silage bunkers within normal parameters",
        })
    return alerts


@app.route("/api/history", methods=["GET"])
def history():
    """Return analysis history."""
    limit = request.args.get("limit", 50, type=int)
    sorted_history = sorted(analysis_history,
                             key=lambda x: x.get("timestamp", ""),
                             reverse=True)
    return jsonify({"history": sorted_history[:limit]})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Feed Quality API on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
