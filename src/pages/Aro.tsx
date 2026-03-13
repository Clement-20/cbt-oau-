import React, { useState, useRef } from "react";
import { Share2, Sparkles, MessageCircle, Download, Quote } from "lucide-react";
import html2canvas from "html2canvas";

const aroTemplates = [
  "Just smashed my CBT on ICEPAB Nexus. 100% accuracy. You're still sleeping? ❄️🧊",
  "My brain is currently operating at 5.0 GPA capacity thanks to ICEPAB Nexus. Catch up! 🚀",
  "They said GST 111 was hard. ICEPAB Nexus made it a breeze. We dominate! 💯",
  "Study time: Max. Distractions: Zero. ICEPAB Nexus is the ultimate cheat code. 🧠⚡",
  "If you're not on ICEPAB Nexus, you're playing academic catch-up. Stay frosty! ❄️",
  "Just validated 50 questions on the Nexus. Call me the Academic Overlord. 👑📚"
];

export default function Aro({ user }: { user: any }) {
  const [aro, setAro] = useState(aroTemplates[0]);
  const [customAro, setCustomAro] = useState("");
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentAro = customAro || aro;

  const generateAro = () => {
    let newAro = aro;
    while (newAro === aro) {
      newAro = aroTemplates[Math.floor(Math.random() * aroTemplates.length)];
    }
    setAro(newAro);
    setCustomAro("");
  };

  const shareToWhatsApp = () => {
    const text = `*ICEPAB Nexus Aro:*\n\n"${currentAro}"\n\nGenerated via OAU Digital Nexus ❄️`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // High resolution
        backgroundColor: null,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `icepab-aro-${Date.now()}.png`;
      link.click();
    } catch (error) {
      console.error("Failed to download image", error);
      alert("Failed to generate image.");
    } finally {
      setDownloading(false);
    }
  };

  if (!user) {
    return <div className="text-center py-20 text-[var(--foreground)]/60 font-medium">Sign in to generate Aro.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
          <Sparkles className="text-purple-500" /> Aro Generator
        </h1>
        <p className="text-[var(--foreground)]/60 mt-2 font-medium">Generate premium shareable hype for your WhatsApp status.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">Select a Template</h2>
            <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
              {aroTemplates.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAro(template);
                    setCustomAro("");
                  }}
                  className={`w-full text-left p-4 rounded-2xl text-sm font-medium transition-all ${
                    aro === template && !customAro
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                >
                  "{template}"
                </button>
              ))}
            </div>
            <button
              onClick={generateAro}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--foreground)] px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <Sparkles size={18} /> Randomize
            </button>
          </div>

          <div className="glass-panel p-6 rounded-3xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">Or Write Your Own</h2>
            <textarea
              value={customAro}
              onChange={(e) => setCustomAro(e.target.value)}
              placeholder="Type your custom Aro here..."
              className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-2xl p-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-32 font-medium"
            />
          </div>
        </div>

        <div className="space-y-6 flex flex-col items-center">
          {/* The Beautiful Card to Download */}
          <div 
            ref={cardRef}
            className="relative aspect-[9/16] w-full max-w-[350px] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col justify-center p-8 text-center"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)",
            }}
          >
            {/* Glassmorphism overlay inside the card */}
            <div className="absolute inset-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex flex-col justify-center p-6 shadow-inner">
              <Quote className="text-white/40 w-12 h-12 mx-auto mb-4" />
              <p className="text-white text-xl md:text-2xl font-bold leading-snug drop-shadow-md" style={{ fontFamily: "'Inter', sans-serif" }}>
                "{currentAro}"
              </p>
              
              <div className="absolute bottom-6 left-0 w-full flex flex-col items-center">
                <div className="w-10 h-1 bg-white/30 rounded-full mb-4"></div>
                <p className="text-white/80 text-xs font-bold tracking-widest uppercase">
                  ICEPAB Nexus
                </p>
                {user && (
                  <p className="text-white/60 text-[10px] mt-1 font-medium">
                    By {user.displayName || "Student"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 w-full max-w-[350px]">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-4 rounded-2xl font-bold transition-all shadow-md hover:scale-105 disabled:opacity-50"
            >
              <Download size={18} /> {downloading ? "Saving..." : "Save Image"}
            </button>
            <button
              onClick={shareToWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-4 rounded-2xl font-bold transition-all shadow-md hover:scale-105"
            >
              <MessageCircle size={18} /> WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
