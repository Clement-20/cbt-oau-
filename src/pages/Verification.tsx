import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "../components/Toast";
import { Loader2, CreditCard, Copy, Check, ShieldAlert } from "lucide-react";
import { getSettings } from "../lib/settings";

export default function Verification({ user }: { user: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reference, setReference] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then(s => {
      setIsPaymentEnabled(s.isPaymentEnabled);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const copyAccountNumber = () => {
    navigator.clipboard.writeText("9127813092");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!isPaymentEnabled) {
      toast("Payment verification is currently disabled.");
      return;
    }
    if (!reference.trim()) {
      toast("Please enter your payment reference");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "payment_verifications"), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        reference,
        status: "pending",
        timestamp: serverTimestamp()
      });
      toast("Verification request submitted! Admin will verify shortly.");
      setReference("");
    } catch (error) {
      toast("Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!isPaymentEnabled) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <div className="glass-panel p-8 rounded-3xl space-y-4">
          <ShieldAlert className="text-amber-500 mx-auto" size={48} />
          <h1 className="text-2xl font-bold">Verification Disabled</h1>
          <p className="text-[var(--foreground)]/60">
            Payment verification is currently disabled by the admin. Please check back later or contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <Helmet>
        <title>Verify Student | Digital Nexus</title>
      </Helmet>
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="text-blue-500" /> Verify Student
        </h1>
        <p className="text-[var(--foreground)]/60">
          Pay N1,000 to Opay 
          <span className="font-mono font-bold bg-black/10 dark:bg-white/10 px-2 py-1 rounded cursor-pointer flex items-center gap-2 inline-flex" onClick={copyAccountNumber}>
            9127813092 {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </span>
          and enter your payment reference below to get verified.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Payment Reference / Transaction ID"
            className="w-full bg-black/5 dark:bg-black/50 border border-[var(--border)] rounded-xl p-3 text-[var(--foreground)]"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Submit Verification"}
          </button>
        </form>
      </div>
    </div>
  );
}
