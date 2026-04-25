import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { BookOpen, Timer, Award } from "lucide-react";
import { subjectQuestions, Question } from "../lib/postUtmeQuestions";

export default function PostUTME() {
  const [examStarted, setExamStarted] = useState(false);
  const [faculty, setFaculty] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [jambScore, setJambScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showCorrections, setShowCorrections] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const faculties = [
    { name: "Science / Technology / Medicine", subjects: ["English", "Mathematics", "Physics", "Chemistry"] },
    { name: "Administration / Social Sciences", subjects: ["English", "Mathematics", "Economics", "Government"] },
    { name: "Arts / Law", subjects: ["English", "Literature", "Government", "CRK"] }
  ];

  const activeQuestions = useMemo(() => {
    if (!faculty || !examStarted) return []; // Only generate pool once exam starts
    const selectedFaculty = faculties.find(f => f.name === faculty);
    if (!selectedFaculty) return [];
    let qs: Question[] = [];
    selectedFaculty.subjects.forEach(subj => {
      // Shuffle the subject pool and take 10
      const shuffled = [...(subjectQuestions[subj] || [])].sort(() => 0.5 - Math.random());
      qs = qs.concat(shuffled.slice(0, 10));
    });
    // Shuffle the final list of 40 questions
    return qs.sort(() => 0.5 - Math.random());
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

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-4 pt-20 pb-24 md:pb-8 text-center space-y-6">
        <h1 className="text-4xl font-black">Result Slip</h1>
        <div className="glass-panel p-8 rounded-3xl space-y-4">
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
          <p className="text-sm opacity-60 mt-4 max-w-md mx-auto">
            Note: OAU admission often uses 50% JAMB (Score / 8), 40% Post-UTME (40 marks), and 10% O’Level. This predictor assumes your 40-question score counts directly.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => { setSubmitted(false); setShowCorrections(false); setExamStarted(false); setAnswers({}); setTimeLeft(60 * 60); setCurrentQuestionIndex(0); }}
            className="bg-black/10 text-[var(--foreground)] px-8 py-4 rounded-2xl font-bold hover:bg-black/20 w-full"
          >
            Retake Mock
          </button>
          <button 
            onClick={() => setShowCorrections(true)}
            className="bg-cyan-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-cyan-700 w-full"
          >
            View Corrections
          </button>
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
            
            return (
              <div key={q.id} className="glass-panel p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center text-sm font-bold opacity-60">
                    <span className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 px-3 py-1 rounded-full">{q.subject}</span>
                    <span className={isCorrect ? 'text-green-500' : 'text-red-500'}>
                      {isCorrect ? 'Correct +1' : 'Wrong 0'}
                    </span>
                </div>
                <h3 className="text-xl font-bold">{idx + 1}. {q.question}</h3>
                <div className="space-y-2">
                  {q.options.map((option, i) => {
                    let className = "w-full text-left p-4 rounded-2xl border-2 transition-all opacity-50 border-transparent bg-black/5";
                    if (i === q.correctAnswer) {
                      className = "w-full text-left p-4 rounded-2xl border-2 border-green-500 bg-green-500/20 font-bold";
                    } else if (i === userAnswer) {
                      className = "w-full text-left p-4 rounded-2xl border-2 border-red-500 bg-red-500/20";
                    }
                    return (
                      <div key={i} className={className}>
                        <span className="inline-block w-8 font-bold opacity-50">{['A', 'B', 'C', 'D'][i]}.</span> 
                        {option}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
