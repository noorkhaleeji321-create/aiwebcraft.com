import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('[Persistence] Could not create data directory:', e);
  }
}

export function saveJsonFile(filename: string, data: any): void {
  // Local disk persistence disabled to ensure data is strictly stored in cloud database (Supabase)
  // and avoid storing sensitive information or cluttering server disk storage.
  return;
}

export function loadJsonFile(filename: string, fallback: any): any {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(fallback)) {
        return Array.isArray(parsed) ? parsed : fallback;
      }
      return parsed && typeof parsed === 'object' ? { ...fallback, ...parsed } : fallback;
    }
  } catch (e) {
    console.warn(`[Persistence] Failed to load ${filename}:`, e);
  }
  return fallback;
}
