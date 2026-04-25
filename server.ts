import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import compression from "compression";
import axios from "axios";
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

  // API Route: Get Questions (Scrubbed of answers)
  app.get("/api/questions/:courseCode", (req, res) => {
    const courseCode = req.params.courseCode;
    const count = parseInt(req.query.count as string) || 40;
    
    // Find course in local or potentially firestore (for this example using local questions.ts)
    // In a real app, you might fetch from Firestore here if it's a community course
    const course = courses.find(c => c.code === courseCode);
    
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Shuffle and pick
    const rawQs = [...course.questions].sort(() => 0.5 - Math.random()).slice(0, count);
    
    // Deeper shuffle of options and scrubbing of answer
    const scrubbedQs = rawQs.map(q => {
      const originalCorrectOption = q.options[q.correctAnswer];
      const shuffledOptions = [...q.options].sort(() => 0.5 - Math.random());
      
      // We DON'T send the answer index.
      // We just send the question and options.
      return {
        id: q.id,
        question: q.question,
        options: shuffledOptions,
        topic: q.topic
      };
    });

    res.json(scrubbedQs);
  });

  // API Route: Grade Quiz
  app.post("/api/grade-quiz", (req, res) => {
    const { courseCode, answers, questions: clientQuestions } = req.body;

    if (!courseCode || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const course = courses.find(c => c.code === courseCode);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    let score = 0;
    const results = clientQuestions.map((clientQ: any, idx: number) => {
      const serverQ = course.questions.find(q => q.id === clientQ.id);
      if (!serverQ) return { correct: false };

      const userAnswerText = clientQ.options[answers[idx]];
      const correctAnswerText = serverQ.options[serverQ.correctAnswer];
      
      const isCorrect = userAnswerText === correctAnswerText;
      if (isCorrect) score++;

      return {
        id: clientQ.id,
        userAnswer: userAnswerText,
        correctAnswer: correctAnswerText,
        isCorrect
      };
    });

    res.json({
      score,
      totalQuestions: clientQuestions.length,
      results
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
