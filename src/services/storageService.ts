import { StoredMediaFile, StorageQuota } from '../types';
import { INITIAL_MEDIA_FILES } from '../db/seedData';
import { calculateSha256 } from './encryptionService';
import { getDatabase, addActivityLog } from '../db/sqliteEngine';

const MEDIA_STORAGE_KEY = 'aiwebcrafter_r2_media_v1';
const QUOTA_STORAGE_KEY = 'aiwebcrafter_r2_quota_v1';

// Permanent Media & SQLite Storage Free Tier Limits
export const FREE_TIER_LIMITS: StorageQuota = {
  d1_rows_read_today: 14200,
  d1_rows_read_limit: 5000000,    // 5 Million rows read / day
  d1_rows_written_today: 1240,
  d1_rows_written_limit: 100000,  // 100,000 rows written / day
  d1_storage_bytes: 4200000,      // ~4.2 MB current
  d1_storage_limit_bytes: 10737418240, // 10 GB
  r2_storage_bytes: 1861550,     // Initial media size
  r2_storage_limit_bytes: 10737418240, // 10 GB
  r2_class_a_ops: 24,            // Writes/uploads
  r2_class_a_limit: 1000000,     // 1 Million Class A ops/month
  r2_class_b_ops: 4820,          // Reads/downloads
  r2_class_b_limit: 10000000     // 10 Million Class B ops/month
};

export function getStoredMediaList(): StoredMediaFile[] {
  const saved = localStorage.getItem(MEDIA_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return INITIAL_MEDIA_FILES;
}

export function saveMediaList(files: StoredMediaFile[]) {
  localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(files));
}

export function getStorageQuota(): StorageQuota {
  const saved = localStorage.getItem(QUOTA_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return FREE_TIER_LIMITS;
}

export function updateStorageQuota(deltaBytes: number, isClassA = true) {
  const current = getStorageQuota();
  current.r2_storage_bytes = Math.max(0, current.r2_storage_bytes + deltaBytes);
  if (isClassA) {
    current.r2_class_a_ops += 1;
    current.d1_rows_written_today += 2;
  } else {
    current.r2_class_b_ops += 1;
    current.d1_rows_read_today += 1;
  }
  localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(current));
  return current;
}

/**
 * Real file upload handler:
 * Reads actual file, calculates SHA-256 hash, extracts dimensions,
 * generates a scaled WebP thumbnail, and saves to simulated R2 bucket.
 */
export async function uploadMediaFile(file: File): Promise<StoredMediaFile> {
  const currentQuota = getStorageQuota();
  if (currentQuota.r2_storage_bytes + file.size > currentQuota.r2_storage_limit_bytes) {
    throw new Error('Media storage limit exceeded! Cannot upload file without risking storage overrun.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file from disk'));
    reader.onload = async () => {
      try {
        const fileDataUrl = reader.result as string;
        const arrayBuffer = await file.arrayBuffer();
        const sha256 = await calculateSha256(new Uint8Array(arrayBuffer));

        // Create HTML Image to get dimensions and create thumbnail
        const img = new Image();
        img.onload = () => {
          const width = img.naturalWidth || 800;
          const height = img.naturalHeight || 600;

          // Canvas for WebP thumbnail
          const canvas = document.createElement('canvas');
          const maxThumb = 300;
          let thumbW = width;
          let thumbH = height;
          if (thumbW > thumbH && thumbW > maxThumb) {
            thumbH = Math.round((thumbH * maxThumb) / thumbW);
            thumbW = maxThumb;
          } else if (thumbH > maxThumb) {
            thumbW = Math.round((thumbW * maxThumb) / thumbH);
            thumbH = maxThumb;
          }

          canvas.width = thumbW;
          canvas.height = thumbH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, thumbW, thumbH);
          }
          const thumbnailUrl = canvas.toDataURL('image/webp', 0.85);

          const newFile: StoredMediaFile = {
            id: `r2_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            filename: file.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
            url: fileDataUrl,
            thumbnail_url: thumbnailUrl,
            mime_type: file.type || 'image/jpeg',
            size_bytes: file.size,
            width,
            height,
            sha256,
            uploaded_at: new Date().toISOString(),
            used_in_product_ids: []
          };

          const list = getStoredMediaList();
          list.unshift(newFile);
          saveMediaList(list);
          updateStorageQuota(file.size, true);

          addActivityLog(
            'MEDIA_UPLOAD',
            'IMAGE',
            newFile.id,
            `Uploaded ${newFile.filename} (${(newFile.size_bytes / 1024).toFixed(1)} KB, ${width}x${height}px) to permanent media storage`
          );

          resolve(newFile);
        };

        img.onerror = () => {
          // If non-image or SVG
          const newFile: StoredMediaFile = {
            id: `r2_${Date.now()}`,
            filename: file.name,
            url: fileDataUrl,
            thumbnail_url: fileDataUrl,
            mime_type: file.type || 'application/octet-stream',
            size_bytes: file.size,
            width: 800,
            height: 600,
            sha256,
            uploaded_at: new Date().toISOString(),
            used_in_product_ids: []
          };

          const list = getStoredMediaList();
          list.unshift(newFile);
          saveMediaList(list);
          updateStorageQuota(file.size, true);
          resolve(newFile);
        };

        img.src = fileDataUrl;
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Safe deletion check:
 * Inspects SQLite database to confirm if any product is using this image.
 * Prevents accidental deletion of assets referenced by published products!
 */
export async function checkMediaUsage(mediaUrl: string): Promise<number[]> {
  try {
    const db = await getDatabase();
    // Check in product_images
    const res = db.exec(`SELECT product_id FROM product_images WHERE image_url = ?`, [mediaUrl]);
    if (res.length > 0 && res[0].values.length > 0) {
      return res[0].values.map(r => Number(r[0]));
    }
  } catch (err) {
    console.error('Failed to check media usage:', err);
  }
  return [];
}

export async function deleteMediaFile(fileId: string, force = false): Promise<{ success: boolean; message: string }> {
  const list = getStoredMediaList();
  const file = list.find(f => f.id === fileId);
  if (!file) {
    return { success: false, message: 'File not found in storage.' };
  }

  const usage = await checkMediaUsage(file.url);
  if (usage.length > 0 && !force) {
    return {
      success: false,
      message: `Safety Lock Active: This image is currently referenced by ${usage.length} product(s) (Product IDs: ${usage.join(', ')}). Removing it would break your live store product pages.`
    };
  }

  const remaining = list.filter(f => f.id !== fileId);
  saveMediaList(remaining);
  updateStorageQuota(-file.size_bytes, false);

  await addActivityLog(
    'MEDIA_DELETE',
    'IMAGE',
    file.id,
    `Deleted image ${file.filename} from media storage. Reclaimed ${(file.size_bytes / 1024).toFixed(1)} KB.`
  );

  return { success: true, message: 'Image deleted successfully.' };
}
