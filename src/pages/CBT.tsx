import React, { useState, useEffect } from "react";
import { courses as localCourses, getRandomQuestions, Question, Course } from "../lib/questions";
import { BookOpen, Play, CheckCircle2, XCircle, Flame, Users, Plus, Activity, Share2 } from "lucide-react";
import { doc, updateDoc, increment, collection, getDocs, getDoc, onSnapshot, query, where, addDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { db } from "../firebase";
import { clsx } from "clsx";
import HostTestModal from "../components/HostTestModal";
import TestMetricsModal from "../components/TestMetricsModal";
import Calculator from "../components/Calculator";
import AITutor from "../nexus-features/AITutor";
import { Helmet } from "react-helmet-async";
import { toast } from "../components/Toast";
import { Calculator as CalcIcon, HelpCircle } from "lucide-react";

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
  maxAttempts?: number;
  duration?: number;
}

export default function CBT({ user, isFocusMode, setIsFocusMode }: { user: any, isFocusMode?: boolean, setIsFocusMode?: (val: boolean) => void }) {
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
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const [isVerified, setIsVerified] = useState(false);
  const [hostedTests, setHostedTests] = useState<HostedTest[]>([]);
  const [showHostModal, setShowHostModal] = useState(false);
  const [currentHostedTestId, setCurrentHostedTestId] = useState<string | null>(null);
  const [currentHostId, setCurrentHostId] = useState<string | null>(null);
  const [metricsTestId, setMetricsTestId] = useState<string | null>(null);
  const [metricsTestTitle, setMetricsTestTitle] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHostedTestsQuery, setSearchHostedTestsQuery] = useState("");
  const [questionLimit, setQuestionLimit] = useState<number>(40);
  const [showCalculator, setShowCalculator] = useState(false);
  const [explanationPrompt, setExplanationPrompt] = useState("");
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingTests, setIsLoadingTests] = useState(true);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
  const [lastQuestionTime, setLastQuestionTime] = useState<number>(0);

  // Persistence Logic
  useEffect(() => {
    if (selectedCourse && !isFinished) {
      const session = {
        selectedCourse,
        questions,
        currentQuestionIndex,
        userAnswers,
        startTime,
        timeLeft,
        timePerQuestion,
        lastQuestionTime,
        currentHostedTestId,
        currentHostId
      };
      localStorage.setItem("nexus_cbt_session", JSON.stringify(session));
    }
  }, [selectedCourse, currentQuestionIndex, userAnswers, timeLeft, isFinished]);

  useEffect(() => {
    const savedSession = localStorage.getItem("nexus_cbt_session");
    if (savedSession && !selectedCourse) {
      const session = JSON.parse(savedSession);
      setSelectedCourse(session.selectedCourse);
      setQuestions(session.questions);
      setCurrentQuestionIndex(session.currentQuestionIndex);
      setUserAnswers(session.userAnswers);
      setStartTime(session.startTime);
      setTimeLeft(session.timeLeft);
      setTimePerQuestion(session.timePerQuestion || []);
      setLastQuestionTime(session.lastQuestionTime || Date.now());
      setCurrentHostedTestId(session.currentHostedTestId);
      setCurrentHostId(session.currentHostId);
    }
  }, []);

  const shuffle = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const shuffleQuestion = (q: Question): Question => {
    const originalCorrectOption = q.options[q.correctAnswer];
    const shuffledOptions = shuffle(q.options);
    const newCorrectAnswer = shuffledOptions.indexOf(originalCorrectOption);
    return { ...q, options: shuffledOptions, correctAnswer: newCorrectAnswer };
  };

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
      setIsLoadingTests(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "hosted_tests");
      setIsLoadingTests(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchFirestoreCourses = async () => {
      try {
        const cacheKey = "cbt_courses_cache";
        const cacheTimeKey = "cbt_courses_cache_time";
        const cacheExpiry = 1000 * 60 * 60 * 24; // 24 hours

        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);

        let firestoreCourses: Course[] = [];

        if (cachedData && cachedTime && Date.now() - parseInt(cachedTime) < cacheExpiry) {
          firestoreCourses = JSON.parse(cachedData);
        } else {
          const querySnapshot = await getDocs(collection(db, "courses"));
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            firestoreCourses.push({
              code: doc.id,
              title: data.title || doc.id,
              description: data.description || "Community validated course.",
              questions: data.questions || []
            });
          });

          localStorage.setItem(cacheKey, JSON.stringify(firestoreCourses));
          localStorage.setItem(cacheTimeKey, Date.now().toString());
        }

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
        setIsLoadingCourses(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "courses");
        setIsLoadingCourses(false);
      }
    };

    fetchFirestoreCourses();
  }, [user]);

  useEffect(() => {
    if (timeLeft === null || isFinished) return;

    if (timeLeft === 0) {
      // We don't call submitTest directly here to avoid stale closures.
      // Instead, we let a separate effect handle the submission when timeLeft hits 0.
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  // Separate effect to handle auto-submission with fresh state
  useEffect(() => {
    if (timeLeft === 0 && !isFinished) {
      submitTest();
      toast("Time is up! Your test has been automatically submitted.");
    }
  }, [timeLeft, isFinished, userAnswers, questions]); // Include dependencies to ensure fresh state


  const startTest = async (courseCode: string, hostedTest?: HostedTest) => {
    if (hostedTest) {
      if (hostedTest.maxAttempts) {
        try {
          const q = query(
            collection(db, "test_results"),
            where("testId", "==", hostedTest.id),
            where("userId", "==", user.uid)
          );
          const snapshot = await getDocs(q);
          if (snapshot.size >= hostedTest.maxAttempts) {
            toast(`You have reached the maximum number of attempts (${hostedTest.maxAttempts}) for this test.`);
            return;
          }
        } catch (error) {
          console.error("Error checking test attempts:", error);
        }
      }
      setQuestions(hostedTest.questions);
      setCurrentHostedTestId(hostedTest.id);
      setCurrentHostId(hostedTest.hostId);
      if (hostedTest.duration) {
        setTimeLeft(hostedTest.duration * 60);
      } else {
        setTimeLeft(hostedTest.questions.length * 60);
      }
    } else {
      const course = allCourses.find((c) => c.code === courseCode);
      if (!course) return;
      
      const count = questionLimit;
      const rawQs = [...course.questions].sort(() => 0.5 - Math.random()).slice(0, count);
      const shuffledQs = rawQs.map(q => shuffleQuestion(q));
      setQuestions(shuffledQs);
      setCurrentHostedTestId(null);
      setCurrentHostId(null);
      
      // 20 mins for 40 questions (30s per question)
      // Otherwise 60s per question
      const durationInSeconds = count === 40 ? 20 * 60 : count * 60;
      setTimeLeft(durationInSeconds);
    }
    
    setSelectedCourse(courseCode);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsFinished(false);
    setSelectedOption(null);
    setShowResult(false);
    setStartTime(Date.now());
    setLastQuestionTime(Date.now());
    setNewlyAwardedShana(false);
    setUserAnswers(new Array(hostedTest ? hostedTest.questions.length : questionLimit).fill(null));
    setTimePerQuestion(new Array(hostedTest ? hostedTest.questions.length : questionLimit).fill(0));
    setReviewIndex(null);
  };

  const handleAnswer = (optionIndex: number) => {
    const now = Date.now();
    const timeSpentOnThisQ = Math.floor((now - lastQuestionTime) / 1000);
    
    const newTimePerQ = [...timePerQuestion];
    newTimePerQ[currentQuestionIndex] = (newTimePerQ[currentQuestionIndex] || 0) + timeSpentOnThisQ;
    setTimePerQuestion(newTimePerQ);
    setLastQuestionTime(now);

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setUserAnswers(newAnswers);
    setSelectedOption(optionIndex);
  };

  const nextQuestion = () => {
    const now = Date.now();
    const timeSpentOnThisQ = Math.floor((now - lastQuestionTime) / 1000);
    const newTimePerQ = [...timePerQuestion];
    newTimePerQ[currentQuestionIndex] = (newTimePerQ[currentQuestionIndex] || 0) + timeSpentOnThisQ;
    setTimePerQuestion(newTimePerQ);
    setLastQuestionTime(now);
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  const prevQuestion = () => {
    const now = Date.now();
    const timeSpentOnThisQ = Math.floor((now - lastQuestionTime) / 1000);
    const newTimePerQ = [...timePerQuestion];
    newTimePerQ[currentQuestionIndex] = (newTimePerQ[currentQuestionIndex] || 0) + timeSpentOnThisQ;
    setTimePerQuestion(newTimePerQ);
    setLastQuestionTime(now);
    setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  const submitTest = async () => {
    const now = Date.now();
    const timeSpentOnThisQ = Math.floor((now - lastQuestionTime) / 1000);
    const newTimePerQ = [...timePerQuestion];
    newTimePerQ[currentQuestionIndex] = (newTimePerQ[currentQuestionIndex] || 0) + timeSpentOnThisQ;
    setTimePerQuestion(newTimePerQ);

    let finalScore = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        finalScore++;
      }
    });
    setScore(finalScore);
    setIsFinished(true);
    localStorage.removeItem("nexus_cbt_session");

    if (user) {
      try {
        // Save test result if it's a hosted test
        if (currentHostedTestId) {
          await addDoc(collection(db, "test_results"), {
            testId: currentHostedTestId,
            hostId: currentHostId,
            userId: user.uid,
            userName: user.displayName || "Anonymous",
            score: finalScore,
            totalQuestions: questions.length,
            timestamp: Date.now()
          });
        }

        const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
        const percentage = (finalScore / questions.length) * 100;
        const isHighScore = percentage >= 80;
        const xpEarned = finalScore * 10 + 5;

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const newTotalTime = (userData.cbtTimeSpent || 0) + timeSpentSeconds;
          const newHighScoreCount = (userData.highScoreCount || 0) + (isHighScore ? 1 : 0);
          
          const meetsShanaCondition = newTotalTime >= 3600 && newHighScoreCount >= 3;
          const wasAlreadyShana = userData.isShana || false;
          const isNowShana = wasAlreadyShana || meetsShanaCondition;

          if (!wasAlreadyShana && isNowShana) {
            setNewlyAwardedShana(true);
          }

          if (isHighScore) {
            await addDoc(collection(db, "broadcasts"), {
              message: `🏆 ${user.displayName || 'A student'} just scored ${finalScore}/${questions.length} in ${selectedCourse}!`,
              timestamp: new Date(),
              type: "achievement",
              authorId: user.uid
            });
          }

          await updateDoc(userRef, { 
            xp: increment(xpEarned),
            cbtTimeSpent: newTotalTime,
            highScoreCount: newHighScoreCount,
            isShana: isNowShana
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("courseIndex", index.toString());
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    const sourceIndex = parseInt(e.dataTransfer.getData("courseIndex"));
    if (sourceIndex === targetIndex) return;
    
    const newCourses = [...allCourses];
    const [draggedCourse] = newCourses.splice(sourceIndex, 1);
    newCourses.splice(targetIndex, 0, draggedCourse);
    setAllCourses(newCourses);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
    const percentage = (score / questions.length) * 100;
    let grade = "Poor";
    let gradeColor = "text-red-500";
    if (percentage >= 80) { grade = "Excellent"; gradeColor = "text-emerald-500"; }
    else if (percentage >= 60) { grade = "Good"; gradeColor = "text-blue-500"; }
    else if (percentage >= 50) { grade = "Average"; gradeColor = "text-amber-500"; }
    else if (percentage >= 40) { grade = "Fair"; gradeColor = "text-orange-500"; }

    // Analytics: Topic Breakdown
    const topicStats: { [key: string]: { correct: number, total: number } } = {};
    questions.forEach((q, idx) => {
      const topic = q.topic || "General";
      if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
      topicStats[topic].total++;
      if (userAnswers[idx] === q.correctAnswer) topicStats[topic].correct++;
    });

    const averageTime = timePerQuestion.reduce((a, b) => a + b, 0) / questions.length;

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="glass-panel text-center py-10 rounded-3xl p-10 relative overflow-hidden space-y-6">
          {newlyAwardedShana && (
            <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 font-bold text-sm animate-pulse flex justify-center items-center gap-2">
              <Flame size={16} /> YOU UNLOCKED THE SHANA BADGE! <Flame size={16} />
            </div>
          )}
          <BookOpen size={80} className="mx-auto text-blue-500 drop-shadow-lg mt-4" />
          <h2 className="text-4xl font-bold tracking-tight">Test Completed!</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
              <p className="text-xs text-[var(--foreground)]/50 uppercase font-bold mb-1">Score</p>
              <p className="text-2xl font-bold">{score} / {questions.length}</p>
            </div>
            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
              <p className="text-xs text-[var(--foreground)]/50 uppercase font-bold mb-1">Percentage</p>
              <p className="text-2xl font-bold">{percentage.toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
              <p className="text-xs text-[var(--foreground)]/50 uppercase font-bold mb-1">Avg Time/Q</p>
              <p className="text-2xl font-bold">{averageTime.toFixed(1)}s</p>
            </div>
            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
              <p className="text-xs text-[var(--foreground)]/50 uppercase font-bold mb-1">XP Earned</p>
              <p className="text-2xl font-bold text-amber-500">+{score * 10 + 5}</p>
            </div>
          </div>

          {/* Topic Breakdown */}
          <div className="space-y-4 text-left">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity size={20} className="text-blue-500" /> Topic Performance
            </h3>
            <div className="grid gap-3">
              {Object.entries(topicStats).map(([topic, stats]) => {
                const topicPerc = (stats.correct / stats.total) * 100;
                return (
                  <div key={topic} className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-[var(--border)]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm">{topic}</span>
                      <span className={clsx("text-xs font-black", topicPerc >= 70 ? "text-emerald-500" : topicPerc >= 40 ? "text-amber-500" : "text-red-500")}>
                        {stats.correct}/{stats.total} ({topicPerc.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={clsx("h-full transition-all duration-1000", topicPerc >= 70 ? "bg-emerald-500" : topicPerc >= 40 ? "bg-amber-500" : "bg-red-500")}
                        style={{ width: `${topicPerc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center justify-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" /> Question Summary
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {questions.map((_, idx) => {
                const isCorrect = userAnswers[idx] === questions[idx].correctAnswer;
                return (
                  <button
                    key={idx}
                    onClick={() => setReviewIndex(idx)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all hover:scale-110 ${
                      isCorrect 
                        ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30" 
                        : "bg-red-500/20 text-red-600 border border-red-500/30"
                    } ${reviewIndex === idx ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-black" : ""}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {reviewIndex !== null && (
            <div className="mt-8 text-left glass-panel p-6 rounded-2xl border border-blue-500/20 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-blue-600 dark:text-blue-400">Question {reviewIndex + 1} Review</h4>
                <button onClick={() => setReviewIndex(null)} className="text-[var(--foreground)]/40 hover:text-[var(--foreground)]">
                  <XCircle size={20} />
                </button>
              </div>
              <p className="text-lg mb-6 leading-relaxed">{questions[reviewIndex].question}</p>
              <div className="grid gap-3">
                {questions[reviewIndex].options.map((opt, idx) => {
                  const isCorrect = idx === questions[reviewIndex].correctAnswer;
                  const isUserAnswer = idx === userAnswers[reviewIndex];
                  
                  let statusClass = "bg-black/5 dark:bg-white/5 border-[var(--border)]";
                  if (isCorrect) statusClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold";
                  else if (isUserAnswer) statusClass = "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400 font-bold";

                  return (
                    <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between ${statusClass}`}>
                      <span>{opt}</span>
                      {isCorrect && <CheckCircle2 size={18} className="text-emerald-500" />}
                      {isUserAnswer && !isCorrect && <XCircle size={18} className="text-red-500" />}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex justify-between items-center">
                <span className="text-xs font-bold text-blue-600">Time spent: {timePerQuestion[reviewIndex]}s</span>
                <AITutor 
                  question={questions[reviewIndex].question}
                  options={questions[reviewIndex].options}
                  correctAnswer={questions[reviewIndex].options[questions[reviewIndex].correctAnswer]}
                  isVerified={isVerified}
                  isVisible={true}
                />
              </div>
            </div>
          )}

          <div className="pt-6 flex flex-col md:flex-row gap-4 justify-center">
            <button 
              onClick={() => {
                const text = `I just scored ${score}/${questions.length} (${percentage.toFixed(1)}%) in ${selectedCourse} on Digital Nexus! 🚀 Can you beat my score?`;
                window.dispatchEvent(new CustomEvent("open-share-modal", {
                  detail: {
                    title: "My CBT Result",
                    text: text,
                    url: window.location.origin
                  }
                }));
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Share2 size={20} /> Share Result
            </button>
            <button 
              onClick={() => {
                setSelectedCourse(null);
                setCurrentHostedTestId(null);
                setIsFinished(false);
                setUserAnswers([]);
                setReviewIndex(null);
                setTimeLeft(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              Return to Selection
            </button>
            <button 
              onClick={() => startTest(selectedCourse!)}
              className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--foreground)] px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            >
              Retake Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCourse && questions.length > 0) {
    const q = questions[currentQuestionIndex];
    
    const handleExplain = () => {
      const prompt = `Explain this question and why the correct answer is "${q.options[q.correctAnswer]}":\n\nQuestion: ${q.question}\nOptions: ${q.options.join(", ")}`;
      window.dispatchEvent(new CustomEvent("open-ai-assistant", {
        detail: {
          contextText: questions.map(q => q.question).join("\n"),
          initialPrompt: prompt
        }
      }));
    };

    return (
      <div className="max-w-3xl mx-auto space-y-8 relative">
        <AITutor 
          question={q.question}
          options={q.options}
          correctAnswer={q.options[q.correctAnswer]}
          isVerified={isVerified}
          isVisible={userAnswers[currentQuestionIndex] !== null}
        />
        <div className="flex justify-between items-center glass-panel p-5 rounded-2xl">
          <div className="font-bold text-lg tracking-tight">{selectedCourse}</div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowCalculator(!showCalculator)}
              className={`p-2 rounded-full transition-colors ${showCalculator ? 'bg-cyan-500 text-white' : 'bg-black/5 dark:bg-white/5 text-[var(--foreground)]/60 hover:bg-black/10 dark:hover:bg-white/10'}`}
              title="Toggle Calculator"
            >
              <CalcIcon size={18} />
            </button>
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-ai-assistant"));
              }}
              className="flex items-center gap-2 bg-blue-600/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full font-bold text-xs border border-blue-500/20 hover:bg-blue-600/20 transition-colors"
            >
              <Activity size={14} /> Study Deck
            </button>
            {timeLeft !== null && (
              <div className={`text-sm font-bold px-3 py-1 rounded-full border ${timeLeft < 60 ? 'bg-red-500/10 text-red-600 border-red-500/20 animate-pulse' : 'bg-black/5 dark:bg-white/5 text-[var(--foreground)]/60 border-[var(--border)]'}`}>
                {formatTime(timeLeft)}
              </div>
            )}
            <div className="text-[var(--foreground)]/60 font-medium text-sm bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
        </div>

        {showCalculator && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <Calculator onClose={() => setShowCalculator(false)} />
          </div>
        )}

        <div className="glass-panel p-8 md:p-10 rounded-3xl space-y-8 shadow-sm relative">
          <div className="flex justify-between items-start gap-4">
            <h3 className="text-2xl font-medium leading-relaxed">{q.question}</h3>
            <button 
              onClick={handleExplain}
              className="shrink-0 p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-500/20 transition-colors"
              title="AI Explanation"
            >
              <HelpCircle size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            {q.options.map((opt, idx) => {
              const isSelected = userAnswers[currentQuestionIndex] === idx;
              let btnClass = isSelected 
                ? "bg-blue-600 text-white border-blue-500 shadow-md" 
                : "bg-black/5 dark:bg-white/5 border-[var(--border)] hover:bg-black/10 dark:hover:bg-white/10";

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between ${btnClass}`}
                >
                  <span className="font-medium text-lg">{opt}</span>
                  {isSelected && <CheckCircle2 size={24} className="text-white/80" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center gap-4">
          <button
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex-1 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--foreground)] py-4 rounded-2xl font-bold transition-all disabled:opacity-30"
          >
            Previous
          </button>
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={nextQuestion}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition-all shadow-md"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submitTest}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold transition-all shadow-md"
            >
              Submit Test
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Helmet>
        <title>CBT Engine | Digital Nexus</title>
        <meta name="description" content="Practice exams for GST 111, BUS 101, SOC 101, and AMS 103 on the Digital Nexus CBT Engine." />
        <link rel="canonical" href={`${import.meta.env.NEXT_PUBLIC_BASE_URL || 'https://icepab-nexus.run.app'}/cbt`} />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              "itemListElement": ${JSON.stringify(allCourses.map((course, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Course",
                  "name": course.title,
                  "description": course.description,
                  "provider": {
                    "@type": "Organization",
                    "name": "Digital Nexus",
                    "sameAs": "${import.meta.env.NEXT_PUBLIC_BASE_URL || 'https://icepab-nexus.run.app'}"
                  },
                  "courseCode": course.code
                }
              })))}
            }
          `}
        </script>
      </Helmet>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
            <BookOpen className="text-blue-600 dark:text-blue-500" /> CBT Engine
          </h1>
          <p className="text-[var(--foreground)]/60 mt-2 font-medium">Practice exams for GST 111, BUS 101, SOC 101, and AMS 103.</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowCalculator(!showCalculator)}
            className={`p-3 rounded-xl transition-all border ${showCalculator ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-black/5 dark:bg-white/5 text-[var(--foreground)]/60 border-[var(--border)] hover:bg-black/10 dark:hover:bg-white/10'}`}
            title="Toggle Calculator"
          >
            <CalcIcon size={20} />
          </button>
          {setIsFocusMode && (
            <button 
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border",
                isFocusMode 
                  ? "bg-orange-500 text-white border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)]" 
                  : "bg-black/5 dark:bg-white/5 text-[var(--foreground)]/60 border-[var(--border)] hover:bg-black/10 dark:hover:bg-white/10"
              )}
            >
              <Flame size={18} className={isFocusMode ? "animate-pulse" : ""} />
              {isFocusMode ? "Focus Mode ON" : "Focus Mode"}
            </button>
          )}
          
          {isVerified && !isFocusMode && (
            <button 
              onClick={() => setShowHostModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-md shrink-0"
            >
              <Plus size={20} /> Host a Test
            </button>
          )}
        </div>
      </div>

      {showCalculator && (
        <div className="animate-in slide-in-from-top-4 duration-300">
          <Calculator onClose={() => setShowCalculator(false)} />
        </div>
      )}

      {!isFocusMode && (hostedTests.length > 0 || isLoadingTests) ? (
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="text-red-500" /> Live Hosted Tests
            </h2>
            <input 
              type="text" 
              placeholder="Search hosted tests..." 
              value={searchHostedTestsQuery}
              onChange={(e) => setSearchHostedTestsQuery(e.target.value)}
              className="w-full md:w-64 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>
          
          {isLoadingTests ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="glass-panel p-5 rounded-2xl border border-[var(--border)] animate-pulse">
                  <div className="h-6 bg-black/10 dark:bg-white/10 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-black/5 dark:bg-white/5 rounded w-1/2 mb-4"></div>
                  <div className="h-10 bg-black/5 dark:bg-white/5 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {hostedTests.filter(test => test.title.toLowerCase().includes(searchHostedTestsQuery.toLowerCase()) || test.courseCode.toLowerCase().includes(searchHostedTestsQuery.toLowerCase())).map((test) => (
                <div key={test.id} className="glass-panel p-5 rounded-2xl border border-red-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{test.title}</h3>
                    <span className="text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-1 rounded-md">Live</span>
                  </div>
                  <p className="text-sm text-[var(--foreground)]/60 mb-4">
                    Hosted by <span className="font-semibold text-[var(--foreground)]">{test.hostName}</span> • {test.courseCode} • {test.questions.length} Qs
                    {test.maxAttempts && ` • Max ${test.maxAttempts} attempts`}
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
          )}
        </div>
      ) : null}

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input 
          type="text" 
          placeholder="Search courses..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
        />
        <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl px-4 py-2">
          <label className="text-sm font-bold text-[var(--foreground)]/70 whitespace-nowrap">Questions:</label>
          <select 
            value={questionLimit}
            onChange={(e) => setQuestionLimit(Number(e.target.value))}
            className="bg-transparent font-bold focus:outline-none cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={40}>40</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {isLoadingCourses ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="glass-panel p-8 rounded-3xl animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="h-8 bg-black/10 dark:bg-white/10 rounded w-1/3"></div>
                <div className="h-6 bg-black/10 dark:bg-white/10 rounded w-16"></div>
              </div>
              <div className="h-6 bg-black/5 dark:bg-white/5 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-black/5 dark:bg-white/5 rounded w-full mb-8"></div>
              <div className="h-14 bg-black/5 dark:bg-white/5 rounded w-full"></div>
            </div>
          ))
        ) : (
          allCourses.filter(c => c.code.toLowerCase().includes(searchQuery.toLowerCase()) || c.title.toLowerCase().includes(searchQuery.toLowerCase())).map((course, index) => (
            <div 
              key={course.code} 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragOver={handleDragOver}
              className="glass-panel p-8 rounded-3xl flex flex-col justify-between group hover:border-blue-500/30 transition-colors cursor-move"
            >
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
          ))
        )}
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
