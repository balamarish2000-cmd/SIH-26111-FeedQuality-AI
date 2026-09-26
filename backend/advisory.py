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


def generate_advisory(readings: dict, predictions: dict, lang: str = "en") -> dict:
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
        advisories, feed_recs, storage_adv, nutrition_summary, lang=lang
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



# ---------------------------------------------------------------------------
# Multilingual Translations for Structured Farmer Advisory
# ---------------------------------------------------------------------------
I18N_ADVISORY = {
    "quality_explanations": {
        "en": {
            "Good": "This feed sample complies with standard dairy nutritional criteria. Digestibility, protein balance, and energy density are favorable for cattle metabolism and high milk yield.",
            "Moderate": "This feed is acceptable but borderline in one or more nutritional parameters. Suitable for maintenance, but high-yield cows may require extra ration balancing.",
            "Poor": "Nutritional degradation or sub-standard composition detected. Protein or energy content is lower than standard, risking reduced milk yield and poor body condition score.",
            "Unsafe": "Safety threshold exceeded. Contaminants, toxic adulteration, or spoilage detected that pose direct health hazards to dairy animals. Immediate isolation required."
        },
        "hi": {
            "Good": "यह आहार नमूना मानक डेयरी पोषण मानदंडों के अनुरूप है। पाचनशक्ति, प्रोटीन संतुलन और ऊर्जा घनत्व दुधारू पशुओं के स्वास्थ्य और उच्च दूध उत्पादन के अनुकूल हैं।",
            "Moderate": "यह आहार स्वीकार्य है लेकिन कुछ पोषण मानकों में सीमा रेखा पर है। सामान्य रखरखाव हेतु ठीक है, परंतु अधिक दूध देने वाली गायों को अतिरिक्त पूरक आहार की आवश्यकता होगी।",
            "Poor": "आहार में पोषण की कमी या निम्न गुणवत्ता पाई गई है। प्रोटीन अथवा ऊर्जा का स्तर मानक से कम है, जिससे दूध उत्पादन में गिरावट और पशु के कमजोर होने का जोखिम है।",
            "Unsafe": "सुरक्षा सीमा पार हो चुकी है। संदूषक, जहरीली मिलावट अथवा सड़ांध पाई गई है जो पशुओं के स्वास्थ्य के लिए अत्यंत घातक है। तत्काल पृथक्करण आवश्यक है।"
        },
        "mr": {
            "Good": "हा आहार नमुना प्रमाणित दुग्ध व्यवसाय पोषण निकषांनुसार योग्य आहे. पचनक्षमता, प्रथिने संतुलन आणि ऊर्जा घनता जनावरांचे आरोग्य व उच्च दूध उत्पादनासाठी अनुकूल आहे.",
            "Moderate": "हा आहार स्वीकार्य आहे परंतु काही घटकांमध्ये मध्यम दर्जाचा आहे. नियमित पोषणासाठी योग्य असला तरी जास्त दूध देणाऱ्या जनावरांना पूरक आहाराची गरज भासेल.",
            "Poor": "आहारात पोषणाचा अभाव किंवा कमी दर्जा आढळला आहे. प्रथिने किंवा ऊर्जेचे प्रमाण कमी असल्याने दूध उत्पादन घटण्याचा आणि जनावर अशक्त होण्याचा धोका आहे.",
            "Unsafe": "सुरक्षिततेची मर्यादा ओलांडली आहे. जनावरांच्या आरोग्यासाठी अत्यंत घातक अशी विषारी भेसळ किंवा नासधूस आढळली आहे. त्वरित वेगळे करा."
        },
        "ta": {
            "Good": "இந்த தீவன மாதிரி நிலையான பால் பண்ணை ஊட்டச்சத்து விதிகளுக்கு இணங்குகிறது. செரிமானத்தன்மை, புரத சமநிலை மற்றும் ஆற்றல் அடர்த்தி அதிக பால் உற்பத்திக்கு உகந்தது.",
            "Moderate": "இந்த தீவனம் ஏற்றுக்கொள்ளத்தக்கது, ஆனால் சில ஊட்டச்சத்து அளவுகளில் விளிம்புநிலையில் உள்ளது. அதிக பால் கறக்கும் மாடுகளுக்கு கூடுதல் சத்து சமநிலை தேவைப்படலாம்.",
            "Poor": "ஊட்டச்சத்து குறைபாடு அல்லது தரம் குறைந்த கலவை கண்டறியப்பட்டது. புரதம் அல்லது ஆற்றல் குறைவாக உள்ளதால் பால் உற்பத்தி குறைந்து உடல் மெலியும் அபாயம் உள்ளது.",
            "Unsafe": "பாதுகாப்பு வரம்பு மீறப்பட்டுள்ளது. நச்சு கலப்படம் அல்லது கெட்டுப்போன தீவனம் கண்டறியப்பட்டது. இது கால்நடைகளுக்கு உடனடி ஆபத்தை விளைவிக்கும். உடனே தனிமைப்படுத்தவும்."
        },
        "te": {
            "Good": "ఈ దాణా నమూనా ప్రామాణిక పాడి పోషకాహార ప్రమాణాలకు అనుగుణంగా ఉంది. జీర్ణశక్తి, ప్రొటీన్ సమతుల్యత మరియు శక్తి సాంద్రత అధిక పాల దిగుబడికి అనుకూలంగా ఉన్నాయి.",
            "Moderate": "ఈ దాణా ఆమోదయోగ్యమైనది కానీ కొన్ని పోషక పారామితులలో సరిహద్దులో ఉంది. సాధారణ నిర్వహణకు సరిపోతుంది, కానీ ఎక్కువ పాలిచ్చే ఆవులకు అదనపు పోషకాలు అవసరం.",
            "Poor": "పోషకాహార క్షీణత లేదా నాణ్యత లేని మిశ్రమం గుర్తించబడింది. ప్రొటీన్ లేదా శక్తి తక్కువగా ఉండటం వల్ల పాల దిగుబడి తగ్గి పశువులు బలహీనపడే ప్రమాదం ఉంది.",
            "Unsafe": "భద్రతా పరిమితి దాటింది. విషపూరిత కల్తీ లేదా కుళ్ళిపోవడం గుర్తించబడింది, ఇది పశువుల ఆరోగ్యానికి ప్రత్యక్ష ముప్పు. వెంటనే ఈ దాణాను పక్కన పెట్టండి."
        }
    },
    "confidence_notes": {
        "en": {
            "high": "High confidence prediction based on clear spectral/sensor feature agreement.",
            "medium": "Moderate confidence prediction; recommend monitoring cattle response and storage logs.",
            "low": "Low confidence prediction: AI result requires additional physical verification before making major feed ration changes."
        },
        "hi": {
            "high": "स्पष्ट सेंसर एवं वर्णक्रमीय मापदंडों के आधार पर उच्च विश्वसनीयता वाली भविष्यवाणी।",
            "medium": "मध्यम विश्वसनीयता भविष्यवाणी; पशुओं के व्यवहार और भंडारण स्थितियों की निगरानी करें।",
            "low": "निम्न विश्वसनीयता: आहार में बड़ा बदलाव करने से पहले नमूने की अतिरिक्त भौतिक अथवा प्रयोगशाला जांच अवश्य कराएं।"
        },
        "mr": {
            "high": "अचूक सेन्सॉर व स्पेक्ट्रल घटकांच्या आधारे उच्च विश्वासार्हतेचा अंदाज.",
            "medium": "मध्यम विश्वासार्हता अंदाज; जनावरांचा प्रतिसाद आणि साठवणुकीची नोंद ठेवा.",
            "low": "कमी विश्वासार्हता: आहारात मोठा बदल करण्यापूर्वी नमुन्याची अतिरिक्त प्रयोगशाळा तपासणी करा."
        },
        "ta": {
            "high": "தெளிவான சென்சார் அளவீடுகளின் அடிப்படையில் அதிக நம்பகத்தன்மை கொண்ட கணிப்பு.",
            "medium": "நடுத்தர நம்பிக்கை கணிப்பு; கால்நடைகளின் எதிர்வினை மற்றும் சேமிப்பை கண்காணிக்கவும்.",
            "low": "குறைந்த நம்பிக்கை: உணவில் பெரிய மாற்றங்களைச் செய்வதற்கு முன் ஆய்வக சரிபார்ப்பு தேவை."
        },
        "te": {
            "high": "స్పష్టమైన సెన్సార్ కొలతల ఆధారంగా అధిక విశ్వసనీయత అంచనా.",
            "medium": "మధ్యస్థ విశ్వసనీయత అంచనా; పశువుల ఆరోగ్యం మరియు నిల్వ పరిస్థితులను పర్యవేక్షించండి.",
            "low": "తక్కువ విశ్వసనీయత: ఆహారంలో మార్పులు చేసే ముందు ప్రయోగశాల పరీక్ష ద్వారా నిర్ధారించుకోండి."
        }
    },
    "feeding_tips": {
        "en": {
            "normal": "Feed in standard daily proportions alongside 20–25 kg fresh green fodder and clean ad-lib drinking water.",
            "compensate": "Do not feed as sole ration. Compensate with 1–2 kg quality concentrate pellet and bypass protein."
        },
        "hi": {
            "normal": "20–25 किग्रा ताजे हरे चारे और स्वच्छ पीने के पानी के साथ मानक दैनिक अनुपात में खिलाएं।",
            "compensate": "इसे केवल एकमात्र आहार के रूप में न दें। 1–2 किग्रा उच्च गुणवत्ता वाले सांद्र दाने और बाईपास प्रोटीन के साथ संतुलित करें।"
        },
        "mr": {
            "normal": "२०–२५ किलो ताजा हिरवा चारा आणि स्वच्छ पिण्याच्या पाण्यासोबत योग्य प्रमाणात खाऊ घाला.",
            "compensate": "फक्त हाच एकमेव आहार म्हणून देऊ नका. १–२ किलो दर्जेदार खाद्य गोळी व बायपास प्रथिनांची भर घाला."
        },
        "ta": {
            "normal": "20–25 கிலோ புதிய பசுந்தீவனம் மற்றும் சுத்தமான குடிநீருடன் நிலையான தினசரி அளவில் ஊட்டவும்.",
            "compensate": "இதை மட்டுமே உணவாக கொடுக்காதீர்கள். 1–2 கிலோ தரமான அடர்தீவனத்துடன் சமன் செய்யவும்."
        },
        "te": {
            "normal": "20–25 కేజీల తాజా పచ్చి మేత మరియు స్వచ్ఛమైన తాగునీటితో పాటు ప్రామాణిక పరిమాణంలో తినిపించండి.",
            "compensate": "దీనిని మాత్రమే ఏకైక ఆహారంగా ఇవ్వవద్దు. 1–2 కేజీల నాణ్యమైన దాణాతో భర్తీ చేయండి."
        }
    },
    "actions": {
        "en": {
            "critical": {
                "headline": "ACTION REQUIRED: DO NOT FEED — ISOLATE BATCH",
                "primary": "STOP feeding this batch immediately. Quarantine the sack or storage unit.",
                "steps": [
                    "Immediately stop offering this feed to cattle, calves, or pregnant cows.",
                    "Physically isolate affected bags to prevent accidental herd feeding.",
                    "Document the Batch ID using the certified QR code for supplier replacement claim.",
                    "Consult your local veterinary doctor if cattle have already consumed this feed."
                ]
            },
            "poor": {
                "headline": "CAUTION: BLEND OR SUPPLEMENT BEFORE FEEDING",
                "primary": "Feed quality is below standard. Do not use as sole feed source.",
                "steps": [
                    "Limit this feed to dry stock or non-milking cows; avoid giving to high-yield lactating cows.",
                    "Blend with 50% high-grade concentrate or fresh leguminous green fodder.",
                    "Add 50g commercial mineral mixture per animal daily to offset nutritional deficiency.",
                    "Retest next delivery batch to ensure supplier meets quality specifications."
                ]
            },
            "moderate": {
                "headline": "MONITORED FEEDING WITH REGULAR INSPECTION",
                "primary": "Acceptable feed quality. Suitable for standard feeding with daily health observation.",
                "steps": [
                    "Feed according to standard milk-yield ration chart (approx. 400g concentrate per liter of milk).",
                    "Keep bags sealed in a dry, ventilated shed to prevent moisture absorption.",
                    "Monitor feed intake and rumination times over the next 48 hours."
                ]
            },
            "good": {
                "headline": "APPROVED: PREMIUM FEED QUALITY — SAFE FOR HERD",
                "primary": "Optimal nutritional composition. Continue standard daily feeding schedule.",
                "steps": [
                    "Continue standard feeding ration for lactating cows, pregnant cows, and growing calves.",
                    "Maintain clean, dry pallet storage to preserve freshness and vitamin potency.",
                    "Generate certified QR traceability certificate for farm records."
                ]
            }
        },
        "hi": {
            "critical": {
                "headline": "अनिवार्य कार्रवाई: कदापि न खिलाएं — बैच को तत्काल अलग करें",
                "primary": "इस बैच को तुरंत खिलाना बंद करें। बोरियों अथवा भंडारण इकाई को अलग सुरक्षित करें।",
                "steps": [
                    "दुधारू गायों, बछड़ों या गाभिन पशुओं को यह चारा देना तुरंत बंद करें।",
                    "गलती से पशुओं को खिलाने से बचाने के लिए प्रभावित बोरियों को अलग चिह्नित करें।",
                    "आपूर्तिकर्ता से मुआवजा या वापसी हेतु क्यूआर कोड से बैच आईडी सुरक्षित रखें।",
                    "यदि पशुओं ने पहले ही यह खा लिया है तो तुरंत स्थानीय पशु चिकित्सक से परामर्श लें।"
                ]
            },
            "poor": {
                "headline": "सावधानी: खिलाने से पूर्व मिश्रण बनाएं अथवा पूरक आहार दें",
                "primary": "आहार गुणवत्ता मानक से कम है। इसे एकमात्र आहार के रूप में न दें।",
                "steps": [
                    "यह आहार केवल सूखे पशुओं को दें; अधिक दूध देने वाली गायों को न खिलाएं।",
                    "इसे 50% उच्च-ग्रेड दाने अथवा ताजे दलहनी हरे चारे के साथ मिलाकर दें।",
                    "पोषण की कमी पूरी करने हेतु प्रति पशु प्रतिदिन 50 ग्राम मिनरल मिक्सचर दें।",
                    "आपूर्तिकर्ता से गुणवत्ता मानकों की पुष्टि हेतु अगले लॉट की दोबारा जांच कराएं।"
                ]
            },
            "moderate": {
                "headline": "नियमित निरीक्षण के साथ संतुलित रूप से खिलाएं",
                "primary": "स्वीकार्य आहार गुणवत्ता। दैनिक स्वास्थ्य निगरानी के साथ सामान्य आहार हेतु उपयुक्त।",
                "steps": [
                    "दूध उत्पादन चार्ट के अनुसार खिलाएं (प्रति लीटर दूध पर लगभग 400 ग्राम दाना)।",
                    "नमी से बचाने के लिए बोरियों को सूखे, हवादार गोदाम में बंद रखें।",
                    "अगले 48 घंटों तक पशुओं के जुगाली करने और दाना खाने के समय पर नजर रखें।"
                ]
            },
            "good": {
                "headline": "प्रमाणित: उत्कृष्ट आहार गुणवत्ता — पशुओं हेतु पूर्णतः सुरक्षित",
                "primary": "उत्कृष्ट पोषण संरचना। नियमित दैनिक आहार अनुसूची जारी रखें।",
                "steps": [
                    "दुधारू गायों, गाभिन गायों और बछड़ों के लिए सामान्य आहार जारी रखें।",
                    "ताजगी और विटामिन बनाए रखने के लिए सूखे पैलेट पर साफ भंडारण करें।",
                    "फार्म रिकॉर्ड हेतु प्रमाणित डिजिटल क्यूआर कोड प्रमाणपत्र तैयार करें।"
                ]
            }
        },
        "mr": {
            "critical": {
                "headline": "तातडीची कृती: खाऊ घालू नका — साठा त्वरित वेगळा करा",
                "primary": "हे खाद्य जनावरांना देणे त्वरित थांबवा. साठा पूर्णपणे वेगळा ठेवा.",
                "steps": [
                    "दुभत्या जनावरांना, वासरांना किंवा गाभण जनावरांना हे खाद्य देणे त्वरित थांबवा.",
                    "चुकून इतर जनावरांना दिले जाऊ नये म्हणून पोती वेगळी ठेवा.",
                    "व्यापाऱ्याकडून परतावा मिळवण्यासाठी क्यूआर कोडवरून बॅच आयडी नोंदवून ठेवा.",
                    "जनावरांनी हे खाद्य खाल्ले असल्यास लगेच पशुवैद्यकांचा सल्ला घ्या."
                ]
            },
            "poor": {
                "headline": "सावधान: खाऊ घालण्यापूर्वी इतर चाऱ्यात मिसळा किंवा पूरक घटक द्या",
                "primary": "खाद्याचा दर्जा कमी आहे. फक्त हाच एकमेव आहार म्हणून वापरू नका.",
                "steps": [
                    "हे खाद्य फक्त आटलेल्या जनावरांना द्या; जास्त दूध देणाऱ्या गाईंना टाळा.",
                    "५०% चांगल्या दर्जाचे पशुखाद्य किंवा हिरव्या चाऱ्यामध्ये मिसळून द्या.",
                    "पोषक तत्वांची कमतरता भरून काढण्यासाठी रोज ५० ग्रॅम खनिज मिश्रण द्या.",
                    "पुढील खेप मानकांनुसार आहे याची खात्री करण्यासाठी फेरतपासणी करा."
                ]
            },
            "moderate": {
                "headline": "नियमित तपासणीसह योग्य प्रमाणात खाऊ घाला",
                "primary": "खाद्याचा दर्जा स्वीकार्य आहे. दैनंदिन देखरेखीसह नियमित खाऊ घालण्यास योग्य.",
                "steps": [
                    "दूध उत्पादनानुसार योग्य प्रमाणात खाऊ घाला (प्रति लिटर दुधासाठी ४०० ग्रॅम खाद्य).",
                    "ओलाव्यापासून वाचवण्यासाठी पोती कोरड्या, हवेशीर गोदामात बंद ठेवा.",
                    "पुढील ४८ तासांत जनावरांचे रवंथ करणे व खाण्यावर लक्ष ठेवा."
                ]
            },
            "good": {
                "headline": "प्रमाणित: उत्कृष्ट खाद्य दर्जा — जनावरांसाठी पूर्णपणे सुरक्षित",
                "primary": "उत्कृष्ट पोषण घटक. नियमित दैनंदिन खाद्य वेळापत्रक चालू ठेवा.",
                "steps": [
                    "दुभत्या गाई, गाभण गाई आणि वासरांसाठी नियमित खाद्य चालू ठेवा.",
                    "ताजेपणा टिकवण्यासाठी लाकडी फळ्यांवर कोरडी साठवणूक ठेवा.",
                    "नोंदीसाठी प्रमाणित डिजिटल क्यूआर कोड प्रमाणपत्र तयार करा."
                ]
            }
        },
        "ta": {
            "critical": {
                "headline": "அவசர நடவடிக்கை: தீவனம் கொடுக்காதீர்கள் — தொகுதியை தனிமைப்படுத்தவும்",
                "primary": "இந்த தீவனத்தை உடனடியாக நிறுத்துங்கள். மூட்டைகளை தனிமைப்படுத்துங்கள்.",
                "steps": [
                    "கறவை மாடுகள், கன்றுகள் அல்லது சினை மாடுகளுக்கு இத்தீவனத்தை கொடுப்பதை நிறுத்துங்கள்.",
                    "தவறுதலாக கூட மற்ற மாடுகளுக்கு கொடுக்காமல் சாக்குகளை தனியாக வையுங்கள்.",
                    "சப்ளையரிடம் மாற்றித் தர கோர இந்த QR சான்றிதழ் ஐடியை ஆவணப்படுத்துங்கள்.",
                    "கால்நடைகள் ஏற்கனவே இதை சாப்பிட்டிருந்தால் உடனடியாக மருத்துவரை அணுகவும்."
                ]
            },
            "poor": {
                "headline": "எச்சரிக்கை: உணவளிப்பதற்கு முன் கலக்கவும் அல்லது கூடுதல் சத்து சேர்க்கவும்",
                "primary": "தீவன தரம் குறைவாக உள்ளது. இதை மட்டுமே முழு உணவாக கொடுக்காதீர்கள்.",
                "steps": [
                    "இத்தீவனத்தை கறவை இல்லாத மாடுகளுக்கு மட்டும் கொடுங்கள்.",
                    "50% உயர்தர அடர்தீவனம் அல்லது புதிய பசுந்தீவனத்துடன் கலந்து கொடுங்கள்.",
                    "ஊட்டச்சத்து குறைபாட்டை ஈடுசெய்ய தினமும் 50 கிராம் தாது கலவை சேர்க்கவும்.",
                    "அடுத்த விநியோகத்தை தரம் சரிபார்க்க மீண்டும் பரிசோதிக்கவும்."
                ]
            },
            "moderate": {
                "headline": "கண்காணிப்புடன் கூடிய சீரான உணவளிப்பு",
                "primary": "ஏற்றுக்கொள்ளக்கூடிய தீவன தரம். தினசரி ஆரோக்கிய கண்காணிப்புடன் உணவளிக்கலாம்.",
                "steps": [
                    "பால் உற்பத்திக்கு ஏற்ப தீவனம் அளியுங்கள் (1 லிட்டர் பாலுக்கு சுமார் 400 கிராம்).",
                    "ஈரப்பதத்தை தடுக்க சாக்குகளை உலர்ந்த காற்றோட்டமான கொட்டகையில் வைக்கவும்.",
                    "அடுத்த 48 மணி நேரத்திற்கு மாடுகளின் அசைபோடுதல் மற்றும் தீவன உட்கொள்ளலைக் கண்காணிக்கவும்."
                ]
            },
            "good": {
                "headline": "அங்கீகரிக்கப்பட்டது: சிறந்த தீவன தரம் — பாதுகாப்பானது",
                "primary": "சிறந்த ஊட்டச்சத்து கலவை. வழக்கமான தினசரி உணவளிப்பை தொடரவும்.",
                "steps": [
                    "கறவை மாடுகள் மற்றும் கன்றுகளுக்கான வழக்கமான உணவு அட்டவணையை தொடரவும்.",
                    "புத்துணர்ச்சியைப் பாதுகாக்க உலர்ந்த மரப்பலகைகளில் சேமிக்கவும்.",
                    "பண்ணை பதிவுகளுக்காக சான்றளிக்கப்பட்ட டிஜிட்டல் QR சான்றிதழை உருவாக்கவும்."
                ]
            }
        },
        "te": {
            "critical": {
                "headline": "తక్షణ చర్య: పశువులకు వేయకండి — ఈ బ్యాచ్‌ను పక్కన పెట్టండి",
                "primary": "వెంటనే ఈ దాణా వేయడం ఆపండి. సంచులను పక్కన భద్రపరచండి.",
                "steps": [
                    "పాడి ఆవులు, దూడలు లేదా చూడి పశువులకు ఈ దాణా వేయడం వెంటనే ఆపండి.",
                    "పొరపాటున కూడా ఇతర పశువులకు వేయకుండా సంచులను ప్రత్యేకంగా ఉంచండి.",
                    "సరఫరాదారు నుండి వాపసు పొందడానికి QR కోడ్ ద్వారా బ్యాచ్ ఐడీని దాచుకోండి.",
                    "పశువులు ఇప్పటికే దీనిని తిన్నట్లయితే వెంటనే పశువైద్యుడిని సంప్రదించండి."
                ]
            },
            "poor": {
                "headline": "హెచ్చరిక: మేపే ముందు ఇతర దాణాతో కలపండి లేదా పోషకాలు జోడించండి",
                "primary": "దాణా నాణ్యత తక్కువగా ఉంది. ఏకైక ఆహారంగా దీనిని వేయవద్దు.",
                "steps": [
                    "ఈ దాణాను పాలు ఇవ్వని పశువులకు మాత్రమే పరిమితం చేయండి.",
                    "50% నాణ్యమైన దాణా లేదా పచ్చి మేతతో కలిపి తినిపించండి.",
                    "లోపాన్ని భర్తీ చేయడానికి రోజుకు 50 గ్రాముల మినరల్ మిశ్రమాన్ని అందించండి.",
                    "తదుపరి బ్యాచ్ నాణ్యతను తనిఖీ చేయడానికి మళ్లీ పరీక్ష చేయించండి."
                ]
            },
            "moderate": {
                "headline": "నిరంతర పరిశీలనతో క్రమబద్ధంగా మేపండి",
                "primary": "ఆమోదయోగ్యమైన దాణా నాణ్యత. రోజువారీ పర్యవేక్షణతో సాధారణ ఆహారానికి అనుకూలం.",
                "steps": [
                    "పాల దిగుబడి ప్రకారం దాణా వేయండి (లీటరు పాలకు సుమారు 400 గ్రాములు).",
                    "తేమ చేరకుండా సంచులను పొడిగా, గాలి ఆడే గదిలో ఉంచండి.",
                    "తదుపరి 48 గంటల పాటు పశువుల నెమరువేత మరియు దాణా తినడాన్ని గమనించండి."
                ]
            },
            "good": {
                "headline": "ధృవీకరించబడింది: మేలైన దాణా నాణ్యత — సురక్షితమైనది",
                "primary": "ఆదర్శవంతమైన పోషక విలువలు. ప్రామాణిక ఆహార పట్టికను కొనసాగించండి.",
                "steps": [
                    "పాడి ఆవులు, చూడి పశువులు మరియు దూడలకు సాధారణ దాణా వేయండి.",
                    "తాజాదనం మరియు విటమిన్లు తగ్గకుండా చెక్క పలకలపై నిల్వ చేయండి.",
                    "ఫారం రికార్డుల కోసం ధృవీకరించబడిన QR సర్టిఫికెట్‌ను రూపొందించండి."
                ]
            }
        }
    }
}


def _build_structured_sections(readings, predictions, ranges, feed_type, advisories, feed_recs, storage_adv, nutrition_summary, lang: str = "en") -> dict:
    """Build a comprehensive 5-part farmer-friendly AI decision-support report."""
    lang = lang.lower() if isinstance(lang, str) else "en"
    if lang not in ("en", "hi", "mr", "ta", "te"):
        lang = "en"

    quality = predictions.get("quality_status", "Moderate")
    quality_conf = float(predictions.get("quality_status_confidence", 0.75))
    adulterant = predictions.get("adulteration_type", "None")
    adult_conf = float(predictions.get("adulteration_type_confidence", 0.75))
    spoilage = int(predictions.get("spoilage_flag", 0))
    spoil_conf = float(predictions.get("spoilage_flag_confidence", 0.75))

    # 1. Quality Interpretation
    conf_level = "high" if quality_conf >= 0.80 else ("medium" if quality_conf >= 0.60 else "low")
    q_dict = I18N_ADVISORY["quality_explanations"].get(lang, I18N_ADVISORY["quality_explanations"]["en"])
    c_dict = I18N_ADVISORY["confidence_notes"].get(lang, I18N_ADVISORY["confidence_notes"]["en"])

    quality_interp = {
        "grade": quality,
        "grade_key": quality.lower(),
        "headline": f"Feed Quality Grade: {quality}",
        "explanation": q_dict.get(quality, q_dict.get("Moderate", "")),
        "confidence_level": conf_level,
        "confidence_score": round(quality_conf * 100, 1),
        "confidence_note": c_dict.get(conf_level, ""),
        "requires_verification": (conf_level == "low"),
    }

    # 2. Nutritional Guidance
    nutri_points = []
    nutri_keys = []
    for key, info in nutrition_summary.items():
        if info.get("status") == "low":
            nutri_points.append(f"Low {info.get('label')}: currently {info.get('value')} {info.get('unit')} (ideal: {info.get('ideal_range')[0]}–{info.get('ideal_range')[1]} {info.get('unit')}).")
            nutri_keys.append({"key": "advisory_nutrition.low_nutrient", "params": {"nutrient": info.get('label'), "value": info.get('value'), "unit": info.get('unit'), "min": info.get('ideal_range')[0], "max": info.get('ideal_range')[1]}})
        elif info.get("status") == "high":
            nutri_points.append(f"High {info.get('label')}: currently {info.get('value')} {info.get('unit')} (ideal: {info.get('ideal_range')[0]}–{info.get('ideal_range')[1]} {info.get('unit')}).")
            nutri_keys.append({"key": "advisory_nutrition.high_nutrient", "params": {"nutrient": info.get('label'), "value": info.get('value'), "unit": info.get('unit'), "min": info.get('ideal_range')[0], "max": info.get('ideal_range')[1]}})
    if not nutri_points:
        nutri_points.append("All measured nutritional indicators (Protein, Moisture, Fiber, Energy) fall comfortably within standard NDDB ranges.")
        nutri_keys.append({"key": "advisory_nutrition.all_balanced"})

    f_dict = I18N_ADVISORY["feeding_tips"].get(lang, I18N_ADVISORY["feeding_tips"]["en"])
    tip_key = "normal" if quality in ("Good", "Moderate") else "compensate"

    nutri_guidance = {
        "status": "Balanced" if len(nutri_points) == 1 and "All measured" in nutri_points[0] else "Attention Required",
        "title_key": "analyze.nutri_guidance_title",
        "description_key": f"advisory_feeding.{tip_key}",
        "highlights": nutri_points,
        "bullet_keys": nutri_keys,
        "feeding_ration_tip": f_dict.get(tip_key, ""),
        "feeding_rates": _feeding_rate(feed_type),
    }

    # 3. Adulteration Warning
    is_adulterated = (adulterant != "None")
    remed_dict = {
        "en": [
            "Quarantine and withhold the batch from livestock immediately",
            "Retain sample bag for batch verification and supplier complaint",
            "Notify local veterinary officer if animals show distress"
        ] if is_adulterated else ["Safe from synthetic or inorganic adulteration."],
        "hi": [
            "तुरंत इस बैच को पशुओं को खिलाना बंद करें और अलग रखें",
            "आपूर्तिकर्ता से शिकायत एवं सत्यापन हेतु नमूना बोरी सुरक्षित रखें",
            "यदि पशु अस्वस्थ दिखें तो नजदीकी पशु चिकित्सक को सूचित करें"
        ] if is_adulterated else ["सिंथेटिक अथवा अकार्बनिक मिलावट से पूरी तरह सुरक्षित।"],
        "mr": [
            "जनावरांना हे खाद्य देणे त्वरित थांबवून साठा वेगळा ठेवा",
            "तक्रार व पडताळणीसाठी नमुना पोते सुरक्षित ठेवा",
            "जनावर आजारी वाटल्यास पशुवैद्यकीय अधिकाऱ्यांशी संपर्क साधा"
        ] if is_adulterated else ["रासायनिक किंवा अकार्बनिक भेसळीपासून सुरक्षित."],
        "ta": [
            "கால்நடைகளுக்கு இந்த தீவனத்தை கொடுப்பதை உடனடியாக நிறுத்தி தனிமைப்படுத்தவும்",
            "சப்ளையர் புகார் மற்றும் சரிபார்ப்புக்கு மாதிரி பையை பாதுகாக்கவும்",
            "விலங்குகள் சோர்வடைந்தால் கால்நடை மருத்துவரை அணுகவும்"
        ] if is_adulterated else ["செயற்கை அல்லது கனிம கலப்படங்களிலிருந்து பாதுகாப்பானது."],
        "te": [
            "పశువులకు ఈ దాణా వేయడం తక్షణమే ఆపివేసి పక్కన పెట్టండి",
            "సరఫరాదారు ఫిర్యాదు మరియు ధృవీకరణ కోసం నమూనా సంచిని భద్రపరచండి",
            "పశువులు ఇబ్బంది పడితే వెంటనే పశువైద్యుడికి తెలియజేయండి"
        ] if is_adulterated else ["రసాయన లేదా అకర్బన కల్తీల నుండి పూర్తిగా సురక్షితం."]
    }

    adult_warning = {
        "detected": is_adulterated,
        "adulterant_name": adulterant,
        "confidence_score": round(adult_conf * 100, 1),
        "severity": "critical" if is_adulterated else "good",
        "title_key": "advisory_adulteration.detected_headline" if is_adulterated else "advisory_adulteration.clean_headline",
        "bullet_keys": ["advisory_adulteration.remediation_1", "advisory_adulteration.remediation_2", "advisory_adulteration.remediation_3"] if is_adulterated else ["advisory_adulteration.clean_remedy"],
        "warning_message": (
            f"Adulterant Alert: {adulterant} detected." if is_adulterated else "No chemical adulterants detected in this sample."
        ),
        "remediation": remed_dict.get(lang, remed_dict["en"]),
    }

    # 4. Storage & Spoilage Guidance
    is_spoiled = (spoilage == 1)
    storage_guidance = {
        "spoilage_detected": is_spoiled,
        "spoilage_confidence": round(spoil_conf * 100, 1),
        "severity": "critical" if is_spoiled else ("warning" if storage_adv.get("status") in ("warning", "critical") else "good"),
        "title_key": "analyze.storage_spoilage_title",
        "description_key": "advisory_storage.spoiled" if is_spoiled else "advisory_storage.stable",
        "bullet_keys": [
            "advisory_storage.tip_pallets",
            "advisory_storage.tip_ventilation",
            "advisory_storage.tip_silage",
            "advisory_storage.tip_fifo",
        ],
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
    act_dict = I18N_ADVISORY["actions"].get(lang, I18N_ADVISORY["actions"]["en"])
    if quality == "Unsafe" or is_adulterated or is_spoiled:
        chosen_action = act_dict["critical"]
        status_level = "critical"
    elif quality == "Poor":
        chosen_action = act_dict["poor"]
        status_level = "poor"
    elif quality == "Moderate":
        chosen_action = act_dict["moderate"]
        status_level = "moderate"
    else:
        chosen_action = act_dict["good"]
        status_level = "good"

    rec_action = {
        "status_level": status_level,
        "headline_key": f"advisory_action.{status_level}.headline",
        "primary_key": f"advisory_action.{status_level}.primary",
        "bullet_keys": [f"advisory_action.{status_level}.step_{i}" for i in range(len(chosen_action.get("steps", [])))],
        "headline": chosen_action["headline"],
        "primary_action": chosen_action["primary"],
        "action_steps": chosen_action["steps"],
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
