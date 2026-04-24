import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <Helmet>
        <title>404 | Digital Nexus</title>
      </Helmet>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center w-full max-w-sm"
      >
        <h1 className="text-8xl font-black text-blue-500 mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          404
        </h1>
        <h2 className="text-2xl font-bold mb-2">Lost in the Nexus?</h2>
        <p className="text-slate-400 mb-8 font-medium">
          This page has moved or doesn't exist on the OAU network.
        </p>
        <Link 
          to="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:scale-105"
        >
          Return to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
