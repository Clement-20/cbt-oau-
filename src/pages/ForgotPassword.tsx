import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "../components/Toast";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      toast(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <Helmet>
        <title>Reset Password | Digital Nexus</title>
      </Helmet>
      
      <div className="glass-panel p-8 rounded-3xl border border-[var(--border)]">
        <h1 className="text-2xl font-black tracking-tighter mb-2">Reset Password</h1>
        <p className="text-[var(--foreground)]/60 mb-8 font-medium">Enter your email address and we'll send you a link to reset your password.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border)] p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Mail size={20} />}
            Send Reset Link
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link to="/" className="text-blue-500 font-bold flex items-center justify-center gap-2 hover:underline">
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
