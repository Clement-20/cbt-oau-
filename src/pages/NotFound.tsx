import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-6xl font-black">404</h1>
      <p className="mt-4 text-xl">Page not found.</p>
      <p className="mt-2 text-sm opacity-70">The page you requested could not be found.</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
      >
        Go to Home
      </Link>
    </div>
  );
}
