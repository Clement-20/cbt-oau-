import React, { useState, useEffect, useRef } from "react";
import { Upload, FileText, Download, Search, Trash2, X, Loader2 } from "lucide-react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, getDocs, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { toast } from "./Toast";
import ConfirmModal from "./ConfirmModal";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";

interface Resource {
  id: string;
  title: string;
  type: "PDF" | "Link";
  url: string;
  course: string;
  uploadedBy: string;
  fileHash?: string;
  timestamp?: any;
}

async function computeFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function ResourceVault({ user, isAdmin }: { user?: any, isAdmin?: boolean }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [newResource, setNewResource] = useState<{title: string, type: "PDF" | "Link", url: string, course: string}>({ title: "", type: "PDF", url: "", course: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "resources"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Resource[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Resource);
      });
      setResources(fetched);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "resources");
    });
    return () => unsubscribe();
  }, [user]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast("Please sign in to upload resources");
      return;
    }
    if (!newResource.title || !newResource.course) {
      toast("Please fill all required fields");
      return;
    }
    if (newResource.type === "Link" && !newResource.url) {
      toast("Please provide a valid URL");
      return;
    }
    if (newResource.type === "PDF" && !selectedFile) {
      toast("Please select a PDF file to upload");
      return;
    }
    if (newResource.type === "PDF" && selectedFile && selectedFile.size > 10 * 1024 * 1024) {
      toast("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    try {
      let finalUrl = newResource.url;
      let fileHash = "";

      if (newResource.type === "PDF" && selectedFile) {
        // 1. Compute Hash
        fileHash = await computeFileHash(selectedFile);

        // 2. Check for duplicates
        const duplicateQuery = query(collection(db, "resources"), where("fileHash", "==", fileHash));
        const duplicateSnap = await getDocs(duplicateQuery);
        
        if (!duplicateSnap.empty) {
          toast("This exact material has already been uploaded to the vault.");
          setIsUploading(false);
          return;
        }

        // 3. Upload to Storage
        const storageRef = ref(storage, `resources/${fileHash}_${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        finalUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "resources"), {
        title: newResource.title,
        type: newResource.type,
        url: finalUrl,
        course: newResource.course.toUpperCase(),
        uploadedBy: user.displayName || "Anonymous",
        userId: user.uid,
        ...(fileHash && { fileHash }),
        timestamp: serverTimestamp()
      });
      
      setNewResource({ title: "", type: "PDF", url: "", course: "" });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowUpload(false);
      toast("Resource uploaded successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "resources");
      toast("Failed to upload resource");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "resources", id));
      toast("Resource deleted");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `resources/${id}`);
      toast("Failed to delete resource");
    }
  };

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    r.course.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="font-bold text-2xl text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
          <FileText className="text-cyan-600 dark:text-cyan-500" /> The Vault
        </h3>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground)]/50" size={18} />
            <input 
              type="text" 
              placeholder="Search resources..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-xl pl-10 pr-4 py-2 text-[var(--foreground)] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map(resource => (
          <div key={resource.id} className="bg-black/5 dark:bg-white/5 border border-[var(--border)] p-5 rounded-2xl hover:border-cyan-500/30 transition-all group relative">
            {isAdmin && (
              <button 
                onClick={() => setDeleteId(resource.id)}
                className="absolute top-2 right-2 p-2 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
              >
                <Trash2 size={14} />
              </button>
            )}
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 px-2 py-1 rounded-md">
                {resource.course}
              </span>
              <span className="text-xs text-[var(--foreground)]/50">{resource.type}</span>
            </div>
            <h4 className="font-semibold text-[var(--foreground)] mb-2 line-clamp-2">{resource.title}</h4>
            <p className="text-xs text-[var(--foreground)]/50 mb-4">Uploaded by {resource.uploadedBy}</p>
            
            <a 
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--foreground)] py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Download size={16} /> Download
            </a>
          </div>
        ))}
        
        <div 
          onClick={() => setShowUpload(true)}
          className="bg-black/5 dark:bg-white/5 border border-dashed border-[var(--border)] p-5 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-black/10 dark:hover:bg-white/10 hover:border-cyan-500/50 transition-all cursor-pointer min-h-[160px]"
        >
          <Upload className="text-[var(--foreground)]/50 mb-2" size={24} />
          <p className="text-sm font-medium text-[var(--foreground)]/70">Upload Resource</p>
          <p className="text-xs text-[var(--foreground)]/40 mt-1">PDF or Link</p>
        </div>
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Upload Resource</h3>
              <button onClick={() => setShowUpload(false)} disabled={isUploading} className="text-[var(--foreground)]/50 hover:text-[var(--foreground)]">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <select 
                value={newResource.type}
                onChange={(e) => {
                  setNewResource({...newResource, type: e.target.value as "PDF" | "Link", url: ""});
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-xl p-3 text-[var(--foreground)] focus:outline-none focus:border-cyan-500"
                disabled={isUploading}
              >
                <option value="PDF">PDF File</option>
                <option value="Link">External Link</option>
              </select>

              <input 
                type="text" 
                placeholder="Title (e.g. Law 101 Past Questions)" 
                value={newResource.title}
                onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-xl p-3 text-[var(--foreground)] focus:outline-none focus:border-cyan-500"
                required
                disabled={isUploading}
              />
              <input 
                type="text" 
                placeholder="Course Code (e.g. LAW 101)" 
                value={newResource.course}
                onChange={(e) => setNewResource({...newResource, course: e.target.value.toUpperCase()})}
                className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-xl p-3 text-[var(--foreground)] focus:outline-none focus:border-cyan-500"
                required
                disabled={isUploading}
              />
              
              {newResource.type === "Link" ? (
                <input 
                  type="url" 
                  placeholder="URL (Google Drive, Dropbox, etc.)" 
                  value={newResource.url}
                  onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                  className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-xl p-3 text-[var(--foreground)] focus:outline-none focus:border-cyan-500"
                  required
                  disabled={isUploading}
                />
              ) : (
                <div className="relative">
                  <input 
                    type="file" 
                    accept="application/pdf"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        if (e.target.files[0].size > 10 * 1024 * 1024) {
                          toast("File size must be less than 10MB");
                          e.target.value = "";
                          return;
                        }
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-xl p-3 text-[var(--foreground)] focus:outline-none focus:border-cyan-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-600 dark:file:text-cyan-400 hover:file:bg-cyan-500/20"
                    required
                    disabled={isUploading}
                  />
                  <p className="text-xs text-[var(--foreground)]/50 mt-2">Max file size: 10MB</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isUploading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {isUploading ? <><Loader2 className="animate-spin" size={20} /> Uploading...</> : "Upload to Vault"}
              </button>
            </form>
          </div>
        </div>
      )}
      
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Resource"
        message="Are you sure you want to delete this resource? This action cannot be undone."
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
