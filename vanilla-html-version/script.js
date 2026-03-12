// script.js
import { auth, db, googleProvider } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// State
let currentUser = null;
let currentView = "login";
let isRegisterMode = false;
let globalData = {
  ideas: [],
  quotes: [],
  skills: [],
  suggestions: [],
  users: {},
};

// DOM Elements
const views = document.querySelectorAll(".view");
const navLinksContainer = document.getElementById("nav-links");
const logoutBtn = document.getElementById("logout-btn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const globalLoader = document.getElementById("global-loader");
const toastContainer = document.getElementById("toast-container");

// Routes
const routes = [
  { id: "home", label: "الرئيسية", icon: "fa-home" },
  { id: "feed", label: "معرض الأفكار", icon: "fa-lightbulb" },
  { id: "content", label: "المحتوى المعرفي", icon: "fa-book-open" },
  { id: "philosophy", label: "الفلسفة", icon: "fa-brain" },
  { id: "quotes", label: "عبارات ملهمة", icon: "fa-quote-right" },
  { id: "skills", label: "تطوير المهارات", icon: "fa-graduation-cap" },
  { id: "suggestions", label: "الاقتراحات", icon: "fa-envelope" },
  { id: "about", label: "عن المشروع", icon: "fa-info-circle" },
];

// Utilities
const showToast = (message, type = "info") => {
  const toast = document.createElement("div");
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };
  toast.className = `${colors[type]} text-white px-6 py-3 rounded-xl shadow-lg transform transition-all duration-300 translate-y-10 opacity-0 flex items-center gap-2`;
  toast.innerHTML = `<i class="fas ${type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : "fa-info-circle"}"></i> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.remove("translate-y-10", "opacity-0"), 10);
  setTimeout(() => {
    toast.classList.add("translate-y-10", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

const showLoader = () => globalLoader.classList.remove("hidden");
const hideLoader = () => globalLoader.classList.add("hidden");

// Gamification Logic
const getBadges = (userId) => {
  const userPosts = globalData.ideas.filter(
    (i) => i.authorId === userId,
  ).length;
  const userLikes = globalData.ideas
    .filter((i) => i.authorId === userId)
    .reduce((acc, curr) => acc + (curr.likes || 0), 0);
  const badges = [];
  if (userPosts >= 1)
    badges.push({
      icon: "🌱",
      name: "مبادر",
      color: "text-green-400",
      bg: "bg-green-500/20",
    });
  if (userPosts >= 5)
    badges.push({
      icon: "✍️",
      name: "كاتب نشط",
      color: "text-blue-400",
      bg: "bg-blue-500/20",
    });
  if (userPosts >= 20)
    badges.push({
      icon: "🎓",
      name: "مفكر",
      color: "text-purple-400",
      bg: "bg-purple-500/20",
    });
  if (userLikes >= 50)
    badges.push({
      icon: "⭐",
      name: "مؤثر",
      color: "text-yellow-400",
      bg: "bg-yellow-500/20",
    });
  if (userLikes >= 200)
    badges.push({
      icon: "👑",
      name: "أسطورة",
      color: "text-pink-400",
      bg: "bg-pink-500/20",
    });
  return badges;
};

// Navigation
function renderNav() {
  let currentRoutes = [...routes];
  if (currentUser?.role === "admin") {
    currentRoutes.push({
      id: "admin",
      label: "لوحة التحكم",
      icon: "fa-shield-alt",
    });
  }
  navLinksContainer.innerHTML = currentRoutes
    .map(
      (route) => `
        <button onclick="window.navigateTo('${route.id}')" id="nav-${route.id}" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition ${currentView === route.id ? "active-tab" : "text-gray-300 hover:bg-white/5 hover:text-white"}">
            <i class="fas ${route.icon} w-5 text-center"></i>
            <span class="font-bold">${route.label}</span>
        </button>
    `,
    )
    .join("");
}

window.navigateTo = (viewId, params = null) => {
  if (!currentUser && viewId !== "login") viewId = "login";
  currentView = viewId;
  views.forEach((v) => v.classList.add("hidden"));
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) targetView.classList.remove("hidden");
  renderNav();
  sidebar.classList.add("translate-x-full");
  sidebarOverlay.classList.add("hidden");

  if (viewId === "home") renderHome();
  if (viewId === "feed") renderFeed();
  if (viewId === "content") renderContent();
  if (viewId === "philosophy") renderPhilosophy();
  if (viewId === "quotes") renderQuotes();
  if (viewId === "skills") renderSkills();
  if (viewId === "suggestions") renderSuggestions();
  if (viewId === "profile") renderProfile(params?.userId || currentUser.uid);
  if (viewId === "admin") renderAdmin();
  if (viewId === "reels") renderReels();
};

mobileMenuBtn.addEventListener("click", () => {
  sidebar.classList.remove("hidden");
  setTimeout(() => {
    sidebar.classList.remove("translate-x-full");
    sidebarOverlay.classList.remove("hidden");
  }, 10);
});
sidebarOverlay.addEventListener("click", () => {
  sidebar.classList.add("translate-x-full");
  sidebarOverlay.classList.add("hidden");
});

// Authentication
const updateAuthUI = (user, userData = null) => {
  if (user) {
    currentUser = { ...user, ...userData };
    document.getElementById("user-name-text").innerText =
      userData?.name || user.email.split("@")[0];
    document.getElementById("user-specialty-text").innerText =
      userData?.specialty || "عضو";
    document.getElementById("user-avatar").innerText = (userData?.name ||
      user.email)[0].toUpperCase();

    document.getElementById("user-avatar").parentElement.onclick = () =>
      window.navigateTo("profile");
    document
      .getElementById("user-avatar")
      .parentElement.classList.add(
        "cursor-pointer",
        "hover:bg-white/5",
        "transition",
        "rounded-xl",
      );

    mobileMenuBtn.classList.remove("hidden");
    sidebar.classList.remove("hidden");
    window.navigateTo("home");
    fetchGlobalData();
  } else {
    currentUser = null;
    mobileMenuBtn.classList.add("hidden");
    sidebar.classList.add("hidden");
    window.navigateTo("login");
  }
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        updateAuthUI(user, userDoc.data());
      } else {
        const newUserData = {
          name: user.displayName || user.email.split("@")[0],
          email: user.email,
          role: "user",
          followers: [],
          following: [],
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", user.uid), newUserData);
        updateAuthUI(user, newUserData);
      }
    } catch (e) {
      updateAuthUI(user);
    }
  } else {
    updateAuthUI(null);
  }
});

document.getElementById("toggle-auth-mode").addEventListener("click", () => {
  isRegisterMode = !isRegisterMode;
  document.getElementById("register-fields").classList.toggle("hidden");
  document.getElementById("btn-auth-submit").innerText = isRegisterMode
    ? "إنشاء حساب"
    : "تسجيل الدخول";
  document.getElementById("toggle-auth-mode").innerText = isRegisterMode
    ? "لديك حساب بالفعل؟"
    : "إنشاء حساب جديد";
});

document
  .getElementById("btn-auth-submit")
  .addEventListener("click", async () => {
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    const name = document.getElementById("auth-name").value;
    const specialty = document.getElementById("auth-specialty").value;
    const errorDiv = document.getElementById("login-error");

    if (!email || !password || (isRegisterMode && !name)) {
      errorDiv.innerText = "يرجى ملء جميع الحقول المطلوبة";
      errorDiv.classList.remove("hidden");
      return;
    }

    errorDiv.classList.add("hidden");
    showLoader();
    try {
      if (isRegisterMode) {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await setDoc(doc(db, "users", userCred.user.uid), {
          name,
          email,
          specialty,
          role: "user",
          followers: [],
          following: [],
          createdAt: new Date().toISOString(),
        });
        showToast("تم إنشاء الحساب بنجاح", "success");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast("تم تسجيل الدخول بنجاح", "success");
      }
    } catch (error) {
      errorDiv.innerText = error.message;
      errorDiv.classList.remove("hidden");
    } finally {
      hideLoader();
    }
  });

document
  .getElementById("btn-google-login")
  .addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      showToast("خطأ في تسجيل الدخول بجوجل", "error");
    }
  });

document.getElementById("toggle-admin-login").addEventListener("click", () => {
  document.getElementById("admin-login-fields").classList.toggle("hidden");
});

document.getElementById("btn-admin-submit").addEventListener("click", () => {
  const code = document.getElementById("admin-secret-code").value;
  const errorDiv = document.getElementById("login-error");
  if (code === "admin123") {
    errorDiv.classList.add("hidden");
    updateAuthUI(
      { uid: "admin_fixed", email: "admin@system.local" },
      { name: "المدير العام", role: "admin", specialty: "إدارة النظام" },
    );
    showToast("تم تسجيل الدخول كمدير", "success");
  } else {
    errorDiv.innerText = "رمز الدخول غير صحيح";
    errorDiv.classList.remove("hidden");
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));

// Data Fetching
const fetchGlobalData = () => {
  onSnapshot(
    query(collection(db, "ideas"), orderBy("createdAt", "desc")),
    (snapshot) => {
      globalData.ideas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      if (currentView === "home") renderHome();
      if (currentView === "feed") renderFeed();
      if (currentView === "content") renderContent();
      if (currentView === "philosophy") renderPhilosophy();
      if (currentView === "profile")
        renderProfile(document.getElementById("profile-name").dataset.uid);
      if (currentView === "reels") renderReels();
      if (currentView === "admin") renderAdmin();
    },
  );
  onSnapshot(
    query(collection(db, "quotes"), orderBy("createdAt", "desc")),
    (snapshot) => {
      globalData.quotes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      if (currentView === "quotes") renderQuotes();
    },
  );
  onSnapshot(
    query(collection(db, "skills"), orderBy("createdAt", "desc")),
    (snapshot) => {
      globalData.skills = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      if (currentView === "skills") renderSkills();
    },
  );
  onSnapshot(
    query(collection(db, "suggestions"), orderBy("createdAt", "desc")),
    (snapshot) => {
      globalData.suggestions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      if (currentView === "suggestions") renderSuggestions();
      if (currentView === "admin") renderAdmin();
    },
  );
  onSnapshot(collection(db, "users"), (snapshot) => {
    snapshot.docs.forEach((doc) => {
      globalData.users[doc.id] = { id: doc.id, ...doc.data() };
    });
    if (currentView === "profile")
      renderProfile(document.getElementById("profile-name").dataset.uid);
    if (currentView === "admin") renderAdmin();
  });
};

// Render Functions
const renderHome = () => {
  document.getElementById("home-welcome").innerText =
    `مرحباً، ${currentUser?.name || "زائر"}`;
  document.getElementById("home-stats").innerHTML = `
        <div class="glass-card p-6 rounded-2xl text-center">
            <i class="fas fa-lightbulb text-3xl text-yellow-500 mb-2"></i>
            <h3 class="text-2xl font-bold">${globalData.ideas.length}</h3>
            <p class="text-gray-400 text-sm">فكرة ومقال</p>
        </div>
        <div class="glass-card p-6 rounded-2xl text-center">
            <i class="fas fa-quote-right text-3xl text-blue-500 mb-2"></i>
            <h3 class="text-2xl font-bold">${globalData.quotes.length}</h3>
            <p class="text-gray-400 text-sm">اقتباس</p>
        </div>
        <div class="glass-card p-6 rounded-2xl text-center">
            <i class="fas fa-graduation-cap text-3xl text-green-500 mb-2"></i>
            <h3 class="text-2xl font-bold">${globalData.skills.length}</h3>
            <p class="text-gray-400 text-sm">مصدر تعليمي</p>
        </div>
        <div class="glass-card p-6 rounded-2xl text-center">
            <i class="fas fa-heart text-3xl text-pink-500 mb-2"></i>
            <h3 class="text-2xl font-bold">${globalData.ideas.reduce((acc, curr) => acc + (curr.likes || 0), 0)}</h3>
            <p class="text-gray-400 text-sm">إعجاب</p>
        </div>
    `;

  // Quote of the day
  const qodContainer = document.getElementById("home-qod");
  if (qodContainer && globalData.quotes.length > 0) {
    const today = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < today.length; i++)
      hash = today.charCodeAt(i) + ((hash << 5) - hash);
    const qodIndex = Math.abs(hash) % globalData.quotes.length;
    const qod = globalData.quotes[qodIndex];
    qodContainer.innerHTML = `
            <div class="glass-card p-6 rounded-3xl relative overflow-hidden group mb-8 border-r-4 border-accent">
                <div class="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h3 class="text-lg font-bold text-accent mb-4 flex items-center gap-2"><i class="fas fa-star"></i> حكمة اليوم</h3>
                <p class="text-xl md:text-2xl font-amiri leading-loose text-white mb-4 relative z-10">"${qod.text}"</p>
                <div class="flex items-center gap-2 relative z-10">
                    <span class="font-bold text-sm text-gray-300">- ${qod.author}</span>
                </div>
            </div>
        `;
  } else if (qodContainer) {
    qodContainer.innerHTML = "";
  }

  // Best Comments
  const bestCommentsContainer = document.getElementById("home-best-comments");
  if (bestCommentsContainer) {
    let allComments = [];
    globalData.ideas.forEach((idea) => {
      if (idea.comments) {
        idea.comments.forEach((c) =>
          allComments.push({ ...c, ideaTitle: idea.title, ideaId: idea.id }),
        );
      }
    });
    allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const bestComments = allComments.slice(0, 3);

    if (bestComments.length > 0) {
      bestCommentsContainer.innerHTML = `
                <h3 class="text-2xl font-bold font-amiri mb-6 flex items-center gap-2"><i class="fas fa-comments text-blue-500"></i> أحدث التعليقات</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    ${bestComments
                      .map(
                        (c) => `
                        <div class="glass p-4 rounded-2xl cursor-pointer hover:bg-white/5 transition" onclick="window.navigateTo('feed')">
                            <div class="flex items-center gap-2 mb-2">
                                <div class="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">${c.author[0]}</div>
                                <span class="font-bold text-sm text-white">${c.author}</span>
                            </div>
                            <p class="text-sm text-gray-300 line-clamp-2 mb-2">"${c.text}"</p>
                            <p class="text-xs text-gray-500">على: ${c.ideaTitle}</p>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `;
    } else {
      bestCommentsContainer.innerHTML = "";
    }
  }

  const latestContainer = document.getElementById("home-latest-ideas");
  const latestIdeas = globalData.ideas.slice(0, 4);
  if (latestIdeas.length === 0) {
    latestContainer.innerHTML = `<div class="col-span-full text-center py-8 text-gray-500">لا توجد بيانات بعد</div>`;
    return;
  }
  latestContainer.innerHTML = latestIdeas
    .map(
      (idea) => `
        <div class="glass p-5 rounded-2xl card-hover cursor-pointer" onclick="window.navigateTo('feed')">
            <span class="text-xs text-accent font-bold mb-2 block">${idea.category || "عام"}</span>
            <h4 class="font-bold text-white mb-2 line-clamp-2">${idea.title}</h4>
            <p class="text-sm text-gray-400 line-clamp-2">${idea.content}</p>
        </div>
    `,
    )
    .join("");
};

const renderFeed = () => {
  const container = document.getElementById("feed-container");
  if (globalData.ideas.length === 0) {
    container.innerHTML = `<div class="text-center py-20 text-gray-500">لا توجد أفكار بعد. كن أول من يشارك!</div>`;
    return;
  }
  container.innerHTML = globalData.ideas
    .map((idea) => {
      const date = idea.createdAt
        ? new Date(idea.createdAt).toLocaleDateString("ar-EG")
        : "الآن";
      const isLiked = idea.likedBy?.includes(currentUser?.uid);
      const authorData = globalData.users[idea.authorId] || {
        name: idea.author,
      };
      const badges = getBadges(idea.authorId).slice(0, 2);
      const isOwner =
        idea.authorId === currentUser?.uid || currentUser?.role === "admin";

      return `
            <div class="glass rounded-3xl overflow-hidden card-hover group relative">
                ${isOwner ? `<button onclick="window.deletePost('ideas', '${idea.id}')" class="absolute top-4 left-4 text-gray-500 hover:text-red-500 transition z-10"><i class="fas fa-trash"></i></button>` : ""}
                <div class="p-5 flex items-center justify-between">
                    <div class="flex items-center gap-3 cursor-pointer" onclick="window.navigateTo('profile', {userId: '${idea.authorId}'})">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            ${(authorData.name || "U")[0].toUpperCase()}
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h4 class="font-bold text-white hover:text-pink-400 transition">${authorData.name || "مستخدم"}</h4>
                                ${badges.map((b) => `<span class="text-xs ${b.bg} ${b.color} px-1.5 py-0.5 rounded" title="${b.name}">${b.icon}</span>`).join("")}
                            </div>
                            <p class="text-[10px] text-gray-400">${date}</p>
                        </div>
                    </div>
                    <span class="bg-white/5 px-3 py-1 rounded-full text-xs text-gray-300 border border-white/10 mr-8">
                        ${idea.category || "عام"}
                    </span>
                </div>
                <div class="px-5 pb-4">
                    <h3 class="text-xl font-bold font-amiri text-white mb-2">${idea.title}</h3>
                    <p class="text-gray-300 font-amiri text-base leading-loose whitespace-pre-wrap">${idea.content}</p>
                </div>
                <div class="px-5 py-3 border-t border-white/5 flex items-center gap-6">
                    <button onclick="window.handleLike('${idea.id}')" class="flex items-center gap-2 transition ${isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"}">
                        <i class="${isLiked ? "fas" : "far"} fa-heart"></i>
                        <span class="text-sm font-bold">${idea.likes || 0}</span>
                    </button>
                    <button onclick="window.openComments('${idea.id}')" class="flex items-center gap-2 transition text-gray-400 hover:text-blue-400">
                        <i class="far fa-comment"></i>
                        <span class="text-sm font-bold">${(idea.comments || []).length}</span>
                    </button>
                </div>
            </div>
        `;
    })
    .join("");
};

let currentContentFilter = "all";
window.setContentFilter = (filter) => {
  currentContentFilter = filter;
  renderContent();
};

const renderContent = () => {
  const container = document.getElementById("content-container");
  const filtersContainer = document.getElementById("content-filters");
  const categories = ["أدب", "علوم", "تقنية", "فن"];

  if (filtersContainer) {
    const filters = ["all", ...categories];
    filtersContainer.innerHTML = filters
      .map(
        (f) => `
            <button onclick="window.setContentFilter('${f}')" class="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${currentContentFilter === f ? "bg-accent text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}">
                ${f === "all" ? "الكل" : f}
            </button>
        `,
      )
      .join("");
  }

  let articles = globalData.ideas.filter((i) =>
    categories.includes(i.category),
  );
  if (currentContentFilter !== "all") {
    articles = articles.filter((i) => i.category === currentContentFilter);
  }

  if (articles.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-20 text-gray-500">لا يوجد محتوى معرفي بعد.</div>`;
    return;
  }
  container.innerHTML = articles
    .map(
      (article) => `
        <div class="glass rounded-2xl overflow-hidden card-hover group flex flex-col relative">
            ${article.authorId === currentUser?.uid || currentUser?.role === "admin" ? `<button onclick="window.deletePost('ideas', '${article.id}')" class="absolute top-2 left-2 text-white/50 hover:text-red-500 transition z-10 bg-black/20 rounded-full w-8 h-8 flex items-center justify-center"><i class="fas fa-trash"></i></button>` : ""}
            <div class="h-32 bg-gradient-to-br from-indigo-900 to-purple-900 relative p-4 flex items-end cursor-pointer" onclick="window.navigateTo('feed')">
                <span class="absolute top-3 right-3 bg-black/40 px-3 py-1 rounded-full text-xs text-white border border-white/10">
                    ${article.category}
                </span>
                <h3 class="text-xl font-bold font-amiri text-white line-clamp-2">${article.title}</h3>
            </div>
            <div class="p-4 flex-grow flex flex-col">
                <p class="text-gray-400 text-sm line-clamp-3 mb-4 flex-grow">${article.content}</p>
                <div class="text-xs text-gray-500 pt-3 border-t border-white/5 flex items-center gap-2 cursor-pointer hover:text-pink-400" onclick="window.navigateTo('profile', {userId: '${article.authorId}'})">
                    <div class="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-white">${article.author[0]}</div>
                    ${article.author}
                </div>
            </div>
        </div>
    `,
    )
    .join("");
};

const renderPhilosophy = () => {
  const container = document.getElementById("philosophy-container");
  const articles = globalData.ideas.filter((i) => i.category === "فلسفة");
  if (articles.length === 0) {
    container.innerHTML = `<div class="text-center py-20 text-gray-500">لا يوجد محتوى فلسفي بعد.</div>`;
    return;
  }
  container.innerHTML = articles
    .map(
      (item) => `
        <div class="glass p-6 rounded-2xl border-r-4 border-l-0 border-yellow-500 relative overflow-hidden group">
            ${item.authorId === currentUser?.uid || currentUser?.role === "admin" ? `<button onclick="window.deletePost('ideas', '${item.id}')" class="absolute top-4 left-4 text-gray-500 hover:text-red-500 transition z-10"><i class="fas fa-trash"></i></button>` : ""}
            <div class="flex items-center gap-3 mb-4 cursor-pointer" onclick="window.navigateTo('profile', {userId: '${item.authorId}'})">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white">
                    <i class="fas fa-lightbulb"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white hover:text-yellow-400 transition">${item.author}</h3>
                    <p class="text-xs text-gray-400">فيلسوف / مفكر</p>
                </div>
            </div>
            <h2 class="text-xl font-bold font-amiri mb-3 text-white">${item.title}</h2>
            <p class="text-gray-300 leading-loose text-base font-amiri pl-4 border-l border-white/10 whitespace-pre-wrap">${item.content}</p>
        </div>
    `,
    )
    .join("");
};

const renderQuotes = () => {
  const container = document.getElementById("quotes-container");
  if (globalData.quotes.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-20 text-gray-500">لا توجد اقتباسات بعد.</div>`;
    return;
  }
  container.innerHTML = globalData.quotes
    .map(
      (quote) => `
        <div class="glass-card p-6 rounded-3xl relative overflow-hidden group card-hover">
            ${quote.addedBy === currentUser?.uid || currentUser?.role === "admin" ? `<button onclick="window.deletePost('quotes', '${quote.id}')" class="absolute top-4 left-4 text-gray-500 hover:text-red-500 transition z-20"><i class="fas fa-trash"></i></button>` : ""}
            <i class="fas fa-quote-right absolute -top-4 -right-4 text-6xl text-white/5 group-hover:text-accent/10 transition-colors"></i>
            <p class="text-xl md:text-2xl font-amiri leading-loose text-white mb-6 relative z-10">"${quote.text}"</p>
            <div class="flex items-center gap-3 relative z-10 cursor-pointer" onclick="window.navigateTo('profile', {userId: '${quote.addedBy}'})">
                <div class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                    <i class="fas fa-pen-nib text-xs"></i>
                </div>
                <div>
                    <h4 class="font-bold text-sm text-white hover:text-pink-400 transition">${quote.author}</h4>
                    <p class="text-xs text-gray-400">${quote.source || "مقولة مأثورة"}</p>
                </div>
            </div>
        </div>
    `,
    )
    .join("");
};

let currentSkillFilter = "all";
window.setSkillFilter = (filter) => {
  currentSkillFilter = filter;
  renderSkills();
};

const renderSkills = () => {
  const container = document.getElementById("skills-container");
  const filtersContainer = document.getElementById("skills-filters");

  if (filtersContainer) {
    const filters = [
      { id: "all", label: "الكل", icon: "fa-layer-group" },
      { id: "course", label: "دورات", icon: "fa-laptop-code" },
      { id: "book", label: "كتب", icon: "fa-book" },
      { id: "podcast", label: "بودكاست", icon: "fa-podcast" },
    ];
    filtersContainer.innerHTML = filters
      .map(
        (f) => `
            <button onclick="window.setSkillFilter('${f.id}')" class="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${currentSkillFilter === f.id ? "bg-accent text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}">
                <i class="fas ${f.icon} mr-1"></i> ${f.label}
            </button>
        `,
      )
      .join("");
  }

  let skills = globalData.skills;
  if (currentSkillFilter !== "all") {
    skills = skills.filter((s) => s.type === currentSkillFilter);
  }

  if (skills.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-20 text-gray-500">لا توجد مصادر بعد.</div>`;
    return;
  }
  container.innerHTML = skills
    .map(
      (skill) => `
        <div class="glass-card rounded-2xl overflow-hidden card-hover flex flex-col relative">
            ${skill.addedBy === currentUser?.uid || currentUser?.role === "admin" ? `<button onclick="window.deletePost('skills', '${skill.id}')" class="absolute top-2 left-2 text-white/50 hover:text-red-500 transition z-10 bg-black/20 rounded-full w-8 h-8 flex items-center justify-center"><i class="fas fa-trash"></i></button>` : ""}
            <div class="h-32 bg-gray-800 relative flex items-center justify-center">
                <i class="fas ${skill.type === "course" ? "fa-laptop-code text-blue-500" : skill.type === "book" ? "fa-book text-yellow-500" : "fa-podcast text-purple-500"} text-5xl"></i>
            </div>
            <div class="p-5 flex-grow flex flex-col">
                <span class="text-xs font-bold text-accent mb-2">${skill.type === "course" ? "دورة" : skill.type === "book" ? "كتاب" : "بودكاست"}</span>
                <h3 class="text-lg font-bold text-white mb-2 line-clamp-2">${skill.title}</h3>
                <p class="text-sm text-gray-400 mb-4 flex-grow line-clamp-2">${skill.description}</p>
                <a href="${skill.link}" target="_blank" class="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-center text-sm font-bold transition">
                    عرض المصدر <i class="fas fa-external-link-alt ml-1 text-xs"></i>
                </a>
            </div>
        </div>
    `,
    )
    .join("");
};

const renderSuggestions = () => {
  const container = document.getElementById("suggestions-list");
  const mySuggestions = globalData.suggestions.filter(
    (s) => s.userId === currentUser?.uid,
  );
  if (mySuggestions.length === 0) {
    container.innerHTML = `<div class="text-center py-10 text-gray-500">لم تقم بإرسال أي مقترحات بعد.</div>`;
    return;
  }
  container.innerHTML = mySuggestions
    .map(
      (sugg) => `
        <div class="glass p-4 rounded-2xl border-r-4 ${sugg.status === "pending" ? "border-yellow-500" : sugg.status === "replied" ? "border-green-500" : "border-red-500"} relative">
            <button onclick="window.deletePost('suggestions', '${sugg.id}')" class="absolute top-4 left-4 text-gray-500 hover:text-red-500 transition"><i class="fas fa-trash"></i></button>
            <div class="flex justify-between items-start mb-2 pr-8">
                <h4 class="font-bold text-white">${sugg.title}</h4>
                <span class="text-xs px-2 py-1 rounded-full ${sugg.status === "pending" ? "bg-yellow-500/20 text-yellow-300" : sugg.status === "replied" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}">
                    ${sugg.status === "pending" ? "قيد الانتظار" : sugg.status === "replied" ? "تم الرد" : "مرفوض"}
                </span>
            </div>
            <p class="text-sm text-gray-400 mb-2">${sugg.content}</p>
            ${
              sugg.replyContent
                ? `
                <div class="mt-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                    <p class="text-xs text-green-400 font-bold mb-1">رد الإدارة:</p>
                    <p class="text-sm text-gray-300">${sugg.replyContent}</p>
                </div>
            `
                : ""
            }
        </div>
    `,
    )
    .join("");
};

const renderProfile = (userId) => {
  if (!userId) return;
  const user = globalData.users[userId];
  if (!user) return;

  document.getElementById("profile-name").innerText = user.name;
  document.getElementById("profile-name").dataset.uid = userId;
  document.getElementById("profile-specialty").innerText =
    user.specialty || "عضو";
  document.getElementById("profile-avatar").innerText =
    user.name[0].toUpperCase();

  const followers = user.followers || [];
  const following = user.following || [];
  document.getElementById("profile-followers").innerText = followers.length;
  document.getElementById("profile-following").innerText = following.length;

  const badges = getBadges(userId);
  document.getElementById("profile-badges").innerHTML = badges
    .map(
      (b) =>
        `<span class="${b.bg} ${b.color} px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1" title="${b.name}">${b.icon} ${b.name}</span>`,
    )
    .join("");

  const actionsContainer = document.getElementById("profile-actions");
  if (userId === currentUser?.uid) {
    actionsContainer.innerHTML = `<button onclick="window.openModal('edit-profile')" class="btn-secondary px-6 py-2 rounded-xl font-bold">تعديل الملف</button>`;
  } else {
    const isFollowing = followers.includes(currentUser?.uid);
    actionsContainer.innerHTML = `
            <button onclick="window.toggleFollow('${userId}')" class="${isFollowing ? "btn-secondary" : "btn-primary"} px-6 py-2 rounded-xl font-bold transition">
                ${isFollowing ? "إلغاء المتابعة" : "متابعة"}
            </button>
        `;
  }

  const userPosts = globalData.ideas.filter((i) => i.authorId === userId);
  const postsContainer = document.getElementById("profile-posts");
  if (userPosts.length === 0) {
    postsContainer.innerHTML = `<div class="text-center py-10 text-gray-500">لا توجد منشورات.</div>`;
  } else {
    postsContainer.innerHTML = userPosts
      .map(
        (idea) => `
            <div class="glass p-5 rounded-2xl">
                <span class="text-xs text-accent font-bold mb-2 block">${idea.category || "عام"}</span>
                <h4 class="font-bold text-white mb-2">${idea.title}</h4>
                <p class="text-sm text-gray-400 line-clamp-2">${idea.content}</p>
            </div>
        `,
      )
      .join("");
  }

  const achievementsContainer = document.getElementById("profile-achievements");
  achievementsContainer.innerHTML = `
        <div class="glass p-4 rounded-xl flex items-center justify-between">
            <span class="text-gray-300">المنشورات</span>
            <span class="font-bold text-white">${userPosts.length}</span>
        </div>
        <div class="glass p-4 rounded-xl flex items-center justify-between">
            <span class="text-gray-300">الإعجابات المتلقاة</span>
            <span class="font-bold text-pink-400">${userPosts.reduce((acc, curr) => acc + (curr.likes || 0), 0)}</span>
        </div>
        <div class="glass p-4 rounded-xl flex items-center justify-between">
            <span class="text-gray-300">تاريخ الانضمام</span>
            <span class="font-bold text-white">${new Date(user.createdAt).toLocaleDateString("ar-EG")}</span>
        </div>
    `;
};

const renderReels = () => {
  const container = document.getElementById("reels-container");
  if (globalData.ideas.length === 0) {
    container.innerHTML = `<div class="h-full flex items-center justify-center text-gray-500">لا توجد أفكار بعد.</div>`;
    return;
  }
  container.innerHTML = globalData.ideas
    .map((idea) => {
      const isLiked = idea.likedBy?.includes(currentUser?.uid);
      const authorData = globalData.users[idea.authorId] || {
        name: idea.author,
      };
      return `
            <div class="h-full w-full snap-start snap-always relative flex items-center justify-center bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-6">
                <div class="max-w-md w-full">
                    <div class="glass-card p-8 rounded-3xl shadow-2xl relative">
                        <div class="absolute -top-6 -right-6 text-6xl opacity-10">💡</div>
                        <span class="bg-white/10 px-3 py-1 rounded-full text-xs text-white mb-4 inline-block">${idea.category || "عام"}</span>
                        <h2 class="text-2xl md:text-3xl font-bold font-amiri text-white mb-6 leading-tight">${idea.title}</h2>
                        <p class="text-gray-200 font-amiri text-lg md:text-xl leading-loose mb-8">${idea.content}</p>
                        
                        <div class="flex items-center justify-between border-t border-white/10 pt-6">
                            <div class="flex items-center gap-3 cursor-pointer" onclick="window.navigateTo('profile', {userId: '${idea.authorId}'})">
                                <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold">
                                    ${(authorData.name || "U")[0].toUpperCase()}
                                </div>
                                <div>
                                    <h4 class="font-bold text-white text-sm">${authorData.name || "مستخدم"}</h4>
                                    <p class="text-[10px] text-gray-400">${new Date(idea.createdAt).toLocaleDateString("ar-EG")}</p>
                                </div>
                            </div>
                            
                            <div class="flex items-center gap-4">
                                <button onclick="window.handleLike('${idea.id}')" class="flex flex-col items-center gap-1 transition ${isLiked ? "text-red-500" : "text-white hover:text-red-400"}">
                                    <i class="${isLiked ? "fas" : "far"} fa-heart text-2xl"></i>
                                    <span class="text-xs font-bold">${idea.likes || 0}</span>
                                </button>
                                <button onclick="window.openComments('${idea.id}')" class="flex flex-col items-center gap-1 transition text-white hover:text-blue-400">
                                    <i class="far fa-comment text-2xl"></i>
                                    <span class="text-xs font-bold">${(idea.comments || []).length}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");
};

const renderAdmin = () => {
  if (currentUser?.role !== "admin") {
    window.navigateTo("home");
    return;
  }

  document.getElementById("admin-stats-users").innerText = Object.keys(
    globalData.users,
  ).length;
  document.getElementById("admin-stats-posts").innerText =
    globalData.ideas.length;
  document.getElementById("admin-stats-suggestions").innerText =
    globalData.suggestions.filter((s) => s.status === "pending").length;

  const usersList = document.getElementById("admin-users-list");
  usersList.innerHTML = Object.values(globalData.users)
    .map(
      (user) => `
        <div class="bg-white/5 p-4 rounded-xl flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white">${user.name[0]}</div>
                <div>
                    <h4 class="font-bold text-white">${user.name}</h4>
                    <p class="text-xs text-gray-400">${user.email}</p>
                </div>
            </div>
            <div class="flex gap-2">
                <span class="px-2 py-1 rounded text-xs ${user.role === "admin" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}">${user.role === "admin" ? "مشرف" : "مستخدم"}</span>
                ${user.role !== "admin" ? `<button onclick="window.toggleBanUser('${user.id}', ${user.banned})" class="text-xs px-3 py-1 rounded ${user.banned ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"} transition">${user.banned ? "فك الحظر" : "حظر"}</button>` : ""}
            </div>
        </div>
    `,
    )
    .join("");

  const suggList = document.getElementById("admin-suggestions-list");
  suggList.innerHTML = globalData.suggestions
    .map(
      (sugg) => `
        <div class="bg-white/5 p-4 rounded-xl border-r-4 ${sugg.status === "pending" ? "border-yellow-500" : sugg.status === "replied" ? "border-green-500" : "border-red-500"}">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h4 class="font-bold text-white">${sugg.title}</h4>
                    <p class="text-xs text-gray-400">من: ${sugg.author}</p>
                </div>
                <span class="text-xs px-2 py-1 rounded-full ${sugg.status === "pending" ? "bg-yellow-500/20 text-yellow-300" : sugg.status === "replied" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}">
                    ${sugg.status === "pending" ? "قيد الانتظار" : sugg.status === "replied" ? "تم الرد" : "مرفوض"}
                </span>
            </div>
            <p class="text-sm text-gray-300 mb-3">${sugg.content}</p>
            ${
              sugg.status === "pending"
                ? `
                <div class="flex gap-2 mt-2">
                    <input type="text" id="reply-${sugg.id}" placeholder="اكتب رداً..." class="input-style flex-1 rounded-lg px-3 py-1 text-sm">
                    <button onclick="window.replySuggestion('${sugg.id}')" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition">رد</button>
                    <button onclick="window.rejectSuggestion('${sugg.id}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition">رفض</button>
                </div>
            `
                : sugg.replyContent
                  ? `
                <div class="mt-2 p-2 bg-black/20 rounded border border-white/5 text-sm text-gray-400">
                    <span class="text-green-400 font-bold">الرد:</span> ${sugg.replyContent}
                </div>
            `
                  : ""
            }
        </div>
    `,
    )
    .join("");
};

window.toggleBanUser = async (userId, isBanned) => {
  if (confirm(`هل أنت متأكد من ${isBanned ? "فك حظر" : "حظر"} هذا المستخدم؟`)) {
    try {
      await updateDoc(doc(db, "users", userId), { banned: !isBanned });
      showToast("تم تحديث حالة المستخدم", "success");
    } catch (e) {
      showToast("حدث خطأ", "error");
    }
  }
};

window.replySuggestion = async (suggId) => {
  const replyText = document.getElementById(`reply-${suggId}`).value;
  if (!replyText) return showToast("يرجى كتابة الرد", "error");
  try {
    await updateDoc(doc(db, "suggestions", suggId), {
      status: "replied",
      replyContent: replyText,
    });
    showToast("تم إرسال الرد", "success");
  } catch (e) {
    showToast("حدث خطأ", "error");
  }
};

window.rejectSuggestion = async (suggId) => {
  if (confirm("هل أنت متأكد من رفض هذا المقترح؟")) {
    try {
      await updateDoc(doc(db, "suggestions", suggId), { status: "rejected" });
      showToast("تم رفض المقترح", "success");
    } catch (e) {
      showToast("حدث خطأ", "error");
    }
  }
};

window.exportData = () => {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(globalData));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "museum_of_thought_backup.json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

// Interactions
window.handleLike = async (ideaId) => {
  if (!currentUser) return showToast("يجب تسجيل الدخول للإعجاب", "error");
  const idea = globalData.ideas.find((i) => i.id === ideaId);
  if (!idea) return;
  const likedBy = idea.likedBy || [];
  const isLiked = likedBy.includes(currentUser.uid);
  const newLikedBy = isLiked
    ? likedBy.filter((id) => id !== currentUser.uid)
    : [...likedBy, currentUser.uid];
  const newLikes = Math.max(0, (idea.likes || 0) + (isLiked ? -1 : 1));
  try {
    await updateDoc(doc(db, "ideas", ideaId), {
      likes: newLikes,
      likedBy: newLikedBy,
    });
  } catch (e) {
    showToast("حدث خطأ", "error");
  }
};

window.toggleFollow = async (targetUserId) => {
  if (!currentUser) return showToast("يجب تسجيل الدخول للمتابعة", "error");
  try {
    const targetUserRef = doc(db, "users", targetUserId);
    const currentUserRef = doc(db, "users", currentUser.uid);
    const targetUser = globalData.users[targetUserId];
    const isFollowing = targetUser.followers?.includes(currentUser.uid);

    if (isFollowing) {
      await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUser.uid),
      });
      await updateDoc(currentUserRef, { following: arrayRemove(targetUserId) });
    } else {
      await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUser.uid),
      });
      await updateDoc(currentUserRef, { following: arrayUnion(targetUserId) });
      showToast("تمت المتابعة", "success");
    }
  } catch (e) {
    showToast("حدث خطأ", "error");
  }
};

window.deletePost = async (collectionName, id) => {
  if (confirm("هل أنت متأكد من حذف هذا العنصر؟")) {
    try {
      await deleteDoc(doc(db, collectionName, id));
      showToast("تم الحذف بنجاح", "success");
    } catch (e) {
      showToast("خطأ في الحذف", "error");
    }
  }
};

// Comments
let currentCommentIdeaId = null;
window.openComments = (ideaId) => {
  currentCommentIdeaId = ideaId;
  const modal = document.getElementById("comments-modal");
  modal.classList.remove("hidden");
  setTimeout(() => modal.classList.remove("opacity-0"), 10);
  renderComments();
};

window.closeCommentsModal = () => {
  const modal = document.getElementById("comments-modal");
  modal.classList.add("opacity-0");
  setTimeout(() => modal.classList.add("hidden"), 300);
  currentCommentIdeaId = null;
};

const renderComments = () => {
  if (!currentCommentIdeaId) return;
  const idea = globalData.ideas.find((i) => i.id === currentCommentIdeaId);
  const list = document.getElementById("comments-list");
  const comments = idea?.comments || [];

  if (comments.length === 0) {
    list.innerHTML = `<div class="text-center py-10 text-gray-500">لا توجد تعليقات بعد. كن أول من يعلق!</div>`;
    return;
  }

  list.innerHTML = comments
    .map(
      (c) => `
        <div class="bg-white/5 p-3 rounded-xl relative group">
            ${c.authorId === currentUser?.uid || currentUser?.role === "admin" ? `<button onclick="window.deleteComment('${c.id}')" class="absolute top-2 left-2 text-gray-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><i class="fas fa-trash text-xs"></i></button>` : ""}
            <div class="flex items-center gap-2 mb-2">
                <div class="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">${c.author[0]}</div>
                <span class="font-bold text-sm text-white">${c.author}</span>
                <span class="text-[10px] text-gray-400">${new Date(c.createdAt).toLocaleDateString("ar-EG")}</span>
            </div>
            <p class="text-sm text-gray-300 pl-8">${c.text}</p>
        </div>
    `,
    )
    .join("");
  list.scrollTop = list.scrollHeight;
};

document
  .getElementById("btn-submit-comment")
  .addEventListener("click", async () => {
    if (!currentUser) return showToast("يجب تسجيل الدخول للتعليق", "error");
    const input = document.getElementById("new-comment-text");
    const text = input.value.trim();
    if (!text || !currentCommentIdeaId) return;

    try {
      const newComment = {
        id: Date.now().toString(),
        text,
        author: currentUser.name || currentUser.email.split("@")[0],
        authorId: currentUser.uid,
        createdAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, "ideas", currentCommentIdeaId), {
        comments: arrayUnion(newComment),
      });
      input.value = "";
      renderComments();
    } catch (e) {
      showToast("فشل إضافة التعليق", "error");
    }
  });

window.deleteComment = async (commentId) => {
  if (!currentCommentIdeaId) return;
  if (confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
    try {
      const idea = globalData.ideas.find((i) => i.id === currentCommentIdeaId);
      const commentToDelete = idea.comments.find((c) => c.id === commentId);
      await updateDoc(doc(db, "ideas", currentCommentIdeaId), {
        comments: arrayRemove(commentToDelete),
      });
      showToast("تم حذف التعليق", "success");
      renderComments();
    } catch (e) {
      showToast("خطأ في الحذف", "error");
    }
  }
};

// Modals
const modalOverlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");

window.openModal = (type) => {
  modalOverlay.classList.remove("hidden");
  setTimeout(() => modalOverlay.classList.remove("opacity-0"), 10);

  if (type === "add-idea" || type === "add-philosophy") {
    const isPhilosophy = type === "add-philosophy";
    modalTitle.innerText = isPhilosophy
      ? "إضافة حكمة فلسفية"
      : "إضافة فكرة جديدة";
    modalBody.innerHTML = `
            <select id="new-category" class="input-style w-full px-4 py-3 rounded-xl mb-4" ${isPhilosophy ? "disabled" : ""}>
                <option value="عام" ${!isPhilosophy ? "selected" : ""}>عام</option>
                <option value="فلسفة" ${isPhilosophy ? "selected" : ""}>فلسفة</option>
                <option value="علوم">علوم</option>
                <option value="أدب">أدب</option>
                <option value="تقنية">تقنية</option>
            </select>
            <input type="text" id="new-title" placeholder="العنوان" class="input-style w-full px-4 py-3 rounded-xl mb-4">
            <textarea id="new-content" placeholder="المحتوى..." class="input-style w-full px-4 py-3 rounded-xl mb-6 h-40 resize-none"></textarea>
            <button onclick="window.submitIdea()" class="btn-primary w-full py-3 rounded-xl font-bold">نشر</button>
        `;
  } else if (type === "add-quote") {
    modalTitle.innerText = "إضافة اقتباس";
    modalBody.innerHTML = `
            <textarea id="new-quote-text" placeholder="نص الاقتباس..." class="input-style w-full px-4 py-3 rounded-xl mb-4 h-32 resize-none"></textarea>
            <input type="text" id="new-quote-author" placeholder="القائل" class="input-style w-full px-4 py-3 rounded-xl mb-4">
            <input type="text" id="new-quote-source" placeholder="المصدر (كتاب، مقال...)" class="input-style w-full px-4 py-3 rounded-xl mb-6">
            <button onclick="window.submitQuote()" class="btn-primary w-full py-3 rounded-xl font-bold">إضافة</button>
        `;
  } else if (type === "add-skill") {
    modalTitle.innerText = "إضافة مصدر تعليمي";
    modalBody.innerHTML = `
            <select id="new-skill-type" class="input-style w-full px-4 py-3 rounded-xl mb-4">
                <option value="course">دورة تدريبية</option>
                <option value="book">كتاب</option>
                <option value="podcast">بودكاست</option>
            </select>
            <input type="text" id="new-skill-title" placeholder="عنوان المصدر" class="input-style w-full px-4 py-3 rounded-xl mb-4">
            <textarea id="new-skill-desc" placeholder="وصف مختصر..." class="input-style w-full px-4 py-3 rounded-xl mb-4 h-24 resize-none"></textarea>
            <input type="url" id="new-skill-link" placeholder="رابط المصدر" class="input-style w-full px-4 py-3 rounded-xl mb-6">
            <button onclick="window.submitSkill()" class="btn-primary w-full py-3 rounded-xl font-bold">إضافة</button>
        `;
  } else if (type === "edit-profile") {
    modalTitle.innerText = "تعديل الملف الشخصي";
    modalBody.innerHTML = `
            <input type="text" id="edit-name" value="${currentUser.name || ""}" placeholder="الاسم" class="input-style w-full px-4 py-3 rounded-xl mb-4">
            <input type="text" id="edit-specialty" value="${currentUser.specialty || ""}" placeholder="التخصص" class="input-style w-full px-4 py-3 rounded-xl mb-6">
            <button onclick="window.submitProfileEdit()" class="btn-primary w-full py-3 rounded-xl font-bold">حفظ التغييرات</button>
        `;
  }
};

window.closeModal = () => {
  modalOverlay.classList.add("opacity-0");
  setTimeout(() => modalOverlay.classList.add("hidden"), 300);
};

// Submissions
window.submitIdea = async () => {
  const title = document.getElementById("new-title").value;
  const content = document.getElementById("new-content").value;
  const category = document.getElementById("new-category").value;

  if (!title || !content) return showToast("يرجى ملء جميع الحقول", "error");

  showLoader();
  try {
    await addDoc(collection(db, "ideas"), {
      title,
      content,
      category,
      author: currentUser.name || currentUser.email.split("@")[0],
      authorId: currentUser.uid,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      comments: [],
    });
    showToast("تم النشر بنجاح", "success");
    window.closeModal();
  } catch (e) {
    showToast("فشل النشر", "error");
  } finally {
    hideLoader();
  }
};

window.submitQuote = async () => {
  const text = document.getElementById("new-quote-text").value;
  const author = document.getElementById("new-quote-author").value;
  const source = document.getElementById("new-quote-source").value;

  if (!text || !author) return showToast("يرجى إدخال النص والقائل", "error");

  showLoader();
  try {
    await addDoc(collection(db, "quotes"), {
      text,
      author,
      source,
      addedBy: currentUser.uid,
      createdAt: new Date().toISOString(),
    });
    showToast("تمت الإضافة بنجاح", "success");
    window.closeModal();
  } catch (e) {
    showToast("فشل الإضافة", "error");
  } finally {
    hideLoader();
  }
};

window.submitSkill = async () => {
  const title = document.getElementById("new-skill-title").value;
  const description = document.getElementById("new-skill-desc").value;
  const link = document.getElementById("new-skill-link").value;
  const type = document.getElementById("new-skill-type").value;

  if (!title || !link) return showToast("يرجى إدخال العنوان والرابط", "error");

  showLoader();
  try {
    await addDoc(collection(db, "skills"), {
      title,
      description,
      link,
      type,
      addedBy: currentUser.uid,
      createdAt: new Date().toISOString(),
    });
    showToast("تمت الإضافة بنجاح", "success");
    window.closeModal();
  } catch (e) {
    showToast("فشل الإضافة", "error");
  } finally {
    hideLoader();
  }
};

window.submitProfileEdit = async () => {
  const name = document.getElementById("edit-name").value;
  const specialty = document.getElementById("edit-specialty").value;

  if (!name) return showToast("الاسم مطلوب", "error");

  showLoader();
  try {
    await updateDoc(doc(db, "users", currentUser.uid), { name, specialty });
    showToast("تم تحديث الملف الشخصي بنجاح", "success");
    window.closeModal();
  } catch (e) {
    showToast("فشل تحديث الملف", "error");
  } finally {
    hideLoader();
  }
};

document
  .getElementById("btn-submit-sugg")
  .addEventListener("click", async () => {
    const title = document.getElementById("sugg-title").value;
    const content = document.getElementById("sugg-content").value;
    const type = document.getElementById("sugg-type").value;

    if (!title || !content) return showToast("يرجى ملء جميع الحقول", "error");

    showLoader();
    try {
      await addDoc(collection(db, "suggestions"), {
        title,
        content,
        suggestionType: type,
        author: currentUser.name || currentUser.email.split("@")[0],
        userId: currentUser.uid,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      showToast("تم إرسال مقترحك بنجاح", "success");
      document.getElementById("sugg-title").value = "";
      document.getElementById("sugg-content").value = "";
    } catch (e) {
      showToast("فشل الإرسال", "error");
    } finally {
      hideLoader();
    }
  });

// Init
hideLoader();
