import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { BookOpen, Timer, Award } from "lucide-react";
import { postUtmeQuestions } from "../lib/postUtmeQuestions";

export default function PostUTME() {
  const [examStarted, setExamStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [jambScore, setJambScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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
    postUtmeQuestions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) s++;
    });
    return s;
  }, [answers]);

  const aggregate = useMemo(() => {
    return (jambScore / 8 + score).toFixed(2);
  }, [jambScore, score]);

  const currentQuestion = postUtmeQuestions[currentQuestionIndex];

  if (!examStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 p-4">
        <Helmet><title>Post-UTME | OAU Engine</title></Helmet>
        <div className="glass-panel p-8 rounded-3xl text-center space-y-4">
          <BookOpen size={48} className="mx-auto text-cyan-500" />
          <h1 className="text-3xl font-black">OAU Post-UTME Simulator</h1>
          <p className="text-[var(--foreground)]/60 font-medium">10 Questions | 60 Minutes</p>
          <button 
            onClick={() => setExamStarted(true)}
            className="bg-cyan-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-cyan-700 w-full"
          >
            Start Real Test
          </button>
        </div>
        
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="font-bold text-xl">Aggregate Calculator</h2>
          <input 
            type="number"
            placeholder="Enter JAMB Score (e.g., 280)"
            onChange={(e) => setJambScore(Number(e.target.value))}
            className="w-full p-4 rounded-2xl bg-black/5"
          />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center space-y-6">
        <h1 className="text-4xl font-black">Result Slip</h1>
        <div className="glass-panel p-8 rounded-3xl text-6xl font-black text-cyan-500">
          {score}/{postUtmeQuestions.length}
        </div>
        <p>Your OAU Aggregate: {aggregate}</p>
        <button className="bg-cyan-600 text-white px-8 py-4 rounded-2xl font-bold">
          Share Result Slip
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-black text-xl">OAU Exam Center</h2>
        <div className={`flex items-center gap-2 font-mono text-xl ${timeLeft < 300 ? 'text-red-500 animate-pulse' : ''}`}>
          <Timer size={20} />
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
      </div>
      
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <div className="flex justify-between items-center text-sm font-bold opacity-60">
            <span>{currentQuestion.subject}</span>
            <span>Question {currentQuestionIndex + 1} of {postUtmeQuestions.length}</span>
        </div>
        <h3 className="text-xl font-bold">{currentQuestion.question}</h3>
        <div className="space-y-3">
          {currentQuestion.options.map((option, i) => (
            <button 
                key={i}
                onClick={() => setAnswers({...answers, [currentQuestion.id]: i})}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${answers[currentQuestion.id] === i ? 'border-cyan-500 bg-cyan-500/10' : 'border-transparent bg-black/5 hover:border-cyan-500/50'}`}
            >
                {option}
            </button>
          ))}
        </div>
        <div className="flex justify-between pt-4">
            <button 
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="px-6 py-3 rounded-xl font-bold bg-black/10 disabled:opacity-30"
            >
                Previous
            </button>
            {currentQuestionIndex < postUtmeQuestions.length - 1 ? (
                <button 
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="px-6 py-3 rounded-xl font-bold bg-cyan-600 text-white"
                >
                    Next
                </button>
            ) : (
                <button 
                    onClick={() => setSubmitted(true)}
                    className="px-6 py-3 rounded-xl font-bold bg-cyan-600 text-white"
                >
                    Submit
                </button>
            )}
        </div>
      </div>
    </div>
  );
}
