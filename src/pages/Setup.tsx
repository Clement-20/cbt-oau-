import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

const faculties = {
  "College of Health Sciences": [
    "Basic Medical Sciences",
    "Clinical Sciences",
    "Dentistry"
  ],
  "Other Faculties": [
    "Administration",
    "Agriculture",
    "Arts",
    "Computing Science and Engineering",
    "Education",
    "Environmental Design and Management",
    "Law",
    "Pharmacy",
    "Sciences",
    "Social Sciences"
  ]
};

export default function Setup({ user, dbUser, setDbUser }: { user: any, dbUser: any, setDbUser: any }) {
  const [matricNumber, setMatricNumber] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricNumber || !faculty || !department) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let college = "";
      if (faculties["College of Health Sciences"].includes(faculty)) {
        college = "College of Health Sciences";
      }

      const updates = {
        matricNumber: matricNumber.toUpperCase(),
        faculty,
        department,
        ...(college && { college })
      };

      await updateDoc(doc(db, "users", user.uid), updates);
      setDbUser({ ...dbUser, ...updates });
      navigate("/");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "users");
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4">
      <Helmet>
        <title>Setup Profile | ICEPAB Nexus</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-md w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">Complete Profile</h1>
          <p className="text-zinc-400">Set up your Digital Nexus OAU identity.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Matric Number</label>
            <input 
              type="text" 
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value.toUpperCase())}
              placeholder="e.g., CSC/2019/001"
              className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Faculty</label>
            <select 
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors appearance-none"
              required
            >
              <option value="" disabled>Select Faculty</option>
              <optgroup label="College of Health Sciences">
                {faculties["College of Health Sciences"].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </optgroup>
              <optgroup label="Other Faculties">
                {faculties["Other Faculties"].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Department</label>
            <input 
              type="text" 
              list="departments"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., Computer Science"
              className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              required
            />
            <datalist id="departments">
              <option value="Computer Science" />
              <option value="Medicine and Surgery" />
              <option value="Law" />
              <option value="Accounting" />
              <option value="Mechanical Engineering" />
              <option value="Pharmacy" />
              <option value="Nursing" />
              <option value="Economics" />
            </datalist>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-[0_0_15px_rgba(8,145,178,0.5)]"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
