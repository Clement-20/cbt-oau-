export default function NexusLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 10L90 30V70L50 90L10 70V30L50 10Z" stroke="#3B82F6" strokeWidth="4" strokeLinejoin="round"/>
      <circle cx="50" cy="50" r="10" fill="#3B82F6" className="animate-pulse"/>
      <path d="M30 40L50 60L70 40" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );
}
