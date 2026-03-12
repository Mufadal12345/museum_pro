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
  // التعرف التلقائي على اللغة لضبط الاتجاه
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
      // التعديل السحري: items-end مع pb-[5vh] تجعل النافذة تستقر في الثلث السفلي
      className="fixed inset-0 z-[999] flex items-end justify-center bg-black/75 backdrop-blur-md p-4 pb-[8vh] overflow-y-auto"
      onClick={onClose} 
    >
      <div 
        dir={dir}
        // h-fit تضمن أنها تظل كتلة واحدة متصلة مهما كان حجم المحتوى
        className={`glass-dark rounded-t-[3rem] rounded-b-[1rem] w-full max-w-lg shadow-[0_-20px_50px_rgba(0,0,0,0.5)] 
          border border-white/10 animate-slide-up relative flex flex-col h-fit max-h-[80vh]
          ${dir === "rtl" ? "font-tajawal text-right" : "font-sans text-left"}`}
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* مقبض سحب صغير (Visual Cue) لإعطاء إيحاء بأنها نافذة سفلية */}
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 shadow-inner"></div>

        {/* رأس النافذة */}
        <div className={`p-6 pb-2 flex justify-between items-center ${dir === 'rtl' ? 'flex-row' : 'flex-row-reverse'}`}>
          <div className="flex flex-col">
            <h3 className="text-xl font-bold gradient-text leading-tight">{title}</h3>
            <span className="text-[10px] text-pink-400/70 font-tajawal">
              {dir === "rtl" ? "صاحبة الفكرة: رشا سعاد الشعيبي" : "Idea Owner: Rasha Suad"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all text-2xl text-gray-400"
          >
            &times;
          </button>
        </div>

        {/* منطقة المحتوى - مدمجة تماماً مع الزر */}
        <div className="px-6 py-4 pb-20">
          {children}
        </div>

        {/* تذييل النافذة - مثبت في قاع الكتلة السفلية */}
        <div className="pb-6 text-center shrink-0">
           <div className="h-[1px] w-12 bg-white/5 mx-auto mb-3"></div>
           <p className="text-[9px] text-gray-500 uppercase tracking-[0.3em] font-bold">
             DEVELOPED BY MU_CS_01 | 2026
           </p>
        </div>
      </div>
    </div>
  );
};
