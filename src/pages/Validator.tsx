import React, { useState, useRef, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, onSnapshot, updateDoc, doc, increment, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { db } from "../firebase";
import { ShieldCheck, Upload, FileText, Check, X, Loader2, Share2, BatteryLow, Type as TypeIcon, Trash2 } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import { Helmet } from "react-helmet-async";
import { toast } from "../components/Toast";
import { checkAndUseNexusEnergy } from "../utils/nexusUtils";
import NexusEnergyModal from "../components/NexusEnergyModal";

export default function Validator({ user }: { user: any }) {
  const [file, setFile] = useState<File | null>(null);
  const [courseCode, setCourseCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "text">("file");
  const [manualText, setManualText] = useState("");
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.email === "banmekeifeoluwa@gmail.com";

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "pending_questions"));
    const unsub = onSnapshot(q, (snapshot) => {
      const qs: any[] = [];
      snapshot.forEach((doc) => {
        qs.push({ id: doc.id, ...doc.data() });
      });
      setPendingQuestions(qs);
      setIsLoadingQuestions(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "pending_questions");
      setIsLoadingQuestions(false);
    });
    return () => unsub();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const processUpload = async () => {
    if ((uploadMode === "file" && !file) || (uploadMode === "text" && !manualText) || !courseCode || !user) return;
    setIsProcessing(true);

    try {
      let textToProcess = "";

      if (uploadMode === "file" && file) {
        // 1. Check Cache
        const cacheKey = `nexus_extract_${file.name}_${file.size}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const extractedQuestions = JSON.parse(cached);
          await saveQuestions(extractedQuestions);
          return;
        }

        if (file.type === "text/plain") {
          textToProcess = await file.text();
        } else {
          // Process Image/PDF with Gemini
          const { allowed } = await checkAndUseNexusEnergy(user.uid);
          if (!allowed) {
            setShowEnergyModal(true);
            setIsProcessing(false);
            return;
          }

          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
            const base64Data = (reader.result as string).split(",")[1];
            const mimeType = file.type;
            await callGemini(base64Data, mimeType, cacheKey, undefined, courseCode);
          };
          return;
        }
      } else {
        textToProcess = manualText;
      }

      // If we have text (from .txt or manual input), use Gemini to structure it
      const { allowed } = await checkAndUseNexusEnergy(user.uid);
      if (!allowed) {
        setShowEnergyModal(true);
        setIsProcessing(false);
        return;
      }
      await callGemini(null, null, null, textToProcess, courseCode);

    } catch (error) {
      console.error("Error processing file:", error);
      toast("Failed to process. Please try again.");
      setIsProcessing(false);
    }
  };

  const callGemini = async (base64Data: string | null, mimeType: string | null, cacheKey: string | null, rawText?: string, targetCourse?: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const parts: any[] = [];
      if (base64Data && mimeType) {
        parts.push({ inlineData: { data: base64Data, mimeType } });
      }
      
      const prompt = `
        You are an expert academic validator for OAU students. 
        TASK:
        1. First, verify if the provided ${rawText ? 'text' : 'material'} contains academic questions related to the course code: ${targetCourse}.
        2. If it does NOT contain relevant questions, return an empty array [].
        3. If it DOES, extract all multiple-choice questions exactly as they appear in the material.
        4. Do NOT make up questions. Only extract what is there.
        5. For each question, extract:
           - The question text.
           - Exactly 4 options.
           - The correct answer index (0-3). If the correct answer is not indicated, use your knowledge to determine it.
        
        ${rawText ? `RAW TEXT TO PROCESS: ${rawText}` : ''}
        
        RETURN FORMAT: A JSON array of objects.
      `;

      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: { parts },
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
      
      if (extractedQuestions.length === 0) {
        toast(`No relevant questions found for ${targetCourse}. Please check your material.`);
        setIsProcessing(false);
        return;
      }

      if (cacheKey) localStorage.setItem(cacheKey, JSON.stringify(extractedQuestions));
      await saveQuestions(extractedQuestions);
    } catch (error) {
      console.error("Gemini Error:", error);
      toast("AI processing failed. Please ensure the material is clear.");
      setIsProcessing(false);
    }
  };

  const saveQuestions = async (questions: any[]) => {
    try {
      for (const q of questions) {
        await addDoc(collection(db, "pending_questions"), {
          courseCode: courseCode.toUpperCase(),
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          authorId: user.uid,
          votes: 0,
          voters: [],
          status: "pending",
          timestamp: serverTimestamp()
        });
      }

      setFile(null);
      setCourseCode("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast(`Successfully extracted ${questions.length} questions for validation!`);
      setIsProcessing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "pending_questions");
      setIsProcessing(false);
    }
  };

  const voteQuestion = async (q: any, isLegit: boolean) => {
    if (!user) return;
    if (q.voters?.includes(user.uid)) {
      toast("You have already voted on this question.");
      return;
    }

    const qRef = doc(db, "pending_questions", q.id);
    const newVotes = q.votes + (isLegit ? 1 : -1);
    
    if (newVotes >= 20 || isAdmin) {
      // Approve and move to courses collection
      try {
        const courseRef = doc(db, "courses", q.courseCode);
        const courseSnap = await getDoc(courseRef);
        
        const newQuestion = {
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          id: q.id
        };

        if (courseSnap.exists()) {
          await updateDoc(courseRef, {
            questions: arrayUnion(newQuestion)
          });
        } else {
          await setDoc(courseRef, {
            title: `${q.courseCode} (Community)`,
            description: "Course generated from validated questions.",
            questions: [newQuestion]
          });
        }
        
        await updateDoc(qRef, { 
          status: "approved",
          voters: arrayUnion(user.uid)
        });
        toast(isAdmin ? "Question approved by Admin!" : "Question reached 20 votes and was auto-approved!");
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "courses");
      }
    } else {
      try {
        await updateDoc(qRef, {
          votes: increment(isLegit ? 1 : -1),
          voters: arrayUnion(user.uid)
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `pending_questions/${q.id}`);
      }
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, "pending_questions", id), { status: "deleted" });
      toast("Question deleted by Admin.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `pending_questions/${id}`);
      toast("Failed to delete.");
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
      <Helmet>
        <title>Validator | ICEPAB Nexus</title>
        <meta name="description" content="Upload materials, let AI parse them, and crowdsource verification on the ICEPAB Nexus Validator." />
      </Helmet>
      <div>
        <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
          <ShieldCheck className="text-emerald-600 dark:text-emerald-500" /> Validator
        </h1>
        <p className="text-[var(--foreground)]/60 mt-2 font-medium">Upload materials, let AI parse them, and crowdsource verification.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="glass-panel p-8 rounded-3xl shadow-sm space-y-6 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Upload size={24} className="text-emerald-600 dark:text-emerald-500" /> Submit Questions
            </h2>
            <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
              <button 
                onClick={() => setUploadMode("file")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${uploadMode === "file" ? 'bg-emerald-600 text-white shadow-md' : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)]'}`}
              >
                File
              </button>
              <button 
                onClick={() => setUploadMode("text")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${uploadMode === "text" ? 'bg-emerald-600 text-white shadow-md' : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)]'}`}
              >
                Text
              </button>
            </div>
          </div>
          
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
            
            {uploadMode === "file" ? (
              <div>
                <label className="block text-sm font-bold text-[var(--foreground)]/80 mb-2">Material (Image/PDF/TXT)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf,text/plain"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-2xl p-4 text-[var(--foreground)]/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-500/10 file:text-emerald-600 dark:file:text-emerald-400 hover:file:bg-emerald-500/20 transition-all cursor-pointer"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-[var(--foreground)]/80 mb-2">Paste Questions</label>
                <textarea
                  placeholder="Paste your questions here. AI will structure them for you..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-2xl p-4 text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-32 font-medium transition-all resize-none"
                />
              </div>
            )}

            <button
              onClick={processUpload}
              disabled={isProcessing || (uploadMode === "file" ? !file : !manualText) || !courseCode}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : "Submit for Validation"}
            </button>
          </div>
        </div>

        {/* Validation Queue */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText size={24} className="text-emerald-600 dark:text-emerald-500" /> Validation Queue
          </h2>
          
          {isLoadingQuestions ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-panel p-6 rounded-2xl space-y-4 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-6 bg-black/10 dark:bg-white/10 rounded w-20"></div>
                    <div className="h-6 bg-black/10 dark:bg-white/10 rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-black/5 dark:bg-white/5 rounded w-full"></div>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(j => (
                      <div key={j} className="h-10 bg-black/5 dark:bg-white/5 rounded-xl"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : pendingQuestions.filter(q => q.status === "pending").length === 0 ? (
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
                      {isAdmin && (
                        <button 
                          onClick={() => deleteQuestion(q.id)}
                          className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
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
      {showEnergyModal && <NexusEnergyModal onClose={() => setShowEnergyModal(false)} />}
    </div>
  );
}
