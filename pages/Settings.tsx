import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Icons } from "../components/Icons";
import { useToast } from "../contexts/ToastContext";

export const AdminSettings: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();

  const handleSave = () => {
    // Here we would implement saving logic to Firestore for admin settings
    showToast("تم حفظ الإعدادات بنجاح", "success");
  };

  return (
    <div className="animate-fade-in pb-20">
      <h1 className="text-3xl font-bold font-amiri gradient-text mb-8">
        الإعدادات
      </h1>

      <div className="grid gap-6 max-w-2xl">
        {/* Admin Profile */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Icons.User className="w-5 h-5 text-pink-500" /> الملف الشخصي
          </h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-500 flex items-center justify-center text-3xl shadow-lg">
              👑
            </div>
            <div>
              <p className="font-bold text-lg">{currentUser?.name}</p>
              <p className="text-gray-400 text-sm">مدير النظام (Super Admin)</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                اسم العرض
              </label>
              <input
                type="text"
                defaultValue={currentUser?.name}
                className="input-style w-full px-4 py-2 rounded-xl"
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                البريد الإلكتروني / المعرف
              </label>
              <input
                type="text"
                defaultValue={currentUser?.id}
                className="input-style w-full px-4 py-2 rounded-xl"
                disabled
              />
            </div>
          </div>
        </div>

        {/* System Settings (Mock) */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Icons.Settings className="w-5 h-5 text-blue-400" /> إعدادات النظام
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div>
                <p className="font-bold text-sm">التسجيل الجديد</p>
                <p className="text-xs text-gray-400">السماح بتسجيل أعضاء جدد</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 accent-pink-500"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div>
                <p className="font-bold text-sm">التعليقات العامة</p>
                <p className="text-xs text-gray-400">تفعيل التعليقات للجميع</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 accent-pink-500"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div>
                <p className="font-bold text-sm">وضع الصيانة</p>
                <p className="text-xs text-gray-400">إيقاف الموقع مؤقتاً</p>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-pink-500" />
            </div>
          </div>
          <button
            onClick={handleSave}
            className="mt-6 btn-primary w-full py-3 rounded-xl font-bold"
          >
            حفظ التغييرات
          </button>
        </div>

        <button
          onClick={logout}
          className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-bold"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};
