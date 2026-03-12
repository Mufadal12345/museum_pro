export type UserRole = "admin" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  specialty: string;
  role: UserRole;
  isBanned: boolean;
  authMethod: string;
  emailVerified: boolean;
  photoURL?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  adminPermissions?: string[]; // e.g. 'manage_suggestions', 'message_members', 'manage_admins', 'ban_members', 'view_members', 'manage_database'
  createdAt: string;
  lastLogin?: string;
}

export interface AdminGroupMessage {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Idea {
  id: string;
  title: string;
  category: string;
  content: string;
  author: string;
  authorId: string;
  authorRole: UserRole;
  views: number;
  viewedBy: string[];
  likes: number;
  likedBy: string | string[]; // Support both legacy and new formats
  featured: boolean;
  deleted: boolean;
  createdAt: string;
  showAfter?: string;
}

export interface IdeaComment {
  id: string;
  ideaId?: string; // Legacy
  targetId: string;
  targetType: "idea" | "library";
  text: string;
  userId: string;
  authorName: string;
  authorRole: UserRole;
  likes: number;
  likedBy: string[];
  parentCommentId: string | null;
  replies: number;
  deleted: boolean;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  type: string;
  description: string;
  link: string;
  preview?: LinkPreview;
  addedBy: string;
  addedByRole: UserRole;
  createdAt: string;
  likes?: number;
  likedBy?: string[];
  views?: number;
}

export interface Bookmark {
  id: string;
  userId: string;
  courseId: string;
  createdAt: string;
}

export interface LinkPreview {
  title: string;
  description: string;
  image: string | null;
  domain: string;
  url: string;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  addedBy?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Suggestion {
  id: string;
  type: string;
  suggestionType: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  status: "pending" | "approved" | "rejected" | "replied";
  createdAt: string;
  replyContent?: string;
  repliedBy?: string;
  repliedAt?: string;
}

export interface Message {
  id: string;
  title: string;
  type: string;
  content: string;
  from: string;
  fromId: string;
  toUserId?: string;
  status: string;
  read: boolean;
  createdAt: string;
}

export interface AdminMessage {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "error" | "success";
  from: string;
  fromId: string;
  toUserId: string;
  read: boolean;
  createdAt: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  description: string;
  type: "book" | "image";
  fileUrl: string;
  thumbnailUrl?: string;
  author: string;
  authorId: string;
  authorRole: UserRole;
  likes: number;
  likedBy: string[];
  views: number;
  category: string;
  deleted: boolean;
  createdAt: string;
}

export const ADMINS = [
  { name: "Rasha", code: "20250929" },
  { name: "MUF", code: "CS" },
];

export const CATEGORY_ICONS: Record<string, string> = {
  فلسفة: "🧠",
  تقنية: "💻",
  أدب: "📖",
  علوم: "🔬",
  فن: "🎨",
  اجتماع: "👥",
};

export const COURSE_ICONS: Record<string, string> = {
  "قناة يوتيوب": "📺",
  "كورس أونلاين": "🎓",
  "منصة تعليمية": "💻",
  مقالات: "📝",
  كتب: "📚",
  بودكاست: "🎙️",
};

export const roleIcons: Record<string, string> = {
  admin: "👑",
  user: "👤",
};
