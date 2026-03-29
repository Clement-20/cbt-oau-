import React from "react";
import { Bot } from "lucide-react";
import { motion } from "motion/react";

export default function FloatingAI() {
  return (
    <motion.button
      drag
      dragConstraints={{ 
        left: -window.innerWidth + 80, 
        right: 0, 
        top: -window.innerHeight + 80, 
        bottom: 0 
      }}
      dragElastic={0.1}
      dragMomentum={false}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        // Trigger AI assistant
        window.dispatchEvent(new CustomEvent("open-ai-assistant"));
      }}
      className="fixed bottom-6 right-6 z-[100] bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all cursor-grab active:cursor-grabbing"
      aria-label="Open AI Assistant"
    >
      <Bot size={24} />
    </motion.button>
  );
}
