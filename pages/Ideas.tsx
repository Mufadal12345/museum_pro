import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useToast } from "../contexts/ToastContext";
import { CATEGORY_ICONS, IdeaComment } from "../types";
import { Modal } from "./admin/Modal";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  setDoc,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { STATIC_CONTENT } from "../data/staticData";
import { Icons } from "../components/Icons";

export const Ideas: React.FC = () => {
  const { currentUser } = useAuth();
  const { ideas, comments, now, users, follows } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [searchTerm] = useState("");
  const [sortBy] = useState<"newest" | "popular" | "featured">(
    "newest",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("فلسفة");
  const [content, setContent] = useState("");
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [expandedIdeas, setExpandedIdeas] = useState<Set<string>>(new Set());
  const [deletingIdeaId, setDeletingIdeaId] = useState<string | null>(null);

  // Pagination State
  const [displayCount, setDisplayCount] = useState(20);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setDisplayCount(20);
  }, [filter, searchTerm]);

  // Merge Static Content with DB Ideas & Apply Filters
  const filteredIdeas = useMemo(() => {
    const dbIdeaIds = new Set(ideas.map((i) => i.id));
    const activeStatic = STATIC_CONTENT.filter(
      (staticIdea) => !dbIdeaIds.has(staticIdea.id),
    );

    let all = [...ideas, ...activeStatic];
    all = all.filter(
      (i) =>
        !i.deleted &&
        (!i.showAfter || new Date(i.showAfter).getTime() <= now.getTime()),
    );

    all.sort((a, b) => {
      if (sortBy === "popular") {
        return b.views + b.likes * 2 - (a.views + a.likes * 2);
      }
      if (sortBy === "featured") {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
      }
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return (dateB || 0) - (dateA || 0);
    });

    if (filter !== "all") {
      all = all.filter((i) => i.category === filter);
    }

    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      all = all.filter(
        (i) =>
          (i.title && i.title.toLowerCase().includes(lowerTerm)) ||
          (i.content && i.content.toLowerCase().includes(lowerTerm)) ||
          (i.author && i.author.toLowerCase().includes(lowerTerm)),
      );
    }

    return all;
  }, [ideas, filter, searchTerm, sortBy, now]);

  const visibleIdeas = filteredIdeas.slice(0, displayCount);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedIdeas);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIdeas(newExpanded);
  };

  const handleFollow = async (e: React.MouseEvent, targetUserId: string) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast("يجب تسجيل الدخول للمتابعة", "info");
      return;
    }
    if (currentUser.id === targetUserId) return;

    const isFollowing = follows.some(
      (f) => f.followerId === currentUser.id && f.followingId === targetUserId,
    );

    try {
      if (isFollowing) {
        const q = query(
          collection(db, "follows"),
          where("followerId", "==", currentUser.id),
          where("followingId", "==", targetUserId),
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await deleteDoc(doc(db, "follows", d.id));
        }

        const targetUser = users.find((u) => u.id === targetUserId);
        await updateDoc(doc(db, "users", targetUserId), {
          followersCount: Math.max(0, (targetUser?.followersCount || 0) - 1),
        });
        await updateDoc(doc(db, "users", currentUser.id), {
          followingCount: Math.max(0, (currentUser?.followingCount || 0) - 1),
        });
      } else {
        await addDoc(collection(db, "follows"), {
          followerId: currentUser.id,
          followingId: targetUserId,
          createdAt: new Date().toISOString(),
        });

        const targetUser = users.find((u) => u.id === targetUserId);
        await updateDoc(doc(db, "users", targetUserId), {
          followersCount: (targetUser?.followersCount || 0) + 1,
        });
        await updateDoc(doc(db, "users", currentUser.id), {
          followingCount: (currentUser?.followingCount || 0) + 1,
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "follows/users");
      showToast("حدث خطأ", "error");
    }
  };

  const handleSelectIdea = (id: string) => {
    setSelectedIdeaId(id);
    if (currentUser && !id.startsWith("static")) {
      const idea = ideas.find((i) => i.id === id);
      if (idea) {
        const viewedBy = idea.viewedBy || [];
        if (!viewedBy.includes(currentUser.id)) {
          const ref = doc(db, "ideas", id);
          updateDoc(ref, {
            views: (idea.views || 0) + 1,
            viewedBy: [...viewedBy, currentUser.id],
          }).catch(console.error);
        }
      }
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !selectedIdeaId || !currentUser) return;
    if (currentUser.isBanned) {
      showToast("حسابك محظور من التعليق", "error");
      return;
    }
    try {
      await addDoc(collection(db, "comments"), {
        targetId: selectedIdeaId,
        targetType: "idea",
        text: commentText,
        userId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        likes: 0,
        likedBy: [],
        parentCommentId: replyingToCommentId,
        replies: 0,
        deleted: false,
        createdAt: new Date().toISOString(),
      });
      setCommentText("");
      setReplyingToCommentId(null);
      showToast("تم إضافة التعليق", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "comments");
      showToast("فشل إرسال التعليق", "error");
    }
  };

  const handleSubmit = async () => {
    if (!title || !content || !currentUser) return;
    if (currentUser.isBanned) {
      showToast("حسابك محظور من النشر", "error");
      return;
    }
    try {
      await addDoc(collection(db, "ideas"), {
        title,
        category,
        content,
        author: currentUser.name,
        authorId: currentUser.id,
        authorRole: currentUser.role,
        views: 0,
        viewedBy: [],
        likes: 0,
        likedBy: [],
        featured: false,
        deleted: false,
        createdAt: new Date().toISOString(),
      });
      setIsModalOpen(false);
      setTitle("");
      setContent("");
      showToast("تم إضافة الفكرة بنجاح", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "ideas");
      showToast("حدث خطأ أثناء النشر", "error");
    }
  };

  const handleLike = async (e: React.MouseEvent, idea: any) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast("يجب تسجيل الدخول للإعجاب", "info");
      return;
    }

    const currentLikes = idea.likes || 0;
    let likedArray: string[] = Array.isArray(idea.likedBy) ? idea.likedBy : [];
    const isLiked = likedArray.includes(currentUser.id);

    try {
      if (idea.id.startsWith("static")) {
        await setDoc(doc(db, "ideas", idea.id), {
          ...idea,
          likes: 1,
          likedBy: [currentUser.id],
          views: (idea.views || 0) + 1,
          viewedBy: [currentUser.id],
          promotedFromStatic: true,
        });
      } else {
        let newLikedArray = isLiked
          ? likedArray.filter((id) => id !== currentUser.id)
          : [...likedArray, currentUser.id];
        let newLikes = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

        await updateDoc(doc(db, "ideas", idea.id), {
          likes: newLikes,
          likedBy: newLikedArray,
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "ideas");
      showToast("حدث خطأ", "error");
    }
  };

  return (
    <div className="animate-fade-in font-tajawal pb-24">
      <header className="mb-8 max-w-2xl mx-auto w-full">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white neon-text font-amiri mb-2">
              معرض الأفكار
            </h1>
            <p className="text-gray-400 text-xs md:text-sm">تواصل مع العقول المبدعة</p>
          </div>

          <div className="flex gap-3 md:gap-4 items-center bg-white/5 p-3 md:p-4 rounded-3xl border border-white/10">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-[#0a0f1f] flex items-center justify-center">
                <Icons.User className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 text-right px-4 py-2 md:px-6 md:py-3 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 text-xs md:text-sm transition-all border border-white/10 hover:border-white/20 shadow-inner flex justify-between items-center"
            >
              <span>بماذا تفكر يا {currentUser?.name || "مبدع"}؟</span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Icons.Plus className="w-4 h-4 text-white" />
              </div>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-full text-xs transition ${filter === "all" ? "bg-accent text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
            >
              الكل
            </button>
            {Object.keys(CATEGORY_ICONS).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs transition ${filter === cat ? "bg-accent text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 left-6 md:bottom-12 md:left-12 z-40 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-pink-500 to-orange-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.4)] hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] hover:scale-110 transition-all duration-300 group"
      >
        <Icons.Plus className="w-6 h-6 md:w-8 md:h-8 group-hover:rotate-90 transition-transform duration-300" />
        <span className="absolute right-full mr-4 bg-[#0f1020] text-white px-4 py-2 rounded-xl text-xs md:text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 shadow-xl">
          إضافة فكرة جديدة
        </span>
      </button>

      <div className="max-w-2xl mx-auto space-y-6">
        {visibleIdeas.map((idea) => {
            const isLiked = currentUser && idea.likedBy?.includes(currentUser.id);
            const isFollowing = follows.some(
              (f) => f.followerId === currentUser?.id && f.followingId === idea.authorId,
            );
            const isExpanded = expandedIdeas.has(idea.id);
            const displayContent = isExpanded
              ? idea.content
              : idea.content.slice(0, 300);
            const hasMore = idea.content.length > 300;

            return (
              <div
                key={idea.id}
                className="glass-card rounded-3xl overflow-hidden border border-white/10 bg-white/5 transition-all shadow-2xl"
              >
                {/* Post Header */}
                <div className="p-4 md:p-6 flex justify-between items-center">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div
                      onClick={() => navigate(`/profile/${idea.authorId}`)}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 p-[2px] cursor-pointer"
                    >
                      <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center overflow-hidden">
                        {users.find(u => u.id === idea.authorId)?.photoURL ? (
                          <img src={users.find(u => u.id === idea.authorId)?.photoURL} alt={idea.author} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Icons.User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <h4
                          onClick={() => navigate(`/profile/${idea.authorId}`)}
                          className="font-bold text-sm md:text-base text-white hover:text-accent cursor-pointer transition-colors"
                        >
                          {idea.author}
                        </h4>
                        {idea.authorRole === "admin" && (
                          <Icons.Crown className="w-3 h-3 text-yellow-400" />
                        )}
                        {currentUser && idea.authorId !== currentUser.id && (
                          <button
                            onClick={(e) => handleFollow(e, idea.authorId)}
                            className={`text-[10px] font-bold px-3 py-0.5 rounded-full transition-all ${isFollowing ? "text-gray-500 border border-white/10" : "text-accent border border-accent/30 hover:bg-accent/10"}`}
                          >
                            {isFollowing ? "متابع" : "متابعة"}
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500">
                        {new Date(idea.createdAt).toLocaleDateString("ar-EG", {
                          dateStyle: "medium",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-white/5 px-3 py-1 rounded-full text-gray-400 border border-white/10">
                      {idea.category}
                    </span>
                    {(currentUser?.role === "admin" || currentUser?.id === idea.authorId) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingIdeaId(idea.id);
                        }}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <Icons.Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-6 pb-4" onClick={() => handleSelectIdea(idea.id)}>
                  <h3 className="text-xl font-bold text-white mb-3 font-amiri leading-tight">
                    {idea.title}
                  </h3>
                  <div className="text-gray-300 leading-relaxed font-tajawal whitespace-pre-wrap">
                    {displayContent}
                    {hasMore && !isExpanded && "..."}
                  </div>
                  {hasMore && (
                    <button
                      onClick={(e) => toggleExpand(e, idea.id)}
                      className="text-accent text-sm font-bold mt-2 hover:underline"
                    >
                      {isExpanded ? "عرض أقل" : "عرض المزيد"}
                    </button>
                  )}
                </div>

                {/* Post Footer */}
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={(e) => handleLike(e, idea)}
                      className={`flex items-center gap-2 transition-all transform active:scale-90 ${isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}
                    >
                      <Icons.Heart
                        className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
                      />
                      <span className="font-bold text-sm">{idea.likes || 0}</span>
                    </button>
                    <button
                      onClick={() => handleSelectIdea(idea.id)}
                      className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
                    >
                      <Icons.Message className="w-5 h-5 rotate-90" />
                      <span className="font-bold text-sm">
                        {comments.filter((c) => (c.targetId === idea.id || c.ideaId === idea.id) && !c.deleted).length}
                      </span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-600">
                    <Icons.Eye className="w-4 h-4" />
                    <span>{idea.views || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {displayCount < filteredIdeas.length && (
            <div className="text-center pt-4">
              <button
                onClick={() => setDisplayCount((prev) => prev + 20)}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-bold transition-all text-white"
              >
                عرض المزيد
              </button>
            </div>
          )}
        </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة فكرة جديدة"
      >
        <div className="space-y-4 font-tajawal">
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2">العنوان</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              type="text"
              placeholder="اكتب عنواناً جذاباً..."
              className="input-style w-full px-4 py-3 rounded-xl font-bold"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2">التصنيف</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-style w-full px-4 py-3 rounded-xl appearance-none bg-[#0f172a]"
            >
              {Object.keys(CATEGORY_ICONS).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2">المحتوى</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="شارك أفكارك..."
              className="input-style w-full px-4 py-3 rounded-xl h-48 resize-none leading-relaxed"
            ></textarea>
          </div>
          <button
            onClick={handleSubmit}
            className="btn-primary w-full py-3 rounded-xl font-bold text-lg shadow-lg mt-2 transition-all active:scale-95"
          >
            نشر الفكرة ✨
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!deletingIdeaId}
        onClose={() => setDeletingIdeaId(null)}
        title="تأكيد الحذف"
      >
        <div className="p-4 text-center">
          <p className="text-white mb-6">هل أنت متأكد من حذف هذه الفكرة؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setDeletingIdeaId(null)}
              className="px-6 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
            >
              إلغاء
            </button>
            <button
              onClick={async () => {
                if (!deletingIdeaId) return;
                try {
                  await deleteDoc(doc(db, "ideas", deletingIdeaId));
                  showToast("تم حذف الفكرة بنجاح", "success");
                  setDeletingIdeaId(null);
                } catch (err) {
                  handleFirestoreError(err, OperationType.DELETE, "ideas");
                  showToast("حدث خطأ أثناء الحذف", "error");
                }
              }}
              className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-500/20"
            >
              حذف نهائي
            </button>
          </div>
        </div>
      </Modal>

      {/* Idea Detail Modal (Overlay) */}
      {selectedIdeaId && (
        <div className="fixed inset-0 z-[60] bg-[#0f1020]/95 backdrop-blur-xl flex flex-col md:flex-row animate-fade-in font-tajawal overflow-hidden">
          <button
            onClick={() => setSelectedIdeaId(null)}
            className="absolute top-4 left-4 z-[70] w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition shadow-lg"
          >
            <Icons.X className="w-5 h-5" />
          </button>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 relative">
            {(() => {
              const idea = filteredIdeas.find((i) => i.id === selectedIdeaId);
              if (!idea) return null;
              const currentComments = comments.filter(
                (c) => (c.targetId === selectedIdeaId || c.ideaId === selectedIdeaId) && !c.deleted,
              );

              return (
                <div className="max-w-3xl mx-auto pt-10">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-bold mb-6 border border-accent/30 tracking-wide">
                    {CATEGORY_ICONS[idea.category]} {idea.category}
                  </span>

                  <h1 className="text-4xl md:text-6xl font-bold font-amiri text-white mb-8 leading-tight neon-text">
                    {idea.title}
                  </h1>

                  <div className="flex items-center gap-4 mb-10 pb-10 border-b border-white/10">
                    <div
                      onClick={() => {
                        setSelectedIdeaId(null);
                        navigate(`/profile/${idea.authorId}`);
                      }}
                      className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-[2px] shadow-xl cursor-pointer"
                    >
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                        {users.find(u => u.id === idea.authorId)?.photoURL ? (
                          <img src={users.find(u => u.id === idea.authorId)?.photoURL} alt={idea.author} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Icons.User className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <h4
                        onClick={() => {
                          setSelectedIdeaId(null);
                          navigate(`/profile/${idea.authorId}`);
                        }}
                        className="font-bold text-white text-xl hover:text-accent cursor-pointer transition-colors"
                      >
                        {idea.author}
                      </h4>
                      <p className="text-sm text-gray-400 font-tajawal">
                        {new Date(idea.createdAt).toLocaleDateString("ar-EG", {
                          dateStyle: "long",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="prose prose-invert prose-xl max-w-none font-amiri leading-relaxed text-gray-200 mb-12 whitespace-pre-wrap">
                    {idea.content}
                  </div>

                  <div className="flex items-center gap-8 py-8 border-t border-b border-white/10">
                    <button
                      onClick={(e) => handleLike(e, idea)}
                      className={`flex items-center gap-3 text-xl font-bold transition-all transform active:scale-90 ${currentUser && idea.likedBy?.includes(currentUser.id) ? "text-red-500" : "text-white hover:text-red-500"}`}
                    >
                      <Icons.Heart
                        className={`w-6 h-6 ${currentUser && idea.likedBy?.includes(currentUser.id) ? "fill-current" : ""}`}
                      />
                      <span>{idea.likes}</span>
                    </button>
                    <div className="flex items-center gap-3 text-xl text-white font-bold">
                      <Icons.Message className="w-6 h-6 rotate-90" />
                      <span>{currentComments.length}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xl text-white font-bold">
                      <Icons.Eye className="w-6 h-6" />
                      <span>{idea.views}</span>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="mt-10">
                    <h3 className="font-bold text-2xl text-white mb-6">التعليقات</h3>
                    <div className="space-y-6 mb-10">
                      {currentComments.filter(c => !c.parentCommentId).map((comment) => (
                        <CommentItem 
                          key={comment.id} 
                          comment={comment} 
                          allComments={currentComments} 
                          onReply={(id) => setReplyingToCommentId(id)}
                        />
                      ))}
                      {currentComments.length === 0 && (
                        <p className="text-gray-500 text-center py-4">لا توجد تعليقات بعد</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sticky bottom-6 bg-[#0f1020]/80 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                      {replyingToCommentId && (
                        <div className="flex justify-between items-center text-xs text-accent px-2">
                          <span>رد على تعليق</span>
                          <button onClick={() => setReplyingToCommentId(null)}><Icons.X className="w-3 h-3"/></button>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <input
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                          className="input-style flex-1 rounded-full px-6 py-3"
                          placeholder={replyingToCommentId ? "اكتب رداً..." : "اكتب تعليقاً..."}
                        />
                        <button
                          onClick={handleSendComment}
                          className="w-12 h-12 bg-accent rounded-full text-white flex items-center justify-center shadow-lg shadow-accent/20 hover:scale-110 transition-transform"
                        >
                          <Icons.Share className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

const CommentItem: React.FC<{ comment: IdeaComment, allComments: IdeaComment[], onReply: (id: string) => void }> = ({ comment, allComments, onReply }) => {
  const replies = allComments.filter(c => c.parentCommentId === comment.id);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { users } = useData();
  const { showToast } = useToast();

  const handleDeleteComment = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("هل أنت متأكد من حذف هذا التعليق؟")) return;
    try {
      await updateDoc(doc(db, "comments", comment.id), { deleted: true });
      showToast("تم حذف التعليق", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "comments");
      showToast("فشل حذف التعليق", "error");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4 group">
        <div
          onClick={() => navigate(`/profile/${comment.userId}`)}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white border border-white/10 cursor-pointer overflow-hidden"
        >
          {users.find(u => u.id === comment.userId)?.photoURL ? (
            <img src={users.find(u => u.id === comment.userId)?.photoURL} alt={comment.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            comment.authorName[0]
          )}
        </div>
        <div className="flex-1">
          <div className="bg-white/5 p-4 rounded-3xl rounded-tr-none border border-white/5 group-hover:bg-white/10 transition-colors relative">
            <span
              onClick={() => navigate(`/profile/${comment.userId}`)}
              className="font-bold text-sm text-accent block mb-1 cursor-pointer hover:underline"
            >
              {comment.authorName}
            </span>
            <p className="text-gray-200 leading-relaxed">{comment.text}</p>
            
            {(currentUser?.role === "admin" || currentUser?.id === comment.userId) && (
              <button 
                onClick={handleDeleteComment}
                className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500"
              >
                <Icons.Trash className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 mr-2">
            <span className="text-[10px] text-gray-500 font-mono">
              {new Date(comment.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <button onClick={() => onReply(comment.id)} className="text-[10px] text-accent font-bold hover:underline">رد</button>
          </div>
        </div>
      </div>
      {replies.length > 0 && (
        <div className="mr-12 space-y-4 border-r border-white/10 pr-4">
          {replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} allComments={allComments} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
};
