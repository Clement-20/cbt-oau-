import React, { useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Course, Question } from "../lib/questions";
import { X, Plus, Trash2, Upload, Loader2, FileText, BookOpen } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";

interface HostTestModalProps {
  user: any;
  courses: Course[];
  onClose: () => void;
}

export default function HostTestModal({ user, courses, onClose }: HostTestModalProps) {
  const [title, setTitle] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"course" | "pdf">("course");
  
  const [file, setFile] = useState<File | null>(null);
  const [pdfCourseCode, setPdfCourseCode] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleHostTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError("Please enter a test title.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (mode === "course") {
        if (!selectedCourse) {
          setError("Please select a course.");
          setIsSubmitting(false);
          return;
        }

        const course = courses.find(c => c.code === selectedCourse);
        if (!course || course.questions.length === 0) {
          setError("Selected course has no questions.");
          setIsSubmitting(false);
          return;
        }

        const randomQs = [...course.questions].sort(() => 0.5 - Math.random()).slice(0, numQuestions);
        await createTestDocument(randomQs, selectedCourse);
      } else {
        if (!file || !pdfCourseCode) {
          setError("Please provide a course code and upload a file.");
          setIsSubmitting(false);
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          try {
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
            
            if (extractedQuestions.length === 0) {
              setError("No questions could be extracted from the file.");
              setIsSubmitting(false);
              return;
            }

            await createTestDocument(extractedQuestions, pdfCourseCode.toUpperCase());
          } catch (err: any) {
            console.error("Error processing file:", err);
            setError("Failed to process file. Please try again.");
            setIsSubmitting(false);
          }
        };
        return; // Wait for FileReader
      }
    } catch (err: any) {
      console.error("Error hosting test:", err);
      setError(err.message || "Failed to host test.");
      setIsSubmitting(false);
    }
  };

  const createTestDocument = async (questions: any[], code: string) => {
    const testData = {
      title,
      courseCode: code,
      hostId: user.uid,
      hostName: user.displayName || "Verified User",
      questions: questions,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
      status: "active",
      maxAttempts: maxAttempts
    };

    await addDoc(collection(db, "hosted_tests"), testData);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button 
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Host a Live Test</h2>
        
        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-6 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
          <button
            type="button"
            onClick={() => setMode("course")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === "course" ? "bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400" : "text-[var(--foreground)]/60 hover:text-[var(--foreground)]"}`}
          >
            <BookOpen size={16} /> From Course
          </button>
          <button
            type="button"
            onClick={() => setMode("pdf")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === "pdf" ? "bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400" : "text-[var(--foreground)]/60 hover:text-[var(--foreground)]"}`}
          >
            <FileText size={16} /> From PDF
          </button>
        </div>

        <form onSubmit={handleHostTest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Test Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., AMS 101 Midterm Prep"
              className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {mode === "course" ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Select Course</label>
                <select 
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Course --</option>
                  {courses.map(c => (
                    <option key={c.code} value={c.code}>{c.code} ({c.questions.length} Qs)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Number of Questions</label>
                <input 
                  type="number" 
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value) || 10)}
                  min={1}
                  max={50}
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Course Code</label>
                <input 
                  type="text" 
                  value={pdfCourseCode}
                  onChange={(e) => setPdfCourseCode(e.target.value)}
                  placeholder="e.g., AMS 101"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Material (Image/PDF)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl p-3 text-[var(--foreground)]/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-500/10 file:text-blue-600 dark:file:text-blue-400 hover:file:bg-blue-500/20 transition-all cursor-pointer"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Max Attempts per User</label>
            <input 
              type="number" 
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
              min={1}
              max={10}
              className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || (mode === "pdf" && !file)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> {mode === "pdf" ? "Processing..." : "Hosting..."}</> : "Start Hosting"}
          </button>
        </form>
      </div>
    </div>
  );
}
