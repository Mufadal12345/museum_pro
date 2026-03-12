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
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose} 
    >
      {/* النافذة الثابتة:
        1. max-h-[90vh] تضمن أن النافذة تأخذ أقصى حد 90% من الشاشة ولن تُقص من الأسفل أبدًا.
        2. flex flex-col يفصل النافذة إلى 3 أجزاء (رأس، محتوى، تذييل).
      */}
      <div 
        className="glass-dark rounded-[2rem] w-full max-w-md flex flex-col max-h-[90vh] shadow-2xl border border-white/10 animate-fade-in"
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* الجزء الأول: رأس النافذة (ثابت دائمًا) */}
        <div className="p-6 pb-4 border-b border-white/5 shrink-0 flex justify-between items-start">
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-bold gradient-text font-tajawal leading-tight">{title}</h3>
            <span className="text-[10px] text-pink-400/80 mt-1 font-tajawal">متحف الفكر | رشا سعاد الشعيبي</span>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all text-xl text-gray-400"
          >
            &times;
          </button>
        </div>

        {/* الجزء الثاني: المحتوى (التمرير يتم داخل هذا المربع فقط) */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {/* الجزء الثالث: تذييل النافذة (ثابت دائمًا) */}
        <div className="p-3 border-t border-white/5 text-center shrink-0">
           <p className="text-[9px] text-gray-500 uppercase tracking-widest font-medium">
             Developed by mu_cs_01 | 2026
           </p>
        </div>
      </div>
    </div>
  );
};
