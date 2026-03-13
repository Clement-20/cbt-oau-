import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Portal Check (Heartbeat)
  app.get("/api/portal-check", (req, res) => {
    // Simulate checking the OAU portal status
    const statuses = ["ONLINE", "OFFLINE", "MAINTENANCE", "SLOW"];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    res.json({
      status: randomStatus,
      timestamp: new Date().toISOString(),
      message: randomStatus === "ONLINE" 
        ? "Portal is stable. Proceed with registration." 
        : "Portal is currently experiencing issues. Check back later."
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
