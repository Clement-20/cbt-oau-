import React from "react";
import { Bot } from "lucide-react";

export default function FloatingAI() {
  return (
    <button
      onClick={() => {
        // Trigger AI assistant
        window.dispatchEvent(new CustomEvent("open-ai-assistant"));
      }}
      className="fixed bottom-6 right-6 z-[100] bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110"
      aria-label="Open AI Assistant"
    >
      <Bot size={24} />
    </button>
  );
}
