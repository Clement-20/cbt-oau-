import React, { useState, useEffect } from "react";
import { Upload, FileText, Download, Search, Trash2, X } from "lucide-react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
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
  timestamp?: any;
}

export default function ResourceVault({ user, isAdmin }: { user?: any, isAdmin?: boolean }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [newResource, setNewResource] = useState<{title: string, type: "PDF" | "Link", url: string, course: string}>({ title: "", type: "PDF", url: "", course: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast("Please sign in to upload resources");
      return;
    }
    if (!newResource.title || !newResource.url || !newResource.course) {
      toast("Please fill all fields");
      return;
    }

    try {
      await addDoc(collection(db, "resources"), {
        ...newResource,
        uploadedBy: user.displayName || "Anonymous",
        userId: user.uid,
        timestamp: serverTimestamp()
      });
      setNewResource({ title: "", type: "PDF", url: "", course: "" });
      setShowUpload(false);
      toast("Resource uploaded successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "resources");
      toast("Failed to upload resource");
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
        <h3 className="font-bold text-2xl text-cyan-400 flex items-center gap-2">
          <FileText className="text-cyan-500" /> The Vault
        </h3>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder="Search resources..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map(resource => (
          <div key={resource.id} className="bg-zinc-900/40 border border-zinc-800/50 p-5 rounded-2xl hover:border-cyan-500/30 transition-all group relative">
            {isAdmin && (
              <button 
                onClick={() => setDeleteId(resource.id)}
                className="absolute top-2 right-2 p-2 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
              >
                <Trash2 size={14} />
              </button>
            )}
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold bg-zinc-800 text-cyan-400 px-2 py-1 rounded-md">
                {resource.course}
              </span>
              <span className="text-xs text-zinc-500">{resource.type}</span>
            </div>
            <h4 className="font-semibold text-white mb-2 line-clamp-2">{resource.title}</h4>
            <p className="text-xs text-zinc-500 mb-4">Uploaded by {resource.uploadedBy}</p>
            
            <a 
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Download size={16} /> Download
            </a>
          </div>
        ))}
        
        <div 
          onClick={() => setShowUpload(true)}
          className="bg-zinc-900/20 border border-dashed border-zinc-700 p-5 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-zinc-900/40 hover:border-cyan-500/50 transition-all cursor-pointer min-h-[160px]"
        >
          <Upload className="text-zinc-500 mb-2" size={24} />
          <p className="text-sm font-medium text-zinc-400">Upload Resource</p>
          <p className="text-xs text-zinc-600 mt-1">PDF or Link</p>
        </div>
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Upload Resource</h3>
              <button onClick={() => setShowUpload(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <input 
                type="text" 
                placeholder="Title (e.g. Law 101 Past Questions)" 
                value={newResource.title}
                onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                required
              />
              <input 
                type="text" 
                placeholder="Course Code (e.g. LAW 101)" 
                value={newResource.course}
                onChange={(e) => setNewResource({...newResource, course: e.target.value.toUpperCase()})}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                required
              />
              <input 
                type="url" 
                placeholder="URL (Google Drive, Dropbox, etc.)" 
                value={newResource.url}
                onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                required
              />
              <select 
                value={newResource.type}
                onChange={(e) => setNewResource({...newResource, type: e.target.value as "PDF" | "Link"})}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="PDF">PDF File</option>
                <option value="Link">External Link</option>
              </select>
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-4 rounded-2xl font-bold transition-all">
                Upload to Vault
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
