import React, { useState, useEffect } from "react";
import { Command } from "cmdk";
import { Search, BookOpen, Calculator, Trophy, ShieldCheck, User, Settings, Info, MessageSquare, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <>
      {/* Mobile trigger button for visibility */}
      <button 
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 md:right-12 z-40 bg-zinc-900 border border-zinc-800 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all md:hidden"
        aria-label="Search Command Palette"
      >
        <Search size={24} />
      </button>

      <Command.Dialog 
        open={open} 
        onOpenChange={setOpen} 
        label="Global Search"
        className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] p-4 bg-black/60 backdrop-blur-sm"
      >
        <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center border-b border-zinc-100 dark:border-zinc-800 px-4">
            <Search className="text-zinc-400 mr-3" size={18} />
            <Command.Input 
              placeholder="Search courses, tools, or pages (e.g. GST 111)..." 
              className="w-full py-4 text-sm bg-transparent outline-none border-none placeholder:text-zinc-500"
            />
            <div className="text-[10px] items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-zinc-500 font-mono hidden sm:flex">
              ESC
            </div>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-12 text-center text-sm text-zinc-500">
              No results found for your search.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 p-2">
              <Item icon={<Home size={16} />} onSelect={() => runCommand(() => navigate("/"))}>Home</Item>
              <Item icon={<BookOpen size={16} />} onSelect={() => runCommand(() => navigate("/cbt"))}>Practice CBT Engine</Item>
              <Item icon={<Calculator size={16} />} onSelect={() => runCommand(() => navigate("/gpa"))}>CGPA Calculator</Item>
              <Item icon={<ShieldCheck size={16} />} onSelect={() => runCommand(() => navigate("/validate"))}>CBT Validator</Item>
              <Item icon={<Trophy size={16} />} onSelect={() => runCommand(() => navigate("/leaderboard"))}>Nexus Leaderboard</Item>
            </Command.Group>

            <Command.Group heading="Resources & Community" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 p-2 mt-2">
              <Item icon={<BookOpen size={16} />} onSelect={() => runCommand(() => navigate("/resources"))}>Resource Vault (PDFs)</Item>
              <Item icon={<MessageSquare size={16} />} onSelect={() => runCommand(() => navigate("/community"))}>Nexus Community</Item>
              <Item icon={<MessageSquare size={16} />} onSelect={() => runCommand(() => navigate("/reviews"))}>Wall of Love (Reviews)</Item>
            </Command.Group>

            <Command.Group heading="Account" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 p-2 mt-2">
              <Item icon={<User size={16} />} onSelect={() => runCommand(() => navigate("/profile"))}>Your Profile</Item>
              <Item icon={<Settings size={16} />} onSelect={() => runCommand(() => navigate("/setup"))}>Profile Setup</Item>
              <Item icon={<Info size={16} />} onSelect={() => runCommand(() => navigate("/about"))}>About ICEPAB</Item>
            </Command.Group>
            
            <Command.Group heading="Popular Courses" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 p-2 mt-2">
              <Item icon={<BookOpen size={16} />} onSelect={() => runCommand(() => navigate("/cbt?q=GST111"))}>GST 111</Item>
              <Item icon={<BookOpen size={16} />} onSelect={() => runCommand(() => navigate("/cbt?q=GST112"))}>GST 112</Item>
              <Item icon={<BookOpen size={16} />} onSelect={() => runCommand(() => navigate("/cbt?q=CHM101"))}>CHM 101</Item>
              <Item icon={<BookOpen size={16} />} onSelect={() => runCommand(() => navigate("/cbt?q=MTH101"))}>MTH 101</Item>
            </Command.Group>
          </Command.List>
        </div>
      </Command.Dialog>
    </>
  );
}

function Item({ children, onSelect, icon }: { children: React.ReactNode; onSelect?: (value: string) => void; icon: React.ReactNode }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800 transition-colors"
    >
      <div className="text-zinc-400">{icon}</div>
      {children}
    </Command.Item>
  );
}
