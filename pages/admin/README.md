# 🏛️ متحف الفكر (Museum of Thought)

![License](https://img.shields.io/badge/license-MIT-blue) ![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Firebase](https://img.shields.io/badge/Firebase-10-orange)

بوابة رقمية للإبداع الفكري، مشاركة الأفكار، الفلسفة، والمعرفة. تم تطويرها لصالح **جامعة زيان عاشور بالجلفة**.

يوفر هذا المشروع منصة تفاعلية للطلاب والمفكرين لنشر مقالاتهم، تبادل النقاشات، والوصول إلى مصادر معرفية متنوعة في بيئة رقمية حديثة.

## 📂 هيكلة المشروع (Project Structure)

```text
/
├── index.html          # الصفحة الرئيسية
├── App.tsx            # المكون الرئيسي
├── firebase.ts        # إعدادات قاعدة البيانات
├── components/        # المكونات (القائمة الجانبية، الأيقونات...)
├── contexts/          # إدارة البيانات والمصادقة
├── data/             # البيانات الثابتة
├── pages/            # صفحات الموقع (الرئيسية، الأفكار...)
└── types.ts          # تعريفات الأنواع (TypeScript Interfaces)
```

## ✨ المميزات الرئيسية

- **🔐 نظام مصادقة متكامل**: تسجيل دخول آمن وإنشاء حسابات باستخدام Firebase Auth.
- **📝 إدارة المحتوى**: إمكانية إضافة وتعديل الأفكار، المقالات، والاقتباسات.
- **👑 لوحة تحكم المشرفين**: داشبورد خاصة لإدارة الأعضاء، التعليقات، والرسائل.
- **💬 تفاعل حي**: نظام تعليقات وإعجابات ومشاركات.
- **🎨 واجهة عصرية**: تصميم متجاوب (Responsive) باستخدام Tailwind CSS مع دعم الوضع الليلي (Dark Theme).
- **📚 أقسام متنوعة**: فلسفة، علوم، أدب، تطوير مهارات، ومكتبة فيديو.

## 🛠️ التقنيات المستخدمة

تم بناء المشروع باستخدام أحدث تقنيات الويب:

- **[React.js](https://reactjs.org/)**: لبناء واجهة المستخدم (Frontend).
- **[TypeScript](https://www.typescriptlang.org/)**: لضمان جودة الكود وكتابة آمنة (Type Safety).
- **[Vite](https://vitejs.dev/)**: كأداة بناء وتطوير سريعة جداً.
- **[Firebase](https://firebase.google.com/)**:
  - **Authentication**: لإدارة المستخدمين.
  - **Firestore**: قاعدة بيانات سحابية NoSQL لتخزين البيانات.
- **[Tailwind CSS](https://tailwindcss.com/)**: لتنسيق الواجهات.

## 🚀 التشغيل محلياً (Installation)

لنسخ المشروع وتشغيله على جهازك، اتبع الخطوات التالية:

1.  **استنسخ المستودع:**

    ```bash
    git clone https://github.com/USERNAME/museum-of-thought.git
    cd museum-of-thought
    ```

2.  **ثبّت المكتبات المطلوبة:**

    ```bash
    npm install
    ```

3.  **شغّل السيرفر المحلي:**

    ```bash
    npm run dev
    ```

4.  **افتح المتصفح** على الرابط الذي سيظهر لك (غالباً `http://localhost:5173`).

## 📄 الحقوق

جميع الحقوق محفوظة © 2025 - **فريق MUF التقني**.

---

## 🚀 كيفية النشر على GitHub Pages (كموقع ثابت HTML/CSS/JS)

بما أن التطبيق مبني باستخدام Vite، فإن عملية تحويله إلى ملفات HTML/CSS/JS ثابتة هي عملية تلقائية. اتبع الخطوات التالية لنشر التطبيق:

### الخطوة 1: بناء المشروع (Build)

في بيئة التطوير الخاصة بك، قم بتشغيل أمر البناء لتحويل أكواد React إلى ملفات ثابتة:

```bash
npm run build
```

سينتج عن هذا مجلد باسم `dist` يحتوي على:

- `index.html` (الصفحة الرئيسية)
- مجلد `assets` (يحتوي على ملفات `script.js` و `style.css` مجمعة ومضغوطة)

### الخطوة 2: الرفع إلى GitHub

1. قم بإنشاء مستودع (Repository) جديد على GitHub.
2. ارفع جميع ملفات المشروع إلى هذا المستودع.

### الخطوة 3: تفعيل GitHub Pages

هناك طريقتان لنشر مجلد `dist` على GitHub Pages:

#### الطريقة الأولى: باستخدام GitHub Actions (موصى بها)

1. في مستودعك على GitHub، اذهب إلى **Settings** > **Pages**.
2. تحت قسم **Build and deployment**، اختر **GitHub Actions** كـ Source.
3. قم بإنشاء ملف `.github/workflows/deploy.yml` وضع فيه الكود التالي:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout 🛎️
        uses: actions/checkout@v3
      - name: Install and Build 🔧
        run: |
          npm install
          npm run build
      - name: Deploy 🚀
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist # مجلد البناء
```

#### الطريقة الثانية: الرفع اليدوي لمجلد `dist`

إذا كنت لا ترغب في استخدام GitHub Actions، يمكنك ببساطة رفع محتويات مجلد `dist` (وليس المجلد نفسه، بل ما بداخله) إلى فرع جديد يسمى `gh-pages`، ثم من إعدادات GitHub Pages اختر هذا الفرع كمصدر (Source).

---

## ⚙️ إعدادات Firebase

التطبيق متصل بالفعل بقاعدة بيانات Firebase Firestore ونظام المصادقة.

- **تكوين Firebase**: موجود في ملف `src/firebase.ts`.
- **ملاحظة أمنية**: مفاتيح Firebase الموجودة في الكود هي مفاتيح عامة (Public Keys) وتُستخدم للوصول إلى الخدمات من المتصفح. الأمان الحقيقي يتم عبر **Firebase Security Rules** في لوحة تحكم Firebase.

## 🛠️ استكشاف الأخطاء وإصلاحها

- **شاشة بيضاء بعد النشر**: تأكد من أن مسار `base` في ملف `vite.config.ts` مضبوط على `'./'` (وقد تم ضبطه بالفعل في هذا المشروع).
- **مشكلة في التوجيه (Routing)**: التطبيق يستخدم `HashRouter` بدلاً من `BrowserRouter`، مما يجعله متوافقاً تماماً بنسبة 100% مع GitHub Pages دون الحاجة لأي إعدادات إضافية للخوادم.
- **البيانات لا تظهر**: تأكد من أن قواعد أمان Firebase (Security Rules) تسمح بالقراءة والكتابة للمستخدمين المسجلين.

## 🌟 الميزات التقنية

- **التخزين المحلي (localStorage)**: يتم حفظ جلسة المستخدم تلقائياً عبر Firebase Auth، ويتم حفظ بعض التفضيلات محلياً.
- **التصميم المتجاوب**: مبني باستخدام Tailwind CSS ليكون متوافقاً مع الهواتف الذكية (Mobile-First).
- **تحسين الأداء**: يتم تجميع وتقليل حجم ملفات CSS و JS تلقائياً عبر Vite.
