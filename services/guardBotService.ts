
export const GuardBot = {
  // 1. Input Filtering (Prompt Injection prevention & Programmatic Sanitization)
  isInputSafe: (message: string): { safe: boolean; reason?: string; sanitizedText?: string } => {
    if (!message) return { safe: true, sanitizedText: '' };

    // A. Length check (Truncate long texts to 4000 chars to avoid memory-exhaustion / DDoS)
    let cleaned = message;
    if (cleaned.length > 4000) {
      cleaned = cleaned.slice(0, 4000) + '... [Nass Tawil Jiddan - Truncated by GuardBot]';
    }

    // B. Strip Script tags and JS injection URIs
    const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    const javascriptUriRegex = /javascript:/gi;
    const htmlTagRegex = /<[^>]*>/g;

    if (scriptRegex.test(cleaned) || javascriptUriRegex.test(cleaned)) {
      cleaned = cleaned.replace(scriptRegex, '[XSS Blocked]').replace(javascriptUriRegex, '[URI Blocked]');
    }

    // Strip generic HTML tags to block UI deformation
    cleaned = cleaned.replace(htmlTagRegex, (match) => {
      const allowed = ['<b>', '</b>', '<i>', '</i>', '<code>', '</code>', '<strong>', '</strong>'];
      return allowed.includes(match.toLowerCase()) ? match : '';
    });

    // C. Blacklist suspicious domain keywords/phishing grabbers
    const suspiciousKeywords = ['token_grabber', 'cookie_stealer', 'free_nitro', 'bit.ly/malicious'];
    const lower = cleaned.toLowerCase();
    if (suspiciousKeywords.some(kw => lower.includes(kw))) {
      return { safe: false, reason: 'Suspicious keywords/phishing link blocked.' };
    }

    // D. Prompt injection & System override protection
    const forbiddenPatterns = [
      /ignore all previous instructions/i, 
      /disregard previous instructions/i,
      /forget all previous directions/i,
      /system prompt/i, 
      /reveal system/i, 
      /you are no longer/i,
      /bypass safety filters/i,
      /jailbreak/i,
      /تجاهل التعليمات السابقة/i,
      /تجاهل الأوامر السابقة/i,
      /إكشف كود النظام/i
    ];
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(cleaned)) {
        return { safe: false, reason: "Prompt injection / System override attempt blocked.", sanitizedText: cleaned };
      }
    }

    return { safe: true, sanitizedText: cleaned };
  },
  
  // 2. Output Filtering (Info leakage prevention)
  isOutputSafe: (response: string): boolean => {
    const sensitiveData = ["API_KEY", "ADMIN_SECRET", "process.env", "systemInstruction"];
    for (const sensitive of sensitiveData) {
      if (response.includes(sensitive)) return false;
    }
    return true;
  },

  // 3. Bot Detection for Registration
  isRegistrationSafe: (data: { email: string; userAgent: string; ip: string }): boolean => {
    // Simple bot signature check
    const botUserAgents = [/bot/i, /headless/i, /selenium/i];
    if (botUserAgents.some(pattern => pattern.test(data.userAgent))) {
      return false;
    }
    return true;
  },

  // 4. Static Code Analysis & Backdoor Scanner (Malware & Backdoors Prevention)
  scanCodeForMalware: (codeSnippetOrFileName: string, fileContent: string): {
    isSafe: boolean;
    threats: string[];
    riskScore: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendation: string;
  } => {
    const threats: string[] = [];

    // Suspicious shell execution and backdoor commands
    if (/eval\s*\(\s*base64_decode/i.test(fileContent) || /eval\s*\(\s*Buffer\.from/i.test(fileContent)) {
      threats.push('CRITICAL: Obfuscated eval execution (Possible Backdoor / Reverse Shell)');
    }

    if (/exec\s*\(\s*["'`].*?(bash|sh|cmd|powershell)/i.test(fileContent) || /child_process.*?(spawn|exec).*?sh/i.test(fileContent)) {
      threats.push('HIGH: Arbitrary Command Execution / Reverse Shell signature detected');
    }

    if (/curl\s+.*?\|\s*(sh|bash)/i.test(fileContent) || /wget\s+.*?\|\s*(sh|bash)/i.test(fileContent)) {
      threats.push('CRITICAL: Remote Script Execution Pipe (Malicious Downloader)');
    }

    // Credential & Token Theft
    if (/discord\.com\/api\/webhooks/i.test(fileContent) || /telegram\.org\/bot.*\/sendMessage/i.test(fileContent)) {
      if (/process\.env|localStorage|cookie|password|secret/i.test(fileContent)) {
        threats.push('HIGH: Suspicious Exfiltration Endpoint (Discord/Telegram Token Stealer)');
      }
    }

    // Cryptominers & Obfuscated Web Assembly
    if (/coinhive|monero|cryptonight|wasm_miner/i.test(fileContent)) {
      threats.push('HIGH: Cryptocurrency Mining Script detected');
    }

    // Hardcoded Privileged Keys
    if (/sk_live_[0-9a-zA-Z]{24,}/.test(fileContent) || /AIzaSy[0-9a-zA-Z-_]{35}/.test(fileContent)) {
      threats.push('MEDIUM: Hardcoded Live API Keys detected in source files');
    }

    const isSafe = threats.length === 0;
    let riskScore: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (threats.some(t => t.startsWith('CRITICAL'))) riskScore = 'CRITICAL';
    else if (threats.some(t => t.startsWith('HIGH'))) riskScore = 'HIGH';
    else if (threats.some(t => t.startsWith('MEDIUM'))) riskScore = 'MEDIUM';

    return {
      isSafe,
      threats,
      riskScore,
      recommendation: isSafe 
        ? 'Code scan passed. No malicious backdoor patterns detected.'
        : `Code scan failed: Found ${threats.length} threat(s). Manual review required by Admin.`
    };
  },

  // 5. Token Cleanup (Placeholder for Supabase/DB cleanup)
  cleanupExpiredTokens: async () => {
    console.log("[GuardBot] Cleaning up expired auth tokens...");
  }
};

