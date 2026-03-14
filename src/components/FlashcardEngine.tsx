import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronLeft, RefreshCw } from "lucide-react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

const defaultCards: Flashcard[] = [
  { id: "1", front: "Res Ipsa Loquitur", back: "The thing speaks for itself (Law)" },
  { id: "2", front: "Habeas Corpus", back: "You shall have the body (Law)" },
  { id: "3", front: "Bonjour", back: "Hello / Good morning (French)" },
  { id: "4", front: "Zeitgeist", back: "Spirit of the times (Arts/History)" }
];

export default function FlashcardEngine() {
  const [cards] = useState<Flashcard[]>(defaultCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-cyan-400">Lexicon Engine</h3>
        <span className="text-sm text-zinc-400">{currentIndex + 1} / {cards.length}</span>
      </div>
      
      <div 
        className="relative h-64 w-full cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentIndex + (isFlipped ? "-back" : "-front")}
            initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 w-full h-full bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-center p-6 text-center shadow-xl backdrop-blur-sm"
          >
            <p className="text-2xl font-medium text-white">
              {isFlipped ? cards[currentIndex].back : cards[currentIndex].front}
            </p>
            <div className="absolute bottom-4 text-xs text-zinc-500 flex items-center gap-1">
              <RefreshCw size={12} /> Tap to flip
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-4 mt-6">
        <button 
          onClick={prevCard}
          aria-label="Previous flashcard"
          className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={nextCard}
          aria-label="Next flashcard"
          className="p-3 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-[0_0_15px_rgba(8,145,178,0.4)]"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
