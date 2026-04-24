import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, X, Sparkles, BookOpen, MessageSquare, Trash2 } from "lucide-react";

interface Message {
  role: "user" | "model";
  text: string;
}

interface StudyDeckProps {
  user: any;
  onClose: () => void;
  contextText?: string; // Relevant snippets from PDF/Course
  initialPrompt?: string;
}

export default function StudyDeck({ user, onClose, contextText, initialPrompt }: StudyDeckProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Hello! I'm your Nexus Academic Tutor. How can I help you with your studies today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastProcessedPrompt = useRef<string | null>(null);

  useEffect(() => {
    if (initialPrompt && initialPrompt !== lastProcessedPrompt.current) {
      lastProcessedPrompt.current = initialPrompt;
      handleSendMessage(null, initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent | null, directPrompt?: string) => {
    if (e) e.preventDefault();
    const messageToSend = directPrompt || input.trim();
    if (!messageToSend || isLoading) return;

    if (!directPrompt) setInput("");
    const newMessages = [...messages, { role: "user", text: messageToSend }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, contextText })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chat request failed");
      
      setMessages(prev => [...prev, { role: "model", text: data.text }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev, 
        { role: "model", text: "Nexus connection interrupted. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: "model", text: "Chat cleared. How can I help you with your studies today?" }]);
    lastProcessedPrompt.current = null;
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-[var(--background)] border-l border-[var(--border)] shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-blue-600/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Nexus Tutor</h3>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              Online
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={clearChat}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--foreground)]/40 hover:text-red-500"
            title="Clear Chat"
          >
            <Trash2 size={18} />
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user" 
                ? "bg-blue-600 text-white rounded-tr-none shadow-md" 
                : "bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-tl-none"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-black/5 dark:bg-white/5 border border-[var(--border)] p-4 rounded-2xl rounded-tl-none">
              <Loader2 size={18} className="animate-spin text-blue-500" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--border)] bg-black/5 dark:bg-white/5">
        <div className="relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the Nexus Tutor..."
            className="w-full p-4 pr-12 rounded-2xl bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-inner"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-center mt-3 text-[var(--foreground)]/40 font-medium flex items-center justify-center gap-1">
          <Sparkles size={10} /> Powered by Nexus Core AI
        </p>
      </form>

      {/* {showEnergyModal && <NexusEnergyModal onClose={() => setShowEnergyModal(false)} />} */}
    </div>
  );
}
