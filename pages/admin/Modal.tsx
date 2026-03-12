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
      className="fixed inset-0 z-[999] flex items-start justify-center bg-black/80 backdrop-blur-md p-4 pt-10 md:pt-16 overflow-y-auto"
      onClick={onClose} 
    >
      {/* التعديلات الجوهرية:
        1. min-h-[500px]: يضمن أن النافذة لن تكون قصيرة أبداً.
        2. h-fit: يجعل النافذة تتمدد إذا كان المحتوى أكبر من 500 بكسل.
        3. pb-12: يضيف مساحة كبيرة في الأسفل لضمان ظهور زر النشر بوضوح.
      */}
      <div 
        className="glass-dark rounded-[2.5rem] w-full max-w-md shadow-2xl border border-white/10 animate-slide-down relative min-h-[550px] h-fit flex flex-col mb-20"
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* رأس النافذة الثابت */}
        <div className="p-6 pb-4 shrink-0 flex justify-between items-start">
          <div className="flex flex-col">
            <h3 className="text-2xl font-bold gradient-text font-tajawal leading-tight">{title}</h3>
            <span className="text-[10px] text-pink-400/80 mt-1 font-tajawal">صاحبة الفكرة: رشا سعاد الشعيبي</span>
          </div>
          
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all text-2xl text-gray-400"
          >
            &times;
          </button>
        </div>

        {/* منطقة المحتوى: أضفنا Padding سفلي إضافي (pb-16) لرفع زر النشر للأعلى قليلاً */}
        <div className="p-6 pt-2 pb-16">
          {children}
        </div>

        {/* تذييل النافذة - مثبت في أسفل النافذة الطويلة */}
        <div className="absolute bottom-4 left-0 w-full text-center">
           <p className="text-[9px] text-gray-500 uppercase tracking-widest font-medium">
             Developed by mu_cs_01 | 2026
           </p>
        </div>
      </div>
    </div>
  );
};
