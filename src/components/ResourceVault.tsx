import React, { useState, useEffect, useRef, useMemo } from "react";
import { Upload, FileText, Download, Search, Trash2, X, Loader2, ThumbsUp, ThumbsDown, UserPlus, UserMinus, Filter, ChevronDown, BookOpen, Clock, Star, ExternalLink, Image as ImageIcon, File as FileIcon, User, Share2 } from "lucide-react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, getDocs, where, updateDoc, increment, limit, startAfter, getDoc, QueryDocumentSnapshot } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebase";
import { toast } from "./Toast";
import ConfirmModal from "./ConfirmModal";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { useAcademicStore } from "../lib/academicStore";
import { motion, AnimatePresence } from "motion/react";
import { subscribeToSettings } from "../lib/settings";

import { FeedSkeleton } from "../nexus-features/SkeletonLoader";

interface Resource {
  id: string;
  title: string;
  type: "PDF" | "Image" | "Note";
  url: string;
  course: string;
  category: string;
  uploadedBy: string;
  userId: string;
  uploaderVerified?: boolean;
  validated?: boolean;
  likes: number;
  dislikes: number;
  fileHash?: string;
  timestamp?: any;
  qualityScore?: number;
}

export default function ResourceMarketplace({ user, isAdmin }: { user?: any, isAdmin?: boolean }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [settings, setSettings] = useState<any>({});
  
  useEffect(() => {
    return subscribeToSettings((s) => setSettings(s));
  }, []);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "my-uploads" | "favorites" | "admin-queue">("feed");
  const [newResource, setNewResource] = useState<{title: string, type: "PDF" | "Image" | "Note", url: string, course: string, category: string}>({ title: "", type: "PDF", url: "", course: "", category: "Notes" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [userCourses, setUserCourses] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [isVerifiedUser, setIsVerifiedUser] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  
  const { followedUploaders, likedResources, dislikedResources, favoriteResources, followUploader, unfollowUploader, toggleLike, toggleDislike, toggleFavorite } = useAcademicStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user verification status
  useEffect(() => {
    if (!user) {
      setIsCheckingVerification(false);
      return;
    }
    const fetchVerification = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          setIsVerifiedUser(userSnap.data().isVerified || false);
        }
      } catch (error) {
        console.error("Error fetching verification status:", error);
      } finally {
        setIsCheckingVerification(false);
      }
    };
    fetchVerification();
  }, [user]);

  // Fetch user's CGPA courses for personalization
  useEffect(() => {
    if (!user) return;
    const fetchUserCourses = async () => {
      try {
        const cgpaDoc = await getDoc(doc(db, "user_cgpa", user.uid));
        if (cgpaDoc.exists()) {
          const data = cgpaDoc.data();
          const codes = (data.courses || []).map((c: any) => c.code.toUpperCase());
          setUserCourses(codes);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "user_cgpa");
      }
    };
    fetchUserCourses();
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (!user) return;
    fetchResources(true);
  }, [user, activeTab]);

  const fetchResources = async (isInitial: boolean = false) => {
    if (!user) return;
    setIsLoading(true);
    try {
      let q;
      if (activeTab === "my-uploads") {
        q = query(
          collection(db, "resources"), 
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(10)
        );
      } else if (activeTab === "favorites") {
        // We fetch favorites locally from the current loaded resources or fetch them all if needed
        // For simplicity with pagination, we'll fetch all favorited IDs if they aren't in memory
        if (favoriteResources.length === 0) {
          setResources([]);
          setHasMore(false);
          setIsLoading(false);
          return;
        }
        
        // Firestore 'in' query has a limit of 10-30 usually depending on version, so we fetch them carefully
        q = query(
          collection(db, "resources"),
          where("__name__", "in", favoriteResources.slice(0, 10)),
          limit(10)
        );
      } else {
        q = query(
          collection(db, "resources"), 
          orderBy("timestamp", "desc"),
          limit(10)
        );
      }

      if (!isInitial && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const fetched: Resource[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<Resource, "id" | "qualityScore">;
        const likes = data.likes || 0;
        const dislikes = data.dislikes || 0;
        const uploaderVerified = data.uploaderVerified || false;
        const qualityScore = likes - dislikes + (uploaderVerified ? 10 : 0);
        fetched.push({ id: doc.id, ...data, qualityScore } as Resource);
      });

      if (isInitial) {
        setResources(fetched);
      } else {
        setResources(prev => [...prev, ...fetched]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 10);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "resources");
    } finally {
      setIsLoading(false);
    }
  };

  const validateResource = async (resourceId: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, "resources", resourceId), { validated: true });
      toast("Resource validated! ✅");
      fetchResources(true);
    } catch (e) {
      toast("Failed to validate resource");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast("Please sign in to upload resources");
      return;
    }
    if (!isVerifiedUser && !isAdmin) {
      toast("Only verified users can upload resources. Visit Profile to get verified.");
      return;
    }
    if (!newResource.title || !newResource.course) {
      toast("Please fill all required fields");
      return;
    }
    if (!selectedFile) {
      toast(`Please select a file to upload`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      let finalUrl = "";
      
      const storageRef = ref(storage, `resources/${user.uid}_${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`);
      
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);
      finalUrl = await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          }, 
          (error) => {
            console.error("Firebase Storage Upload Error:", error);
            toast(`Upload failed: ${error.message}`);
            reject(error);
          }, 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });

      await addDoc(collection(db, "resources"), {
        title: newResource.title,
        type: newResource.type,
        category: newResource.category,
        url: finalUrl,
        course: newResource.course.toUpperCase(),
        uploadedBy: user.displayName || "Anonymous",
        userId: user.uid,
        uploaderVerified: isVerifiedUser,
        likes: 0,
        dislikes: 0,
        validated: false,
        timestamp: serverTimestamp()
      });
      
      setNewResource({ title: "", type: "PDF", url: "", course: "", category: "Notes" });
      setSelectedFile(null);
      setShowUpload(false);
      toast("Resource published! 🚀");
      fetchResources(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "resources");
      toast("Upload failed. Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSocialAction = async (resource: Resource, action: "like" | "dislike") => {
    if (!user) return toast("Sign in to interact");
    
    const resourceId = resource.id;
    const isLiked = likedResources.includes(resourceId);
    const isDisliked = dislikedResources.includes(resourceId);

    try {
      const docRef = doc(db, "resources", resourceId);
      let likesChange = 0;
      let dislikesChange = 0;
      
      if (action === "like") {
        if (isLiked) {
          likesChange = -1;
        } else {
          likesChange = 1;
          if (isDisliked) dislikesChange = -1;
        }
        toggleLike(resourceId);
      } else {
        if (isDisliked) {
          dislikesChange = -1;
        } else {
          dislikesChange = 1;
          if (isLiked) likesChange = -1;
        }
        toggleDislike(resourceId);
      }

      const newLikes = (resource.likes || 0) + likesChange;
      const newDislikes = (resource.dislikes || 0) + dislikesChange;
      const newQualityScore = newLikes - newDislikes + (resource.uploaderVerified ? 10 : 0);
      
      const updateData: any = { 
        likes: increment(likesChange),
        dislikes: increment(dislikesChange),
        qualityScore: newQualityScore
      };
      
      // Auto-validate if score >= 10
      if (!resource.validated && newQualityScore >= 10) {
        updateData.validated = true;
        toast("Resource automatically validated! 🎉");
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error("Social action failed", error);
    }
  };

  const shareResource = (resource: Resource) => {
    if (navigator.share) {
      navigator.share({
        title: resource.title,
        text: `Check out this resource for ${resource.course}!`,
        url: resource.url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(resource.url);
      toast("Link copied to clipboard!");
    }
  };

  const filteredAndSortedResources = useMemo(() => {
    let filtered = resources.filter(r => {
      const searchTerm = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(searchTerm) || 
        r.course.toLowerCase().includes(searchTerm) ||
        r.uploadedBy.toLowerCase().includes(searchTerm) ||
        r.category.toLowerCase().includes(searchTerm)
      );
    });

    if (activeTab === "favorites") {
      filtered = filtered.filter(r => favoriteResources.includes(r.id));
    }

    if (activeTab === "admin-queue") {
      filtered = filtered.filter(r => !r.validated);
    }

    if (activeTab === "feed") {
      // Filter out non-validated for non-admins
      if (!isAdmin) {
        filtered = filtered.filter(r => r.validated);
      }
      // Prioritize by quality score
      return filtered.sort((a, b) => {
        return (b.qualityScore || 0) - (a.qualityScore || 0);
      });
    }

    return filtered;
  }, [resources, search, favoriteResources, activeTab, isAdmin]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-24">
      {/* Header & Search */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">
              <Star className="text-amber-500 fill-amber-500" /> Resource Marketplace
            </h1>
            <p className="text-sm text-[var(--foreground)]/50 font-medium">Smart materials for the Digital Nexus ecosystem.</p>
          </div>
          <button 
            onClick={() => {
              if (settings.canEveryoneUpload || isVerifiedUser || isAdmin) {
                setShowUpload(true);
              } else {
                toast("Upload Restricted: Only verified students can contribute to the marketplace.");
              }
            }}
            className={`${settings.canEveryoneUpload || isVerifiedUser || isAdmin ? 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/20' : 'bg-zinc-500/20 text-zinc-500 cursor-not-allowed'} text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95`}
          >
            <Upload size={20} /> Upload
            {(!settings.canEveryoneUpload && !isVerifiedUser && !isAdmin) && <Star size={12} className="text-zinc-400" />}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground)]/40" size={20} />
            <input 
              type="text" 
              placeholder="Search by Course, Uploader, or Keyword..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl pl-12 pr-4 py-4 text-lg font-medium focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-[var(--border)] overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab("feed")}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "feed" ? "bg-white dark:bg-zinc-800 shadow-sm text-cyan-600" : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]"}`}
            >
              Feed
            </button>
            <button 
              onClick={() => setActiveTab("favorites")}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "favorites" ? "bg-white dark:bg-zinc-800 shadow-sm text-cyan-600" : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]"}`}
            >
              Favorites
            </button>
            <button 
              onClick={() => setActiveTab("my-uploads")}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "my-uploads" ? "bg-white dark:bg-zinc-800 shadow-sm text-cyan-600" : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]"}`}
            >
              My Uploads
            </button>
            {isAdmin && (
              <button 
                onClick={() => setActiveTab("admin-queue")}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "admin-queue" ? "bg-white dark:bg-zinc-800 shadow-sm text-red-600" : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]"}`}
              >
                Admin Queue
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && resources.length === 0 ? (
          <FeedSkeleton />
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredAndSortedResources.map((resource, idx) => (
              <motion.div 
                key={resource.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-panel p-6 rounded-3xl border-[var(--border)] hover:border-cyan-500/30 transition-all group relative flex flex-col justify-between"
              >
                {userCourses.includes(resource.course) && activeTab === "feed" && (
                  <div className="absolute -top-3 -right-3 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-10 animate-bounce">
                    MATCHED COURSE
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleFavorite(resource.id)}
                        className={`p-2 rounded-xl transition-all ${favoriteResources.includes(resource.id) ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-black/5 dark:bg-white/5 text-rose-500 hover:bg-rose-500/10'}`}
                      >
                        <Star size={16} className={favoriteResources.includes(resource.id) ? 'fill-white' : ''} />
                      </button>
                      <div className={`p-2 rounded-xl ${resource.type === 'PDF' ? 'bg-red-500/10 text-red-500' : resource.type === 'Image' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {resource.type === 'PDF' ? <FileIcon size={20} /> : resource.type === 'Image' ? <ImageIcon size={20} /> : <ExternalLink size={20} />}
                      </div>
                      <span className="text-xs font-black bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 px-3 py-1 rounded-lg tracking-tighter">
                        {resource.course}
                      </span>
                      {resource.validated ? (
                          <span className="text-xs font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-lg tracking-tighter">
                            Verified
                          </span>
                      ) : (
                          <span className="text-xs font-black bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-lg tracking-tighter">
                            Pending
                          </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} className="fill-amber-500" />
                      <span className="text-xs font-bold">{resource.qualityScore}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-cyan-500 transition-colors line-clamp-2">
                    {resource.title}
                  </h3>

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                        <User size={16} className="text-[var(--foreground)]/40" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest">Uploaded by</p>
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold">{resource.uploadedBy}</p>
                          {resource.uploaderVerified && <Star size={10} className="text-blue-500 fill-blue-500" />}
                        </div>
                      </div>
                    </div>
                    {resource.userId !== user?.uid && (
                      <button 
                        onClick={() => followedUploaders.includes(resource.userId) ? unfollowUploader(resource.userId) : followUploader(resource.userId)}
                        className={`p-2 rounded-xl transition-all ${followedUploaders.includes(resource.userId) ? 'bg-cyan-500 text-white' : 'bg-black/5 dark:bg-white/5 text-cyan-600 hover:bg-cyan-500/10'}`}
                      >
                        {followedUploaders.includes(resource.userId) ? <UserMinus size={16} /> : <UserPlus size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-2 rounded-2xl">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">Score: {resource.qualityScore || 0}</span>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleSocialAction(resource, "like")}
                        className={`flex items-center gap-1 text-xs font-bold transition-all ${likedResources.includes(resource.id) ? 'text-cyan-500' : 'text-[var(--foreground)]/40 hover:text-cyan-500'}`}
                      >
                        <ThumbsUp size={16} className={likedResources.includes(resource.id) ? 'fill-cyan-500' : ''} />
                        {resource.likes}
                      </button>
                      <button 
                        onClick={() => handleSocialAction(resource, "dislike")}
                        className={`flex items-center gap-1 text-xs font-bold transition-all ${dislikedResources.includes(resource.id) ? 'text-red-500' : 'text-[var(--foreground)]/40 hover:text-red-500'}`}
                      >
                        <ThumbsDown size={16} className={dislikedResources.includes(resource.id) ? 'fill-red-500' : ''} />
                        {resource.dislikes}
                      </button>
                      <button 
                        onClick={() => shareResource(resource)}
                        className="text-[var(--foreground)]/40 hover:text-cyan-500 transition-all"
                      >
                        <Share2 size={16} />
                      </button>
                    </div>
                    <a 
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-cyan-600 text-white rounded-xl shadow-lg shadow-cyan-500/20 hover:scale-110 transition-all"
                    >
                      <Download size={16} />
                    </a>
                  </div>

                  {isAdmin && !resource.validated && (
                    <button 
                      onClick={() => validateResource(resource.id)}
                      className="w-full py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all mb-2"
                    >
                      Validate Material
                    </button>
                  )}

                  {activeTab === "my-uploads" && (
                    <button 
                      onClick={() => setDeleteId(resource.id)}
                      className="w-full py-2 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                    >
                      Delete Material
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Loading & Pagination */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-cyan-500" size={32} />
        </div>
      )}

      {!isLoading && hasMore && (
        <div className="flex justify-center mt-12">
          <button 
            onClick={() => fetchResources()}
            className="px-8 py-4 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl font-bold text-sm hover:bg-black/10 dark:hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <ChevronDown size={20} /> Load More Materials
          </button>
        </div>
      )}

      {!isLoading && filteredAndSortedResources.length === 0 && (
        <div className="text-center py-24 glass-panel rounded-[40px] border-dashed border-2">
          <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search size={40} className="text-[var(--foreground)]/20" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No materials found</h3>
          <p className="text-[var(--foreground)]/50 max-w-xs mx-auto">Try adjusting your search or upload something to help the community!</p>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel max-w-md w-full rounded-[40px] p-8 space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Upload size={120} />
              </div>

              <div className="flex justify-between items-center relative z-10">
                <h3 className="text-2xl font-black tracking-tighter">Contribute Material</h3>
                <button onClick={() => setShowUpload(false)} disabled={isUploading} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4 relative z-10">
                <div className="grid grid-cols-3 gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)]">
                  {(["PDF", "Image", "Note"] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setNewResource({...newResource, type, url: ""});
                        setSelectedFile(null);
                      }}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newResource.type === type ? 'bg-white dark:bg-zinc-800 shadow-sm text-cyan-600' : 'text-[var(--foreground)]/40'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[var(--foreground)]/40 uppercase tracking-widest ml-2">Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. MTH 101 Cheat Sheet" 
                    value={newResource.title}
                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-cyan-500 transition-all"
                    required
                    disabled={isUploading}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[var(--foreground)]/40 uppercase tracking-widest ml-2">Course Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. MTH 101" 
                    value={newResource.course}
                    onChange={(e) => setNewResource({...newResource, course: e.target.value.toUpperCase()})}
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-cyan-500 transition-all"
                    required
                    disabled={isUploading}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[var(--foreground)]/40 uppercase tracking-widest ml-2">Category</label>
                  <select 
                    value={newResource.category}
                    onChange={(e) => setNewResource({...newResource, category: e.target.value})}
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-cyan-500 transition-all"
                    disabled={isUploading}
                  >
                    {["Notes", "Past Questions", "Textbooks", "Assignments"].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[var(--foreground)]/40 uppercase tracking-widest ml-2">Select {newResource.type} File</label>
                  <div 
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[var(--border)] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-cyan-500/5 hover:border-cyan-500/30 transition-all group"
                  >
                    <input 
                      type="file" 
                      accept={newResource.type === "PDF" ? "application/pdf" : "image/*"}
                      ref={fileInputRef}
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="flex items-center gap-2 text-cyan-600 font-bold">
                        <CheckCircle2 size={20} />
                        <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-[var(--foreground)]/20 group-hover:text-cyan-500 transition-colors mb-2" size={32} />
                        <p className="text-xs font-bold text-[var(--foreground)]/40">Drop file or click to browse</p>
                      </>
                    )}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2 shadow-xl shadow-cyan-500/20"
                >
                  {isUploading ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={20} /> 
                        <span>{newResource.type === "PDF" ? `Uploading ${Math.round(uploadProgress)}%` : "Processing..."}</span>
                      </div>
                      {newResource.type === "PDF" && (
                        <div className="w-full bg-white/20 h-1 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="bg-white h-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </>
                  ) : "Publish to Marketplace"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Material"
        message="Are you sure you want to remove this material from the marketplace? This action cannot be undone."
        onConfirm={() => deleteId && (async () => {
          try {
            await deleteDoc(doc(db, "resources", deleteId));
            setResources(prev => prev.filter(r => r.id !== deleteId));
            setDeleteId(null);
            toast("Material removed successfully");
          } catch (e) {
            toast("Failed to delete material");
          }
        })()}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function CheckCircle2({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
