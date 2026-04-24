import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { Loader2, ShieldAlert, ShieldCheck, User } from "lucide-react";
import { toast } from "../Toast";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList as any[]);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const togglePrivilege = async (userId: string, currentIsAdmin: boolean) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { isAdmin: !currentIsAdmin });
    setUsers(users.map(u => u.id === userId ? { ...u, isAdmin: !currentIsAdmin } : u));
    toast(`Privilege updated!`);
  };

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div className="space-y-4">
      {users.map(user => (
        <div key={user.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
          <div className="flex items-center gap-3">
            <User className="text-zinc-400" />
            <div>
              <p className="font-bold">{user.email}</p>
              <p className="text-xs text-zinc-500">{user.id}</p>
            </div>
          </div>
          <button 
            onClick={() => togglePrivilege(user.id, !!user.isAdmin)}
            className={`p-2 rounded-lg ${user.isAdmin ? 'text-emerald-500' : 'text-zinc-500'}`}
          >
            {user.isAdmin ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
          </button>
        </div>
      ))}
    </div>
  );
}
