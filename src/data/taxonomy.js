export const LANGUAGES = [
  { key: "pa", label: "ਪੰਜਾਬੀ", short: "ਪੰ" },
  { key: "hi", label: "हिंदी", short: "हि" },
  { key: "en", label: "English", short: "En" },
];

export const GENDERS = [
  { key: "female", label: { en: "Female", hi: "महिला", pa: "ਮਹਿਲਾ" } },
  { key: "male", label: { en: "Male", hi: "पुरुष", pa: "ਪੁਰਸ਼" } },
  { key: "other", label: { en: "Other", hi: "अन्य", pa: "ਹੋਰ" } },
];

export const OCCUPATIONS = [
  { key: "farmer", label: { en: "Farmer / landowner", hi: "किसान / भूमि मालिक", pa: "ਕਿਸਾਨ / ਜ਼ਮੀਨ ਮਾਲਕ" } },
  { key: "farm_labour", label: { en: "Farm labourer", hi: "खेत मज़दूर", pa: "ਖੇਤ ਮਜ਼ਦੂਰ" } },
  { key: "student", label: { en: "Student", hi: "विद्यार्थी", pa: "ਵਿਦਿਆਰਥੀ" } },
  { key: "salaried", label: { en: "Salaried employee", hi: "वेतनभोगी कर्मचारी", pa: "ਤਨਖਾਹ ਲੈਣ ਵਾਲਾ" } },
  { key: "self_employed", label: { en: "Self-employed / shopkeeper", hi: "स्वयं रोज़गार / दुकानदार", pa: "ਸਵੈ-ਰੋਜ਼ਗਾਰ / ਦੁਕਾਨਦਾਰ" } },
  { key: "daily_wage", label: { en: "Daily wage worker", hi: "दिहाड़ी मज़दूर", pa: "ਦਿਹਾੜੀਦਾਰ ਮਜ਼ਦੂਰ" } },
  { key: "construction", label: { en: "Construction worker", hi: "निर्माण श्रमिक", pa: "ਉਸਾਰੀ ਮਜ਼ਦੂਰ" } },
  { key: "street_vendor", label: { en: "Street vendor", hi: "रेहड़ी-पटरी विक्रेता", pa: "ਰੇਹੜੀ-ਫੜੀ ਵਿਕਰੇਤਾ" } },
  { key: "artisan", label: { en: "Artisan / craftsperson", hi: "कारीगर / शिल्पकार", pa: "ਕਾਰੀਗਰ / ਦਸਤਕਾਰ" } },
  { key: "unemployed", label: { en: "Unemployed", hi: "बेरोज़गार", pa: "ਬੇਰੋਜ਼ਗਾਰ" } },
  { key: "homemaker", label: { en: "Homemaker", hi: "गृहिणी", pa: "ਘਰੇਲੂ ਔਰਤ" } },
];

export const CATEGORIES = [
  { key: "sc", label: { en: "Scheduled Caste", hi: "अनुसूचित जाति", pa: "ਅਨੁਸੂਚਿਤ ਜਾਤੀ" } },
  { key: "st", label: { en: "Scheduled Tribe", hi: "अनुसूचित जनजाति", pa: "ਅਨੁਸੂਚਿਤ ਕਬੀਲਾ" } },
  { key: "obc", label: { en: "Other Backward Class", hi: "अन्य पिछड़ा वर्ग", pa: "ਹੋਰ ਪਿਛੜਾ ਵਰਗ" } },
  { key: "bpl", label: { en: "BPL / low income", hi: "बीपीएल / कम आय", pa: "ਬੀਪੀਐਲ / ਘੱਟ ਆਮਦਨ" } },
  { key: "ews", label: { en: "Economically Weaker Section", hi: "आर्थिक रूप से कमज़ोर", pa: "ਆਰਥਿਕ ਤੌਰ 'ਤੇ ਕਮਜ਼ੋਰ" } },
  { key: "minority", label: { en: "Minority", hi: "अल्पसंख्यक", pa: "ਘੱਟ ਗਿਣਤੀ" } },
  { key: "general", label: { en: "General", hi: "सामान्य", pa: "ਆਮ" } },
];

export const INCOME_BANDS = [
  { key: "lt50k", min: 0, max: 50000, label: { en: "Under ₹50,000", hi: "₹50,000 से कम", pa: "₹50,000 ਤੋਂ ਘੱਟ" } },
  { key: "50k_1l", min: 50000, max: 100000, label: { en: "₹50,000 – ₹1 lakh", hi: "₹50,000 – ₹1 लाख", pa: "₹50,000 – ₹1 ਲੱਖ" } },
  { key: "1l_25l", min: 100000, max: 250000, label: { en: "₹1 – ₹2.5 lakh", hi: "₹1 – ₹2.5 लाख", pa: "₹1 – ₹2.5 ਲੱਖ" } },
  { key: "25l_5l", min: 250000, max: 500000, label: { en: "₹2.5 – ₹5 lakh", hi: "₹2.5 – ₹5 लाख", pa: "₹2.5 – ₹5 ਲੱਖ" } },
  { key: "5l_8l", min: 500000, max: 800000, label: { en: "₹5 – ₹8 lakh", hi: "₹5 – ₹8 लाख", pa: "₹5 – ₹8 ਲੱਖ" } },
  { key: "gt8l", min: 800000, max: 2000000, label: { en: "Above ₹8 lakh", hi: "₹8 लाख से अधिक", pa: "₹8 ਲੱਖ ਤੋਂ ਵੱਧ" } },
];

export const DOCUMENTS = {
  aadhaar: { en: "Aadhaar card", hi: "आधार कार्ड", pa: "ਆਧਾਰ ਕਾਰਡ" },
  bank: { en: "Bank account passbook", hi: "बैंक खाता पासबुक", pa: "ਬੈਂਕ ਖਾਤਾ ਪਾਸਬੁੱਕ" },
  land_record: { en: "Land record (jamabandi)", hi: "भूमि रिकॉर्ड (जमाबंदी)", pa: "ਜ਼ਮੀਨ ਦਾ ਰਿਕਾਰਡ (ਜਮਾਬੰਦੀ)" },
  income_cert: { en: "Income certificate", hi: "आय प्रमाण पत्र", pa: "ਆਮਦਨ ਸਰਟੀਫਿਕੇਟ" },
  caste_cert: { en: "Caste certificate", hi: "जाति प्रमाण पत्र", pa: "ਜਾਤੀ ਸਰਟੀਫਿਕੇਟ" },
  ration_card: { en: "Ration card", hi: "राशन कार्ड", pa: "ਰਾਸ਼ਨ ਕਾਰਡ" },
  dob_proof: { en: "Date of birth proof", hi: "जन्म तिथि प्रमाण", pa: "ਜਨਮ ਤਾਰੀਖ ਦਾ ਸਬੂਤ" },
  marriage_cert: { en: "Marriage certificate", hi: "विवाह प्रमाण पत्र", pa: "ਵਿਆਹ ਦਾ ਸਰਟੀਫਿਕੇਟ" },
  disability_cert: { en: "Disability certificate (UDID)", hi: "दिव्यांगता प्रमाण पत्र (UDID)", pa: "ਅਪਾਹਜਤਾ ਸਰਟੀਫਿਕੇਟ (UDID)" },
  student_cert: { en: "School / college certificate", hi: "स्कूल / कॉलेज प्रमाण पत्र", pa: "ਸਕੂਲ / ਕਾਲਜ ਸਰਟੀਫਿਕੇਟ" },
  death_cert: { en: "Spouse death certificate", hi: "पति/पत्नी का मृत्यु प्रमाण पत्र", pa: "ਪਤੀ/ਪਤਨੀ ਦੀ ਮੌਤ ਦਾ ਸਰਟੀਫਿਕੇਟ" },
  photo: { en: "Passport-size photograph", hi: "पासपोर्ट साइज़ फोटो", pa: "ਪਾਸਪੋਰਟ ਸਾਈਜ਼ ਫੋਟੋ" },
  employment_proof: { en: "Worker registration card", hi: "श्रमिक पंजीकरण कार्ड", pa: "ਮਜ਼ਦੂਰ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਕਾਰਡ" },
  business_proof: { en: "Business / shop proof", hi: "व्यवसाय / दुकान का प्रमाण", pa: "ਕਾਰੋਬਾਰ / ਦੁਕਾਨ ਦਾ ਸਬੂਤ" },
  mcp_card: { en: "Mother & Child Protection card", hi: "माता एवं शिशु सुरक्षा कार्ड", pa: "ਮਾਂ ਤੇ ਬੱਚਾ ਸੁਰੱਖਿਆ ਕਾਰਡ" },
  sports_cert: { en: "Sports achievement certificate", hi: "खेल उपलब्धि प्रमाण पत्र", pa: "ਖੇਡ ਪ੍ਰਾਪਤੀ ਸਰਟੀਫਿਕੇਟ" },
  medical_cert: { en: "Medical fitness certificate", hi: "चिकित्सा फिटनेस प्रमाण पत्र", pa: "ਮੈਡੀਕਲ ਫਿਟਨੈਸ ਸਰਟੀਫਿਕੇਟ" },
};

export const CATEGORY_GROUPS = [
  { key: "farmer", label: { en: "Farmers", hi: "किसान", pa: "ਕਿਸਾਨ" } },
  { key: "student", label: { en: "Students", hi: "विद्यार्थी", pa: "ਵਿਦਿਆਰਥੀ" } },
  { key: "woman", label: { en: "Women & girls", hi: "महिलाएं व बालिकाएं", pa: "ਮਹਿਲਾਵਾਂ ਤੇ ਬੱਚੀਆਂ" } },
  { key: "senior", label: { en: "Senior citizens", hi: "वरिष्ठ नागरिक", pa: "ਬਜ਼ੁਰਗ" } },
  { key: "health", label: { en: "Health cover", hi: "स्वास्थ्य सुरक्षा", pa: "ਸਿਹਤ ਸੁਰੱਖਿਆ" } },
  { key: "worker", label: { en: "Workers & livelihood", hi: "श्रमिक व आजीविका", pa: "ਮਜ਼ਦੂਰ ਤੇ ਰੋਜ਼ੀ-ਰੋਟੀ" } },
  { key: "housing", label: { en: "Housing", hi: "आवास", pa: "ਘਰ" } },
];

export const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry",
];
