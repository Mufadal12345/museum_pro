import React, { useState } from "react";
import { useData } from "../../contexts/DataContext";
import { updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Icons } from "../../components/Icons";
import { useToast } from "../../contexts/ToastContext";
import { Modal } from "./Modal";
import { useAuth } from "../../contexts/AuthContext";

export const Messages: React.FC = () => {
  const { suggestions } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [filter, setFilter] = useState("all");

  // Reply State
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [replyText, setReplyText] = useState("");

  const filteredSuggestions = suggestions
    .filter((s) => filter === "all" || s.status === filter)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "suggestions", id), { status });
      showToast("تم تحديث حالة الرسالة", "success");
    } catch (e) {
      showToast("حدث خطأ", "error");
    }
  };

  const openReplyModal = (id: string) => {
    setSelectedMessageId(id);
    setReplyText("");
    setIsReplyModalOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedMessageId || !replyText.trim()) return;

    try {
      await updateDoc(doc(db, "suggestions", selectedMessageId), {
        status: "replied",
        replyContent: replyText,
        repliedBy: currentUser?.name || "الإدارة",
        repliedAt: new Date().toISOString(),
      });

      showToast("تم إرسال الرد بنجاح", "success");
      setIsReplyModalOpen(false);
      setReplyText("");
      setSelectedMessageId(null);
    } catch (e) {
      console.error(e);
      showToast("فشل إرسال الرد", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "suggestions", id));
      showToast("تم الحذف", "success");
    } catch (e) {
      showToast("فشل الحذف", "error");
    }
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-amiri gradient-text mb-2">
          الرسائل والمقترحات
        </h1>
        <p className="text-gray-400">تواصل الأعضاء ومقترحات التطوير</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {["all", "pending", "replied", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-bold border capitalize ${filter === f ? "bg-pink-500 text-white border-pink-500" : "border-white/10 text-gray-400 hover:bg-white/5"}`}
          >
            {f === "all"
              ? "الكل"
              : f === "pending"
                ? "قيد الانتظار"
                : f === "replied"
                  ? "تم الرد"
                  : "مرفوض"}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredSuggestions.map((msg) => (
          <div
            key={msg.id}
            className="glass-card p-5 rounded-2xl border-r-4 border-l-0 border-pink-500"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-white mb-1">
                  {msg.title}
                </h3>
                <div className="flex gap-2 text-xs text-gray-400">
                  <span>👤 {msg.author}</span>
                  <span>
                    • {new Date(msg.createdAt).toLocaleDateString("ar-EG")}
                  </span>
                  <span className="bg-white/10 px-2 rounded text-gray-300">
                    {msg.suggestionType || "عام"}
                  </span>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${msg.status === "pending" ? "bg-yellow-500/20 text-yellow-300" : msg.status === "replied" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}
              >
                {msg.status === "pending"
                  ? "انتظار"
                  : msg.status === "replied"
                    ? "تم الرد"
                    : "مرفوض"}
              </span>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed bg-black/20 p-3 rounded-xl mb-4">
              {msg.content}
            </p>

            {msg.replyContent && (
              <div className="mb-4 bg-green-500/5 border border-green-500/20 p-3 rounded-xl">
                <p className="text-xs text-green-400 font-bold mb-1">
                  الرد المرسل ({msg.repliedBy}):
                </p>
                <p className="text-sm text-gray-300">{msg.replyContent}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
              {msg.status !== "replied" && (
                <button
                  onClick={() => openReplyModal(msg.id)}
                  className="btn-primary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                >
                  <Icons.Message className="w-3 h-3 rotate-90" /> رد على الرسالة
                </button>
              )}

              {msg.status === "pending" && (
                <button
                  onClick={() => updateStatus(msg.id, "rejected")}
                  className="btn-secondary px-3 py-1.5 rounded-lg text-xs hover:bg-red-500/20 hover:text-red-300 flex items-center gap-1"
                >
                  <Icons.X className="w-3 h-3" /> رفض
                </button>
              )}

              <button
                onClick={() => handleDelete(msg.id)}
                className="text-gray-500 hover:text-red-500 p-1.5"
              >
                <Icons.Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredSuggestions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Icons.Message className="w-16 h-16 mx-auto mb-2 opacity-20" />
            <p>لا توجد رسائل</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        title="إرسال رد"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            سيظهر هذا الرد للمستخدم في قائمة مقترحاته.
          </p>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="اكتب ردك هنا..."
            className="input-style w-full h-32 p-4 rounded-xl resize-none"
          />
          <button
            onClick={handleSendReply}
            className="btn-primary w-full py-3 rounded-xl font-bold"
          >
            إرسال الرد 📤
          </button>
        </div>
      </Modal>
    </div>
  );
};
