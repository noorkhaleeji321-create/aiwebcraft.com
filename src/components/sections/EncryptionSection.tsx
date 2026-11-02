import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, RefreshCw, Eye, CheckCircle2, AlertTriangle, FileCode, Copy, Check } from 'lucide-react';
import { encryptData, decryptData, generateRecoveryKey, evaluateSecurityPosture, EncryptedPayload } from '../../services/encryptionService';
import { Language } from '../../locales/translations';

interface EncryptionSectionProps {
  lang: Language;
}

export const EncryptionSection: React.FC<EncryptionSectionProps> = ({ lang }) => {
  const [testPlaintext, setTestPlaintext] = useState('Customer Sensitive Phone: +212 661-234567 | Address: Residence Al Mansour, Casablanca');
  const [passphrase, setPassphrase] = useState('AWC-Master-Key-Secure-2026');
  const [encryptedPayload, setEncryptedPayload] = useState<EncryptedPayload | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Recovery Key State
  const [currentRecoveryKey, setCurrentRecoveryKey] = useState<string>(generateRecoveryKey());
  const [copiedKey, setCopiedKey] = useState(false);

  const securityAudit = evaluateSecurityPosture();

  const handleEncrypt = async () => {
    setIsProcessing(true);
    setErrorNotice(null);
    setDecryptedText(null);
    try {
      const res = await encryptData(testPlaintext, passphrase);
      setEncryptedPayload(res);
    } catch (err: any) {
      setErrorNotice(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedPayload) return;
    setIsProcessing(true);
    setErrorNotice(null);
    try {
      const plain = await decryptData(encryptedPayload, passphrase);
      setDecryptedText(plain);
    } catch (err: any) {
      setErrorNotice(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyRecoveryKey = () => {
    navigator.clipboard.writeText(currentRecoveryKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0B0F19] border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              AES-256-GCM · WEB CRYPTO API
            </span>
            <span className="text-xs text-emerald-400 font-mono">Zero Plaintext Leaks</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Encryption & Security Operations Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hardware-accelerated AES-256-GCM encryption with PBKDF2 key derivation (100,000 rounds) and dedicated recovery key infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-mono font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Security Score: {securityAudit.overallScore}/100</span>
          </div>
        </div>
      </div>

      {/* Security Architecture Posture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Transit */}
        <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
            <span>A. Encryption in Transit</span>
            <span className="text-[10px] text-emerald-400 font-mono">TLS 1.3</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All API calls between your existing e-commerce store and AIWebCrafter are encrypted with TLS 1.3 over HTTPS.
          </p>
        </div>

        {/* At Rest */}
        <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
            <span>B. Encryption at Rest</span>
            <span className="text-[10px] text-purple-300 font-mono">AES-GCM 256</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Protected fields: Customer contact information, home shipping addresses, order items, and admin credentials.
          </p>
        </div>

        {/* Key Separation */}
        <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
            <span>C. Key Separation Policy</span>
            <span className="text-[10px] text-emerald-400 font-mono">Verified</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Encryption keys are never stored alongside encrypted backup archives or transmitted over public networks.
          </p>
        </div>
      </div>

      {/* Interactive Web Crypto Testing Console */}
      <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Live Web Crypto AES-256-GCM Cipher Tool
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">PBKDF2 (100k rounds) + 96-bit IV</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Plaintext Sensitive Data to Encrypt:
            </label>
            <textarea
              rows={3}
              value={testPlaintext}
              onChange={(e) => setTestPlaintext(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Master Encryption Passphrase:
            </label>
            <input
              type="text"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />

            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleEncrypt}
                disabled={isProcessing}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-900/30"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Encrypt (AES-256-GCM)</span>
              </button>

              <button
                onClick={handleDecrypt}
                disabled={!encryptedPayload || isProcessing}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Key className="w-3.5 h-3.5 text-purple-400" />
                <span>Decrypt with Key</span>
              </button>
            </div>
          </div>
        </div>

        {errorNotice && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Encrypted Result Payload */}
        {encryptedPayload && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-purple-300 font-mono text-[11px]">
              <span className="font-bold">Encrypted Payload Result (AES-256-GCM)</span>
              <span>Timestamp: {encryptedPayload.timestamp}</span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Ciphertext (Base64):</span>
                <span className="text-purple-300 break-all bg-slate-900/80 p-2 rounded block border border-slate-800">
                  {encryptedPayload.cipherText}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div>
                  <span className="text-slate-500 block">Initialization Vector (96-bit IV):</span>
                  <span className="text-slate-300">{encryptedPayload.iv}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Salt (128-bit PBKDF2):</span>
                  <span className="text-slate-300">{encryptedPayload.salt}</span>
                </div>
              </div>
            </div>

            {decryptedText && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <span className="text-emerald-400 font-bold block text-[11px] mb-1">
                  Decrypted Verification Output:
                </span>
                <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 font-mono text-xs">
                  {decryptedText}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Emergency Recovery Key Section */}
      <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Emergency Master Recovery Key
            </h3>
          </div>
          <button
            onClick={() => setCurrentRecoveryKey(generateRecoveryKey())}
            className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Generate New Key</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Store this offline on a secure password manager. If you lose your master password, this 256-bit mnemonic key can unlock your encrypted archives.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={currentRecoveryKey}
            className="flex-1 px-3 py-2 bg-slate-950 border border-purple-500/40 rounded-lg text-xs font-mono font-bold text-purple-300 select-all tracking-wider"
          />
          <button
            onClick={copyRecoveryKey}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
