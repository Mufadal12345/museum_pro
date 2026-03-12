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
      className="fixed inset-0 z-[999] flex items-start justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
      onClick={onClose} 
    >
      {/* التعديل هنا: 
         1. mt-20 أو mt-[15vh]: لجعل النافذة منخفضة قليلاً عن الحافة العلوية.
         2. min-h-[500px]: لضمان طول النافذة حتى يظهر الزر.
         3. mb-10: لترك مسافة في الأسفل لسهولة التمرير.
      */}
      <div 
        className="glass-dark rounded-[2.5rem] w-full max-w-md shadow-2xl border border-white/10 animate-slide-down relative mt-16 md:mt-24 min-h-[500px] flex flex-col mb-10"
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* رأس النافذة */}
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

        {/* منطقة المحتوى مع مساحة داخلية كافية في الأسفل لزر النشر */}
        <div className="p-6 pt-2 pb-12">
          {children}
        </div>

        {/* تذييل النافذة */}
        <div className="mt-auto pb-6 text-center shrink-0">
           <p className="text-[9px] text-gray-500 uppercase tracking-widest font-medium">
             Developed by mu_cs_01 | 2026
           </p>
        </div>
      </div>
    </div>
  );
};
