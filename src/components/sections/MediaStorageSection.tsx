import React, { useState } from 'react';
import { Upload, HardDrive, Image as ImageIcon, Trash2, Copy, Check, ShieldAlert, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { StoredMediaFile, StorageQuota } from '../../types';
import { uploadMediaFile, deleteMediaFile, checkMediaUsage } from '../../services/storageService';
import { Language } from '../../locales/translations';

interface MediaStorageSectionProps {
  mediaFiles: StoredMediaFile[];
  quota: StorageQuota;
  lang: Language;
  onRefresh: () => void;
}

export const MediaStorageSection: React.FC<MediaStorageSectionProps> = ({
  mediaFiles,
  quota,
  lang,
  onRefresh
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<StoredMediaFile | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    setActionNotice(null);

    try {
      for (let i = 0; i < files.length; i++) {
        await uploadMediaFile(files[i]);
      }
      setActionNotice(`Successfully uploaded ${files.length} image(s) to permanent media storage with WebP thumbnails.`);
      onRefresh();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleCopyUrl = (file: StoredMediaFile) => {
    navigator.clipboard.writeText(file.url);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (file: StoredMediaFile) => {
    setActionNotice(null);
    setUploadError(null);

    // Check usage first
    const usedIn = await checkMediaUsage(file.url);
    if (usedIn.length > 0) {
      const confirmForce = confirm(
        `Safety Warning: This image is currently referenced by Product ID(s): [${usedIn.join(', ')}].\n\nDeleting it may cause broken images on your external store. Are you sure you want to proceed?`
      );
      if (!confirmForce) return;
    }

    const res = await deleteMediaFile(file.id, true);
    if (res.success) {
      setActionNotice(res.message);
      if (selectedFile?.id === file.id) setSelectedFile(null);
      onRefresh();
    } else {
      setUploadError(res.message);
    }
  };

  const storageUsedMb = (quota.r2_storage_bytes / (1024 * 1024)).toFixed(2);
  const percentUsed = ((quota.r2_storage_bytes / quota.r2_storage_limit_bytes) * 100).toFixed(4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0B0F19] border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              PERMANENT MEDIA STORAGE (FREE TIER)
            </span>
            <span className="text-xs text-emerald-400 font-mono">0 MAD Guaranteed</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Product Images & Media Object Storage
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Permanent image storage repository. Images are stored as optimized assets with SHA-256 cryptographic hashes and safe deletion guards.
          </p>
        </div>

        {/* Upload Button */}
        <div>
          <label className="px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-purple-900/30 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Upload New Images</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Quota Gauge Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
          <div className="text-xs text-slate-400 font-medium mb-1">Storage Volume</div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {storageUsedMb} <span className="text-xs text-slate-400">MB / 10 GB Free</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.max(1, Number(percentUsed))}%` }} />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{percentUsed}% of free quota used</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
          <div className="text-xs text-slate-400 font-medium mb-1">Class A Operations (Uploads/Writes)</div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {quota.r2_class_a_ops} <span className="text-xs text-slate-400">/ 1,000,000 Free</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>999,976 Writes remaining this month</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
          <div className="text-xs text-slate-400 font-medium mb-1">Class B Operations (CDN Reads)</div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {quota.r2_class_b_ops} <span className="text-xs text-slate-400">/ 10,000,000 Free</span>
          </div>
          <div className="text-[10px] text-purple-300 mt-2">Direct zero-cost image delivery</div>
        </div>
      </div>

      {/* Notifications */}
      {actionNotice && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}
      {uploadError && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Media Grid */}
      <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <div className="font-semibold text-white">Stored Media Catalog ({mediaFiles.length} Assets)</div>
          <div className="text-slate-400 text-[11px]">Click any image to inspect SHA-256 metadata & safe usage</div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {mediaFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => setSelectedFile(file)}
              className={`group relative rounded-lg border overflow-hidden cursor-pointer transition-all aspect-square bg-slate-900 flex flex-col justify-between ${
                selectedFile?.id === file.id
                  ? 'border-purple-500 ring-2 ring-purple-500/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <img
                src={file.thumbnail_url || file.url}
                alt={file.filename}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                <div className="text-[11px] font-medium text-white truncate">{file.filename}</div>
                <div className="text-[10px] text-slate-300 font-mono">
                  {(file.size_bytes / 1024).toFixed(0)} KB · {file.width}x{file.height}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Image Metadata Inspector Drawer */}
      {selectedFile && (
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-purple-500/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Object Metadata Inspector: {selectedFile.filename}
              </h3>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
              <img
                src={selectedFile.url}
                alt={selectedFile.filename}
                className="max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-2 text-slate-300 md:col-span-2">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Dimensions:</span>
                  <span className="font-mono text-white">{selectedFile.width} × {selectedFile.height} px</span>
                </div>
                <div>
                  <span className="text-slate-500 block">File Size:</span>
                  <span className="font-mono text-white">{(selectedFile.size_bytes / 1024).toFixed(1)} KB</span>
                </div>
                <div>
                  <span className="text-slate-500 block">MIME Type:</span>
                  <span className="font-mono text-white">{selectedFile.mime_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Uploaded At:</span>
                  <span className="font-mono text-white">{new Date(selectedFile.uploaded_at).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">SHA-256 Checksum:</span>
                <span className="font-mono text-[11px] text-purple-300 break-all bg-slate-950 px-2 py-1 rounded block mt-0.5 border border-slate-800">
                  {selectedFile.sha256}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleCopyUrl(selectedFile)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === selectedFile.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-purple-400" />
                      <span>Copy Public Image URL</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDelete(selectedFile)}
                  className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Object</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
