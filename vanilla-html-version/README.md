# متحف الفكر - النسخة الثابتة (Vanilla JS)

هذا المجلد يحتوي على نسخة HTML/CSS/JS نقية من تطبيق "متحف الفكر"، جاهزة للنشر المباشر على GitHub Pages دون الحاجة لأي أدوات بناء (Build Tools) أو تيرمنل (Terminal).

## 🚀 كيفية النشر على GitHub Pages

1. قم بإنشاء مستودع (Repository) جديد على GitHub.
2. قم برفع جميع الملفات الموجودة في هذا المجلد (`index.html`, `style.css`, `script.js`, `firebase-config.js`) إلى المستودع.
3. اذهب إلى إعدادات المستودع **Settings** > **Pages**.
4. تحت قسم **Build and deployment**، اختر **Deploy from a branch**.
5. اختر الفرع `main` (أو `master`) واضغط **Save**.
6. في غضون دقائق، سيكون موقعك متاحاً على الرابط الذي يوفره GitHub.

## ⚙️ إعدادات Firebase

لكي يعمل التطبيق بشكل صحيح، يجب عليك إضافة إعدادات Firebase الخاصة بك:

1. افتح ملف `firebase-config.js`.
2. استبدل كائن `firebaseConfig` بالبيانات الخاصة بمشروعك من لوحة تحكم Firebase.

## 🌟 الميزات

- **بدون تيرمنل**: لا حاجة لـ Node.js أو npm.
- **تخزين محلي**: يتم حفظ الجلسة باستخدام `localStorage`.
- **تصميم متجاوب**: باستخدام Tailwind CSS عبر CDN.
- **تكامل Firebase**: مصادقة وقاعدة بيانات Firestore.
