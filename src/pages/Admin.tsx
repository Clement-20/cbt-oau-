import React, { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, increment, deleteDoc, orderBy, limit } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { db } from "../firebase";
import { ShieldAlert, Send, Search, BadgeCheck, Loader2, CheckCircle, Trash2, FileText, BookOpen } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { toast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

export default function Admin({ user }: { user: any }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [unverifiedUsers, setUnverifiedUsers] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);

  const [contentSearch, setContentSearch] = useState("");
  const [contentResults, setContentResults] = useState<{ courses: any[], resources: any[] }>({ courses: [], resources: [] });
  const [contentLoading, setContentLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, type: 'course' | 'resource'} | null>(null);

  useEffect(() => {
    if (!user || user.email !== "banmekeifeoluwa@gmail.com") return;

    const fetchQueue = async () => {
      try {
        const q = query(
          collection(db, "users"), 
          where("isVerified", "==", false),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const users: any[] = [];
        snapshot.forEach((doc) => {
          users.push({ id: doc.id, ...doc.data() });
        });
        // Sort locally to avoid composite index requirement
        users.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setUnverifiedUsers(users);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "users");
      } finally {
        setQueueLoading(false);
      }
    };

    fetchQueue();
  }, [user]);

  const approveUser = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        isVerified: true,
        xp: increment(500)
      });
      setUnverifiedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  if (!user || user.email !== "banmekeifeoluwa@gmail.com") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert size={64} className="text-red-500 mb-4 drop-shadow-lg" />
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-[var(--foreground)]/60 mt-2 font-medium">You do not have Overlord privileges.</p>
      </div>
    );
  }

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "broadcasts"), {
        message,
        authorId: user.uid,
        timestamp: serverTimestamp()
      });
      setMessage("");
      toast("Broadcast sent to all students instantly!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "broadcasts");
      toast("Failed to send broadcast.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const q = query(collection(db, "users"), where("email", "==", searchEmail.trim()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        setSearchResult({ id: userDoc.id, ...userDoc.data() });
      } else {
        toast("User not found.");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "users");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleVerifyUser = async () => {
    if (!searchResult) return;
    
    try {
      const userRef = doc(db, "users", searchResult.id);
      await updateDoc(userRef, { isVerified: true });
      setSearchResult({ ...searchResult, isVerified: true });
      toast("User verified successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${searchResult.id}`);
      toast("Failed to verify user.");
    }
  };

  const handleSearchContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentSearch.trim()) return;

    setContentLoading(true);
    try {
      // Search Courses
      const coursesQ = query(collection(db, "courses"), limit(500));
      const coursesSnap = await getDocs(coursesQ);
      const courses = coursesSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((c: any) => c.courseCode?.toLowerCase().includes(contentSearch.toLowerCase()) || c.courseTitle?.toLowerCase().includes(contentSearch.toLowerCase()));

      // Search Resources
      const resourcesQ = query(collection(db, "resources"), limit(500));
      const resourcesSnap = await getDocs(resourcesQ);
      const resources = resourcesSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((r: any) => r.title?.toLowerCase().includes(contentSearch.toLowerCase()) || r.course?.toLowerCase().includes(contentSearch.toLowerCase()));

      setContentResults({ courses, resources });
      if (courses.length === 0 && resources.length === 0) {
        toast("No matching content found.");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "courses/resources");
      toast("Failed to search content.");
    } finally {
      setContentLoading(false);
    }
  };

  const handleDeleteContent = async (id: string, type: 'course' | 'resource') => {
    try {
      const collectionName = type === 'course' ? 'courses' : 'resources';
      await deleteDoc(doc(db, collectionName, id));
      
      setContentResults(prev => ({
        courses: type === 'course' ? prev.courses.filter(c => c.id !== id) : prev.courses,
        resources: type === 'resource' ? prev.resources.filter(r => r.id !== id) : prev.resources
      }));
      
      toast(`${type.charAt(0).toUpperCase() + type.slice(1)} removed successfully.`);
    } catch (error) {
      const collectionName = type === 'course' ? 'courses' : 'resources';
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
      toast(`Failed to remove ${type}.`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Helmet>
        <title>Admin | ICEPAB Nexus</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div>
        <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
          <ShieldAlert className="text-red-600 dark:text-red-500" /> Admin Overlord
        </h1>
        <p className="text-[var(--foreground)]/60 mt-2 font-medium">Manage the Nexus. Your actions are immediate.</p>
      </div>

      <div className="glass-panel p-8 rounded-3xl shadow-sm">
        <h2 className="text-2xl font-bold mb-2">Live Push Broadcast</h2>
        <p className="text-sm text-[var(--foreground)]/60 mb-8 font-medium">
          Push a 1-line Clement IfeOluwa quote or critical update to all students instantly.
        </p>
        
        <form onSubmit={handleBroadcast} className="space-y-6">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter broadcast message..."
            className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-2xl p-5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-40 font-medium"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold transition-colors shadow-md disabled:opacity-50"
          >
            {loading ? "Broadcasting..." : "Send Broadcast"} <Send size={20} />
          </button>
        </form>
      </div>

      <div className="glass-panel p-8 rounded-3xl shadow-sm space-y-6">
        <h2 className="text-2xl font-bold mb-2">Verification Queue</h2>
        <p className="text-sm text-[var(--foreground)]/60 mb-6 font-medium">
          Approve pending student verifications. Grants +500 XP.
        </p>

        {queueLoading ? (
          <div className="p-10 text-center text-[var(--foreground)]/50 font-medium">Loading queue...</div>
        ) : unverifiedUsers.length === 0 ? (
          <div className="p-10 text-center text-[var(--foreground)]/50 font-medium flex flex-col items-center justify-center">
            <CheckCircle className="text-emerald-500 mb-2" size={32} />
            All caught up! No pending verifications.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/5 dark:bg-white/5 text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-widest border-b border-[var(--border)]">
                  <th className="p-4">Student</th>
                  <th className="p-4">Matric Number</th>
                  <th className="p-4">Faculty / Dept</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {unverifiedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} alt={u.displayName} loading="lazy" decoding="async" className="w-10 h-10 rounded-full border border-[var(--border)]" />
                        <span className="font-bold">{u.displayName}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm">{u.matricNumber}</td>
                    <td className="p-4">
                      <div className="text-sm font-medium">{u.faculty}</div>
                      <div className="text-xs text-[var(--foreground)]/50">{u.department}</div>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => approveUser(u.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm inline-flex items-center gap-2"
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-panel p-8 rounded-3xl shadow-sm space-y-6">
        <h2 className="text-2xl font-bold mb-2">User Management</h2>
        <p className="text-sm text-[var(--foreground)]/60 mb-6 font-medium">
          Search for users to manually verify them (free of charge).
        </p>

        <form onSubmit={handleSearchUser} className="flex gap-3">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="User Email..."
            className="flex-1 bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-xl p-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            required
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 px-4 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
          >
            {searchLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />} Search
          </button>
        </form>

        {searchResult && (
          <div className="mt-6 p-6 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={searchResult.photoURL || `https://ui-avatars.com/api/?name=${searchResult.displayName}`} alt="Avatar" loading="lazy" decoding="async" className="w-12 h-12 rounded-full" />
              <div>
                <div className="font-bold flex items-center gap-1">
                  {searchResult.displayName}
                  {searchResult.isVerified && <BadgeCheck size={16} className="text-blue-500" />}
                </div>
                <div className="text-sm text-[var(--foreground)]/60">{searchResult.email}</div>
              </div>
            </div>
            
            {!searchResult.isVerified ? (
              <button
                onClick={handleVerifyUser}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm"
              >
                <BadgeCheck size={16} /> Verify User
              </button>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-full">
                Verified
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="glass-panel p-8 rounded-3xl shadow-sm space-y-6">
        <h2 className="text-2xl font-bold mb-2">Content Management</h2>
        <p className="text-sm text-[var(--foreground)]/60 mb-6 font-medium">
          Search and remove CBT courses or Vault resources.
        </p>

        <form onSubmit={handleSearchContent} className="flex gap-3">
          <input
            type="text"
            value={contentSearch}
            onChange={(e) => setContentSearch(e.target.value)}
            placeholder="Search by name or course code..."
            className="flex-1 bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-xl p-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            required
          />
          <button
            type="submit"
            disabled={contentLoading}
            className="bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 px-4 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
          >
            {contentLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />} Search
          </button>
        </form>

        {(contentResults.courses.length > 0 || contentResults.resources.length > 0) && (
          <div className="space-y-6">
            {contentResults.courses.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[var(--foreground)]/40 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={14} /> CBT Courses ({contentResults.courses.length})
                </h3>
                <div className="grid gap-3">
                  {contentResults.courses.map(course => (
                    <div key={course.id} className="p-4 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl flex items-center justify-between group">
                      <div>
                        <div className="font-bold">{course.courseCode}: {course.courseTitle}</div>
                        <div className="text-xs text-[var(--foreground)]/50">Questions: {course.questions?.length || 0}</div>
                      </div>
                      <button 
                        onClick={() => setDeleteConfirm({id: course.id, type: 'course'})}
                        className="p-2 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contentResults.resources.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[var(--foreground)]/40 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Vault Resources ({contentResults.resources.length})
                </h3>
                <div className="grid gap-3">
                  {contentResults.resources.map(resource => (
                    <div key={resource.id} className="p-4 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl flex items-center justify-between group">
                      <div>
                        <div className="font-bold">{resource.course}: {resource.title}</div>
                        <div className="text-xs text-[var(--foreground)]/50">Type: {resource.type} | By: {resource.uploadedBy}</div>
                      </div>
                      <button 
                        onClick={() => setDeleteConfirm({id: resource.id, type: 'resource'})}
                        className="p-2 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title={`Delete ${deleteConfirm?.type === 'course' ? 'Course' : 'Resource'}`}
        message={`Are you sure you want to remove this ${deleteConfirm?.type}? This action is irreversible.`}
        onConfirm={() => deleteConfirm && handleDeleteContent(deleteConfirm.id, deleteConfirm.type)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
