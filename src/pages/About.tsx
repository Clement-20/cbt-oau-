import React from "react";
import { Helmet } from "react-helmet-async";
import { MessageCircle, Github, Twitter, Globe, Shield, Zap, Users, Heart } from "lucide-react";

export default function About() {
  const developers = [
    {
      name: "Clement IfeOluwa ❄️🧊",
      role: "Lead Developer",
      phone: "+2349127813092",
      whatsapp: "https://wa.me/2349127813092",
      description: "Visionary behind ICEPAB Digital Nexus, focused on bridging the gap between traditional learning and digital efficiency."
    },
    {
      name: "Nova xit",
      role: "Co-developer",
      phone: "+234 805 166 0552",
      whatsapp: "https://wa.me/2348051660552",
      description: "Expert in system optimization and UI/UX design, ensuring a seamless experience for every student."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      <Helmet>
        <title>About Us | ICEPAB Digital Nexus</title>
      </Helmet>

      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tighter">About Digital Nexus</h1>
        <p className="text-xl text-[var(--foreground)]/60 max-w-2xl mx-auto">
          Empowering students through AI-driven education, collaborative resources, and modern examination tools.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl space-y-3 border-blue-500/20">
          <Zap className="text-blue-500" size={32} />
          <h3 className="text-xl font-bold">Fast & Efficient</h3>
          <p className="text-sm text-[var(--foreground)]/60">AI-powered question extraction and validation in seconds.</p>
        </div>
        <div className="glass-panel p-6 rounded-3xl space-y-3 border-emerald-500/20">
          <Users className="text-emerald-500" size={32} />
          <h3 className="text-xl font-bold">Community Driven</h3>
          <p className="text-sm text-[var(--foreground)]/60">Built by students, for students. Sharing knowledge globally.</p>
        </div>
        <div className="glass-panel p-6 rounded-3xl space-y-3 border-purple-500/20">
          <Shield className="text-purple-500" size={32} />
          <h3 className="text-xl font-bold">Verified Quality</h3>
          <p className="text-sm text-[var(--foreground)]/60">Every resource is vetted by our community and AI systems.</p>
        </div>
      </div>

      <div className="space-y-8">
        <h2 className="text-3xl font-bold tracking-tight text-center">Meet the Team</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {developers.map((dev, idx) => (
            <div key={idx} className="glass-panel p-8 rounded-3xl space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
              <div>
                <h3 className="text-2xl font-bold">{dev.name}</h3>
                <p className="text-blue-500 font-bold text-sm uppercase tracking-widest">{dev.role}</p>
              </div>
              <p className="text-[var(--foreground)]/70 leading-relaxed">{dev.description}</p>
              <div className="pt-4">
                <a 
                  href={dev.whatsapp} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg hover:scale-105"
                >
                  <MessageCircle size={20} /> Message on WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-10 rounded-3xl text-center space-y-6">
        <Heart className="mx-auto text-red-500 animate-pulse" size={48} />
        <h2 className="text-3xl font-bold">Our Mission</h2>
        <p className="text-lg text-[var(--foreground)]/70 max-w-2xl mx-auto leading-relaxed">
          ICEPAB Digital Nexus was created to revolutionize how students prepare for exams. By leveraging AI and community collaboration, we provide a platform where learning is interactive, accessible, and highly effective.
        </p>
      </div>

      <footer className="text-center py-8 border-t border-[var(--border)] space-y-4">
        <p className="text-[var(--foreground)]/60 font-medium">
          Copyright ©️ Clement IfeOluwa ❄️🧊 {new Date().getFullYear()}
        </p>
        <div className="flex justify-center gap-6">
          <button className="text-[var(--foreground)]/40 hover:text-blue-500 transition-colors"><Twitter size={20} /></button>
          <button className="text-[var(--foreground)]/40 hover:text-blue-500 transition-colors"><Github size={20} /></button>
          <button className="text-[var(--foreground)]/40 hover:text-blue-500 transition-colors"><Globe size={20} /></button>
        </div>
      </footer>
    </div>
  );
}
