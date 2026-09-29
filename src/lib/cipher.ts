import CryptoJS from 'crypto-js';

// Secret salt for encrypting system keys in Supabase database
const VAULT_SALT = 'AIWebCrafter_Supabase_Secure_Vault_2026';

export function encryptVaultData(data: any): string {
  try {
    const rawString = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(rawString, VAULT_SALT).toString();
  } catch (e) {
    console.error('Encryption failed:', e);
    return '';
  }
}

export function decryptVaultData<T = any>(encryptedString: string): T | null {
  if (!encryptedString) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedString, VAULT_SALT);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) return null;
    try {
      return JSON.parse(decrypted) as T;
    } catch {
      return decrypted as unknown as T;
    }
  } catch (e) {
    console.error('Decryption failed:', e);
    return null;
  }
}
