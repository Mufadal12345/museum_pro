import { Quote, Course } from "../types";

const AUTHOR_NAME = "MUF";
const AUTHOR_ROLE = "admin";

// Helper to generate dates
const getDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

// --- 1. عبارات ملهمة (30 عنصر) ---
export const STATIC_QUOTES: Quote[] = [
  {
    text: "لا تطلب السرعة في العمل بل اطلب التجويد، فإن الناس لا يسألون في كم فرغ من العمل، بل ينظرون إلى إتقانه.",
    author: "أفلاطون",
  },
  {
    text: "العقل ليس وعاءً يجب ملؤه، ولكنه نار يجب إيقادها.",
    author: "بلوتارك",
  },
  { text: "الرأي هو شيء وسط بين العلم والجهل.", author: "أرسطو" },
  {
    text: "اطلب العلم من المهد إلى اللحد، فإن الفكر لا يشيخ.",
    author: "حكمة عربية",
  },
  { text: "أنا أفكر، إذن أنا موجود.", author: "رينيه ديكارت" },
  { text: "المعرفة قوة.", author: "فرانسيس بيكون" },
  { text: "كلما ازددت علماً، ازداد إحساسي بجهلي.", author: "أينشتاين" },
  {
    text: "لا يكفي أن يكون لديك عقل جيد، المهم هو أن تستخدمه جيداً.",
    author: "ديكارت",
  },
  { text: "الإنسان عدو ما يجهل.", author: "علي بن أبي طالب" },
  { text: "في المعرفة، كما في السباحة، من لا يتقدم يغرق.", author: "مثل صيني" },
  {
    text: "القراءة تمد العقل فقط بلوازم المعرفة، أما التفكير فيجعلنا نملك ما نقرأ.",
    author: "جون لوك",
  },
  {
    text: "التعليم هو السلاح الأقوى الذي يمكنك استخدامه لتغيير العالم.",
    author: "نيلسون مانديلا",
  },
  {
    text: "قطرة المطر تحفر في الصخر، ليس بالعنف ولكن بالتكرار.",
    author: "أوفيد",
  },
  {
    text: "الحكمة هي ملخص الماضي، والجمال هو وعد المستقبل.",
    author: "أوليفر هولمز",
  },
  {
    text: "ليس العار في أن نسقط، ولكن العار أن لا نستطيع النهوض.",
    author: "مثل",
  },
  {
    text: "من لم يذق مر التعلم ساعة، تجرع ذل الجهل طول حياته.",
    author: "الشافعي",
  },
  { text: "قمة الجبل ليست إلا القاع لجبل آخر.", author: "جبران خليل جبران" },
  {
    text: "التفكير هو أصعب عمل يوجد، وهذا هو السبب المحتمل لقلة من يمارسونه.",
    author: "هنري فورد",
  },
  { text: "الخيال أهم من المعرفة.", author: "أينشتاين" },
  { text: "لا تبحث عن الأخطاء، ابحث عن العلاج.", author: "هنري فورد" },
  {
    text: "العبقرية هي واحد بالمئة إلهام، وتسعة وتسعون بالمئة جهد وعرق.",
    author: "توماس إديسون",
  },
  { text: "إذا أردت أن تفهم الحاضر، فدرس الماضي.", author: "كونفوشيوس" },
  { text: "أفضل طريقة للتنبؤ بالمستقبل هي اختراعه.", author: "آلان كاي" },
  { text: "الجمال يوقظ الروح للعمل.", author: "دانتي أليغييري" },
  { text: "الفن يمسح عن الروح غبار الحياة اليومية.", author: "بيكاسو" },
  {
    text: "الحرية هي الحق في أن تقول للناس ما لا يريدون سماعه.",
    author: "جورج أورويل",
  },
  { text: "لا يوجد طريق للسعادة، السعادة هي الطريق.", author: "غاندي" },
  { text: "التغيير هو القانون الوحيد الثابت في الحياة.", author: "هيراقليدس" },
  {
    text: "النجاح ليس نهائياً، والفشل ليس قاتلاً: الشجاعة على الاستمرار هي ما يهم.",
    author: "تشرشل",
  },
  { text: "كن التغيير الذي تريد أن تراه في العالم.", author: "غاندي" },
].map((q, i) => ({
  id: `static_quote_${i}`,
  text: q.text,
  author: q.author,
  addedBy: AUTHOR_NAME,
  isDefault: true,
  createdAt: getDate(i),
}));

// --- 2. مصادر تعلم (20 عنصر) ---
export const STATIC_COURSES: Course[] = [
  {
    title: "CS50: علوم الحاسب",
    type: "كورس أونلاين",
    link: "https://pll.harvard.edu/course/cs50",
    desc: "مقدمة هارفارد الشهيرة في علوم الحاسب والبرمجة.",
  },
  {
    title: "Elzero Web School",
    type: "قناة يوتيوب",
    link: "https://www.youtube.com/c/ElzeroInfo",
    desc: "المسار الشامل لتعلم تطوير الويب باللغة العربية.",
  },
  {
    title: "Coursera",
    type: "منصة تعليمية",
    link: "https://www.coursera.org",
    desc: "دورات من أفضل جامعات العالم في شتى المجالات.",
  },
  {
    title: "EdX",
    type: "منصة تعليمية",
    link: "https://www.edx.org",
    desc: "تعلم من هارفارد وMIT وغيرهم مجاناً.",
  },
  {
    title: "Khan Academy",
    type: "منصة تعليمية",
    link: "https://www.khanacademy.org",
    desc: "دروس مجانية في الرياضيات والعلوم والاقتصاد.",
  },
  {
    title: "Crash Course",
    type: "قناة يوتيوب",
    link: "https://www.youtube.com/user/crashcourse",
    desc: "شرح مبسط للتاريخ، العلوم، الفلسفة، والأدب.",
  },
  {
    title: "TED",
    type: "منصة تعليمية",
    link: "https://www.ted.com",
    desc: "أفكار تستحق الانتشار ومحادثات ملهمة.",
  },
  {
    title: "Duolingo",
    type: "منصة تعليمية",
    link: "https://www.duolingo.com",
    desc: "تعلم اللغات بطريقة ممتعة وتفاعلية.",
  },
  {
    title: "Udemy",
    type: "منصة تعليمية",
    link: "https://www.udemy.com",
    desc: "أكبر مكتبة للكورسات العملية في العالم.",
  },
  {
    title: "MIT OpenCourseWare",
    type: "كورس أونلاين",
    link: "https://ocw.mit.edu",
    desc: "مواد دراسية من معهد ماساتشوستس للتكنولوجيا.",
  },
  {
    title: "Project Gutenberg",
    type: "كتب",
    link: "https://www.gutenberg.org",
    desc: "مكتبة تضم أكثر من 60 ألف كتاب مجاني.",
  },
  {
    title: "Goodreads",
    type: "كتب",
    link: "https://www.goodreads.com",
    desc: "مجتمع للقراء ومراجعات الكتب.",
  },
  {
    title: "Google Arts & Culture",
    type: "فن",
    link: "https://artsandculture.google.com",
    desc: "جولات افتراضية في متاحف العالم.",
  },
  {
    title: "Behance",
    type: "فن",
    link: "https://www.behance.net",
    desc: "استلهم من أعمال المصممين المبدعين حول العالم.",
  },
  {
    title: "Stanford Encyclopedia of Philosophy",
    type: "مقالات",
    link: "https://plato.stanford.edu",
    desc: "المرجع الأول في الفلسفة الأكاديمية.",
  },
  {
    title: "Investopedia",
    type: "مقالات",
    link: "https://www.investopedia.com",
    desc: "كل ما تحتاج معرفته عن الاقتصاد والاستثمار.",
  },
  {
    title: "National Geographic",
    type: "علوم",
    link: "https://www.nationalgeographic.com",
    desc: "استكشف الطبيعة والعلوم والتاريخ.",
  },
  {
    title: "NASA",
    type: "علوم",
    link: "https://www.nasa.gov",
    desc: "آخر اكتشافات الفضاء والكون.",
  },
  {
    title: "Medium",
    type: "مقالات",
    link: "https://medium.com",
    desc: "مقالات متنوعة من كتاب ومفكرين مستقلين.",
  },
  {
    title: "ArXiv",
    type: "مقالات",
    link: "https://arxiv.org",
    desc: "أوراق بحثية علمية في الفيزياء والرياضيات وعلوم الحاسب.",
  },
].map((c, i) => ({
  id: `static_course_${i}`,
  title: c.title,
  type: c.type,
  description: c.desc,
  link: c.link,
  preview: undefined,
  addedBy: AUTHOR_NAME,
  addedByRole: AUTHOR_ROLE,
  createdAt: getDate(i * 2),
  likes: 100 + i * 15,
  likedBy: [],
  views: 500 + i * 50,
}));

// --- 3. توليد 1000 مقال وفكرة (تنظيف المحتوى) ---

const generateContent = () => {
  return []; // Emptying static content to replace with high-quality articles
};

export const STATIC_CONTENT: any[] = generateContent();
