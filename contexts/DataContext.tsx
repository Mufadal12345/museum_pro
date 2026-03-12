import React, { createContext, useContext, useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  Idea,
  IdeaComment,
  Course,
  Quote,
  Suggestion,
  User,
  Message,
  Bookmark,
  Follow,
  AdminGroupMessage,
  LibraryItem,
} from "../types";
import { useAuth } from "./AuthContext";

interface DataContextType {
  ideas: Idea[];
  comments: IdeaComment[];
  courses: Course[];
  quotes: Quote[];
  suggestions: Suggestion[];
  users: User[];
  follows: Follow[];
  messages: Message[];
  bookmarks: Bookmark[];
  adminChats: AdminGroupMessage[];
  libraryItems: LibraryItem[];
  loadingData: boolean;
  now: Date;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

export const useData = () => useContext(DataContext);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [adminChats, setAdminChats] = useState<AdminGroupMessage[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setIdeas([]);
      setComments([]);
      setCourses([]);
      setQuotes([]);
      setSuggestions([]);
      setUsers([]);
      setFollows([]);
      setMessages([]);
      setBookmarks([]);
      setAdminChats([]);
      setLibraryItems([]);
      setLoadingData(false);
      return;
    }

    const collectionsToLoad = [
      {
        name: "ideas",
        query: query(
          collection(db, "ideas"),
          orderBy("createdAt", "desc"),
          limit(500),
        ),
        setter: setIdeas,
      },
      {
        name: "comments",
        query: query(
          collection(db, "comments"),
          orderBy("createdAt", "desc"),
          limit(500),
        ),
        setter: setComments,
      },
      { name: "courses", query: collection(db, "courses"), setter: setCourses },
      { name: "quotes", query: collection(db, "quotes"), setter: setQuotes },
      {
        name: "suggestions",
        query:
          currentUser.role === "admin"
            ? collection(db, "suggestions")
            : query(
                collection(db, "suggestions"),
                where("authorId", "==", currentUser.id),
              ),
        setter: setSuggestions,
      },
      {
        name: "users",
        query: collection(db, "users"),
        setter: setUsers,
      },
      {
        name: "follows",
        query: collection(db, "follows"),
        setter: setFollows,
      },
      {
        name: "messages",
        query:
          currentUser.role === "admin"
            ? collection(db, "messages")
            : query(
                collection(db, "messages"),
                where("toUserId", "==", currentUser.id),
              ),
        setter: setMessages,
      },
      {
        name: "bookmarks",
        query: query(
          collection(db, "bookmarks"),
          where("userId", "==", currentUser.id),
        ),
        setter: setBookmarks,
      },
      {
        name: "library",
        query: query(
          collection(db, "library"),
          orderBy("createdAt", "desc"),
          limit(200),
        ),
        setter: setLibraryItems,
      },
    ];

    if (currentUser.role === "admin") {
      collectionsToLoad.push({
        name: "admin_chats",
        query: query(
          collection(db, "admin_chats"),
          orderBy("createdAt", "desc"),
          limit(100),
        ),
        setter: setAdminChats as any,
      });
    }

    let loadedCount = 0;
    const totalToLoad = collectionsToLoad.length;

    const unsubs = collectionsToLoad.map((col) => {
      return onSnapshot(
        col.query,
        (snap) => {
          col.setter(
            snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as any),
          );
          if (loadingData) {
            loadedCount++;
            if (loadedCount >= totalToLoad) {
              setLoadingData(false);
            }
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, col.name);
        },
      );
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [currentUser, loadingData]);

  return (
    <DataContext.Provider
      value={{
        ideas,
        comments,
        courses,
        quotes,
        suggestions,
        users,
        follows,
        messages,
        bookmarks,
        adminChats,
        libraryItems,
        loadingData,
        now,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
