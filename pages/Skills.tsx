import React, { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useToast } from "../contexts/ToastContext";
import { Course } from "../types";
import { Modal } from "./admin/Modal";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { STATIC_COURSES } from "../data/staticData";

export const Skills: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses, bookmarks } = useData();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  // Form
  const [title, setTitle] = useState("");
  const [type, setType] = useState("قناة يوتيوب");
  const [desc, setDesc] = useState("");
  const [link, setLink] = useState("");

  const allCourses = useMemo(() => {
    const dbCourseTitles = new Set(courses.map((c) => c.title));
    const activeStatic = STATIC_COURSES.filter(
      (s) => !dbCourseTitles.has(s.title),
    );
    return [...activeStatic, ...courses];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    let sorted = [...allCourses].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (filter !== "all") {
      sorted = sorted.filter((c) => c.type === filter);
    }
    return sorted;
  }, [allCourses, filter]);

  const handleSubmit = async () => {
    if (!title || !desc) return;
    await addDoc(collection(db, "courses"), {
      title,
      type,
      description: desc,
      link,
      addedBy: currentUser?.name,
      addedByRole: currentUser?.role,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      views: 0,
    });
    setIsModalOpen(false);
    setTitle("");
    setDesc("");
    setLink("");
    showToast("تمت الإضافة بنجاح", "success");
  };

  const handleLike = async (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    if (course.id.startsWith("static")) return showToast("محتوى ثابت", "info");
    if (!currentUser) return;

    const ref = doc(db, "courses", course.id);
    const likedBy = course.likedBy || [];
    const isLiked = likedBy.includes(currentUser.id);

    await updateDoc(ref, {
      likes: Math.max(0, (course.likes || 0) + (isLiked ? -1 : 1)),
      likedBy: isLiked
        ? likedBy.filter((id) => id !== currentUser.id)
        : [...likedBy, currentUser.id],
    });
  };

  const handleBookmark = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    const existing = bookmarks.find((b) => b.courseId === courseId);
    if (existing) {
      await deleteDoc(doc(db, "bookmarks", existing.id));
    } else {
      await addDoc(collection(db, "bookmarks"), {
        userId: currentUser.id,
        courseId,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case "قناة يوتيوب":
        return "fa-youtube text-red-500";
      case "كورس أونلاين":
        return "fa-graduation-cap text-pink-500";
      case "كتب":
        return "fa-book text-yellow-500";
      case "بودكاست":
        return "fa-microphone text-green-500";
      case "مقالات":
        return "fa-newspaper text-blue-400";
      default:
        return "fa-laptop text-gray-400";
    }
  };

  const filters = [
    { key: "all", label: "الكل", icon: "fa-layer-group" },
    { key: "قناة يوتيوب", label: "يوتيوب", icon: "fa-youtube text-red-500" },
    {
      key: "كورس أونلاين",
      label: "كورسات",
      icon: "fa-graduation-cap text-pink-500",
    },
    { key: "كتب", label: "كتب", icon: "fa-book text-yellow-500" },
    { key: "بودكاست", label: "بودكاست", icon: "fa-microphone text-green-500" },
    { key: "مقالات", label: "مقالات", icon: "fa-newspaper text-blue-400" },
  ];

  return (
    <div className="h-full flex flex-col relative animate-fade-in">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <header className="p-2 md:p-6 pb-2">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white neon-text font-tajawal">
            تطوير المهارات
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-accent hover:bg-pink-600 text-white px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-bold shadow-lg shadow-pink-500/30 transition transform active:scale-95 flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> <span className="hidden sm:inline">إضافة مصدر</span>
          </button>
        </div>

        <nav className="flex gap-2 md:gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 md:px-6 md:py-2 rounded-full flex items-center gap-2 whitespace-nowrap transition text-sm md:text-base ${filter === f.key ? "active-tab font-bold" : "glass hover:bg-white/10"}`}
            >
              <i
                className={`fas ${f.icon} ${filter === f.key ? "text-white" : ""}`}
              ></i>
              {f.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex-1 overflow-y-auto p-2 md:p-6 pt-0 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {filteredCourses.map((course) => {
            const isBookmarked = bookmarks.some(
              (b) => b.courseId === course.id,
            );
            const isLiked =
              currentUser && course.likedBy?.includes(currentUser.id);

            return (
              <div
                key={course.id}
                className="glass rounded-2xl p-3 card-hover group relative flex flex-col"
              >
                <div className="relative mb-3 rounded-xl overflow-hidden h-44 bg-gray-800 flex items-center justify-center">
                  {course.preview?.image ? (
                    <img
                      src={course.preview.image}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900`}
                    >
                      <i
                        className={`fas ${getTypeIcon(course.type)} text-4xl`}
                      ></i>
                    </div>
                  )}

                  <button
                    onClick={(e) => handleBookmark(e, course.id)}
                    className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition ${isBookmarked ? "bg-accent text-white" : "bg-black/50 text-white hover:bg-accent"}`}
                  >
                    <i
                      className={`${isBookmarked ? "fas" : "far"} fa-bookmark text-sm`}
                    ></i>
                  </button>

                  {course.type === "قناة يوتيوب" && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 bg-black/40">
                      <i className="fas fa-play-circle text-5xl text-white drop-shadow-lg"></i>
                    </div>
                  )}
                </div>

                <div className="px-1 flex-grow">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg leading-tight mb-1 text-white group-hover:text-accent transition line-clamp-1">
                      {course.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                    <i
                      className={`fas ${getTypeIcon(course.type).split(" ")[0]}`}
                    ></i>{" "}
                    {course.type}
                  </p>
                  <p className="text-xs text-gray-300 line-clamp-2 h-8 mb-2">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-2">
                    <button
                      onClick={(e) => handleLike(e, course)}
                      className={`transition flex items-center gap-1 ${isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                    >
                      <i className={`${isLiked ? "fas" : "far"} fa-heart`}></i>
                      {(course.likes || 0) > 0 && (
                        <span className="text-xs">{course.likes}</span>
                      )}
                    </button>

                    <a
                      href={course.link}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white px-6 py-1.5 rounded-full text-sm font-medium shadow-lg transition transform active:scale-95"
                    >
                      {course.type === "كتب" ? "قراءة" : "فتح"}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة مصدر تعليمي"
      >
        <div className="space-y-4 font-tajawal">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            type="text"
            placeholder="عنوان المصدر التعليمي"
            className="input-style w-full px-4 py-3 rounded-xl font-bold"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input-style w-full px-4 py-3 rounded-xl bg-[#0f172a]"
          >
            {filters
              .filter((f) => f.key !== "all")
              .map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
          </select>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="وصف موجز للمحتوى..."
            className="input-style w-full px-4 py-3 rounded-xl h-32 resize-none"
          ></textarea>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            type="text"
            placeholder="رابط المصدر (URL)"
            className="input-style w-full px-4 py-3 rounded-xl"
          />
          <button
            onClick={handleSubmit}
            className="btn-primary w-full py-3 rounded-xl shadow-lg"
          >
            إضافة المصدر
          </button>
        </div>
      </Modal>
    </div>
  );
};
