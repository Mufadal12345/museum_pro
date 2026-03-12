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
  // دالة اكتشاف اللغة
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
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/85 backdrop-blur-lg p-3 md:p-6"
      onClick={onClose} 
    >
      {/* التعديلات لتحقيق مظهر "الكتلة الواحدة":
         1. items-center: لمركزة النافذة في وسط الشاشة تماماً.
         2. h-auto & max-h-[92vh]: لتجعل النافذة وحدة واحدة تتمدد حسب المحتوى دون قص.
         3. shadow-white/5: إضافة توهج خفيف لتبدو ككتلة بارزة.
      */}
      <div 
        dir={dir}
        className={`glass-dark rounded-[2.5rem] w-full max-w-lg shadow-[0_0_50px_rgba(255,255,255,0.05)] 
          border border-white/10 animate-scale-in relative flex flex-col h-auto max-h-[92vh] transition-all duration-500
          ${dir === "rtl" ? "font-tajawal text-right" : "font-sans text-left"}`}
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* رأس النافذة - مدمج بانسيابية */}
        <div className={`p-6 pb-2 flex justify-between items-center ${dir === 'rtl' ? 'flex-row' : 'flex-row-reverse'}`}>
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-bold gradient-text leading-tight">{title}</h3>
            <span className="text-[10px] text-pink-400/70 font-tajawal">
              {dir === "rtl" ? "صاحبة الفكرة: رشا سعاد الشعيبي" : "Idea by: Rasha Suad"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all text-2xl text-gray-400"
          >
            &times;
          </button>
        </div>

        {/* منطقة المحتوى - تم تقليل الحواشي (Padding) لتظهر الكتلة متصلة ببعضها */}
        <div className="px-6 py-4 overflow-visible">
          {children}
        </div>

        {/* تذييل النافذة - ملتصق بالكتلة وليس بعيداً عنها */}
        <div className="pb-6 pt-2 text-center shrink-0">
           <div className="h-[1px] w-1/4 bg-white/5 mx-auto mb-4"></div>
           <p className="text-[9px] text-gray-500 uppercase tracking-[0.3em] font-bold">
             DEVELOPED BY MU_CS_01 | 2026
           </p>
        </div>
      </div>
    </div>
  );
};
