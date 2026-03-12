import React, { useState, useMemo } from "react";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Icons } from "../components/Icons";
import { db, handleFirestoreError, OperationType, storage } from "../firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove,
  increment 
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { LibraryItem } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import imageCompression from "browser-image-compression";
import { 
  Book, 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ExternalLink,
  ThumbsUp,
  MessageSquare,
  Trash2,
  X,
  FileText,
  CheckCircle
} from "lucide-react";

export const Content: React.FC = () => {
  const { libraryItems, comments, users } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"book" | "image">("book");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [commentText, setCommentText] = useState("");
  
  const bookCategories = ["الكل", "أدب", "فلسفة", "علوم", "تاريخ", "فن", "تقنية", "أخرى"];
  const imageCategories = ["الكل", "رسم", "تصوير", "رقمي", "خط عربي", "أخرى"];

  // Form state for adding new content
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    type: "book" as "book" | "image",
    category: "أخرى",
    fileUrl: "",
    thumbnailUrl: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const filteredItems = useMemo(() => {
    return libraryItems
      .filter(item => !item.deleted)
      .filter(item => item.type === activeTab)
      .filter(item => activeCategory === "الكل" || item.category === activeCategory)
      .filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [libraryItems, activeTab, activeCategory, searchQuery]);

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (currentUser.isBanned) {
      showToast("حسابك محظور من النشر", "error");
      return;
    }
    if (!newContent.title) return;
    if (!selectedFile && !newContent.fileUrl) return;

    setIsSubmitting(true);
    
    try {
      let finalFileUrl = newContent.fileUrl;
      
      if (selectedFile) {
        let fileToUpload = selectedFile;
        
        if (newContent.type === "image") {
          if (selectedFile.size > 10 * 1024 * 1024) {
            showToast("حجم الصورة كبير جداً (الحد الأقصى 10 ميجابايت)", "error");
            setIsSubmitting(false);
            return;
          }
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: false, // Disabled web worker to prevent hanging on some devices
          };
          fileToUpload = await imageCompression(selectedFile, options);
        } else if (newContent.type === "book") {
          if (selectedFile.size > 50 * 1024 * 1024) {
            showToast("حجم الملف كبير جداً (الحد الأقصى 50 ميجابايت)", "error");
            setIsSubmitting(false);
            return;
          }
        }

        const fileRef = ref(storage, `library/${Date.now()}_${fileToUpload.name}`);
        const uploadTask = uploadBytesResumable(fileRef, fileToUpload);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              reject(error);
            },
            () => {
              resolve();
            }
          );
        });

        finalFileUrl = await getDownloadURL(uploadTask.snapshot.ref);
      }

      const itemData = {
        ...newContent,
        fileUrl: finalFileUrl,
        author: currentUser.name,
        authorId: currentUser.id,
        authorRole: currentUser.role,
        likes: 0,
        likedBy: [],
        views: 0,
        deleted: false,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "library"), itemData);
      setIsAddModalOpen(false);
      setNewContent({
        title: "",
        description: "",
        type: "book",
        category: "أخرى",
        fileUrl: "",
        thumbnailUrl: ""
      });
      setSelectedFile(null);
      setUploadProgress(0);
      showToast("تمت إضافة المحتوى بنجاح", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "library");
      showToast("حدث خطأ أثناء إضافة المحتوى", "error");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleLike = async (item: LibraryItem) => {
    if (!currentUser) return;
    const isLiked = item.likedBy.includes(currentUser.id);
    
    try {
      const itemRef = doc(db, "library", item.id);
      await updateDoc(itemRef, {
        likes: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(currentUser.id) : arrayUnion(currentUser.id)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "library");
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المحتوى؟")) return;
    
    try {
      await updateDoc(doc(db, "library", itemId), { deleted: true });
      if (selectedItem?.id === itemId) setSelectedItem(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "library");
    }
  };

  const incrementViews = async (item: LibraryItem) => {
    try {
      await updateDoc(doc(db, "library", item.id), {
        views: increment(1)
      });
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !selectedItem || !currentUser) return;
    if (currentUser.isBanned) {
      showToast("حسابك محظور من التعليق", "error");
      return;
    }
    try {
      await addDoc(collection(db, "comments"), {
        targetId: selectedItem.id,
        targetType: "library",
        text: commentText,
        userId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        likes: 0,
        likedBy: [],
        parentCommentId: null,
        replies: 0,
        deleted: false,
        createdAt: new Date().toISOString(),
      });
      setCommentText("");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "comments");
    }
  };

  const itemComments = useMemo(() => {
    if (!selectedItem) return [];
    return comments.filter(c => c.targetId === selectedItem.id && !c.deleted);
  }, [comments, selectedItem]);

  return (
    <div className="h-full flex flex-col relative animate-fade-in text-right" dir="rtl">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-20 right-20 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-blob"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="p-4 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white neon-text font-tajawal mb-1 md:mb-2">
            المكتبة المعرفية
          </h1>
          <p className="text-gray-400 text-xs md:text-sm font-tajawal">
            كنوز فكرية، كتب رقمية، ومعارض بصرية ملهمة
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentUser && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 md:px-6 md:py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full text-sm md:text-base font-bold flex items-center gap-2 shadow-lg shadow-pink-500/20 hover:scale-105 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              إضافة محتوى
            </button>
          )}
        </div>
      </header>

      {/* Filters & Search */}
      <div className="px-4 md:px-8 mb-4 flex flex-col md:flex-row gap-3 md:gap-4 items-center">
        <div className="flex bg-slate-900/50 backdrop-blur-md p-1 rounded-2xl border border-white/5 w-full md:w-auto">
          <button
            onClick={() => {
              setActiveTab("book");
              setActiveCategory("الكل");
            }}
            className={`flex-1 md:flex-none px-4 py-2 md:px-8 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "book" ? "bg-pink-600 text-white shadow-lg shadow-pink-500/20" : "text-gray-400 hover:text-white"
            }`}
          >
            <Book className="w-4 h-4" />
            قسم الكتب
          </button>
          <button
            onClick={() => {
              setActiveTab("image");
              setActiveCategory("الكل");
            }}
            className={`flex-1 md:flex-none px-4 py-2 md:px-8 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "image" ? "bg-pink-600 text-white shadow-lg shadow-pink-500/20" : "text-gray-400 hover:text-white"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            قسم الصور
          </button>
        </div>

        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          <input
            type="text"
            placeholder={`ابحث في ${activeTab === "book" ? "الكتب" : "الصور"}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl py-2.5 md:py-3 pr-10 md:pr-12 pl-4 text-sm md:text-base text-white focus:outline-none focus:border-pink-500/50 transition-all font-tajawal"
          />
        </div>
      </div>

      {/* Categories Bar */}
      <div className="px-4 md:px-8 mb-6 md:mb-8 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 min-w-max">
          {(activeTab === "book" ? bookCategories : imageCategories).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                activeCategory === cat 
                  ? "bg-white/10 border-pink-500 text-pink-500" 
                  : "bg-transparent border-white/5 text-gray-500 hover:border-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-20 custom-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Filter className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-xl font-tajawal">لا يوجد محتوى يطابق بحثك</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-pink-500/30 transition-all duration-500 flex flex-col"
              >
                {/* Preview Area */}
                <div 
                  className="aspect-[4/3] relative overflow-hidden cursor-pointer"
                  onClick={() => {
                    setSelectedItem(item);
                    incrementViews(item);
                  }}
                >
                  {item.type === "image" ? (
                    <img
                      src={item.fileUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <FileText className="w-20 h-20 text-pink-500/20 group-hover:scale-110 transition-transform duration-700" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-pink-600/90 text-white p-4 rounded-full shadow-xl transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <Book className="w-8 h-8" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Type/Category Badge */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white border border-white/10 flex items-center gap-1.5">
                      {item.type === "book" ? <Book className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                      {item.type === "book" ? "كتاب PDF" : "صورة فنية"}
                    </div>
                    <div className="bg-pink-600/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white self-start">
                      {item.category}
                    </div>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-pink-600/20 flex items-center justify-center text-[10px] text-pink-500 overflow-hidden">
                      {users.find(u => u.id === item.authorId)?.photoURL ? (
                        <img src={users.find(u => u.id === item.authorId)?.photoURL} alt={item.author} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        item.authorRole === "admin" ? <Icons.Crown className="w-3 h-3" /> : <Icons.User className="w-3 h-3" />
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold">{item.author}</span>
                    <span className="text-[10px] text-gray-600 mr-auto">
                      {format(new Date(item.createdAt), "d MMM yyyy", { locale: ar })}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-pink-500 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleLike(item)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          item.likedBy.includes(currentUser?.id || "") ? "text-pink-500" : "text-gray-500 hover:text-pink-500"
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${item.likedBy.includes(currentUser?.id || "") ? "fill-current" : ""}`} />
                        <span className="text-xs font-bold">{item.likes}</span>
                      </button>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Icons.Eye className="w-4 h-4" />
                        <span className="text-xs font-bold">{item.views}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {(currentUser?.role === "admin" || currentUser?.id === item.authorId) && (
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <a 
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                        title="تحميل"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => {
                          setSelectedItem(item);
                          incrementViews(item);
                        }}
                        className="p-2 text-pink-500 hover:bg-pink-500/10 rounded-xl transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Content Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white font-tajawal">إضافة محتوى جديد</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-gray-500 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddContent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2 mr-1">نوع المحتوى</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewContent({ ...newContent, type: "book" })}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      newContent.type === "book" ? "bg-pink-600/20 border-pink-500 text-pink-500" : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
                    }`}
                  >
                    <Book className="w-6 h-6" />
                    <span className="text-xs font-bold">كتاب PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewContent({ ...newContent, type: "image" })}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      newContent.type === "image" ? "bg-pink-600/20 border-pink-500 text-pink-500" : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
                    }`}
                  >
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-xs font-bold">صورة فنية</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2 mr-1">التصنيف</label>
                <div className="flex flex-wrap gap-2">
                  {(newContent.type === "book" ? bookCategories : imageCategories).filter(c => c !== "الكل").map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewContent({ ...newContent, category: cat })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        newContent.category === cat 
                          ? "bg-pink-600 border-pink-500 text-white" 
                          : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2 mr-1">العنوان</label>
                <input
                  type="text"
                  required
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-pink-500/50 transition-all"
                  placeholder="عنوان المحتوى..."
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2 mr-1">الوصف (اختياري)</label>
                <textarea
                  value={newContent.description}
                  onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-pink-500/50 transition-all h-24 resize-none"
                  placeholder="وصف مختصر للمحتوى..."
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2 mr-1">الملف (رفع مباشر أو رابط)</label>
                <div className="space-y-3">
                  <div className="relative group">
                    <input
                      type="file"
                      accept={newContent.type === "book" ? ".pdf" : "image/*"}
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-pink-500/50 transition-all group"
                    >
                      {selectedFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                          <span className="text-xs text-white font-bold">{selectedFile.name}</span>
                          <span className="text-[10px] text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Download className="w-8 h-8 text-gray-500 group-hover:text-pink-500 transition-colors" />
                          <span className="text-xs text-gray-400">اضغط لرفع {newContent.type === "book" ? "كتاب PDF" : "صورة"}</span>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </div>
                    <input
                      type="url"
                      value={newContent.fileUrl}
                      onChange={(e) => {
                        setNewContent({ ...newContent, fileUrl: e.target.value });
                        if (e.target.value) setSelectedFile(null);
                      }}
                      className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-pink-500/50 transition-all text-sm"
                      placeholder="أو ضع رابط الملف هنا مباشرة..."
                    />
                  </div>
                </div>
              </div>

              {newContent.type === "book" && (
                <div>
                  <label className="block text-xs text-gray-500 mb-2 mr-1">رابط الغلاف (اختياري)</label>
                  <input
                    type="url"
                    value={newContent.thumbnailUrl}
                    onChange={(e) => setNewContent({ ...newContent, thumbnailUrl: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-pink-500/50 transition-all"
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-pink-500/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 mt-4 relative overflow-hidden"
              >
                {isSubmitting && uploadProgress > 0 && (
                  <div 
                    className="absolute top-0 left-0 h-full bg-white/20 transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                )}
                <span className="relative z-10">
                  {isSubmitting 
                    ? (uploadProgress > 0 ? `جاري الرفع... ${Math.round(uploadProgress)}%` : "جاري المعالجة...") 
                    : "نشر المحتوى"}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-white/10 w-full max-w-5xl h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in flex flex-col md:flex-row">
            {/* Left/Top: Preview */}
            <div className="flex-1 bg-black flex items-center justify-center relative group">
              {selectedItem.type === "image" ? (
                <div className="flex flex-col items-center gap-4 w-full h-full p-4">
                  <img
                    src={selectedItem.fileUrl}
                    alt={selectedItem.title}
                    className="max-w-full max-h-[80%] object-contain rounded-xl shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                  <a
                    href={selectedItem.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20"
                  >
                    <Download className="w-5 h-5" />
                    تحميل الصورة بجودة عالية
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 p-8 text-center">
                  <div className="w-40 h-56 bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
                    {selectedItem.thumbnailUrl ? (
                      <img src={selectedItem.thumbnailUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Book className="w-20 h-20 text-pink-500/20" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">{selectedItem.title}</h2>
                    <p className="text-gray-500 text-sm">ملف رقمي بصيغة PDF</p>
                  </div>
                  <a
                    href={selectedItem.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-10 py-4 bg-pink-600 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-pink-500 transition-all shadow-xl shadow-pink-500/20"
                  >
                    <Download className="w-6 h-6" />
                    تحميل وقراءة الكتاب
                  </a>
                </div>
              )}
              
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 p-3 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-white/10 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Right/Bottom: Details & Comments */}
            <div className="w-full md:w-[400px] border-r border-white/10 flex flex-col bg-slate-900/50">
              <div className="p-8 border-b border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-pink-600/20 flex items-center justify-center text-pink-500 overflow-hidden">
                    {users.find(u => u.id === selectedItem.authorId)?.photoURL ? (
                      <img src={users.find(u => u.id === selectedItem.authorId)?.photoURL} alt={selectedItem.author} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      selectedItem.authorRole === "admin" ? <Icons.Crown className="w-5 h-5" /> : <Icons.User className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedItem.author}</p>
                    <p className="text-[10px] text-gray-500">
                      نُشر في {format(new Date(selectedItem.createdAt), "d MMMM yyyy", { locale: ar })}
                    </p>
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-4 font-tajawal">{selectedItem.title}</h1>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">{selectedItem.description}</p>

                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => handleLike(selectedItem)}
                    className={`flex items-center gap-2 transition-colors ${
                      selectedItem.likedBy.includes(currentUser?.id || "") ? "text-pink-500" : "text-gray-500 hover:text-pink-500"
                    }`}
                  >
                    <ThumbsUp className={`w-5 h-5 ${selectedItem.likedBy.includes(currentUser?.id || "") ? "fill-current" : ""}`} />
                    <span className="text-sm font-bold">{selectedItem.likes} إعجاب</span>
                  </button>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Icons.Eye className="w-5 h-5" />
                    <span className="text-sm font-bold">{selectedItem.views} مشاهدة</span>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {itemComments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
                    <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-tajawal">لا توجد تعليقات بعد</p>
                    <p className="text-[10px] mt-1">كن أول من يعلق على هذا المحتوى</p>
                  </div>
                ) : (
                  itemComments.map(comment => (
                    <div key={comment.id} className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400 border border-white/10 shrink-0 overflow-hidden">
                        {users.find(u => u.id === comment.userId)?.photoURL ? (
                          <img src={users.find(u => u.id === comment.userId)?.photoURL} alt={comment.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          comment.authorName[0]
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="bg-white/5 p-3 rounded-2xl rounded-tr-none border border-white/5 relative">
                          <p className="text-[10px] font-bold text-pink-500 mb-1">{comment.authorName}</p>
                          <p className="text-xs text-gray-300 leading-relaxed">{comment.text}</p>
                          
                          {(currentUser?.role === "admin" || currentUser?.id === comment.userId) && (
                            <button 
                              onClick={async () => {
                                if (!window.confirm("حذف التعليق؟")) return;
                                try {
                                  await updateDoc(doc(db, "comments", comment.id), { deleted: true });
                                  showToast("تم حذف التعليق", "success");
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.UPDATE, "comments");
                                }
                              }}
                              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-[8px] text-gray-600 mt-1">
                          {format(new Date(comment.createdAt), "HH:mm", { locale: ar })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-black/20">
                <div className="relative">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                    placeholder="اكتب تعليقاً..."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-pink-500/50 transition-all"
                  />
                  <button 
                    onClick={handleSendComment}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 hover:scale-110 transition-transform"
                  >
                    <Icons.Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
