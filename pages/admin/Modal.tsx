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
  // منع التمرير في الخلفية عند فتح النافذة لتحسين تجربة المستخدم
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
      className="modal-overlay fixed inset-0 z-[999] bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose} // إغلاق عند الضغط على الخلفية السوداء
    >
      <div className="flex items-start justify-center min-h-screen p-4 pt-6 md:pt-16">
        {/* الحاوية البيضاء (النافذة) */}
        <div 
          className="glass-dark rounded-[2.5rem] p-6 w-full max-w-md shadow-2xl border border-white/10 animate-slide-down relative mb-10"
          onClick={(e) => e.stopPropagation()} // منع الإغلاق عند الضغط داخل النافذة
        >
          {/* شريط الإمساك العلوي للموبايل لإعطاء إيحاء بالمرونة */}
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 md:hidden"></div>

          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold gradient-text font-tajawal leading-tight">{title}</h3>
              <span className="text-[10px] text-pink-400/80 mt-1 font-tajawal">صاحبة الفكرة: رشا سعاد الشعيبي</span>
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* قسم المحتوى - أزلنا منه overflow-y-auto لكي تمدد النافذة بالكامل وتظهر الأزرار */}
          <div className="modal-content relative">
            {children}
          </div>

          {/* تذييل النافذة */}
          <div className="mt-8 pt-4 border-t border-white/5 text-center">
             <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-medium">
               Developed by mu_cs_01 | 2026
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
