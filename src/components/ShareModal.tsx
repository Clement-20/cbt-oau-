import React from "react";
import { X, Share2, MessageCircle, Twitter, Facebook, Copy, Check } from "lucide-react";
import { toast } from "./Toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  text?: string;
  url?: string;
}

export default function ShareModal({ isOpen, onClose, title, text, url }: ShareModalProps) {
  const [copied, setCopied] = React.useState(false);
  
  if (!isOpen) return null;

  const shareUrl = url || window.location.origin;
  const shareTitle = title || "Digital Nexus | OAU Digital Hub";
  const shareText = text || "Check out Digital Nexus, the ultimate OAU student super-app! Practice CBT, calculate GPA, and more.";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <MessageCircle size={20} />,
      color: "bg-[#25D366]",
      link: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`
    },
    {
      name: "Twitter",
      icon: <Twitter size={20} />,
      color: "bg-[#1DA1F2]",
      link: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: "Facebook",
      icon: <Facebook size={20} />,
      color: "bg-[#1877F2]",
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    }
  ];

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--background)] border border-[var(--border)] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Share2 size={20} className="text-blue-500" /> Share Nexus
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {shareOptions.map((option) => (
              <a
                key={option.name}
                href={option.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`${option.color} text-white p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                  {option.icon}
                </div>
                <span className="text-xs font-bold opacity-60 group-hover:opacity-100">{option.name}</span>
              </a>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--foreground)]/40 uppercase tracking-widest">Copy Link</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl p-3 text-sm font-mono truncate">
                {shareUrl}
              </div>
              <button
                onClick={handleCopy}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all shadow-md active:scale-95"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full py-4 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <Share2 size={18} /> More Options
            </button>
          )}
        </div>
        
        <div className="p-6 bg-black/5 dark:bg-white/5 text-center">
          <p className="text-xs text-[var(--foreground)]/50 font-medium">
            Help your friends study smarter. Share the Nexus!
          </p>
        </div>
      </div>
    </div>
  );
}
