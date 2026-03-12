import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  // دالة للتحقق مما إذا كان النص يحتوي على حروف عربية لضبط الاتجاه تلقائيًا
  const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);
  const direction = isArabic(title) ? "rtl" : "ltr";

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-start justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
      onClick={onClose} 
    >
      {/* التعديلات الجديدة:
         1. mt-[15vh]: إزاحة النافذة من الأعلى بمقدار مدروس (حوالي 15% من طول الشاشة).
         2. min-h-[650px]: تكبير حدود النافذة طوليًا من الأسفل لضمان مساحة واسعة.
         3. dir={direction}: تحديد اتجاه المحتوى (يمين لليسار أو العكس) بناءً على اللغة المكتشفة.
      */}
      <div 
        dir={direction}
        className={`glass-dark rounded-[3rem] w-full max-w-lg shadow-2xl border border-white/10 animate-slide-down relative 
          mt-[12vh] min-h-[650px] h-fit flex flex-col mb-20 transition-all duration-300
          ${direction === "rtl" ? "text-right" : "text-left"}`}
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* رأس النافذة - يتكيف مع الاتجاه */}
        <div className={`p-8 pb-4 shrink-0 flex justify-between items-start ${direction === "rtl" ? "flex-row" : "flex-row-reverse"}`}>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all text-3xl text-gray-400"
          >
            &times;
          </button>

          <div className="flex flex-col">
            <h3 className="text-2xl md:text-3xl font-bold gradient-text font-tajawal leading-tight">{title}</h3>
            <span className="text-[11px] text-pink-400/80 mt-2 font-tajawal opacity-80">
              {direction === "rtl" ? "صاحبة الفكرة: رشا سعاد الشعيبي" : "Idea by: Rasha Suad Al-Shuaibi"}
            </span>
          </div>
        </div>

        {/* منطقة المحتوى: وسعنا المسافة السفلية (pb-24) لضمان عدم قص زر النشر */}
        <div className="p-8 pt-4 pb-24 flex-1">
          {children}
        </div>

        {/* تذييل النافذة - مثبت في الأسفل تماماً */}
        <div className="absolute bottom-6 left-0 w-full text-center opacity-50">
           <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-400">
             Developed by mu_cs_01 | 2026
           </p>
        </div>
      </div>
    </div>
  );
};
