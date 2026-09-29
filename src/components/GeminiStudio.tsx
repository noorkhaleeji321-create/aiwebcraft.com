import React, { useState } from 'react';
import { Sparkles, Bot, Zap, Globe, FileText, CheckCircle2, ArrowRight, Loader2, Copy, Check, Save, Eye, Layers, Image as ImageIcon, Video as VideoIcon, Youtube, Compass, Play, RefreshCw, ExternalLink, X, AlertTriangle, CheckCircle, Key, Info, ShieldCheck } from 'lucide-react';
import { Category, Tag, Article, Language, Video } from '../types/blog';
import { GEMINI_MODELS, GeminiModelInfo, geminiService, GeneratedArticleResult, getActiveGeminiKeys, saveActiveGeminiKey, isValidGeminiKey } from '../services/gemini';
import { storeService, extractYoutubeId, generateUUID, isValidUUID, normalizeImageUrl } from '../services/store';

interface GeminiStudioProps {
  currentLang: Language;
  categories: Category[];
  tags: Tag[];
  onArticleSaved: () => void;
  onOpenArticleEditor: (article: Partial<Article>) => void;
  showFeedback: (type: 'success' | 'error', message: string) => void;
  onNavigate?: (view: string, slug?: string) => void;
  onViewArticlesTab?: () => void;
  isSupabaseConnected?: boolean;
}

const NICHE_IMAGE_PRESETS: Record<string, { label_ar: string; label_en: string; url: string }> = {
  webdev: {
    label_ar: '🌐 تطوير الويب',
    label_en: 'Web Dev',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
  },
  ai: {
    label_ar: '🤖 ذكاء اصطناعي',
    label_en: 'AI & LLMs',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  },
  saas: {
    label_ar: '🚀 مشاريع SaaS',
    label_en: 'SaaS Platform',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
  },
  ecommerce: {
    label_ar: '🛍️ تجارة إلكترونية',
    label_en: 'E-Commerce',
    url: 'https://images.unsplash.com/photo-1556742049-0a67e5572263?auto=format&fit=crop&w=1200&q=80',
  },
  health: {
    label_ar: '🥗 صحة وتغذية',
    label_en: 'Health',
    url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
  },
  finance: {
    label_ar: '💰 مالية وعملات',
    label_en: 'Finance',
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
  },
  realestate: {
    label_ar: '🏠 عقارات واستثمار',
    label_en: 'Real Estate',
    url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
  },
  cooking: {
    label_ar: '🍳 طبخ ومأكولات',
    label_en: 'Food & Cooking',
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
  },
  travel: {
    label_ar: '✈️ سياحة وسفر',
    label_en: 'Travel',
    url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
  },
  gaming: {
    label_ar: '🎮 ألعاب فيديو',
    label_en: 'Gaming',
    url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80',
  },
  marketing: {
    label_ar: '📢 تسويق وسيو',
    label_en: 'SEO & Marketing',
    url: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=1200&q=80',
  },
};

const NICHE_PRESETS = [
  { id: 'webdev', name_en: '🌐 Modern Web Dev', name_ar: '🌐 تطوير الويب الحديث', defaultPrompt: 'Modern Web Development & Full-Stack Engineering' },
  { id: 'ai', name_en: '🤖 AI & LLMs', name_ar: '🤖 الذكاء الاصطناعي والنماذج اللغوية', defaultPrompt: 'AI Engineering, LLM Agents & Prompting' },
  { id: 'saas', name_en: '🚀 SaaS & Supabase', name_ar: '🚀 مشاريع SaaS وقواعد Supabase', defaultPrompt: 'SaaS Architecture & Backend Infrastructure' },
  { id: 'ecommerce', name_en: '🛍️ E-Commerce & Dropshipping', name_ar: '🛍️ تجارة إلكترونية ودروب شيبينغ', defaultPrompt: 'E-Commerce & Digital Business' },
  { id: 'health', name_en: '🥗 Health & Fitness', name_ar: '🥗 صحة ورشاقة وتغذية', defaultPrompt: 'Health, Nutrition & Wellness' },
  { id: 'finance', name_en: '💰 Finance & Crypto', name_ar: '💰 مالية وعملات واستثمار', defaultPrompt: 'Personal Finance, Investing & Crypto' },
  { id: 'realestate', name_en: '🏠 Real Estate', name_ar: '🏠 عقارات واستثمار عقاري', defaultPrompt: 'Real Estate & Property Investment' },
  { id: 'cooking', name_en: '🍳 Food & Recipes', name_ar: '🍳 طبخ ووصفات ومأكولات', defaultPrompt: 'Cooking, Recipes & Gastronomy' },
  { id: 'travel', name_en: '✈️ Travel & Tourism', name_ar: '✈️ سياحة وسفر', defaultPrompt: 'Travel, Destinations & Culture' },
  { id: 'gaming', name_en: '🎮 Gaming & Esports', name_ar: '🎮 ألعاب فيديو ورياضات إلكترونية', defaultPrompt: 'Gaming & Interactive Media' },
  { id: 'marketing', name_en: '📢 Marketing & SEO', name_ar: '📢 تسويق رقمي وسيو', defaultPrompt: 'Digital Marketing & Content Strategy' },
  { id: 'custom', name_en: '⚡ Custom Niche', name_ar: '⚡ مجال مخصص بالكامل', defaultPrompt: '' }
];

export const GeminiStudio: React.FC<GeminiStudioProps> = ({
  currentLang,
  categories,
  tags,
  onArticleSaved,
  onOpenArticleEditor,
  showFeedback,
  onNavigate,
  onViewArticlesTab,
  isSupabaseConnected = true,
}) => {
  const isAr = currentLang === 'ar';

  // Selected Model (Defaults to gemini-3.8-flash)
  const [selectedModelId, setSelectedModelId] = useState<string>('gemini-3.8-flash');
  
  // Gemini API Key management
  const [activeGeminiKeys, setActiveGeminiKeys] = useState<string[]>(() => getActiveGeminiKeys());
  const [showKeySettings, setShowKeySettings] = useState<boolean>(() => getActiveGeminiKeys().length === 0);
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => getActiveGeminiKeys()[0] || '');
  const [isVerifyingKey, setIsVerifyingKey] = useState<boolean>(false);
  const [keyVerifyMessage, setKeyVerifyMessage] = useState<{ success: boolean; text: string } | null>(null);

  const hasGeminiKey = activeGeminiKeys.length > 0;

  const handleSaveAndVerifyKey = async () => {
    if (!apiKeyInput.trim()) {
      setKeyVerifyMessage({ success: false, text: isAr ? 'يرجى لصق المفتاح أولاً' : 'Please paste a key first' });
      return;
    }
    const cleanKey = apiKeyInput.trim();
    if (!isValidGeminiKey(cleanKey)) {
      setKeyVerifyMessage({
        success: false,
        text: isAr
          ? 'المفتاح غير صالح! مفتاح Gemini يبدأ بـ AIzaSy... (وليس مفتاح AdSense pub- أو Google Search Console)'
          : 'Invalid key! Gemini API key must start with AIzaSy... (not AdSense or Search Console)'
      });
      return;
    }

    setIsVerifyingKey(true);
    setKeyVerifyMessage(null);
    const testResult = await geminiService.testKey(cleanKey);
    setIsVerifyingKey(false);

    if (testResult.success) {
      saveActiveGeminiKey(cleanKey);
      setActiveGeminiKeys([cleanKey]);
      setKeyVerifyMessage({
        success: true,
        text: isAr ? '✅ تم التحقق وحفظ المفتاح بنجاح! الروبوت الآن متصل وجاهز للعمل.' : '✅ Key verified and saved! AI bot is ready.'
      });
      showFeedback('success', isAr ? 'تم حفظ وتفعيل مفتاح Gemini API بنجاح!' : 'Gemini API Key saved and activated!');
      setTimeout(() => setShowKeySettings(false), 2200);
    } else {
      setKeyVerifyMessage({
        success: false,
        text: testResult.message || (isAr ? 'فشل التحقق من المفتاح' : 'Failed to verify key')
      });
    }
  };

  // Generation Options
  const [topic, setTopic] = useState('');
  const [selectedNicheId, setSelectedNicheId] = useState<string>('webdev');
  const [customNiche, setCustomNiche] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const webDev = categories.find(c => c.slug === 'web-development' || c.name_ar === 'تطوير الويب الحديث');
    return webDev?.id || categories[0]?.id || '';
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [targetLang, setTargetLang] = useState<'both' | 'ar' | 'en' | 'fr'>('ar');
  const [tone, setTone] = useState<'informative' | 'technical' | 'tutorial' | 'deep_dive' | 'news' | 'engaging' | 'marketing'>('informative');
  const [wordCount, setWordCount] = useState<'short' | 'medium' | 'long' | 'epic'>('long');
  const [customInstructions, setCustomInstructions] = useState('');
  
  // Media & Video inputs
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [imageLoadStatus, setImageLoadStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [imageLoadError, setImageLoadError] = useState(false);
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState('');

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticleResult | null>(null);
  const [activeArticleImage, setActiveArticleImage] = useState<string>('');
  const [usedModel, setUsedModel] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedArticleId, setSavedArticleId] = useState<string | null>(null);

  // Saved confirmation feedback state
  const [savedArticleInfo, setSavedArticleInfo] = useState<{
    id: string;
    slug: string;
    title: string;
    title_ar: string;
    featured_image: string;
    syncedToSupabase: boolean;
    status: 'published' | 'draft';
    timestamp: string;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // In-preview image change state
  const [isEditingPreviewImage, setIsEditingPreviewImage] = useState(false);
  const [previewImageInput, setPreviewImageInput] = useState('');

  // Content Enhancer & Translator Sub-tab
  const [studioTool, setStudioTool] = useState<'article_generator' | 'seo_generator' | 'enhancer' | 'keyword_planner'>('article_generator');

  // Keyword Planner State
  const [keywordTopicInput, setKeywordTopicInput] = useState('');
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [generatedKeywords, setGeneratedKeywords] = useState<any>(null);

  // Quick SEO Tool state
  const [seoTitleInput, setSeoTitleInput] = useState('');
  const [seoContentInput, setSeoContentInput] = useState('');
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [generatedSeo, setGeneratedSeo] = useState<any>(null);

  // Quick Enhancer Tool state
  const [enhanceInput, setEnhanceInput] = useState('');
  const [enhanceAction, setEnhanceAction] = useState<'improve' | 'expand' | 'translate_ar' | 'translate_en' | 'add_code' | 'summarize'>('translate_ar');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceResult, setEnhanceResult] = useState('');

  const currentModel = GEMINI_MODELS.find((m) => m.id === selectedModelId) || GEMINI_MODELS[0];
  const detectedYoutubeId = extractYoutubeId(youtubeVideoUrl);

  const getEffectiveNiche = () => {
    if (selectedNicheId === 'custom' && customNiche.trim()) {
      return customNiche.trim();
    }
    const preset = NICHE_PRESETS.find((p) => p.id === selectedNicheId);
    return isAr ? preset?.name_ar || preset?.name_en || '' : preset?.name_en || '';
  };

  const getDefaultImageForNiche = (nicheId: string): string => {
    return NICHE_IMAGE_PRESETS[nicheId]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  };

  // Immediate synchronization when typing or pasting image URL
  const handleFeaturedImageChange = (rawUrl: string) => {
    setFeaturedImageUrl(rawUrl);
    setImageLoadError(false);
    const normalized = normalizeImageUrl(rawUrl);
    if (normalized) {
      setActiveArticleImage(normalized);
      setImageLoadStatus('loading');
    } else {
      setImageLoadStatus('idle');
    }
  };

  // Quick image preset handler
  const handleSelectImagePreset = (url: string) => {
    setFeaturedImageUrl(url);
    setActiveArticleImage(url);
    setImageLoadError(false);
    setImageLoadStatus('loading');
  };

  const handleGenerateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      showFeedback('error', isAr ? 'يرجى إدخال فكرة أو عنوان المقال' : 'Please enter an article topic or title');
      return;
    }

    setIsGenerating(true);
    setGeneratedArticle(null);
    setSavedArticleId(null);
    setSavedArticleInfo(null);
    setShowSuccessModal(false);

    const catObj = categories.find((c) => c && c.id === selectedCategory);
    const categoryName = isAr ? (catObj?.name_ar || catObj?.name) : catObj?.name;
    const effectiveNiche = getEffectiveNiche();
    const cleanImageUrl = normalizeImageUrl(featuredImageUrl.trim());

    const res = await geminiService.generateArticle({
      model: selectedModelId,
      topic: topic.trim(),
      niche: effectiveNiche || categoryName,
      category: categoryName,
      tags: selectedTags,
      language: targetLang,
      tone,
      wordCount,
      youtubeUrl: youtubeVideoUrl.trim() || undefined,
      imageUrl: cleanImageUrl || undefined,
      additionalInstructions: customInstructions,
    });

    setIsGenerating(false);

    if (res.success && res.data) {
      setGeneratedArticle(res.data);
      setUsedModel(res.modelUsed || selectedModelId);

      // Resolve featured image: user input > niche preset
      let finalImg = cleanImageUrl;
      if (!finalImg) {
        finalImg = getDefaultImageForNiche(selectedNicheId);
      }
      setActiveArticleImage(finalImg);
      setImageLoadError(false);

      showFeedback('success', isAr ? `تم توليد المقال بنجاح مطابقاً لمجال (${effectiveNiche})!` : `Article generated successfully tailored to ${effectiveNiche}!`);
    } else {
      showFeedback('error', res.error || (isAr ? 'فشل توليد المقال، يرجى المحاولة ثانية' : 'Failed to generate article'));
    }
  };

  const handleSaveToSupabase = async (status: 'published' | 'draft') => {
    if (!generatedArticle) return;

    setIsSaving(true);
    const catId = selectedCategory || categories[0]?.id;
    const authorId = '10000000-0000-4000-8000-000000000001'; // Default author

    // Attach video if YouTube URL exists
    const videoList: Video[] = [];
    const ytId = extractYoutubeId(youtubeVideoUrl);
    if (ytId) {
      videoList.push({
        id: generateUUID(),
        title: generatedArticle.title_en || generatedArticle.title_ar,
        title_ar: generatedArticle.title_ar || generatedArticle.title_en,
        youtube_url: youtubeVideoUrl.trim(),
        youtube_id: ytId,
        thumbnail_url: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        duration: '10:00',
        description: generatedArticle.excerpt_en || '',
        description_ar: generatedArticle.excerpt_ar || '',
        created_at: new Date().toISOString(),
      });
    }

    const cleanInputImg = featuredImageUrl.trim() ? normalizeImageUrl(featuredImageUrl.trim()) : '';
    const finalImage = cleanInputImg || activeArticleImage || getDefaultImageForNiche(selectedNicheId);
    const articleSlug = generatedArticle.slug || `gemini-${Date.now()}`;

    const mappedTags = (selectedTags || []).map((tagId) => {
      const existing = (tags || []).find((t) => t && t.id === tagId);
      return existing || {
        id: isValidUUID(tagId) ? tagId : generateUUID(),
        name: tagId,
        name_ar: tagId,
        slug: tagId.toLowerCase().replace(/\s+/g, '-'),
        created_at: new Date().toISOString(),
      };
    });

    const articleToSave: Partial<Article> = {
      id: savedArticleId || undefined,
      title: generatedArticle.title_en || generatedArticle.title_ar,
      title_ar: generatedArticle.title_ar || generatedArticle.title_en,
      slug: articleSlug,
      excerpt: generatedArticle.excerpt_en || '',
      excerpt_ar: generatedArticle.excerpt_ar || '',
      content: generatedArticle.content_en || '',
      content_ar: generatedArticle.content_ar || '',
      featured_image: finalImage,
      status: status,
      category_id: catId,
      author_id: authorId,
      tags: mappedTags,
      publish_date: new Date().toISOString(),
      reading_time_minutes: 6,
      videos: videoList,
      seo: {
        id: generateUUID(),
        entity_type: 'article',
        entity_id: '',
        seo_title: generatedArticle.seo?.meta_title || generatedArticle.title_en,
        seo_title_ar: generatedArticle.title_ar,
        seo_description: generatedArticle.seo?.meta_description || generatedArticle.excerpt_en,
        seo_description_ar: generatedArticle.excerpt_ar,
        keywords: generatedArticle.seo?.focus_keywords || generatedArticle.tags_suggestion || ['Gemini AI', 'Blog'],
        keywords_ar: generatedArticle.tags_suggestion || ['مقال', 'ذكاء اصطناعي'],
        canonical_url: generatedArticle.seo?.canonical_url || `https://aiwebcrafter.com/article/${articleSlug}`,
        noindex: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    const res = await storeService.saveArticle(articleToSave);
    setIsSaving(false);

    if (res.success) {
      const finalSavedId = res.data?.id || generateUUID();
      const finalSavedSlug = res.data?.slug || articleSlug;
      setSavedArticleId(finalSavedId);

      setSavedArticleInfo({
        id: finalSavedId,
        slug: finalSavedSlug,
        title: articleToSave.title || '',
        title_ar: articleToSave.title_ar || '',
        featured_image: finalImage,
        syncedToSupabase: Boolean(res.syncedToSupabase),
        status: status,
        timestamp: new Date().toLocaleTimeString(isAr ? 'ar-MA' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
      setShowSuccessModal(true);
      showFeedback('success', isAr ? `✅ تم حفظ ونشر المقال والصور والفيديو بنجاح في Supabase!` : `✅ Article, images & video saved to Supabase!`);
      onArticleSaved();
    } else {
      showFeedback('error', `Failed to save: ${res.error || 'Database error'}`);
    }
  };

  const handleOpenInEditor = () => {
    if (!generatedArticle) return;
    const catId = selectedCategory || categories[0]?.id;
    const cleanInputImg = featuredImageUrl.trim() ? normalizeImageUrl(featuredImageUrl.trim()) : '';
    const finalImage = cleanInputImg || activeArticleImage || getDefaultImageForNiche(selectedNicheId);

    const videoList: Video[] = [];
    const ytId = extractYoutubeId(youtubeVideoUrl);
    if (ytId) {
      videoList.push({
        id: generateUUID(),
        title: generatedArticle.title_en || generatedArticle.title_ar,
        title_ar: generatedArticle.title_ar || generatedArticle.title_en,
        youtube_url: youtubeVideoUrl.trim(),
        youtube_id: ytId,
        thumbnail_url: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        duration: '10:00',
        description: generatedArticle.excerpt_en || '',
        description_ar: generatedArticle.excerpt_ar || '',
        created_at: new Date().toISOString(),
      });
    }

    onOpenArticleEditor({
      title: generatedArticle.title_en,
      title_ar: generatedArticle.title_ar,
      slug: generatedArticle.slug,
      excerpt: generatedArticle.excerpt_en,
      excerpt_ar: generatedArticle.excerpt_ar,
      content: generatedArticle.content_en,
      content_ar: generatedArticle.content_ar,
      featured_image: finalImage,
      status: 'draft',
      category_id: catId,
      reading_time_minutes: 6,
      videos: videoList,
      seo: {
        id: `seo-${Date.now()}`,
        entity_type: 'article',
        entity_id: '',
        seo_title: generatedArticle.seo?.meta_title || generatedArticle.title_en,
        seo_title_ar: generatedArticle.title_ar,
        seo_description: generatedArticle.seo?.meta_description || generatedArticle.excerpt_en,
        seo_description_ar: generatedArticle.excerpt_ar,
        keywords: generatedArticle.seo?.focus_keywords || generatedArticle.tags_suggestion || ['Gemini AI'],
        keywords_ar: generatedArticle.tags_suggestion || [],
        canonical_url: `https://aiwebcrafter.com/article/${generatedArticle.slug}`,
        noindex: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  };

  const handleGenerateSeoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seoTitleInput && !seoContentInput) return;

    setIsGeneratingSeo(true);
    setGeneratedSeo(null);

    const res = await geminiService.generateSeo({
      model: selectedModelId,
      title: seoTitleInput,
      content: seoContentInput,
      language: isAr ? 'ar' : 'en',
    });

    setIsGeneratingSeo(false);
    if (res.success && res.data) {
      setGeneratedSeo(res.data);
      showFeedback('success', 'SEO metadata generated successfully!');
    } else {
      showFeedback('error', res.error || 'Failed to generate SEO');
    }
  };

  const handleEnhanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enhanceInput.trim()) return;

    setIsEnhancing(true);
    setEnhanceResult('');

    const res = await geminiService.enhanceContent({
      model: selectedModelId,
      content: enhanceInput,
      action: enhanceAction,
    });

    setIsEnhancing(false);
    if (res.success && res.result) {
      setEnhanceResult(res.result);
      showFeedback('success', 'Content enhanced successfully!');
    } else {
      showFeedback('error', res.error || 'Failed to enhance content');
    }
  };

  const handleGenerateKeywordsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywordTopicInput.trim()) return;

    setIsGeneratingKeywords(true);
    setGeneratedKeywords(null);

    const res = await geminiService.generateKeywords({
      model: selectedModelId,
      topic: keywordTopicInput.trim(),
    });

    setIsGeneratingKeywords(false);
    if (res.success && res.data) {
      setGeneratedKeywords(res.data);
      showFeedback('success', 'Keyword strategy plan generated successfully!');
    } else {
      showFeedback('error', res.error || 'Failed to generate keyword plan');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 🚀 Celebratory Publish Success Modal */}
      {showSuccessModal && savedArticleInfo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 shadow-2xl space-y-5 text-center">
            {/* Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Icon & Title */}
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-950">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-white">
                {isAr ? '🎉 تم نشر وحفظ المقال بنجاح في Supabase!' : '🎉 Article Published & Saved to Supabase!'}
              </h3>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'تم حفظ المقال والصورة البارزة والوسائط وبيانات الـ SEO في قاعدة البيانات مباشرة وهو جاهز للقراءة الفورية.'
                  : 'Your article, featured image, media, and SEO schema were successfully saved to the live database.'}
              </p>
            </div>

            {/* Article Summary Card */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3 text-left">
              <div className="w-16 h-14 rounded-lg overflow-hidden border border-slate-800 shrink-0 bg-slate-900">
                <img
                  src={savedArticleInfo.featured_image}
                  alt="Thumb"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-xs font-bold text-white truncate">{savedArticleInfo.title_ar || savedArticleInfo.title}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">/article/{savedArticleInfo.slug}</p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Supabase Live DB</span>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 font-mono">{savedArticleInfo.timestamp}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  onNavigate?.('article', savedArticleInfo.slug);
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/60 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>{isAr ? '👁️ عرض المقال المنشور الآن في الموقع' : '👁️ View Live Published Article'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    onViewArticlesTab?.();
                  }}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isAr ? 'قائمة المقالات' : 'Articles List'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    setGeneratedArticle(null);
                    setSavedArticleInfo(null);
                    setTopic('');
                    setFeaturedImageUrl('');
                  }}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? 'كتابة مقال جديد' : 'New Article'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="text-[11px] text-slate-400 hover:text-slate-200 pt-1 block mx-auto underline cursor-pointer"
              >
                {isAr ? 'البقاء في الاستوديو ومتابعة المعاينة' : 'Stay in studio & continue reviewing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner: Active Gemini Models */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>{isAr ? 'مدعوم بـ Google Gemini API الرسمي' : 'Powered by Official Google Gemini API'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Bot className="w-7 h-7 text-indigo-400" />
              <span>{isAr ? 'استوديو الذكاء الاصطناعي لتوليد المقالات والسيو' : 'Gemini AI Content & SEO Studio'}</span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {isAr
                ? 'قم بتوليد مقالات احترافية ثنائية اللغة (عربي/إنكليزي)، شروحات برمجية، وبيانات SEO متوافقة 100% مع معايير Google وجاهزة للنشر الفوري في Supabase.'
                : 'Generate production-ready bilingual articles, rich typed code examples, and Google-compliant SEO structured data with instant 1-click publishing to Supabase.'}
            </p>
          </div>

          {/* Model Selector Card */}
          <div className="bg-slate-950/90 border border-indigo-500/30 rounded-xl p-4 min-w-[280px] sm:min-w-[340px] shadow-lg">
            <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {isAr ? 'النموذج النشط المعتمد' : 'Active Gemini Model'}
              </span>
              <span className="text-[10px] bg-indigo-900/60 text-indigo-200 px-2 py-0.5 rounded-full font-mono">
                {currentModel.speed}
              </span>
            </label>

            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
            >
              {GEMINI_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} {model.isDefault ? '★ [Default]' : ''}
                </option>
              ))}
            </select>

            <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] flex items-center justify-between">
              {hasGeminiKey ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'مفتاح Gemini API نشط' : 'Gemini Key Active'}</span>
                </span>
              ) : (
                <span className="text-amber-400 font-semibold flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{isAr ? 'محرك التوليد الفوري جاهز' : 'High-Availability Engine Ready'}</span>
                </span>
              )}
              <span className="text-indigo-400 font-mono text-[10px] font-bold">1M Context</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔑 Direct Gemini API Key Activation & Health Card */}
      <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 shadow-lg transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hasGeminiKey ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">
                  {isAr ? 'مفتاح Gemini API السحابي (Google AI Studio)' : 'Gemini Cloud API Key'}
                </h4>
                {hasGeminiKey ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isAr ? 'متصل ونشط' : 'Connected & Active'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{isAr ? 'غير مضاف في هذا النطاق' : 'Not added on this domain'}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hasGeminiKey
                  ? (isAr ? `المفتاح مسجل: ${activeGeminiKeys[0].slice(0, 8)}••••••••${activeGeminiKeys[0].slice(-4)}` : `Active key: ${activeGeminiKeys[0].slice(0, 8)}••••••••${activeGeminiKeys[0].slice(-4)}`)
                  : (isAr ? 'عند رفع الموقع إلى رابط جديد، الصق مفتاح Gemini هنا ليعمل الروبوت تلقائياً وبدون انقطاع.' : 'When deploying to a new URL, paste your Gemini key here to activate the bot.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setShowKeySettings(!showKeySettings)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>{showKeySettings ? (isAr ? 'إخفاء الإعدادات' : 'Hide') : (hasGeminiKey ? (isAr ? 'تغيير المفتاح' : 'Change Key') : (isAr ? 'إدخال المفتاح الآن' : 'Enter Key'))}</span>
            </button>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span>{isAr ? 'مفتاح مجاني ↗' : 'Free Key ↗'}</span>
            </a>
          </div>
        </div>

        {/* Expandable Key Input Panel */}
        {showKeySettings && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveAndVerifyKey}
                disabled={isVerifyingKey || !apiKeyInput.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                {isVerifyingKey ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isAr ? 'جاري الفحص...' : 'Verifying...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isAr ? 'فحص وحفظ المفتاح' : 'Verify & Save Key'}</span>
                  </>
                )}
              </button>
            </div>

            {keyVerifyMessage && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${keyVerifyMessage.success ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'}`}>
                {keyVerifyMessage.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{keyVerifyMessage.text}</span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isAr
                ? '💡 ملاحظة مهمة: مفاتيح Google AdSense و Google Analytics و Search Console لا تستخدم هنا. الروبوت يحتاج فقط لمفتاح Gemini API (يبدأ بـ AIzaSy...). يتم حفظ المفتاح بأمان في هذا النطاق وإرساله مع كل طلب توليد مقال.'
                : '💡 Note: AdSense, Analytics, and Search Console keys are for SEO/Ads. Gemini bot requires a Gemini API key starting with AIzaSy...'}
            </p>
          </div>
        )}
      </div>

      {/* Sub-Tabs: 1. Full Article Generator | 2. SEO & Schema | 3. Enhancer & Translator | 4. Keyword Planner */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setStudioTool('article_generator')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            studioTool === 'article_generator'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isAr ? '1. توليد مقال متكامل (كامل التنسيق)' : '1. Full Article Generator'}</span>
        </button>

        <button
          onClick={() => setStudioTool('seo_generator')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            studioTool === 'seo_generator'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>{isAr ? '2. مولد بيانات السيو & FAQ Schema' : '2. SEO & FAQ Schema'}</span>
        </button>

        <button
          onClick={() => setStudioTool('enhancer')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            studioTool === 'enhancer'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAr ? '3. المترجم ومحسن النصوص' : '3. Translator & Enhancer'}</span>
        </button>

        <button
          onClick={() => setStudioTool('keyword_planner')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            studioTool === 'keyword_planner'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Compass className="w-4 h-4 text-indigo-400" />
          <span>{isAr ? '4. مخطط الكلمات والنية البحثية' : '4. Keyword & Intent Planner'}</span>
        </button>
      </div>

      {/* TOOL 1: FULL ARTICLE GENERATOR */}
      {studioTool === 'article_generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Generation Configuration Form */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>{isAr ? 'إعدادات توليد المقال' : 'Article Generation Parameters'}</span>
            </h3>

            <form onSubmit={handleGenerateArticle} className="space-y-4 text-xs">
              {/* Niche Selector */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isAr ? 'مجال أو نيتش المقال (Niche) *' : 'Target Niche / Domain *'}</span>
                  </span>
                  <span className="text-[10px] text-indigo-300 font-mono">
                    {getEffectiveNiche()}
                  </span>
                </label>
                
                {/* Niche Presets Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {NICHE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedNicheId(preset.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-left transition-all border ${
                        selectedNicheId === preset.id
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="truncate block">
                        {isAr ? preset.name_ar : preset.name_en}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom Niche Text Input if selected */}
                {selectedNicheId === 'custom' && (
                  <input
                    type="text"
                    value={customNiche}
                    onChange={(e) => setCustomNiche(e.target.value)}
                    placeholder={
                      isAr
                        ? 'اكتب مجالك بدقة، مثلاً: تجارة الدروب شيبينغ، وصفات الحلويات المغربية، الاستثمار العقاري في دبي...'
                        : 'Type your exact niche, e.g. Dropshipping 2026, Moroccan Pastries, Dubai Real Estate Investment...'
                    }
                    className="w-full bg-slate-950 border border-indigo-500/50 rounded-lg p-2.5 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-indigo-500 mt-1"
                    required
                  />
                )}
              </div>

              {/* Topic / Title Prompt */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  {isAr ? 'فكرة أو عنوان المقال *' : 'Article Topic / Title Prompt *'}
                </label>
                <textarea
                  rows={2}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={
                    isAr
                      ? 'مثال: أسرار زيادة مبيعات متجر شوبيفاي في 2026 خطوة بخطوة'
                      : 'e.g. 10 Proven Strategies to Scale Shopify Store Revenue in 2026 with Step-by-Step Guide'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                  required
                />
              </div>

              {/* Featured Image URL Input & Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isAr ? 'رابط الصورة البارزة (Featured Image)' : 'Featured Image URL (Optional)'}</span>
                  </label>
                  {featuredImageUrl && (
                    <span className={`text-[10px] font-mono flex items-center gap-1 ${
                      imageLoadError ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {imageLoadError ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>{isAr ? 'تحقق من الرابط' : 'Check URL'}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{isAr ? 'صورة معتمدة' : 'Image Ready'}</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={featuredImageUrl}
                    onChange={(e) => handleFeaturedImageChange(e.target.value)}
                    placeholder={
                      isAr
                        ? 'ألصق رابط الصورة المباشر (Unsplash أو رابط ينتهي بـ .jpg/.png)...'
                        : 'Paste direct image URL (Unsplash, direct .jpg/.png link)...'
                    }
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-white placeholder-slate-600 font-mono text-[11px] transition-colors"
                  />
                  {featuredImageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setFeaturedImageUrl('');
                        setActiveArticleImage(getDefaultImageForNiche(selectedNicheId));
                        setImageLoadError(false);
                        setImageLoadStatus('idle');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] rounded transition-colors"
                    >
                      {isAr ? 'مسح' : 'Clear'}
                    </button>
                  )}
                </div>

                {/* Quick Niche Image Presets */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{isAr ? '⚡ صور جاهزة عالية الدقة بنقرة واحدة:' : '⚡ Instant 1-Click High-Res Presets:'}</span>
                    <button
                      type="button"
                      onClick={() => handleSelectImagePreset(getDefaultImageForNiche(selectedNicheId))}
                      className="text-indigo-400 hover:text-indigo-300 underline font-medium"
                    >
                      {isAr ? 'صورة المجال الحالي' : 'Current Niche Default'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                    {Object.entries(NICHE_IMAGE_PRESETS).map(([key, item]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectImagePreset(item.url)}
                        className={`px-2 py-1 rounded text-[10px] border transition-all ${
                          featuredImageUrl === item.url
                            ? 'bg-indigo-900/80 border-indigo-500 text-white font-bold'
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {isAr ? item.label_ar : item.label_en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Image Preview Card */}
                {featuredImageUrl && (
                  <div className="mt-2 space-y-1.5">
                    <div className="aspect-video w-full max-h-36 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative shadow-md">
                      <img
                        src={normalizeImageUrl(featuredImageUrl)}
                        alt="Featured Preview"
                        referrerPolicy="no-referrer"
                        onLoad={() => {
                          setImageLoadStatus('loaded');
                          setImageLoadError(false);
                        }}
                        onError={() => {
                          setImageLoadStatus('error');
                          setImageLoadError(true);
                        }}
                        className="w-full h-full object-cover"
                      />
                      {imageLoadStatus === 'loading' && (
                        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-xs text-indigo-300 gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                          <span>{isAr ? 'جاري فحص الصورة...' : 'Loading image preview...'}</span>
                        </div>
                      )}
                    </div>

                    {imageLoadError ? (
                      <div className="p-2 bg-amber-950/40 border border-amber-800/60 rounded-lg text-[11px] text-amber-300 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{isAr ? 'تنبيه: تعذر تحميل الصورة من هذا الرابط' : 'Notice: Unable to load direct image from this URL'}</span>
                        </div>
                        <p className="text-slate-400 text-[10px]">
                          {isAr
                            ? 'تأكد أن الرابط ينتهي بصيغة صورة (.jpg, .png, .webp) وليس صفحة موقع. يمكنك اختيار صورة بنقرة واحدة من الأزرار الجاهزة أعلاه.'
                            : 'Ensure URL points directly to an image (.jpg, .png, .webp) and not a webpage, or select one of the high-res presets above.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSelectImagePreset(getDefaultImageForNiche(selectedNicheId))}
                          className="px-2 py-0.5 bg-amber-900/60 hover:bg-amber-800 border border-amber-700 text-amber-200 rounded text-[10px] font-semibold"
                        >
                          {isAr ? 'استبدال بالصورة الافتراضية للمجال' : 'Use Default Niche Photo'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] text-emerald-400 px-1 font-mono">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{isAr ? 'تم التحقق من الصورة وتجهيزها للمقال' : 'Image loaded & ready for publishing'}</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* YouTube Video Link Input */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                    <span>{isAr ? 'رابط فيديو يوتيوب مرافق للمقال' : 'YouTube Video URL (Optional)'}</span>
                  </span>
                  {detectedYoutubeId && (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>ID: {detectedYoutubeId}</span>
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={youtubeVideoUrl}
                    onChange={(e) => setYoutubeVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white placeholder-slate-600 font-mono text-[11px]"
                  />
                  {youtubeVideoUrl && (
                    <button
                      type="button"
                      onClick={() => setYoutubeVideoUrl('')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {detectedYoutubeId && (
                  <div className="flex items-center gap-2 p-2 bg-slate-950 border border-red-950/60 rounded-lg">
                    <img
                      src={`https://img.youtube.com/vi/${detectedYoutubeId}/hqdefault.jpg`}
                      alt="YouTube Thumbnail"
                      className="w-16 h-10 object-cover rounded border border-slate-800"
                    />
                    <div className="text-[11px] text-slate-300 truncate">
                      <span className="text-red-400 font-bold block">YouTube Video Attached</span>
                      <span className="text-slate-500 font-mono text-[10px] truncate">{youtubeVideoUrl}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isAr ? 'التصنيف الأساسي' : 'Primary Category'}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories.filter((c) => c && (c.name || c.name_ar)).map((c) => (
                      <option key={c.id} value={c.id}>
                        {isAr ? (c.name_ar || c.name) : (c.name || c.name_ar)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isAr ? 'اللغة المستهدفة' : 'Target Language'}
                  </label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs font-medium cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ar">{isAr ? 'عربي فقط (Arabic Only)' : 'Arabic Only (عربي فقط)'}</option>
                    <option value="both">{isAr ? 'ثنائي اللغة (عربي + إنكليزي)' : 'Bilingual (Arabic + English)'}</option>
                    <option value="en">{isAr ? 'إنكليزي فقط (English Only)' : 'English Only (إنكليزي فقط)'}</option>
                    <option value="fr">{isAr ? 'فرنسي فقط (Français Only)' : 'French Only (Français)'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isAr ? 'أسلوب الطرح (Tone)' : 'Tone / Style'}
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="informative">{isAr ? 'معلوماتي وعملي (Informative & Actionable)' : 'Informative & Actionable'}</option>
                    <option value="tutorial">{isAr ? 'دليل تطبيقي خطوة بخطوة (Step-by-Step Guide)' : 'Step-by-Step Guide / Tutorial'}</option>
                    <option value="technical">{isAr ? 'تقني متعمق مع أكواد (Technical & Code-rich)' : 'Technical & Code-rich'}</option>
                    <option value="deep_dive">{isAr ? 'دراسة وتحليل معمق (Deep Dive Analysis)' : 'Deep Dive Analysis'}</option>
                    <option value="engaging">{isAr ? 'مشوّق وسرد قصصي (Engaging & Storytelling)' : 'Engaging & Storytelling'}</option>
                    <option value="marketing">{isAr ? 'تسويقي وإقناعي (Marketing & High CTR)' : 'Marketing & High CTR'}</option>
                    <option value="news">{isAr ? 'أخباري ورائج (Industry News & Trends)' : 'Industry News & Trends'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isAr ? 'حجم المقال' : 'Target Length'}
                  </label>
                  <select
                    value={wordCount}
                    onChange={(e) => setWordCount(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="long">{isAr ? 'شامل ومتعمق (2,500+ كلمة) - Comprehensive' : 'Comprehensive (2,500+ words)'}</option>
                    <option value="epic">{isAr ? 'مرجع كامل ودليل نهائي (4,000+ كلمة) - Ultimate' : 'Ultimate Guide (4,000+ words)'}</option>
                    <option value="medium">{isAr ? 'مفصل ومثالي (1,200 - 1,500 كلمة) - Detailed' : 'Detailed (1,200 - 1,500 words)'}</option>
                    <option value="short">{isAr ? 'سريع وموجز (600 - 800 كلمة) - Quick' : 'Quick (600 - 800 words)'}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">
                  {isAr ? 'تعليمات إضافية (اختياري)' : 'Custom Instructions (Optional)'}
                </label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder={
                    isAr
                      ? 'مثال: ركز على أحدث تقنيات 2026، أضف أمثلة عملية، جدول مقارنة، وخطة تنفيذ واضحة'
                      : 'e.g. Focus on modern 2026 patterns, practical code examples, comparison table, and actionable checklist.'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white placeholder-slate-600 text-xs focus:ring-2 focus:ring-indigo-500"
                />
                {/* Quick Instruction Preset Chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {[
                    { label_ar: '+ جدول مقارنة', label_en: '+ Comparison Table', text: isAr ? 'أضف جدول مقارنة احترافي شامل ومفصل.' : 'Include a detailed, comprehensive comparison table.' },
                    { label_ar: '+ أمثلة برمجية وشرح', label_en: '+ Practical Code', text: isAr ? 'أضف أمثلة برمجية عملية كاملة وقابلة للتطبيق مع شرح وافي.' : 'Include complete, practical, typed code snippets with clear explanations.' },
                    { label_ar: '+ إحصائيات وأرقام', label_en: '+ Stats & Data', text: isAr ? 'دعم المقال بإحصائيات وأرقام دقيقة وحديثة لتعزيز المصداقية.' : 'Support points with recent data, benchmarks, and industry statistics.' },
                    { label_ar: '+ أسئلة شائعة FAQ', label_en: '+ FAQ Section', text: isAr ? 'أضف قسماً مخصصاً للأسئلة الشائعة مع إجابات نموذجية في نهاية المقال.' : 'Include a dedicated FAQ section with clear, authoritative answers.' },
                    { label_ar: '+ خطوات تنفيذية', label_en: '+ Actionable Steps', text: isAr ? 'قدم خطوات تنفيذية عملية قابلة للتطبيق الفوري مع نصائح لتجنب الأخطاء.' : 'Provide an actionable, step-by-step implementation checklist.' },
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomInstructions((prev) => (prev ? `${prev} | ${chip.text}` : chip.text));
                      }}
                      className="px-2 py-0.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 text-[10px] text-slate-400 hover:text-indigo-300 rounded transition-colors"
                    >
                      {isAr ? chip.label_ar : chip.label_en}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{isAr ? `جاري التوليد باستخدام ${selectedModelId}...` : `Generating with ${selectedModelId}...`}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isAr ? `توليد المقال في مجال (${getEffectiveNiche()})` : `Generate Article in (${getEffectiveNiche()})`}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Result Preview & Instant Supabase Actions */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {isAr ? 'معاينة المقال المولد' : 'Generated Article Preview'}
                  </h3>
                </div>
                {usedModel && (
                  <span className="text-[11px] bg-indigo-950 border border-indigo-800 text-indigo-300 px-2.5 py-0.5 rounded-full font-mono">
                    Model: {usedModel}
                  </span>
                )}
              </div>

              {!generatedArticle && !isGenerating && (
                <div className="py-20 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                    <Bot className="w-6 h-6" />
                  </div>
                  <p className="text-slate-400 text-xs font-medium">
                    {isAr
                      ? 'اختر الموضوع واضغط على "توليد المقال" للبدء في كتابة المحتوى والسيو الفوري'
                      : 'Choose your topic and model to generate complete bilingual content with SEO metadata.'}
                  </p>
                </div>
              )}

              {isGenerating && (
                <div className="py-24 text-center space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-white text-xs font-bold">
                      {isAr ? `النموذج ${selectedModelId} يقوم بصياغة المقال الآن...` : `${selectedModelId} is crafting your article...`}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {isAr ? 'يتم توليد العناوين، المحتوى التقني، أمثلة الأكواد، وبيانات الـ SEO' : 'Generating title, deep code samples, markdown content, and structured SEO schema.'}
                    </p>
                  </div>
                </div>
              )}

              {generatedArticle && (
                <div className="space-y-4 mt-4 max-h-[550px] overflow-y-auto pr-2 text-xs">
                  {/* Persistent Published Banner if already saved */}
                  {savedArticleInfo && (
                    <div className="p-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/70 rounded-xl space-y-2.5 shadow-lg shadow-emerald-950/40">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-bold text-emerald-300 text-xs">
                          <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
                          <span>{isAr ? '✅ المقال منشور ومحفوظ في Supabase الآن!' : '✅ Article is Live & Saved in Supabase!'}</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          {savedArticleInfo.timestamp}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className="text-slate-400 truncate font-mono text-[10px]">
                          /article/{savedArticleInfo.slug}
                        </span>
                        <span className="text-emerald-400 font-semibold text-[10px]">
                          {savedArticleInfo.syncedToSupabase ? '✓ Supabase Live DB' : '✓ Local Store Cached'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-900/60">
                        <button
                          type="button"
                          onClick={() => onNavigate?.('article', savedArticleInfo.slug)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isAr ? 'عرض المقال المنشور الآن' : 'View Live Article'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewArticlesTab?.()}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{isAr ? 'الانتقال لقائمة المقالات' : 'Go to Articles List'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Media Preview Card */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{isAr ? 'الوسائط المرفقة بالمقال' : 'Attached Article Media'}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingPreviewImage(!isEditingPreviewImage);
                            setPreviewImageInput(activeArticleImage);
                          }}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
                        >
                          {isEditingPreviewImage ? (isAr ? 'إلغاء' : 'Cancel') : (isAr ? '✏️ تغيير الصورة' : '✏️ Change Image')}
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {detectedYoutubeId ? '1 Image + 1 Video' : '1 Featured Image'}
                        </span>
                      </div>
                    </div>

                    {/* Inline Image Change Box if user wants to swap image right here */}
                    {isEditingPreviewImage && (
                      <div className="p-2.5 bg-slate-900 border border-indigo-500/40 rounded-lg space-y-2">
                        <label className="text-[10px] text-indigo-300 font-semibold block">
                          {isAr ? 'ألصق رابط صورة جديد أو اختر من القوالب:' : 'Paste new image URL or pick preset:'}
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={previewImageInput}
                            onChange={(e) => setPreviewImageInput(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-mono text-[10px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const norm = normalizeImageUrl(previewImageInput.trim());
                              if (norm) {
                                setActiveArticleImage(norm);
                                setFeaturedImageUrl(norm);
                                setIsEditingPreviewImage(false);
                              }
                            }}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold shrink-0 cursor-pointer"
                          >
                            {isAr ? 'تطبيق' : 'Apply'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(NICHE_IMAGE_PRESETS).slice(0, 6).map(([key, item]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setPreviewImageInput(item.url);
                                setActiveArticleImage(item.url);
                                setFeaturedImageUrl(item.url);
                                setIsEditingPreviewImage(false);
                              }}
                              className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 text-[9px] text-slate-400 hover:text-white rounded"
                            >
                              {isAr ? item.label_ar : item.label_en}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Featured Image */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                          <span>{isAr ? 'الصورة البارزة:' : 'Featured Image:'}</span>
                          <span className="text-[9px] text-emerald-400 font-mono">Live</span>
                        </span>
                        <div className="aspect-[16/9] rounded-lg overflow-hidden border border-slate-800 bg-slate-900 relative">
                          <img
                            src={activeArticleImage || getDefaultImageForNiche(selectedNicheId)}
                            alt="Featured"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getDefaultImageForNiche(selectedNicheId);
                            }}
                          />
                        </div>
                      </div>

                      {/* YouTube Video Preview if present */}
                      {detectedYoutubeId ? (
                        <div className="space-y-1">
                          <span className="text-[10px] text-red-400 font-medium flex items-center gap-1">
                            <Youtube className="w-3 h-3" />
                            <span>{isAr ? 'فيديو يوتيوب المرفق:' : 'Attached YouTube Video:'}</span>
                          </span>
                          <div className="aspect-[16/9] rounded-lg overflow-hidden border border-red-900/50 bg-black relative">
                            <iframe
                              src={`https://www.youtube.com/embed/${detectedYoutubeId}`}
                              title="YouTube Video Preview"
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[16/9] rounded-lg border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-center p-2">
                          <Youtube className="w-5 h-5 text-slate-600 mb-1" />
                          <span className="text-[10px]">{isAr ? 'لا يوجد فيديو يوتيوب مرفق' : 'No YouTube video attached'}</span>
                          <span className="text-[9px] text-slate-600">{isAr ? '(يمكنك إضافة رابط يوتيوب في النموذج)' : '(Add URL in form to attach)'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* English Version */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-indigo-400 font-bold uppercase">
                      <span>English Version</span>
                      <button
                        onClick={() => copyToClipboard(generatedArticle.content_en, 'content_en')}
                        className="text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'content_en' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'content_en' ? 'Copied' : 'Copy Content'}</span>
                      </button>
                    </div>
                    <h4 className="text-white font-bold text-sm">{generatedArticle.title_en}</h4>
                    <p className="text-slate-400 italic text-[11px]">{generatedArticle.excerpt_en}</p>
                    <div className="text-slate-300 font-mono bg-slate-900/90 p-3 rounded-lg text-[11px] max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {generatedArticle.content_en}
                    </div>
                  </div>

                  {/* Arabic Version */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-right" dir="rtl">
                    <div className="flex items-center justify-between text-[11px] text-indigo-400 font-bold uppercase">
                      <span>النسخة العربية</span>
                      <button
                        onClick={() => copyToClipboard(generatedArticle.content_ar, 'content_ar')}
                        className="text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'content_ar' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'content_ar' ? 'تم النسخ' : 'نسخ المحتوى'}</span>
                      </button>
                    </div>
                    <h4 className="text-white font-bold text-sm">{generatedArticle.title_ar}</h4>
                    <p className="text-slate-400 italic text-[11px]">{generatedArticle.excerpt_ar}</p>
                    <div className="text-slate-300 font-mono bg-slate-900/90 p-3 rounded-lg text-[11px] max-h-36 overflow-y-auto whitespace-pre-wrap text-right">
                      {generatedArticle.content_ar}
                    </div>
                  </div>

                  {/* Generated SEO Card */}
                  <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3 text-[11px] space-y-1.5">
                    <div className="font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Generated SEO & Search Data</span>
                    </div>
                    <div><strong className="text-slate-400">Meta Title:</strong> {generatedArticle.seo?.meta_title}</div>
                    <div><strong className="text-slate-400">Meta Description:</strong> {generatedArticle.seo?.meta_description}</div>
                    <div><strong className="text-slate-400">Slug:</strong> <code className="text-indigo-400 font-mono">{generatedArticle.slug}</code></div>
                    {generatedArticle.tags_suggestion && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {generatedArticle.tags_suggestion.map((tag, idx) => (
                          <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            {generatedArticle && (
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={handleOpenInEditor}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>{isAr ? 'فتح في محرر المقالات للتعديل' : 'Open in Article Editor'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveToSupabase('draft')}
                    disabled={isSaving}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isAr ? 'حفظ كمسودة' : 'Save as Draft'}</span>
                  </button>

                  <button
                    onClick={() => handleSaveToSupabase('published')}
                    disabled={isSaving}
                    className={`px-4 py-2 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all cursor-pointer ${
                      savedArticleInfo?.status === 'published'
                        ? 'bg-emerald-700 hover:bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-emerald-900/50'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>{isAr ? 'جاري النشر في Supabase...' : 'Publishing to Supabase...'}</span>
                      </>
                    ) : savedArticleInfo?.status === 'published' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        <span>{isAr ? '✓ منشور في Supabase (تحديث)' : '✓ Published in Supabase (Update)'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isAr ? 'نشر فوري في Supabase' : 'Publish to Supabase'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOOL 2: SEO & FAQ SCHEMA GENERATOR */}
      {studioTool === 'seo_generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>{isAr ? 'توليد بيانات السيو و Schema.org' : 'SEO & Schema Generator'}</span>
            </h3>

            <form onSubmit={handleGenerateSeoSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isAr ? 'عنوان المقال' : 'Article Title'}
                </label>
                <input
                  type="text"
                  value={seoTitleInput}
                  onChange={(e) => setSeoTitleInput(e.target.value)}
                  placeholder="e.g. Next.js 15 Server Actions with Supabase RLS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isAr ? 'نص أو ملخص المقال' : 'Article Text or Excerpt'}
                </label>
                <textarea
                  rows={4}
                  value={seoContentInput}
                  onChange={(e) => setSeoContentInput(e.target.value)}
                  placeholder="Paste article content or summary to extract high-ranking keywords..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isGeneratingSeo}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs"
              >
                {isGeneratingSeo ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
                <span>{isAr ? `توليد السيو بواسطة ${currentModel.shortName}` : `Generate SEO via ${currentModel.shortName}`}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 mb-4">
              {isAr ? 'النتائج وبيانات Structured Data' : 'SEO Results & JSON-LD FAQ Schema'}
            </h3>

            {generatedSeo ? (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div><strong className="text-indigo-400">Meta Title:</strong> {generatedSeo.meta_title}</div>
                  <div><strong className="text-indigo-400">Meta Description:</strong> {generatedSeo.meta_description}</div>
                  <div><strong className="text-indigo-400">Suggested Slug:</strong> <code className="text-emerald-400">{generatedSeo.suggested_slug}</code></div>
                  <div>
                    <strong className="text-indigo-400">Focus Keywords:</strong>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {generatedSeo.focus_keywords?.map((k: string, i: number) => (
                        <span key={i} className="bg-indigo-950 border border-indigo-800 text-indigo-300 px-2 py-0.5 rounded text-[11px]">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {generatedSeo.faq_schema && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-white font-bold text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Schema.org FAQ Questions</span>
                    </h4>
                    {generatedSeo.faq_schema.map((faq: any, i: number) => (
                      <div key={i} className="p-2.5 bg-slate-900 rounded-lg text-[11px]">
                        <p className="text-indigo-300 font-bold">Q: {faq.question}</p>
                        <p className="text-slate-300 mt-1">A: {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-xs py-16 text-center">
                {isAr ? 'أدخل عنوان ونص المقال واضغط على توليد لعرض النتائج' : 'Fill in the form to generate optimized meta tags and Schema FAQ snippets.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* TOOL 3: ENHANCER & TRANSLATOR */}
      {studioTool === 'enhancer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>{isAr ? 'تحسين وترجمة النصوص' : 'Enhance & Translate Content'}</span>
            </h3>

            <form onSubmit={handleEnhanceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isAr ? 'العملية المطلوبة' : 'Action'}
                </label>
                <select
                  value={enhanceAction}
                  onChange={(e) => setEnhanceAction(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="translate_ar">Translate to Arabic (ترجمة احترافية للعربية)</option>
                  <option value="translate_en">Translate to English (ترجمة دقيقة للإنكليزية)</option>
                  <option value="expand">Expand & Elaborate (توسيع المحتوى وإضافة شروحات)</option>
                  <option value="add_code">Add Typed Code Examples (إضافة أمثلة برمجية)</option>
                  <option value="improve">Polish & Fix Grammar (تحسين الصياغة والأسلوب)</option>
                  <option value="summarize">Summarize into Key Takeaways (تلخيص سريع)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isAr ? 'النص الأصلي' : 'Input Content / Paragraph'}
                </label>
                <textarea
                  rows={6}
                  value={enhanceInput}
                  onChange={(e) => setEnhanceInput(e.target.value)}
                  placeholder="Paste Markdown, code snippets, or text to process..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isEnhancing}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs"
              >
                {isEnhancing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isAr ? `تنفيذ العملية عبر ${currentModel.shortName}` : `Process with ${currentModel.shortName}`}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {isAr ? 'النتيجة المحسنة' : 'Enhanced Output'}
              </h3>
              {enhanceResult && (
                <button
                  onClick={() => copyToClipboard(enhanceResult, 'enhanced_output')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'enhanced_output' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'enhanced_output' ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {enhanceResult ? (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono whitespace-pre-wrap max-h-[450px] overflow-y-auto">
                {enhanceResult}
              </div>
            ) : (
              <p className="text-slate-500 text-xs py-16 text-center">
                {isAr ? 'النتيجة ستظهر هنا بعد المعالجة' : 'Enhanced output will appear here.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* TOOL 4: KEYWORD & INTENT PLANNER */}
      {studioTool === 'keyword_planner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>{isAr ? 'مخطط الكلمات والنية البحثية' : 'SEO Keyword & Search Intent Planner'}</span>
            </h3>

            <form onSubmit={handleGenerateKeywordsSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isAr ? 'الموضوع أو الكلمة المفتاحية الأساسية (بذرة البحث)' : 'Enter Seed Topic / Core Keyword'}
                </label>
                <input
                  type="text"
                  value={keywordTopicInput}
                  onChange={(e) => setKeywordTopicInput(e.target.value)}
                  placeholder={isAr ? "مثال: Supabase Vector" : "e.g. Supabase Vector RAG"}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  {isAr
                    ? 'سيقوم نموذج Gemini بتحليل الكلمة وتوليد الكلمات الطويلة (Long-tail) ومقترحات الأسئلة وتحديد نوع نية البحث الملائمة.'
                    : 'Gemini will map out long-tail high-intent keywords, relevant user questions, and classify the primary search intent.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isGeneratingKeywords}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs"
              >
                {isGeneratingKeywords ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                )}
                <span>{isAr ? `توليد خطة الكلمات عبر ${currentModel.shortName}` : `Plan Keywords with ${currentModel.shortName}`}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {isAr ? 'خريطة الكلمات المفتاحية والنية البحثية' : 'Target Keyword Map & Content Strategy'}
              </h3>
              {generatedKeywords && (
                <button
                  onClick={() => {
                    // Populate generator values
                    setTopic(generatedKeywords.main_keyword);
                    setTargetLang(isAr ? 'ar' : 'en');
                    setCustomInstructions(`Write this article targeting primary focus keyword: "${generatedKeywords.main_keyword}".\nInclude answers to these user question queries in the FAQ section or main body:\n${generatedKeywords.question_queries.map((q: string) => "- " + q).join('\n')}\nAlso address these long-tail terms:\n${generatedKeywords.long_tail_keywords.join(', ')}`);
                    
                    // Match Tone to search intent
                    if (generatedKeywords.search_intent_type.toLowerCase().includes('tutorial')) {
                      setTone('tutorial');
                    } else if (generatedKeywords.search_intent_type.toLowerCase().includes('beginner')) {
                      setTone('informative');
                    } else {
                      setTone('deep_dive');
                    }
                    
                    // Switch to Article Generator Tool
                    setStudioTool('article_generator');
                    showFeedback('success', isAr ? 'تم استيراد خطة الكلمات إلى مولد المقالات بنجاح!' : 'Keyword strategy successfully loaded into Article Generator!');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Import keyword plan directly into the Article Generator"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>{isAr ? 'استيراد وكتابة مقال الآن' : 'Create Article with Plan'}</span>
                </button>
              )}
            </div>

            {generatedKeywords ? (
              <div className="space-y-4 text-xs">
                {/* Intent & Main Keyword */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <p className="text-[10px] text-slate-500 font-mono uppercase">Primary Keyword</p>
                    <p className="text-sm font-bold text-white mt-0.5">{generatedKeywords.main_keyword}</p>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <p className="text-[10px] text-slate-500 font-mono uppercase">Classified Search Intent</p>
                    <p className="text-sm font-bold text-indigo-400 mt-0.5">{generatedKeywords.search_intent_type}</p>
                  </div>
                </div>

                {/* Long Tail List */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="text-white font-bold text-xs flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>High-Intent Long-Tail Keyphrases</span>
                  </h4>
                  <div className="space-y-1.5">
                    {generatedKeywords.long_tail_keywords.map((kw: string, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded">
                        <span className="font-mono text-slate-300 text-[11px]">{kw}</span>
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold font-mono">Organic Opportunity</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ Questions */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="text-white font-bold text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Searcher Question Queries (Perfect for FAQ Schema)</span>
                  </h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px] leading-relaxed">
                    {generatedKeywords.question_queries.map((q: string, i: number) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>

                {/* Related Topics */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="text-white font-bold text-xs">Recommended Contextual Topics</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedKeywords.related_topics.map((topic: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-400 rounded text-[11px]">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 space-y-3">
                <Compass className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
                  {isAr
                    ? 'أدخل الكلمة الأساسية واضغط على توليد لتخطيط السيو والكلمات الطويلة ونية البحث قبل إنشاء المحتوى.'
                    : 'Enter your core topic and click Plan to establish search intents, question maps, and long-tail keys before writing.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
