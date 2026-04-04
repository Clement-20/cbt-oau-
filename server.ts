import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import compression from "compression";
import axios from "axios";
import { courses } from "./src/lib/questions.ts";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { AIClient } from "./src/utils/aiClient.ts";

declare module "compression";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://icepab-nexus.run.app";

  // =============== CYBERSECURITY HEADERS ===============
  // Disable frameguard so GitHub Codespaces embedding is allowed, plus explicit frame-ancestors in CSP
  app.use(helmet({ frameguard: false }));
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://"],
      frameSrc: ["'self'", "https://*.github.dev", "https://*.app.github.dev"],
      frameAncestors: ["'self'", "https://*.github.dev", "https://*.app.github.dev"],
      objectSrc: ["'none'"]
    }
  }));
  app.use(helmet.noSniff());
  app.use(helmet.xssFilter());
  app.use(helmet.referrerPolicy({ policy: "strict-origin-when-cross-origin" }));
  app.disable("x-powered-by");

  // =============== REQUEST VALIDATION & LIMITING ===============
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const submissionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 submissions per hour per IP
    message: { error: "Too many submissions. Please wait before submitting another question." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(compression());
  app.use(express.json({ limit: "10mb" })); // Limit payload size
  app.set("trust proxy", 1);
  app.use(generalLimiter);
  
  // =============== SECURITY: INPUT SANITIZATION ===============
  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .slice(0, 5000) // Max length
      .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove scripts
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .replace(/javascript:/gi, ""); // Remove javascript protocol
  };

  // =============== CORS & SECURITY HEADERS ===============
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_BASE_URL || "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("X-Content-Type-Options", "nosniff");
    // X-Frame-Options withheld; frame control is handled via CSP frame-ancestors.
    // res.header("X-Frame-Options", "DENY");
    res.header("X-XSS-Protection", "1; mode=block");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  // API Route: Submit Structured Question (Manual Entry - No AI)
  // Users input question text, 4 options, and correct answer
  // Questions are immediately added to courses (or created if courseCode doesn't exist)
  app.post("/api/questions/submit", async (req, res) => {
    const { courseCode, question, options, correctAnswer, userId, userEmail, userName } = req.body;

    // Validate all required fields
    if (!courseCode || !question || !Array.isArray(options) || options.length !== 4 || correctAnswer === undefined || !userId) {
      return res.status(400).json({ 
        error: "Missing or invalid fields. Required: courseCode, question, options (array of 4), correctAnswer (0-3), userId, userEmail, userName" 
      });
    }

    // Validate correctAnswer is 0-3
    if (typeof correctAnswer !== 'number' || correctAnswer < 0 || correctAnswer > 3) {
      return res.status(400).json({ error: "correctAnswer must be a number between 0 and 3" });
    }

    // Validate options are strings
    if (!options.every(opt => typeof opt === 'string' && opt.trim().length > 0)) {
      return res.status(400).json({ error: "All options must be non-empty strings" });
    }

    try {
      // Return the question structure - frontend will handle adding to pending_questions
      const structuredQuestion = {
        courseCode: courseCode.toUpperCase(),
        question: question.trim(),
        options: options.map(opt => opt.trim()),
        correctAnswer: typeof correctAnswer === 'number' ? correctAnswer : parseInt(correctAnswer as string),
        userId,
        userEmail,
        userName,
        uploadedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        message: "Question ready for submission. Will be added to pending validation.",
        question: structuredQuestion
      });
    } catch (error: any) {
      console.error("Question structuring error:", error);
      res.status(500).json({ error: "Failed to structure question" });
    }
  });

  // API Route: Health Check (Simple - No AI)
  app.get("/api/health", (req, res) => {
    res.json({
      status: "HEALTHY",
      message: "Server is operational",
      timestamp: new Date().toISOString()
    });
  });

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

  // =============== AI EXPLAIN ENDPOINT (Optimized) ===============
  const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 AI requests per minute per IP
    message: { error: "Too many AI requests. Please wait before trying again." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Initialize AI client once
  const aiClient = new AIClient();

  app.post("/api/ai/explain", aiLimiter, async (req, res) => {
    const { question, options, correctAnswer, correctAnswerText, userId } = req.body;

    // Input validation
    if (!question || !Array.isArray(options) || options.length !== 4 || correctAnswer === undefined) {
      return res.status(400).json({ 
        error: "Invalid input. Required: question, options (array of 4), correctAnswer" 
      });
    }

    // Accept both index and text in request for backward compatibility
    let correctAnswerIndex = Number(correctAnswer);
    if (Number.isNaN(correctAnswerIndex)) {
      correctAnswerIndex = options.findIndex((opt: string) => opt === correctAnswerText || opt === correctAnswer);
    }

    if (!Number.isInteger(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
      return res.status(400).json({ error: "Invalid correct answer index" });
    }

    // Sanitize inputs
    const sanitizedQuestion = sanitizeInput(question).slice(0, 500);
    const sanitizedOptions = options.map(opt => sanitizeInput(opt).slice(0, 200));
    const sanitizedCorrectAnswer = sanitizeInput(sanitizedOptions[correctAnswerIndex] || "");

    try {
      // Create cache key for similar questions
      const cacheKey = `explain_${sanitizedQuestion}_${correctAnswerIndex}_${sanitizedOptions.join('|')}`.slice(0, 200);

      // Optimized AI prompt for educational explanations
      const prompt = `You are an expert educator at Obafemi Awolowo University (OAU). Explain this multiple-choice question clearly and helpfully.

QUESTION: ${sanitizedQuestion}

OPTIONS:
A) ${sanitizedOptions[0]}
B) ${sanitizedOptions[1]}
C) ${sanitizedOptions[2]}
D) ${sanitizedOptions[3]}

CORRECT ANSWER: ${String.fromCharCode(65 + correctAnswerIndex)} (${sanitizedCorrectAnswer})

Provide a clear, concise explanation (2-3 sentences) that:
1. Explains why the correct answer is right
2. Briefly mentions why other options are incorrect
3. Includes relevant OAU context if applicable

Keep it educational and encouraging for students.`;

      // Check if AI is available - but always use fallback when quotas are exceeded
      try {
        const response = await aiClient.generateText({
          message: prompt,
          maxTokens: 300, // Optimized for shorter, focused responses
          temperature: 0.3, // Lower temperature for more consistent educational content
          useCase: "TEXT_GENERATION",
          cacheKey // Enable caching for similar questions
        });

        return res.json({
          text: response.text,
          provider: response.provider,
          model: response.model,
          tokensUsed: response.tokensUsed,
          cached: response.cached || false
        });
      } catch (aiError: any) {
        console.log("[AI] Falling back to template response due to:", aiError.message);
        
        // Fallback response when AI is not available (development mode or quota exceeded)
        const explanationTemplates: { [key: string]: string } = {
          "default": `The correct answer is ${String.fromCharCode(65 + correctAnswerIndex)} (${sanitizedCorrectAnswer}). This is correct because it accurately addresses the question. The other options are incorrect for various reasons. For complete understanding, please consult your course materials or ask your instructor.`
        };

        return res.json({
          text: explanationTemplates["default"],
          provider: "fallback",
          model: "template",
          cached: false,
          note: "AI service at capacity - using template response. Try again later for full AI explanations."
        });
      }

    } catch (error: any) {
      console.error("AI Explain Error:", error);
      res.status(500).json({ 
        error: "AI service temporarily unavailable. Please try again later." 
      });
    }
  });

  // SEO Headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    next();
  });

  // SEO: robots.txt
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(`# Robots.txt for ICEPAB Nexus - OAU Student Platform
# By Clement Ifeoluwa

User-agent: *
Allow: /
Allow: /cbt
Allow: /validate
Allow: /leaderboard
Allow: /community
Allow: /about
Allow: /resources
Allow: /profile
Disallow: /admin-dashboard
Disallow: /icepab-admin
Disallow: /setup
Disallow: *.json$
Disallow: *.pdf$

User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap-courses.xml

# Keywords: Clement Ifeoluwa, ICEPAB, Digital Nexus OAU, OAU eportal, Obafemi Awolowo University`);
  });

  // SEO: Comprehensive Sitemap
  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    
    const staticPages = [
      { path: "", priority: "1.0", changefreq: "weekly" },
      { path: "/cbt", priority: "0.95", changefreq: "daily" },
      { path: "/validate", priority: "0.9", changefreq: "daily" },
      { path: "/leaderboard", priority: "0.8", changefreq: "daily" },
      { path: "/community", priority: "0.85", changefreq: "daily" },
      { path: "/about", priority: "0.6", changefreq: "monthly" },
      { path: "/resources", priority: "0.8", changefreq: "weekly" },
      { path: "/gpa", priority: "0.85", changefreq: "weekly" },
      { path: "/verification", priority: "0.7", changefreq: "monthly" },
      { path: "/profile", priority: "0.6", changefreq: "monthly" }
    ];

    const coursePages = courses.map(course => ({ 
      path: `/cbt?course=${encodeURIComponent(course.code)}`,
      priority: "0.75",
      changefreq: "weekly"
    }));

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${staticPages.map(page => `
  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("")}
  ${coursePages.map(page => `
  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
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
