import React, { useState, useMemo } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import { doc, writeBatch } from "firebase/firestore";
import { Icons } from "../../components/Icons";
import { subMonths, isWithinInterval, parseISO } from "date-fns";
import { Database, Trash2, Calendar, Filter, AlertTriangle, CheckCircle, Info } from "lucide-react";

export const DatabaseManagement: React.FC = () => {
  const { ideas, comments, libraryItems, users } = useData();
  const { currentUser } = useAuth();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  
  // Cleanup Filters
  const [minLikes, setMinLikes] = useState(5);
  const [monthsOld, setMonthsOld] = useState(3);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Stats
  const stats = useMemo(() => {
    const libraryByType = libraryItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      ideasCount: ideas.length,
      commentsCount: comments.length,
      libraryCount: libraryItems.length,
      booksCount: libraryByType.book || 0,
      imagesCount: libraryByType.image || 0,
      usersCount: users.length,
      totalItems: ideas.length + comments.length + libraryItems.length
    };
  }, [ideas, comments, libraryItems, users]);

  // Identify items for cleanup based on likes and age
  const cleanupItems = useMemo(() => {
    const cutoffDate = subMonths(new Date(), monthsOld);
    
    const oldIdeas = ideas.filter(idea => {
      const date = parseISO(idea.createdAt);
      return date < cutoffDate && idea.likes < minLikes;
    });

    const oldLibrary = libraryItems.filter(item => {
      const date = parseISO(item.createdAt);
      return date < cutoffDate && item.likes < minLikes;
    });

    return {
      ideas: oldIdeas,
      library: oldLibrary,
      total: oldIdeas.length + oldLibrary.length
    };
  }, [ideas, libraryItems, minLikes, monthsOld]);

  // Identify items in date range
  const rangeItems = useMemo(() => {
    if (!startDate || !endDate) return { ideas: [], library: [], total: 0 };
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredIdeas = ideas.filter(idea => {
      const date = parseISO(idea.createdAt);
      return isWithinInterval(date, { start, end });
    });

    const filteredLibrary = libraryItems.filter(item => {
      const date = parseISO(item.createdAt);
      return isWithinInterval(date, { start, end });
    });

    return {
      ideas: filteredIdeas,
      library: filteredLibrary,
      total: filteredIdeas.length + filteredLibrary.length
    };
  }, [ideas, libraryItems, startDate, endDate]);

  const handleBulkDelete = async (items: { ideas: any[]; library: any[] }) => {
    if (!window.confirm(`هل أنت متأكد من حذف ${items.ideas.length + items.library.length} عنصر نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      return;
    }

    setIsDeleting(true);
    setStatusMessage({ type: "info", text: "جاري حذف البيانات..." });

    try {
      const batch = writeBatch(db);
      let count = 0;

      // Firestore batches are limited to 500 operations
      items.ideas.forEach(item => {
        batch.delete(doc(db, "ideas", item.id));
        count++;
      });

      items.library.forEach(item => {
        batch.delete(doc(db, "library", item.id));
        count++;
      });

      await batch.commit();
      setStatusMessage({ type: "success", text: `تم حذف ${count} عنصر بنجاح.` });
    } catch (error) {
      console.error("Bulk delete error:", error);
      setStatusMessage({ type: "error", text: "حدث خطأ أثناء حذف البيانات." });
      handleFirestoreError(error, OperationType.DELETE, "bulk_delete");
    } finally {
      setIsDeleting(false);
    }
  };

  if (currentUser?.role !== "admin") {
    return <div className="p-8 text-center text-red-500">غير مصرح لك بالدخول لهذه الصفحة.</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-pink-500/20 rounded-2xl">
          <Database className="w-8 h-8 text-pink-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">إدارة قاعدة البيانات</h1>
          <p className="text-gray-400">تنظيف وصيانة محتوى المتحف</p>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${
          statusMessage.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
          statusMessage.type === "error" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
          "bg-blue-500/10 text-blue-400 border border-blue-500/20"
        }`}>
          {statusMessage.type === "success" ? <CheckCircle className="w-5 h-5" /> : 
           statusMessage.type === "error" ? <AlertTriangle className="w-5 h-5" /> : 
           <Info className="w-5 h-5" />}
          <p>{statusMessage.text}</p>
          <button onClick={() => setStatusMessage(null)} className="mr-auto opacity-50 hover:opacity-100">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "الأفكار", value: stats.ideasCount, icon: "💡", color: "from-blue-500 to-cyan-500" },
          { label: "الكتب", value: stats.booksCount, icon: "📚", color: "from-pink-500 to-purple-500" },
          { label: "الصور", value: stats.imagesCount, icon: "🎨", color: "from-orange-500 to-red-500" },
          { label: "التعليقات", value: stats.commentsCount, icon: "💬", color: "from-emerald-500 to-teal-500" },
          { label: "الأعضاء", value: stats.usersCount, icon: "👤", color: "from-slate-500 to-slate-700" },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}></div>
            <div className="relative z-10">
              <span className="text-2xl mb-2 block">{stat.icon}</span>
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cleanup Tool */}
        <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Filter className="w-6 h-6 text-pink-500" />
            <h2 className="text-xl font-bold">أداة التنظيف الذكي</h2>
          </div>
          <p className="text-sm text-gray-400">
            حذف المحتوى القديم الذي لم يحصل على تفاعل كافٍ من الأعضاء (إعجابات قليلة).
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-500 mr-2">أقل من عدد إعجابات</label>
              <input 
                type="number" 
                value={minLikes}
                onChange={(e) => setMinLikes(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-pink-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-500 mr-2">أقدم من (أشهر)</label>
              <input 
                type="number" 
                value={monthsOld}
                onChange={(e) => setMonthsOld(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div className="p-4 bg-pink-500/5 border border-pink-500/10 rounded-2xl">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">العناصر المحددة للحذف:</span>
              <span className="font-bold text-pink-500">{cleanupItems.total} عنصر</span>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex gap-4">
              <span>{cleanupItems.ideas.length} فكرة</span>
              <span>{cleanupItems.library.length} مادة مكتبية</span>
            </div>
          </div>

          <button
            onClick={() => handleBulkDelete(cleanupItems)}
            disabled={isDeleting || cleanupItems.total === 0}
            className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 className="w-5 h-5" />
            تنفيذ التنظيف المختار
          </button>
        </div>

        {/* Date Range Tool */}
        <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold">حذف حسب التاريخ</h2>
          </div>
          <p className="text-sm text-gray-400">
            إفراغ قاعدة البيانات من المحتوى المضاف ضمن فترة زمنية محددة.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-500 mr-2">من تاريخ</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-500 mr-2">إلى تاريخ</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-white"
              />
            </div>
          </div>

          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">العناصر في هذه الفترة:</span>
              <span className="font-bold text-blue-500">{rangeItems.total} عنصر</span>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex gap-4">
              <span>{rangeItems.ideas.length} فكرة</span>
              <span>{rangeItems.library.length} مادة مكتبية</span>
            </div>
          </div>

          <button
            onClick={() => handleBulkDelete(rangeItems)}
            disabled={isDeleting || rangeItems.total === 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 className="w-5 h-5" />
            حذف محتوى الفترة المحددة
          </button>
        </div>
      </div>

      {/* Storage Info */}
      <div className="glass-card p-8 rounded-3xl border border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-bold">تنبيهات الأمان والاستخدام</h2>
        </div>
        <ul className="space-y-3 text-sm text-gray-400">
          <li className="flex gap-2">
            <span className="text-yellow-500">•</span>
            عمليات الحذف نهائية ولا يمكن استرجاع البيانات بعد تأكيد الحذف.
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-500">•</span>
            يتم احتساب "الاستحسان" بناءً على عدد الإعجابات التي حصل عليها المحتوى.
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-500">•</span>
            قاعدة البيانات الحالية تحتوي على {stats.totalItems} سجل نشط (باستثناء المستخدمين).
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-500">•</span>
            يُنصح بإجراء "التنظيف الذكي" دورياً للحفاظ على جودة المحتوى في المتحف.
          </li>
        </ul>
      </div>
    </div>
  );
};
