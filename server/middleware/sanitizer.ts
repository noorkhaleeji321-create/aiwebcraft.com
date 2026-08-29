import { Request, Response, NextFunction } from 'express';

// Recursively sanitize strings, objects, and arrays against XSS, Prototype Pollution, RCE, and Injection
export const sanitizeValue = (value: any): any => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    let sanitized = value;

    // 1. Block Prototype Pollution keys
    if (sanitized === '__proto__' || sanitized === 'constructor' || sanitized === 'prototype') {
      return '';
    }

    // 2. Strip Script tags, HTML inline handlers, and JS URIs (XSS Sanitization)
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[XSS-Blocked]')
      .replace(/javascript:/gi, '[JS-Blocked]')
      .replace(/data:text\/html/gi, '[DataURI-Blocked]')
      .replace(/on\w+\s*=/gi, 'on_event_blocked=') // e.g., onerror=, onload=, onclick=
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '[IFrame-Blocked]')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '[Object-Blocked]')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '[Embed-Blocked]');

    // 3. Neutralize Remote Code Execution (RCE) / System Command Injections
    const rcePatterns = [
      /child_process/gi,
      /fs\.readFileSync/gi,
      /fs\.writeFileSync/gi,
      /process\.env/gi,
      /require\s*\(\s*['"]child_process['"]\s*\)/gi,
      /import\s*\(\s*['"]child_process['"]\s*\)/gi,
      /eval\s*\(/gi,
      /Function\s*\(/gi
    ];
    for (const pattern of rcePatterns) {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, '[RCE-Pattern-Blocked]');
      }
    }

    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (typeof value === 'object') {
    try {
      const cleanObject: Record<string, any> = {};
      const keys = Object.keys(value);
      for (const key of keys) {
        // Prevent Prototype Pollution on object keys
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        cleanObject[key] = sanitizeValue(value[key]);
      }
      return cleanObject;
    } catch {
      return value;
    }
  }

  return value;
};

// Express Middleware for global request sanitization
export const inputSanitizerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req) {
      return next();
    }

    const method = (req.method || '').toUpperCase();

    // 1. Handle req.body - skip or bypass gracefully for GET/HEAD requests or empty bodies
    if (method !== 'GET' && method !== 'HEAD' && req.body && typeof req.body === 'object') {
      try {
        if (Object.keys(req.body).length > 0) {
          req.body = sanitizeValue(req.body);
        }
      } catch (err) {
        console.warn('[Sanitizer] Could not sanitize req.body:', err);
      }
    }

    // 2. Handle req.query - check existence before sanitizing
    if (req.query && typeof req.query === 'object') {
      try {
        if (Object.keys(req.query).length > 0) {
          const sanitizedQuery = sanitizeValue(req.query);
          try {
            req.query = sanitizedQuery;
          } catch {
            Object.assign(req.query, sanitizedQuery);
          }
        }
      } catch (err) {
        console.warn('[Sanitizer] Could not sanitize req.query:', err);
      }
    }

    // 3. Handle req.params - check existence before sanitizing
    if (req.params && typeof req.params === 'object') {
      try {
        if (Object.keys(req.params).length > 0) {
          const sanitizedParams = sanitizeValue(req.params);
          try {
            req.params = sanitizedParams;
          } catch {
            Object.assign(req.params, sanitizedParams);
          }
        }
      } catch (err) {
        console.warn('[Sanitizer] Could not sanitize req.params:', err);
      }
    }

    next();
  } catch (err) {
    console.error('[Sanitizer] Error during input sanitization:', err);
    // Proceed without crashing the request if sanitization fails
    next();
  }
};

