import React from "react";
import { BookOpen } from "lucide-react";

export default function LoadingLogo() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
        <div className="relative bg-white/10 dark:bg-black/20 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-2xl animate-bounce">
          <BookOpen size={48} className="text-blue-500" />
        </div>
      </div>
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-bold tracking-tighter animate-pulse">ICEPAB Digital Nexus</h2>
        <div className="flex gap-1 mt-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}
