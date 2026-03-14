import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { db } from "../firebase";
import { Calculator, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { toast } from "../components/Toast";

export default function GPA({ user }: { user: any }) {
  const [courses, setCourses] = useState([{ code: "", units: 3, grade: "A" }]);
  const [cgpa, setCgpa] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchGPA = async () => {
      try {
        const docRef = doc(db, "users", user.uid, "private", "academic");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().courses) {
          setCourses(docSnap.data().courses);
          calculateGPA(docSnap.data().courses);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "users/private");
      } finally {
        setLoading(false);
      }
    };
    fetchGPA();
  }, [user]);

  const gradePoints: Record<string, number> = {
    "A": 5, "B": 4, "C": 3, "D": 2, "E": 1, "F": 0
  };

  const calculateGPA = (courseList = courses) => {
    let totalPoints = 0;
    let totalUnits = 0;
    
    courseList.forEach(course => {
      if (course.code && course.units > 0 && gradePoints[course.grade] !== undefined) {
        totalPoints += (course.units * gradePoints[course.grade]);
        totalUnits += course.units;
      }
    });

    if (totalUnits > 0) {
      setCgpa(totalPoints / totalUnits);
    } else {
      setCgpa(null);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const docRef = doc(db, "users", user.uid, "private", "academic");
      await setDoc(docRef, { courses, updatedAt: new Date().toISOString() }, { merge: true });
      calculateGPA();
      toast("CGPA data saved securely.");
    } catch (error) {
      console.error("Error saving GPA:", error);
      toast("Failed to save data.");
    } finally {
      setSaving(false);
    }
  };

  const updateCourse = (index: number, field: string, value: any) => {
    const newCourses = [...courses];
    newCourses[index] = { ...newCourses[index], [field]: value };
    setCourses(newCourses);
    calculateGPA(newCourses);
  };

  const addCourse = () => {
    setCourses([...courses, { code: "", units: 3, grade: "A" }]);
  };

  const removeCourse = (index: number) => {
    const newCourses = courses.filter((_, i) => i !== index);
    setCourses(newCourses);
    calculateGPA(newCourses);
  };

  if (!user) {
    return <div className="text-center py-20 text-[var(--foreground)]/60 font-medium">Sign in to access your private CGPA Calculator.</div>;
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Helmet>
        <title>CGPA Calculator | ICEPAB Nexus</title>
        <meta name="description" content="Calculate and track your OAU CGPA privately on the ICEPAB Nexus." />
      </Helmet>
      <div>
        <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
          <Calculator className="text-blue-500" /> CGPA Calculator
        </h1>
        <p className="text-[var(--foreground)]/60 mt-2 font-medium">Your academic data is private and only visible to you.</p>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Course List</h2>
          {cgpa !== null && (
            <div className="bg-blue-600/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-xl font-mono text-xl font-bold shadow-sm">
              CGPA: {cgpa.toFixed(2)}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {courses.map((course, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-3 items-center bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-[var(--border)]">
              <input
                type="text"
                placeholder="Course Code"
                value={course.code}
                onChange={(e) => updateCourse(index, "code", e.target.value.toUpperCase())}
                className="w-full sm:w-1/3 bg-transparent border border-[var(--border)] rounded-xl p-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-medium"
              />
              <div className="flex w-full sm:w-2/3 gap-3">
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={course.units}
                  onChange={(e) => updateCourse(index, "units", parseInt(e.target.value) || 0)}
                  className="w-1/2 bg-transparent border border-[var(--border)] rounded-xl p-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <select
                  value={course.grade}
                  onChange={(e) => updateCourse(index, "grade", e.target.value)}
                  className="w-1/2 bg-transparent border border-[var(--border)] rounded-xl p-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium appearance-none"
                >
                  <option value="A">A (5)</option>
                  <option value="B">B (4)</option>
                  <option value="C">C (3)</option>
                  <option value="D">D (2)</option>
                  <option value="E">E (1)</option>
                  <option value="F">F (0)</option>
                </select>
                <button 
                  onClick={() => removeCourse(index)}
                  className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={addCourse}
            className="flex-1 flex items-center justify-center gap-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--foreground)] py-3 rounded-xl font-medium transition-colors"
          >
            <Plus size={18} /> Add Course
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors shadow-md disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save Data
          </button>
        </div>
      </div>
    </div>
  );
}
