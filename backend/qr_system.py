"""QR-based feed batch authenticity and traceability system.

Each analyzed feed batch gets a unique QR code embedding:
  - Batch ID, analysis timestamp, quality grade, key results
  - A signed hash for tamper-proofing

Farmers or inspectors can scan the QR to instantly verify the batch
history and analysis results.
"""

from __future__ import annotations

import hashlib
import json
import time
import uuid
from io import BytesIO
from base64 import b64encode
from datetime import datetime, timezone

import qrcode

# In-memory store (production: SQLite / Postgres)
_qr_store: dict[str, dict] = {}

SECRET_KEY = "sih26111-feed-quality-secret"


def generate_batch_id() -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d")
    short_id = uuid.uuid4().hex[:8].upper()
    return f"FQ-{ts}-{short_id}"


def _sign(data: str) -> str:
    return hashlib.sha256(f"{SECRET_KEY}:{data}".encode()).hexdigest()[:16]


def generate_qr(analysis_result: dict, readings: dict) -> dict:
    """Generate a QR code for a completed feed analysis.

    Returns a dict with batch_id, qr_image (base64 PNG), and metadata.
    """
    batch_id = generate_batch_id()
    timestamp = datetime.now(timezone.utc).isoformat()

    payload = {
        "batch_id": batch_id,
        "timestamp": timestamp,
        "feed_type": readings.get("feed_type", "Unknown"),
        "quality_status": analysis_result.get("quality_grade", "Unknown"),
        "adulteration": analysis_result.get("advisories", [{}])[0].get("title", "None"),
        "overall_status": analysis_result.get("overall_status", "unknown"),
    }

    signature = _sign(json.dumps(payload, sort_keys=True))
    payload["signature"] = signature

    # Build QR code
    qr = qrcode.QRCode(version=2, box_size=10, border=4,
                        error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr_data = json.dumps({"batch_id": batch_id, "sig": signature,
                           "ts": timestamp, "grade": payload["quality_status"]})
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#1a1a2e", back_color="#ffffff")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = b64encode(buffer.getvalue()).decode("utf-8")

    record = {
        **payload,
        "readings": readings,
        "full_analysis": analysis_result,
        "verified_count": 0,
    }
    _qr_store[batch_id] = record

    return {
        "batch_id": batch_id,
        "qr_image": f"data:image/png;base64,{qr_base64}",
        "timestamp": timestamp,
        "payload": payload,
    }


def verify_qr(batch_id: str) -> dict:
    """Verify a QR code by batch ID.

    Returns the stored analysis record if valid, or an error.
    """
    record = _qr_store.get(batch_id)
    if not record:
        return {"valid": False, "error": "Batch ID not found in the system."}

    # Verify signature
    payload_check = {
        "batch_id": record["batch_id"],
        "timestamp": record["timestamp"],
        "feed_type": record["feed_type"],
        "quality_status": record["quality_status"],
        "adulteration": record["adulteration"],
        "overall_status": record["overall_status"],
    }
    expected_sig = _sign(json.dumps(payload_check, sort_keys=True))

    if expected_sig != record.get("signature"):
        return {"valid": False, "error": "Signature mismatch — record may be tampered."}

    record["verified_count"] += 1

    return {
        "valid": True,
        "batch_id": batch_id,
        "timestamp": record["timestamp"],
        "feed_type": record["feed_type"],
        "quality_status": record["quality_status"],
        "overall_status": record["overall_status"],
        "verified_count": record["verified_count"],
        "analysis_summary": {
            "quality_grade": record.get("full_analysis", {}).get("quality_grade"),
            "advisories_count": len(record.get("full_analysis", {}).get("advisories", [])),
            "overall_status": record.get("full_analysis", {}).get("overall_status"),
        },
    }


def get_all_batches() -> list[dict]:
    """Return summary of all QR-registered batches."""
    batches = []
    for bid, rec in _qr_store.items():
        batches.append({
            "batch_id": bid,
            "timestamp": rec["timestamp"],
            "feed_type": rec["feed_type"],
            "quality_status": rec["quality_status"],
            "overall_status": rec["overall_status"],
            "verified_count": rec["verified_count"],
        })
    return sorted(batches, key=lambda x: x["timestamp"], reverse=True)
