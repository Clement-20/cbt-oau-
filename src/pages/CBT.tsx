import { useState, useEffect } from "react";
import { courses as localCourses, getRandomQuestions, Question, Course } from "../lib/questions";
import { BookOpen, Play, CheckCircle2, XCircle, Flame, Users, Plus, Activity } from "lucide-react";
import { doc, updateDoc, increment, collection, getDocs, getDoc, onSnapshot, query, where, addDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { db } from "../firebase";
import HostTestModal from "../components/HostTestModal";
import TestMetricsModal from "../components/TestMetricsModal";

interface HostedTest {
  id: string;
  title: string;
  courseCode: string;
  hostId: string;
  hostName: string;
  questions: Question[];
  createdAt: number;
  expiresAt: number;
  status: string;
}

export default function CBT({ user }: { user: any }) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [allCourses, setAllCourses] = useState<Course[]>(localCourses);
  const [startTime, setStartTime] = useState<number>(0);
  const [newlyAwardedShana, setNewlyAwardedShana] = useState(false);
  
  const [isVerified, setIsVerified] = useState(false);
  const [hostedTests, setHostedTests] = useState<HostedTest[]>([]);
  const [showHostModal, setShowHostModal] = useState(false);
  const [currentHostedTestId, setCurrentHostedTestId] = useState<string | null>(null);
  const [metricsTestId, setMetricsTestId] = useState<string | null>(null);
  const [metricsTestTitle, setMetricsTestTitle] = useState<string>("");

  useEffect(() => {
    if (user) {
      const fetchUser = async () => {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          setIsVerified(userSnap.data().isVerified || false);
        }
      };
      fetchUser();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Fetch active hosted tests
    const q = query(collection(db, "hosted_tests"), where("status", "==", "active"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tests: HostedTest[] = [];
      const now = Date.now();
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<HostedTest, 'id'>;
        if (data.expiresAt > now) {
          tests.push({ id: doc.id, ...data });
        }
      });
      setHostedTests(tests);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "hosted_tests");
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchFirestoreCourses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        const firestoreCourses: Course[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          firestoreCourses.push({
            code: doc.id,
            title: data.title || doc.id,
            description: data.description || "Community validated course.",
            questions: data.questions || []
          });
        });

        // Merge local and firestore courses
        const mergedCourses = [...localCourses];
        
        firestoreCourses.forEach(fc => {
          const existingIndex = mergedCourses.findIndex(lc => lc.code === fc.code);
          if (existingIndex >= 0) {
            // Merge questions if course exists
            mergedCourses[existingIndex] = {
              ...mergedCourses[existingIndex],
              questions: [...mergedCourses[existingIndex].questions, ...fc.questions]
            };
          } else {
            // Add new course
            mergedCourses.push(fc);
          }
        });
        
        setAllCourses(mergedCourses);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "courses");
      }
    };

    fetchFirestoreCourses();
  }, [user]);

  const startTest = (courseCode: string, hostedTest?: HostedTest) => {
    setSelectedCourse(courseCode);
    
    if (hostedTest) {
      setQuestions(hostedTest.questions);
      setCurrentHostedTestId(hostedTest.id);
    } else {
      const course = allCourses.find((c) => c.code === courseCode);
      if (!course) return;
      
      const count = 10; // 10 questions for demo
      const randomQs = [...course.questions].sort(() => 0.5 - Math.random()).slice(0, count);
      setQuestions(randomQs);
      setCurrentHostedTestId(null);
    }
    
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsFinished(false);
    setSelectedOption(null);
    setShowResult(false);
    setStartTime(Date.now());
    setNewlyAwardedShana(false);
  };

  const handleAnswer = async (optionIndex: number) => {
    if (showResult) return;
    setSelectedOption(optionIndex);
    setShowResult(true);

    let newScore = score;
    if (optionIndex === questions[currentQuestionIndex].correctAnswer) {
      newScore = score + 1;
      setScore(newScore);
    }

    setTimeout(async () => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
        setShowResult(false);
      } else {
        setIsFinished(true);
        if (user) {
          try {
            // Save test result if it's a hosted test
            if (currentHostedTestId) {
              await addDoc(collection(db, "test_results"), {
                testId: currentHostedTestId,
                userId: user.uid,
                userName: user.displayName || "Anonymous",
                score: newScore,
                totalQuestions: questions.length,
                timestamp: Date.now()
              });
            }

            const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
            const percentage = (newScore / questions.length) * 100;
            const isHighScore = percentage >= 80;
            const xpEarned = newScore * 10 + 5;

            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              const newTotalTime = (userData.cbtTimeSpent || 0) + timeSpentSeconds;
              const newHighScoreCount = (userData.highScoreCount || 0) + (isHighScore ? 1 : 0);
              
              // Shana condition: 1 hour (3600 seconds) and at least 3 high scores
              const meetsShanaCondition = newTotalTime >= 3600 && newHighScoreCount >= 3;
              const wasAlreadyShana = userData.isShana || false;
              const isNowShana = wasAlreadyShana || meetsShanaCondition;

              if (!wasAlreadyShana && isNowShana) {
                setNewlyAwardedShana(true);
              }

              await updateDoc(userRef, { 
                xp: increment(xpEarned),
                cbtTimeSpent: newTotalTime,
                highScoreCount: newHighScoreCount,
                isShana: isNowShana
              });
            }
          } catch (error) {
            console.error("Failed to update stats:", error);
          }
        }
      }
    }, 1500);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen size={64} className="text-blue-500 mb-4 drop-shadow-lg" />
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-[var(--foreground)]/60 mt-2 font-medium">Sign in to access the CBT Engine.</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-6 glass-panel rounded-3xl p-10 relative overflow-hidden">
        {newlyAwardedShana && (
          <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 font-bold text-sm animate-pulse flex justify-center items-center gap-2">
            <Flame size={16} /> YOU UNLOCKED THE SHANA BADGE! <Flame size={16} />
          </div>
        )}
        <BookOpen size={80} className="mx-auto text-blue-500 drop-shadow-lg mt-4" />
        <h2 className="text-4xl font-bold tracking-tight">Test Completed!</h2>
        <p className="text-2xl text-[var(--foreground)]/80 font-medium">You scored {score} out of {questions.length}</p>
        <div className="inline-block bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-6 py-3 rounded-2xl font-mono text-xl font-bold shadow-sm">
          +{score * 10 + 5} XP Earned
        </div>
        <div className="pt-6">
          <button 
            onClick={() => {
              setSelectedCourse(null);
              setCurrentHostedTestId(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold transition-colors shadow-md"
          >
            Return to Course Selection
          </button>
        </div>
      </div>
    );
  }

  if (selectedCourse && questions.length > 0) {
    const q = questions[currentQuestionIndex];
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-between items-center glass-panel p-5 rounded-2xl">
          <div className="font-bold text-lg tracking-tight">{selectedCourse}</div>
          <div className="text-[var(--foreground)]/60 font-medium text-sm bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="font-mono text-blue-600 dark:text-blue-400 font-bold">Score: {score}</div>
        </div>

        <div className="glass-panel p-8 md:p-10 rounded-3xl space-y-8 shadow-sm">
          <h3 className="text-2xl font-medium leading-relaxed">{q.question}</h3>
          
          <div className="space-y-4">
            {q.options.map((opt, idx) => {
              let btnClass = "bg-black/5 dark:bg-white/5 border-[var(--border)] hover:bg-black/10 dark:hover:bg-white/10";
              if (showResult) {
                if (idx === q.correctAnswer) {
                  btnClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm";
                } else if (idx === selectedOption) {
                  btnClass = "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400 font-bold shadow-sm";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={showResult}
                  className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between ${btnClass}`}
                >
                  <span className="font-medium text-lg">{opt}</span>
                  {showResult && idx === q.correctAnswer && <CheckCircle2 size={24} className="text-emerald-500" />}
                  {showResult && idx === selectedOption && idx !== q.correctAnswer && <XCircle size={24} className="text-red-500" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
            <BookOpen className="text-blue-600 dark:text-blue-500" /> CBT Engine
          </h1>
          <p className="text-[var(--foreground)]/60 mt-2 font-medium">Practice exams for GST 111, BUS 101, SOC 101, and AMS 103.</p>
        </div>
        
        {isVerified && (
          <button 
            onClick={() => setShowHostModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-md shrink-0"
          >
            <Plus size={20} /> Host a Test
          </button>
        )}
      </div>

      {hostedTests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="text-red-500" /> Live Hosted Tests
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {hostedTests.map((test) => (
              <div key={test.id} className="glass-panel p-5 rounded-2xl border border-red-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{test.title}</h3>
                  <span className="text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-1 rounded-md">Live</span>
                </div>
                <p className="text-sm text-[var(--foreground)]/60 mb-4">
                  Hosted by <span className="font-semibold text-[var(--foreground)]">{test.hostName}</span> • {test.courseCode} • {test.questions.length} Qs
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => startTest(test.courseCode, test)}
                    className="flex-1 bg-black/5 dark:bg-white/10 hover:bg-red-500 hover:text-white text-[var(--foreground)] py-2 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Play size={16} /> Join Test
                  </button>
                  {test.hostId === user.uid && (
                    <button 
                      onClick={() => {
                        setMetricsTestId(test.id);
                        setMetricsTestTitle(test.title);
                      }}
                      className="bg-black/5 dark:bg-white/10 hover:bg-blue-500 hover:text-white text-[var(--foreground)] px-4 py-2 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <Users size={16} /> Metrics
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {allCourses.map((course) => (
          <div key={course.code} className="glass-panel p-8 rounded-3xl flex flex-col justify-between group hover:border-blue-500/30 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-3xl font-bold tracking-tight">{course.code}</h2>
                <span className="text-xs font-bold bg-blue-600/10 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full border border-blue-500/20">
                  {course.questions.length} Qs
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]/80 mb-2">{course.title}</h3>
              <p className="text-sm text-[var(--foreground)]/50 mb-8 font-medium leading-relaxed">{course.description}</p>
            </div>
            <button 
              onClick={() => startTest(course.code)}
              disabled={course.questions.length === 0}
              className="flex items-center justify-center gap-2 w-full bg-black/5 dark:bg-white/10 group-hover:bg-blue-600 group-hover:text-white text-[var(--foreground)] py-4 rounded-2xl font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={18} fill="currentColor" /> {course.questions.length > 0 ? "Start Practice" : "No Questions"}
            </button>
          </div>
        ))}
      </div>

      {showHostModal && (
        <HostTestModal 
          user={user} 
          courses={allCourses} 
          onClose={() => setShowHostModal(false)} 
        />
      )}

      {metricsTestId && (
        <TestMetricsModal 
          testId={metricsTestId} 
          testTitle={metricsTestTitle} 
          onClose={() => setMetricsTestId(null)} 
        />
      )}
    </div>
  );
}
