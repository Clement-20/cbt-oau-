import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import compression from "compression";
import axios from "axios";
import { courses } from "./src/lib/questions";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://icepab-nexus.run.app";

  app.use(compression());
  app.use(express.json());

  // API Route: Portal Check (Real Heartbeat)
  app.get("/api/portal-check", async (req, res) => {
    try {
      const startTime = Date.now();
      // Ping OAU ePortal
      const response = await axios.get("https://eportal.oauife.edu.ng/", { 
        timeout: 8000,
        headers: { 'User-Agent': 'ICEPAB-Nexus-Pulse/1.0' }
      });
      const duration = Date.now() - startTime;

      let status = "ONLINE";
      let message = "Portal is stable. Proceed with registration.";

      if (duration > 4000) {
        status = "SLOW";
        message = "Portal is responding slowly. High traffic detected.";
      }

      res.json({
        status,
        timestamp: new Date().toISOString(),
        latency: `${duration}ms`,
        message
      });
    } catch (error: any) {
      res.json({
        status: "OFFLINE",
        timestamp: new Date().toISOString(),
        message: "Portal is currently unreachable. Might be down or under maintenance."
      });
    }
  });

  // SEO: robots.txt
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /
Disallow: /icepab-admin
Sitemap: ${BASE_URL}/sitemap.xml`);
  });

  // SEO: sitemap.xml
  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    
    const staticPages = [
      "",
      "/cbt",
      "/validate",
      "/leaderboard",
      "/community",
      "/about"
    ];

    const coursePages = courses.map(course => `/cbt?course=${encodeURIComponent(course.code)}`);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${BASE_URL}${page}</loc>
    <priority>${page === "" ? "1.0" : "0.8"}</priority>
  </url>`).join("")}
  ${coursePages.map(page => `
  <url>
    <loc>${BASE_URL}${page}</loc>
    <priority>0.7</priority>
  </url>`).join("")}
</urlset>`;

    res.send(sitemap);
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
    // Cache static assets for 1 year, but not index.html
    app.use(express.static(distPath, {
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get("*", (req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
