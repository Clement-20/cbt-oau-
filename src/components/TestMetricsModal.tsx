import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { db } from "../firebase";
import { X, Trophy, Clock, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "./Toast";

interface TestResult {
  id: string;
  testId: string;
  userId: string;
  userName: string;
  score: number;
  totalQuestions: number;
  timestamp: number;
}

interface TestMetricsModalProps {
  testId: string;
  testTitle: string;
  onClose: () => void;
}

export default function TestMetricsModal({ testId, testTitle, onClose }: TestMetricsModalProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStopping, setIsStopping] = useState(false);
  const [showConfirmStop, setShowConfirmStop] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const q = query(collection(db, "test_results"), where("testId", "==", testId));
        const snapshot = await getDocs(q);
        const fetchedResults: TestResult[] = [];
        snapshot.forEach((doc) => {
          fetchedResults.push({ id: doc.id, ...doc.data() } as TestResult);
        });
        
        // Sort by score descending, then by timestamp ascending
        fetchedResults.sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          return a.timestamp - b.timestamp;
        });
        
        setResults(fetchedResults);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "test_results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [testId]);

  const handleStopTest = async () => {
    setIsStopping(true);
    try {
      await updateDoc(doc(db, "hosted_tests", testId), {
        status: "ended"
      });
      onClose();
    } catch (error) {
      console.error("Error stopping test:", error);
      toast("Failed to stop test.");
      setIsStopping(false);
      setShowConfirmStop(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
        <button 
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="mb-6 pr-8">
          <h2 className="text-2xl font-bold">{testTitle} - Metrics</h2>
          <p className="text-[var(--foreground)]/60 text-sm mt-1">
            {results.length} {results.length === 1 ? 'person has' : 'people have'} taken this test.
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center items-center h-full text-[var(--foreground)]/50">
              Loading metrics...
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--foreground)]/50 space-y-2">
              <Clock size={32} className="opacity-50" />
              <p>No one has taken this test yet.</p>
            </div>
          ) : (
            (Object.values(
              results.reduce((acc, result) => {
                if (!acc[result.userId]) {
                  acc[result.userId] = {
                    ...result,
                    attempts: 1,
                    bestScore: result.score
                  };
                } else {
                  acc[result.userId].attempts += 1;
                  if (result.score > acc[result.userId].bestScore) {
                    acc[result.userId].bestScore = result.score;
                  }
                }
                return acc;
              }, {} as Record<string, TestResult & { attempts: number; bestScore: number }>)
            ) as (TestResult & { attempts: number; bestScore: number })[])
            .sort((a, b) => b.bestScore - a.bestScore)
            .map((result, index) => (
              <div key={result.id} className="flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--border)]">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-amber-500 text-white' : 
                    index === 1 ? 'bg-slate-300 text-slate-800' : 
                    index === 2 ? 'bg-amber-700 text-white' : 
                    'bg-black/10 dark:bg-white/10'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-bold">{result.userName}</p>
                    <p className="text-xs text-[var(--foreground)]/50">
                      Attempts: {result.attempts}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{result.bestScore} / {result.totalQuestions}</p>
                  <p className="text-xs text-[var(--foreground)]/50">
                    {Math.round((result.bestScore / result.totalQuestions) * 100)}%
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-[var(--border)] flex justify-end">
          <button 
            onClick={() => setShowConfirmStop(true)}
            disabled={isStopping}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white px-5 py-2.5 rounded-xl font-bold transition-colors text-sm disabled:opacity-50"
          >
            <Trash2 size={16} /> Stop Test Early
          </button>
        </div>
      </div>

      {showConfirmStop && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Stop Test Early?</h3>
            <p className="text-[var(--foreground)]/60 text-sm mb-6">
              Are you sure you want to stop this test? No one else will be able to join.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmStop(false)}
                className="flex-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--foreground)] py-3 rounded-xl font-bold transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleStopTest}
                disabled={isStopping}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-colors text-sm disabled:opacity-50"
              >
                {isStopping ? "Stopping..." : "Yes, Stop Test"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
