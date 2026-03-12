import React from "react";

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
  if (!isOpen) return null;

  return (
    // التعديل هنا: تم تغيير items-center إلى items-start وأضفنا padding علوي pt-10
    <div className="modal-overlay fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm pt-10 md:pt-20 overflow-y-auto animate-fade-in">
      
      {/* تم إضافة mt-4 لضمان وجود مسافة بسيطة من الأعلى حتى في الشاشات الصغيرة */}
      <div className="glass-dark rounded-3xl p-6 w-full max-w-md mx-4 mb-10 shadow-2xl border border-white/10 animate-slide-down">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h3 className="text-2xl font-bold gradient-text font-tajawal">{title}</h3>
            {/* لمسة إضافية: سطر فرعي ناعم يعطي طابعاً احترافياً */}
            <span className="text-[10px] text-gray-500 mt-1">متحف الفكر | بوابة الإبداع</span>
          </div>
          
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all text-2xl text-gray-400"
          >
            &times;
          </button>
        </div>

        <div className="modal-content">
          {children}
        </div>

        {/* تذييل بسيط للنافذة لإعطاء هوية للمشروع */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center">
           <p className="text-[9px] text-gray-500 uppercase tracking-widest">
             Designed for Museum of Thought by mu_cs_01
           </p>
        </div>
      </div>
    </div>
  );
};
