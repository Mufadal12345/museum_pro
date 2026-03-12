import React, { useState } from "react";
import { useData } from "../../contexts/DataContext";
import { updateDoc, doc, addDoc, collection } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import { Icons } from "../../components/Icons";
import { useToast } from "../../contexts/ToastContext";
import { User } from "../../types";
import { Modal } from "./Modal";
import { useAuth } from "../../contexts/AuthContext";

const AVAILABLE_PERMISSIONS = [
  { id: "manage_suggestions", label: "إدارة الاقتراحات" },
  { id: "message_members", label: "مراسلة الأعضاء" },
  { id: "manage_admins", label: "إدارة المديرين" },
  { id: "ban_members", label: "حظر الأعضاء" },
  { id: "view_members", label: "رؤية الأعضاء" },
  { id: "manage_database", label: "إدارة البيانات" },
  { id: "full_access", label: "صلاحيات كاملة" },
];

export const Members: React.FC = () => {
  const { users } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Message Modal State
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");

  // Permissions Modal State
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [adminPermissions, setAdminPermissions] = useState<string[]>([]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleBan = async (user: User) => {
    if (!currentUser?.adminPermissions?.includes("ban_members")) {
      showToast("ليس لديك صلاحية حظر الأعضاء", "error");
      return;
    }
    if (user.role === "admin") {
      showToast("لا يمكن حظر المشرفين", "error");
      return;
    }
    try {
      await updateDoc(doc(db, "users", user.id), {
        isBanned: !user.isBanned,
      });
      showToast(
        `تم ${user.isBanned ? "فك حظر" : "حظر"} المستخدم بنجاح`,
        "success",
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
      showToast("حدث خطأ أثناء تحديث حالة المستخدم", "error");
    }
  };

  const promoteToAdmin = async (user: User) => {
    if (user.role === "admin") return;
    try {
      await updateDoc(doc(db, "users", user.id), {
        role: "admin",
        specialty: "مدير النظام",
        adminPermissions: ["view_members"] // Default permission
      });
      showToast(`تمت ترقية ${user.name} إلى مشرف بنجاح`, "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
      showToast("حدث خطأ أثناء ترقية المستخدم", "error");
    }
  };

  const openMessageModal = (user: User) => {
    setSelectedUser(user);
    setMessageTitle("");
    setMessageContent("");
    setIsMessageModalOpen(true);
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !messageTitle.trim() || !messageContent.trim() || !currentUser) return;

    try {
      await addDoc(collection(db, "messages"), {
        title: messageTitle,
        content: messageContent,
        type: "private",
        from: currentUser.name,
        fromId: currentUser.id,
        toUserId: selectedUser.id,
        status: "sent",
        read: false,
        createdAt: new Date().toISOString(),
      });
      showToast("تم إرسال الرسالة بنجاح", "success");
      setIsMessageModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "messages");
      showToast("فشل إرسال الرسالة", "error");
    }
  };

  const openPermissionsModal = (admin: User) => {
    setSelectedAdmin(admin);
    setAdminPermissions(admin.adminPermissions || []);
    setIsPermissionsModalOpen(true);
  };

  const togglePermission = (permissionId: string) => {
    setAdminPermissions((prev) => {
      if (permissionId === "full_access") {
        return prev.includes("full_access") ? [] : AVAILABLE_PERMISSIONS.map(p => p.id);
      }
      
      const newPermissions = prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId];
        
      // If all other permissions are selected, also select full_access
      const allOthersSelected = AVAILABLE_PERMISSIONS.filter(p => p.id !== "full_access").every(p => newPermissions.includes(p.id));
      if (allOthersSelected && !newPermissions.includes("full_access")) {
        return [...newPermissions, "full_access"];
      }
      
      // If full_access was selected but we unselected something, remove full_access
      if (!allOthersSelected && newPermissions.includes("full_access")) {
        return newPermissions.filter(id => id !== "full_access");
      }
      
      return newPermissions;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedAdmin) return;

    try {
      await updateDoc(doc(db, "users", selectedAdmin.id), {
        adminPermissions: adminPermissions,
      });
      showToast("تم تحديث صلاحيات المشرف بنجاح", "success");
      setIsPermissionsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
      showToast("فشل تحديث الصلاحيات", "error");
    }
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-amiri gradient-text">
            إدارة الأعضاء
          </h1>
          <p className="text-gray-400">قائمة المستخدمين والتحكم في صلاحياتهم</p>
        </div>
        <div className="relative w-full md:w-auto">
          <input
            type="text"
            placeholder="بحث عن عضو..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-style pl-10 pr-4 py-2 rounded-xl w-full md:w-64"
          />
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white/5 text-gray-400 text-sm">
              <tr>
                <th className="p-4">العضو</th>
                <th className="p-4">الدور</th>
                <th className="p-4">تاريخ الانضمام</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center font-bold overflow-hidden">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          user.name[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${user.role === "admin" ? "bg-yellow-500/20 text-yellow-300" : "bg-blue-500/20 text-blue-300"}`}
                    >
                      {user.role === "admin" ? "مشرف" : "عضو"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="p-4">
                    <span
                      className={`flex items-center gap-1 text-xs ${user.isBanned ? "text-red-400" : "text-green-400"}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${user.isBanned ? "bg-red-500" : "bg-green-500"}`}
                      ></span>
                      {user.isBanned ? "محظور" : "نشط"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleBan(user)}
                        className={`p-2 rounded-lg transition-colors ${user.isBanned ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}
                        title={user.isBanned ? "فك الحظر" : "حظر المستخدم"}
                      >
                        {user.isBanned ? (
                          <Icons.Check className="w-4 h-4" />
                        ) : (
                          <Icons.Ban className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openMessageModal(user)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        title="مراسلة على الخاص"
                      >
                        <Icons.Message className="w-4 h-4" />
                      </button>
                      {user.role !== "admin" && (
                        <button
                          onClick={() => promoteToAdmin(user)}
                          className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                          title="ترقية إلى مشرف"
                        >
                          <Icons.Crown className="w-4 h-4" />
                        </button>
                      )}
                      {user.role === "admin" && (
                        <button
                          onClick={() => openPermissionsModal(user)}
                          className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                          title="تعديل الصلاحيات"
                        >
                          <Icons.Settings className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا توجد نتائج مطابقة
          </div>
        )}
      </div>

      <Modal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        title={`مراسلة ${selectedUser?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2">عنوان الرسالة</label>
            <input
              value={messageTitle}
              onChange={(e) => setMessageTitle(e.target.value)}
              type="text"
              placeholder="الموضوع..."
              className="input-style w-full px-4 py-3 rounded-xl font-bold"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2">محتوى الرسالة</label>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="input-style w-full px-4 py-3 rounded-xl h-32 resize-none"
            />
          </div>
          <button
            onClick={handleSendMessage}
            className="btn-primary w-full py-3 rounded-xl font-bold"
          >
            إرسال الرسالة 📤
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        title={`صلاحيات المشرف: ${selectedAdmin?.name}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {AVAILABLE_PERMISSIONS.map((permission) => (
              <label
                key={permission.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={adminPermissions.includes(permission.id)}
                  onChange={() => togglePermission(permission.id)}
                  className="w-5 h-5 rounded border-gray-600 text-accent focus:ring-accent bg-transparent"
                />
                <span className="text-gray-200">{permission.label}</span>
              </label>
            ))}
          </div>
          <button
            onClick={handleSavePermissions}
            className="btn-primary w-full py-3 rounded-xl font-bold mt-4"
          >
            حفظ الصلاحيات
          </button>
        </div>
      </Modal>
    </div>
  );
};
