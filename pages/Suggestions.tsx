import React, { useState } from "react";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Icons } from "../components/Icons";

export const Suggestions: React.FC = () => {
  const { currentUser } = useAuth();
  const { suggestions, messages } = useData();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("اقتراح");
  const [activeTab, setActiveTab] = useState<"suggestions" | "inbox">("suggestions");

  // Only show user's own suggestions unless admin
  const mySuggestions =
    currentUser?.role === "admin"
      ? suggestions
      : suggestions.filter(
          (s) =>
            s.authorId === currentUser?.id || s.author === currentUser?.name,
        );

  const myMessages = messages.filter((m) => m.toUserId === currentUser?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !currentUser) return;

    try {
      await addDoc(collection(db, "suggestions"), {
        title,
        content,
        type,
        suggestionType: type,
        author: currentUser.name,
        authorId: currentUser.id,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      setTitle("");
      setContent("");
      showToast("تم إرسال مقترحك بنجاح", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "suggestions");
    }
  };

  const markAsRead = async (msgId: string) => {
    try {
      await updateDoc(doc(db, "messages", msgId), { read: true });
    } catch (error) {
      console.error("Error marking message as read", error);
    }
  };

  return (
    <div className="animate-fade-in pb-20 max-w-4xl mx-auto font-tajawal">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-2 font-amiri">الرسائل والمقترحات</h2>
        <p className="text-gray-400 text-sm md:text-base">
          تواصل مع الإدارة وشاركنا أفكارك
        </p>
      </div>

      <div className="flex gap-2 md:gap-4 mb-6 md:mb-8 border-b border-white/10 pb-4 justify-center">
        <button
          onClick={() => setActiveTab("suggestions")}
          className={`px-4 py-2 md:px-6 md:py-2 rounded-full text-sm md:text-base font-bold transition-all ${activeTab === "suggestions" ? "bg-accent text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
        >
          مقترحاتي
        </button>
        <button
          onClick={() => setActiveTab("inbox")}
          className={`px-4 py-2 md:px-6 md:py-2 rounded-full text-sm md:text-base font-bold transition-all relative ${activeTab === "inbox" ? "bg-accent text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
        >
          صندوق الوارد
          {myMessages.filter(m => !m.read).length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
              {myMessages.filter(m => !m.read).length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "suggestions" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-2xl">📝</span> نموذج المقترحات
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  نوع الرسالة
                </label>
                <div className="flex gap-2">
                  {["اقتراح", "شكوى", "فكرة تطوير"].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${type === t ? "bg-pink-500 border-pink-500 text-white" : "border-white/10 hover:bg-white/5"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                placeholder="الموضوع"
                className="input-style w-full px-4 py-3 rounded-xl"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="التفاصيل..."
                className="input-style w-full px-4 py-3 rounded-xl h-40 resize-none"
              ></textarea>
              <button
                type="submit"
                className="btn-primary w-full py-3 rounded-xl font-bold shadow-lg"
              >
                إرسال
              </button>
            </form>
          </div>

          {/* List */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="text-2xl">🗂️</span> مقترحاتي السابقة
            </h3>
            {mySuggestions.length === 0 ? (
              <div className="text-center py-10 text-gray-500 glass-card rounded-2xl border-dashed border-2 border-white/10">
                <Icons.Message className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>لم ترسل أي مقترحات بعد</p>
              </div>
            ) : (
              mySuggestions
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .map((s) => (
                  <div
                    key={s.id}
                    className="glass-card p-4 rounded-xl border-r-4 border-l-0 border-pink-500"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-300">
                        {s.suggestionType}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          s.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : s.status === "replied"
                              ? "bg-green-500/20 text-green-300"
                              : s.status === "rejected"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-gray-500/20"
                        }`}
                      >
                        {s.status === "pending"
                          ? "قيد المراجعة"
                          : s.status === "replied"
                            ? "تم الرد"
                            : s.status === "rejected"
                              ? "مرفوض"
                              : s.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-white mb-1">{s.title}</h4>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {s.content}
                    </p>
                    <div className="mt-2 text-[10px] text-gray-600">
                      {new Date(s.createdAt).toLocaleDateString("ar-EG")}
                    </div>

                    {s.replyContent && (
                      <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3 animate-fade-in">
                        <div className="flex items-center gap-2 mb-1">
                          <Icons.User className="w-3 h-3 text-green-400" />
                          <span className="text-xs font-bold text-green-400">
                            رد الإدارة ({s.repliedBy || "مشرف"})
                          </span>
                        </div>
                        <p className="text-sm text-gray-200">{s.replyContent}</p>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl mx-auto">
          {myMessages.length === 0 ? (
            <div className="text-center py-10 text-gray-500 glass-card rounded-2xl border-dashed border-2 border-white/10">
              <Icons.Message className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>لا توجد رسائل واردة</p>
            </div>
          ) : (
            myMessages
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => !msg.read && markAsRead(msg.id)}
                  className={`glass-card p-6 rounded-2xl transition-all cursor-pointer ${!msg.read ? "border-r-4 border-l-0 border-accent bg-white/10" : "border border-white/5 opacity-80"}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
                        <Icons.Crown className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{msg.from || "الإدارة"}</h4>
                        <p className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleDateString("ar-EG", { dateStyle: "long" })}</p>
                      </div>
                    </div>
                    {!msg.read && (
                      <span className="bg-accent text-white text-[10px] px-2 py-1 rounded-full font-bold animate-pulse">جديد</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 font-amiri">{msg.title}</h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
};
