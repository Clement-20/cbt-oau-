import React, { useState } from "react";
import { X, Delete, Divide, Minus, Plus, Equal } from "lucide-react";

export default function Calculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");

  const handleNumber = (num: string) => {
    setDisplay(prev => prev === "0" ? num : prev + num);
  };

  const handleOperator = (op: string) => {
    setEquation(display + " " + op + " ");
    setDisplay("0");
  };

  const calculate = () => {
    try {
      const result = eval(equation + display);
      setDisplay(String(result));
      setEquation("");
    } catch (e) {
      setDisplay("Error");
    }
  };

  const clear = () => {
    setDisplay("0");
    setEquation("");
  };

  return (
    <div className="fixed bottom-20 right-4 z-[60] w-64 bg-white dark:bg-zinc-900 border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
      <div className="bg-zinc-800 p-4 flex justify-between items-center">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nexus Calc</span>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="bg-black/50 p-4 rounded-2xl text-right">
          <div className="text-xs text-zinc-500 h-4">{equation}</div>
          <div className="text-2xl font-mono font-bold text-cyan-400 truncate">{display}</div>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <button onClick={clear} className="col-span-2 bg-red-500/10 text-red-500 p-3 rounded-xl font-bold hover:bg-red-500/20 transition-colors">AC</button>
          <button onClick={() => setDisplay(prev => prev.slice(0, -1) || "0")} className="bg-zinc-800 text-white p-3 rounded-xl font-bold hover:bg-zinc-700 transition-colors flex justify-center"><Delete size={18} /></button>
          <button onClick={() => handleOperator("/")} className="bg-cyan-600/20 text-cyan-400 p-3 rounded-xl font-bold hover:bg-cyan-600/30 transition-colors flex justify-center"><Divide size={18} /></button>
          
          {[7, 8, 9].map(n => (
            <button key={n} onClick={() => handleNumber(String(n))} className="bg-zinc-800 text-white p-3 rounded-xl font-bold hover:bg-zinc-700 transition-colors">{n}</button>
          ))}
          <button onClick={() => handleOperator("*")} className="bg-cyan-600/20 text-cyan-400 p-3 rounded-xl font-bold hover:bg-cyan-600/30 transition-colors flex justify-center">×</button>
          
          {[4, 5, 6].map(n => (
            <button key={n} onClick={() => handleNumber(String(n))} className="bg-zinc-800 text-white p-3 rounded-xl font-bold hover:bg-zinc-700 transition-colors">{n}</button>
          ))}
          <button onClick={() => handleOperator("-")} className="bg-cyan-600/20 text-cyan-400 p-3 rounded-xl font-bold hover:bg-cyan-600/30 transition-colors flex justify-center"><Minus size={18} /></button>
          
          {[1, 2, 3].map(n => (
            <button key={n} onClick={() => handleNumber(String(n))} className="bg-zinc-800 text-white p-3 rounded-xl font-bold hover:bg-zinc-700 transition-colors">{n}</button>
          ))}
          <button onClick={() => handleOperator("+")} className="bg-cyan-600/20 text-cyan-400 p-3 rounded-xl font-bold hover:bg-cyan-600/30 transition-colors flex justify-center"><Plus size={18} /></button>
          
          <button onClick={() => handleNumber("0")} className="col-span-2 bg-zinc-800 text-white p-3 rounded-xl font-bold hover:bg-zinc-700 transition-colors">0</button>
          <button onClick={() => handleNumber(".")} className="bg-zinc-800 text-white p-3 rounded-xl font-bold hover:bg-zinc-700 transition-colors">.</button>
          <button onClick={calculate} className="bg-cyan-600 text-white p-3 rounded-xl font-bold hover:bg-cyan-500 transition-colors flex justify-center shadow-[0_0_10px_rgba(8,145,178,0.3)]"><Equal size={18} /></button>
        </div>
      </div>
    </div>
  );
}
