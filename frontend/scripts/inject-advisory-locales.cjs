const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

const TRANSLATIONS = {
  en: {
    brand: {
      product_footer: "Feed Guard — AI-assisted feed and silage quality assessment for dairy farming."
    },
    auth: {
      err_wrong_password: "Incorrect password. Please try again.",
      err_account_not_found: "Account not found. Please check your details or create an account.",
      explore_sample_analysis: "Explore Sample Analysis"
    },
    analyze: {
      method_sensor: "NIR / Sensor Input",
      method_sensor_sub: "Spectroscopy Probe",
      method_camera: "Visual Screening",
      method_camera_sub: "Camera & Computer Vision",
      method_manual: "Manual Entry",
      method_manual_sub: "Measured Laboratory / Farm Values",
      method_sample: "Sample Analysis",
      method_sample_sub: "Use prepared sample data to evaluate the complete workflow.",
      sample_data_badge: "SAMPLE DATA — FOR EVALUATION",
      sensor_not_connected: "Sensor not connected",
      sensor_not_connected_desc: "No NIR spectroscopy probe or portable sensor hardware detected on local communication ports.",
      use_manual_entry: "Use Manual Entry",
      explore_sample_analysis: "Explore Sample Analysis",
      feed_quality_result: "FEED QUALITY RESULT",
      adulteration_assessment: "ADULTERATION ASSESSMENT",
      spoilage_assessment: "SPOILAGE / CONTAMINATION ASSESSMENT",
      farmer_advisory_heading: "Farmer Advisory",
      what_result_means: "What does this result mean?",
      save_to_history: "Save to My History",
      sample_analysis_label: "Sample Analysis",
      scenario_good: "Good Quality Feed",
      scenario_good_desc: "Status: Good / Low Risk",
      scenario_attention: "Feed Requiring Attention",
      scenario_attention_desc: "Status: Moderate Risk",
      scenario_unsafe: "Poor / Unsafe Feed",
      scenario_unsafe_desc: "Status: High Risk"
    },
    advisory_action: {
      good: {
        headline: "Standard Feeding Protocol",
        primary: "Feed directly according to standard daily ration balance.",
        step_0: "Maintain clean, ad-lib drinking water access.",
        step_1: "Combine with 15–20 kg green fodder for optimal rumen digestion.",
        step_2: "Store bags off concrete floors in a dry, ventilated shed.",
        step_3: "Monitor milk yield and butterfat percentage regularly."
      },
      moderate: {
        headline: "Ration Balancing Required",
        primary: "Adjust concentrate proportions and supplement with mineral mixture.",
        step_0: "Do not feed as sole concentrate source.",
        step_1: "Add 50–100g approved mineral mixture per cow daily.",
        step_2: "Re-inspect batch after 7 days of storage."
      },
      critical: {
        headline: "Immediate Feed Quarantine",
        primary: "Do not feed this batch to any dairy cattle or calves.",
        step_0: "Immediately isolate and tag this batch to prevent accidental feeding.",
        step_1: "Retain a sealed sample bag for laboratory verification.",
        step_2: "Notify your feed supplier and local veterinary officer."
      }
    },
    advisory_feeding: {
      normal: "Feed in standard daily proportions alongside 20–25 kg fresh green fodder and clean ad-lib drinking water.",
      compensate: "Do not feed as sole ration. Compensate with 1–2 kg quality concentrate pellet and bypass protein."
    },
    advisory_nutrition: {
      all_balanced: "All measured nutritional indicators (Protein, Moisture, Fiber, Energy) fall comfortably within standard NDDB ranges.",
      low_nutrient: "Low {{nutrient}}: currently {{value}} {{unit}} (ideal: {{min}}–{{max}} {{unit}}).",
      high_nutrient: "High {{nutrient}}: currently {{value}} {{unit}} (ideal: {{min}}–{{max}} {{unit}})."
    },
    advisory_adulteration: {
      detected_headline: "Adulterant Alert: {{adulterant}} detected.",
      remediation_1: "Immediately withhold and isolate this batch from all livestock.",
      remediation_2: "Retain sample bag for batch verification and supplier complaint.",
      remediation_3: "Notify local veterinary officer if animals show distress."
    },
    advisory_storage: {
      stable: "Store feed sacks on elevated wooden pallets in a cool, well-ventilated dry space.",
      spoiled: "Critical spoilage risk: isolate batch and inspect storage moisture and ventilation immediately.",
      tip_pallets: "Store feed sacks on wooden pallets at least 15 cm off damp concrete floors.",
      tip_ventilation: "Maintain dry, rodent-proof shed ventilation with ambient temperatures below 28°C.",
      tip_silage: "Ensure sealed silage or storage units have airtight covers with no punctures or loose edges.",
      tip_fifo: "Practice First-In, First-Out (FIFO) stock rotation to prevent aging."
    },
    dashboard: {
      welcome_farmer: "Welcome, {{name}}",
      no_tests_yet: "No tests yet.",
      start_first_feed_test: "Start Your First Feed Test",
      explore_sample_analysis: "Explore Sample Analysis"
    },
    silage: {
      sample_data_badge: "Sample Data — for evaluation",
      live_sensor_data: "Live Sensor Data",
      stored_data: "Stored Data"
    },
    history: {
      col_data_type: "Data Type",
      real_farmer_test: "Real Farmer Test",
      sample_analysis: "Sample Analysis"
    }
  },
  hi: {
    brand: {
      product_footer: "फीड गार्ड — डेयरी किसानों के लिए एआई-सहायता प्राप्त चारा और साइलेज गुणवत्ता मूल्यांकन प्रणाली।"
    },
    auth: {
      err_wrong_password: "गलत पासवर्ड। कृपया पुनः प्रयास करें।",
      err_account_not_found: "खाता नहीं मिला। कृपया अपना विवरण जांचें अथवा नया खाता बनाएं।",
      explore_sample_analysis: "नमूना विश्लेषण देखें"
    },
    analyze: {
      method_sensor: "एनआईआर / सेंसर इनपुट",
      method_sensor_sub: "स्पेक्ट्रोस्कोपी जांच प्रोब",
      method_camera: "दृश्य छवि स्क्रीनिंग",
      method_camera_sub: "कैमरा एवं कंप्यूटर विज़न",
      method_manual: "मैनुअल प्रविष्टि",
      method_manual_sub: "मापे गए प्रयोगशाला / फार्म मान",
      method_sample: "नमूना विश्लेषण",
      method_sample_sub: "कार्यप्रणाली के मूल्यांकन हेतु तैयार नमूना डेटा का उपयोग करें।",
      sample_data_badge: "नमूना डेटा — मूल्यांकन हेतु",
      sensor_not_connected: "सेंसर कनेक्ट नहीं है",
      sensor_not_connected_desc: "संचार पोर्ट पर कोई एनआईआर स्पेक्ट्रोस्कोपी प्रोब अथवा पोर्टेबल सेंसर हार्डवेयर नहीं मिला।",
      use_manual_entry: "मैनुअल प्रविष्टि का उपयोग करें",
      explore_sample_analysis: "नमूना विश्लेषण देखें",
      feed_quality_result: "पशु आहार गुणवत्ता परिणाम",
      adulteration_assessment: "मिलावट का मूल्यांकन",
      spoilage_assessment: "सड़ांध एवं संदूषण मूल्यांकन",
      farmer_advisory_heading: "किसान सलाहकार",
      what_result_means: "इस परिणाम का क्या अर्थ है?",
      save_to_history: "इतिहास में सुरक्षित करें",
      sample_analysis_label: "नमूना विश्लेषण",
      scenario_good: "उत्कृष्ट गुणवत्ता आहार",
      scenario_good_desc: "स्थिति: उत्तम / कम जोखिम",
      scenario_attention: "ध्यान देने योग्य आहार",
      scenario_attention_desc: "स्थिति: मध्यम जोखिम",
      scenario_unsafe: "खराब / असुरक्षित आहार",
      scenario_unsafe_desc: "स्थिति: उच्च जोखिम"
    },
    advisory_action: {
      good: {
        headline: "मानक पोषण एवं आहार प्रोटोकॉल",
        primary: "दैनिक आहार संतुलन के अनुसार सीधे पशुओं को खिलाएं।",
        step_0: "पशुओं के लिए निरंतर स्वच्छ पीने का पानी उपलब्ध रखें।",
        step_1: "उत्तम पाचन के लिए 15–20 किग्रा हरे चारे के साथ मिलाकर दें।",
        step_2: "सीलन से बचाने के लिए बोरियों को लकड़ी के तख्तों पर रखें।",
        step_3: "दूध उत्पादन और वसा प्रतिशत की नियमित निगरानी करें।"
      },
      moderate: {
        headline: "आहार संतुलन आवश्यक है",
        primary: "सांद्र दाने का अनुपात समायोजित करें और खनिज मिश्रण की खुराक दें।",
        step_0: "इसे एकमात्र सांद्र आहार के रूप में न खिलाएं।",
        step_1: "प्रति गाय प्रतिदिन 50–100 ग्राम अनुमोदित खनिज मिश्रण दें।",
        step_2: "भंडारण के 7 दिनों बाद बैच की पुनः जांच करें।"
      },
      critical: {
        headline: "आहार का तत्काल पृथक्करण",
        primary: "इस बैच को किसी भी दुधारू पशु या बछड़े को बिल्कुल न खिलाएं।",
        step_0: "गलती से उपयोग से बचने हेतु इस लॉट को तुरंत अलग करें और चिन्हित करें।",
        step_1: "प्रयोगशाला परीक्षण के लिए एक सीलबंद नमूना थैली सुरक्षित रखें।",
        step_2: "अपने चारा विक्रेता और स्थानीय पशु चिकित्सा अधिकारी को तुरंत सूचित करें।"
      }
    },
    advisory_feeding: {
      normal: "20–25 किग्रा ताजे हरे चारे और स्वच्छ पीने के पानी के साथ मानक दैनिक अनुपात में खिलाएं।",
      compensate: "इसे केवल एकमात्र आहार के रूप में न दें। 1–2 किग्रा उच्च गुणवत्ता वाले सांद्र दाने और बाईपास प्रोटीन के साथ संतुलित करें।"
    },
    advisory_nutrition: {
      all_balanced: "सभी मापे गए पोषण संकेतक (प्रोटीन, नमी, फाइबर, ऊर्जा) मानक एनडीडीबी सीमाओं के भीतर सुरक्षित हैं।",
      low_nutrient: "कम {{nutrient}}: वर्तमान में {{value}} {{unit}} (आदर्श: {{min}}–{{max}} {{unit}})।",
      high_nutrient: "अधिक {{nutrient}}: वर्तमान में {{value}} {{unit}} (आदर्श: {{min}}–{{max}} {{unit}})।"
    },
    advisory_adulteration: {
      detected_headline: "मिलावट चेतावनी: {{adulterant}} पाया गया है।",
      remediation_1: "इस बैच को तुरंत रोकें और सभी पशुओं से दूर रखें।",
      remediation_2: "आपूर्तिकर्ता शिकायत और सत्यापन के लिए नमूना सुरक्षित रखें।",
      remediation_3: "यदि पशु में कोई अस्वस्थता दिखे तो पशु चिकित्सक को बुलाएं।"
    },
    advisory_storage: {
      stable: "आहार की बोरियों को ठंडी, सूखी और हवादार जगह पर लकड़ी के पैलेट पर रखें।",
      spoiled: "गंभीर सड़ांध जोखिम: बैच को अलग करें और भंडारण नमी व वेंटिलेशन की तुरंत जांच करें।",
      tip_pallets: "सीलन वाले फर्श से कम से कम 15 सेमी ऊपर लकड़ी के पैलेट पर बोरियां रखें।",
      tip_ventilation: "शेड में 28°C से कम तापमान और कीट-रोधी वेंटिलेशन बनाए रखें।",
      tip_silage: "सुनिश्चित करें कि साइलेज यूनिट पूरी तरह से वायुरोधी हो और प्लास्टिक में कोई छेद न हो।",
      tip_fifo: "पुराना दाना पहले उपयोग करने (FIFO) का नियम अपनाएं।"
    },
    dashboard: {
      welcome_farmer: "स्वागत है, {{name}}",
      no_tests_yet: "अभी तक कोई परीक्षण नहीं हुआ।",
      start_first_feed_test: "अपना पहला आहार परीक्षण शुरू करें",
      explore_sample_analysis: "नमूना विश्लेषण देखें"
    },
    silage: {
      sample_data_badge: "नमूना डेटा — मूल्यांकन हेतु",
      live_sensor_data: "लाइव सेंसर डेटा",
      stored_data: "संग्रहीत डेटा"
    },
    history: {
      col_data_type: "डेटा प्रकार",
      real_farmer_test: "वास्तविक किसान परीक्षण",
      sample_analysis: "नमूना विश्लेषण"
    }
  },
  mr: {
    brand: { product_footer: "फीड गार्ड — दुग्ध उत्पादक शेतकऱ्यांसाठी एआय-आधारित चारा व सायलेज गुणवत्ता मूल्यांकन प्रणाली." },
    auth: {
      err_wrong_password: "चुकीचा पासवर्ड. कृपया पुन्हा प्रयत्न करा.",
      err_account_not_found: "खाते आढळले नाही. कृपया तपशील तपासा किंवा नवीन खाते तयार करा.",
      explore_sample_analysis: "नमुना विश्लेषण पहा"
    },
    analyze: {
      method_sensor: "एनआयआर / सेन्सॉर इनपुट",
      method_sensor_sub: "स्पेक्ट्रोस्कोपी प्रोब",
      method_camera: "दृश्य तपासणी",
      method_camera_sub: "कॅमेरा आणि कॉम्प्युटर व्हिजन",
      method_manual: "मॅन्युअल नोंद",
      method_manual_sub: "मोजलेली प्रयोगशाळा / फार्म मूल्ये",
      method_sample: "नमुना विश्लेषण",
      method_sample_sub: "पूर्ण कार्यप्रणाली समजून घेण्यासाठी तयार नमुना डेटा वापरा.",
      sample_data_badge: "नमुना डेटा — मूल्यांकनासाठी",
      sensor_not_connected: "सेन्सॉर कनेक्ट नाही",
      sensor_not_connected_desc: "कम्युनिकेशन पोर्टवर कोणतीही एनआयआर स्पेक्ट्रोस्कोपी प्रोब किंवा पोर्टेबल सेन्सॉर हार्डवेअर आढळले नाही.",
      use_manual_entry: "मॅन्युअल नोंद वापरा",
      explore_sample_analysis: "नमुना विश्लेषण पहा",
      feed_quality_result: "पशुखाद्य गुणवत्ता निकाल",
      adulteration_assessment: "भेसळ मूल्यांकन",
      spoilage_assessment: "नासधूस व संसर्ग मूल्यांकन",
      farmer_advisory_heading: "शेतकरी सल्लागार",
      what_result_means: "या निकालाचा अर्थ काय आहे?",
      save_to_history: "माझ्या नोंदींमध्ये जतन करा",
      sample_analysis_label: "नमुना विश्लेषण",
      scenario_good: "उत्कृष्ट दर्जाचे खाद्य",
      scenario_good_desc: "स्थिती: उत्तम / कमी धोका",
      scenario_attention: "लक्ष देण्याची गरज असलेले खाद्य",
      scenario_attention_desc: "स्थिती: मध्यम धोका",
      scenario_unsafe: "खराब / असुरक्षित खाद्य",
      scenario_unsafe_desc: "स्थिती: उच्च धोका"
    },
    advisory_action: {
      good: {
        headline: "प्रमाणित पोषण व आहार प्रोटोकॉल",
        primary: "दैनिक आहार संतुलनानुसार थेट जनावरांना द्या.",
        step_0: "जनावरांना सतत स्वच्छ पिण्याचे पाणी उपलब्ध ठेवा.",
        step_1: "चांगल्या पचनासाठी १५-२० किलो ताज्या हिरव्या चाऱ्यासोबत द्या.",
        step_2: "ओलाव्यापासून दूर राहण्यासाठी पोती लाकडी फळ्यांवर ठेवा.",
        step_3: "दूध उत्पादन आणि फॅट टक्केवारीवर नियमित लक्ष ठेवा."
      },
      moderate: {
        headline: "आहार संतुलन आवश्यक आहे",
        primary: "खाद्याचे प्रमाण बदला आणि खनिज मिश्रणाची जोड द्या.",
        step_0: "फक्त हेच एकमेव खाद्य म्हणून देऊ नका.",
        step_1: "दररोज प्रति गाय ५०-१०० ग्रॅम प्रमाणित खनिज मिश्रण द्या.",
        step_2: "साठवणुकीच्या ७ दिवसांनंतर पुन्हा तपासणी करा."
      },
      critical: {
        headline: "खाद्य तात्काळ वेगळे करा",
        primary: "हा साठा कोणत्याही दुभत्या जनावरांना किंवा वासरांना खायला घालू नका.",
        step_0: "चुकून वापर होऊ नये म्हणून हा लॉट लगेच वेगळा करा.",
        step_1: "प्रयोगशाळा तपासणीसाठी एक सीलबंद नमुना सुरक्षित ठेवा.",
        step_2: "आपल्या चारा विक्रेत्याला आणि स्थानिक पशुवैद्यकीय अधिकाऱ्याला कळवा."
      }
    },
    advisory_feeding: {
      normal: "२०–२५ किलो ताजा हिरवा चारा आणि स्वच्छ पिण्याच्या पाण्यासोबत योग्य प्रमाणात खाऊ घाला.",
      compensate: "फक्त हाच एकमेव आहार म्हणून देऊ नका. १–२ किलो दर्जेदार खाद्य गोळी व बायपास प्रथिनांची भर घाला."
    },
    advisory_nutrition: {
      all_balanced: "सर्व मोजलेले पोषण घटक (प्रथिने, ओलावा, फायबर, ऊर्जा) एनडीडीबी मानकांनुसार सुरक्षित आहेत.",
      low_nutrient: "कमी {{nutrient}}: सध्या {{value}} {{unit}} (आदर्श: {{min}}–{{max}} {{unit}}).",
      high_nutrient: "जास्त {{nutrient}}: सध्या {{value}} {{unit}} (आदर्श: {{min}}–{{max}} {{unit}})."
    },
    advisory_adulteration: {
      detected_headline: "भेसळ इशारा: {{adulterant}} आढळले आहे.",
      remediation_1: "हा साठा तात्काळ थांबवा आणि जनावरांपासून दूर ठेवा.",
      remediation_2: "तक्रार व तपासणीसाठी नमुना पिशवी सुरक्षित ठेवा.",
      remediation_3: "जनावर आजारी वाटल्यास पशुवैद्यकास बोलवा."
    },
    advisory_storage: {
      stable: "खाद्याची पोती कोरड्या, हवेशीर जागी लाकडी फळ्यांवर ठेवा.",
      spoiled: "गंभीर नासधूस धोका: साठा वेगळा करा आणि ओलावा व वायुविजन तपासा.",
      tip_pallets: "ओल्या जमिनीपासून किमान १५ सेमी वर लाकडी पॅलेट्सवर पोती ठेवा.",
      tip_ventilation: "शेडमध्ये २८°C पेक्षा कमी तापमान आणि हवेशीर वातावरण ठेवा.",
      tip_silage: "सायलेज युनिट पूर्णपणे हवाबंद असल्याची खात्री करा.",
      tip_fifo: "जुने खाद्य आधी वापरण्याचा (FIFO) नियम पाळा."
    },
    dashboard: {
      welcome_farmer: "स्वागत आहे, {{name}}",
      no_tests_yet: "अद्याप कोणतीही चाचणी नाही.",
      start_first_feed_test: "पहिली खाद्य चाचणी सुरू करा",
      explore_sample_analysis: "नमुना विश्लेषण पहा"
    },
    silage: {
      sample_data_badge: "नमुना डेटा — मूल्यांकनासाठी",
      live_sensor_data: "थेट सेन्सॉर डेटा",
      stored_data: "साठवलेला डेटा"
    },
    history: {
      col_data_type: "डेटा प्रकार",
      real_farmer_test: "वास्तविक शेतकरी चाचणी",
      sample_analysis: "नमुना विश्लेषण"
    }
  },
  ta: {
    brand: { product_footer: "ஃபீட் கார்ட் — பால் பண்ணை விவசாயிகளுக்கான AI-உதவி தீவன மற்றும் சைலேஜ் தர மதிப்பீட்டு அமைப்பு." },
    auth: {
      err_wrong_password: "தவறான கடவுச்சொல். மீண்டும் முயற்சிக்கவும்.",
      err_account_not_found: "கணக்கு காணப்படவில்லை. விவரங்களை சரிபார்க்கவும் அல்லது புதிய கணக்கை உருவாக்கவும்.",
      explore_sample_analysis: "மாதிரி பகுப்பாய்வை ஆராய்க"
    },
    analyze: {
      method_sensor: "NIR / சென்சார் உள்ளீடு",
      method_sensor_sub: "ஸ்பெக்ட்ரோஸ்கோபி ஆய்வு",
      method_camera: "காட்சிப் பரிசோதனை",
      method_camera_sub: "கேமரா மற்றும் கம்ப்யூட்டர் விஷன்",
      method_manual: "கைமுறை உள்ளீடு",
      method_manual_sub: "ஆய்வக / பண்ணை அளவீடுகள்",
      method_sample: "மாதிரி பகுப்பாய்வு",
      method_sample_sub: "முழு செயல்முறையையும் மதிப்பீடு செய்ய மாதிரி தரவைப் பயன்படுத்தவும்.",
      sample_data_badge: "மாதிரி தரவு — மதிப்பீட்டிற்கு மட்டும்",
      sensor_not_connected: "சென்சார் இணைக்கப்படவில்லை",
      sensor_not_connected_desc: "தொடர்பு போர்ட்டில் NIR ஸ்பெக்ட்ரோஸ்கோபி ப்ரோப் அல்லது போர்ட்டபிள் சென்சார் எதுவும் கண்டறியப்படவில்லை.",
      use_manual_entry: "கைமுறை உள்ளீட்டைப் பயன்படுத்தவும்",
      explore_sample_analysis: "மாதிரி பகுப்பாய்வை ஆராய்க",
      feed_quality_result: "தீவன தர முடிவு",
      adulteration_assessment: "கலப்பட மதிப்பீடு",
      spoilage_assessment: "கெட்டுப்போதல் மற்றும் நச்சுத்தன்மை மதிப்பீடு",
      farmer_advisory_heading: "விவசாயிகள் ஆலோசனை",
      what_result_means: "இந்த முடிவின் பொருள் என்ன?",
      save_to_history: "எனது வரலாற்றில் சேமிக்கவும்",
      sample_analysis_label: "மாதிரி பகுப்பாய்வு",
      scenario_good: "நல்ல தரமான தீவனம்",
      scenario_good_desc: "நிலை: நன்று / குறைந்த ஆபத்து",
      scenario_attention: "கவனம் தேவைப்படும் தீவனம்",
      scenario_attention_desc: "நிலை: நடுத்தர ஆபத்து",
      scenario_unsafe: "பாதுகாப்பற்ற தீவனம்",
      scenario_unsafe_desc: "நிலை: அதிக ஆபத்து"
    },
    advisory_action: {
      good: {
        headline: "நிலையான ஊட்டச்சத்து முறை",
        primary: "தினசரி சமச்சீர் விகிதப்படி நேரடியாக மாட்டிற்கு ஊட்டலாம்.",
        step_0: "சுத்தமான குடிநீரை தடையின்றி வழங்கவும்.",
        step_1: "நல்ல செரிமானத்திற்கு 15-20 கிலோ பசுந்தீவனத்துடன் கலக்கவும்.",
        step_2: "ஈரமில்லாத மரப்பலகைகளில் தீவன மூட்டைகளை அடுக்கவும்.",
        step_3: "பால் உற்பத்தி மற்றும் கொழுப்பு அளவை தவறாமல் கண்காணிக்கவும்."
      },
      moderate: {
        headline: "தீவன சமநிலைப்படுத்துதல் தேவை",
        primary: "அடர்தீவன அளவை மாற்றி, தாது கலவையைச் சேர்க்கவும்.",
        step_0: "இதை மட்டுமே முதன்மை தீவனமாக கொடுக்க வேண்டாம்.",
        step_1: "மாடு ஒன்றுக்கு தினமும் 50-100 கிராம் தாது உப்புக் கலவை தரவும்.",
        step_2: "7 நாட்கள் சேமிப்பிற்குப் பிறகு மீண்டும் சோதிக்கவும்."
      },
      critical: {
        headline: "தீவனத்தை உடனடியாக தனிமைப்படுத்தவும்",
        primary: "இந்த தீவனத்தை எந்த கறவை மாடுகளுக்கும் அல்லது கன்றுகளுக்கும் கொடுக்க வேண்டாம்.",
        step_0: "தவறுதலாக உணவளிப்பதைத் தவிர்க்க உடனே இந்த தீவனத்தை தள்ளி வைக்கவும்.",
        step_1: "ஆய்வக சோதனைக்காக சீல் வைக்கப்பட்ட மாதிரி பையை பாதுகாக்கவும்.",
        step_2: "உங்கள் தீவன விற்பனையாளருக்கும் கால்நடை மருத்துவருக்கும் தகவல் தெரிவிக்கவும்."
      }
    },
    advisory_feeding: {
      normal: "20–25 கிலோ புதிய பசுந்தீவனம் மற்றும் சுத்தமான குடிநீருடன் நிலையான தினசரி அளவில் ஊட்டவும்.",
      compensate: "இதனை மட்டுமே உணவாக வழங்க வேண்டாம். 1–2 கிலோ தரமான அடர்தீவனம் மற்றும் பைபாஸ் புரதத்துடன் சமநிலைப்படுத்தவும்."
    },
    advisory_nutrition: {
      all_balanced: "அனைத்து ஊட்டச்சத்துக்களும் (புரதம், ஈரப்பதம், நார்ச்சத்து, ஆற்றல்) NDDB வரம்பிற்குள் உள்ளன.",
      low_nutrient: "குறைந்த {{nutrient}}: தற்போது {{value}} {{unit}} (உகந்தது: {{min}}–{{max}} {{unit}}).",
      high_nutrient: "அதிக {{nutrient}}: தற்போது {{value}} {{unit}} (உகந்தது: {{min}}–{{max}} {{unit}})."
    },
    advisory_adulteration: {
      detected_headline: "கலப்பட எச்சரிக்கை: {{adulterant}} கண்டறியப்பட்டது.",
      remediation_1: "உடனடியாக இந்தத் தொகுதியை விலங்குகளுக்குக் கொடுக்காமல் தனிமைப்படுத்தவும்.",
      remediation_2: "புகார் மற்றும் ஆய்வக சரிபார்ப்பிற்கு மாதிரி பையை வைத்திருக்கவும்.",
      remediation_3: "கால்நடைகளுக்கு உடல்நலக்குறைவு ஏற்பட்டால் மருத்துவரை அழைக்கவும்."
    },
    advisory_storage: {
      stable: "தீவன மூட்டைகளை மரப்பலகைகளில் உலர்ந்த காற்றோட்டமான இடத்தில் சேமிக்கவும்.",
      spoiled: "கடுமையான கெட்டுப்போதல் ஆபத்து: தொகுதியைத் தனிமைப்படுத்தி ஈரப்பதத்தை சரிபார்க்கவும்.",
      tip_pallets: "ஈரமான தரையிலிருந்து குறைந்தது 15 செ.மீ உயரத்தில் மரப்பலகையில் வைக்கவும்.",
      tip_ventilation: "கொட்டகையில் 28°C-க்கு கீழ் வெப்பநிலை மற்றும் காற்றோட்டத்தை பராமரிக்கவும்.",
      tip_silage: "சைலேஜ் குழியில் காற்று புகாதவாறு பிளாஸ்டிக் மூடியை உறுதிப்படுத்தவும்.",
      tip_fifo: "பழைய தீவனத்தை முதலில் பயன்படுத்தும் (FIFO) முறையைப் பின்பற்றவும்."
    },
    dashboard: {
      welcome_farmer: "வணக்கம், {{name}}",
      no_tests_yet: "இதுவரை சோதனைகள் இல்லை.",
      start_first_feed_test: "உங்கள் முதல் தீவன சோதனையைத் தொடங்கவும்",
      explore_sample_analysis: "மாதிரி பகுப்பாய்வை ஆராய்க"
    },
    silage: {
      sample_data_badge: "மாதிரி தரவு — மதிப்பீட்டிற்கு மட்டும்",
      live_sensor_data: "நேரடி சென்சார் தரவு",
      stored_data: "சேமிக்கப்பட்ட தரவு"
    },
    history: {
      col_data_type: "தரவு வகை",
      real_farmer_test: "உண்மையான விவசாயி சோதனை",
      sample_analysis: "மாதிரி பகுப்பாய்வு"
    }
  },
  te: {
    brand: { product_footer: "ఫీడ్ గార్డ్ — పాడి రైతుల కోసం AI-ఆధారిత దాణా మరియు సైలేజ్ నాణ్యత నిర్ధారణ వ్యవస్థ." },
    auth: {
      err_wrong_password: "తప్పు పాస్‌వర్డ్. దయచేసి మళ్ళీ ప్రయత్నించండి.",
      err_account_not_found: "ఖాతా కనుగొనబడలేదు. దయచేసి వివరాలను తనిఖీ చేయండి లేదా కొత్త ఖాతాను సృష్టించండి.",
      explore_sample_analysis: "నమూనా విశ్లేషణను చూడండి"
    },
    analyze: {
      method_sensor: "NIR / సెన్సార్ ఇన్‌పుట్",
      method_sensor_sub: "స్పెక్ట్రోస్కోపీ ప్రోబ్",
      method_camera: "విజువల్ స్క్రీనింగ్",
      method_camera_sub: "కెమెరా & కంప్యూటర్ విజన్",
      method_manual: "మాన్యువల్ ఎంట్రీ",
      method_manual_sub: "ప్రయోగశాల / పొలం కొలతలు",
      method_sample: "నమూనా విశ్లేషణ",
      method_sample_sub: "మొత్తం పనితీరును అంచనా వేయడానికి సిద్ధం చేసిన నమూనా డేటాను ఉపయోగించండి.",
      sample_data_badge: "నమూనా డేటా — మూల్యాంకనం కోసం",
      sensor_not_connected: "సెన్సార్ కనెక్ట్ కాలేదు",
      sensor_not_connected_desc: "కమ్యూనికేషన్ పోర్ట్‌లలో ఎలాంటి NIR స్పెక్ట్రోస్కోపీ ప్రోబ్ లేదా సెన్సార్ హార్డ్‌వేర్ గుర్తించబడలేదు.",
      use_manual_entry: "మాన్యువల్ ఎంట్రీని ఉపయోగించండి",
      explore_sample_analysis: "నమూనా విశ్లేషణను చూడండి",
      feed_quality_result: "దాణా నాణ్యత ఫలితం",
      adulteration_assessment: "కల్తీ అంచనా",
      spoilage_assessment: "కుళ్ళిపోవడం మరియు కాలుష్య అంచనా",
      farmer_advisory_heading: "రైతు సలహాదారు",
      what_result_means: "ఈ ఫలితం యొక్క అర్థం ఏమిటి?",
      save_to_history: "నా చరిత్రలో భద్రపరచండి",
      sample_analysis_label: "నమూనా విశ్లేషణ",
      scenario_good: "మంచి నాణ్యమైన దాణా",
      scenario_good_desc: "స్థితి: మంచిది / తక్కువ ప్రమాదం",
      scenario_attention: "శ్రద్ధ అవసరమైన దాణా",
      scenario_attention_desc: "స్థితి: మధ్యస్థ ప్రమాదం",
      scenario_unsafe: "హానికరమైన దాణా",
      scenario_unsafe_desc: "స్థితి: అధిక ప్రమాదం"
    },
    advisory_action: {
      good: {
        headline: "ప్రామాణిక పోషకాహార ప్రోటోకాల్",
        primary: "రోజువారీ మోతాదు ప్రకారం నేరుగా పశువులకు తినిపించవచ్చు.",
        step_0: "పశువులకు నిరంతరం పరిశుభ్రమైన తాగునీరు అందుబాటులో ఉంచండి.",
        step_1: "జీర్ణక్రియ కోసం 15-20 కిలోల పచ్చిగడ్డితో కలిపి ఇవ్వండి.",
        step_2: "తేమ తగలకుండా దాణా బస్తాలను చెక్క బల్లలపై నిల్వ చేయండి.",
        step_3: "పాల దిగుబడి మరియు వెన్న శాతాన్ని క్రమం తప్పకుండా పర్యవేక్షించండి."
      },
      moderate: {
        headline: "దాణా సమతుల్యత అవసరం",
        primary: "దాణా నిష్పత్తిని సరిచేసి, ఖనిజ మిశ్రమాన్ని జోడించండి.",
        step_0: "దీనిని మాత్రమే ఏకైక ఆహారంగా అందించవద్దు.",
        step_1: "ప్రతి ఆవుకు రోజుకు 50-100 గ్రాముల ఖనిజ మిశ్రమం ఇవ్వండి.",
        step_2: "7 రోజుల నిల్వ తర్వాత బ్యాచ్‌ను మళ్ళీ పరీక్షించండి."
      },
      critical: {
        headline: "దాణాను వెంటనే వేరుచేయండి",
        primary: "ఈ దాణాను పాడి పశువులకు లేదా దూడలకు ఎట్టిపరిస్థితుల్లోనూ తినిపించవద్దు.",
        step_0: "పొరపాటున తినిపించకుండా వెంటనే ఈ లాట్‌ను పక్కన పెట్టండి.",
        step_1: "ప్రయోగశాల పరీక్ష కోసం సీలు చేసిన నమూనా సంచిని భద్రపరచండి.",
        step_2: "మీ దాణా సరఫరాదారు మరియు స్థానిక పశువైద్యుడికి సమాచారం ఇవ్వండి."
      }
    },
    advisory_feeding: {
      normal: "20–25 కిలోల తాజా పచ్చిగడ్డి మరియు స్వచ్ఛమైన తాగునీటితో పాటు సరైన మోతాదులో అందించండి.",
      compensate: "దీనిని మాత్రమే ఆహారంగా ఇవ్వవద్దు. 1–2 కిలోల నాణ్యమైన దాణా మరియు బైపాస్ ప్రొటీన్‌తో సమతుల్యం చేయండి."
    },
    advisory_nutrition: {
      all_balanced: "అన్ని పోషకాలు (ప్రొటీన్, తేమ, పీచు, శక్తి) NDDB ప్రమాణాల పరిధిలో సురక్షితంగా ఉన్నాయి.",
      low_nutrient: "తక్కువ {{nutrient}}: ప్రస్తుతం {{value}} {{unit}} (ఆదర్శం: {{min}}–{{max}} {{unit}}).",
      high_nutrient: "ఎక్కువ {{nutrient}}: ప్రస్తుతం {{value}} {{unit}} (ఆదర్శం: {{min}}–{{max}} {{unit}})."
    },
    advisory_adulteration: {
      detected_headline: "కల్తీ హెచ్చరిక: {{adulterant}} కనుగొనబడింది.",
      remediation_1: "ఈ బ్యాచ్‌ను పశువులకు తినిపించకుండా వెంటనే వేరు చేయండి.",
      remediation_2: "ఫిర్యాదు మరియు ధృవీకరణ కోసం నమూనా సంచిని దాచండి.",
      remediation_3: "పశువులకు ఏదైనా ఇబ్బంది కలిగితే పశువైద్యుడిని సంప్రదించండి."
    },
    advisory_storage: {
      stable: "దాణా బస్తాలను పొడి, గాలి వెలుతురు ఉండే చోట చెక్క పలకలపై నిల్వ చేయండి.",
      spoiled: "తీవ్రమైన కుళ్ళిపోయే ప్రమాదం: బ్యాచ్‌ను వేరుచేసి నిల్వ తేమను తనిఖీ చేయండి.",
      tip_pallets: "నేల తేమ తగలకుండా కనీసం 15 సెం.మీ ఎత్తున చెక్క పలకలపై బస్తాలను ఉంచండి.",
      tip_ventilation: "షెడ్‌లో 28°C కంటే తక్కువ ఉష్ణోగ్రత మరియు గాలి ప్రసరణ ఉండేలా చూడండి.",
      tip_silage: "సైలేజ్ యూనిట్‌లో గాలి చొరబడకుండా మూతను గట్టిగా బిగించండి.",
      tip_fifo: "పాత దాణాను ముందుగా వాడే (FIFO) పద్ధతిని పాటించండి."
    },
    dashboard: {
      welcome_farmer: "స్వాగతం, {{name}}",
      no_tests_yet: "ఇంకా ఎలాంటి పరీక్షలు లేవు.",
      start_first_feed_test: "మీ మొదటి దాణా పరీక్షను ప్రారంభించండి",
      explore_sample_analysis: "నమూనా విశ్లేషణను చూడండి"
    },
    silage: {
      sample_data_badge: "నమూనా డేటా — మూల్యాంకనం కోసం",
      live_sensor_data: "లైవ్ సెన్సార్ డేటా",
      stored_data: "నిల్వ చేసిన డేటా"
    },
    history: {
      col_data_type: "డేటా రకం",
      real_farmer_test: "నిజమైన రైతు పరీక్ష",
      sample_analysis: "నమూనా విశ్లేషణ"
    }
  }
};

// Generic fallback generator for remaining Indian languages (kn, ml, bn, gu, pa, or, as, ur)
const OTHER_LANGS = {
  kn: {
    product_footer: "ಫೀಡ್ ಗಾರ್ಡ್ — ಡೈರಿ ರೈತರಿಗಾಗಿ AI-ಚಾಲಿತ ಮೇವು ಮತ್ತು ಸೈಲೇಜ್ ಗುಣಮಟ್ಟ ಪರೀಕ್ಷಾ ವ್ಯವಸ್ಥೆ.",
    err_wrong_password: "ತಪ್ಪು ಪಾಸ್‌ವರ್ಡ್. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    err_account_not_found: "ಖಾತೆ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಹೊಸ ಖಾತೆಯನ್ನು ರಚಿಸಿ.",
    explore_sample_analysis: "ಮಾದರಿ ವಿಶ್ಲೇಷಣೆ ವೀಕ್ಷಿಸಿ",
    sample_data_badge: "ಮಾದರಿ ಡೇಟಾ — ಮೌಲ್ಯಮಾಪನಕ್ಕಾಗಿ",
    sensor_not_connected: "ಸಂವೇದಕ (ಸೆನ್ಸರ್) ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ",
    sensor_not_connected_desc: "ಸಂಪರ್ಕ ಪೋರ್ಟ್‌ಗಳಲ್ಲಿ ಯಾವುದೇ NIR ಸ್ಪೆಕ್ಟ್ರೋಸ್ಕೋಪಿ ಪ್ರೋಬ್ ಅಥವಾ ಹಾರ್ಡ್‌ವೇರ್ ಕಂಡುಬಂದಿಲ್ಲ.",
    use_manual_entry: "ಹಸ್ತಚಾಲಿತ ಪ್ರವೇಶ ಬಳಸಿ",
    feed_quality_result: "ಮೇವು ಗುಣಮಟ್ಟದ ಫಲಿತಾಂಶ",
    adulteration_assessment: "ಕಲಬೆರಕೆ ಮೌಲ್ಯಮಾಪನ",
    spoilage_assessment: "ಹಾಳಾಗುವಿಕೆ ಮತ್ತು ಕಲ್ಮಶ ಮೌಲ್ಯಮಾಪನ",
    farmer_advisory_heading: "ರೈತ ಸಲಹೆಗಾರ",
    what_result_means: "ಈ ಫಲಿತಾಂಶದ ಅರ್ಥವೇನು?",
    save_to_history: "ನನ್ನ ಇತಿಹಾಸದಲ್ಲಿ ಉಳಿಸಿ",
    sample_analysis_label: "ಮಾದರಿ ವಿಶ್ಲೇಷಣೆ",
    all_balanced: "ಎಲ್ಲಾ ಪೌಷ್ಠಿಕಾಂಶ ಸೂಚಕಗಳು (ಪ್ರೋಟೀನ್, ತೇವಾಂಶ, ನಾರು, ಶಕ್ತಿ) NDDB ಮಾನದಂಡಗಳ ಒಳಗೆ ಸುರಕ್ಷಿತವಾಗಿವೆ.",
    stable: "ಮೇವನ್ನು ಒಣ, ಗಾಳಿಯಾಡುವ ಜಾಗದಲ್ಲಿ ಮರದ ಹಲಗೆಗಳ ಮೇಲೆ ಸಂಗ್ರಹಿಸಿ.",
    spoiled: "ತೀವ್ರ ಹಾಳಾಗುವ ಅಪಾಯ: ತಕ್ಷಣ ಪ್ರತ್ಯೇಕಿಸಿ ತೇವಾಂಶವನ್ನು ಪರೀಕ್ಷಿಸಿ.",
    welcome_farmer: "ಸ್ವಾಗತ, {{name}}",
    no_tests_yet: "ಇನ್ನೂ ಯಾವುದೇ ಪರೀಕ್ಷೆಗಳಿಲ್ಲ.",
    start_first_feed_test: "ನಿಮ್ಮ ಮೊದಲ ಮೇವು ಪರೀಕ್ಷೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ"
  },
  ml: {
    product_footer: "ഫീഡ് ഗാർഡ് — ക്ഷീരകർഷകർക്കായുള്ള AI-അധിഷ്ഠിത തീറ്റ, സൈലേജ് ഗുണനിലവാര നിർണ്ണയ സംവിധാനം.",
    err_wrong_password: "തെറ്റായ പാസ്‌വേഡ്. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
    err_account_not_found: "അക്കൗണ്ട് കണ്ടെത്തിയില്ല. ദയവായി വിവരങ്ങൾ പരിശോധിക്കുക അല്ലെങ്കിൽ പുതിയ അക്കൗണ്ട് ഉണ്ടാക്കുക.",
    explore_sample_analysis: "മാതൃകാ വിശകലനം കാണുക",
    sample_data_badge: "മാതൃകാ വിവരങ്ങൾ — പരിശോധനയ്ക്കായി",
    sensor_not_connected: "സെൻസർ ബന്ധിപ്പിച്ചിട്ടില്ല",
    sensor_not_connected_desc: "കമ്മ്യൂണിക്കേഷൻ പോർട്ടുകളിൽ NIR സ്പെക്ട്രോസ്കോപ്പി പ്രോബ് അല്ലെങ്കിൽ സെൻസർ കണ്ടെത്തിയില്ല.",
    use_manual_entry: "മാനുവൽ എൻട്രി ഉപയോഗിക്കുക",
    feed_quality_result: "തീറ്റ ഗുണനിലവാര ഫലം",
    adulteration_assessment: "മായം ചേർക്കൽ വിലയിരുത്തൽ",
    spoilage_assessment: "കേടുപാടുകളും മലിനീകരണവും വിലയിരുത്തൽ",
    farmer_advisory_heading: "കർഷക ഉപദേശകൻ",
    what_result_means: "ഈ ഫലം കൊണ്ട് എന്താണ് അർത്ഥമാക്കുന്നത്?",
    save_to_history: "ചരിത്രത്തിൽ സൂക്ഷിക്കുക",
    sample_analysis_label: "മാതൃകാ വിശകലനം",
    all_balanced: "എല്ലാ പോഷക സൂചകങ്ങളും (പ്രോട്ടീൻ, ഈർപ്പം, നാര്, ഊർജ്ജം) NDDB മാനദണ്ഡങ്ങൾക്കുള്ളിൽ സുരക്ഷിതമാണ്.",
    stable: "തീറ്റച്ചാക്കുകൾ തറയിൽ തട്ടാതെ പലകകളിൽ ഈർപ്പമില്ലാത്ത സ്ഥലത്ത് സൂക്ഷിക്കുക.",
    spoiled: "ഗുരുതരമായ കേടുപാട് സാധ്യത: ബാച്ച് ഉടനടി മാറ്റി സൂക്ഷിക്കുക.",
    welcome_farmer: "സ്വാഗതം, {{name}}",
    no_tests_yet: "ഇതുവരെ പരിശോധനകളൊന്നും നടത്തിയിട്ടില്ല.",
    start_first_feed_test: "നിങ്ങളുടെ ആദ്യ തീറ്റ പരിശോധന ആരംഭിക്കുക"
  },
  bn: {
    product_footer: "ফিড গার্ড — দুগ্ধ খামারিদের জন্য এআই-চালিত গোখাদ্য এবং সাইলেজের গুণমান মূল্যায়ন ব্যবস্থা।",
    err_wrong_password: "ভুল পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন।",
    err_account_not_found: "অ্যাকাউন্ট পাওয়া যায়নি। বিবরণ পরীক্ষা করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।",
    explore_sample_analysis: "নমুনা বিশ্লেষণ দেখুন",
    sample_data_badge: "নমুনা ডেটা — মূল্যায়নের জন্য",
    sensor_not_connected: "সেন্সর সংযুক্ত নেই",
    sensor_not_connected_desc: "কমিউনিকেশন পোর্টে কোনো NIR স্পেকট্রোস্কোপি প্রোব বা সেন্সর পাওয়া যায়নি।",
    use_manual_entry: "ম্যানুয়াল এন্ট্রি ব্যবহার করুন",
    feed_quality_result: "খাদ্য মানের ফলাফল",
    adulteration_assessment: "ভেজাল মূল্যায়ন",
    spoilage_assessment: "পচন ও দূষণ মূল্যায়ন",
    farmer_advisory_heading: "কৃষক পরামর্শ",
    what_result_means: "এই ফলাফলের অর্থ কী?",
    save_to_history: "ইতিহাসে সংরক্ষণ করুন",
    sample_analysis_label: "নমুনা বিশ্লেষণ",
    all_balanced: "সমস্ত পুষ্টি সূচক (প্রোটিন, আর্দ্রতা, ফাইবার, শক্তি) NDDB মানদণ্ডের মধ্যে নিরাপদ।",
    stable: "খাদ্যের বস্তা শুকনো ও বাতাসযুক্ত স্থানে কাঠের তক্তার উপর রাখুন।",
    spoiled: "গুরুতর পচনের ঝুঁকি: দ্রুত আলাদা করুন এবং আর্দ্রতা পরীক্ষা করুন।",
    welcome_farmer: "স্বাগতম, {{name}}",
    no_tests_yet: "এখনও কোনো পরীক্ষা হয়নি।",
    start_first_feed_test: "আপনার প্রথম খাদ্য পরীক্ষা শুরু করুন"
  },
  gu: {
    product_footer: "ફીડ ગાર્ડ — ડેરી ખેડૂતો માટે એઆઈ-સંચાલિત પશુ આહાર અને સાયલેજ ગુણવત્તા મૂલ્યાંકન સિસ્ટમ.",
    err_wrong_password: "ખોટો પાસવર્ડ. કૃપા કરીને ફરી પ્રયાસ કરો.",
    err_account_not_found: "ખાતું મળ્યું નથી. કૃપા કરીને વિગતો તપાસો અથવા નવું ખાતું બનાવો.",
    explore_sample_analysis: "નમૂના વિશ્લેષણ જુઓ",
    sample_data_badge: "નમૂના ડેટા — મૂલ્યાંકન માટે",
    sensor_not_connected: "સેન્સર કનેક્ટ નથી",
    sensor_not_connected_desc: "કોમ્યુનિકેશન પોર્ટ પર કોઈ NIR સ્પેક્ટ્રોસ્કોપી પ્રોબ અથવા સેન્સર મળ્યું નથી.",
    use_manual_entry: "મેન્યુઅલ એન્ટ્રી વાપરો",
    feed_quality_result: "પશુ આહાર ગુણવત્તા પરિણામ",
    adulteration_assessment: "ભેળસેળ મૂલ્યાંકન",
    spoilage_assessment: "બગાડ અને દૂષણ મૂલ્યાંકન",
    farmer_advisory_heading: "ખેડૂત સલાહકાર",
    what_result_means: "આ પરિણામનો અર્થ શું છે?",
    save_to_history: "ઇતિહાસમાં સાચવો",
    sample_analysis_label: "નમૂના વિશ્લેષણ",
    all_balanced: "બધા પોષક સૂચકાંકો (પ્રોટીન, ભેજ, ફાઇબર, ઊર્જા) NDDB ધોરણોની અંદર સુરક્ષિત છે.",
    stable: "ખાણની ગુણીઓને સૂકી અને હવાઉજાસવાળી જગ્યાએ લાકડાના પાટિયા પર રાખો.",
    spoiled: "ગંભીર બગાડનું જોખમ: બેચને અલગ કરો અને ભેજ તપાસો.",
    welcome_farmer: "સ્વાગત છે, {{name}}",
    no_tests_yet: "હજી સુધી કોઈ પરીક્ષણ નથી.",
    start_first_feed_test: "તમારું પ્રથમ આહાર પરીક્ષણ શરૂ કરો"
  },
  pa: {
    product_footer: "ਫੀਡ ਗਾਰਡ — ਡੇਅਰੀ ਕਿਸਾਨਾਂ ਲਈ ਏਆਈ-ਅਧਾਰਿਤ ਪਸ਼ੂ ਖੁਰਾਕ ਅਤੇ ਸਾਈਲੇਜ ਗੁਣਵੱਤਾ ਮੁਲਾਂਕਣ ਪ੍ਰਣਾਲੀ।",
    err_wrong_password: "ਗਲਤ ਪਾਸਵਰਡ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    err_account_not_found: "ਖਾਤਾ ਨਹੀਂ ਲੱਭਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਵੇਰਵੇ ਜਾਂਚੋ ਜਾਂ ਨਵਾਂ ਖਾਤਾ ਬਣਾਓ।",
    explore_sample_analysis: "ਨਮੂਨਾ ਵਿਸ਼ਲੇਸ਼ਣ ਦੇਖੋ",
    sample_data_badge: "ਨਮੂਨਾ ਡੇਟਾ — ਮੁਲਾਂਕਣ ਲਈ",
    sensor_not_connected: "ਸੈਂਸਰ ਕਨੈਕਟ ਨਹੀਂ ਹੈ",
    sensor_not_connected_desc: "ਸੰਚਾਰ ਪੋਰਟਾਂ 'ਤੇ ਕੋਈ NIR ਸਪੈਕਟ੍ਰੋਸਕੋਪੀ ਪ੍ਰੋਬ ਜਾਂ ਸੈਂਸਰ ਨਹੀਂ ਮਿਲਿਆ।",
    use_manual_entry: "ਮੈਨੂਅਲ ਐਂਟਰੀ ਵਰਤੋ",
    feed_quality_result: "ਖੁਰਾਕ ਗੁਣਵੱਤਾ ਨਤੀਜਾ",
    adulteration_assessment: "ਮਿਲਾਵਟ ਮੁਲਾਂਕਣ",
    spoilage_assessment: "ਖਰਾਬੀ ਅਤੇ ਪ੍ਰਦੂਸ਼ਣ ਮੁਲਾਂਕਣ",
    farmer_advisory_heading: "ਕਿਸਾਨ ਸਲਾਹਕਾਰ",
    what_result_means: "ਇਸ ਨਤੀਜੇ ਦਾ ਕੀ ਅਰਥ ਹੈ?",
    save_to_history: "ਮੇਰੇ ਇਤਿਹਾਸ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਕਰੋ",
    sample_analysis_label: "ਨਮੂਨਾ ਵਿਸ਼ਲੇਸ਼ਣ",
    all_balanced: "ਸਾਰੇ ਪੋਸ਼ਕ ਤੱਤ (ਪ੍ਰੋਟੀਨ, ਨਮੀ, ਫਾਈਬਰ, ਊਰਜਾ) NDDB ਮਿਆਰਾਂ ਅਨੁਸਾਰ ਸੁਰੱਖਿਅਤ ਹਨ।",
    stable: "ਖੁਰਾਕ ਦੀਆਂ ਬੋਰੀਆਂ ਨੂੰ ਸੁੱਕੀ ਅਤੇ ਹਵਾਦਾਰ ਥਾਂ 'ਤੇ ਲੱਕੜ ਦੇ ਫੱਟਿਆਂ 'ਤੇ ਰੱਖੋ।",
    spoiled: "ਗੰਭੀਰ ਖਰਾਬੀ ਦਾ ਖਤਰਾ: ਤੁਰੰਤ ਵੱਖ ਕਰੋ ਅਤੇ ਨਮੀ ਦੀ ਜਾਂਚ ਕਰੋ।",
    welcome_farmer: "ਜੀ ਆਇਆਂ ਨੂੰ, {{name}}",
    no_tests_yet: "ਅਜੇ ਤੱਕ ਕੋਈ ਟੈਸਟ ਨਹੀਂ ਹੋਇਆ।",
    start_first_feed_test: "ਆਪਣਾ ਪਹਿਲਾ ਖੁਰਾਕ ਟੈਸਟ ਸ਼ੁਰੂ ਕਰੋ"
  },
  or: {
    product_footer: "ଫିଡ୍ ଗାର୍ଡ — ଦୁଗ୍ଧ ଚାଷୀଙ୍କ ପାଇଁ AI-ଆଧାରିତ ଗୋଖାଦ୍ୟ ଏବଂ ସାଇଲେଜ୍ ଗୁଣବତ୍ତା ମୂଲ୍ୟାଙ୍କନ ବ୍ୟବସ୍ଥା।",
    err_wrong_password: "ଭୁଲ୍ ପାସୱାର୍ଡ। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    err_account_not_found: "ଖାତା ମିଳିଲା ନାହିଁ। ଦୟାକରି ବିବରଣୀ ଯାଞ୍ଚ କରନ୍ତୁ କିମ୍ବା ନୂତନ ଖାତା ଖୋଲନ୍ତୁ।",
    explore_sample_analysis: "ନମୁନା ବିଶ୍ଳେଷଣ ଦେଖନ୍ତୁ",
    sample_data_badge: "ନମୁନା ତଥ୍ୟ — ମୂଲ୍ୟାଙ୍କନ ପାଇଁ",
    sensor_not_connected: "ସେନ୍ସର ସଂଯୋଗ ହୋଇନାହିଁ",
    sensor_not_connected_desc: "କମ୍ୟୁନିକେସନ ପୋର୍ଟରେ କୌଣସି NIR ସ୍ପେକ୍ଟ୍ରୋସ୍କୋପି ପ୍ରୋବ କିମ୍ବା ସେନ୍ସର ମିଳିଲା ନାହିଁ।",
    use_manual_entry: "ମାନୁଆଲ୍ ଏଣ୍ଟ୍ରି ବ୍ୟବହାର କରନ୍ତୁ",
    feed_quality_result: "ଖାଦ୍ୟ ଗୁଣବତ୍ତା ଫଳାଫଳ",
    adulteration_assessment: "ଭେଜାଲ ମୂଲ୍ୟାଙ୍କନ",
    spoilage_assessment: "ନଷ୍ଟ ଓ ସଂକ୍ରମଣ ମୂଲ୍ୟାଙ୍କନ",
    farmer_advisory_heading: "କୃଷକ ପରାମର୍ଶଦାତା",
    what_result_means: "ଏହି ଫଳାଫଳର ଅର୍ଥ କ’ଣ?",
    save_to_history: "ଇତିହାସରେ ସାଇତନ୍ତୁ",
    sample_analysis_label: "ନମୁନା ବିଶ୍ଳେଷଣ",
    all_balanced: "ସମସ୍ତ ପୋଷକ ତତ୍ତ୍ୱ (ପ୍ରୋଟିନ୍, ଆର୍ଦ୍ରତା, ତନ୍ତୁ, ଶକ୍ତି) NDDB ମାନକ ଅନୁଯାୟୀ ସୁରକ୍ଷିତ।",
    stable: "ଖାଦ୍ୟ ବସ୍ତାକୁ ଶୁଖିଲା ଓ ପବନ ଚଳାଚଳ ସ୍ଥାନରେ କାଠ ପଟା ଉପରେ ରଖନ୍ତୁ।",
    spoiled: "ଗମ୍ଭୀର ନଷ୍ଟ ଆଶଙ୍କା: ତୁରନ୍ତ ଅଲଗା କରନ୍ତୁ ଏବଂ ଆର୍ଦ୍ରତା ଯାଞ୍ଚ କରନ୍ତୁ।",
    welcome_farmer: "ସ୍ୱାଗତ, {{name}}",
    no_tests_yet: "ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ପରୀକ୍ଷଣ ହୋଇନାହିଁ।",
    start_first_feed_test: "ଆପଣଙ୍କର ପ୍ରଥମ ଖାଦ୍ୟ ପରୀକ୍ଷା ଆରମ୍ଭ କରନ୍ତୁ"
  },
  as: {
    product_footer: "ফিড গাৰ্ড — দুগ্ধ পালকসকলৰ বাবে AI-চালিত পশু খাদ্য আৰু ছাইলেজ গুণমান মূল্যায়ন ব্যৱস্থা।",
    err_wrong_password: "ভুল পাছৱৰ্ড। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।",
    err_account_not_found: "একাউণ্ট পোৱা নগ'ল। সবিশেষ পৰীক্ষা কৰক বা নতুন একাউণ্ট খোলক।",
    explore_sample_analysis: "নমুনা বিশ্লেষণ চাওক",
    sample_data_badge: "নমুনা তথ্য — মূল্যায়নৰ বাবে",
    sensor_not_connected: "চেন্সৰ সংযোগ হোৱা নাই",
    sensor_not_connected_desc: "কমিউনিকেচন পোৰ্টত কোনো NIR স্পেকট্ৰ'স্কপি প্ৰ'ব বা চেন্সৰ পোৱা নগ'ল।",
    use_manual_entry: "মেনুৱেল এন্ট্ৰি ব্যৱহাৰ কৰক",
    feed_quality_result: "পশু খাদ্যৰ গুণমান ফলাফল",
    adulteration_assessment: "ভেজাল মূল্যায়ন",
    spoilage_assessment: "নষ্ট আৰু সংক্ৰমণ মূল্যায়ন",
    farmer_advisory_heading: "কৃষক পৰামৰ্শদাতা",
    what_result_means: "এই ফলাফলৰ অৰ্থ কি?",
    save_to_history: "ইতিহাসত সংৰক্ষণ কৰক",
    sample_analysis_label: "নমুনা বিশ্লেষণ",
    all_balanced: "সকলো পুষ্টি সূচক (প্ৰ'টিন, আৰ্দ্ৰতা, আঁহ, শক্তি) NDDB মানৰ ভিতৰত সুৰক্ষিত।",
    stable: "খাদ্যৰ বস্তাবোৰ শুকান আৰু বতাহ চলাচল কৰা স্থানত কাঠৰ তক্তাৰ ওপৰত ৰাখক।",
    spoiled: "গুৰুতৰ নষ্ট হোৱাৰ আশংকা: লগে লগে পৃথক কৰক আৰু আৰ্দ্ৰতা পৰীক্ষা কৰক।",
    welcome_farmer: "স্বাগতম, {{name}}",
    no_tests_yet: "এতিয়ালৈকে কোনো পৰীক্ষা কৰা হোৱা নাই।",
    start_first_feed_test: "আপোনাৰ প্ৰথম খাদ্য পৰীক্ষা আৰম্ভ কৰক"
  },
  ur: {
    product_footer: "فیڈ گارڈ — ڈیری کسانوں کے لیے AI کی مدد سے چارے اور سائیلج کے معیار کی جانچ کا نظام۔",
    err_wrong_password: "غلط پاس ورڈ۔ براہ کرم دوبارہ کوشش کریں۔",
    err_account_not_found: "اکاؤنٹ نہیں ملا۔ براہ کرم تفصیلات چیک کریں یا نیا اکاؤنٹ بنائیں۔",
    explore_sample_analysis: "نمونہ تجزیہ دیکھیں",
    sample_data_badge: "نمونہ ڈیٹا — برائے جانچ",
    sensor_not_connected: "سینسر منسلک نہیں ہے",
    sensor_not_connected_desc: "کمیونیکیشن پورٹ پر کوئی NIR سپیکٹروسکوپی پروب یا سینسر نہیں ملا۔",
    use_manual_entry: "دستی اندراج استعمال کریں",
    feed_quality_result: "چارے کے معیار کا نتیجہ",
    adulteration_assessment: "ملاوٹ کی جانچ",
    spoilage_assessment: "خرابی اور آلودگی کی جانچ",
    farmer_advisory_heading: "کسان ایڈوائزری",
    what_result_means: "اس نتیجے کا کیا مطلب ہے؟",
    save_to_history: "میری ہسٹری میں محفوظ کریں",
    sample_analysis_label: "نمونہ تجزیہ",
    all_balanced: "تمام غذائی اجزاء (پروٹین، نمی، ریشہ، توانائی) NDDB معیار کے مطابق محفوظ ہیں۔",
    stable: "چارے کی بوریوں کو خشک اور ہوادار جگہ پر لکڑی کے تختوں پر رکھیں۔",
    spoiled: "سڑنے کا شدید خطرہ: فوری طور پر الگ کریں اور نمی کی جانچ کریں۔",
    welcome_farmer: "خوش آمدید، {{name}}",
    no_tests_yet: "ابھی تک کوئی ٹیسٹ نہیں ہوا ہے۔",
    start_first_feed_test: "اپنا پہلا فیڈ ٹیسٹ شروع کریں"
  }
};

// Deep merge helper
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Function to update a locale file
function updateLocaleFile(lang) {
  const filePath = path.join(LOCALES_DIR, `${lang}.js`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  // Extract JSON object from "export default { ... }"
  const jsonMatch = content.match(/export\s+default\s+({[\s\S]*});?\s*$/);
  if (!jsonMatch) {
    console.error(`Could not parse JSON from ${filePath}`);
    return;
  }

  let localeObj;
  try {
    localeObj = JSON.parse(jsonMatch[1]);
  } catch (e) {
    // If JSON.parse fails due to formatting, evaluate in sandbox
    const vm = require('vm');
    const sandbox = {};
    vm.runInNewContext(`data = ${jsonMatch[1]}`, sandbox);
    localeObj = sandbox.data;
  }

  // Get translations for this language, fallback to English for any missing subkeys
  const langTrans = TRANSLATIONS[lang] || {};
  const enTrans = TRANSLATIONS.en;

  // First apply English base for new keys to guarantee 100% key parity
  deepMerge(localeObj, enTrans);

  // Then apply language-specific translation if available
  if (TRANSLATIONS[lang]) {
    deepMerge(localeObj, TRANSLATIONS[lang]);
  } else if (OTHER_LANGS[lang]) {
    const o = OTHER_LANGS[lang];
    if (o.product_footer) localeObj.brand.product_footer = o.product_footer;
    if (o.err_wrong_password) localeObj.auth.err_wrong_password = o.err_wrong_password;
    if (o.err_account_not_found) localeObj.auth.err_account_not_found = o.err_account_not_found;
    if (o.explore_sample_analysis) {
      localeObj.auth.explore_sample_analysis = o.explore_sample_analysis;
      localeObj.analyze.explore_sample_analysis = o.explore_sample_analysis;
      localeObj.dashboard.explore_sample_analysis = o.explore_sample_analysis;
    }
    if (o.sample_data_badge) {
      localeObj.analyze.sample_data_badge = o.sample_data_badge;
      localeObj.silage.sample_data_badge = o.sample_data_badge;
    }
    if (o.sensor_not_connected) localeObj.analyze.sensor_not_connected = o.sensor_not_connected;
    if (o.sensor_not_connected_desc) localeObj.analyze.sensor_not_connected_desc = o.sensor_not_connected_desc;
    if (o.use_manual_entry) localeObj.analyze.use_manual_entry = o.use_manual_entry;
    if (o.feed_quality_result) localeObj.analyze.feed_quality_result = o.feed_quality_result;
    if (o.adulteration_assessment) localeObj.analyze.adulteration_assessment = o.adulteration_assessment;
    if (o.spoilage_assessment) localeObj.analyze.spoilage_assessment = o.spoilage_assessment;
    if (o.farmer_advisory_heading) localeObj.analyze.farmer_advisory_heading = o.farmer_advisory_heading;
    if (o.what_result_means) localeObj.analyze.what_result_means = o.what_result_means;
    if (o.save_to_history) localeObj.analyze.save_to_history = o.save_to_history;
    if (o.sample_analysis_label) {
      localeObj.analyze.sample_analysis_label = o.sample_analysis_label;
      localeObj.history.sample_analysis = o.sample_analysis_label;
    }
    if (o.all_balanced) localeObj.advisory_nutrition.all_balanced = o.all_balanced;
    if (o.stable) localeObj.advisory_storage.stable = o.stable;
    if (o.spoiled) localeObj.advisory_storage.spoiled = o.spoiled;
    if (o.welcome_farmer) localeObj.dashboard.welcome_farmer = o.welcome_farmer;
    if (o.no_tests_yet) localeObj.dashboard.no_tests_yet = o.no_tests_yet;
    if (o.start_first_feed_test) localeObj.dashboard.start_first_feed_test = o.start_first_feed_test;
  }

  // Write back formatted
  const updatedContent = `export default ${JSON.stringify(localeObj, null, 2)};\n`;
  fs.writeFileSync(filePath, updatedContent, 'utf-8');
  console.log(`Updated ${lang}.js successfully!`);
}

const ALL_LANGS = ['en', 'hi', 'mr', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'pa', 'or', 'as', 'ur'];
ALL_LANGS.forEach(updateLocaleFile);
console.log('All 13 locale files updated!');
