import React, { useState } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { Logo } from "../components/Logo";

export const Login: React.FC = () => {
  const [mode, setMode] = useState<"login" | "register">("login");

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error("Google Login Error:", e);
      if (e.code === "auth/unauthorized-domain") {
        setError(
          "هذا النطاق غير مصرح به في إعدادات Firebase. يرجى إضافة النطاق الحالي إلى قائمة النطاقات المصرح بها.",
        );
      } else if (e.code === "auth/popup-blocked") {
        setError(
          "تم حظر النافذة المنبثقة. يرجى السماح بالمنبثقات لهذا الموقع.",
        );
      } else if (e.code === "auth/cancelled-popup-request") {
        // Ignore user cancel
      } else {
        setError("فشل تسجيل الدخول بحساب جوجل. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    setError("");
    setIsLoading(true);
    
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    try {
      if (!trimmedEmail) {
        throw new Error("auth/empty-email");
      }
      if (!emailRegex.test(trimmedEmail)) {
        throw new Error("auth/invalid-email");
      }
      if (!password) {
        throw new Error("auth/empty-password");
      }

      if (mode === "login") {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      } else {
        if (password.length < 6) {
          throw new Error("auth/weak-password");
        }
        const userCred = await createUserWithEmailAndPassword(
          auth,
          trimmedEmail,
          password,
        );
        await sendEmailVerification(userCred.user);
      }
    } catch (e: any) {
      console.error("Auth Error:", e);
      let message = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
      
      const errorCode = e.code || e.message;

      switch (errorCode) {
        case "auth/invalid-email":
          message = "يرجى التأكد من كتابة البريد الإلكتروني بشكل صحيح 📧";
          break;
        case "auth/user-not-found":
          message = "هذا الحساب غير موجود. يرجى التأكد من البريد الإلكتروني 📧";
          break;
        case "auth/wrong-password":
          message = "كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى 🔒";
          break;
        case "auth/email-already-in-use":
          message = "هذا البريد الإلكتروني مستخدم بالفعل 📧";
          break;
        case "auth/weak-password":
          message = "كلمة المرور يجب أن تكون أكثر من 6 رموز 🔒";
          break;
        case "auth/empty-email":
          message = "يرجى إدخال البريد الإلكتروني 📧";
          break;
        case "auth/empty-password":
          message = "يرجى إدخال كلمة المرور 🔒";
          break;
        case "auth/network-request-failed":
          message = "فشل الاتصال بالشبكة. يرجى التحقق من اتصالك 🌐";
          break;
        case "auth/too-many-requests":
          message = "تم حظر المحاولات بسبب كثرة الطلبات. يرجى المحاولة لاحقاً ⏳";
          break;
        case "auth/invalid-credential":
          message = "بيانات الاعتماد غير صالحة. يرجى التأكد من البريد وكلمة المرور.";
          break;
        default:
          if (e.message && !e.message.startsWith("auth/")) {
            message = e.message;
          }
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto flex p-4 py-8 md:p-8">
      <div className="glass-card rounded-3xl p-6 md:p-10 w-full max-w-md animate-fade-in relative z-10 m-auto">
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center scale-75 md:scale-100">
            <Logo />
          </div>
          <h1 className="text-3xl font-bold gradient-text font-amiri mb-3">
            متحف الفكر
          </h1>
          <p className="text-base font-bold text-yellow-300 mb-1">
            🎓 جامعة زيان عاشور بالجلفة
          </p>
          <p className="text-gray-400 text-sm mb-4">
            بوابة الإبداع الفكرية الرقمية
          </p>
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">صاحبة فكرة المشروع</p>
            <p className="text-pink-400 font-bold text-sm font-tajawal">رشا سعاد شعيب</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
            {error}
          </div>
        )}


        <div className="space-y-4">
          {mode === "register" && (
            <>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                placeholder="اسم المستخدم"
                className="input-style w-full px-4 py-3 rounded-xl"
              />
              <input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                type="text"
                placeholder="التخصص (اختياري)"
                className="input-style w-full px-4 py-3 rounded-xl"
              />
            </>
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="البريد الإلكتروني"
            className="input-style w-full px-4 py-3 rounded-xl"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="كلمة المرور"
            className="input-style w-full px-4 py-3 rounded-xl"
          />

          <div className="text-right">
            <button
              onClick={() =>
                setMode(mode === "login" ? "register" : "login")
              }
              className="text-pink-400 hover:text-pink-300 text-sm font-medium p-2"
            >
              {mode === "login" ? "إنشاء حساب جديد" : "لديك حساب بالفعل؟"}
            </button>
          </div>

          <button
            onClick={handleEmailAuth}
            disabled={isLoading}
            className="btn-primary w-full py-3.5 rounded-xl text-lg"
          >
            {isLoading
              ? "جاري التحميل..."
              : mode === "login"
                ? "تسجيل الدخول"
                : "إنشاء حساب"}
          </button>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="px-3 text-sm text-gray-500">أو</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white text-gray-800 py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
              fill="#FF3D00"
              d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
          </svg>
          دخول بحساب جوجل
        </button>
      </div>
    </div>
  );
};
