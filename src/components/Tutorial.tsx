import React, { useState, useEffect } from "react";
import { Joyride } from "react-joyride";
import { Step, STATUS } from "react-joyride";

export default function Tutorial({ onClose }: { onClose: () => void }) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Check if it's first visit
    const hasSeenTour = localStorage.getItem("nexus_tour_v1");
    if (!hasSeenTour) {
      setRun(true);
    }
  }, []);

  const steps: Step[] = [
    {
      target: "#nexus-hero",
      content: (
        <div className="space-y-2 text-left">
          <p className="font-bold text-lg">Welcome to Digital Nexus 🚀</p>
          <p className="text-sm opacity-80">The ultimate OAU campus OS. Let's show you around the Great Ife student hub!</p>
        </div>
      ),
      placement: "center",
    },
    {
      target: "#practice-mock-btn",
      content: (
        <div className="space-y-2 text-left">
          <p className="font-bold">Master Your Exams 🎯</p>
          <p className="text-sm opacity-80">Practice real OAU CBT questions for GSTs and Departmental courses here.</p>
        </div>
      ),
    },
    {
      target: "#download-pdf-btn",
      content: (
        <div className="space-y-2 text-left">
          <p className="font-bold">The Study Vault 📚</p>
          <p className="text-sm opacity-80">Download past questions, summaries, and OAU textbooks instantly.</p>
        </div>
      ),
    },
    {
      target: "#upload-pdf-btn",
      content: (
        <div className="space-y-2 text-left">
          <p className="font-bold">Lend a Hand 🤝</p>
          <p className="text-sm opacity-80">Upload your own summaries or past questions to earn XP and Nexus badges.</p>
        </div>
      ),
    },
    {
      target: "body",
      placement: "center",
      content: (
        <div className="space-y-2 text-left">
          <p className="font-bold">Pro Tip: Global Search 🔍</p>
          <p className="text-sm opacity-80">Press <code className="bg-black/5 px-1.5 py-0.5 rounded">Ctrl + K</code> anywhere to find anything on the app instantly.</p>
        </div>
      ),
    },
  ];

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      localStorage.setItem("nexus_tour_v1", "true");
      onClose();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#2563eb",
          zIndex: 1000,
        }
      } as any}
      {...{ showSkipButton: true } as any}
    />
  );
}
