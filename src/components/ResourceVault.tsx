import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { Upload, FileText, Download, Search, Trash2, X, Loader2, ThumbsUp, ThumbsDown, UserPlus, UserMinus, Filter, ChevronDown, BookOpen, Clock, Star, ExternalLink, Image as ImageIcon, File as FileIcon, User, Share2, Flag, AlertTriangle, CheckCircle2 } from "lucide-react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, getDocs, where, updateDoc, increment, limit, startAfter, getDoc, QueryDocumentSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { toast } from "./Toast";
import ConfirmModal from "./ConfirmModal";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { useAcademicStore } from "../lib/academicStore";
import { motion, AnimatePresence } from "motion/react";
import { subscribeToSettings } from "../lib/settings";

import { FeedSkeleton } from "../nexus-features/SkeletonLoader";

// Helper to calculate file hash for duplicate detection
async function calculateHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface Resource {
  id: string;
  title: string;
  type: "PDF" | "Image" | "Note";
  url: string;
  course: string;
  category: string;
  department?: string;
  level?: string;
  uploadedBy: string;
  userId: string;
  uploaderVerified?: boolean;
  validated?: boolean;
  likes: number;
  dislikes: number;
  downloads: number;
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
  const [sortBy, setSortBy] = useState<'upload-date' | 'quality-score' | 'likes' | 'dislikes'>('quality-score');
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "my-uploads" | "favorites" | "admin-queue">("feed");
  const [newResource, setNewResource] = useState<{title: string, type: "PDF" | "Image" | "Note", url: string, course: string, category: string, department: string, level: string}>({ 
    title: "", 
    type: "PDF", 
    url: "", 
    course: "", 
    category: "Notes",
    department: "",
    level: "100"
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [userCourses, setUserCourses] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reportResource, setReportResource] = useState<Resource | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  
  const [isVerifiedUser, setIsVerifiedUser] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  
  const isUserAdmin = user?.email === "banmekeifeoluwa@gmail.com";
  const { followedUploaders, likedResources, dislikedResources, favoriteResources, followUploader, unfollowUploader, toggleLike, toggleDislike, toggleFavorite } = useAcademicStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  // Handle upload=true from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("upload") === "true") {
      setShowUpload(true);
      // Optional: Clear the parameter so it doesn't reopen on refresh if desired
      // but usually for a simple link it's fine.
    }
  }, [location.search]);

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

  // Fetch resources with onSnapshot for real-time updates
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    
    let q;
    if (activeTab === "my-uploads") {
      q = query(
        collection(db, "resources"), 
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(10)
      );
    } else if (activeTab === "favorites") {
      if (favoriteResources.length === 0) {
        setResources([]);
        setHasMore(false);
        setIsLoading(false);
        return;
      }
      q = query(
        collection(db, "resources"),
        where("__name__", "in", favoriteResources.slice(0, 10)),
        limit(10)
      );
    } else {
      if (isUserAdmin || isAdmin) {
        q = query(
          collection(db, "resources"), 
          orderBy("timestamp", "desc"),
          limit(10)
        );
      } else {
        q = query(
          collection(db, "resources"), 
          where("validated", "==", true),
          orderBy("timestamp", "desc"),
          limit(10)
        );
      }
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const fetched: Resource[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        const likes = data.likes || 0;
        const dislikes = data.dislikes || 0;
        const uploaderVerified = data.uploaderVerified || false;
        const qualityScore = data.qualityScore ?? (likes - dislikes + (uploaderVerified ? 10 : 0));
        fetched.push({ id: doc.id, ...data, qualityScore, downloads: data.downloads || 0 } as Resource);
      });
      
      setResources(fetched);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 10);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "resources");
      setIsLoading(false);
    });

    return () => unsub();
  }, [user, activeTab, favoriteResources.length]);

  const fetchResources = async (isInitial: boolean = false) => {
    // This is now primarily for "Load More" pagination
    if (!user || isLoading || !hasMore || !lastDoc) return;
    
    try {
      let q;
      // ... (pagination logic would go here if we want to keep it, but for a "marketplace" 10 items might be small)
      // For now, let's just keep the initial real-time sync and maybe extend it for pagination later if requested.
      // The current request is about "actual values" being real.
    } catch (error) {
      console.error(error);
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

  const checkUploadLimit = async (userId: string) => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const q = query(
      collection(db, "resources"),
      where("userId", "==", userId),
      where("timestamp", ">=", oneHourAgo)
    );
    const snap = await getDocs(q);
    return snap.size < 3;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast("Please sign in to upload resources");
      return;
    }

    const canUpload = await checkUploadLimit(user.uid);
    if (!canUpload && !isAdmin) {
      toast("Daily Nexus Security: You've reached your limit of 3 uploads per hour. Take a break! 🛡️");
      return;
    }

    if (!isVerifiedUser && !isAdmin) {
      toast("Only verified users can upload resources. Visit Profile to get verified.");
      return;
    }
    if (!newResource.title || !newResource.course || !newResource.department) {
      toast("Please fill all required fields including Department");
      return;
    }
    if (!selectedFile) {
      toast(`Please select a file to upload`);
      return;
    }

    const allowedExtensions = ['.pdf', '.docx'];
    const fileName = selectedFile.name.toLowerCase();
    const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExtension) {
      toast("Invalid file. Only .pdf and .docx extensions are allowed. 🛡️");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast("Validation failed: File size exceeds the 10MB limit. 🛡️");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      // Duplicate check
      const fileHash = await calculateHash(selectedFile);
      const duplicateQuery = query(collection(db, "resources"), where("fileHash", "==", fileHash));
      const duplicateSnap = await getDocs(duplicateQuery);
      
      if (!duplicateSnap.empty) {
        toast("Upload prevented: A resource with this exact file already exists in the Nexus. 🛡️");
        setIsUploading(false);
        return;
      }

      let finalUrl = "";
      
      console.log(`[Cloudinary] Starting upload: ${selectedFile.name} (${selectedFile.size} bytes)`);
      
      const cloudName = 'djf07vqdp';
      const uploadPreset = 'Digital Nexus';

      const formData = new FormData();
      formData.append('upload_preset', uploadPreset);
      formData.append('file', selectedFile);
      
      // Use XMLHttpRequest for progress tracking
      finalUrl = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, true);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            toast("File uploaded to Cloud successfully! ☁️");
            resolve(response.secure_url);
          } else {
            console.error("[Cloudinary] Upload Error:", xhr.responseText);
            reject(new Error(`Cloudinary upload failed: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Cloudinary upload network error'));
        xhr.send(formData);
      });
      
      await addDoc(collection(db, "resources"), {
        title: newResource.title,
        type: newResource.type,
        category: newResource.category,
        url: finalUrl,
        course: newResource.course.toUpperCase(),
        department: newResource.department,
        level: newResource.level,
        uploadedBy: user.displayName || "Anonymous",
        userId: user.uid,
        uploaderVerified: isVerifiedUser,
        likes: 0,
        dislikes: 0,
        downloads: 0,
        fileHash: fileHash,
        validated: isVerifiedUser,
        qualityScore: (0 - 0) + (isVerifiedUser ? 10 : 0),
        timestamp: serverTimestamp()
      });
      
      setNewResource({ title: "", type: "PDF", url: "", course: "", category: "Notes", department: "", level: "100" });
      setSelectedFile(null);
      
      // Close modal before fetching to provide immediate feedback
      setShowUpload(false);
      
      if (isVerifiedUser) {
        toast("Success! Resource published to the vault! 🚀");
      } else {
        toast("Upload successful! Pending approval by the Overlord. 🛡️");
      }
      
      fetchResources(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "resources");
      toast("Upload failed. Security rules might have blocked the request.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportResource) return;
    if (!reportReason.trim()) {
      toast("Please provide a reason for the report");
      return;
    }

    setIsSubmittingReport(true);
    try {
      await addDoc(collection(db, "reports"), {
        resourceId: reportResource.id,
        resourceTitle: reportResource.title,
        reason: reportReason.trim(),
        reportedBy: user.uid,
        reporterName: user.displayName || "Anonymous",
        timestamp: serverTimestamp(),
        status: "pending"
      });
      toast("Report submitted successfully for review. 🛡️");
      setReportResource(null);
      setReportReason("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "reports");
      toast("Failed to submit report. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleDownload = async (resource: Resource) => {
    const cloudinaryUrl = resource.url.replace("/upload/fl_attachment/", "/upload/");
    const fileName = `${resource.title.replace(/[^a-z0-9]/gi, "-") || "nexus-file"}.pdf`;

    try {
      // Increment download count in Firestore
      try {
        const docRef = doc(db, "resources", resource.id);
        await updateDoc(docRef, {
          downloads: increment(1)
        });
      } catch (err) {
        console.error("Failed to increment download count:", err);
      }

      toast("Starting download... 📁");

      // Implementing the requested downloadNow logic
      const downloadNow = async (url: string, name: string) => {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error("Network response was not ok");
          const fileBlob = await response.blob();
          
          // Create a temporary 'internal' link
          const internalLink = window.URL.createObjectURL(fileBlob);
          
          // Trigger the download invisibly
          const a = document.createElement('a');
          a.href = internalLink;
          a.download = name || "Digital-Nexus-File.pdf";
          document.body.appendChild(a);
          a.click();
          
          // Clean up
          document.body.removeChild(a);
          window.URL.revokeObjectURL(internalLink);
          toast("Download complete! 🚀");
        } catch (error) {
          console.error("Download failed:", error);
          // Fallback to direct link if fetch fails (CORS)
          window.open(url, "_blank", "noopener,noreferrer");
          toast("Network error. Opened in new tab instead. 🌐");
        }
      };

      await downloadNow(cloudinaryUrl, fileName);
      
    } catch (error) {
      console.error("Critical download failure:", error);
      window.open(resource.url, "_blank", "noopener,noreferrer");
      toast("Error downloading. Opened in tab instead. 🌐");
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
      
      // Sort
      return filtered.sort((a, b) => {
        switch (sortBy) {
          case 'upload-date': return (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0);
          case 'likes': return (b.likes || 0) - (a.likes || 0);
          case 'dislikes': return (b.dislikes || 0) - (a.dislikes || 0);
          case 'quality-score': 
          default: return (b.qualityScore || 0) - (a.qualityScore || 0);
        }
      });
    }

    return filtered;
  }, [resources, search, favoriteResources, activeTab, isAdmin, sortBy]);

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
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-4 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg hover:scale-105 transition-all w-full md:w-auto"
          >
            <Upload size={20} /> Upload Course Material
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
          
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-[var(--border)]">
            <Filter className="text-[var(--foreground)]/40 ml-3" size={20} />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent py-3 pr-8 text-sm font-bold focus:outline-none min-w-[140px]"
            >
              <option value="quality-score">Quality Score</option>
              <option value="upload-date">Upload Date</option>
              <option value="likes">Likes</option>
              <option value="dislikes">Dislikes</option>
            </select>
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
                    <Link to={`/profile/${resource.userId}`} className="flex items-center gap-2 group/author cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center group-hover/author:ring-2 group-hover/author:ring-cyan-500 transition-all overflow-hidden relative">
                        <User size={16} className="text-[var(--foreground)]/40 group-hover/author:text-cyan-500 transition-colors" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest">Uploaded by</p>
                        <div className="flex items-center gap-1 group-hover/author:text-cyan-500 transition-colors">
                          <p className="text-xs font-bold">By {resource.uploadedBy}</p>
                          {resource.uploaderVerified && <Star size={10} className="text-blue-500 fill-blue-500" />}
                        </div>
                      </div>
                    </Link>
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
                  <div className="flex flex-col sm:flex-row items-center justify-between bg-black/5 dark:bg-white/5 p-3 rounded-2xl gap-3">
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                      <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">Score: {resource.qualityScore || 0}</span>
                      <div className="flex items-center gap-3 sm:gap-4">
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
                        <div className="flex items-center gap-1 text-xs font-bold text-[var(--foreground)]/40">
                          <Download size={16} />
                          {resource.downloads || 0}
                        </div>
                        <button 
                          onClick={() => shareResource(resource)}
                          className="text-[var(--foreground)]/40 hover:text-cyan-500 transition-all"
                          title="Share Resource"
                        >
                          <Share2 size={16} />
                        </button>
                        <button 
                          onClick={() => setReportResource(resource)}
                          className="text-[var(--foreground)]/40 hover:text-red-500 transition-all"
                          title="Report Resource"
                        >
                          <Flag size={16} />
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDownload(resource)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
                    >
                      <Download size={14} /> Download/View
                    </button>
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
          <h3 className="text-2xl font-bold mb-2">The Vault is empty here 🏜️</h3>
          <p className="text-[var(--foreground)]/50 max-w-xs mx-auto mb-6">Be the first to help your classmates by uploading a resource!</p>
          <button 
            onClick={() => setShowUpload(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg mx-auto"
          >
            Upload Now
          </button>
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
              className="glass-panel max-w-md w-full rounded-[40px] p-8 space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
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
                  <label className="text-[10px] font-black text-[var(--foreground)]/40 uppercase tracking-widest ml-2">Department</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mechanical Engineering" 
                    value={newResource.department}
                    onChange={(e) => setNewResource({...newResource, department: e.target.value})}
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-cyan-500 transition-all"
                    required
                    disabled={isUploading}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[var(--foreground)]/40 uppercase tracking-widest ml-2">Level</label>
                  <select 
                    value={newResource.level}
                    onChange={(e) => setNewResource({...newResource, level: e.target.value})}
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-cyan-500 transition-all"
                    disabled={isUploading}
                  >
                    {[100, 200, 300, 400, 500, 600, "Post-Grad"].map(lvl => (
                      <option key={lvl.toString()} value={lvl.toString()}>{lvl} Level</option>
                    ))}
                  </select>
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
                  <label className="text-[10px] font-black text-[var(--foreground)]/40 uppercase tracking-widest ml-2">Select PDF File</label>
                  <div 
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[var(--border)] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-cyan-500/5 hover:border-cyan-500/30 transition-all group"
                  >
                    <input 
                      type="file" 
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (!file) {
                          setSelectedFile(null);
                          return;
                        }
                        
                        const allowedExtensions = ['.pdf', '.docx'];
                        const fileName = file.name.toLowerCase();
                        const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

                        if (!isValidExtension) {
                          toast("Invalid file type. Only .pdf and .docx files are allowed. 🛡️");
                          e.target.value = "";
                          return;
                        }

                        if (file.size > 10 * 1024 * 1024) {
                          toast("File too large. Maximum size allowed is 10MB. 🛡️");
                          e.target.value = "";
                          return;
                        }

                        setSelectedFile(file);
                      }}
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
                  className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center shadow-xl shadow-cyan-500/20"
                >
                  {isUploading ? (
                    <div className="w-full px-6 flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-3">
                        <Loader2 className="animate-spin" size={20} /> 
                        <span>Uploading {Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-black/20 dark:bg-white/20 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-white h-full transition-all duration-300 ease-out" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : "Publish to Marketplace"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {reportResource && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel max-w-md w-full rounded-[40px] p-8 space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <AlertTriangle size={120} />
              </div>

              <div className="flex justify-between items-center relative z-10">
                <div>
                  <h3 className="text-2xl font-black tracking-tighter">Report Resource</h3>
                  <p className="text-xs text-[var(--foreground)]/50 font-bold max-w-[250px] truncate">
                    {reportResource.title}
                  </p>
                </div>
                <button onClick={() => setReportResource(null)} disabled={isSubmittingReport} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleReport} className="space-y-4 relative z-10">
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    Your report will be reviewed by the Nexus Admin team. False reports may lead to verification revocation.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[var(--foreground)]/40 uppercase tracking-widest ml-2">Reason for Reporting</label>
                  <textarea 
                    placeholder="e.g. Inappropriate content, incorrect course materials, plagiarism, etc." 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-red-500 transition-all min-h-[120px] resize-none"
                    required
                    disabled={isSubmittingReport}
                  />
                  <p className="text-[10px] text-[var(--foreground)]/40 ml-2 font-medium">Max 500 characters</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setReportResource(null)}
                    disabled={isSubmittingReport}
                    className="flex-1 py-4 rounded-2xl text-sm font-black border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmittingReport}
                    className="flex-2 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                  >
                    {isSubmittingReport ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Flag size={18} />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
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
