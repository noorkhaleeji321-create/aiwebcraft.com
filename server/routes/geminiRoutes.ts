import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { GuardBot } from '../../services/guardBotService.js';
import { getSystemInstruction } from '../store.js';
import { getDecryptedBotKey } from './botRoutes.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { ALL_SUPABASE_GEMINI_TOOLS, executeSupabaseGeminiToolCall } from '../../services/supabaseGeminiIntegration.js';

const router = Router();

// In-memory challenge store for Captcha on AI Advisor
const activeChallenges = new Map<string, number>();

router.get('/api/ai/challenge', (req: Request, res: Response) => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const challengeId = Math.random().toString(36).substring(7);
  const answer = num1 + num2;
  
  activeChallenges.set(challengeId, answer);
  // Auto-expire after 5 minutes
  setTimeout(() => activeChallenges.delete(challengeId), 300000);

  res.json({
    challengeId,
    question: `What is ${num1} + ${num2}?`,
  });
});

// Degraded Mode Offline Rule-Based Advisor (Fallback when AI API / Quota fails)
const getDegradedModeResponse = (message: string): string => {
  const lower = message.toLowerCase();
  if (lower.includes('pay') || lower.includes('payment') || lower.includes('buy') || lower.includes('cmi') || lower.includes('paypal')) {
    return '💳 We provide two official secure payment channels with escrow protection: Domestic Bank/CMI (Credit Cards & Bank Wire) and International PayPal. All transactions include a 48-hour inspection period.';
  }
  if (lower.includes('escrow') || lower.includes('guarantee') || lower.includes('48') || lower.includes('protect')) {
    return '🛡️ [Escrow Protection]: Escrow protects your funds by holding them securely during the 48-hour asset inspection period before releasing payouts to the seller.';
  }
  if (lower.includes('fee') || lower.includes('commission') || lower.includes('pricing')) {
    return '📊 Platform escrow fees are automatically calculated and retained until technical handover is approved by both parties.';
  }
  if (lower.includes('sell') || lower.includes('list') || lower.includes('vendor')) {
    return '🚀 To list your project for sale, head to the Add Project tab, provide verified metrics, proof of domain ownership, and upload secure delivery files for admin audit.';
  }
  return 'Welcome to AIWebCrafter! Explore our verified digital businesses, SaaS products, and digital stores, or purchase securely with full escrow protection.';
};

router.post('/api/gemini/chat', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { history, message, challengeId, challengeAnswer } = req.body;

    // 1. Captcha / Challenge Verification
    if (challengeId && challengeAnswer !== undefined) {
      const expected = activeChallenges.get(challengeId);
      if (expected === undefined || Number(challengeAnswer) !== expected) {
        return res.status(403).json({ error: 'Captcha verification failed. Please solve the security challenge.' });
      }
      activeChallenges.delete(challengeId);
    }
    
    // 2. GuardBot Input Filtering
    const inputCheck = GuardBot.isInputSafe(message);
    if (!inputCheck.safe) {
      return res.status(403).json({ error: inputCheck.reason });
    }

    // Try to load bot key from Supabase first
    let apiKey = await getDecryptedBotKey('concierge-ai');

    if (!apiKey) {
      apiKey = 
        process.env.GEMINI_API_KEY || 
        process.env.VITE_GEMINI_API_KEY || 
        process.env.VITE_PUBLIC_GEMINI_API_KEY || 
        process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
        process.env.PUBLIC_GEMINI_API_KEY || '';
    }

    if (!apiKey || apiKey.trim() === '') {
      console.warn('[AI Advisor] No API key configured. Entering Degraded Mode.');
      return res.json({ text: getDegradedModeResponse(message) + ' (Note: Enter a Gemini API key in AI Sentinel Hub to enable live generative AI)' });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    let rawModel = (process.env.PRIMARY_MODEL || process.env.AI_MODEL || 'gemini-3.6-flash').trim();
    if (rawModel.startsWith('models/')) {
      rawModel = rawModel.replace('models/', '');
    }
    let modelName = (rawModel === 'test' || !rawModel.startsWith('gemini-') || rawModel.includes('2.5')) 
      ? 'gemini-3.6-flash' 
      : rawModel;

    const formattedContents = [
      { role: 'user', parts: [{ text: getSystemInstruction() }] },
      ...(history || []).map((item: any) => ({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const fallbackModels = [
      modelName,
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.7-flash',
      'gemini-3.1-flash-lite',
      'gemini-3-flash-preview',
      'gemini-1.5-flash'
    ].filter((m, idx, self) => m && self.indexOf(m) === idx);

    const sessionUser = req.body.user ? { id: req.body.user.id, email: req.body.user.email, role: req.body.user.role } : undefined;

    let result: any = null;
    let lastError: any = null;

    for (const modelCandidate of fallbackModels) {
      try {
        result = await ai.models.generateContent({
          model: modelCandidate,
          contents: formattedContents,
          config: {
            tools: [{ functionDeclarations: ALL_SUPABASE_GEMINI_TOOLS }]
          }
        });

        // Handle tool calls if returned by Gemini
        if (result && result.functionCalls && result.functionCalls.length > 0) {
          const functionCall = result.functionCalls[0];
          const toolResult = await executeSupabaseGeminiToolCall(
            functionCall.name,
            functionCall.args,
            sessionUser
          );

          // Second round call to Gemini with function output
          const followUpContents = [
            ...formattedContents,
            { role: 'model', parts: [{ functionCall }] },
            {
              role: 'user',
              parts: [{
                functionResponse: {
                  name: functionCall.name,
                  response: toolResult
                }
              }]
            }
          ];

          result = await ai.models.generateContent({
            model: modelCandidate,
            contents: followUpContents
          });
        }

        if (result && result.text) {
          break;
        }
      } catch (modelErr: any) {
        lastError = modelErr;
        const errMsg = modelErr?.message || String(modelErr);
        console.warn(`[Gemini] Model '${modelCandidate}' failed (${errMsg}). Trying next model...`);
        if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('resource_exhausted')) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }

    if (!result || !result.text) {
      const errMsg = lastError?.message || '';
      console.warn(`[AI Advisor] All models failed or quota exhausted (${errMsg}). Engaging Degraded Mode Fallback.`);
      return res.json({ 
        text: getDegradedModeResponse(message) 
      });
    }

    const aiResponse = result.text;

    // 3. GuardBot Output Filtering
    if (!GuardBot.isOutputSafe(aiResponse)) {
      return res.status(500).json({ error: 'AI output blocked for security reasons.' });
    }
    
    res.json({ text: aiResponse });
  } catch (err: any) {
    console.error('Error in /api/gemini/chat (Entering Degraded Mode):', err);
    res.json({ text: getDegradedModeResponse(req.body.message || '') });
  }
});

export default router;
