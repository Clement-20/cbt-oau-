import React from "react";
import { X, BatteryLow, Zap, Trophy } from "lucide-react";

interface NexusEnergyModalProps {
  onClose: () => void;
}

export default function NexusEnergyModal({ onClose }: NexusEnergyModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[var(--background)] border border-amber-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.2)] relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        
        <div className="flex flex-col items-center text-center space-y-6 relative z-10">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center animate-pulse">
            <BatteryLow size={40} className="text-amber-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter">Nexus Energy Depleted 🪫</h2>
            <p className="text-[var(--foreground)]/60 font-medium leading-relaxed">
              Your AI credits will recharge at midnight. The Nexus Core needs time to stabilize.
            </p>
          </div>
          
          <div className="w-full p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3">
            <div className="flex items-center gap-3 text-sm font-bold text-amber-600 dark:text-amber-400">
              <Zap size={16} /> POWER UP
            </div>
            <p className="text-xs text-left opacity-80 leading-relaxed">
              Upgrade to <span className="text-cyan-500 font-bold">Legend</span> status for unlimited AI power, priority extraction, and exclusive study tools.
            </p>
          </div>
          
          <button 
            onClick={() => window.location.href = "/profile"}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Trophy size={20} /> Upgrade to Legend
          </button>
          
          <button 
            onClick={onClose}
            className="text-sm font-bold text-[var(--foreground)]/40 hover:text-[var(--foreground)]/60 transition-colors"
          >
            I'll wait for recharge
          </button>
        </div>
      </div>
    </div>
  );
}
