import React, { useState, useRef, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, onSnapshot, updateDoc, doc, increment, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { db } from "../firebase";
import { ShieldCheck, Upload, FileText, Check, X, Loader2, Share2 } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";

export default function Validator({ user }: { user: any }) {
  const [file, setFile] = useState<File | null>(null);
  const [courseCode, setCourseCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "pending_questions"));
    const unsub = onSnapshot(q, (snapshot) => {
      const qs: any[] = [];
      snapshot.forEach((doc) => {
        qs.push({ id: doc.id, ...doc.data() });
      });
      setPendingQuestions(qs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "pending_questions");
    });
    return () => unsub();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processUpload = async () => {
    if (!file || !courseCode || !user) return;
    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(",")[1];
        const mimeType = file.type;

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: "Extract all multiple choice questions from this image/document. Return a JSON array of objects with 'question' (string), 'options' (array of 4 strings), and 'correctAnswer' (number 0-3)." }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.INTEGER }
                },
                required: ["question", "options", "correctAnswer"]
              }
            }
          }
        });

        const extractedQuestions = JSON.parse(response.text || "[]");
        
        for (const q of extractedQuestions) {
          await addDoc(collection(db, "pending_questions"), {
            courseCode: courseCode.toUpperCase(),
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            authorId: user.uid,
            votes: 0,
            status: "pending",
            timestamp: serverTimestamp()
          });
        }

        setFile(null);
        setCourseCode("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        alert(`Successfully extracted ${extractedQuestions.length} questions for validation!`);
        setIsProcessing(false);
      };
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process file. Please try again.");
      setIsProcessing(false);
    }
  };

  const voteQuestion = async (q: any, isLegit: boolean) => {
    if (!user) return;
    const qRef = doc(db, "pending_questions", q.id);
    
    const newVotes = q.votes + (isLegit ? 1 : -1);
    
    if (newVotes >= 20) {
      // Auto-approve and move to courses collection
      try {
        const courseRef = doc(db, "courses", q.courseCode);
        const courseSnap = await getDoc(courseRef);
        
        const newQuestion = {
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          id: q.id // Keep original ID for reference
        };

        if (courseSnap.exists()) {
          await updateDoc(courseRef, {
            questions: arrayUnion(newQuestion)
          });
        } else {
          await setDoc(courseRef, {
            title: `${q.courseCode} (Auto-generated)`,
            description: "Course generated from validated questions.",
            questions: [newQuestion]
          });
        }
        
        // Delete from pending
        await updateDoc(qRef, { status: "approved" }); // Or deleteDoc(qRef)
        alert("Question reached 20 votes and was auto-approved!");
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "courses");
      }
    } else {
      await updateDoc(qRef, {
        votes: increment(isLegit ? 1 : -1)
      });
    }
  };

  const inviteToVerify = (q: any) => {
    const text = `Help me verify this ${q.courseCode} question on ICEPAB Nexus! \n\nQuestion: "${q.question}"\n\nLog in to validate: ${window.location.origin}/validate`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck size={64} className="text-emerald-500 mb-4 drop-shadow-lg" />
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-[var(--foreground)]/60 mt-2 font-medium">Sign in to access the Validator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
          <ShieldCheck className="text-emerald-600 dark:text-emerald-500" /> Validator
        </h1>
        <p className="text-[var(--foreground)]/60 mt-2 font-medium">Upload materials, let AI parse them, and crowdsource verification.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="glass-panel p-8 rounded-3xl shadow-sm space-y-6 h-fit">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Upload size={24} className="text-emerald-600 dark:text-emerald-500" /> Upload Material
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[var(--foreground)]/80 mb-2">Course Code</label>
              <input
                type="text"
                placeholder="e.g. MTH 101"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-2xl p-4 text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-medium transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[var(--foreground)]/80 mb-2">Material (Image/PDF)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-2xl p-4 text-[var(--foreground)]/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-500/10 file:text-emerald-600 dark:file:text-emerald-400 hover:file:bg-emerald-500/20 transition-all cursor-pointer"
              />
            </div>

            <button
              onClick={processUpload}
              disabled={isProcessing || !file || !courseCode}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Parsing with AI...</> : "Process Material"}
            </button>
          </div>
        </div>

        {/* Validation Queue */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText size={24} className="text-emerald-600 dark:text-emerald-500" /> Validation Queue
          </h2>
          
          {pendingQuestions.filter(q => q.status === "pending").length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center text-[var(--foreground)]/50 font-medium border-dashed border-2">
              No pending questions. Upload some materials!
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {pendingQuestions.filter(q => q.status === "pending").map((q) => (
                <div key={q.id} className="glass-panel p-6 rounded-2xl space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full">{q.courseCode}</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => inviteToVerify(q)}
                        className="text-xs font-bold flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full hover:bg-blue-500/20 transition-colors"
                        title="Invite people to verify"
                      >
                        <Share2 size={12} /> Invite
                      </button>
                      <span className="text-xs font-mono font-bold text-[var(--foreground)]/50 bg-black/5 dark:bg-white/10 px-3 py-1 rounded-full">Votes: {q.votes}/20</span>
                    </div>
                  </div>
                  <p className="font-semibold text-lg leading-snug">{q.question}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm font-medium">
                    {q.options.map((opt: string, idx: number) => (
                      <div key={idx} className={`p-3 rounded-xl border transition-colors ${idx === q.correctAnswer ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-black/5 dark:bg-black/30 border-[var(--border)] text-[var(--foreground)]/70'}`}>
                        {opt}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-3">
                    <button onClick={() => voteQuestion(q, true)} className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 py-3 rounded-xl font-bold transition-colors">
                      <Check size={18} /> Legit
                    </button>
                    <button onClick={() => voteQuestion(q, false)} className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 py-3 rounded-xl font-bold transition-colors">
                      <X size={18} /> Flawed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
