import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Star, Calculator, User, Zap } from "lucide-react";
import { motion } from "motion/react";
import { clsx } from "clsx";

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/cbt", label: "CBT", icon: Zap },
    { path: "/study-mode", label: "Study", icon: BookOpen },
    { path: "/resources", label: "Resources", icon: Star },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-[var(--background)]/80 backdrop-blur-2xl border-t border-[var(--border)] px-4 pb-safe pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-1 py-2 px-3 group"
            >
              <div className={clsx(
                "p-2 rounded-2xl transition-all duration-300 relative",
                isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110 border-2 border-amber-400" : "text-[var(--foreground)]/40 hover:text-blue-500 hover:bg-blue-500/10"
              )}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 bg-blue-600 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                  />
                )}
              </div>
              <span className={clsx(
                "text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                isActive ? "text-blue-600 opacity-100" : "text-[var(--foreground)]/30 opacity-0 group-hover:opacity-100"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
