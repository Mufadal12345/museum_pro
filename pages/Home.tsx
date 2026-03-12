import React, { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useNavigate } from "react-router-dom";
import { STATIC_CONTENT } from "../data/staticData";

export const Home: React.FC = () => {
  const { currentUser } = useAuth();
  const { ideas, now, users, comments, libraryItems } = useData();
  const navigate = useNavigate();

  // Use .getTime() to ensure correct arithmetic
  const latest = useMemo(() => {
    const dbIdeaIds = new Set(ideas.map((i) => i.id));
    const activeStatic = STATIC_CONTENT.filter((s) => !dbIdeaIds.has(s.id));
    const all = [...ideas, ...activeStatic];

    return all
      .filter(
        (i) => !i.showAfter || new Date(i.showAfter).getTime() <= now.getTime(),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 4);
  }, [ideas, now]);

  return (
    <div className="animate-fade-in p-2 md:p-8">
      <div className="glass rounded-3xl p-6 md:p-10 lg:p-12 mb-8 md:mb-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent/10 to-transparent"></div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 font-amiri gradient-text">
          مرحباً، {currentUser?.name}
        </h2>
        <p className="text-sm md:text-base text-gray-400 font-tajawal max-w-2xl mx-auto">
          أهلاً بك في فضاء جامعة زيان عاشور بالجلفة الفكري. هنا تُحفظ الأفكار
          وتُبنى العقول.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
        {[
          { l: "الأفكار والمقالات", v: ideas.length + STATIC_CONTENT.length, i: "💡" },
          { l: "المكتبة", v: libraryItems.length, i: "📚" },
          { l: "الأعضاء", v: users.length, i: "👥" },
          { l: "التعليقات", v: comments.length, i: "💬" },
        ].map((s) => (
          <div
            key={s.l}
            className="glass p-4 md:p-6 rounded-2xl border border-white/5 text-center card-hover"
          >
            <span className="text-2xl md:text-3xl block mb-2">{s.i}</span>
            <p className="text-gray-400 text-[10px] md:text-xs mb-1 font-tajawal">{s.l}</p>
            <p className="text-xl md:text-2xl font-bold text-white">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h3 className="text-xl md:text-2xl font-bold font-amiri">أحدث المقالات</h3>
        <button
          onClick={() => navigate("/ideas")}
          className="text-accent text-sm md:text-base font-bold hover:underline"
        >
          عرض الكل ←
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {latest.map((l) => (
          <div
            key={l.id}
            onClick={() => navigate("/feed")}
            className="glass rounded-2xl p-5 md:p-6 card-hover cursor-pointer border border-white/5 group h-full flex flex-col"
          >
            <div className="flex justify-between mb-3">
              <span className="bg-white/10 text-accent text-[9px] md:text-[10px] font-bold px-2 py-1 rounded">
                {l.category}
              </span>
              <span className="text-[9px] md:text-[10px] text-gray-500">
                {new Date(l.createdAt).toLocaleDateString("ar-EG")}
              </span>
            </div>
            <h4 className="font-bold font-amiri text-lg md:text-xl mb-2 md:mb-3 group-hover:text-accent transition-colors line-clamp-2">
              {l.title}
            </h4>
            <p className="text-gray-400 text-xs md:text-sm font-tajawal leading-relaxed line-clamp-3 mb-4 flex-grow">
              {l.content}
            </p>
            <div className="flex items-center gap-2 border-t border-white/5 pt-4 mt-auto">
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[8px] overflow-hidden">
                {users.find(u => u.id === l.authorId)?.photoURL ? (
                  <img src={users.find(u => u.id === l.authorId)?.photoURL} alt={l.author} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  "👤"
                )}
              </div>
              <span className="text-[10px] font-bold text-gray-400">
                {l.author}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
