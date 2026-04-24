import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { getSettings, updateSettings } from "../lib/settings";
import { ShieldCheck, ToggleLeft, ToggleRight, Loader2, AlertTriangle, Settings, Users, BarChart } from "lucide-react";
import { toast } from "../components/Toast";
import UserManagement from "../components/Admin/UserManagement";
import AnalyticsDashboard from "../components/Admin/AnalyticsDashboard";

export default function AdminDashboard({ user, dbUser }: { user: any, dbUser?: any }) {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"features" | "users" | "analytics">("features");

  const isAdmin = dbUser?.email === "banmekeifeoluwa@gmail.com";

  useEffect(() => {
    if (!isAdmin) return;
    getSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, [isAdmin]);

  const toggleFeature = async (key: string) => {
    setToggling(key);
    try {
      const newValue = !settings[key];
      await updateSettings({ [key]: newValue });
      setSettings((prev: any) => ({ ...prev, [key]: newValue }));
      toast(`${key.replace(/([A-Z])/g, ' $1')} ${newValue ? 'Enabled' : 'Disabled'}`);
    } finally {
      setToggling(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <AlertTriangle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Restricted Area</h1>
        <p className="text-[var(--foreground)]/60">Only Administrators can access this.</p>
      </div>
    );
  }

  const features = [
    { key: "isPaymentEnabled", label: "Payment Verification" },
    { key: "isCBTEnabled", label: "CBT Engine" },
    { key: "isVaultEnabled", label: "Resources Vault" },
    { key: "isAITutorEnabled", label: "AI Tutor" },
    { key: "canEveryoneUpload", label: "Public Resource Upload" },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Helmet>
        <title>Admin Dashboard | Nexus</title>
      </Helmet>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-600/10 rounded-2xl">
          <Settings className="text-blue-600" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-[var(--foreground)]/50">Manage the system.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {["features", "users", "analytics"].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === tab ? "bg-blue-600 text-white" : "bg-black/5 dark:bg-white/5"}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "features" && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">System Feature Toggles</h2>
          <p className="text-[var(--foreground)]/50 text-sm">Control the availability of individual platform features.</p>

          <div className="glass-panel p-6 rounded-3xl space-y-4">
            {features.map((feature) => (
              <div key={feature.key} className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)]">
                <span className="font-bold">{feature.label}</span>
                <button
                  onClick={() => toggleFeature(feature.key)}
                  disabled={toggling === feature.key}
                  className={`p-2 rounded-xl transition-all ${settings[feature.key] ? 'text-emerald-500' : 'text-[var(--foreground)]/30'}`}
                >
                  {toggling === feature.key ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : settings[feature.key] ? (
                    <ToggleRight size={32} />
                  ) : (
                    <ToggleLeft size={32} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {activeTab === "users" && (
        <div className="space-y-2">
           <h2 className="text-xl font-bold">User Account Management</h2>
           <p className="text-[var(--foreground)]/50 text-sm">Review user list and update admin status privileges.</p>
           <UserManagement />
        </div>
      )}
      
      {activeTab === "analytics" && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Resource Distribution Analytics</h2>
          <p className="text-[var(--foreground)]/50 text-sm">Visualize the breakdown of resources currently uploaded per course.</p>
          <div className="glass-panel p-6 rounded-3xl">
            <AnalyticsDashboard />
          </div>
        </div>
      )}
    </div>
  );
}
