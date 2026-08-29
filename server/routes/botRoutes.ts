import { Router, Request, Response } from 'express';
import { authorizeAdmin } from '../middleware/authMiddleware.js';
import { getServerSupabase, encrypt, decrypt } from '../config.js';

const router = Router();

// In-Memory Key Rotation Pool Cache (stores active & fallback rotated keys per botId during runtime)
interface RotatedKeyPool {
  primaryKey: string;
  fallbackKeys: string[];
  lastRotatedAt: string;
}
const keyRotationPools = new Map<string, RotatedKeyPool>();

const extractStringKey = (raw: string | null): string | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (parsed.geminiApiKey) return parsed.geminiApiKey;
      if (parsed.primaryKey) return parsed.primaryKey;
      if (parsed.apiKey) return parsed.apiKey;
      if (parsed.openaiApiKey) return parsed.openaiApiKey;
      if (parsed.groqApiKey) return parsed.groqApiKey;
    }
  } catch {
    // raw string
  }
  return raw;
};

export const getDecryptedBotConfig = async (botId: string): Promise<Record<string, any> | null> => {
  try {
    const db = getServerSupabase();
    if (!db) return null;
    const { data } = await db.from('bot_keys').select('encrypted_key').eq('bot_id', botId).maybeSingle();
    if (!data?.encrypted_key) return null;
    const decrypted = decrypt(data.encrypted_key);
    try {
      const parsed = JSON.parse(decrypted);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      return { apiKey: decrypted };
    }
    return { apiKey: decrypted };
  } catch {
    return null;
  }
};

export const getRawDecryptedBotKey = async (botId: string): Promise<string | null> => {
  try {
    const db = getServerSupabase();
    if (!db) {
      const pool = keyRotationPools.get(botId);
      return pool?.primaryKey || null;
    }

    let { data, error } = await db
      .from('bot_keys')
      .select('encrypted_key, fallback_keys, updated_at')
      .eq('bot_id', botId)
      .maybeSingle();

    if (error && error.message && error.message.includes('fallback_keys')) {
      const fallbackQuery = await db
        .from('bot_keys')
        .select('encrypted_key, updated_at')
        .eq('bot_id', botId)
        .maybeSingle();
      if (!fallbackQuery.error) {
        data = fallbackQuery.data ? { ...fallbackQuery.data, fallback_keys: null } : null;
        error = null;
      }
    }

    if (error) {
      console.warn(`[BotKeys] Supabase query error for ${botId}:`, error.message);
      const pool = keyRotationPools.get(botId);
      return pool?.primaryKey || null;
    }

    if (!data || !data.encrypted_key) return null;

    const decryptedPrimary = decrypt(data.encrypted_key);
    
    // Parse fallback keys if stored
    let fallbacks: string[] = [];
    if (data.fallback_keys) {
      try {
        const rawFallbacks: string[] = typeof data.fallback_keys === 'string' 
          ? JSON.parse(data.fallback_keys) 
          : data.fallback_keys;
        fallbacks = rawFallbacks.map((k) => decrypt(k)).filter(Boolean);
      } catch (e) {
        console.warn(`[BotKeys] Failed to parse fallback keys for ${botId}`);
      }
    }

    // Update in-memory pool cache
    keyRotationPools.set(botId, {
      primaryKey: decryptedPrimary,
      fallbackKeys: fallbacks,
      lastRotatedAt: data.updated_at || new Date().toISOString()
    });

    return decryptedPrimary;
  } catch (err: any) {
    console.warn(`[BotKeys] Could not decrypt key for bot [${botId}]:`, err?.message || err);
    return null;
  }
};

export const getDecryptedBotKey = async (botId: string): Promise<string | null> => {
  const raw = await getRawDecryptedBotKey(botId);
  return extractStringKey(raw);
};

// Mask sensitive key string for display (e.g. "AIzaSy...8xP2")
const maskKey = (key: string): string => {
  if (!key || key.length < 8) return '••••••••';
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
};

// 1. Save or Update Bot Credentials with AES-256 Encryption
router.post('/api/config/agents', authorizeAdmin, async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { botId, apiKey, fallbackKeys } = req.body || {};
    if (!botId) return res.status(400).json({ error: 'Missing botId' });

    const db = getServerSupabase();
    if (!db) {
      return res.status(400).json({ 
        error: 'Supabase database is not connected. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to save keys securely in cloud database.' 
      });
    }

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      const { error } = await db
        .from('bot_keys')
        .delete()
        .eq('bot_id', botId);
      if (error) console.warn('Delete bot key warning:', error.message);
      keyRotationPools.delete(botId);
      return res.status(200).json({ success: true, message: 'Key removed from Supabase and rotation pool cleared.' });
    }

    const encryptedKey = encrypt(apiKey.trim());
    const nowIso = new Date().toISOString();

    let encryptedFallbacks: string[] = [];
    if (Array.isArray(fallbackKeys)) {
      encryptedFallbacks = fallbackKeys.map((k: string) => encrypt(k.trim()));
    }

    const rowData: Record<string, any> = { 
      bot_id: botId, 
      encrypted_key: encryptedKey, 
      fallback_keys: JSON.stringify(encryptedFallbacks),
      updated_at: nowIso 
    };

    let { error } = await db
      .from('bot_keys')
      .upsert([rowData], { onConflict: 'bot_id' });

    if (error && error.message && error.message.includes('fallback_keys')) {
      delete rowData.fallback_keys;
      const retryRes = await db
        .from('bot_keys')
        .upsert([rowData], { onConflict: 'bot_id' });
      error = retryRes.error;
    }
    
    if (error) {
      console.error('[BotKeys Save Error]:', error);
      const isMissingTable = error.code === '42P01' || (error.message && error.message.includes('does not exist'));
      const isRlsError = error.code === '42501' || (error.message && error.message.includes('permission denied'));
      let userFriendlyMsg = error.message || 'Supabase save error';
      if (isMissingTable) {
        userFriendlyMsg = 'The bot_keys table does not exist in Supabase. Please run the SQL schema migration first.';
      } else if (isRlsError) {
        userFriendlyMsg = 'Permission denied (RLS). Please ensure service role key is used or disable RLS for bot_keys.';
      }
      return res.status(400).json({ error: userFriendlyMsg, details: error });
    }

    // Cache in rotation pool
    keyRotationPools.set(botId, {
      primaryKey: apiKey.trim(),
      fallbackKeys: Array.isArray(fallbackKeys) ? fallbackKeys : [],
      lastRotatedAt: nowIso
    });

    console.log(`[KeyRotation] API Key successfully encrypted and stored in Supabase for agent: ${botId}`);

    return res.status(200).json({ 
      success: true, 
      message: 'Key encrypted (AES-256) and saved to Supabase successfully.',
      botId,
      maskedKey: maskKey(apiKey.trim()),
      rotatedAt: nowIso
    });
  } catch (err: any) {
    console.error('Error saving bot key:', err);
    return res.status(400).json({ error: err.message || 'Failed to save key' });
  }
});

// 2. Rotate API Key Endpoint (Instant Key Rotation)
router.post('/api/config/agents/rotate', authorizeAdmin, async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { botId, newApiKey } = req.body || {};
    if (!botId || !newApiKey) {
      return res.status(400).json({ error: 'Missing botId or newApiKey for rotation' });
    }

    const db = getServerSupabase();
    if (!db) {
      return res.status(400).json({ error: 'Supabase instance unavailable for cloud storage.' });
    }

    // Fetch existing primary key to push to fallback array
    const oldKey = await getDecryptedBotKey(botId);
    const existingPool = keyRotationPools.get(botId);
    
    let updatedFallbacks = existingPool?.fallbackKeys || [];
    if (oldKey && !updatedFallbacks.includes(oldKey)) {
      updatedFallbacks.unshift(oldKey); // Add old key to fallbacks
      updatedFallbacks = updatedFallbacks.slice(0, 3); // Keep last 3 rotated fallbacks
    }

    const encryptedNewKey = encrypt(newApiKey.trim());
    const encryptedFallbacks = updatedFallbacks.map((k) => encrypt(k));
    const nowIso = new Date().toISOString();

    const rotateRow: Record<string, any> = { 
      bot_id: botId, 
      encrypted_key: encryptedNewKey, 
      fallback_keys: JSON.stringify(encryptedFallbacks),
      updated_at: nowIso 
    };

    let { error } = await db
      .from('bot_keys')
      .upsert([rotateRow], { onConflict: 'bot_id' });

    if (error && error.message && error.message.includes('fallback_keys')) {
      delete rotateRow.fallback_keys;
      const retryRes = await db
        .from('bot_keys')
        .upsert([rotateRow], { onConflict: 'bot_id' });
      error = retryRes.error;
    }

    if (error) {
      return res.status(400).json({ error: `Rotation failed: ${error.message}` });
    }

    // Update pool
    keyRotationPools.set(botId, {
      primaryKey: newApiKey.trim(),
      fallbackKeys: updatedFallbacks,
      lastRotatedAt: nowIso
    });

    console.log(`[KeyRotation] API Key successfully rotated for bot: ${botId}`);

    return res.status(200).json({
      success: true,
      message: `API Key for bot [${botId}] rotated and updated successfully in Supabase.`,
      botId,
      newMaskedKey: maskKey(newApiKey.trim()),
      rotatedAt: nowIso,
      fallbackCount: updatedFallbacks.length
    });
  } catch (err: any) {
    console.error('Error rotating bot key:', err);
    return res.status(500).json({ error: err.message || 'Key rotation failed.' });
  }
});

// 3. Get Bot Configuration & Rotation Status
router.get('/api/config/agents/:botId', authorizeAdmin, async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const rawBotId = req.params.botId;
    const botId = Array.isArray(rawBotId) ? rawBotId[0] : rawBotId;
    if (!botId) {
      return res.status(400).json({ error: 'Missing botId' });
    }

    const rawKey = await getRawDecryptedBotKey(botId);
    if (!rawKey) {
      return res.status(200).json({ success: true, hasKey: false });
    }

    const stringKey = extractStringKey(rawKey) || rawKey;
    const pool = keyRotationPools.get(botId);

    if (req.query.decrypt === 'true') {
      return res.status(200).json({ 
        success: true, 
        hasKey: true, 
        apiKey: rawKey,
        maskedKey: maskKey(stringKey),
        lastRotatedAt: pool?.lastRotatedAt
      });
    }

    return res.status(200).json({ 
      success: true, 
      hasKey: true, 
      maskedKey: maskKey(stringKey),
      lastRotatedAt: pool?.lastRotatedAt,
      hasFallbacks: (pool?.fallbackKeys?.length || 0) > 0
    });
  } catch (err: any) {
    console.error('Error retrieving bot key:', err);
    return res.status(200).json({ success: true, hasKey: false });
  }
});

// 4. Delete Bot Key
router.delete('/api/config/agents/:botId', authorizeAdmin, async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const rawBotId = req.params.botId;
    const botId = Array.isArray(rawBotId) ? rawBotId[0] : rawBotId;
    if (!botId) {
      return res.status(400).json({ error: 'Missing botId' });
    }

    const db = getServerSupabase();
    if (!db) {
      return res.status(400).json({ error: 'Supabase database is not connected.' });
    }

    const { error } = await db
      .from('bot_keys')
      .delete()
      .eq('bot_id', botId);
      
    if (error) {
      console.error('[BotKeys Delete Error]:', error);
      return res.status(400).json({ error: error.message || 'Failed to delete key' });
    }

    keyRotationPools.delete(botId);

    return res.status(200).json({ success: true, message: 'Key removed from Supabase and rotation pool cleared.' });
  } catch (err: any) {
    console.error('Error deleting bot key:', err);
    return res.status(400).json({ error: err.message || 'Failed to delete key' });
  }
});

export default router;

