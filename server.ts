import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import compression from "compression";
import axios from "axios";
import { createProxyMiddleware } from 'http-proxy-middleware';
import { courses } from "./src/lib/questions";
import * as dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  // Health check for Cloud Run
  app.get("/health", (req, res) => res.status(200).send("OK"));

  // Necessary for rate-limiting and session cookies behind Cloud Run's proxy
  app.set("trust proxy", 1);

  const BASE_URL = process.env.VITE_BASE_URL || "https://oau.cbt.icepab.name.ng";

  // Needed to resolve CORS issues with AI Studio Firebase Storage Buckets
  
  app.options('/proxy-storage/*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers') || '*');
    res.sendStatus(200);
  });

  app.use('/proxy-storage', createProxyMiddleware({
    target: 'https://firebasestorage.googleapis.com',
    changeOrigin: true,
    pathRewrite: { '^/proxy-storage': '' },
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('referer');
      },
      proxyRes: (proxyRes) => {
        proxyRes.headers['access-control-allow-origin'] = '*';
        proxyRes.headers['access-control-allow-methods'] = 'GET, PUT, POST, PATCH, DELETE, OPTIONS';
        proxyRes.headers['access-control-allow-headers'] = '*';
        proxyRes.headers['access-control-expose-headers'] = '*';
      }
    }
  }));

  app.use(compression());
  app.use(express.json());

  // In-memory cache for Portal Check to save OAU bandwidth and Vercel execution hours
  let portalCache: { data: any, lastUpdate: number } = { data: null, lastUpdate: 0 };

  // API Route: Portal Check (Real Heartbeat with 5-minute caching)
  app.get("/api/portal-check", async (req, res) => {
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    if (portalCache.data && (now - portalCache.lastUpdate < CACHE_DURATION)) {
      return res.json({
        ...portalCache.data,
        cached: true,
        ttl: Math.round((CACHE_DURATION - (now - portalCache.lastUpdate)) / 1000)
      });
    }

    try {
      const startTime = Date.now();
      // Ping OAU ePortal
      const response = await axios.get("https://eportal.oauife.edu.ng/", { 
        timeout: 8000,
        headers: { 'User-Agent': 'ICEPAB-Nexus-Pulse/1.0' }
      });
      const duration = Date.now() - startTime;

      const fetchedData = {
        status: duration > 4000 ? "SLOW" : "ONLINE",
        timestamp: new Date().toISOString(),
        latency: `${duration}ms`,
        message: duration > 4000 ? "Portal is responding slowly. High traffic detected." : "Portal is stable. Proceed with registration."
      };

      portalCache = { data: fetchedData, lastUpdate: now };
      res.json(fetchedData);
    } catch (error: any) {
      const errorData = {
        status: "OFFLINE",
        timestamp: new Date().toISOString(),
        message: "Portal is currently unreachable. Might be down or under maintenance."
      };
      // Don't cache errors for too long, retry after 1 minute
      portalCache = { data: errorData, lastUpdate: now - (4 * 60 * 1000) };
      res.json(errorData);
    }
  });

  // SEO: robots.txt
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /
Disallow: /admin-dashboard
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
