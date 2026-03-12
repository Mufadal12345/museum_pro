import React, { useMemo } from "react";
import { useData } from "../contexts/DataContext";
import { useNavigate } from "react-router-dom";
import { STATIC_CONTENT } from "../data/staticData";

export const Philosophy: React.FC = () => {
  const { ideas, now } = useData();
  const navigate = useNavigate();

  const philosophyIdeas = useMemo(() => {
    const dbIdeaIds = new Set(ideas.map((i) => i.id));
    const activeStatic = STATIC_CONTENT.filter((s) => !dbIdeaIds.has(s.id));
    const allContent = [...ideas, ...activeStatic];
    return allContent.filter(
      (i) =>
        !i.deleted &&
        i.category === "فلسفة" &&
        (!i.showAfter || new Date(i.showAfter).getTime() <= now.getTime()),
    );
  }, [ideas, now]);

  return (
    <div className="h-full flex flex-col relative animate-fade-in">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-purple-900/20 to-transparent"></div>
      </div>

      <div className="relative rounded-2xl overflow-hidden mb-6 md:mb-8 mx-2 md:mx-6 mt-2 h-48 md:h-64 border border-white/10 group">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-indigo-950"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center z-10 px-4">
            <i className="fas fa-brain text-4xl md:text-5xl text-yellow-400 mb-3 md:mb-4 animate-pulse"></i>
            <h1 className="text-3xl md:text-5xl font-bold font-amiri mb-1 md:mb-2 text-white neon-text">
              رواق الفلسفة
            </h1>
            <p className="text-gray-300 font-amiri text-sm md:text-lg opacity-80">
              "الحكمة هي ضالة المؤمن، أنى وجدها فهو أحق بها"
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 md:p-6 pt-0 custom-scrollbar">
        <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto pb-20">
          {philosophyIdeas.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate("/feed")}
              className="glass p-6 rounded-2xl cursor-pointer card-hover border-r-4 border-l-0 border-yellow-500 relative overflow-hidden group"
            >
              <div className="absolute -right-10 -top-10 text-9xl text-white/5 group-hover:text-white/10 transition-colors rotate-12">
                <i className="fas fa-quote-right"></i>
              </div>

              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 relative z-10">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white shadow-lg text-sm md:text-base">
                  <i className="fas fa-lightbulb"></i>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm md:text-base">{item.author}</h3>
                  <p className="text-[10px] md:text-xs text-gray-400">فيلسوف / مفكر</p>
                </div>
              </div>

              <h2 className="text-lg md:text-2xl font-bold font-amiri mb-2 md:mb-3 text-white group-hover:text-yellow-400 transition-colors relative z-10">
                {item.title}
              </h2>
              <p className="text-gray-300 leading-relaxed md:leading-loose text-sm md:text-lg font-amiri pl-3 md:pl-4 border-l border-white/10 relative z-10 line-clamp-4">
                {item.content}
              </p>

              <div className="mt-3 md:mt-4 flex justify-end gap-3 md:gap-4 text-xs md:text-sm text-gray-500 relative z-10">
                <span className="flex items-center gap-2 hover:text-red-400 transition">
                  <i className="far fa-heart"></i> {item.likes}
                </span>
                <span className="flex items-center gap-2 hover:text-blue-400 transition">
                  <i className="far fa-share-square"></i> مشاركة
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
