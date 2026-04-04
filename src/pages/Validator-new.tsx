import React, { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, onSnapshot, updateDoc, doc, increment, runTransaction, arrayUnion } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { db } from "../firebase";
import { ShieldCheck, Plus, Check, X, Loader2, Share2, Trash2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { toast } from "../components/Toast";

export default function Validator({ user }: { user: any }) {
  const [courseCode, setCourseCode] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

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

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const submitQuestion = async () => {
    if (!courseCode.trim() || !question.trim() || options.some(opt => !opt.trim()) || !user) {
      toast("Please fill in all fields");
      return;
    }

    setIsProcessing(true);

    try {
      // Save to pending_questions collection
      const docRef = await addDoc(collection(db, "pending_questions"), {
        courseCode: courseCode.toUpperCase(),
        question: question.trim(),
        options: options.map(opt => opt.trim()),
        correctAnswer: parseInt(correctAnswer.toString()),
        authorId: user.uid,
        authorEmail: user.email,
        authorName: user.displayName,
        votes: 0,
        voters: [],
        status: "pending",
        timestamp: serverTimestamp()
      });

      toast(`✅ Question submitted! ID: ${docRef.id.substring(0, 8)}`);
      
      // Reset form
      setCourseCode("");
      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer(0);
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
    
    try {
      await runTransaction(db, async (transaction) => {
        const qDoc = await transaction.get(qRef);
        if (!qDoc.exists()) {
          throw new Error("Question does not exist!");
        }
        
        const data = qDoc.data();
        if (data.voters?.includes(user.uid)) {
          throw new Error("Already voted");
        }

        const newVotes = (data.votes || 0) + (isLegit ? 1 : -1);
        const newVoters = [...(data.voters || []), user.uid];

        if (newVotes >= 20 || isAdmin) {
          // Approve and move to courses collection
          const courseRef = doc(db, "courses", data.courseCode);
          const courseSnap = await transaction.get(courseRef);
          
          const newQuestion = {
            question: data.question,
            options: data.options,
            correctAnswer: data.correctAnswer,
            id: qDoc.id
          };

          if (courseSnap.exists()) {
            transaction.update(courseRef, {
              questions: arrayUnion(newQuestion)
            });
          } else {
            transaction.set(courseRef, {
              title: `${data.courseCode} (Community)`,
              description: "Community verified questions.",
              questions: [newQuestion]
            });
          }
          
          transaction.update(qRef, { 
            status: "approved",
            voters: newVoters,
            votes: newVotes
          });
        } else {
          transaction.update(qRef, {
            votes: newVotes,
            voters: newVoters
          });
        }
      });
      
      if (isAdmin) {
        toast("Question approved by Admin!");
      } else {
        toast("Vote recorded successfully!");
      }
    } catch (error: any) {
      if (error.message === "Already voted") {
        toast("You have already voted on this question.");
      } else {
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
    return <div className="flex items-center justify-center h-screen text-gray-500">Please log in to validate questions.</div>;
  }

  return (
    <>
      <Helmet>
        <title>Question Validator - ICEPAB Nexus</title>
        <meta name="description" content="Manually submit and validate academic questions on the ICEPAB Nexus Validator." />
        <meta property="og:title" content="Question Validator" />
        <meta property="og:description" content="Submit and validate questions for the community." />
      </Helmet>

      <div className="min-h-screen bg-[var(--background)] pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={32} className="text-emerald-600 dark:text-emerald-500" />
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Submit & Validate Questions</h1>
            </div>
            <p className="text-[var(--foreground)]/60 mt-2 font-medium">
              Submit questions manually. They need 20 user validations to join the question bank.
            </p>
          </div>

          {/* Submit Form */}
          <div className="bg-[var(--card)]/50 border border-[var(--foreground)]/10 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-6 text-[var(--foreground)]">Add New Question</h2>
            
            {/* Course Code */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Course Code (e.g., GST101)
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                placeholder="GST101"
                className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] placeholder-[var(--foreground)]/40 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            {/* Question Text */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter the question text here..."
                className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] placeholder-[var(--foreground)]/40 focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none"
                rows={3}
              />
            </div>

            {/* Options */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Options (Required: Exactly 4)
              </label>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] placeholder-[var(--foreground)]/40 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    />
                    {correctAnswer === idx && (
                      <span className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded">
                        ✓ Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Correct Answer Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Select Correct Answer
              </label>
              <div className="flex gap-2">
                {options.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCorrectAnswer(idx)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition ${
                      correctAnswer === idx
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[var(--background)] border border-[var(--foreground)]/20 text-[var(--foreground)] hover:border-emerald-600'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={submitQuestion}
              disabled={isProcessing || !courseCode || !question || options.some(opt => !opt)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Submit Question
                </>
              )}
            </button>
          </div>

          {/* Pending Questions */}
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              Pending Validation ({pendingQuestions.filter(q => q.status !== 'deleted').length})
            </h2>

            {isLoadingQuestions ? (
              <div className="text-center py-12">
                <Loader2 className="inline animate-spin text-emerald-600" size={32} />
              </div>
            ) : pendingQuestions.filter(q => q.status !== 'deleted').length === 0 ? (
              <p className="text-center text-[var(--foreground)]/60 py-8">No pending questions yet. Be the first to submit!</p>
            ) : (
              <div className="space-y-4">
                {pendingQuestions.filter(q => q.status !== 'deleted').map((q) => (
                  <div key={q.id} className="bg-[var(--card)]/50 border border-[var(--foreground)]/10 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {q.courseCode}
                        </span>
                        <h3 className="text-lg font-bold text-[var(--foreground)] mt-2">{q.question}</h3>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{q.votes || 0}</div>
                        <div className="text-xs text-[var(--foreground)]/60">votes</div>
                        <div className="text-xs text-[var(--foreground)]/60 mt-1">Need: {Math.max(0, 20 - (q.votes || 0))}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {q.options.map((opt: string, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg ${
                            idx === q.correctAnswer
                              ? 'bg-emerald-600/20 border border-emerald-600/50'
                              : 'bg-[var(--background)] border border-[var(--foreground)]/10'
                          }`}
                        >
                          <span className="font-bold">{String.fromCharCode(65 + idx)}:</span> {opt}
                          {idx === q.correctAnswer && <span className="ml-2 text-emerald-600 font-bold">✓ Correct</span>}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        onClick={() => voteQuestion(q, true)}
                        className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition"
                      >
                        <Check size={18} /> Verify
                      </button>
                      <button
                        onClick={() => voteQuestion(q, false)}
                        className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                      >
                        <X size={18} /> Reject
                      </button>
                      <button
                        onClick={() => inviteToVerify(q)}
                        className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                      >
                        <Share2 size={18} /> Invite
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          className="flex items-center gap-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition ml-auto"
                        >
                          <Trash2 size={18} /> Delete
                        </button>
                      )}
                    </div>

                    <div className="mt-4 text-sm text-[var(--foreground)]/60">
                      By: {q.authorName} ({q.courseCode})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
