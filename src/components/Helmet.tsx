import React, { useEffect } from "react";

export const Helmet = ({ children }: { children?: React.ReactNode }) => {
  useEffect(() => {
    // Basic title extraction from Helmet structure if possible, 
    // but for now just setting a default.
    document.title = "Digital Nexus";
  }, []);
  return null;
};

export const HelmetProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
