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
  // دالة ذكية للتعرف على اللغة بناءً على أول حرف في العنوان
  const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);
  const dir = isArabic(title) ? "rtl" : "ltr";

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
      className="fixed inset-0 z-[999] flex items-start justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto pt-[8vh] pb-10"
      onClick={onClose} 
    >
      {/* الإضافات المطلوبة:
         1. mt-[5vh]: إزاحة مدروسة من الأعلى لترك مساحة جمالية.
         2. min-h-[75vh]: تكبير حدود النافذة طوليًا لتبدو كاملة وفخمة.
         3. dir={dir}: تبديل الاتجاه تلقائيًا حسب لغة النص.
      */}
      <div 
        dir={dir}
        className={`glass-dark rounded-[3rem] w-full max-w-lg shadow-2xl border border-white/10 animate-slide-down relative 
          flex flex-col min-h-[75vh] h-fit transition-all duration-500
          ${dir === "rtl" ? "font-tajawal text-right" : "font-sans text-left"}`}
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* رأس النافذة: يتغير ترتيب العناصر فيه حسب اللغة */}
        <div className={`p-8 pb-6 flex justify-between items-start shrink-0 ${dir === 'rtl' ? 'flex-row' : 'flex-row-reverse'}`}>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all text-3xl text-gray-400"
          >
            &times;
          </button>

          <div className="flex flex-col">
            <h3 className="text-2xl md:text-3xl font-bold gradient-text leading-tight">{title}</h3>
            <span className="text-[11px] text-pink-400/80 mt-2 opacity-90 tracking-wide">
              {dir === "rtl" ? "صاحبة الفكرة: رشا سعاد الشعيبي" : "Idea Owner: Rasha Suad Al-Shuaibi"}
            </span>
          </div>
        </div>

        {/* منطقة المحتوى: pb-24 تضمن بقاء زر النشر مرتفعاً وواضحاً داخل النافذة */}
        <div className="px-8 pt-2 pb-24 flex-1">
          {children}
        </div>

        {/* تذييل النافذة: يظهر في أسفل النافذة الطويلة كما في صورتك تماماً */}
        <div className="absolute bottom-8 left-0 w-full text-center">
           <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-bold opacity-60">
             DEVELOPED BY MU_CS_01 | 2026
           </p>
        </div>
      </div>
    </div>
  );
};
