import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Trash2, 
  Star, 
  ArrowLeft, 
  ArrowRight, 
  Link as LinkIcon, 
  Video, 
  AlertCircle, 
  CheckCircle2, 
  Plus,
  Loader2
} from 'lucide-react';
import { uploadTempFileToSupabaseStorage } from '../../services/supabaseService.js';


interface MediaUploaderProps {
  coverImage: string;
  gallery: string[];
  demoUrl?: string;
  videoUrl?: string;
  onChangeCoverImage: (url: string) => void;
  onChangeGallery: (gallery: string[]) => void;
  onChangeDemoUrl: (url: string) => void;
  onChangeVideoUrl: (url: string) => void;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  coverImage,
  gallery,
  demoUrl = '',
  videoUrl = '',
  onChangeCoverImage,
  onChangeGallery,
  onChangeDemoUrl,
  onChangeVideoUrl
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File type validation
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_SIZE_MB = 5;
  const [isUploadingTemp, setIsUploadingTemp] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMsg(null);
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrorMsg(`Invalid file type "${file.name}". Please upload JPEG, PNG, WebP, or GIF images only.`);
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds the ${MAX_SIZE_MB}MB limit.`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length === 0) return;

    setIsUploadingTemp(true);
    let currentGallery = [...gallery];
    let currentCover = coverImage;

    for (const file of validFiles) {
      try {
        // Immediately upload file binary to Supabase Storage bucket under temp/ path (No database row created!)
        const uploaded = await uploadTempFileToSupabaseStorage(file, 'images');
        if (uploaded?.url) {
          currentGallery.push(uploaded.url);
          if (!currentCover || currentCover.includes('unsplash.com/photo-1618005182384')) {
            currentCover = uploaded.url;
          }
        }
      } catch (err) {
        console.warn('Temp image upload notice:', err);
      }
    }

    onChangeGallery(currentGallery);
    onChangeCoverImage(currentCover);
    setIsUploadingTemp(false);
  };


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleAddImageUrl = () => {
    if (!urlInput.trim()) return;
    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
      setErrorMsg('Please enter a valid HTTP or HTTPS image URL.');
      return;
    }

    const updated = [...gallery, urlInput.trim()];
    onChangeGallery(updated);
    if (!coverImage) onChangeCoverImage(urlInput.trim());

    setUrlInput('');
    setIsAddingUrl(false);
    setErrorMsg(null);
  };

  const handleRemoveImage = (index: number) => {
    const targetUrl = gallery[index];
    const updated = gallery.filter((_, i) => i !== index);
    onChangeGallery(updated);

    // If removed image was cover, reassign
    if (targetUrl === coverImage) {
      onChangeCoverImage(updated.length > 0 ? updated[0] : '');
    }
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === gallery.length - 1) return;

    const newIndex = direction === 'left' ? index - 1 : index + 1;
    const updated = [...gallery];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    onChangeGallery(updated);
  };

  const handleSetAsCover = (url: string) => {
    onChangeCoverImage(url);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#2C2A26] bg-[#EAE5D9]'
            : 'border-[#E2DDD3] bg-[#FDFCF9] hover:border-[#2C2A26] hover:bg-white'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          multiple
          accept="image/png, image/jpeg, image/webp, image/gif"
          className="hidden"
        />

        <div className="max-w-sm mx-auto space-y-3 pointer-events-none">
          <div className="w-12 h-12 bg-[#F5F2EB] border border-[#E2DDD3] rounded-2xl flex items-center justify-center mx-auto text-[#2C2A26]">
            <UploadCloud className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-base text-[#2C2A26]">
              Drag & Drop Project Screenshots
            </h4>
            <p className="text-xs text-[#5D5A53] mt-1">
              or <span className="text-[#2C2A26] font-bold underline">browse files</span> from your computer
            </p>
          </div>
          <div className="text-[11px] text-[#8C8275]">
            Supports JPG, PNG, WebP, GIF (Max 5MB each)
          </div>
        </div>
      </div>

      {/* URL Image Adder */}
      <div className="flex items-center justify-between gap-4 bg-[#F5F2EB] p-3 rounded-2xl border border-[#E2DDD3]">
        {!isAddingUrl ? (
          <button
            type="button"
            onClick={() => setIsAddingUrl(true)}
            className="text-xs font-bold text-[#2C2A26] hover:text-[#423E38] flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-600" />
            <span>Add Screenshot via Direct Image URL</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/screenshot.png"
              className="flex-1 px-3 py-1.5 bg-white border border-[#E2DDD3] rounded-xl text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="px-3 py-1.5 bg-[#2C2A26] text-white rounded-xl text-xs font-bold shrink-0"
            >
              Add URL
            </button>
            <button
              type="button"
              onClick={() => setIsAddingUrl(false)}
              className="px-2 py-1.5 text-xs text-[#8C8275]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Gallery & Cover Preview Grid */}
      {gallery.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-sm text-[#2C2A26] flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-amber-700" />
              <span>Project Gallery ({gallery.length} Images)</span>
            </h4>
            <span className="text-[11px] text-[#8C8275]">
              Star icon sets main cover image shown in Marketplace
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((imgUrl, idx) => {
              const isCover = imgUrl === coverImage;

              return (
                <div
                  key={idx}
                  className={`relative group rounded-2xl overflow-hidden border-2 transition-all bg-white ${
                    isCover ? 'border-amber-500 ring-2 ring-amber-200' : 'border-[#E2DDD3]'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Project screenshot ${idx + 1}`}
                    className="w-full h-32 object-cover"
                  />

                  {/* Cover Badge */}
                  {isCover && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Main Cover</span>
                    </div>
                  )}

                  {/* Controls Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => handleSetAsCover(imgUrl)}
                        className="p-1.5 bg-white text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                        title="Set as Main Cover"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleMoveImage(idx, 'left')}
                      disabled={idx === 0}
                      className="p-1.5 bg-white text-[#2C2A26] disabled:opacity-30 rounded-lg"
                      title="Move Left"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveImage(idx, 'right')}
                      disabled={idx === gallery.length - 1}
                      className="p-1.5 bg-white text-[#2C2A26] disabled:opacity-30 rounded-lg"
                      title="Move Right"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title="Delete Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Demo & Video URLs Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E2DDD3]">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#2C2A26] flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-amber-700" />
            <span>Live Project Demo URL</span>
          </label>
          <input
            type="url"
            value={demoUrl}
            onChange={(e) => onChangeDemoUrl(e.target.value)}
            placeholder="https://demo.yourproject.com"
            className="w-full px-3.5 py-2 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs focus:outline-none focus:border-[#2C2A26]"
          />
          <p className="text-[11px] text-[#8C8275]">
            Buyers can test your live web app or staging environment.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#2C2A26] flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-amber-700" />
            <span>Demo Video / Loom Walkthrough URL</span>
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => onChangeVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or https://loom.com/share/..."
            className="w-full px-3.5 py-2 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs focus:outline-none focus:border-[#2C2A26]"
          />
          <p className="text-[11px] text-[#8C8275]">
            Optionally provide a video walk-through of the codebase & revenue dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MediaUploader;
