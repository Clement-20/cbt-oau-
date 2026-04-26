import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { BookOpen, Timer, Award, Sparkles, BrainCircuit } from "lucide-react";
import { subjectQuestions, Question } from "../lib/postUtmeQuestions";
import AITutor from "../nexus-features/AITutor";
import { useAcademicStore } from "../lib/academicStore";
import { auth, db } from "../firebase";
import { getDoc, doc } from "firebase/firestore";

export default function PostUTME() {
  const [examStarted, setExamStarted] = useState(false);
  const [faculty, setFaculty] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [jambScore, setJambScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showCorrections, setShowCorrections] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [explainQuestionId, setExplainQuestionId] = useState<number | null>(null);

  const faculties = [
    { name: "Science / Technology / Medicine", subjects: ["English", "Mathematics", "Physics", "Chemistry"] },
    { name: "Administration / Social Sciences", subjects: ["English", "Mathematics", "Economics", "Government"] },
    { name: "Arts / Law", subjects: ["English", "Literature", "Government", "CRK"] }
  ];

  const activeQuestions = useMemo(() => {
    if (!faculty || !examStarted) return []; 
    const selectedFaculty = faculties.find(f => f.name === faculty);
    if (!selectedFaculty) return [];
    
    let qs: Question[] = [];
    selectedFaculty.subjects.forEach(subj => {
      // Get all questions for this subject, shuffle them, and pick 10
      const pool = subjectQuestions[subj] || [];
      const shuffledSubjectPool = [...pool].sort(() => 0.5 - Math.random());
      const selectedForTest = shuffledSubjectPool.slice(0, 10);
      qs = qs.concat(selectedForTest);
    });
    
    // We do NOT shuffle the final 'qs' array anymore, 
    // so questions appear in subject blocks (e.g. all English, then all Math, etc.)
    return qs;
  }, [faculty, examStarted]);

  useEffect(() => {
    if (examStarted && timeLeft > 0 && !submitted) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !submitted) {
      setSubmitted(true);
    }
  }, [examStarted, timeLeft, submitted]);

  const score = useMemo(() => {
    let s = 0;
    activeQuestions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) s++;
    });
    return s;
  }, [answers, activeQuestions]);

  const aggregate = useMemo(() => {
    return (jambScore / 8 + score).toFixed(2);
  }, [jambScore, score]);

  const currentQuestion = activeQuestions[currentQuestionIndex];

  if (!examStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 p-4 pt-20 pb-24 md:pb-8">
        <Helmet><title>Post-UTME | Digital Nexus Engine</title></Helmet>
        <div className="glass-panel p-8 rounded-3xl text-center space-y-6">
          <BookOpen size={48} className="mx-auto text-cyan-500 mb-4" />
          <h1 className="text-3xl font-black">OAU Post-UTME Simulator</h1>
          <p className="text-[var(--foreground)]/60 font-medium">Standard Format: 40 Questions | 60 Minutes</p>
          
          <div className="space-y-4 pt-4">
            <h2 className="font-bold text-lg text-left">Select Your Faculty Route:</h2>
            <div className="grid gap-3">
              {faculties.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setFaculty(f.name)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${faculty === f.name ? 'border-cyan-500 bg-cyan-500/10' : 'border-transparent bg-black/5 hover:border-cyan-500/50'}`}
                >
                  <div className="font-bold">{f.name}</div>
                  <div className="text-sm opacity-60 mt-1">{f.subjects.join(', ')}</div>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setExamStarted(true)}
            disabled={!faculty}
            className="bg-cyan-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-cyan-700 w-full disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            Start Real Test
          </button>
        </div>
        
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="font-bold text-xl">Aggregate Predictor</h2>
          <input 
            type="number"
            placeholder="Enter JAMB Score (e.g., 280)"
            onChange={(e) => setJambScore(Number(e.target.value))}
            className="w-full p-4 rounded-2xl bg-black/5 outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <p className="text-sm opacity-70 mt-2">Required to calculate your final OAU admission aggregate dynamically after the mock test.</p>
        </div>
      </div>
    );
  }

  if (showCorrections) {
    return (
      <div className="max-w-4xl mx-auto p-4 pt-20 pb-24 md:pb-8 space-y-6">
        <div className="flex justify-between items-center bg-black/5 p-4 rounded-2xl">
          <h2 className="font-black text-2xl">Mock Test Corrections</h2>
          <button 
            onClick={() => setShowCorrections(false)}
            className="px-4 py-2 bg-black/10 rounded-xl font-bold hover:bg-black/20"
          >
            Back to Result
          </button>
        </div>
        <div className="space-y-6">
          {activeQuestions.map((q, idx) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;
            const isExplaining = explainQuestionId === q.id;
            
            return (
              <div key={q.id} className="glass-panel p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center text-sm font-bold opacity-60">
                    <span className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 px-3 py-1 rounded-full">{q.subject}</span>
                    <span className={isCorrect ? 'text-green-500' : 'text-red-500'}>
                      {isCorrect ? 'Correct +1' : 'Wrong 0'}
                    </span>
                </div>
                <h3 className="text-xl font-bold">{idx + 1}. {q.question}</h3>
                
                {!isCorrect && (
                   <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-4">
                      {userAnswer === undefined ? (
                         <p className="text-amber-500 font-bold">You skipped this question.</p>
                      ) : (
                         <p className="text-red-500 font-bold line-through">Your Answer: {q.options[userAnswer]}</p>
                      )}
                      <p className="text-green-500 font-bold mt-2 flex items-center gap-2">
                        <Award size={18} /> Correct Answer: {q.options[q.correctAnswer]}
                      </p>
                   </div>
                )}
                
                <div className="space-y-2">
                  {q.options.map((option, i) => {
                    let className = "w-full text-left p-4 rounded-2xl border-2 transition-all border-transparent bg-black/5";
                    if (i === q.correctAnswer) {
                      className = "w-full text-left p-4 rounded-2xl border-2 border-green-500 bg-green-500/20 font-bold text-green-700 dark:text-green-400";
                    } else if (i === userAnswer) {
                      className = "w-full text-left p-4 rounded-2xl border-2 border-red-500 bg-red-500/20 text-red-700 dark:text-red-400 opacity-70";
                    } else {
                      className += " opacity-50";
                    }
                    return (
                      <div key={i} className={className}>
                        <span className="inline-block w-8 font-bold opacity-70">{['A', 'B', 'C', 'D'][i]}.</span> 
                        {option}
                      </div>
                    );
                  })}
                </div>

                {!isCorrect && !isExplaining && (
                  <button 
                    onClick={() => setExplainQuestionId(q.id)}
                    className="mt-4 px-6 py-3 rounded-xl font-bold bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 transition-colors flex items-center gap-2 text-sm"
                  >
                    <BrainCircuit size={18} /> Explain with AI Tutor
                  </button>
                )}

                {isExplaining && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                      <AITutor 
                        question={q.question}
                        options={q.options}
                        correctAnswer={q.options[q.correctAnswer]}
                        isVerified={auth.currentUser?.emailVerified || false}
                        isVisible={true}
                        autoExplain={true}
                      />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (submitted && !showCorrections) {
    const subjectStats: Record<string, { correct: number, total: number }> = {};
    const topicStats: Record<string, { correct: number, total: number }> = {};

    activeQuestions.forEach(q => {
      const isCorrect = answers[q.id] === q.correctAnswer;
      
      if (!subjectStats[q.subject]) subjectStats[q.subject] = { correct: 0, total: 0 };
      subjectStats[q.subject].total++;
      if (isCorrect) subjectStats[q.subject].correct++;

      if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, total: 0 };
      topicStats[q.topic].total++;
      if (isCorrect) topicStats[q.topic].correct++;
    });

    const lowPerformingTopics = Object.entries(topicStats)
      .filter(([_, stats]) => (stats.correct / stats.total) < 0.5)
      .map(([topic]) => topic);

    return (
      <div className="max-w-4xl mx-auto p-4 pt-20 pb-24 md:pb-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black">Result Slip</h1>
          <div className="glass-panel p-8 rounded-3xl space-y-4 max-w-2xl mx-auto">
            <div className="text-6xl font-black text-cyan-500">
              {score}/{activeQuestions.length}
            </div>
            <p className="font-medium text-lg">OAU Post-UTME Raw Score</p>
            <div className="w-full h-px bg-white/10 my-4" />
            <div className="flex justify-between items-center bg-black/10 p-4 rounded-2xl">
                <div>
                    <p className="font-bold text-left opacity-70">JAMB Component</p>
                    <p className="text-2xl font-black text-left">{jambScore > 0 ? (jambScore / 8).toFixed(2) : "0.00"}/50</p>
                </div>
                <div className="text-right">
                    <p className="font-bold opacity-70">Total Aggregate</p>
                    <p className="text-3xl font-black text-green-500">{aggregate}%</p>
                </div>
            </div>
          </div>
        </div>

        {/* Dynamic Study Insights */}
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-cyan-500">
          <h2 className="text-xl font-black mb-3 flex items-center gap-2">
            <Sparkles className="text-cyan-500" /> Nexus Study Advice
          </h2>
          {lowPerformingTopics.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm opacity-80">
                Based on your performance, you should focus more on these topics: 
                <span className="font-bold text-cyan-500 ml-1">
                  {lowPerformingTopics.join(", ")}
                </span>.
              </p>
              <div className="bg-black/20 p-4 rounded-2xl">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Recommended Action</p>
                <button 
                  onClick={() => window.location.href = "/resources"}
                  className="text-sm font-bold text-cyan-400 hover:underline flex items-center gap-2"
                >
                  <BookOpen size={16} /> Visit the Resource Vault to find materials on these topics
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm opacity-80">
              Incredible work! You have a solid grasp of most topics. Keep refining your speed and accuracy by retaking the simulation.
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Award className="text-cyan-500" /> Subject Performance
            </h2>
            <div className="grid gap-4">
              {Object.entries(subjectStats).map(([subj, stats]) => {
                const perc = (stats.correct / stats.total) * 100;
                return (
                  <div key={subj} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex justify-between font-bold">
                      <span>{subj}</span>
                      <span className={perc >= 70 ? 'text-green-500' : perc >= 40 ? 'text-amber-500' : 'text-red-500'}>
                        {stats.correct}/{stats.total} ({perc.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${perc >= 70 ? 'bg-green-500' : perc >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <BookOpen className="text-purple-500" /> Topic Analysis
            </h2>
            <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(topicStats).sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total)).map(([topic, stats]) => {
                const perc = (stats.correct / stats.total) * 100;
                return (
                  <div key={topic} className="bg-black/10 p-3 rounded-xl flex justify-between items-center text-sm">
                    <span className="font-medium opacity-80">{topic}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-black/20 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className={`h-full ${perc >= 70 ? 'bg-green-500' : perc >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${perc}%` }}
                        />
                      </div>
                      <span className={`font-bold min-w-[3rem] text-right ${perc >= 70 ? 'text-green-500' : perc >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                        {perc.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs opacity-50 text-center italic">Topics sorted from lowest to highest accuracy to highlight weak areas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-6">
          <button 
            onClick={() => { setSubmitted(false); setShowCorrections(false); setExamStarted(false); setAnswers({}); setTimeLeft(60 * 60); setCurrentQuestionIndex(0); }}
            className="bg-black/10 text-[var(--foreground)] px-8 py-4 rounded-2xl font-bold hover:bg-black/20 w-full"
          >
            Retake Mock
          </button>
          <button 
            onClick={() => setShowCorrections(true)}
            className="bg-cyan-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-cyan-700 w-full shadow-lg shadow-cyan-500/20"
          >
            View Review & Corrections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pt-20 pb-24 md:pb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-black text-xl">Digital Nexus CBT Engine</h2>
        <div className={`flex items-center gap-2 font-mono text-xl ${timeLeft < 300 ? 'text-red-500 animate-pulse font-bold' : ''}`}>
          <Timer size={22} className={timeLeft < 300 ? 'animate-bounce' : ''} />
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
      </div>
      
      {currentQuestion ? (
        <div className="glass-panel p-8 rounded-3xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-black/10">
              <div 
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / activeQuestions.length) * 100}%` }}
              />
          </div>
          
          <div className="flex justify-between items-center text-sm font-bold opacity-60">
              <span className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 px-3 py-1 rounded-full">{currentQuestion.subject}</span>
              <span>Question {currentQuestionIndex + 1} of {activeQuestions.length}</span>
          </div>
          <h3 className="text-xl font-bold py-4">{currentQuestion.question}</h3>
          <div className="space-y-3">
            {currentQuestion.options.map((option, i) => (
              <button 
                  key={i}
                  onClick={() => setAnswers({...answers, [currentQuestion.id]: i})}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${answers[currentQuestion.id] === i ? 'border-cyan-500 bg-cyan-500/10' : 'border-transparent bg-black/5 hover:border-cyan-500/50'}`}
              >
                  <span className="inline-block w-8 font-bold opacity-50">{['A', 'B', 'C', 'D'][i]}.</span> 
                  {option}
              </button>
            ))}
          </div>
          <div className="flex justify-between pt-8">
              <button 
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="px-6 py-3 rounded-xl font-bold bg-black/10 hover:bg-black/20 disabled:opacity-30 disabled:hover:bg-black/10 transition-colors"
              >
                  Previous
              </button>
              {currentQuestionIndex < activeQuestions.length - 1 ? (
                  <button 
                      onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                      className="px-8 py-3 rounded-xl font-bold bg-cyan-600 text-white hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-500/20"
                  >
                      Next
                  </button>
              ) : (
                  <button 
                      onClick={() => setSubmitted(true)}
                      className="px-8 py-3 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
                  >
                      Submit Mock Test
                  </button>
              )}
          </div>
        </div>
      ) : (
        <div className="text-center p-12">Loading questions...</div>
      )}
    </div>
  );
}
