import React, { useState, useMemo } from "react";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { Modal } from "./admin/Modal";
import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { STATIC_QUOTES } from "../data/staticData";

export const Quotes: React.FC = () => {
  const { quotes } = useData();
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");

  const displayQuotes = useMemo(() => {
    const dbQuoteTexts = new Set(quotes.map((q) => q.text));
    const activeStatic = STATIC_QUOTES.filter((s) => !dbQuoteTexts.has(s.text));
    return [...activeStatic, ...quotes];
  }, [quotes]);

  const handleSubmit = async () => {
    if (!text || !author) return;
    await addDoc(collection(db, "quotes"), {
      text,
      author,
      addedBy: currentUser?.name,
      isDefault: false,
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(false);
    setText("");
    setAuthor("");
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith("static")) return;
    try {
      await deleteDoc(doc(db, "quotes", id));
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  return (
    <div className="h-full flex flex-col relative animate-fade-in">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-emerald-600 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob"></div>
      </div>

      <header className="p-2 md:p-6 pb-2 flex justify-between items-center mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white neon-text font-tajawal">
            عبارات ملهمة
          </h1>
          <p className="text-gray-400 text-xs md:text-sm">كلمات تخلد في الذاكرة</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-accent hover:bg-pink-600 text-white px-4 py-2 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-bold shadow-lg transition transform active:scale-95 flex items-center gap-2"
        >
          <i className="fas fa-plus"></i> <span className="hidden sm:inline">إضافة</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-2 md:p-6 pt-0 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {displayQuotes.map((quote) => (
            <div
              key={quote.id}
              className="glass p-6 rounded-2xl relative card-hover group flex flex-col justify-center text-center min-h-[200px]"
            >
              <div className="absolute top-4 right-4 text-4xl text-white/10 font-serif group-hover:text-accent/30 transition-colors">
                <i className="fas fa-quote-right"></i>
              </div>

              <p className="text-xl md:text-2xl font-amiri leading-loose text-white mb-6 relative z-10">
                "{quote.text}"
              </p>

              <div className="flex justify-center items-center gap-2 mt-auto">
                <span className="h-px w-8 bg-accent/50"></span>
                <span className="text-sm text-accent font-bold font-tajawal">
                  {quote.author}
                </span>
                <span className="h-px w-8 bg-accent/50"></span>
              </div>

              {currentUser?.role === "admin" &&
                !quote.id.startsWith("static") && (
                  <button
                    onClick={() => handleDelete(quote.id)}
                    className="absolute top-4 left-4 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة عبارة جديدة"
      >
        <div className="space-y-4 font-tajawal">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="نص العبارة..."
            className="input-style w-full px-4 py-3 rounded-xl h-32 resize-none font-amiri text-lg"
          ></textarea>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            type="text"
            placeholder="القائل"
            className="input-style w-full px-4 py-3 rounded-xl"
          />
          <button
            onClick={handleSubmit}
            className="btn-primary w-full py-3 rounded-xl font-bold"
          >
            حفظ
          </button>
        </div>
      </Modal>
    </div>
  );
};
