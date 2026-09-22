"""Rule-based + ML-informed advisory engine for feed quality recommendations.

Generates actionable advisories for dairy farmers based on:
  - ML model predictions (quality_status, adulteration_type, spoilage_flag)
  - Raw sensor readings (moisture, protein, pH, aflatoxin, etc.)
  - Feed type and storage conditions

Every advisory includes a severity level, a short headline, detailed
explanation, and concrete remediation steps.
"""

from __future__ import annotations

SEVERITY_CRITICAL = "critical"
SEVERITY_WARNING = "warning"
SEVERITY_INFO = "info"
SEVERITY_GOOD = "good"

# ---------------------------------------------------------------------------
# Ideal ranges per feed type (source: ICAR / NDDB nutrition guidelines)
# ---------------------------------------------------------------------------
IDEAL_RANGES = {
    "Cattle Feed Pellet": {
        "moisture_pct": (8, 12),
        "protein_pct": (14, 22),
        "fiber_pct": (8, 14),
        "energy_mcal_per_kg": (2.5, 3.5),
        "ph": (5.5, 7.0),
        "aflatoxin_ppb": (0, 10),
        "storage_temperature_c": (15, 30),
    },
    "Silage": {
        "moisture_pct": (55, 70),
        "protein_pct": (7, 14),
        "fiber_pct": (22, 35),
        "energy_mcal_per_kg": (1.8, 2.8),
        "ph": (3.8, 4.5),
        "aflatoxin_ppb": (0, 10),
        "storage_temperature_c": (15, 28),
    },
    "Feed Mash": {
        "moisture_pct": (10, 18),
        "protein_pct": (12, 20),
        "fiber_pct": (8, 16),
        "energy_mcal_per_kg": (2.2, 3.2),
        "ph": (5.0, 7.0),
        "aflatoxin_ppb": (0, 10),
        "storage_temperature_c": (15, 30),
    },
    "Mineral Mixture": {
        "moisture_pct": (5, 12),
        "protein_pct": (0, 5),
        "fiber_pct": (0, 5),
        "energy_mcal_per_kg": (0, 1.0),
        "ph": (6.0, 8.0),
        "aflatoxin_ppb": (0, 5),
        "storage_temperature_c": (15, 30),
    },
    "TMR": {
        "moisture_pct": (35, 55),
        "protein_pct": (12, 18),
        "fiber_pct": (15, 28),
        "energy_mcal_per_kg": (2.0, 3.0),
        "ph": (4.5, 6.5),
        "aflatoxin_ppb": (0, 10),
        "storage_temperature_c": (15, 30),
    },
}

DEFAULT_RANGES = IDEAL_RANGES["Cattle Feed Pellet"]


def generate_advisory(readings: dict, predictions: dict) -> dict:
    """Generate a comprehensive advisory report.

    Parameters
    ----------
    readings : dict
        Raw sensor values (keys = FEATURE_COLUMNS from common.py).
    predictions : dict
        Model predictions including quality_status, adulteration_type,
        spoilage_flag, and their confidence scores.

    Returns
    -------
    dict with keys: overall_status, advisories (list), feed_recommendations,
    storage_advisory, nutrition_summary.
    """
    feed_type = readings.get("feed_type", "Cattle Feed Pellet")
    ranges = IDEAL_RANGES.get(feed_type, DEFAULT_RANGES)

    advisories = []

    # ---- Quality status advisory ----
    quality = predictions.get("quality_status", "Unknown")
    quality_conf = predictions.get("quality_status_confidence", 0)
    advisories.append(_quality_advisory(quality, quality_conf))

    # ---- Adulteration advisory ----
    adulterant = predictions.get("adulteration_type", "None")
    adult_conf = predictions.get("adulteration_type_confidence", 0)
    if adulterant != "None":
        advisories.append(_adulteration_advisory(adulterant, adult_conf))

    # ---- Spoilage advisory ----
    spoiled = predictions.get("spoilage_flag", 0)
    spoil_conf = predictions.get("spoilage_flag_confidence", 0)
    if spoiled == 1 or spoiled == "1":
        advisories.append({
            "severity": SEVERITY_CRITICAL,
            "title": "Spoilage Detected",
            "message": "This feed batch shows signs of spoilage. Do NOT feed to animals.",
            "confidence": spoil_conf,
            "actions": [
                "Immediately isolate this batch from other feed stocks",
                "Check storage conditions — temperature, moisture, ventilation",
                "Inspect remaining batches from the same lot",
                "Contact your feed supplier for replacement",
            ],
        })

    # ---- Nutritional advisories (sensor-reading based) ----
    advisories.extend(_nutritional_advisories(readings, ranges, feed_type))

    # ---- Storage advisory ----
    storage_adv = _storage_advisory(readings, ranges)

    # ---- Feed recommendations ----
    feed_recs = _feed_recommendations(readings, predictions, feed_type)

    # ---- Nutrition summary ----
    nutrition_summary = _nutrition_summary(readings, ranges)

    # ---- Overall status ----
    severities = [a["severity"] for a in advisories]
    if SEVERITY_CRITICAL in severities:
        overall = "critical"
    elif SEVERITY_WARNING in severities:
        overall = "warning"
    elif SEVERITY_INFO in severities:
        overall = "moderate"
    else:
        overall = "good"

    # ---- 5-Part Structured Advisory for Farmers ----
    structured = _build_structured_sections(
        readings, predictions, ranges, feed_type,
        advisories, feed_recs, storage_adv, nutrition_summary
    )

    return {
        "overall_status": overall,
        "quality_grade": quality,
        "advisories": advisories,
        "feed_recommendations": feed_recs,
        "storage_advisory": storage_adv,
        "nutrition_summary": nutrition_summary,
        "structured_advisory": structured,
    }


def _build_structured_sections(readings, predictions, ranges, feed_type, advisories, feed_recs, storage_adv, nutrition_summary) -> dict:
    """Build a comprehensive 5-part farmer-friendly AI decision-support report."""
    quality = predictions.get("quality_status", "Moderate")
    quality_conf = float(predictions.get("quality_status_confidence", 0.75))
    adulterant = predictions.get("adulteration_type", "None")
    adult_conf = float(predictions.get("adulteration_type_confidence", 0.75))
    spoilage = int(predictions.get("spoilage_flag", 0))
    spoil_conf = float(predictions.get("spoilage_flag_confidence", 0.75))

    # 1. Quality Interpretation
    conf_level = "high" if quality_conf >= 0.80 else ("medium" if quality_conf >= 0.60 else "low")
    quality_explanations = {
        "Good": "This feed sample complies with standard dairy nutritional criteria. Digestibility, protein balance, and energy density are favorable for cattle metabolism and high milk yield.",
        "Moderate": "This feed is acceptable but borderline in one or more nutritional parameters. Suitable for maintenance, but high-yield cows may require extra ration balancing.",
        "Poor": "Nutritional degradation or sub-standard composition detected. Protein or energy content is lower than standard, risking reduced milk yield and poor body condition score.",
        "Unsafe": "Safety threshold exceeded. Contaminants, toxic adulteration, or spoilage detected that pose direct health hazards to dairy animals. Immediate isolation required."
    }
    quality_interp = {
        "grade": quality,
        "headline": f"Feed Quality Grade: {quality}",
        "explanation": quality_explanations.get(quality, quality_explanations["Moderate"]),
        "confidence_level": conf_level,
        "confidence_score": round(quality_conf * 100, 1),
        "confidence_note": (
            "High confidence prediction based on clear spectral/sensor feature agreement."
            if conf_level == "high" else
            "Moderate confidence prediction; recommend monitoring cattle response and storage logs."
            if conf_level == "medium" else
            "Low confidence prediction: AI result requires additional physical verification before making major feed ration changes."
        ),
        "requires_verification": (conf_level == "low"),
    }

    # 2. Nutritional Guidance
    nutri_points = []
    for key, info in nutrition_summary.items():
        if info.get("status") == "low":
            nutri_points.append(f"Low {info.get('label')}: currently {info.get('value')} {info.get('unit')} (ideal: {info.get('ideal_range')[0]}–{info.get('ideal_range')[1]} {info.get('unit')}).")
        elif info.get("status") == "high":
            nutri_points.append(f"High {info.get('label')}: currently {info.get('value')} {info.get('unit')} (ideal: {info.get('ideal_range')[0]}–{info.get('ideal_range')[1]} {info.get('unit')}).")
    if not nutri_points:
        nutri_points.append("All measured nutritional indicators (Protein, Moisture, Fiber, Energy) fall comfortably within standard NDDB ranges.")

    nutri_guidance = {
        "status": "Balanced" if len(nutri_points) == 1 and "All measured" in nutri_points[0] else "Attention Required",
        "highlights": nutri_points,
        "feeding_ration_tip": (
            "Feed in standard daily proportions alongside 20–25 kg fresh green fodder and clean ad-lib drinking water."
            if quality in ("Good", "Moderate") else
            "Do not feed as sole ration. Compensate with 1–2 kg quality concentrate pellet and bypass protein."
        ),
        "feeding_rates": _feeding_rate(feed_type),
    }

    # 3. Adulteration Warning
    is_adulterated = (adulterant != "None")
    adult_warning = {
        "detected": is_adulterated,
        "adulterant_name": adulterant,
        "confidence_score": round(adult_conf * 100, 1),
        "severity": "critical" if is_adulterated else "good",
        "warning_message": (
            f"Adulterant Alert: {adulterant} was detected in this batch. This can cause severe toxicity, acidosis, or digestive tract injury in dairy animals."
            if is_adulterated else
            "No chemical adulterants (Urea, Sand/Silica, Excess Salt) detected in this sample."
        ),
        "remediation": [
            "Quarantine and withhold the batch from livestock immediately",
            "Retain sample bag for batch verification and supplier complaint",
            "Notify local veterinary officer if animals show distress",
        ] if is_adulterated else ["Safe from synthetic or inorganic adulteration."],
    }

    # 4. Storage & Spoilage Guidance
    is_spoiled = (spoilage == 1)
    storage_guidance = {
        "spoilage_detected": is_spoiled,
        "spoilage_confidence": round(spoil_conf * 100, 1),
        "severity": "critical" if is_spoiled else ("warning" if storage_adv.get("status") in ("warning", "critical") else "good"),
        "guidance_message": (
            "Critical Spoilage Alert: Biological breakdown or fungal proliferation detected. High risk of harmful mycotoxins (Aflatoxin B1)."
            if is_spoiled else
            storage_adv.get("message", "Storage parameters are stable. Continue current moisture and temperature management.")
        ),
        "storage_tips": [
            "Store feed sacks on wooden pallets at least 15 cm off damp concrete floors",
            "Maintain dry, rodent-proof shed ventilation with ambient temperatures below 28°C",
            "Ensure sealed silage or storage units have airtight covers with no punctures or loose edges",
            "Practice First-In, First-Out (FIFO) stock management to prevent aging",
        ],
    }

    # 5. Recommended Action
    if quality == "Unsafe" or is_adulterated or is_spoiled:
        headline = "ACTION REQUIRED: DO NOT FEED — ISOLATE BATCH"
        primary_action = "STOP feeding this batch immediately. Quarantine the sack or storage unit."
        steps = [
            "Immediately stop offering this feed to cattle, calves, or pregnant cows.",
            "Physically isolate affected bags to prevent accidental herd feeding.",
            "Document the Batch ID using the certified QR code for supplier replacement claim.",
            "Consult your local veterinary doctor if cattle have already consumed this feed.",
        ]
    elif quality == "Poor":
        headline = "CAUTION: BLEND OR SUPPLEMENT BEFORE FEEDING"
        primary_action = "Feed quality is below standard. Do not use as sole feed source."
        steps = [
            "Limit this feed to dry stock or non-milking cows; avoid giving to high-yield lactating cows.",
            "Blend with 50% high-grade concentrate or fresh leguminous green fodder.",
            "Add 50g commercial mineral mixture per animal daily to offset nutritional deficiency.",
            "Retest next delivery batch to ensure supplier meets quality specifications.",
        ]
    elif quality == "Moderate":
        headline = "MONITORED FEEDING WITH REGULAR INSPECTION"
        primary_action = "Acceptable feed quality. Suitable for standard feeding with daily health observation."
        steps = [
            "Feed according to standard milk-yield ration chart (approx. 400g concentrate per liter of milk).",
            "Keep bags sealed in a dry, ventilated shed to prevent moisture absorption.",
            "Monitor feed intake and rumination times over the next 48 hours.",
        ]
    else:
        headline = "APPROVED: PREMIUM FEED QUALITY — SAFE FOR HERD"
        primary_action = "Optimal nutritional composition. Continue standard daily feeding schedule."
        steps = [
            "Continue standard feeding ration for lactating cows, pregnant cows, and growing calves.",
            "Maintain clean, dry pallet storage to preserve freshness and vitamin potency.",
            "Generate certified QR traceability certificate for farm records.",
        ]

    rec_action = {
        "headline": headline,
        "primary_action": primary_action,
        "action_steps": steps,
    }

    return {
        "quality_interpretation": quality_interp,
        "nutritional_guidance": nutri_guidance,
        "adulteration_warning": adult_warning,
        "storage_spoilage_guidance": storage_guidance,
        "recommended_action": rec_action,
    }



# ---------------------------------------------------------------------------
# Internal advisory generators
# ---------------------------------------------------------------------------

def _quality_advisory(quality: str, confidence: float) -> dict:
    messages = {
        "Good": {
            "severity": SEVERITY_GOOD,
            "title": "Feed Quality: Good",
            "message": "This feed meets nutritional quality standards. Safe for animal consumption.",
            "actions": ["Continue regular feeding schedule", "Maintain current storage conditions"],
        },
        "Moderate": {
            "severity": SEVERITY_INFO,
            "title": "Feed Quality: Moderate",
            "message": "Feed quality is acceptable but below optimal levels. Consider supplementation.",
            "actions": [
                "Add mineral supplements to compensate for nutritional gaps",
                "Monitor animal health indicators over the next 7 days",
                "Consider blending with higher-quality feed",
            ],
        },
        "Poor": {
            "severity": SEVERITY_WARNING,
            "title": "Feed Quality: Poor",
            "message": "Feed quality is below acceptable standards. Use with caution.",
            "actions": [
                "Reduce proportion of this feed in the ration",
                "Supplement with protein/mineral concentrate",
                "Do not use as sole feed source",
                "Retest after 48 hours if stored feed",
            ],
        },
        "Unsafe": {
            "severity": SEVERITY_CRITICAL,
            "title": "Feed Quality: Unsafe",
            "message": "This feed is unsafe for animal consumption. Do not feed to livestock.",
            "actions": [
                "STOP feeding immediately",
                "Isolate this batch",
                "Notify feed supplier and request quality certificate",
                "Contact veterinary officer if animals have consumed this feed",
                "Document batch number for traceability",
            ],
        },
    }
    adv = messages.get(quality, messages["Moderate"]).copy()
    adv["confidence"] = confidence
    return adv


def _adulteration_advisory(adulterant: str, confidence: float) -> dict:
    details = {
        "Urea Adulteration": {
            "title": "Urea Adulteration Detected",
            "message": "Elevated urea levels detected, indicating possible adulteration to artificially inflate protein readings.",
            "actions": [
                "Do NOT feed to animals — urea toxicity can be fatal",
                "Report to local food safety authority",
                "Test remaining batches from same supplier",
                "Switch to a verified supplier immediately",
            ],
        },
        "Sand/Silica Contamination": {
            "title": "Sand/Silica Contamination Detected",
            "message": "High sand or silica content found. This is a common weight-based adulteration.",
            "actions": [
                "Reject this batch — sand causes digestive issues",
                "Inspect feed visually for gritty particles",
                "File complaint with feed manufacturer",
                "Demand refund or replacement",
            ],
        },
        "Mineral Imbalance": {
            "title": "Mineral Imbalance Detected",
            "message": "Mineral composition deviates significantly from standards, suggesting substitution or degradation.",
            "actions": [
                "Add corrective mineral supplements",
                "Consult a veterinary nutritionist",
                "Monitor animals for deficiency symptoms (lethargy, poor coat)",
            ],
        },
        "Mould/Fungal Contamination": {
            "title": "Mould/Fungal Contamination Detected",
            "message": "Significant mould or fungal growth detected. Mycotoxins may be present.",
            "actions": [
                "Do NOT feed to animals",
                "Check for visible mould — green/black patches, musty smell",
                "Improve storage ventilation and reduce moisture",
                "Discard affected batch safely",
                "Test for aflatoxin levels specifically",
            ],
        },
        "Excess Salt": {
            "title": "Possible Excess Salt",
            "message": "Salt levels may be elevated. Note: current sensor panel has limited salt detection capability.",
            "actions": [
                "Send sample for laboratory salt/sodium analysis",
                "Monitor animals for excessive thirst or water intake",
                "Ensure adequate fresh water availability",
            ],
        },
    }
    adv = details.get(adulterant, {
        "title": f"Adulteration: {adulterant}",
        "message": f"Possible {adulterant} detected in this feed sample.",
        "actions": ["Send sample for laboratory verification"],
    }).copy()
    adv["severity"] = SEVERITY_CRITICAL
    adv["confidence"] = confidence
    return adv


def _nutritional_advisories(readings: dict, ranges: dict, feed_type: str) -> list[dict]:
    advisories = []

    moisture = readings.get("moisture_pct")
    if moisture is not None:
        lo, hi = ranges.get("moisture_pct", (8, 14))
        if moisture > hi + 5:
            advisories.append({
                "severity": SEVERITY_WARNING,
                "title": "High Moisture Content",
                "message": f"Moisture at {moisture:.1f}% is significantly above the ideal range ({lo}–{hi}%). High moisture promotes mould growth and reduces shelf life.",
                "actions": ["Dry the feed before storage", "Improve storage ventilation", "Use within 48 hours"],
                "confidence": 1.0,
            })
        elif moisture < lo - 3:
            advisories.append({
                "severity": SEVERITY_INFO,
                "title": "Low Moisture Content",
                "message": f"Moisture at {moisture:.1f}% is below ideal ({lo}–{hi}%). Feed may be overly dry, reducing palatability.",
                "actions": ["Consider light misting before feeding", "Check for dust — overly dry feed is dusty"],
                "confidence": 1.0,
            })

    protein = readings.get("protein_pct")
    if protein is not None:
        lo, hi = ranges.get("protein_pct", (14, 22))
        if protein < lo:
            advisories.append({
                "severity": SEVERITY_WARNING,
                "title": "Low Protein Content",
                "message": f"Protein at {protein:.1f}% is below the recommended range ({lo}–{hi}%) for {feed_type}. This directly affects milk production.",
                "actions": [
                    "Supplement with soybean meal or cottonseed cake",
                    "Increase legume-based fodder in the ration",
                    "Consult nutritionist for balanced ration formulation",
                ],
                "confidence": 1.0,
            })

    aflatoxin = readings.get("aflatoxin_ppb")
    if aflatoxin is not None and aflatoxin > 10:
        advisories.append({
            "severity": SEVERITY_CRITICAL if aflatoxin > 20 else SEVERITY_WARNING,
            "title": "Elevated Aflatoxin Levels",
            "message": f"Aflatoxin at {aflatoxin:.1f} ppb exceeds safe limits (>10 ppb). Aflatoxins are carcinogenic and transfer to milk.",
            "actions": [
                "Do NOT feed to lactating animals",
                "Discard contaminated batch",
                "Check entire storage facility for mould",
                "Use mycotoxin binders if mild contamination",
            ],
            "confidence": 1.0,
        })

    return advisories


def _storage_advisory(readings: dict, ranges: dict) -> dict:
    issues = []
    recommendations = []

    temp = readings.get("storage_temperature_c")
    if temp is not None:
        lo, hi = ranges.get("storage_temperature_c", (15, 30))
        if temp > hi:
            issues.append(f"Temperature ({temp:.0f}°C) is above recommended maximum ({hi}°C)")
            recommendations.append("Move feed to a cooler, shaded storage area")
            recommendations.append("Ensure adequate ventilation")
        elif temp < lo:
            issues.append(f"Temperature ({temp:.0f}°C) is below recommended minimum ({lo}°C)")

    moisture = readings.get("moisture_pct")
    if moisture is not None and moisture > 15:
        recommendations.append("Ensure storage area has low humidity (<65% RH)")
        recommendations.append("Use moisture-proof containers or bags")

    if not issues:
        return {
            "status": "good",
            "message": "Storage conditions appear acceptable.",
            "recommendations": [
                "Continue monitoring temperature and humidity daily",
                "Keep feed in dry, ventilated storage",
                "Use FIFO (First In, First Out) rotation",
            ],
        }

    return {
        "status": "warning",
        "message": "Storage conditions need attention.",
        "issues": issues,
        "recommendations": recommendations + [
            "Monitor storage conditions twice daily",
            "Consider installing IoT sensors for continuous monitoring",
        ],
    }


def _feed_recommendations(readings: dict, predictions: dict, feed_type: str) -> list[dict]:
    recs = []
    quality = predictions.get("quality_status", "Moderate")

    if quality in ("Good",):
        recs.append({
            "type": "feeding",
            "title": "Recommended Feeding Rate",
            "details": _feeding_rate(feed_type),
        })

    if quality in ("Moderate", "Poor"):
        recs.append({
            "type": "supplementation",
            "title": "Suggested Supplements",
            "details": _supplement_suggestions(readings, feed_type),
        })

    recs.append({
        "type": "general",
        "title": "Best Practices",
        "details": [
            "Test every new feed batch before use",
            "Maintain a feed quality log for each supplier",
            "Rotate feed stock using FIFO method",
            "Store feed away from direct sunlight and moisture",
            "Monitor animal body condition score weekly",
        ],
    })

    return recs


def _feeding_rate(feed_type: str) -> list[str]:
    rates = {
        "Cattle Feed Pellet": [
            "Lactating cows: 1 kg per 2.5 litres of milk produced",
            "Dry cows: 1.5–2 kg/day",
            "Growing heifers: 1–2 kg/day based on body weight",
        ],
        "Silage": [
            "Lactating cows: 15–25 kg/day",
            "Dry cows: 10–15 kg/day",
            "Always provide alongside dry fodder",
        ],
        "Feed Mash": [
            "Lactating cows: 2–4 kg/day mixed with water",
            "Ensure clean water availability when feeding mash",
        ],
        "TMR": [
            "Provide as per calculated Total Mixed Ration",
            "Typical: 18–22 kg DM/day for lactating cows",
        ],
        "Mineral Mixture": [
            "50–100 g/day for adult cattle",
            "Mix thoroughly with concentrate feed",
        ],
    }
    return rates.get(feed_type, rates["Cattle Feed Pellet"])


def _supplement_suggestions(readings: dict, feed_type: str) -> list[str]:
    suggestions = []
    protein = readings.get("protein_pct", 15)
    if protein < 14:
        suggestions.append("Add soybean meal (250–500g/day) to increase protein intake")
    mineral_idx = readings.get("mineral_deficiency_index", 5)
    if mineral_idx > 12:
        suggestions.append("Add commercial mineral mixture (50–100g/day)")
    energy = readings.get("energy_mcal_per_kg", 2.5)
    if energy < 2.2:
        suggestions.append("Add maize grain or rice bran to increase energy density")
    if not suggestions:
        suggestions.append("Feed quality is acceptable; continue current supplementation")
    return suggestions


def _nutrition_summary(readings: dict, ranges: dict) -> dict:
    """Build a parameter-by-parameter nutrition scorecard."""
    params = {}
    checks = [
        ("moisture_pct", "Moisture", "%"),
        ("protein_pct", "Crude Protein", "%"),
        ("fiber_pct", "Fiber", "%"),
        ("energy_mcal_per_kg", "Energy", "Mcal/kg"),
    ]
    for key, label, unit in checks:
        val = readings.get(key)
        if val is None:
            continue
        lo, hi = ranges.get(key, (0, 100))
        if lo <= val <= hi:
            status = "normal"
        elif val < lo:
            status = "low"
        else:
            status = "high"
        params[key] = {
            "label": label,
            "value": round(val, 2),
            "unit": unit,
            "ideal_range": [lo, hi],
            "status": status,
        }
    return params
