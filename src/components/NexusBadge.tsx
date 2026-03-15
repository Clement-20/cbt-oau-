import { Flame } from "lucide-react";

interface NexusBadgeProps {
  isVerified?: boolean;
  badgeType?: string;
  isShana?: boolean;
  badges?: string[];
  className?: string;
}

export default function NexusBadge({ isVerified, badgeType, isShana, badges = [], className = "" }: NexusBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {badges.includes("Consistency") && (
        <div className="relative group inline-flex items-center justify-center">
          <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.6)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" className="w-2.5 h-2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Consistency (5+ Day Streak)
          </div>
        </div>
      )}
      {isVerified && (
        badgeType === 'legend' ? (
          <div className="relative group inline-flex items-center justify-center">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              Verified OAU Legend
            </div>
          </div>
        ) : (
          <div className="relative group inline-flex items-center justify-center">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-4 h-4 text-blue-500"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Verified Student
            </div>
          </div>
        )
      )}
      
      {isShana && (
        <div className="relative group inline-flex items-center justify-center">
          <Flame size={16} className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-orange-500/30 text-orange-400 text-[10px] font-bold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
            Shana (Top Scholar)
          </div>
        </div>
      )}
    </div>
  );
}
