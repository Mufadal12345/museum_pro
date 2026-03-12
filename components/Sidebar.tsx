import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { messages } = useData();

  if (!currentUser) return null;

  const unreadMessagesCount = messages.filter(
    (m) => m.toUserId === currentUser?.id && !m.read
  ).length;

  const menuItems = [
    { path: "/", label: "الرئيسية", icon: "🏠", adminOnly: true },
    { path: "/ideas", label: "الأفكار", icon: "💡" },
    { path: `/profile/${currentUser.id}`, label: "ملفي الشخصي", icon: "👤" },
    { path: "/comments", label: "التعليقات", icon: "💬", adminOnly: true },
    { path: "/content", label: "المحتوى", icon: "📚" },
    { path: "/philosophy", label: "الفلسفة", icon: "🧠" },
    { path: "/quotes", label: "العبارات الملهمة", icon: "✨" },
    { path: "/skills", label: "تطوير المهارات", icon: "🚀" },
    { 
      path: "/suggestions", 
      label: "الرسائل والاقتراحات", 
      icon: "📝",
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined
    },
    { path: "/about", label: "عن المشروع", icon: "ℹ️" },
  ];

  const adminItems = [
    { path: "/admin/members", label: "الأعضاء", icon: "👥", permission: "view_members" },
    { path: "/admin/messages", label: "الرسائل", icon: "📨", permission: "message_members" },
    { path: "/admin/chat", label: "دردشة المديرين", icon: "💬" },
    { path: "/admin/database", label: "إدارة البيانات", icon: "🗄️", permission: "manage_database" },
    { path: "/admin/settings", label: "الإعدادات", icon: "⚙️" },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
      <aside
        className={`fixed md:relative top-0 right-0 h-full w-64 glass-sidebar z-50 transition-transform duration-300 transform 
                ${isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"} flex flex-col`}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏛️</span>
            <div>
              <h1 className="text-xl font-bold gradient-text">متحف الفكر</h1>
              <p className="text-xs text-gray-400">
                {currentUser.role === "admin" ? "👑 مدير" : "👤 زائر"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 md:p-4 space-y-1.5 md:space-y-2 overflow-auto scrollbar-hide">
          {menuItems.map((item) => {
            if (item.adminOnly && currentUser.role !== "admin") return null;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-xl text-right transition-all relative
                                    ${
                                      isActive
                                        ? "bg-red-500/25 border-r-4 border-[#e94560]"
                                        : "hover:bg-[#e94560]/15 hover:-translate-x-1"
                                    }`}
              >
                <span className="text-lg md:text-xl">{item.icon}</span>
                <span className="text-sm md:text-base">{item.label}</span>
                {item.badge && (
                  <span className="mr-auto bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {currentUser.role === "admin" && (
            <>
              <div className="border-t border-white/10 my-4 pt-4">
                <p className="text-xs text-gray-500 px-4 mb-2">إدارة النظام</p>
              </div>
              {adminItems.map((item) => {
                if (item.permission && currentUser.adminPermissions && !currentUser.adminPermissions.includes(item.permission)) {
                  // If user has specific permissions array but lacks this one, hide it.
                  // (If adminPermissions is undefined, assume full access for legacy admins)
                  return null;
                }
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-xl text-right transition-all
                                          ${
                                            location.pathname === item.path
                                              ? "bg-red-500/25 border-r-4 border-[#e94560]"
                                              : "hover:bg-[#e94560]/15 hover:-translate-x-1"
                                          }`}
                  >
                    <span className="text-lg md:text-xl">{item.icon}</span>
                    <span className="text-sm md:text-base">{item.label}</span>
                  </button>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div 
            onClick={() => handleNav(`/profile/${currentUser.id}`)}
            className="glass-card rounded-xl p-3 mb-3 cursor-pointer hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-xl shadow-lg avatar-pulse overflow-hidden">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  currentUser.role === "admin" ? "👑" : "👤"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {currentUser.specialty}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn-secondary w-full py-2 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-white/20"
          >
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
};
