import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useToast } from "../contexts/ToastContext";
import { Icons } from "../components/Icons";
import { User } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { Camera, X } from "lucide-react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";
import imageCompression from "browser-image-compression";

export const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const { users, ideas, follows } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);

  const [activeTab, setActiveTab] = useState<"posts" | "followers" | "following">("posts");

  // Crop Modal State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const profileUser = users.find((u) => u.id === userId);
  const isOwnProfile = currentUser?.id === userId;
  const userIdeas = ideas.filter((i) => i.authorId === userId && !i.deleted);
  const followsYou = follows.some(f => f.followerId === userId && f.followingId === currentUser?.id);

  const userFollowers = follows
    .filter((f) => f.followingId === userId)
    .map((f) => users.find((u) => u.id === f.followerId))
    .filter(Boolean) as User[];

  const userFollowing = follows
    .filter((f) => f.followerId === userId)
    .map((f) => users.find((u) => u.id === f.followingId))
    .filter(Boolean) as User[];

  useEffect(() => {
    if (profileUser) {
      setName(profileUser.name || "");
      setBio(profileUser.bio || "");
      setSpecialty(profileUser.specialty || "");
    }
  }, [profileUser]);

  useEffect(() => {
    if (currentUser && userId && !isOwnProfile) {
      const follow = follows.find(f => f.followerId === currentUser.id && f.followingId === userId);
      setIsFollowing(!!follow);
    }
  }, [currentUser, userId, follows, isOwnProfile]);

  const handleUpdateProfile = async () => {
    if (!currentUser || !isOwnProfile) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, "users", currentUser.id), {
        name,
        bio,
        specialty,
      });
      setIsEditing(false);
      showToast("تم تحديث الملف الشخصي", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
      showToast("فشل تحديث الملف الشخصي", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !userId || isOwnProfile) return;
    setIsLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const followQuery = query(
          collection(db, "follows"),
          where("followerId", "==", currentUser.id),
          where("followingId", "==", userId)
        );
        const snapshot = await getDocs(followQuery);
        for (const d of snapshot.docs) {
          await deleteDoc(doc(db, "follows", d.id));
        }

        // Update counts
        await updateDoc(doc(db, "users", userId), {
          followersCount: Math.max(0, (profileUser?.followersCount || 0) - 1)
        });
        await updateDoc(doc(db, "users", currentUser.id), {
          followingCount: Math.max(0, (currentUser?.followingCount || 0) - 1)
        });
      } else {
        // Follow
        await addDoc(collection(db, "follows"), {
          followerId: currentUser.id,
          followingId: userId,
          createdAt: new Date().toISOString()
        });

        // Update counts
        await updateDoc(doc(db, "users", userId), {
          followersCount: (profileUser?.followersCount || 0) + 1
        });
        await updateDoc(doc(db, "users", currentUser.id), {
          followingCount: (currentUser?.followingCount || 0) + 1
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "follows/users");
      showToast("حدث خطأ", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !isOwnProfile) return;

    if (!file.type.startsWith('image/')) {
      showToast("الرجاء اختيار صورة صالحة", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("حجم الصورة يجب أن لا يتجاوز 10 ميجابايت", "error");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result?.toString() || "");
      setIsCropModalOpen(true);
    });
    reader.readAsDataURL(file);
    
    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
  };

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropAndUpload = async () => {
    if (!imageSrc || !croppedAreaPixels || !currentUser) return;

    setIsUploadingAvatar(true);
    setIsCropModalOpen(false);

    try {
      // 1. Crop the image
      const croppedImageFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedImageFile) throw new Error("فشل في قص الصورة");

      // 2. Compress the cropped image
      const options = {
        maxSizeMB: 0.2, // Max 200KB for avatar
        maxWidthOrHeight: 500,
        useWebWorker: false, // Disabled web worker to prevent hanging on some devices
      };
      const compressedFile = await imageCompression(croppedImageFile, options);

      // 3. Upload to Firebase
      const fileRef = ref(storage, `users/avatars/${currentUser.id}_${Date.now()}`);
      const uploadTask = uploadBytesResumable(fileRef, compressedFile);
      
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setAvatarUploadProgress(progress);
          },
          (error) => {
            reject(error);
          },
          () => {
            resolve();
          }
        );
      });

      const photoURL = await getDownloadURL(uploadTask.snapshot.ref);

      // 4. Update user document
      await updateDoc(doc(db, "users", currentUser.id), {
        photoURL
      });

      showToast("تم تحديث الصورة الشخصية بنجاح", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
      showToast("فشل رفع الصورة الشخصية", "error");
    } finally {
      setIsUploadingAvatar(false);
      setAvatarUploadProgress(0);
      setImageSrc(null);
    }
  };

  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Icons.User className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-xl">المستخدم غير موجود</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in font-tajawal pb-24">
      {/* Header Card */}
      <div className="glass-card rounded-3xl p-6 md:p-8 mb-6 md:mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 md:h-32 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20"></div>
        
        <div className="relative flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 mt-8 md:mt-12">
          <div className="relative group">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-1 shadow-2xl">
              <div className="w-full h-full rounded-full bg-[#0a0f1f] flex items-center justify-center overflow-hidden relative">
                {isUploadingAvatar ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
                    <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-1"></div>
                    {avatarUploadProgress > 0 && (
                      <span className="text-[10px] text-white font-bold">{Math.round(avatarUploadProgress)}%</span>
                    )}
                  </div>
                ) : null}
                {profileUser.photoURL ? (
                  <img src={profileUser.photoURL} alt={profileUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Icons.User className="w-12 h-12 md:w-16 md:h-16 text-gray-400" />
                )}
              </div>
            </div>
            
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 w-8 h-8 md:w-10 md:h-10 bg-pink-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform border-2 border-[#0a0f1f] group-hover:bg-pink-500">
                <Camera className="w-4 h-4 md:w-5 md:h-5 text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                />
              </label>
            )}
          </div>

          <div className="flex-1 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-1 md:mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{profileUser.name}</h1>
              {followsYou && (
                <span className="text-[9px] md:text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 border border-white/10">يتابعك</span>
              )}
            </div>
            <p className="text-sm md:text-base text-accent font-medium mb-3 md:mb-4">{profileUser.specialty || "مفكر في متحف الفكر"}</p>
            
            <div className="flex items-center justify-center md:justify-start gap-4 md:gap-6 text-xs md:text-sm text-gray-400">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-white font-bold text-base md:text-lg">{profileUser.followersCount || 0}</span>
                <span>متابع</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-white font-bold text-base md:text-lg">{profileUser.followingCount || 0}</span>
                <span>يتابع</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-white font-bold text-base md:text-lg">{userIdeas.length}</span>
                <span>منشور</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 md:gap-3 mt-4 md:mt-0">
            {isOwnProfile ? (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="btn-primary px-4 py-2 md:px-6 md:py-2 rounded-full flex items-center gap-2 text-sm md:text-base"
              >
                <Icons.Settings className="w-4 h-4" />
                تعديل الملف
              </button>
            ) : (
              <button 
                onClick={handleFollow}
                disabled={isLoading}
                className={`px-6 py-2 md:px-8 md:py-2 rounded-full font-bold transition-all text-sm md:text-base ${isFollowing ? 'bg-white/10 text-white border border-white/20' : 'bg-accent text-white shadow-lg shadow-pink-500/30'}`}
              >
                {isLoading ? 'جاري...' : isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
              </button>
            )}
          </div>
        </div>

        {profileUser.bio && !isEditing && (
          <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/5">
            <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-widest">نبذة شخصية</h3>
            <p className="text-gray-300 leading-relaxed">{profileUser.bio}</p>
          </div>
        )}

        {isEditing && (
          <div className="mt-8 space-y-4 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-2">الاسم</label>
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-style w-full px-4 py-2 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-2">التخصص</label>
                <input 
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="input-style w-full px-4 py-2 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-500 text-xs font-bold mb-2">النبذة الشخصية</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input-style w-full px-4 py-2 rounded-xl h-32 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsEditing(false)} className="px-6 py-2 text-gray-400 hover:text-white transition">إلغاء</button>
              <button onClick={handleUpdateProfile} disabled={isLoading} className="btn-primary px-8 py-2 rounded-full">حفظ التغييرات</button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-8 border-b border-white/10">
        <button
          onClick={() => setActiveTab("posts")}
          className={`pb-4 text-lg font-bold transition-all relative ${activeTab === "posts" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          المنشورات
          {activeTab === "posts" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-500 rounded-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab("followers")}
          className={`pb-4 text-lg font-bold transition-all relative ${activeTab === "followers" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          المتابعون ({userFollowers.length})
          {activeTab === "followers" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-500 rounded-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`pb-4 text-lg font-bold transition-all relative ${activeTab === "following" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          يتابع ({userFollowing.length})
          {activeTab === "following" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-pink-500 rounded-full"></div>}
        </button>
      </div>

      {activeTab === "posts" && (
        <div className="space-y-6">
          {userIdeas.map(idea => (
            <div 
              key={idea.id}
              onClick={() => navigate('/ideas')}
              className="glass-card rounded-3xl p-6 hover:bg-white/10 transition-all cursor-pointer border border-white/5"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                    {profileUser.photoURL ? (
                      <img src={profileUser.photoURL} alt={profileUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Icons.User className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{profileUser.name}</p>
                    <p className="text-[10px] text-gray-500">{new Date(idea.createdAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-accent/10 px-3 py-1 rounded-full text-accent border border-accent/20">{idea.category}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-amiri">{idea.title}</h3>
              <p className="text-gray-400 line-clamp-3 leading-relaxed mb-4">{idea.content}</p>
              <div className="flex items-center gap-6 text-xs text-gray-500 border-t border-white/5 pt-4">
                <div className="flex items-center gap-1.5">
                  <Icons.Heart className="w-4 h-4" />
                  <span>{idea.likes || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icons.Message className="w-4 h-4 rotate-90" />
                  <span>{idea.views || 0}</span>
                </div>
              </div>
            </div>
          ))}

          {userIdeas.length === 0 && (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-gray-500">لا توجد منشورات بعد</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "followers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userFollowers.map(user => (
            <div 
              key={user.id}
              onClick={() => navigate(`/profile/${user.id}`)}
              className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer border border-white/5"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-[#0a0f1f] flex items-center justify-center overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Icons.User className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white">{user.name}</h4>
                <p className="text-xs text-gray-500">{user.specialty || "مفكر"}</p>
              </div>
              <Icons.Plus className="w-5 h-5 text-gray-600" />
            </div>
          ))}
          {userFollowers.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-gray-500">لا يوجد متابعون بعد</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "following" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userFollowing.map(user => (
            <div 
              key={user.id}
              onClick={() => navigate(`/profile/${user.id}`)}
              className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer border border-white/5"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-[#0a0f1f] flex items-center justify-center overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Icons.User className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white">{user.name}</h4>
                <p className="text-xs text-gray-500">{user.specialty || "مفكر"}</p>
              </div>
              <Icons.Plus className="w-5 h-5 text-accent rotate-45" />
            </div>
          ))}
          {userFollowing.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-gray-500">لا يتابع أحداً بعد</p>
            </div>
          )}
        </div>
      )}

      {/* Crop Modal */}
      {isCropModalOpen && imageSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-[80vh] max-h-[600px]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
              <h2 className="text-lg font-bold text-white">تعديل الصورة الشخصية</h2>
              <button onClick={() => setIsCropModalOpen(false)} className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 relative bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-6 bg-slate-900 border-t border-white/5 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">تكبير / تصغير</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsCropModalOpen(false)} 
                  className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleCropAndUpload} 
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 shadow-lg shadow-pink-500/20 hover:scale-[1.02] transition-transform"
                >
                  حفظ الصورة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
