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
      // التعديل هنا: استخدام items-start مع pt-[15vh] لسحبها للأسفل بمقدار مريح
      className="fixed inset-0 z-[999] flex items-start justify-center bg-black/85 backdrop-blur-lg p-4 overflow-y-auto pt-[15vh] pb-10"
      onClick={onClose} 
    >
      <div 
        dir={dir}
        // التعديل هنا: جعلنا الارتفاع مرن h-fit لتبقى كتلة واحدة متصلة
        className={`glass-dark rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-white/10 animate-slide-up relative 
          flex flex-col h-fit min-h-[500px] transition-all duration-500
          ${dir === "rtl" ? "font-tajawal text-right" : "font-sans text-left"}`}
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* رأس النافذة */}
        <div className={`p-7 pb-2 flex justify-between items-center ${dir === 'rtl' ? 'flex-row' : 'flex-row-reverse'}`}>
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

        {/* محتوى النافذة - مساحة داخلية متوازنة لضمان ظهور زر النشر */}
        <div className="px-7 py-4 pb-20">
          {children}
        </div>

        {/* تذييل النافذة - مدمج في أسفل الكتلة */}
        <div className="absolute bottom-6 left-0 w-full text-center">
           <div className="h-[1px] w-12 bg-white/10 mx-auto mb-3"></div>
           <p className="text-[9px] text-gray-500 uppercase tracking-[0.3em] font-bold opacity-60">
             DEVELOPED BY MU_CS_01 | 2026
           </p>
        </div>
      </div>
    </div>
  );
};
