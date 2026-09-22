import { useTranslation } from 'react-i18next';
import {
  BookOpen, Droplets, Thermometer, Wheat, AlertTriangle,
  Beaker, ShieldCheck, Apple, Scale, Pill, Warehouse, HeartHandshake
} from 'lucide-react';

const ADVISORY_DATA = {
  en: {
    nutrition: [
      { param: 'Crude Protein (CP)', ideal: '14–22%', importance: 'Directly impacts daily milk yield and muscle maintenance. Deficit reduces milk production by up to 35%.' },
      { param: 'Moisture Content', ideal: '8–12% (Pellets) / 60–68% (Silage)', importance: 'Moisture above 14% in dry feed promotes rapid fungal aflatoxins. In silage, moisture <55% prevents proper compaction.' },
      { param: 'Crude Fiber (NDF/ADF)', ideal: '8–14% (Feed) / 22–32% (Silage)', importance: 'Essential for rumen cud-chewing and milk fat percentage. Low fiber causes rumen acidosis.' },
      { param: 'Metabolizable Energy (ME)', ideal: '2.5–3.2 Mcal/kg', importance: 'Main fuel for milk synthesis. Energy-deficient cows lose body condition and fail to conceive.' },
      { param: 'Mineral Balance (Ca:P)', ideal: 'Ratio 1.8:1 to 2.2:1', importance: 'Prevents post-calving milk fever, downer cow syndrome, and retained placenta.' },
      { param: 'Aflatoxin B1 Safe Limit', ideal: '<10 ppb (Safe for dairy milk)', importance: 'Deadly fungal carcinogen. Transfers directly into cow milk (Aflatoxin M1), making it unsafe for humans.' },
    ],
    feeding: [
      { animal: 'Lactating Cow (15L milk/day)', concentrate: '6.0 kg', roughage: '20–25 kg green + 4 kg dry', mineral: '75–100 g' },
      { animal: 'Lactating Cow (10L milk/day)', concentrate: '4.5 kg', roughage: '18–20 kg green + 3 kg dry', mineral: '60–75 g' },
      { animal: 'Dry Pregnant Cow', concentrate: '1.5–2.0 kg', roughage: '15 kg green + 5 kg dry', mineral: '50 g' },
      { animal: 'Growing Heifer (200 kg)', concentrate: '2.0 kg', roughage: '10–12 kg green + 2 kg dry', mineral: '40 g' },
      { animal: 'Young Calf (3–6 months)', concentrate: '1.0 kg (Calf Starter)', roughage: '4–5 kg tender green grass', mineral: '20 g' },
      { animal: 'Breeding Bull', concentrate: '2.5–3.0 kg', roughage: '20 kg green fodder', mineral: '60 g' },
    ],
    storage: [
      { title: 'Temperature & Sunlight', tips: ['Store bagged feed in a cool, ventilated shed below 28°C.', 'Never stack feed bags directly against outer tin walls exposed to scorching sunlight.'] },
      { title: 'Moisture & Pallet Elevation', tips: ['Always keep feed bags elevated on wooden or plastic pallets at least 15 cm off damp floors.', 'Maintain store relative humidity below 65% to prevent mould colonies.'] },
      { title: 'FIFO Stock Rotation', tips: ['Follow First In, First Out (FIFO): always feed older batches before opening new deliveries.', 'Never mix new feed with sweeping residues from the shed floor.'] },
      { title: 'Silage Pit Best Practices', tips: ['Pack and roll silage in 15 cm layers to eliminate oxygen pockets.', 'Achieve pH 3.8–4.2 within 48–72 hours to prevent clostridial rotting.'] },
    ],
    contamination: [
      { type: 'Urea Adulteration', risk: 'Critical Danger', signs: ['Pungent ammonia odour', 'White crystalline powder on bag seams', 'Unusually high synthetic nitrogen readings'], action: 'Halt feeding immediately! Urea toxicity causes muscle tremors and death in cattle within 2 hours.' },
      { type: 'Sand / Acid Insoluble Ash', risk: 'High Hazard', signs: ['Gritty sediment settling at bottom of water cup test', 'Unusually heavy bag weight'], action: 'Reject batch from vendor. Causes tooth abrasion, severe stomach impaction, and rumen injury.' },
      { type: 'Mould & Fungal Contamination', risk: 'Severe Toxicity', signs: ['Green, grey or black fuzzy spots', 'Musty damp cellar smell', 'Caked feed clumps inside sacks'], action: 'Do not feed to animals. High risk of aflatoxin poisoning, abortion in pregnant cows, and milk contamination.' },
      { type: 'Mineral Imbalance', risk: 'Chronic Deficit', signs: ['Cattle licking soil/walls (Pica disease)', 'Dull rough coat', 'Drop in butterfat %'], action: 'Switch to certified mineral mixture (Chelated). Consult local veterinary officer.' },
    ],
  },
  hi: {
    nutrition: [
      { param: 'कच्चा प्रोटीन (Crude Protein)', ideal: '14–22%', importance: 'दूध उत्पादन और मांसपेशियों के लिए अत्यंत आवश्यक। प्रोटीन की कमी से दूध में 35% तक भारी गिरावट आती है।' },
      { param: 'नमी की मात्रा (Moisture)', ideal: '8–12% (दाना) / 60–68% (साइलेज)', importance: 'सूखे दाने में 14% से अधिक नमी होने पर फफूंद और जहरीला एफ्लाटॉक्सिन पनपता है। साइलेज में 60% से कम नमी से सड़न होती है।' },
      { param: 'कच्चा रेशा (Crude Fiber)', ideal: '8–14% (आहार) / 22–32% (साइलेज)', importance: 'पशु के जुगाली करने और दूध में फैट (चिकनाई) प्रतिशत बढ़ाने के लिए अनिवार्य। कम फाइबर से पेट में अम्लता बनती है।' },
      { param: 'ऊर्जा (ME)', ideal: '2.5–3.2 Mcal/kg', importance: 'दूध बनाने का मुख्य ईंधन। ऊर्जा की कमी से गाय-भैंस कमजोर हो जाती हैं और समय पर गाभिन नहीं ठहरतीं।' },
      { param: 'खनिज संतुलन (कैल्शियम : फास्फोरस)', ideal: 'अनुपात 1.8:1 से 2.2:1', importance: 'ब्याने के बाद दुग्ध ज्वर (मिल्क फीवर), कमजोरी और जेर न गिरने की समस्या से बचाव करता है।' },
      { param: 'एफ्लाटॉक्सिन B1 सुरक्षित सीमा', ideal: '<10 ppb (डेयरी हेतु सुरक्षित)', importance: 'घातक फफूंद जनित विषैला तत्व। यह दूध में मिलकर मनुष्यों (विशेषकर बच्चों) के स्वास्थ्य को गंभीर नुकसान पहुंचाता है।' },
    ],
    feeding: [
      { animal: 'दुधारू गाय (15 लीटर दूध/दिन)', concentrate: '6.0 किग्रा संतुलित दाना', roughage: '20–25 किग्रा हरा + 4 किग्रा सूखा चारा', mineral: '75–100 ग्राम' },
      { animal: 'दुधारू गाय (10 लीटर दूध/दिन)', concentrate: '4.5 किग्रा संतुलित दाना', roughage: '18–20 किग्रा हरा + 3 किग्रा सूखा चारा', mineral: '60–75 ग्राम' },
      { animal: 'सूखी गाभिन गाय', concentrate: '1.5–2.0 किग्रा दाना', roughage: '15 किग्रा हरा + 5 किग्रा सूखा चारा', mineral: '50 ग्राम' },
      { animal: 'बढ़ती हुई बछिया (200 किग्रा)', concentrate: '2.0 किग्रा दाना', roughage: '10–12 किग्रा हरा + 2 किग्रा सूखा चारा', mineral: '40 ग्राम' },
      { animal: 'छोटा बछड़ा (3–6 माह)', concentrate: '1.0 किग्रा (काफ स्टार्टर)', roughage: '4–5 किग्रा कोमल हरा घास', mineral: '20 ग्राम' },
      { animal: 'प्रजनन योग्य सांड', concentrate: '2.5–3.0 किग्रा दाना', roughage: '20 किग्रा हरा चारा', mineral: '60 ग्राम' },
    ],
    storage: [
      { title: 'तापमान व धूप से बचाव', tips: ['आहार को 28°C से नीचे ठंडी व हवादार कोठरी में रखें।', 'चारे की बोरियों को सीधी धूप वाली टिन की दीवार से सटाकर कभी न रखें।'] },
      { title: 'नमी व चबूतरा (पैलेट)', tips: ['बोरियों को हमेशा लकड़ी या प्लास्टिक के तख्तों (पैलेट) पर जमीन से कम से कम 15 सेमी ऊपर रखें।', 'गोदाम में नमी 65% से कम रखें ताकि फफूंद न लगे।'] },
      { title: 'पहले आया - पहले खिलाएं (FIFO)', tips: ['पुरानी बोरी पहले उपयोग करें, नई बोरियां बाद में खोलें।', 'गोदाम के फर्श पर झाडू लगाकर बिखरा हुआ गंदा चारा जानवरों को न डालें।'] },
      { title: 'साइलेज गड्ढे के नियम', tips: ['साइलेज बनाते समय 15 सेमी की परतों में ट्रैक्टर से अच्छी तरह दबाएं ताकि हवा बाहर निकल जाए।', '48–72 घंटों में pH 3.8–4.2 तक पहुंचना अनिवार्य है।'] },
    ],
    contamination: [
      { type: 'यूरिया की मिलावट', risk: 'अत्यधिक जानलेवा खतरा', signs: ['तीखी अमोनिया (मूत्र जैसी) गंध', 'बोरी की सिलाई पर सफेद बारीक चूर्ण', 'अस्वाभाविक रूप से अधिक प्रोटीन रीडिंग'], action: 'तुरंत खिलाना बंद करें! यूरिया विषाक्तता से पशु 2 घंटे के भीतर कांपने लगता है और उसकी मृत्यु हो सकती है।' },
      { type: 'रेत एवं सिलिका की मिलावट', risk: 'भारी नुकसान', signs: ['हाथ से रगड़ने पर कंकड़/किरकिराहट महसूस होना', 'पानी के गिलास में घोलने पर नीचे भारी गाद जमना'], action: 'विक्रेता को पूरा बैच वापस लौटाएं। यह पशु के दांत घिस देता है और पेट में पथरी व घाव कर देता है।' },
      { type: 'फफूंद व बुरशी (Mould)', risk: 'विषैला संक्रमण', signs: ['हरे, काले या सफेद जाले', 'सड़े हुए तहखाने जैसी दुर्गंध', 'बोरी के अंदर दाने के ढेले जम जाना'], action: 'पशुओं को कदापि न खिलाएं। इससे गाभिन पशुओं का गर्भपात हो जाता है और दूध जहरीला हो जाता है।' },
      { type: 'खनिज तत्वों की कमी', risk: 'दीर्घकालिक बीमारी', signs: ['पशुओं का मिट्टी, दीवार या पेशाब चाटना (पाइका रोग)', 'खुरदुरी त्वचा और बालों का झड़ना'], action: 'प्रमाणित मिनरल मिक्सचर खिलाना शुरू करें। नजदीकी पशु चिकित्सक से परामर्श लें।' },
    ],
  },
  mr: {
    nutrition: [
      { param: 'कच्चे प्रथिने (Crude Protein)', ideal: '14–22%', importance: 'दूध उत्पादन आणि स्नायूंच्या वाढीसाठी आवश्यक. प्रथिनांच्या कमतरतेमुळे दुधात ३५% पर्यंत घट होते.' },
      { param: 'ओलावा प्रमाण (Moisture)', ideal: '8–12% (पेंड) / 60–68% (सायलेज)', importance: 'सुक्या खाद्यात १४% पेक्षा जास्त ओलावा असल्यास विषारी बुरशी (अॅफ्लाटॉक्सिन) वाढते. सायलेजमध्ये ६०% पेक्षा कमी ओलावा नासाडी करतो.' },
      { param: 'कच्चे तंतू (Crude Fiber)', ideal: '8–14% (खाद्य) / 22–32% (सायलेज)', importance: 'जनावरांच्या रवंथासाठी आणि दुधातील फॅट वाढवण्यासाठी आवश्यक. कमी फायबरमुळे पोटातील आम्लता वाढते.' },
      { param: 'ऊर्जा (ME)', ideal: '2.5–3.2 Mcal/kg', importance: 'दूध निर्मितीचे मुख्य इंधन. ऊर्जेअभावी जनावरे अशक्त होतात आणि वेळेवर गाभण राहत नाहीत.' },
      { param: 'खनिज संतुलन (कॅल्शियम : फॉस्फरस)', ideal: 'प्रमाण 1.8:1 ते 2.2:1', importance: 'विण्यानंतरचा दुग्धज्वर (मिल्क फिव्हर) आणि जार न पडण्याच्या समस्येपासून रक्षण करते.' },
      { param: 'अॅफ्लाटॉक्सिन B1 सुरक्षित मर्यादा', ideal: '<10 ppb (डेअरी दुधासाठी सुरक्षित)', importance: 'घातक विषारी बुरशी. ही थेट दुधात उतरते आणि माणसांच्या आरोग्यास गंभीर हानी पोहोचवते.' },
    ],
    feeding: [
      { animal: 'दुभती गाय (१५ लिटर दूध/दिवस)', concentrate: '६.० किलो संतुलित पशुखाद्य', roughage: '२०–२५ किलो हिरवा + ४ किलो सुका चारा', mineral: '७५–१०० ग्रॅम' },
      { animal: 'दुभती गाय (१० लिटर दूध/दिवस)', concentrate: '४.५ किलो संतुलित पशुखाद्य', roughage: '१८–२० किलो हिरवा + ३ किलो सुका चारा', mineral: '६०–७५ ग्रॅम' },
      { animal: 'आटलेली गाभण गाय', concentrate: '१.५–२.० किलो पशुखाद्य', roughage: '१५ किलो हिरवा + ५ किलो सुका चारा', mineral: '५० ग्रॅम' },
      { animal: 'वाढणारी कालवड (२०० किलो)', concentrate: '२.० किलो पशुखाद्य', roughage: '१०–१२ किलो हिरवा + २ किलो सुका चारा', mineral: '४० ग्रॅम' },
      { animal: 'लहान वासरू (३–६ महिने)', concentrate: '१.० किलो (काफ स्टार्टर)', roughage: '४–५ किलो कोवळा हिरवा चारा', mineral: '२० ग्रॅम' },
      { animal: 'प्रजननाचा वळू', concentrate: '२.५–३.० किलो पशुखाद्य', roughage: '२० किलो हिरवा चारा', mineral: '६० ग्रॅम' },
    ],
    storage: [
      { title: 'तापमान व उन्हापासून रक्षण', tips: ['खाद्य २८°C पेक्षा कमी तापमानात थंड व हवेशीर गोदामात साठवा.', 'खाद्याची पोती थेट पत्र्याच्या भिंतीला टेकवून ठेवू नका.'] },
      { title: 'ओलावा व लाकडी फळ्या (Pallets)', tips: ['पोती जमिनीपासून किमान १५ सेमी वर लाकडी फळ्यांवर ठेवा.', 'गोदामातील आर्द्रता ६५% पेक्षा कमी ठेवा.'] },
      { title: 'प्रथम आलेले प्रथम वापरा (FIFO)', tips: ['जुनी पोती आधी वापरा, नवीन पोती नंतर उघडा.', 'गोठ्यातील जमिनीवर झाडून गोळा केलेले खराब खाद्य जनावरांना टाकू नका.'] },
      { title: 'सायलेज खड्ड्याचे नियम', tips: ['सायलेज बनवताना १५ सेमीच्या थरांमध्ये ट्रॅक्टरने हवा पूर्ण बाहेर काढा.', '४८–७२ तासांत pH ३.८–४.२ पर्यंत खाली येणे गरजेचे आहे.'] },
    ],
    contamination: [
      { type: 'युरिया भेसळ', risk: 'अतिधोकादायक प्राणघातक', signs: ['तीव्र अमोनिया (मूत्रासारखा) दर्प', 'पोत्याच्या शिवणीवर पांढरी बारीक पूड', 'अस्वाभाविक जास्त प्रथिने नोंद'], action: 'ताबडतोब बंद करा! युरिया विषबाधेमुळे जनावर २ तासांत दगावू शकते.' },
      { type: 'वाळू व सिलिका भेसळ', risk: 'मोठे नुकसान', signs: ['हाताने चोळल्यावर बारीक खडे जाणवणे', 'पाण्याच्या पेल्यात विरघळल्यावर तळाशी गाळ जमणे'], action: 'विक्रेत्याला पूर्ण साठा परत करा. यामुळे जनावरांचे दात झिजतात आणि पोटाला इजा होते.' },
      { type: 'बुरशी व काळवी (Mould)', risk: 'विषारी प्रादुर्भाव', signs: ['हिरवट, काळे किंवा पांढरे डाग', 'कुबट कुजकट वास', 'पोत्यामध्ये खाद्याच्या घट्ट गाठी'], action: 'कदापि खाऊ घालू नका. यामुळे गाभण जनावरांचे गर्भपात होतात आणि दूध विषारी बनते.' },
      { type: 'खनिजांची कमतरता', risk: 'दीर्घकालीन आजार', signs: ['जनावरांचे माती, भिंती चाटणे (पायका आजार)', 'खरखरीत केस व त्वचा'], action: 'प्रमाणित खनिज मिश्रण (Mineral Mixture) सुरू करा. पशुवैद्यकांचा सल्ला घ्या.' },
    ],
  },
};

export default function AdvisoryHub() {
  const { t, i18n } = useTranslation();
  const lang = ADVISORY_DATA[i18n.language] ? i18n.language : 'en';
  const data = ADVISORY_DATA[lang] || ADVISORY_DATA.en;

  return (
    <div>
      <div className="page-header">
        <h1>{t('advisory.title')}</h1>
        <p>{t('advisory.subtitle')}</p>
      </div>

      {/* Section 1: Nutrition Standards */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2 className="section-heading">
          <Apple size={22} style={{ color: 'var(--color-primary)' }} />
          {t('advisory.nutrition_title')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
          {data.nutrition.map(({ param, ideal, importance }, idx) => (
            <div key={idx} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{param}</h3>
                <span className="badge badge-good">{ideal}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {importance}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Dairy Ration Calculator */}
      <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="card-header">
          <span className="card-title">
            <Scale size={20} style={{ color: 'var(--color-wheat)' }} />
            {t('advisory.feeding_calc_title')}
          </span>
          <span className="badge badge-info">BIS & NDDB Certified</span>
        </div>
        <div className="table-responsive">
          <table className="farmer-table">
            <thead>
              <tr>
                <th>{t('advisory.animal')}</th>
                <th>{t('advisory.concentrate')}</th>
                <th>{t('advisory.roughage')}</th>
                <th>{t('advisory.mineral_mix')}</th>
              </tr>
            </thead>
            <tbody>
              {data.feeding.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.animal}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{row.concentrate}</td>
                  <td>{row.roughage}</td>
                  <td>
                    <span className="badge badge-good">{row.mineral}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Storage Best Practices */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2 className="section-heading">
          <Warehouse size={22} style={{ color: 'var(--color-primary)' }} />
          {t('advisory.storage_title')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
          {data.storage.map((sec, idx) => (
            <div key={idx} className="card" style={{ marginBottom: 0, background: 'var(--bg-card-alt)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
                {sec.title}
              </h3>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {sec.tips.map((tip, j) => (
                  <li key={j} style={{ marginBottom: 4 }}>{tip}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Field Contamination Guide */}
      <div>
        <h2 className="section-heading">
          <AlertTriangle size={22} style={{ color: 'var(--color-unsafe)' }} />
          {t('advisory.contamination_title')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
          {data.contamination.map((item, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                marginBottom: 0,
                borderLeft: '4px solid var(--color-unsafe)',
                background: 'var(--color-unsafe-bg)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-unsafe-text)' }}>
                  {item.type}
                </h3>
                <span className="badge badge-unsafe">{item.risk}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Field Symptoms:
                </div>
                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  {item.signs.map((sign, j) => (
                    <li key={j}>{sign}</li>
                  ))}
                </ul>
              </div>
              <div style={{
                background: '#ffffff',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                color: 'var(--color-unsafe-text)',
                fontWeight: 600,
                border: '1px solid var(--color-unsafe-border)',
              }}>
                <strong>Action: </strong>{item.action}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
