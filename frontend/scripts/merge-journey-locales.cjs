const fs = require('fs');
const path = require('path');

const locales = ['en', 'hi', 'mr', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'pa', 'or', 'as', 'ur'];

const dicts = {
  en: {
    home: {
      cta_explore: 'Explore Feed Guard',
      cta_login: 'Farmer Login',
      no_account_notice: 'No account required to explore the platform. Login is required to save tests and access farmer records.'
    },
    auth: {
      explore_without_login: 'Explore without login',
      login_tagline: 'Access your feed analysis, silage monitoring, reports and farmer advisory.',
      welcome_login_headline: 'Smarter feed decisions for healthier dairy farming.',
      welcome_login_desc: 'AI-assisted feed quality screening, silage monitoring, farmer advisory and offline-ready workflow for dairy farming.',
      trust_message: 'Your farmer records are securely associated with your account.',
      feature_feed_title: 'AI Feed Screening',
      feature_feed_desc: 'Assess feed quality and adulteration risk.',
      feature_silage_title: 'Silage Monitoring',
      feature_silage_desc: 'Monitor temperature, pH, moisture and spoilage indicators.',
      feature_advisory_title: 'Farmer Advisory',
      feature_advisory_desc: 'Receive simple feeding and storage recommendations.',
      feature_offline_title: 'Offline Ready',
      feature_offline_desc: 'Store results locally and synchronize when connectivity returns.',
      err_invalid_credentials: 'Invalid mobile number or password.',
      login_required: 'Login Required',
      login_required_desc: 'Login required to save this result and access persistent farmer records.',
      continue_exploring: 'Continue Exploring'
    },
    dashboard: {
      start_feed_test: 'Start Feed Test',
      no_feed_tests_yet: 'No feed tests yet',
      no_feed_tests_desc: 'Start your first feed analysis to see quality results, risk assessment and feeding recommendations.',
      greeting_morning: 'Good morning',
      greeting_afternoon: 'Good afternoon',
      greeting_evening: 'Good evening',
      silage_card_title: 'Silage Fermentation Monitor',
      simulated_sensor_data: 'SIMULATED SENSOR DATA',
      live_sensor_data: 'LIVE SENSOR DATA',
      latest_farmer_advisory: 'Latest Farmer Advisory',
      feeding_recommendation: 'Feeding Recommendation',
      storage_recommendation: 'Storage Recommendation',
      risk_alert: 'Risk Alert',
      recommended_action: 'Recommended Action',
      save_result_btn: 'Save Result',
      saved_to_records: 'Test saved to your farmer records.'
    },
    nav: {
      overview: 'Overview'
    }
  },
  hi: {
    home: {
      cta_explore: 'फीड गार्ड एक्सप्लोर करें',
      cta_login: 'किसान लॉगिन',
      no_account_notice: 'प्लेटफॉर्म एक्सप्लोर करने के लिए खाते की आवश्यकता नहीं है। परीक्षण सहेजने और किसान रिकॉर्ड देखने हेतु लॉगिन आवश्यक है।'
    },
    auth: {
      explore_without_login: 'बिना लॉगिन के एक्सप्लोर करें',
      login_tagline: 'अपने आहार परीक्षण, साइलेज निगरानी, रिपोर्ट और किसान परामर्श प्राप्त करें।',
      welcome_login_headline: 'स्वस्थ डेयरी फार्मिंग के लिए समझदारी भरा आहार निर्णय।',
      welcome_login_desc: 'डेयरी फार्मिंग के लिए एआई-सहायक आहार गुणवत्ता जांच, साइलेज निगरानी, किसान परामर्श और ऑफलाइन-सक्षम कार्यप्रणाली।',
      trust_message: 'आपके किसान रिकॉर्ड आपके खाते से सुरक्षित रूप से जुड़े हुए हैं।',
      feature_feed_title: 'एआई आहार जांच',
      feature_feed_desc: 'आहार गुणवत्ता एवं मिलावट के जोखिम का आकलन करें।',
      feature_silage_title: 'साइलेज निगरानी',
      feature_silage_desc: 'तापमान, pH, नमी और सड़ांध संकेतकों की निगरानी करें।',
      feature_advisory_title: 'किसान परामर्श',
      feature_advisory_desc: 'सरल दैनिक खुराक एवं भंडारण अनुशंसाएं प्राप्त करें।',
      feature_offline_title: 'ऑफलाइन सक्षम',
      feature_offline_desc: 'इंटरनेट न होने पर भी परिणाम सुरक्षित रखें और पुनः जुड़ने पर सिंक करें।',
      err_invalid_credentials: 'अमान्य मोबाइल नंबर या पासवर्ड।',
      login_required: 'लॉगिन आवश्यक है',
      login_required_desc: 'इस परिणाम को सुरक्षित रखने और स्थायी किसान रिकॉर्ड देखने हेतु लॉगिन आवश्यक है।',
      continue_exploring: 'एक्सप्लोर करना जारी रखें'
    },
    dashboard: {
      start_feed_test: 'पहला आहार परीक्षण शुरू करें',
      no_feed_tests_yet: 'अभी तक कोई आहार परीक्षण नहीं',
      no_feed_tests_desc: 'गुणवत्ता परिणाम, जोखिम मूल्यांकन और आहार अनुशंसाएं देखने के लिए अपना पहला आहार परीक्षण शुरू करें।',
      greeting_morning: 'शुभ प्रभात',
      greeting_afternoon: 'शुभ दोपहर',
      greeting_evening: 'शुभ संध्या',
      silage_card_title: 'साइलेज किण्वन निगरानी',
      simulated_sensor_data: 'सिम्युलेटेड सेंसर डेटा',
      live_sensor_data: 'लाइव सेंसर डेटा',
      latest_farmer_advisory: 'नवीनतम किसान परामर्श',
      feeding_recommendation: 'खुराक अनुशंसा',
      storage_recommendation: 'भंडारण अनुशंसा',
      risk_alert: 'जोखिम चेतावनी',
      recommended_action: 'अनुशंसित कार्रवाई',
      save_result_btn: 'परिणाम सुरक्षित करें',
      saved_to_records: 'परीक्षण आपके किसान रिकॉर्ड में सुरक्षित कर लिया गया है।'
    },
    nav: {
      overview: 'अवलोकन'
    }
  },
  mr: {
    home: {
      cta_explore: 'फीड गार्ड एक्सप्लोर करा',
      cta_login: 'शेतकरी लॉगिन',
      no_account_notice: 'प्लॅटफॉर्म एक्सप्लोर करण्यासाठी खात्याची आवश्यकता नाही. चाचणी जतन करण्यासाठी आणि शेतकरी नोंदी पाहण्यासाठी लॉगिन आवश्यक आहे.'
    },
    auth: {
      explore_without_login: 'लॉगिन न करता एक्सप्लोर करा',
      login_tagline: 'तुमच्या पशुखाद्य तपासण्या, सायलेज निरीक्षण, अहवाल आणि शेतकरी सल्ल्यात प्रवेश करा.',
      welcome_login_headline: 'सशक्त दुग्धव्यवसायासाठी पशुखाद्याचे अचूक निर्णय.',
      welcome_login_desc: 'दुग्धव्यवसायासाठी एआय-सहाय्यित पशुखाद्य तपासणी, सायलेज निरीक्षण, शेतकरी सल्ला आणि ऑफलाइन कार्यप्रणाली.',
      trust_message: 'तुमच्या शेतकरी नोंदी तुमच्या खात्यासह सुरक्षितपणे जोडलेल्या आहेत.',
      feature_feed_title: 'एआय खाद्य तपासणी',
      feature_feed_desc: 'खाद्य गुणवत्ता व भेसळ धोक्याचे मूल्यांकन करा.',
      feature_silage_title: 'सायलेज निरीक्षण',
      feature_silage_desc: 'तापमान, pH, ओलावा आणि नासाडी निर्देशकांचे निरीक्षण करा.',
      feature_advisory_title: 'शेतकरी सल्ला',
      feature_advisory_desc: 'सुलभ खुराक व साठवणूक शिफारसी मिळवा.',
      feature_offline_title: 'ऑफलाइन सक्षम',
      feature_offline_desc: 'इंटरनेट नसतानाही निकाल जतन करा आणि पुन्हा जोडल्यावर सिंक करा.',
      err_invalid_credentials: 'अवैध मोबाईल क्रमांक किंवा पासवर्ड.',
      login_required: 'लॉगिन आवश्यक आहे',
      login_required_desc: 'हा निकाल जतन करण्यासाठी आणि शेतकरी नोंदी पाहण्यासाठी लॉगिन आवश्यक आहे.',
      continue_exploring: 'एक्सप्लोर करणे चालू ठेवा'
    },
    dashboard: {
      start_feed_test: 'पहिली खाद्य चाचणी सुरू करा',
      no_feed_tests_yet: 'अद्याप कोणतीही खाद्य चाचणी नाही',
      no_feed_tests_desc: 'गुणवत्ता निकाल, जोखीम मूल्यांकन आणि खुराक शिफारसी पाहण्यासाठी तुमची पहिली खाद्य तपासणी सुरू करा.',
      greeting_morning: 'शुभ सकाळ',
      greeting_afternoon: 'शुभ दुपार',
      greeting_evening: 'शुभ संध्याकाळ',
      silage_card_title: 'सायलेज किण्वन निरीक्षण',
      simulated_sensor_data: 'सिम्युलेटेड सेन्सर डेटा',
      live_sensor_data: 'लाइव्ह सेन्सर डेटा',
      latest_farmer_advisory: 'नवीनतम शेतकरी सल्ला',
      feeding_recommendation: 'खुराक शिफारस',
      storage_recommendation: 'साठवणूक शिफारस',
      risk_alert: 'धोका इशारा',
      recommended_action: 'शिफारस केलेली कृती',
      save_result_btn: 'निकाल जतन करा',
      saved_to_records: 'चाचणी तुमच्या शेतकरी नोंदींमध्ये जतन केली गेली आहे.'
    },
    nav: {
      overview: 'आढावा'
    }
  },
  ta: {
    home: {
      cta_explore: 'Feed Guard-ஐ ஆராய்க',
      cta_login: 'விவசாயி உள்நுழைவு',
      no_account_notice: 'தளத்தை ஆராய கணக்கு தேவையில்லை. சோதனைகளைச் சேமிக்கவும் பதிவுகளை அணுகவும் உள்நுழைவு தேவை.'
    },
    auth: {
      explore_without_login: 'உள்நுழைவின்றி ஆராய்க',
      login_tagline: 'தீவனப் பகுப்பாய்வு, சைலேஜ் கண்காணிப்பு, அறிக்கைகள் மற்றும் விவசாய ஆலோசனைகளை அணுகவும்.',
      welcome_login_headline: 'ஆரோக்கியமான பால் பண்ணைக்கு புத்திசாலித்தனமான தீவன முடிவுகள்.',
      welcome_login_desc: 'பால் பண்ணைக்கான AI-உதவி தீவனத் தர பரிசோதனை, சைலேஜ் கண்காணிப்பு, விவசாய ஆலோசனை மற்றும் ஆஃப்லைன் பணிப்பாய்வு.',
      trust_message: 'உங்கள் விவசாய பதிவுகள் உங்கள் கணக்கில் பாதுகாப்பாக இணைக்கப்பட்டுள்ளன.',
      feature_feed_title: 'AI தீவனப் பரிசோதனை',
      feature_feed_desc: 'தீவனத் தரம் மற்றும் கலப்பட அபாயத்தை மதிப்பீடு செய்யுங்கள்.',
      feature_silage_title: 'சைலேஜ் கண்காணிப்பு',
      feature_silage_desc: 'வெப்பநிலை, pH, ஈரப்பதம் மற்றும் கெட்டுப்போதல் அறிகுறிகளைக் கண்காணிக்கவும்.',
      feature_advisory_title: 'விவசாய ஆலோசனை',
      feature_advisory_desc: 'எளிமையான தீவன மற்றும் சேமிப்பு பரிந்துரைகளைப் பெறுங்கள்.',
      feature_offline_title: 'ஆஃப்லைன் வசதி',
      feature_offline_desc: 'இணையம் இல்லாதபோதும் முடிவுகளைச் சேமித்து மீண்டும் இணையும்போது ஒத்திசைக்கவும்.',
      err_invalid_credentials: 'தவறான மொபைல் எண் அல்லது கடவுச்சொல்.',
      login_required: 'உள்நுழைவு தேவை',
      login_required_desc: 'இந்த முடிவைச் சேமிக்கவும் பதிவுகளை அணுகவும் உள்நுழைவு தேவைப்படுகிறது.',
      continue_exploring: 'தொடர்ந்து ஆராய்க'
    },
    dashboard: {
      start_feed_test: 'முதல் தீவனப் பரிசோதனையைத் தொடங்குக',
      no_feed_tests_yet: 'இதுவரை தீவனப் பரிசோதனைகள் இல்லை',
      no_feed_tests_desc: 'தர முடிவுகள், ஆபத்து மதிப்பீடு மற்றும் தீவன பரிந்துரைகளைக் காண உங்கள் முதல் தீவன பரிசோதனையைத் தொடங்குங்கள்.',
      greeting_morning: 'காலை வணக்கம்',
      greeting_afternoon: 'மதிய வணக்கம்',
      greeting_evening: 'மாலை வணக்கம்',
      silage_card_title: 'சைலேஜ் நொதித்தல் கண்காணிப்பு',
      simulated_sensor_data: 'மாதிரி சென்சார் தரவு',
      live_sensor_data: 'நேரலை சென்சார் தரவு',
      latest_farmer_advisory: 'சமீபத்திய விவசாய ஆலோசனை',
      feeding_recommendation: 'தீவன பரிந்துரை',
      storage_recommendation: 'சேமிப்பு பரிந்துரை',
      risk_alert: 'ஆபத்து எச்சரிக்கை',
      recommended_action: 'பரிந்துரைக்கப்பட்ட நடவடிக்கை',
      save_result_btn: 'முடிவைச் சேமிக்க',
      saved_to_records: 'பரிசோதனை உங்கள் விவசாய பதிவுகளில் சேமிக்கப்பட்டது.'
    },
    nav: {
      overview: 'கண்ணோட்டம்'
    }
  },
  te: {
    home: {
      cta_explore: 'Feed Guard అన్వేషించండి',
      cta_login: 'రైతు లాగిన్',
      no_account_notice: 'ప్లాట్‌ఫారమ్‌ను అన్వేషించడానికి ఖాతా అవసరం లేదు. పరీక్షలను సేవ్ చేయడానికి మరియు రికార్డులను పొందడానికి లాగిన్ అవసరం.'
    },
    auth: {
      explore_without_login: 'లాగిన్ లేకుండా అన్వేషించండి',
      login_tagline: 'మీ దాణా విశ్లేషణ, సైలేజ్ పర్యవేక్షణ, నివేదికలు మరియు రైతు సలహాలను పొందండి.',
      welcome_login_headline: 'ఆరోగ్యకరమైన పాడి పరిశ్రమ కోసం తెలివైన దాణా నిర్ణయాలు.',
      welcome_login_desc: 'పాడి పరిశ్రమ కోసం AI-ఆధారిత దాణా నాణ్యత పరీక్ష, సైలేజ్ పర్యవేక్షణ, రైతు సలహా మరియు ఆఫ్‌లైన్ వర్క్‌ఫ్లో.',
      trust_message: 'మీ రైతు రికార్డులు మీ ఖాతాతో సురక్షితంగా అనుసంధానించబడి ఉన్నాయి.',
      feature_feed_title: 'AI దాణా పరీక్ష',
      feature_feed_desc: 'దాణా నాణ్యత మరియు కల్తీ ప్రమాదాన్ని అంచనా వేయండి.',
      feature_silage_title: 'సైలేజ్ పర్యవేక్షణ',
      feature_silage_desc: 'ఉష్ణోగ్రత, pH, తేమ మరియు పాడైపోయే సూచికలను పర్యవేక్షించండి.',
      feature_advisory_title: 'రైతు సలహా',
      feature_advisory_desc: 'సులభమైన దాణా మరియు నిల్వ సిఫార్సులను పొందండి.',
      feature_offline_title: 'ఆఫ్‌లైన్ సిద్ధం',
      feature_offline_desc: 'కనెక్టివిటీ లేనప్పుడు ఫలితాలను భద్రపరచండి, ఇంటర్నెట్ వచ్చినప్పుడు సింక్ చేయండి.',
      err_invalid_credentials: 'చెల్లని మొబైల్ నంబర్ లేదా పాస్‌వర్డ్.',
      login_required: 'లాగిన్ అవసరం',
      login_required_desc: 'ఈ ఫలితాన్ని సేవ్ చేయడానికి మరియు రైతు రికార్డులను పొందడానికి లాగిన్ అవసరం.',
      continue_exploring: 'అన్వేషణ కొనసాగించండి'
    },
    dashboard: {
      start_feed_test: 'మొదటి దాణా పరీక్ష ప్రారంభించండి',
      no_feed_tests_yet: 'ఇంకా ఎటువంటి దాణా పరీక్షలు లేవు',
      no_feed_tests_desc: 'నాణ్యత ఫలితాలు, ప్రమాద అంచనా మరియు దాణా సిఫార్సులను చూడటానికి మీ మొదటి దాణా పరీక్షను ప్రారంభించండి.',
      greeting_morning: 'శుభోదయం',
      greeting_afternoon: 'శుభ మధ్యాహ్నం',
      greeting_evening: 'శుభ సాయంత్రం',
      silage_card_title: 'సైలేజ్ కిణ్వ ప్రక్రియ పర్యవేక్షణ',
      simulated_sensor_data: 'అనుకరణ సెన్సార్ డేటా',
      live_sensor_data: 'లైవ్ సెన్సార్ డేటా',
      latest_farmer_advisory: 'తాజా రైతు సలహా',
      feeding_recommendation: 'దాణా సిఫార్సు',
      storage_recommendation: 'నిల్వ సిఫార్సు',
      risk_alert: 'ప్రమాద హెచ్చరిక',
      recommended_action: 'సిఫార్సు చేసిన చర్య',
      save_result_btn: 'ఫలితాన్ని సేవ్ చేయండి',
      saved_to_records: 'పరీక్ష మీ రైతు రికార్డులలో భద్రపరచబడింది.'
    },
    nav: {
      overview: 'అవలోకనం'
    }
  },
  kn: {
    home: {
      cta_explore: 'Feed Guard ಅನ್ವೇಷಿಸಿ',
      cta_login: 'ರೈತರ ಲಾಗಿನ್',
      no_account_notice: 'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಅನ್ವೇಷಿಸಲು ಖಾತೆಯ ಅಗತ್ಯವಿಲ್ಲ. ಪರೀಕ್ಷೆಗಳನ್ನು ಉಳಿಸಲು ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ಪ್ರವೇಶಿಸಲು ಲಾಗಿನ್ ಅಗತ್ಯವಿದೆ.'
    },
    auth: {
      explore_without_login: 'ಲಾಗಿನ್ ಇಲ್ಲದೆ ಅನ್ವೇಷಿಸಿ',
      login_tagline: 'ನಿಮ್ಮ ಮೇವಿನ ವಿಶ್ಲೇಷಣೆ, ಸೈಲೇಜ್ ಮೇಲ್ವಿಚಾರಣೆ, ವರದಿಗಳು ಮತ್ತು ರೈತರ ಸಲಹೆಗಳನ್ನು ಪ್ರವೇಶಿಸಿ.',
      welcome_login_headline: 'ಉತ್ತಮ ಹೈನುಗಾರಿಕೆಗಾಗಿ ಸ್ಮಾರ್ಟ್ ಪಶು ಆಹಾರ ನಿರ್ಧಾರಗಳು.',
      welcome_login_desc: 'ಹೈನುಗಾರಿಕೆಗಾಗಿ AI-ಚಾಲಿತ ಪಶು ಆಹಾರ ಗುಣಮಟ್ಟ ಪರೀಕ್ಷೆ, ಸೈಲೇಜ್ ಮೇಲ್ವಿಚಾರಣೆ, ರೈತ ಸಲಹೆ ಮತ್ತು ಆಫ್‌ಲೈನ್ ಕಾರ್ಯವಿಧಾನ.',
      trust_message: 'ನಿಮ್ಮ ರೈತ ದಾಖಲೆಗಳು ನಿಮ್ಮ ಖಾತೆಯೊಂದಿಗೆ ಸುರಕ್ಷಿತವಾಗಿ ಸಂಯೋಜಿಸಲ್ಪಟ್ಟಿವೆ.',
      feature_feed_title: 'AI ಮೇವಿನ ಪರೀಕ್ಷೆ',
      feature_feed_desc: 'ಮೇವಿನ ಗುಣಮಟ್ಟ ಮತ್ತು ಕಲಬೆರಕೆ ಅಪಾಯವನ್ನು ನಿರ್ಣಯಿಸಿ.',
      feature_silage_title: 'ಸೈಲೇಜ್ ಮೇಲ್ವಿಚಾರಣೆ',
      feature_silage_desc: 'ತಾಪಮಾನ, pH, ತೇವಾಂಶ ಮತ್ತು ಹಾಳಾಗುವಿಕೆಯ ಸೂಚಕಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ.',
      feature_advisory_title: 'ರೈತರ ಸಲಹೆ',
      feature_advisory_desc: 'ಸರಳ ಆಹಾರ ಮತ್ತು ಶೇಖರಣಾ ಶಿಫಾರಸುಗಳನ್ನು ಪಡೆಯಿರಿ.',
      feature_offline_title: 'ಆಫ್‌ಲೈನ್ ಸಿದ್ಧತೆ',
      feature_offline_desc: 'ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದಿದ್ದರೂ ಫಲಿತಾಂಶಗಳನ್ನು ಉಳಿಸಿ ಮತ್ತು ನಂತರ ಸಿಂಕ್ ಮಾಡಿ.',
      err_invalid_credentials: 'ಅಮಾನ್ಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್.',
      login_required: 'ಲಾಗಿನ್ ಅಗತ್ಯವಿದೆ',
      login_required_desc: 'ಈ ಫಲಿತಾಂಶವನ್ನು ಉಳಿಸಲು ಮತ್ತು ರೈತರ ದಾಖಲೆಗಳನ್ನು ಪಡೆಯಲು ಲಾಗಿನ್ ಅಗತ್ಯವಿದೆ.',
      continue_exploring: 'ಅನ್ವೇಷಣೆ ಮುಂದುವರಿಸಿ'
    },
    dashboard: {
      start_feed_test: 'ಮೊದಲ ಪಶು ಆಹಾರ ಪರೀಕ್ಷೆ ಪ್ರಾರಂಭಿಸಿ',
      no_feed_tests_yet: 'ಇನ್ನೂ ಯಾವುದೇ ಪಶು ಆಹಾರ ಪರೀಕ್ಷೆಗಳಿಲ್ಲ',
      no_feed_tests_desc: 'ಗುಣಮಟ್ಟದ ಫಲಿತಾಂಶಗಳು, ಅಪಾಯದ ಮೌಲ್ಯಮಾಪನ ಮತ್ತು ಆಹಾರ ಶಿಫಾರಸುಗಳನ್ನು ನೋಡಲು ನಿಮ್ಮ ಮೊದಲ ಪರೀಕ್ಷೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ.',
      greeting_morning: 'ಶುಭೋದಯ',
      greeting_afternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
      greeting_evening: 'ಶುಭ ಸಂಜೆ',
      silage_card_title: 'ಸೈಲೇಜ್ ಹುದುಗುವಿಕೆ ಮೇಲ್ವಿಚಾರಣೆ',
      simulated_sensor_data: 'ಅನುಕರಣೆಯ ಸಂವೇದಕ ಡೇಟಾ',
      live_sensor_data: 'ಲೈವ್ ಸಂವೇದಕ ಡೇಟಾ',
      latest_farmer_advisory: 'ಇತ್ತೀಚಿನ ರೈತ ಸಲಹೆ',
      feeding_recommendation: 'ಆಹಾರ ಶಿಫಾರಸು',
      storage_recommendation: 'ಶೇಖರಣಾ ಶಿಫಾರಸು',
      risk_alert: 'ಅಪಾಯದ ಎಚ್ಚರಿಕೆ',
      recommended_action: 'ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮ',
      save_result_btn: 'ಫಲಿತಾಂಶ ಉಳಿಸಿ',
      saved_to_records: 'ಪರೀಕ್ಷೆಯನ್ನು ನಿಮ್ಮ ರೈತ ದಾಖಲೆಗಳಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.'
    },
    nav: {
      overview: 'ಅವಲೋಕನ'
    }
  },
  ml: {
    home: {
      cta_explore: 'Feed Guard പര്യവേക്ഷണം ചെയ്യുക',
      cta_login: 'കർഷക ലോഗിൻ',
      no_account_notice: 'പ്ലാറ്റ്ഫോം പര്യവേക്ഷണം ചെയ്യാൻ അക്കൗണ്ട് ആവശ്യമില്ല. പരിശോധനകൾ സംരക്ഷിക്കുന്നതിനും രേഖകൾ പരിശോധിക്കുന്നതിനും ലോഗിൻ ആവശ്യമാണ്.'
    },
    auth: {
      explore_without_login: 'ലോഗിൻ ചെയ്യാതെ പര്യവേക്ഷണം ചെയ്യുക',
      login_tagline: 'തീറ്റ പരിശോധന, സൈലേജ് നിരീക്ഷണം, റിപ്പോർട്ടുകൾ, കർഷക ഉപദേശം എന്നിവ ലഭ്യമാക്കുക.',
      welcome_login_headline: 'ആരോഗ്യമുള്ള ക്ഷീരമേഖലയ്ക്കായി മികച്ച തീറ്റ തീരുമാനങ്ങൾ.',
      welcome_login_desc: 'ക്ഷീരമേഖലയ്ക്കായി AI-അധിഷ്ഠിത തീറ്റ ഗുണനിലവാര പരിശോധന, സൈലേജ് നിരീക്ഷണം, കർഷക ഉപദേശം, ഓഫ്‌ലൈൻ സൗകര്യം.',
      trust_message: 'നിങ്ങളുടെ കർഷക രേഖകൾ നിങ്ങളുടെ അക്കൗണ്ടുമായി സുരക്ഷിതമായി ബന്ധിപ്പിച്ചിരിക്കുന്നു.',
      feature_feed_title: 'AI തീറ്റ പരിശോധന',
      feature_feed_desc: 'തീറ്റയുടെ ഗുണനിലവാരവും മായം കലർപ്പും കണ്ടെത്തുക.',
      feature_silage_title: 'സൈലേജ് നിരീക്ഷണം',
      feature_silage_desc: 'താപനില, pH, ഈർപ്പം, കേടുപാടുകൾ എന്നിവ നിരീക്ഷിക്കുക.',
      feature_advisory_title: 'കർഷക ഉപദേശം',
      feature_advisory_desc: 'ലളിതമായ തീറ്റ, സംഭരണ നിർദ്ദേശങ്ങൾ നേടുക.',
      feature_offline_title: 'ഓഫ്‌ലൈൻ സൗകര്യം',
      feature_offline_desc: 'നെറ്റ്‌വർക്ക് ഇല്ലാത്തപ്പോഴും ഫലങ്ങൾ സൂക്ഷിക്കുക, പിന്നീട് സമന്വയിപ്പിക്കുക.',
      err_invalid_credentials: 'തെറ്റായ മൊബൈൽ നമ്പറോ പാസ്‌വേഡോ.',
      login_required: 'ലോഗിൻ ആവശ്യമാണ്',
      login_required_desc: 'ഈ ഫലം സംരക്ഷിക്കുന്നതിനും കർഷക രേഖകൾ ലഭ്യമാക്കുന്നതിനും ലോഗിൻ ആവശ്യമാണ്.',
      continue_exploring: 'പര്യവേക്ഷണം തുടരുക'
    },
    dashboard: {
      start_feed_test: 'ആദ്യ തീറ്റ പരിശോധന ആരംഭിക്കുക',
      no_feed_tests_yet: 'ഇതുവരെ തീറ്റ പരിശോധനകൾ ഒന്നും നടത്തിയിട്ടില്ല',
      no_feed_tests_desc: 'ഗുണനിലവാര ഫലങ്ങളും തീറ്റ നിർദ്ദേശങ്ങളും കാണാൻ നിങ്ങളുടെ ആദ്യ തീറ്റ പരിശോധന ആരംഭിക്കുക.',
      greeting_morning: 'സുപ്രഭാതം',
      greeting_afternoon: 'ശുഭ ഉച്ചതിരിഞ്ഞ്',
      greeting_evening: 'ശുഭ സായാഹ്നം',
      silage_card_title: 'സൈലേജ് അഴുകൽ നിരീക്ഷണം',
      simulated_sensor_data: 'സിമുലേറ്റഡ് സെൻസർ ഡാറ്റ',
      live_sensor_data: 'തത്സമയ സെൻസർ ഡാറ്റ',
      latest_farmer_advisory: 'ഏറ്റവും പുതിയ കർഷക ഉപദേശം',
      feeding_recommendation: 'തീറ്റ നിർദ്ദേശം',
      storage_recommendation: 'സംഭരണ നിർദ്ദേശം',
      risk_alert: 'അപകട മുന്നറിയിപ്പ്',
      recommended_action: 'ശുപാർശ ചെയ്യുന്ന നടപടി',
      save_result_btn: 'ഫലം സംരക്ഷിക്കുക',
      saved_to_records: 'പരിശോധന നിങ്ങളുടെ കർഷക രേഖകളിൽ സംരക്ഷിച്ചു.'
    },
    nav: {
      overview: 'അവലോകനം'
    }
  },
  bn: {
    home: {
      cta_explore: 'Feed Guard অন্বেষণ করুন',
      cta_login: 'কৃষক লগইন',
      no_account_notice: 'প্ল্যাটফর্ম অন্বেষণ করতে অ্যাকাউন্টের প্রয়োজন নেই। পরীক্ষা সংরক্ষণ ও রেকর্ড দেখতে লগইন প্রয়োজন।'
    },
    auth: {
      explore_without_login: 'লগইন ছাড়াই অন্বেষণ করুন',
      login_tagline: 'আপনার গোখাদ্য বিশ্লেষণ, সাইলেজ পর্যবেক্ষণ, রিপোর্ট ও কৃষক পরামর্শ পান।',
      welcome_login_headline: 'স্বাস্থ্যকর দুগ্ধ খামারের জন্য সঠিক খাদ্য সিদ্ধান্ত।',
      welcome_login_desc: 'দুগ্ধ খামারের জন্য এআই-চালিত গোখাদ্য গুণমান পরীক্ষা, সাইলেজ পর্যবেক্ষণ, কৃষক পরামর্শ ও অফলাইন সুবিধা।',
      trust_message: 'আপনার খামারের রেকর্ডগুলি আপনার অ্যাকাউন্টের সাথে সুরক্ষিতভাবে যুক্ত।',
      feature_feed_title: 'এআই খাদ্য পরীক্ষা',
      feature_feed_desc: 'খাদ্যের গুণমান ও ভেজাল ঝুঁকি মূল্যায়ন করুন।',
      feature_silage_title: 'সাইলেজ পর্যবেক্ষণ',
      feature_silage_desc: 'তাপমাত্রা, pH, আর্দ্রতা ও পচন সূচক পর্যবেক্ষণ করুন।',
      feature_advisory_title: 'কৃষক পরামর্শ',
      feature_advisory_desc: 'সহজ খাদ্য ও সংরক্ষণ সুপারিশ গ্রহণ করুন।',
      feature_offline_title: 'অফলাইন সুবিধা',
      feature_offline_desc: 'ইন্টারনেট না থাকলেও ফলাফল সংরক্ষণ করুন ও পরে সিঙ্ক করুন।',
      err_invalid_credentials: 'ভুল মোবাইল নম্বর বা পাসওয়ার্ড।',
      login_required: 'লগইন প্রয়োজন',
      login_required_desc: 'এই ফলাফল সংরক্ষণ ও কৃষকের রেকর্ড দেখতে লগইন প্রয়োজন।',
      continue_exploring: 'অন্বেষণ চালিয়ে যান'
    },
    dashboard: {
      start_feed_test: 'প্রথম খাদ্য পরীক্ষা শুরু করুন',
      no_feed_tests_yet: 'এখনও কোনো খাদ্য পরীক্ষা নেই',
      no_feed_tests_desc: 'গুণমান ফলাফল, ঝুঁকি মূল্যায়ন ও খাদ্য সুপারিশ দেখতে আপনার প্রথম খাদ্য পরীক্ষা শুরু করুন।',
      greeting_morning: 'সুপ্রভাত',
      greeting_afternoon: 'শুভ অপরাহ্ন',
      greeting_evening: 'শুভ সন্ধ্যা',
      silage_card_title: 'সাইলেজ গাঁজন পর্যবেক্ষণ',
      simulated_sensor_data: 'সিমুলেটেড সেন্সর ডেটা',
      live_sensor_data: 'লাইভ সেন্সর ডেটা',
      latest_farmer_advisory: 'সর্বশেষ কৃষক পরামর্শ',
      feeding_recommendation: 'খাদ্য সুপারিশ',
      storage_recommendation: 'সংরক্ষণ সুপারিশ',
      risk_alert: 'ঝুঁকি সতর্কতা',
      recommended_action: 'প্রস্তাবিত পদক্ষেপ',
      save_result_btn: 'ফলাফল সংরক্ষণ করুন',
      saved_to_records: 'পরীক্ষাটি আপনার কৃষক রেকর্ডে সংরক্ষিত হয়েছে।'
    },
    nav: {
      overview: 'সারসংক্ষেপ'
    }
  },
  gu: {
    home: {
      cta_explore: 'Feed Guard અન્વેષણ કરો',
      cta_login: 'ખેડૂત લોગિન',
      no_account_notice: 'પ્લેટફોર્મ અન્વેષણ કરવા માટે ખાતાની જરૂર નથી. પરીક્ષણો સાચવવા અને રેકોર્ડ જોવા માટે લોગિન જરૂરી છે.'
    },
    auth: {
      explore_without_login: 'લોગિન વગર અન્વેષણ કરો',
      login_tagline: 'તમારા પશુ આહાર વિશ્લેષણ, સાયલેજ મોનિટરિંગ, અહેવાલો અને ખેડૂત સલાહ મેળવો.',
      welcome_login_headline: 'તંદુરસ્ત ડેરી ફાર્મિંગ માટે સમજદારીભર્યા આહાર નિર્ણયો.',
      welcome_login_desc: 'ડેરી ફાર્મિંગ માટે AI-સંચાલિત આહાર ગુણવત્તા ચકાસણી, સાયલેજ મોનિટરિંગ, ખેડૂત સલાહ અને ઑફલાઇન પ્રક્રિયા.',
      trust_message: 'તમારા ખેડૂત રેકોર્ડ્સ તમારા ખાતા સાથે સુરક્ષિત રીતે જોડાયેલા છે.',
      feature_feed_title: 'AI આહાર તપાસ',
      feature_feed_desc: 'આહારની ગુણવત્તા અને ભેળસેળના જોખમનું મૂલ્યાંકન કરો.',
      feature_silage_title: 'સાયલેજ મોનિટરિંગ',
      feature_silage_desc: 'તાપમાન, pH, ભેજ અને બગાડના સૂચકાંકોનું નિરીક્ષણ કરો.',
      feature_advisory_title: 'ખેડૂત સલાહ',
      feature_advisory_desc: 'સરળ દૈનિક આહાર અને સંગ્રહ ભલામણો મેળવો.',
      feature_offline_title: 'ઑફલાઇન સક્ષમ',
      feature_offline_desc: 'ઇન્ટરનેટ ન હોય ત્યારે પણ પરિણામો સાચવો અને પછી સમન્વયિત કરો.',
      err_invalid_credentials: 'અમાન્ય મોબાઇલ નંબર અથવા પાસવર્ડ.',
      login_required: 'લોગિન જરૂરી છે',
      login_required_desc: 'આ પરિણામ સાચવવા અને ખેડૂત રેકોર્ડ જોવા માટે લોગિન જરૂરી છે.',
      continue_exploring: 'અન્વેષણ ચાલુ રાખો'
    },
    dashboard: {
      start_feed_test: 'પ્રથમ આહાર પરીક્ષણ શરૂ કરો',
      no_feed_tests_yet: 'હજી સુધી કોઈ આહાર પરીક્ષણો નથી',
      no_feed_tests_desc: 'ગુણવત્તા પરિણામો, જોખમ મૂલ્યાંકન અને આહાર ભલામણો જોવા માટે તમારું પ્રથમ પરીક્ષણ શરૂ કરો.',
      greeting_morning: 'સુપ્રભાત',
      greeting_afternoon: 'શુભ બપોર',
      greeting_evening: 'શુભ સાંજ',
      silage_card_title: 'સાયલેજ આથો મોનિટરિંગ',
      simulated_sensor_data: 'સિમ્યુલેટેડ સેન્સર ડેટા',
      live_sensor_data: 'લાઇવ સેન્સર ડેટા',
      latest_farmer_advisory: 'નવીનતમ ખેડૂત સલાહ',
      feeding_recommendation: 'આહાર ભલામણ',
      storage_recommendation: 'સંગ્રહ ભલામણ',
      risk_alert: 'જોખમ ચેતવણી',
      recommended_action: 'ભલામણ કરેલ પગલાં',
      save_result_btn: 'પરિણામ સાચવો',
      saved_to_records: 'પરીક્ષણ તમારા ખેડૂત રેકોર્ડમાં સાચવવામાં આવ્યું છે.'
    },
    nav: {
      overview: 'અવલોકન'
    }
  },
  pa: {
    home: {
      cta_explore: 'Feed Guard ਐਕਸਪਲੋਰ ਕਰੋ',
      cta_login: 'ਕਿਸਾਨ ਲੌਗਇਨ',
      no_account_notice: 'ਪਲੇਟਫਾਰਮ ਦੇਖਣ ਲਈ ਖਾਤੇ ਦੀ ਲੋੜ ਨਹੀਂ ਹੈ। ਟੈਸਟ ਸੰਭਾਲਣ ਅਤੇ ਰਿਕਾਰਡ ਦੇਖਣ ਲਈ ਲੌਗਇਨ ਲਾਜ਼ਮੀ ਹੈ।'
    },
    auth: {
      explore_without_login: 'ਬਿਨਾਂ ਲੌਗਇਨ ਐਕਸਪਲੋਰ ਕਰੋ',
      login_tagline: 'ਆਪਣੀ ਫੀਡ ਵਿਸ਼ਲੇਸ਼ਣ, ਸਾਈਲੇਜ ਨਿਗਰਾਨੀ, ਰਿਪੋਰਟਾਂ ਅਤੇ ਕਿਸਾਨ ਸਲਾਹ ਪ੍ਰਾਪਤ ਕਰੋ।',
      welcome_login_headline: 'ਸਿਹਤਮੰਦ ਡੇਅਰੀ ਫਾਰਮਿੰਗ ਲਈ ਸੂਝਵਾਨ ਖੁਰਾਕ ਫੈਸਲੇ।',
      welcome_login_desc: 'ਡੇਅਰੀ ਫਾਰਮਿੰਗ ਲਈ AI-ਅਧਾਰਿਤ ਫੀਡ ਗੁਣਵੱਤਾ ਜਾਂਚ, ਸਾਈਲੇਜ ਨਿਗਰਾਨੀ, ਕਿਸਾਨ ਸਲਾਹ ਅਤੇ ਆਫਲਾਈਨ ਪ੍ਰਣਾਲੀ।',
      trust_message: 'ਤੁਹਾਡੇ ਕਿਸਾਨ ਰਿਕਾਰਡ ਤੁਹਾਡੇ ਖਾਤੇ ਨਾਲ ਸੁਰੱਖਿਅਤ ਢੰਗ ਨਾਲ ਜੁੜੇ ਹੋਏ ਹਨ।',
      feature_feed_title: 'AI ਫੀਡ ਜਾਂਚ',
      feature_feed_desc: 'ਫੀਡ ਗੁਣਵੱਤਾ ਅਤੇ ਮਿਲਾਵਟ ਦੇ ਖਤਰੇ ਦਾ ਮੁਲਾਂਕਣ ਕਰੋ।',
      feature_silage_title: 'ਸਾਈਲੇਜ ਨਿਗਰਾਨੀ',
      feature_silage_desc: 'ਤਾਪਮਾਨ, pH, ਨਮੀ ਅਤੇ ਖਰਾਬੀ ਸੂਚਕਾਂ ਦੀ ਨਿਗਰਾਨੀ ਕਰੋ।',
      feature_advisory_title: 'ਕਿਸਾਨ ਸਲਾਹ',
      feature_advisory_desc: 'ਸਧਾਰਨ ਖੁਰਾਕ ਅਤੇ ਸਟੋਰੇਜ ਸਿਫ਼ਾਰਸ਼ਾਂ ਪ੍ਰਾਪਤ ਕਰੋ।',
      feature_offline_title: 'ਆਫਲਾਈਨ ਤਿਆਰ',
      feature_offline_desc: 'ਇੰਟਰਨੈਟ ਤੋਂ ਬਿਨਾਂ ਵੀ ਨਤੀਜੇ ਸੁਰੱਖਿਅਤ ਕਰੋ ਅਤੇ ਬਾਅਦ ਵਿੱਚ ਸਿੰਕ ਕਰੋ।',
      err_invalid_credentials: 'ਗਲਤ ਮੋਬਾਈਲ ਨੰਬਰ ਜਾਂ ਪਾਸਵਰਡ।',
      login_required: 'ਲੌਗਇਨ ਲੋੜੀਂਦਾ ਹੈ',
      login_required_desc: 'ਇਹ ਨਤੀਜਾ ਸੰਭਾਲਣ ਅਤੇ ਕਿਸਾਨ ਰਿਕਾਰਡ ਦੇਖਣ ਲਈ ਲੌਗਇਨ ਜ਼ਰੂਰੀ ਹੈ।',
      continue_exploring: 'ਐਕਸਪਲੋਰ ਜਾਰੀ ਰੱਖੋ'
    },
    dashboard: {
      start_feed_test: 'ਪਹਿਲਾ ਫੀਡ ਟੈਸਟ ਸ਼ੁਰੂ ਕਰੋ',
      no_feed_tests_yet: 'ਅਜੇ ਤੱਕ ਕੋਈ ਫੀਡ ਟੈਸਟ ਨਹੀਂ',
      no_feed_tests_desc: 'ਗੁਣਵੱਤਾ ਦੇ ਨਤੀਜੇ, ਜੋਖਮ ਮੁਲਾਂਕਣ ਅਤੇ ਖੁਰਾਕ ਸਿਫ਼ਾਰਸ਼ਾਂ ਦੇਖਣ ਲਈ ਆਪਣਾ ਪਹਿਲਾ ਟੈਸਟ ਸ਼ੁਰੂ ਕਰੋ।',
      greeting_morning: 'ਸ਼ੁਭ ਸਵੇਰ',
      greeting_afternoon: 'ਸ਼ੁਭ ਦੁਪਹਿਰ',
      greeting_evening: 'ਸ਼ੁਭ ਸ਼ਾਮ',
      silage_card_title: 'ਸਾਈਲੇਜ ਫਰਮੈਂਟੇਸ਼ਨ ਨਿਗਰਾਨੀ',
      simulated_sensor_data: 'ਸਿਮੂਲੇਟਿਡ ਸੈਂਸਰ ਡਾਟਾ',
      live_sensor_data: 'ਲਾਈਵ ਸੈਂਸਰ ਡਾਟਾ',
      latest_farmer_advisory: 'ਤਾਜ਼ਾ ਕਿਸਾਨ ਸਲਾਹ',
      feeding_recommendation: 'ਖੁਰਾਕ ਸਿਫ਼ਾਰਸ਼',
      storage_recommendation: 'ਸਟੋਰੇਜ ਸਿਫ਼ਾਰਸ਼',
      risk_alert: 'ਖ਼ਤਰਾ ਚੇਤਾਵਨੀ',
      recommended_action: 'ਸਿਫ਼ਾਰਸ਼ ਕੀਤੀ ਕਾਰਵਾਈ',
      save_result_btn: 'ਨਤੀਜਾ ਸੰਭਾਲੋ',
      saved_to_records: 'ਟੈਸਟ ਤੁਹਾਡੇ ਕਿਸਾਨ ਰਿਕਾਰਡ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਕੀਤਾ ਗਿਆ ਹੈ।'
    },
    nav: {
      overview: 'ਸੰਖੇਪ'
    }
  },
  or: {
    home: {
      cta_explore: 'Feed Guard ଅନ୍ୱେଷଣ କରନ୍ତୁ',
      cta_login: 'କୃଷକ ଲଗଇନ୍',
      no_account_notice: 'ପ୍ଲାଟଫର୍ମ ଅନୁସନ୍ଧାନ ପାଇଁ ଖାତା ଆବଶ୍ୟକ ନାହିଁ। ପରୀକ୍ଷା ସଂରକ୍ଷଣ ଓ ରେକର୍ଡ ଦେଖିବା ପାଇଁ ଲଗଇନ୍ ଆବଶ୍ୟକ।'
    },
    auth: {
      explore_without_login: 'ଲଗଇନ୍ ବିନା ଅନ୍ୱେଷଣ କରନ୍ତୁ',
      login_tagline: 'ଆପଣଙ୍କ ଦାନା ବିଶ୍ଳେଷଣ, ସାଇଲେଜ୍ ନିରୀକ୍ଷଣ, ରିପୋର୍ଟ ଏବଂ କୃଷକ ପରାମର୍ଶ ପାଆନ୍ତୁ।',
      welcome_login_headline: 'ସୁସ୍ଥ ଦୁଗ୍ଧ ଫାର୍ମିଂ ପାଇଁ ଉନ୍ନତ ଦାନା ନିଷ୍ପତ୍ତି।',
      welcome_login_desc: 'ଦୁଗ୍ଧ ଫାର୍ମିଂ ପାଇଁ AI-ଆଧାରିତ ଦାନା ଗୁଣବତ୍ତା ପରୀକ୍ଷା, ସାଇଲେଜ୍ ନିରୀକ୍ଷଣ, କୃଷକ ପରାମର୍ଶ ଏବଂ ଅଫଲାଇନ୍ ସୁବିଧା।',
      trust_message: 'ଆପଣଙ୍କ କୃଷକ ରେକର୍ଡଗୁଡ଼ିକ ଆପଣଙ୍କ ଖାତା ସହିତ ସୁରକ୍ଷିତ ଭାବେ ସଂଯୁକ୍ତ।',
      feature_feed_title: 'AI ଦାନା ପରୀକ୍ଷା',
      feature_feed_desc: 'ଦାନାର ଗୁଣବତ୍ତା ଏବଂ ଭେଜାଲ୍ ବିପଦ ଆକଳନ କରନ୍ତୁ।',
      feature_silage_title: 'ସାଇଲେଜ୍ ନିରୀକ୍ଷଣ',
      feature_silage_desc: 'ତାପମାତ୍ରା, pH, ଆର୍ଦ୍ରତା ଓ ନଷ୍ଟ ସୂଚକ ନିରୀକ୍ଷଣ କରନ୍ତୁ।',
      feature_advisory_title: 'କୃଷକ ପରାମର୍ଶ',
      feature_advisory_desc: 'ସରଳ ଖାଦ୍ୟ ଏବଂ ସଂରକ୍ଷଣ ପରାମର୍ଶ ପାଆନ୍ତୁ।',
      feature_offline_title: 'ଅଫଲାଇନ୍ ସୁବିଧା',
      feature_offline_desc: 'ଇଣ୍ଟରନେଟ୍ ନଥିବା ସମୟରେ ମଧ୍ୟ ଫଳାଫଳ ସୁରକ୍ଷିତ ରଖନ୍ତୁ ଓ ପରେ ସିଙ୍କ କରନ୍ତୁ।',
      err_invalid_credentials: 'ଅବୈଧ ମୋବାଇଲ୍ ନମ୍ବର କିମ୍ବା ପାସୱାର୍ଡ।',
      login_required: 'ଲଗଇନ୍ ଆବଶ୍ୟକ',
      login_required_desc: 'ଏହି ଫଳାଫଳ ସଂରକ୍ଷଣ ଏବଂ କୃଷକ ରେକର୍ଡ ଦେଖିବା ପାଇଁ ଲଗଇନ୍ ଆବଶ୍ୟକ।',
      continue_exploring: 'ଅନ୍ୱେଷଣ ଜାରି ରଖନ୍ତୁ'
    },
    dashboard: {
      start_feed_test: 'ପ୍ରଥମ ଦାନା ପରୀକ୍ଷା ଆରମ୍ଭ କରନ୍ତୁ',
      no_feed_tests_yet: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ଦାନା ପରୀକ୍ଷା ହୋଇନାହିଁ',
      no_feed_tests_desc: 'ଗୁଣବତ୍ତା ଫଳାଫଳ, ବିପଦ ଆକଳନ ଏବଂ ଖାଦ୍ୟ ପରାମର୍ଶ ଦେଖିବା ପାଇଁ ଆପଣଙ୍କର ପ୍ରଥମ ପରୀକ୍ଷା ଆରମ୍ଭ କରନ୍ତୁ।',
      greeting_morning: 'ଶୁଭ ସକାଳ',
      greeting_afternoon: 'ଶୁଭ ଅପରାହ୍ନ',
      greeting_evening: 'ଶୁଭ ସନ୍ଧ୍ୟା',
      silage_card_title: 'ସାଇଲେଜ୍ କିଣ୍ଵନ ନିରୀକ୍ଷଣ',
      simulated_sensor_data: 'ସିମୁଲେଟେଡ୍ ସେନ୍ସର୍ ଡାଟା',
      live_sensor_data: 'ଲାଇଭ୍ ସେନ୍ସର୍ ଡାଟା',
      latest_farmer_advisory: 'ସର୍ବଶେଷ କୃଷକ ପରାମର୍ଶ',
      feeding_recommendation: 'ଖାଦ୍ୟ ପରାମର୍ଶ',
      storage_recommendation: 'ସଂରକ୍ଷଣ ପରାମର୍ଶ',
      risk_alert: 'ବିପଦ ସତର୍କତା',
      recommended_action: 'ପରାମର୍ଶିତ ପଦକ୍ଷେପ',
      save_result_btn: 'ଫଳାଫଳ ସଞ୍ଚୟ କରନ୍ତୁ',
      saved_to_records: 'ପରୀକ୍ଷା ଆପଣଙ୍କ କୃଷକ ରେକର୍ଡରେ ସଂରକ୍ଷିତ ହୋଇଛି।'
    },
    nav: {
      overview: 'ସମୀକ୍ଷା'
    }
  },
  as: {
    home: {
      cta_explore: 'Feed Guard অন্বেষণ কৰক',
      cta_login: 'কৃষক লগইন',
      no_account_notice: 'প্লেটফৰ্ম অন্বেষণ কৰিবলৈ একাউণ্টৰ প্ৰয়োজন নাই। পৰীক্ষা সংৰক্ষণ আৰু ৰেকৰ্ড চাবলৈ লগইন প্ৰয়োজন।'
    },
    auth: {
      explore_without_login: 'লগইন নকৰাকৈ অন্বেষণ কৰক',
      login_tagline: 'আপোনাৰ গো-খাদ্য বিশ্লেষণ, চাইলেজ নিৰীক্ষণ, প্ৰতিবেদন আৰু কৃষক পৰামৰ্শ লাভ কৰক।',
      welcome_login_headline: 'স্বাস্থ্যকৰ দুগ্ধ ফাৰ্মিং বাবে সঠিক খাদ্য সিদ্ধান্ত।',
      welcome_login_desc: 'দুগ্ধ ফাৰ্মিং বাবে AI-চালিত খাদ্য গুণমান পৰীক্ষা, চাইলেজ নিৰীক্ষণ, কৃষক পৰামৰ্শ আৰু অফলাইন সুবিধা।',
      trust_message: 'আপোনাৰ কৃষক ৰেকৰ্ডসমূহ আপোনাৰ একাউণ্টৰ সৈতে সুৰক্ষিতভাৱে সংলগ্ন।',
      feature_feed_title: 'AI খাদ্য পৰীক্ষা',
      feature_feed_desc: 'খাদ্যৰ গুণমান আৰু ভেজালৰ আশংকা মূল্যায়ন কৰক।',
      feature_silage_title: 'চাইলেজ নিৰীক্ষণ',
      feature_silage_desc: 'উষ্ণতা, pH, আৰ্দ্ৰতা আৰু পচন সূচক নিৰীক্ষণ কৰক।',
      feature_advisory_title: 'কৃষক পৰামৰ্শ',
      feature_advisory_desc: 'সহজ খাদ্য আৰু সংৰক্ষণ পৰামৰ্শ লাভ কৰক।',
      feature_offline_title: 'অফলাইন সুবিধা',
      feature_offline_desc: 'ইণ্টাৰনেট নাথাকিলেও ফলাফল সংৰক্ষণ কৰক আৰু পিছত সংযোগ কৰক।',
      err_invalid_credentials: 'ভুল মোবাইল নম্বৰ বা পাছৱৰ্ড।',
      login_required: 'লগইন প্ৰয়োজন',
      login_required_desc: 'এই ফলাফল সংৰক্ষণ আৰু কৃষক ৰেকৰ্ড চাবলৈ লগইন প্ৰয়োজন।',
      continue_exploring: 'অন্বেষণ অব্যাহত ৰাখক'
    },
    dashboard: {
      start_feed_test: 'প্ৰথম খাদ্য পৰীক্ষা আৰম্ভ কৰক',
      no_feed_tests_yet: 'এতিয়ালৈকে কোনো খাদ্য পৰীক্ষা নাই',
      no_feed_tests_desc: 'গুণমান ফলাফল, আশংকা মূল্যায়ন আৰু খাদ্য পৰামৰ্শ চাবলৈ আপোনাৰ প্ৰথম পৰীক্ষা আৰম্ভ কৰক।',
      greeting_morning: 'শুভ প্ৰভাত',
      greeting_afternoon: 'শুভ অপৰাহ্ন',
      greeting_evening: 'শুভ সন্ধিয়া',
      silage_card_title: 'চাইলেজ কিণ্বন নিৰীক্ষণ',
      simulated_sensor_data: 'চিমুলেটেড চেন্সৰ ডাটা',
      live_sensor_data: 'লাইভ চেন্সৰ ডাটা',
      latest_farmer_advisory: 'শেহতীয়া কৃষক পৰামৰ্শ',
      feeding_recommendation: 'খাদ্য পৰামৰ্শ',
      storage_recommendation: 'সংৰক্ষণ পৰামৰ্শ',
      risk_alert: 'বিপদ সতৰ্কবাণী',
      recommended_action: 'পৰামৰ্শিত পদক্ষেপ',
      save_result_btn: 'ফলাফল সংৰক্ষণ কৰক',
      saved_to_records: 'পৰীক্ষা আপোনাৰ কৃষক ৰেকৰ্ডত সংৰক্ষিত কৰা হৈছে।'
    },
    nav: {
      overview: 'অৱলোকন'
    }
  },
  ur: {
    home: {
      cta_explore: 'Feed Guard دریافت کریں',
      cta_login: 'کسਾਨ لاگ ان',
      no_account_notice: 'پلیٹ فارم دیکھنے کے لیے اکاؤنٹ کی ضرورت نہیں ہے۔ ٹیسٹ محفوظ کرنے اور کسان ریکارڈ دیکھنے کے لیے لاگ ان ضروری ہے۔'
    },
    auth: {
      explore_without_login: 'لاگ ان کے بغیر دریافت کریں',
      login_tagline: 'اپنا فیڈ تجزیہ، سائلیج مانیٹرنگ، رپورٹس اور کسان ایڈوائزری حاصل کریں۔',
      welcome_login_headline: 'صحت مند ڈیری فارمنگ کے لیے دانشمندانہ فیڈ فیصلے',
      welcome_login_desc: 'ڈیری فارمنگ کے لیے AI کی مدد سے فیڈ کوالٹی اسکریننگ، سائلیج مانیٹرنگ، کسان ایڈوائزری اور آف لائن ورک فلو۔',
      trust_message: 'آپ کے کسان ریکارڈ آپ کے اکاؤنٹ کے ساتھ محفوظ طریقے سے منسلک ہیں۔',
      feature_feed_title: 'AI فیڈ اسکریننگ',
      feature_feed_desc: 'خوراک کے معیار اور ملاوٹ کے خطرے کا اندازہ لگائیں۔',
      feature_silage_title: 'سائلیج مانیٹرنگ',
      feature_silage_desc: 'درجہ حرارت، pH، نمی اور خرابی کے اشارے مانیٹر کریں۔',
      feature_advisory_title: 'کسان ایڈوائزری',
      feature_advisory_desc: 'آسان خوراک اور اسٹوریج سفارشات حاصل کریں۔',
      feature_offline_title: 'آف لائن تیار',
      feature_offline_desc: 'انٹرنیٹ نہ ہونے پر بھی نتائج محفوظ کریں اور بعد میں سنک کریں۔',
      err_invalid_credentials: 'غلط موبائل نمبر یا پاس ورڈ۔',
      login_required: 'لاگ ان ضروری ہے',
      login_required_desc: 'اس نتیجے کو محفوظ کرنے اور کسان کے ریکارڈ دیکھنے کے لیے لاگ ان ضروری ہے۔',
      continue_exploring: 'دریافت جاری رکھیں'
    },
    dashboard: {
      start_feed_test: 'پہلا فیڈ ٹیسٹ شروع کریں',
      no_feed_tests_yet: 'ابھی تک کوئی فیڈ ٹیسٹ نہیں',
      no_feed_tests_desc: 'معیار کے نتائج، خطرے کی تشخیص اور فیڈنگ سفارشات دیکھنے کے لیے اپنا پہلا ٹیسਟ شروع کریں۔',
      greeting_morning: 'صبح بخیر',
      greeting_afternoon: 'دوپہر بخیر',
      greeting_evening: 'شام بخیر',
      silage_card_title: 'سائلیج فرمینٹیشن مانیٹر',
      simulated_sensor_data: 'نقلی سینسر ڈیٹا',
      live_sensor_data: 'لائیو سینسر ڈیٹا',
      latest_farmer_advisory: 'تازہ ترین کسان ایڈوائزری',
      feeding_recommendation: 'خوراک کی سفارش',
      storage_recommendation: 'اسٹوریج کی سفارش',
      risk_alert: 'خطرہ الرٹ',
      recommended_action: 'تجویز کردہ کارروائی',
      save_result_btn: 'نتیجہ محفوظ کریں',
      saved_to_records: 'ٹیسٹ آپ کے کسان ریکارڈ میں محفوظ کر لیا گیا ہے۔'
    },
    nav: {
      overview: 'جائزہ'
    }
  }
};

locales.forEach(loc => {
  const filePath = path.join(__dirname, '..', 'src', 'locales', `${loc}.js`);
  const mod = require(filePath).default;

  const additions = dicts[loc];
  Object.keys(additions).forEach(sectionKey => {
    if (!mod[sectionKey]) {
      mod[sectionKey] = {};
    }
    Object.assign(mod[sectionKey], additions[sectionKey]);
  });

  const newContent = `export default ${JSON.stringify(mod, null, 2)};\n`;
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Updated journey keys in ${loc}.js`);
});
