const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales');
const languages = ['en', 'hi', 'mr', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'pa', 'or', 'as', 'ur'];

const translations = {
  feed_quality_result: {
    en: "FEED QUALITY RESULT",
    hi: "चारा गुणवत्ता परिणाम",
    mr: "चारा गुणवत्ता निकाल",
    ta: "தீவன தர முடிவு",
    te: "మేత నాణ్యత ఫలితం",
    kn: "ಮೇವಿನ ಗುಣಮಟ್ಟದ ಫಲಿತಾಂಶ",
    ml: "തീറ്റ ഗുണനിലവാര ഫലം",
    bn: "পশুখাদ্যের মান ফলাফল",
    gu: "ઘાસચારા ગુણવત્તા પરિણામ",
    pa: "ਚਾਰੇ ਦੀ ਗੁਣਵੱਤਾ ਦਾ ਨਤੀਜਾ",
    or: "ଦାନା ଗୁଣବତ୍ତା ଫଳାଫଳ",
    as: "দানাৰ গুণগত মানৰ ফলাফল",
    ur: "چارے کے معیار کا نتیجہ"
  },
  overall_quality: {
    en: "Overall Quality",
    hi: "समग्र गुणवत्ता",
    mr: "एकूण गुणवत्ता",
    ta: "ஒட்டுமொத்த தரம்",
    te: "మొత్తం నాణ్యత",
    kn: "ಒಟ್ಟಾರೆ ಗುಣಮಟ್ಟ",
    ml: "മൊത്തത്തിലുള്ള ഗുണനിലവാരം",
    bn: "সামগ্রিক মান",
    gu: "સમગ્ર ગુણવત્તા",
    pa: "ਕੁੱਲ ਗੁਣਵੱਤਾ",
    or: "ସାମଗ୍ରିକ ଗୁଣବତ୍ତା",
    as: "সামগ্ৰিক গুণগত মান",
    ur: "مجموعی معیار"
  },
  adulteration_assessment: {
    en: "ADULTERATION ASSESSMENT",
    hi: "मिलावट मूल्यांकन",
    mr: "भेसळ मूल्यांकन",
    ta: "கலப்பட மதிப்பீடு",
    te: "కల్తీ అంచనా",
    kn: "ಕಲಬೆರಕೆ ಮೌಲ್ಯಮಾಪನ",
    ml: "മായം ചേര്‍ക്കല്‍ പരിശോധന",
    bn: "ভেজাল মূল্যায়ন",
    gu: "ભેળસેળ મૂલ્યાંકન",
    pa: "ਮਿਲਾਵਟ ਦਾ ਮੁਲਾਂਕਣ",
    or: "ଭେଜାଲ ମୂଲ୍ୟାଙ୍କନ",
    as: "ভেজাল মূল্যায়ন",
    ur: "ملاوٹ کا جائزہ"
  },
  spoilage_assessment: {
    en: "SPOILAGE / CONTAMINATION ASSESSMENT",
    hi: "सड़ांध / संदूषण मूल्यांकन",
    mr: "नासाडी / दूषितीकरण मूल्यांकन",
    ta: "வீணாதல் / நச்சு மதிப்பீடு",
    te: "కుళ్ళిపోవడం / కాలుష్య అంచనా",
    kn: "ಹಾಳಾಗುವಿಕೆ / ಮಾಲಿನ್ಯ ಮೌಲ್ಯಮಾಪನ",
    ml: "കേടാകൽ / മലിനീകരണ പരിശോധന",
    bn: "নষ্ট / দূষণ মূল্যায়ন",
    gu: "બગાડ / પ્રદૂષણ મૂલ્યાંકન",
    pa: "ਖਰਾਬ / ਗੰਦਗੀ ਦਾ ਮੁਲਾਂਕਣ",
    or: "ନଷ୍ଟ / ପ୍ରଦୂଷଣ ମୂଲ୍ୟାଙ୍କନ",
    as: "নষ্ট / প্ৰদূষণ মূল্যায়ন",
    ur: "خرابی / آلودگی کا جائزہ"
  },
  farmer_advisory: {
    en: "Farmer Advisory",
    hi: "किसान सलाह",
    mr: "शेतकरी सल्ला",
    ta: "விவசாயி ஆலோசனைக் குறிப்பு",
    te: "రైతు సలహా",
    kn: "ರೈತ ಸಲಹೆ",
    ml: "കർഷക നിർദ്ദേശം",
    bn: "কৃষক পরামর্শ",
    gu: "ખેડૂત સલાહ",
    pa: "ਕਿਸਾਨ ਸਲਾਹ",
    or: "କୃଷକ ପରାମର୍ଶ",
    as: "কৃষক পৰামৰ্শ",
    ur: "کسان رہنمائی"
  },
  what_result_means: {
    en: "What does this result mean?",
    hi: "इस परिणाम का क्या अर्थ है?",
    mr: "या निकालाचा अर्थ काय आहे?",
    ta: "இந்த முடிவின் பொருள் என்ன?",
    te: "ఈ ఫలితం అర్థం ఏమిటి?",
    kn: "ಈ ಫಲಿತಾಂಶದ ಅರ್ಥವೇನು?",
    ml: "ഈ ഫലത്തിന്റെ അർത്ഥമെന്താണ്?",
    bn: "এই ফলাফলের অর্থ কী?",
    gu: "આ પરિણામનો અર્થ શું છે?",
    pa: "ਇਸ ਨਤੀਜੇ ਦਾ ਕੀ ਅਰਥ ਹੈ?",
    or: "ଏହି ଫଳାଫଳର ଅର୍ଥ କ’ଣ?",
    as: "এই ফলাফলৰ অৰ্থ কি?",
    ur: "اس نتیجے کا کیا مطلب ہے؟"
  },
  sensor_not_connected: {
    en: "Sensor not connected",
    hi: "सेंसर कनेक्ट नहीं है",
    mr: "सेन्सर जोडलेला नाही",
    ta: "சென்சார் இணைக்கப்படவில்லை",
    te: "సెన్సార్ కనెక్ట్ కాలేదు",
    kn: "ಸೆನ್ಸಾರ್ ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ",
    ml: "സെൻസർ ബന്ധിപ്പിച്ചിട്ടില്ല",
    bn: "সেন্সর সংযুক্ত নেই",
    gu: "સેન્સર જોડાયેલ નથી",
    pa: "ਸੈਂਸਰ ਕਨੈਕਟ ਨਹੀਂ ਹੈ",
    or: "ସେନ୍ସର ସଂଯୁକ୍ତ ହୋଇନାହିଁ",
    as: "চেনচৰ সংযোগ হোৱা নাই",
    ur: "سینسر منسلک نہیں ہے"
  },
  sample_data_eval: {
    en: "Sample Data — for evaluation",
    hi: "नमूना डेटा — मूल्यांकन के लिए",
    mr: "नमुना डेटा — मूल्यमापनासाठी",
    ta: "மாதிரித் தரவு — மதிப்பீட்டிற்காக",
    te: "నమూనా డేటా — మూల్యాంకనం కోసం",
    kn: "ಮಾದರಿ ಡೇಟಾ — ಮೌಲ್ಯಮಾಪನಕ್ಕಾಗಿ",
    ml: "മാതൃകാ ഡാറ്റ — വിലയിരുത്തലിനായി",
    bn: "নমুনা ডেটা — মূল্যায়নের জন্য",
    gu: "નમૂના ડેટા — મૂલ્યાંકન માટે",
    pa: "ਨਮੂਨਾ ਡਾਟਾ — ਮੁਲਾਂਕਣ ਲਈ",
    or: "ନମୁନା ତଥ୍ୟ — ମୂଲ୍ୟାଙ୍କନ ପାଇଁ",
    as: "নমুনা তথ্য — মূল্যায়নৰ বাবে",
    ur: "نمونہ ڈیٹا — برائے جائزہ"
  },
  sample_analysis_title: {
    en: "Sample Analysis",
    hi: "नमूना विश्लेषण",
    mr: "नमुना विश्लेषण",
    ta: "மாதிரி பகுப்பாய்வு",
    te: "నమూనా విశ్లేషణ",
    kn: "ಮಾದರಿ ವಿಶ್ಲೇಷಣೆ",
    ml: "മാതൃകാ വിശകലനം",
    bn: "নমুনা বিশ্লেষণ",
    gu: "નમૂના વિશ્લેષણ",
    pa: "ਨਮੂਨਾ ਵਿਸ਼ਲੇਸ਼ਣ",
    or: "ନମୁନା ବିଶ୍ଳେଷଣ",
    as: "নমুনা বিশ্লেষণ",
    ur: "نمونہ تجزیہ"
  },
  sample_analysis_subtitle: {
    en: "Use prepared sample data to evaluate the complete workflow.",
    hi: "पूर्ण कार्यप्रवाह का मूल्यांकन करने के लिए तैयार नमूना डेटा का उपयोग करें।",
    mr: "संपूर्ण कार्यप्रवाहाचे मूल्यांकन करण्यासाठी तयार नमुना डेटा वापरा.",
    ta: "முழு செயல்முறையையும் மதிப்பீடு செய்ய தயாராக உள்ள மாதிரித் தரவைப் பயன்படுத்தவும்.",
    te: "పూర్తి పనితీరును అంచనా వేయడానికి సిద్ధం చేసిన నమూనా డేటాను ఉపయోగించండి.",
    kn: "ಸಂಪೂರ್ಣ ಕಾರ್ಯವಿಧಾನವನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಲು ಸಿದ್ಧಪಡಿಸಿದ ಮಾದರಿ ಡೇಟಾವನ್ನು ಬಳಸಿ.",
    ml: "പൂർണ്ണ വർക്ക്‌ഫ്ലോ വിലയിരുത്താൻ തയ്യാറാക്കിയ സാമ്പിൾ ഡാറ്റ ഉപയോഗിക്കുക.",
    bn: "সম্পূর্ণ কার্যপ্রবাহ মূল্যায়নের জন্য প্রস্তুত নমুনা ডেটা ব্যবহার করুন।",
    gu: "સંપૂર્ણ કાર્યપ્રવાહનું મૂલ્યાંકન કરવા માટે તૈયાર કરેલ નમૂના ડેટાનો ઉપયોગ કરો.",
    pa: "ਪੂਰੇ ਕਾਰਜਪ੍ਰਵਾਹ ਦਾ ਮੁਲਾਂਕਣ ਕਰਨ ਲਈ ਤਿਆਰ ਨਮੂਨਾ ਡੇਟਾ ਦੀ ਵਰਤੋਂ ਕਰੋ।",
    or: "ସମ୍ପୂର୍ଣ୍ଣ କାର୍ଯ୍ୟପ୍ରଣାଳୀ ମୂଲ୍ୟାଙ୍କନ କରିବାକୁ ପ୍ରସ୍ତୁତ ନମୁନା ତଥ୍ୟ ବ୍ୟବହାର କରନ୍ତୁ।",
    as: "সম্পূৰ্ণ কাৰ্যপ্ৰণালী মূল্যায়নৰ বাবে প্ৰস্তুত নমুনা তথ্য ব্যৱহাৰ কৰক।",
    ur: "مکمل ورک فلو کا جائزہ لینے کے لیے تیار کردہ نمونہ ڈیٹا استعمال کریں۔"
  },
  use_manual_entry: {
    en: "Use Manual Entry",
    hi: "मैनुअल प्रविष्टि का उपयोग करें",
    mr: "मॅन्युअल नोंद वापरा",
    ta: "கைமுறை உள்ளீட்டைப் பயன்படுத்தவும்",
    te: "మాన్యువల్ ఎంట్రీని ఉపయోగించండి",
    kn: "ಹಸ್ತಚಾಲಿತ ನಮೂದನ್ನು ಬಳಸಿ",
    ml: "മാനുവൽ എൻട്രി ഉപയോഗിക്കുക",
    bn: "ম্যানুয়াল এন্ট্রি ব্যবহার করুন",
    gu: "મેન્યુઅલ એન્ટ્રીનો ઉપયોગ કરો",
    pa: "ਮੈਨੂਅਲ ਐਂਟਰੀ ਵਰਤੋਂ",
    or: "ମାନୁଆଲ୍ ପ୍ରବେଶ ବ୍ୟବହାର କରନ୍ତୁ",
    as: "মেনুৱেল এন্ট্ৰি ব্যৱহাৰ কৰক",
    ur: "دستی اندراج استعمال کریں"
  },
  explore_sample_analysis: {
    en: "Explore Sample Analysis",
    hi: "नमूना विश्लेषण देखें",
    mr: "नमुना विश्लेषण पहा",
    ta: "மாதிரி பகுப்பாய்வை ஆராயுங்கள்",
    te: "నమూనా విశ్లేషణను అన్వేషించండి",
    kn: "ಮಾದರಿ ವಿಶ್ಲೇಷಣೆ ಅನ್ವೇಷಿಸಿ",
    ml: "മാതൃകാ വിശകലനം പര്യവേക്ഷണം ചെയ്യുക",
    bn: "নমুনা বিশ্লেষণ দেখুন",
    gu: "નમૂના વિશ્લેષણ જુઓ",
    pa: "ਨਮੂਨਾ ਵਿਸ਼ਲੇਸ਼ਣ ਵੇਖੋ",
    or: "ନମୁନା ବିଶ୍ଳେଷଣ ଅନୁସନ୍ଧାନ କରନ୍ତୁ",
    as: "নমুনা বিশ্লেষণ চাওক",
    ur: "نمونہ تجزیہ کا مشاہدہ کریں"
  },
  detected: {
    en: "Detected",
    hi: "पाया गया",
    mr: "आढळले",
    ta: "கண்டறியப்பட்டது",
    te: "గుర్తించబడింది",
    kn: "ಪತ್ತೆಯಾಗಿದೆ",
    ml: "കണ്ടെത്തി",
    bn: "শনাক্ত হয়েছে",
    gu: "મળી આવ્યું",
    pa: "ਪਾਇਆ ਗਿਆ",
    or: "ଚିହ୍ନଟ ହୋଇଛି",
    as: "ধৰা পৰিছে",
    ur: "پایا گیا"
  },
  not_detected: {
    en: "Not Detected",
    hi: "नहीं पाया गया",
    mr: "आढळले नाही",
    ta: "கண்டறியப்படவில்லை",
    te: "గుర్తించబడలేదు",
    kn: "ಪತ್ತೆಯಾಗಿಲ್ಲ",
    ml: "കണ്ടെത്തിയില്ല",
    bn: "শনাক্ত হয়নি",
    gu: "મળ્યું નથી",
    pa: "ਨਹੀਂ ਮਿਲਿਆ",
    or: "ଚିହ୍ନଟ ହୋଇନାହିଁ",
    as: "ধৰা পৰା নাই",
    ur: "نہیں پایا گیا"
  },
  fresh_safe: {
    en: "Fresh / Safe",
    hi: "ताजा / सुरक्षित",
    mr: "ताजे / सुरक्षित",
    ta: "புதியது / பாதுகாப்பானது",
    te: "తాజా / సురಕ್ಷితం",
    kn: "ತಾಜಾ / ಸುರಕ್ಷಿತ",
    ml: "ശുദ്ധം / സുരക്ഷിതം",
    bn: "তাজা / নিরাপদ",
    gu: "તાજું / સુરક્ષિત",
    pa: "ਤਾਜ਼ਾ / ਸੁਰੱਖਿਅਤ",
    or: "ତାଜା / ସୁରକ୍ଷିତ",
    as: "তাজা / সুৰক্ষিত",
    ur: "تازہ / محفوظ"
  },
  spoilage_detected: {
    en: "Spoiled / Contaminated",
    hi: "खराब / दूषित",
    mr: "खराब / दूषित",
    ta: "கெட்டுப்போனது / நச்சுத்தன்மை",
    te: "పాడైపోయింది / కలుషితం",
    kn: "ಹಾಳಾಗಿದೆ / ಕಲುಷಿತ",
    ml: "കേടായത് / മലിനമായത്",
    bn: "নষ্ট / দূষিত",
    gu: "બગડેલું / દૂષિત",
    pa: "ਖਰਾਬ / ਦੂਸ਼ਿਤ",
    or: "ନଷ୍ଟ / ଦୂଷିତ",
    as: "নষ্ট / দূষিত",
    ur: "خراب / آلودہ"
  },
  real_test_badge: {
    en: "Real Farmer Test",
    hi: "वास्तविक किसान परीक्षण",
    mr: "प्रत्यक्ष शेतकरी चाचणी",
    ta: "உண்மையான விவசாயி பரிசோதனை",
    te: "నిజమైన రైతు పరీక్ష",
    kn: "ನೈಜ ರೈತ ಪರೀಕ್ಷೆ",
    ml: "യഥാർത്ഥ കർഷക പരിശോധന",
    bn: "প্রকৃত কৃষক পরীক্ষা",
    gu: "વાસ્તવિક ખેડૂત પરીક્ષણ",
    pa: "ਅਸਲ ਕਿਸਾਨ ਟੈਸਟ",
    or: "ପ୍ରକୃତ କୃଷକ ପରୀକ୍ଷା",
    as: "প্ৰকৃত কৃষক পৰীক্ষা",
    ur: "اصلی کسان ٹیسٹ"
  },
  col_data_type: {
    en: "Data Type",
    hi: "डेटा प्रकार",
    mr: "डेटा प्रकार",
    ta: "தரவு வகை",
    te: "డేటా రకం",
    kn: "ಡೇಟಾ ಪ್ರಕಾರ",
    ml: "ഡാറ്റ തരം",
    bn: "ডেটার ধরণ",
    gu: "ડેટા પ્રકાર",
    pa: "ਡਾਟਾ ਕਿਸਮ",
    or: "ତଥ୍ୟ ପ୍ରକାର",
    as: "তথ্যৰ প্ৰকাৰ",
    ur: "ڈیٹا کی قسم"
  },
  save_to_my_history: {
    en: "Save to My History",
    hi: "मेरे इतिहास में सहेजें",
    mr: "माझ्या इतिहासात जतन करा",
    ta: "எனது வரலாற்றில் சேமிக்கவும்",
    te: "నా చరిత్రలో సేవ్ చేయండి",
    kn: "ನನ್ನ ಇತಿಹಾಸಕ್ಕೆ ಉಳಿಸಿ",
    ml: "എന്റെ ചരിത്രത്തിലേക്ക് സേവ് ചെയ്യുക",
    bn: "আমার ইতিহাসে সংরক্ষণ করুন",
    gu: "મારા ઇતિહાસમાં સાચવો",
    pa: "ਮੇਰੇ ਇਤਿਹਾਸ ਵਿੱਚ ਸੰਭਾਲੋ",
    or: "ମୋର ଇତିହାସରେ ସାଇତନ୍ତୁ",
    as: "মোৰ ইতিহাসত সংৰক্ষণ কৰক",
    ur: "میری ہسٹری میں محفوظ کریں"
  }
};

for (const lang of languages) {
  const filePath = path.join(localesDir, `${lang}.js`);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing file: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Parse export default { ... }
  const match = content.match(/export\s+default\s+({[\s\S]+});?\s*$/);
  if (!match) {
    console.error(`Could not match export default in ${lang}.js`);
    continue;
  }

  let obj;
  try {
    obj = JSON.parse(match[1]);
  } catch (e) {
    console.error(`JSON parse error in ${lang}.js:`, e.message);
    continue;
  }

  // Inject into analyze section
  if (!obj.analyze) obj.analyze = {};
  obj.analyze.feed_quality_result = translations.feed_quality_result[lang] || translations.feed_quality_result.en;
  obj.analyze.overall_quality = translations.overall_quality[lang] || translations.overall_quality.en;
  obj.analyze.adulteration_assessment = translations.adulteration_assessment[lang] || translations.adulteration_assessment.en;
  obj.analyze.spoilage_assessment = translations.spoilage_assessment[lang] || translations.spoilage_assessment.en;
  obj.analyze.farmer_advisory = translations.farmer_advisory[lang] || translations.farmer_advisory.en;
  obj.analyze.what_result_means = translations.what_result_means[lang] || translations.what_result_means.en;
  obj.analyze.sensor_not_connected = translations.sensor_not_connected[lang] || translations.sensor_not_connected.en;
  obj.analyze.sample_data_eval = translations.sample_data_eval[lang] || translations.sample_data_eval.en;
  obj.analyze.sample_analysis_title = translations.sample_analysis_title[lang] || translations.sample_analysis_title.en;
  obj.analyze.sample_analysis_subtitle = translations.sample_analysis_subtitle[lang] || translations.sample_analysis_subtitle.en;
  obj.analyze.use_manual_entry = translations.use_manual_entry[lang] || translations.use_manual_entry.en;
  obj.analyze.explore_sample_analysis = translations.explore_sample_analysis[lang] || translations.explore_sample_analysis.en;
  obj.analyze.detected = translations.detected[lang] || translations.detected.en;
  obj.analyze.not_detected = translations.not_detected[lang] || translations.not_detected.en;
  obj.analyze.fresh_safe = translations.fresh_safe[lang] || translations.fresh_safe.en;
  obj.analyze.spoilage_detected = translations.spoilage_detected[lang] || translations.spoilage_detected.en;
  obj.analyze.save_to_my_history = translations.save_to_my_history[lang] || translations.save_to_my_history.en;

  // Inject into history section
  if (!obj.history) obj.history = {};
  obj.history.col_data_type = translations.col_data_type[lang] || translations.col_data_type.en;
  obj.history.real_farmer_test = translations.real_test_badge[lang] || translations.real_test_badge.en;
  obj.history.sample_analysis = translations.sample_analysis_title[lang] || translations.sample_analysis_title.en;

  // Inject into silage section
  if (!obj.silage) obj.silage = {};
  obj.silage.sample_data_eval = translations.sample_data_eval[lang] || translations.sample_data_eval.en;

  // Format and save
  const newContent = `export default ${JSON.stringify(obj, null, 2)};\n`;
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Updated ${lang}.js successfully.`);
}

console.log('All 13 locales updated with phase 2 keys.');
