import axios from "axios";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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

    res.status(200).json({
      status,
      timestamp: new Date().toISOString(),
      latency: `${duration}ms`,
      message
    });
  } catch (error: any) {
    res.status(200).json({
      status: "OFFLINE",
      timestamp: new Date().toISOString(),
      message: "Portal is currently unreachable. Might be down or under maintenance."
    });
  }
}
