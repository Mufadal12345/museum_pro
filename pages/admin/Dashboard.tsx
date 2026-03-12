import React, { useState } from "react";
import { useData } from "../../contexts/DataContext";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { writeBatch, doc, collection, getDocs } from "firebase/firestore";
import {
  STATIC_CONTENT,
  STATIC_QUOTES,
  STATIC_COURSES,
} from "../../data/staticData";
import { NEW_ARTICLES } from "../../data/newArticles";
import { useToast } from "../../contexts/ToastContext";
import { Idea } from "../../types";

export const AdminDashboard: React.FC = () => {
  const { users, ideas, comments, suggestions, quotes, courses } = useData();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);
  const [isReplacingContent, setIsReplacingContent] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);

  const handleReplaceContent = async () => {
    if (
      !window.confirm(
        "تحذير: سيتم حذف جميع المقالات الحالية واستبدالها بالمحتوى الجديد عالي الجودة. هل أنت متأكد؟",
      )
    )
      return;

    setIsReplacingContent(true);
    try {
      // 1. Delete all existing ideas
      const ideasSnap = await getDocs(collection(db, "ideas"));
      const deleteBatch = writeBatch(db);
      ideasSnap.docs.forEach((d) => {
        deleteBatch.delete(d.ref);
      });
      await deleteBatch.commit();
      showToast("تم حذف المحتوى القديم", "info");

      // 2. Add new articles with delay
      const addBatch = writeBatch(db);
      const now = Date.now();

      NEW_ARTICLES.forEach((article: Partial<Idea>) => {
        const ref = doc(collection(db, "ideas"));
        // Set showAfter to now + 4 minutes (240,000 ms)
        const showAfter = new Date(now + 4 * 60 * 1000).toISOString();

        addBatch.set(ref, {
          ...article,
          id: ref.id,
          views: Math.floor(Math.random() * 5000) + 1000,
          likes: Math.floor(Math.random() * 300) + 50,
          likedBy: [],
          featured: false,
          deleted: false,
          createdAt: new Date().toISOString(),
          showAfter: showAfter,
        });
      });

      await addBatch.commit();
      showToast(
        "تمت إضافة المحتوى الجديد بنجاح! سيظهر للمستخدمين بعد 4 دقائق.",
        "success",
      );
    } catch (error) {
      console.error("Replacement error:", error);
      showToast("حدث خطأ أثناء استبدال المحتوى", "error");
    } finally {
      setIsReplacingContent(false);
    }
  };

  const handleMigrateData = async () => {
    if (
      !window.confirm(
        "هل أنت متأكد من رغبتك في رفع جميع البيانات الثابتة (1000+ عنصر) إلى قاعدة البيانات؟ قد يستغرق هذا بعض الوقت.",
      )
    )
      return;

    setIsMigrating(true);
    setMigrationProgress(0);

    try {
      // 1. Migrate Quotes
      const quoteBatch = writeBatch(db);
      STATIC_QUOTES.forEach((q) => {
        const ref = doc(collection(db, "quotes"));
        const { id, ...data } = q;
        quoteBatch.set(ref, data);
      });
      await quoteBatch.commit();
      setMigrationProgress(10);

      // 2. Migrate Courses
      const courseBatch = writeBatch(db);
      STATIC_COURSES.forEach((c) => {
        const ref = doc(collection(db, "courses"));
        const { id, ...data } = c;
        courseBatch.set(ref, data);
      });
      await courseBatch.commit();
      setMigrationProgress(20);

      // 3. Migrate Ideas (1000 items in batches of 500)
      const batchSize = 400; // Firestore limit is 500
      for (let i = 0; i < STATIC_CONTENT.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = STATIC_CONTENT.slice(i, i + batchSize);

        chunk.forEach((idea) => {
          const ref = doc(collection(db, "ideas"));
          const { id, ...data } = idea;
          batch.set(ref, data);
        });

        await batch.commit();
        setMigrationProgress(
          20 + Math.floor(((i + batchSize) / STATIC_CONTENT.length) * 80),
        );
      }

      showToast("تم رفع جميع البيانات بنجاح!", "success");
    } catch (error) {
      console.error("Migration error:", error);
      showToast("حدث خطأ أثناء رفع البيانات", "error");
    } finally {
      setIsMigrating(false);
      setMigrationProgress(0);
    }
  };

  const stats = [
    {
      title: "المستخدمين",
      value: users.length,
      color: "from-blue-500 to-cyan-400",
      link: "/admin/members",
    },
    {
      title: "الأفكار المنشورة",
      value: ideas.length,
      color: "from-pink-500 to-rose-400",
      link: "/feed",
    },
    {
      title: "التعليقات",
      value: comments.length,
      color: "from-purple-500 to-violet-400",
      link: "/comments",
    },
    {
      title: "الرسائل والمقترحات",
      value: suggestions.length,
      color: "from-orange-500 to-yellow-400",
      link: "/admin/messages",
    },
    {
      title: "الحكم والعبارات",
      value: quotes.length,
      color: "from-emerald-500 to-teal-400",
      link: "/quotes",
    },
    {
      title: "المصادر التعليمية",
      value: courses.length,
      color: "from-indigo-500 to-blue-400",
      link: "/skills",
    },
  ];

  return (
    <div className="animate-fade-in pb-20">
      <h1 className="text-3xl font-bold font-amiri mb-6 gradient-text">
        لوحة التحكم
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            onClick={() => navigate(stat.link)}
            className="glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <div
              className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`}
            ></div>
            <h3 className="text-gray-400 text-sm font-bold mb-2">
              {stat.title}
            </h3>
            <p className="text-4xl font-bold text-white font-amiri">
              {stat.value}
            </p>
            <div
              className={`h-1 w-full bg-gradient-to-r ${stat.color} mt-4 rounded-full opacity-50`}
            ></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Migration Tool */}
        <div className="glass-card p-6 rounded-2xl border border-pink-500/30">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🚀</span> مزامنة البيانات
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            هذه الأداة تقوم برفع المحتوى الثابت (1000 مقال، 30 حكمة، 20 كورس)
            إلى قاعدة بيانات Firebase لجعل التطبيق ديناميكياً بالكامل.
          </p>

          {isMigrating ? (
            <div className="space-y-4">
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 transition-all duration-500"
                  style={{ width: `${migrationProgress}%` }}
                ></div>
              </div>
              <p className="text-center text-xs text-pink-400 animate-pulse">
                جاري الرفع... {migrationProgress}%
              </p>
            </div>
          ) : (
            <button
              onClick={handleMigrateData}
              className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <span className="text-lg">📤</span> رفع البيانات الثابتة إلى
              Firebase
            </button>
          )}
        </div>

        {/* Content Replacement Tool */}
        <div className="glass-card p-6 rounded-2xl border border-indigo-500/30">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">📚</span> إدارة المحتوى النخبي
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            هذه الأداة تقوم بحذف جميع المقالات الحالية واستبدالها بـ 30 مقالة
            نخبوية لكبار الكتاب والمفكرين.
          </p>

          {isReplacingContent ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <button
              onClick={handleReplaceContent}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
            >
              <span className="text-lg">✨</span> استبدال المحتوى بمقالات عالية
              الجودة
            </button>
          )}
        </div>

        {/* Recent Users */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">👥</span> أحدث الأعضاء
          </h3>
          <div className="space-y-4">
            {users.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center">
                    {user.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString("ar-EG")}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/admin/members")}
            className="w-full mt-4 py-2 text-sm text-center text-pink-400 hover:text-pink-300 border border-white/10 rounded-xl hover:bg-white/5 transition-all"
          >
            عرض جميع الأعضاء
          </button>
        </div>

        {/* Recent Suggestions */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">📩</span> أحدث الرسائل
          </h3>
          <div className="space-y-4">
            {suggestions.slice(0, 5).map((msg) => (
              <div
                key={msg.id}
                className="p-3 bg-white/5 rounded-xl border-r-4 border-yellow-500"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm">{msg.title}</h4>
                  <span
                    className={`text-[10px] px-2 rounded-full ${msg.status === "pending" ? "bg-yellow-500/20 text-yellow-300" : "bg-green-500/20 text-green-300"}`}
                  >
                    {msg.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-1">
                  {msg.content}
                </p>
              </div>
            ))}
            {suggestions.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                لا توجد رسائل جديدة
              </p>
            )}
          </div>
          <button
            onClick={() => navigate("/admin/messages")}
            className="w-full mt-4 py-2 text-sm text-center text-pink-400 hover:text-pink-300 border border-white/10 rounded-xl hover:bg-white/5 transition-all"
          >
            إدارة الرسائل
          </button>
        </div>
      </div>
    </div>
  );
};
