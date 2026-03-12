import React from "react";
import { Logo } from "../components/Logo";
import { Icons } from "../components/Icons";

export const About: React.FC = () => {
  return (
    <div className="animate-fade-in pb-20 max-w-3xl mx-auto">
      <div className="glass-card rounded-3xl p-6 md:p-10 text-center border-t-4 border-pink-500 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-pink-500/10 to-transparent pointer-events-none"></div>

        <div className="flex justify-center mb-6 md:mb-8">
          <div className="scale-75 md:scale-100">
            <Logo size={180} />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold font-amiri gradient-text mb-2 md:mb-4">
          متحف الفكر
        </h1>
        <p className="text-lg md:text-xl text-gray-300 font-amiri mb-6 md:mb-8">
          بوابة الإبداع الفكري لجامعة زيان عاشور بالجلفة
        </p>

        <div className="space-y-4 md:space-y-6 text-right font-light text-sm md:text-base text-gray-300 leading-relaxed bg-black/20 p-4 md:p-6 rounded-2xl">
          <p>
            <strong className="text-white block mb-1 md:mb-2 text-base md:text-lg">
              💡 الرؤية:
            </strong>
            متحف الفكر هو فضاء رقمي حر يهدف إلى جمع الأفكار الإبداعية والمقالات
            العلمية والخواطر الفلسفية في مكان واحد، ليكون مرجعاً لكل طالب وباحث
            عن المعرفة.
          </p>
          <p>
            <strong className="text-white block mb-1 md:mb-2 text-base md:text-lg">
              🚀 الرسالة:
            </strong>
            تمكين الطلبة والمفكرين من مشاركة إبداعاتهم، وتوفير بيئة تفاعلية
            راقية لتبادل الآراء وتطوير المهارات بعيداً عن ضوضاء منصات التواصل
            الاجتماعي التقليدية.
          </p>
        </div>

        <div className="mt-8 md:mt-10 grid grid-cols-2 gap-3 md:gap-4">
          <div className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/10">
            <Icons.User className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-pink-500" />
            <h3 className="font-bold text-sm md:text-base">تطوير</h3>
            <p className="text-[10px] md:text-xs text-gray-400">فريق MUF التقني</p>
          </div>
          <div className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/10">
            <Icons.Crown className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-yellow-400" />
            <h3 className="font-bold text-sm md:text-base">إشراف</h3>
            <p className="text-[10px] md:text-xs text-gray-400">جامعة الجلفة</p>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-500">
          الإصدار 2.0.0 &copy; 2025 جميع الحقوق محفوظة
        </div>
      </div>
    </div>
  );
};
