import React, { useState, useRef, useEffect } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";
import { Icons } from "../../components/Icons";

export const AdminChat: React.FC = () => {
  const { adminChats, users } = useData();
  const { currentUser } = useAuth();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [adminChats]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser) return;

    try {
      await addDoc(collection(db, "admin_chats"), {
        text: message.trim(),
        authorId: currentUser.id,
        authorName: currentUser.name,
        createdAt: new Date().toISOString(),
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Sort messages chronologically
  const sortedChats = [...adminChats].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col glass-card rounded-3xl overflow-hidden font-tajawal">
      <header className="p-6 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Icons.Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">دردشة المديرين</h1>
            <p className="text-sm text-gray-400">مساحة خاصة للنقاش بين المديرين</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {sortedChats.map((chat) => {
          const isMe = chat.authorId === currentUser?.id;
          return (
            <div
              key={chat.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 mb-1 px-2">
                {!isMe && (
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {users.find(u => u.id === chat.authorId)?.photoURL ? (
                      <img src={users.find(u => u.id === chat.authorId)?.photoURL} alt={chat.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[10px] text-gray-400 font-bold">{chat.authorName[0]}</span>
                    )}
                  </div>
                )}
                <span className="text-xs text-gray-400">
                  {chat.authorName}
                </span>
                {isMe && (
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {users.find(u => u.id === chat.authorId)?.photoURL ? (
                      <img src={users.find(u => u.id === chat.authorId)?.photoURL} alt={chat.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[10px] text-gray-400 font-bold">{chat.authorName[0]}</span>
                    )}
                  </div>
                )}
              </div>
              <div
                className={`max-w-[80%] md:max-w-[60%] p-4 rounded-2xl ${
                  isMe
                    ? "bg-accent text-white rounded-tr-none"
                    : "bg-white/10 text-gray-200 rounded-tl-none"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{chat.text}</p>
              </div>
              <span className="text-[10px] text-gray-500 mt-1 px-2">
                {new Date(chat.createdAt).toLocaleTimeString("ar-EG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10 bg-white/5">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            className="input-style flex-1 rounded-full px-6 py-3"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
          >
            <Icons.Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
