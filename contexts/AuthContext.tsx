import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { User } from "../types";
import { useToast } from "./ToastContext";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  adminLogin: (name: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch/create user from Firestore based on Firebase Auth
  const handleFirebaseUser = async (fbUser: FirebaseUser) => {
    try {
      const userRef = doc(db, "users", fbUser.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "users");
        return;
      }

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        if (userData.isBanned) {
          showToast("هذا الحساب محظور", "error");
          await firebaseSignOut(auth);
          setCurrentUser(null);
          return;
        }
        
        const isAdminEmail = fbUser.email === "mufadal735657255@gmail.com" || fbUser.email === "muf739839404@gmail.com";
        const updates: Partial<User> = { lastLogin: new Date().toISOString() };
        
        if (isAdminEmail && userData.role !== "admin") {
          updates.role = "admin";
          updates.specialty = "مدير النظام";
          userData.role = "admin";
          userData.specialty = "مدير النظام";
        }

        try {
          await updateDoc(userRef, updates);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, "users");
        }
        setCurrentUser({ ...userData, id: fbUser.uid });
      } else {
        // New User
        let name = fbUser.displayName || fbUser.email?.split("@")[0] || "User";
        const isAdminEmail = fbUser.email === "mufadal735657255@gmail.com" || fbUser.email === "muf739839404@gmail.com";
        const newUser: Omit<User, "id"> = {
          name,
          email: fbUser.email || "",
          specialty: isAdminEmail ? "مدير النظام" : "مستخدم",
          role: isAdminEmail ? "admin" : "user",
          isBanned: false,
          authMethod: fbUser.providerData[0]?.providerId || "email",
          emailVerified: fbUser.emailVerified,
          photoURL: fbUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        try {
          await setDoc(userRef, newUser);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, "users");
        }
        setCurrentUser({ ...newUser, id: fbUser.uid });
      }
    } catch (error) {
      console.error("Auth Error", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await handleFirebaseUser(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Safety timeout: if auth doesn't respond in 5 seconds, stop loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const adminLogin = async () => {
    // Legacy custom admin login is disabled because it bypasses Firebase Auth
    // and causes Firestore permission errors. Please use Google Login with an admin email instead.
    showToast("يرجى تسجيل الدخول باستخدام حساب جوجل الخاص بالمدير", "info");
    return false;
  };

  const logout = async () => {
    localStorage.removeItem("muf_user");
    await firebaseSignOut(auth);
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    if (currentUser && currentUser.authMethod !== "admin") {
      // Re-fetch logic if needed
    }
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, loading, adminLogin, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
