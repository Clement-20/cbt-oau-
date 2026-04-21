import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { usePaystackPayment } from "react-paystack";
import { toast } from "../components/Toast";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";
import { getSettings } from "../lib/settings";
import { PaymentService } from "../services/PaymentService";

export default function Verification({ user }: { user: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then(s => {
      setIsPaymentEnabled(s.isPaymentEnabled);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const config = PaymentService.getPaystackConfig(
    user?.email || "",
    500, // ₦500 verification fee
    async (reference: any) => {
      setIsSubmitting(true);
      const success = await PaymentService.verifyStudent(user.uid);
      if (success) {
        // Success handled in PaymentService toast
      }
      setIsSubmitting(false);
    },
    () => {
      toast("Transaction cancelled.");
    }
  );

  const initializePayment = usePaystackPayment(config);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <Helmet>
        <title>Student Verification | Digital Nexus</title>
      </Helmet>
      <div className="glass-panel p-8 rounded-3xl space-y-6 text-center">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
          <CreditCard className="text-blue-500" size={32} />
        </div>
        <h1 className="text-3xl font-black tracking-tight">Verified Status</h1>
        <p className="text-[var(--foreground)]/60">
          Get the <span className="text-blue-500 font-bold">Verified Student</span> badge, unlimited CBT attempts, and early access to study materials for a lifetime fee of <span className="font-bold">₦500</span>.
        </p>
        
        <div className="space-y-4 pt-4">
          <button
            onClick={() => {
              // @ts-ignore - initializePayment type can be tricky with different package versions
              initializePayment();
            }}
            disabled={isSubmitting || !isPaymentEnabled}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <ShieldCheck size={20} className="group-hover:scale-110 transition-transform" />
                Pay ₦500 & Verify Now
              </>
            )}
          </button>
          
          <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--foreground)]/40">
            Secure Payment via Paystack
          </p>
        </div>
      </div>
    </div>
  );
}
