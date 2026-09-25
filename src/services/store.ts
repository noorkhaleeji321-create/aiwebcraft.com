import { Article, ArticleStatus, Author, Category, Media, SeoMetadata, Tag, User, Video } from '../types/blog';
import { getSupabaseClient } from '../lib/supabase';
import { encryptVaultData, decryptVaultData } from '../lib/cipher';

// Helper for generating standard RFC4122 v4 UUIDs
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUUID(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}

export function extractYoutubeId(url?: string): string {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (match && match[1]) return match[1];
  if (/^[\w-]{11}$/.test(url.trim())) return url.trim();
  return '';
}

// Normalizes image URLs from various web sources (Google Images, Google Drive, Unsplash, Pexels, Imgur, raw protocols, HTML img tags)
export function normalizeImageUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  // Strip enclosing quotes or brackets
  url = url.replace(/^["'\[\(]|["'\]\)]$/g, '').trim();
  if (!url) return '';

  // Handle pasted HTML tags: e.g. <img src="https://..." />
  const imgTagMatch = url.match(/src=["']([^"']+)["']/i);
  if (imgTagMatch && imgTagMatch[1]) {
    url = imgTagMatch[1].trim();
  }

  // Handle Data URLs directly
  if (url.startsWith('data:image/')) return url;

  // 1. Google Images & Search URLs (Extract direct image target)
  if (url.includes('google.')) {
    // Check for imgurl parameter in query string
    const imgUrlParam = url.match(/[?&]imgurl=([^&]+)/i);
    if (imgUrlParam && imgUrlParam[1]) {
      try {
        const decoded = decodeURIComponent(imgUrlParam[1]);
        if (decoded.startsWith('http')) return decoded;
      } catch (_) {}
    }

    // Check for generic url= parameter in Google search redirects
    const urlParam = url.match(/[?&]url=([^&]+)/i);
    if (urlParam && urlParam[1]) {
      try {
        const decoded = decodeURIComponent(urlParam[1]);
        if (decoded.match(/\.(jpeg|jpg|png|gif|webp|svg)/i) || decoded.includes('images') || decoded.includes('photo')) {
          return decoded;
        }
      } catch (_) {}
    }

    // Handle Google Encrypted Thumbnails (e.g. https://encrypted-tbn0.gstatic.com/images?q=tbn:...)
    if (url.includes('gstatic.com/images')) {
      return url;
    }

    // Handle Google Drive view/share links (e.g. https://drive.google.com/file/d/FILE_ID/view)
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
    }
  }

  // 2. Unsplash webpage URLs (e.g. https://unsplash.com/photos/xyz123)
  const unsplashWebMatch = url.match(/unsplash\.com\/(?:[a-z]{2}\/)?(?:photos|fotos)\/(?:[\w-]+-)?([a-zA-Z0-9_-]{8,})/i);
  if (unsplashWebMatch && unsplashWebMatch[1]) {
    const photoId = unsplashWebMatch[1];
    return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=80`;
  }

  // 3. Pexels page URL: e.g. https://www.pexels.com/photo/title-123456/
  const pexelsMatch = url.match(/pexels\.com\/photo\/(?:[\w-]+-)?(\d+)/i);
  if (pexelsMatch && pexelsMatch[1]) {
    return `https://images.pexels.com/photos/${pexelsMatch[1]}/pexels-photo-${pexelsMatch[1]}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
  }

  // 4. Imgur webpage URL: https://imgur.com/xyz123
  const imgurMatch = url.match(/imgur\.com\/([a-zA-Z0-9]{5,8})$/i);
  if (imgurMatch && imgurMatch[1]) {
    return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
  }

  // Missing protocol (e.g. "images.unsplash.com/photo-...")
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('.') && url.indexOf('.') < url.indexOf('/')) {
      url = `https://${url}`;
    } else if (url.startsWith('//')) {
      url = `https:${url}`;
    }
  }

  return url;
}

// Seed Users with Valid UUIDs
export const SEED_USERS: User[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'tarik@aiwebcrafter.dev',
    full_name: 'Tarik Cherak',
    role: 'admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'sara@aiwebcrafter.dev',
    full_name: 'Dr. Sara Al-Hassan',
    role: 'author',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  }
];

// Seed Authors with Valid UUIDs
export const SEED_AUTHORS: Author[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    user_id: '00000000-0000-4000-8000-000000000001',
    name: 'Tarik Cherak',
    name_ar: 'طارق شراك',
    slug: 'tarik-cherak',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Senior Full-Stack Architect & AI Specialist. Passionate about building high-performance web applications and LLM agentic workflows.',
    bio_ar: 'مهندس برمجيات أول ومتخصص في الذكاء الاصطناعي. شغوف بإنشاء تطبيقات الويب عالية الأداء وأنظمة الوكلاء المعتمدة على LLM.',
    role_title: 'Lead AI Engineer & Author',
    role_title_ar: 'قائد مهندسي الذكاء الاصطناعي وكاتب',
    twitter: 'https://twitter.com',
    github: 'https://github.com',
    website: 'https://aiwebcrafter.com',
    created_at: '2026-09-01T00:00:00.000Z'
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    user_id: '00000000-0000-4000-8000-000000000002',
    name: 'Dr. Sara Al-Hassan',
    name_ar: 'د. سارة الحسن',
    slug: 'sara-alhassan',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    bio: 'AI Researcher and Cloud Systems Architect specializing in Supabase PostgreSQL, RAG architectures, and vector embeddings.',
    bio_ar: 'باحثة في الذكاء الاصطناعي ومهندسة أنظمة سحابية متخصصة في قواعد بيانات Supabase PostgreSQL ومعمارية RAG.',
    role_title: 'Cloud Architect & Technical Editor',
    role_title_ar: 'مهندسة سحابية ومحررة تقنية',
    twitter: 'https://twitter.com',
    github: 'https://github.com',
    website: 'https://aiwebcrafter.com',
    created_at: '2026-09-01T00:00:00.000Z'
  }
];

// Seed Categories - Minimal starting set
export const SEED_CATEGORIES: Category[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    name: 'General',
    name_ar: 'عام',
    slug: 'general',
    description: 'General articles and news.',
    description_ar: 'مقالات عامة وأخبار.',
    icon: 'Folder',
    created_at: '2026-09-01T00:00:00.000Z'
  }
];

// Seed Tags
export const SEED_TAGS: Tag[] = [];

// Seed Videos
export const SEED_VIDEOS: Video[] = [];

// Seed Articles
export const SEED_ARTICLES: Article[] = [];

// Seed Media
export const SEED_MEDIA: Media[] = [];

class StoreService {
  private articles: Article[] = [];
  private categories: Category[] = [];
  private tags: Tag[] = [];
  private videos: Video[] = [];
  private media: Media[] = [];
  private authors: Author[] = [];
  private listeners: (() => void)[] = [];
  private isSeedingSupabase = false;

  constructor() {
    this.initLocalStore();
    // Auto-sync Supabase in background
    setTimeout(() => {
      this.ensureSupabaseSeededAndSynced().catch(() => {});
    }, 1000);
  }

  private initLocalStore() {
    if (typeof window !== 'undefined') {
      // Clear legacy storage if exists to ensure a clean slate
      if (localStorage.getItem('aiwebcrafter_articles')) {
        const legacyKeys = ['aiwebcrafter_articles', 'aiwebcrafter_categories', 'aiwebcrafter_tags', 'aiwebcrafter_videos', 'aiwebcrafter_media', 'aiwebcrafter_authors'];
        legacyKeys.forEach(k => localStorage.removeItem(k));
      }

      const storedArticles = localStorage.getItem('blog_v2_articles');
      const storedCats = localStorage.getItem('blog_v2_categories');
      const storedTags = localStorage.getItem('blog_v2_tags');
      const storedVideos = localStorage.getItem('blog_v2_videos');
      const storedMedia = localStorage.getItem('blog_v2_media');
      const storedAuthors = localStorage.getItem('blog_v2_authors');

      const parsedArticles = storedArticles ? JSON.parse(storedArticles) : [];
      const parsedCats = storedCats ? JSON.parse(storedCats) : [];
      const parsedTags = storedTags ? JSON.parse(storedTags) : [];
      const parsedVideos = storedVideos ? JSON.parse(storedVideos) : [];
      const parsedMedia = storedMedia ? JSON.parse(storedMedia) : [];
      const parsedAuthors = storedAuthors ? JSON.parse(storedAuthors) : [];

      this.articles = parsedArticles.length > 0 ? parsedArticles : SEED_ARTICLES;
      this.categories = parsedCats.length > 0 ? parsedCats : SEED_CATEGORIES;
      this.tags = parsedTags.length > 0 ? parsedTags : SEED_TAGS;
      this.videos = parsedVideos.length > 0 ? parsedVideos : SEED_VIDEOS;
      this.media = parsedMedia.length > 0 ? parsedMedia : SEED_MEDIA;
      this.authors = parsedAuthors.length > 0 ? parsedAuthors : SEED_AUTHORS;
    } else {
      this.articles = SEED_ARTICLES;
      this.categories = SEED_CATEGORIES;
      this.tags = SEED_TAGS;
      this.videos = SEED_VIDEOS;
      this.media = SEED_MEDIA;
      this.authors = SEED_AUTHORS;
    }
  }

  private saveLocal() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('blog_v2_articles', JSON.stringify(this.articles));
      localStorage.setItem('blog_v2_categories', JSON.stringify(this.categories));
      localStorage.setItem('blog_v2_tags', JSON.stringify(this.tags));
      localStorage.setItem('blog_v2_videos', JSON.stringify(this.videos));
      localStorage.setItem('blog_v2_media', JSON.stringify(this.media));
      localStorage.setItem('blog_v2_authors', JSON.stringify(this.authors));
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private getLoggedInUser(): User | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('aiwebcrafter_active_auth_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  private async getLoggedInAuthorId(userId: string): Promise<string | null> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('authors')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        if (!error && data) {
          return data.id;
        }
      } catch (_) {}
    }
    const foundLocal = this.authors.find((a) => a.user_id === userId);
    return foundLocal ? foundLocal.id : null;
  }

  // ==========================================================================
  // AUTO SUPABASE SEEDING & SYNC
  // ==========================================================================

  public async ensureSupabaseSeededAndSynced(): Promise<{ success: boolean; message: string; count?: number; details?: any }> {
    const client = getSupabaseClient();
    if (!client || this.isSeedingSupabase) {
      return { success: false, message: 'Supabase client unavailable. Please check your Supabase URL & Anon Key.' };
    }

    this.isSeedingSupabase = true;
    try {
      // 1. Ensure users exist
      try {
        if (SEED_USERS && SEED_USERS.length > 0) {
          await client.from('users').upsert(SEED_USERS, { onConflict: 'email' });
        }
      } catch (uErr) {
        console.warn('Notice seeding users table:', uErr);
      }

      // 2. Ensure categories exist
      try {
        await client.from('categories').upsert(SEED_CATEGORIES, { onConflict: 'slug' });
      } catch (cErr) {
        console.warn('Notice seeding categories table:', cErr);
      }

      // 3. Ensure tags exist
      try {
        await client.from('tags').upsert(SEED_TAGS, { onConflict: 'slug' });
      } catch (tErr) {
        console.warn('Notice seeding tags table:', tErr);
      }

      // 4. Ensure seed authors exist
      try {
        if (SEED_AUTHORS && SEED_AUTHORS.length > 0) {
          await client.from('authors').upsert(SEED_AUTHORS.map(a => ({
            id: a.id,
            user_id: a.user_id,
            name: a.name,
            name_ar: a.name_ar,
            slug: a.slug,
            avatar_url: a.avatar_url,
            bio: a.bio,
            bio_ar: a.bio_ar,
            role_title: a.role_title,
            role_title_ar: a.role_title_ar
          })), { onConflict: 'slug' });
        }
      } catch (aErr) {
        console.warn('Notice seeding authors table:', aErr);
      }

      // 5. Sync all articles to Supabase
      let syncedCount = 0;
      let lastError: string | null = null;
      for (const art of this.articles) {
        const res = await this.saveArticle(art, true);
        if (res.syncedToSupabase) {
          syncedCount++;
        } else if (res.error) {
          lastError = res.error;
        }
      }

      if (syncedCount > 0 || this.articles.length === 0) {
        return {
          success: true,
          message: `Successfully synchronized ${syncedCount} articles, categories, tags, and authors directly into Supabase!`,
          count: syncedCount
        };
      } else {
        return {
          success: false,
          message: `Could not save articles to Supabase. Database returned: ${lastError || 'Check Supabase SQL table schema'}`
        };
      }
    } catch (e: any) {
      console.error('Sync failed:', e);
      return { success: false, message: e?.message || 'Sync failed' };
    } finally {
      this.isSeedingSupabase = false;
    }
  }

  // ==========================================================================
  // ARTICLE CRUD & QUERIES
  // ==========================================================================

  public async getArticles(options?: {
    status?: ArticleStatus | 'all';
    categorySlug?: string;
    tagSlug?: string;
    searchQuery?: string;
    onlyFeatured?: boolean;
  }): Promise<Article[]> {
    const client = getSupabaseClient();
    const nowIso = new Date().toISOString();

    if (client) {
      try {
        let query = client.from('articles').select(`
          *,
          author:authors(*),
          category:categories(*),
          article_tags(tag:tags(*)),
          article_videos(video:videos(*))
        `);

        if (options?.status && options.status !== 'all') {
          query = query.eq('status', options.status);
        } else if (!options?.status) {
          query = query.eq('status', 'published').lte('publish_date', nowIso);
        }

        const loggedUser = this.getLoggedInUser();
        if (loggedUser && loggedUser.role === 'author' && options?.status === 'all') {
          const authId = await this.getLoggedInAuthorId(loggedUser.id);
          if (authId) {
            query = query.eq('author_id', authId);
          } else {
            return [];
          }
        }

        if (options?.onlyFeatured) {
          query = query.eq('is_featured', true);
        }

        const { data, error } = await query.order('publish_date', { ascending: false });

        if (!error && data && data.length > 0) {
          // Fetch SEO separately for robust polymorphic compatibility
          const articleIds = data.map((a: any) => a.id);
          const { data: seoData } = await client
            .from('seo_metadata')
            .select('*')
            .eq('entity_type', 'article')
            .in('entity_id', articleIds);

          const mappedArticles: Article[] = data.map((art: any) => {
            const tags = (art.article_tags || []).map((at: any) => at.tag).filter(Boolean);
            const videos = (art.article_videos || []).map((av: any) => av.video).filter(Boolean);
            const seo = seoData ? seoData.find((s: any) => s.entity_id === art.id) : null;

            return {
              ...art,
              author: art.author || this.authors[0] || SEED_AUTHORS[0],
              category: art.category || this.categories.find((c) => c.id === art.category_id) || SEED_CATEGORIES[0],
              tags: tags.length > 0 ? tags : (art.tags || [SEED_TAGS[0]]),
              videos: videos.length > 0 ? videos : (art.videos || []),
              seo: seo || {
                id: generateUUID(),
                entity_type: 'article',
                entity_id: art.id,
                seo_title: art.title,
                seo_title_ar: art.title_ar,
                seo_description: art.excerpt,
                seo_description_ar: art.excerpt_ar,
                canonical_url: `https://aiwebcrafter.com/article/${art.slug}`,
                keywords: ['AI', 'Web Dev', 'Supabase'],
                keywords_ar: ['ذكاء اصطناعي', 'تطوير الويب'],
                noindex: false,
                created_at: art.created_at,
                updated_at: art.updated_at,
              }
            };
          });

          // In-memory filter for category / tag / search if relations queried
          let result = mappedArticles;
          if (options?.categorySlug) {
            result = result.filter((a) => a.category?.slug === options.categorySlug || a.category_id === options.categorySlug);
          }
          if (options?.tagSlug) {
            result = result.filter((a) => a.tags?.some((t) => t.slug === options.tagSlug));
          }
          if (options?.searchQuery) {
            const q = options.searchQuery.toLowerCase();
            result = result.filter(
              (a) =>
                a.title.toLowerCase().includes(q) ||
                a.title_ar.toLowerCase().includes(q) ||
                a.excerpt.toLowerCase().includes(q) ||
                a.excerpt_ar.toLowerCase().includes(q)
            );
          }

          // Cache in local store
          this.articles = mappedArticles;
          return result;
        } else if (error) {
          console.warn('Supabase getArticles query notice:', error.message);
        }
      } catch (e) {
        console.warn('Supabase article fetch exception, using local store fallback:', e);
      }
    }

    // Local fallback
    const now = new Date();
    let filtered = [...this.articles];

    const localUser = this.getLoggedInUser();
    if (localUser && localUser.role === 'author' && options?.status === 'all') {
      const myAuthor = this.authors.find((a) => a.user_id === localUser.id);
      if (myAuthor) {
        filtered = filtered.filter((a) => a.author_id === myAuthor.id);
      } else {
        filtered = [];
      }
    }

    if (options?.status && options.status !== 'all') {
      filtered = filtered.filter((a) => a.status === options.status);
    } else if (!options?.status) {
      filtered = filtered.filter((a) => a.status === 'published' && new Date(a.publish_date) <= now);
    }

    if (options?.onlyFeatured) {
      filtered = filtered.filter((a) => a.is_featured);
    }

    if (options?.categorySlug) {
      filtered = filtered.filter((a) => a.category?.slug === options.categorySlug || a.category_id === options.categorySlug);
    }

    if (options?.tagSlug) {
      filtered = filtered.filter((a) => a.tags?.some((t) => t.slug === options.tagSlug));
    }

    if (options?.searchQuery) {
      const q = options.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.title_ar.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.excerpt_ar.toLowerCase().includes(q)
      );
    }

    return filtered;
  }

  public async getArticleBySlug(slug: string): Promise<Article | null> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('articles')
          .select(`
            *,
            author:authors(*),
            category:categories(*),
            article_tags(tag:tags(*)),
            article_videos(video:videos(*))
          `)
          .eq('slug', slug)
          .single();

        if (!error && data) {
          // Fetch SEO metadata separately for robust polymorphic compatibility
          const { data: seoData } = await client
            .from('seo_metadata')
            .select('*')
            .eq('entity_type', 'article')
            .eq('entity_id', data.id)
            .maybeSingle();

          const tags = (data.article_tags || []).map((at: any) => at.tag).filter(Boolean);
          const videos = (data.article_videos || []).map((av: any) => av.video).filter(Boolean);
          const seo = seoData;

          return {
            ...data,
            author: data.author || this.authors[0] || SEED_AUTHORS[0],
            category: data.category || this.categories.find((c) => c.id === data.category_id) || SEED_CATEGORIES[0],
            tags: tags.length > 0 ? tags : [SEED_TAGS[0]],
            videos: videos.length > 0 ? videos : [],
            seo: seo || {
              id: generateUUID(),
              entity_type: 'article',
              entity_id: data.id,
              seo_title: data.title,
              seo_title_ar: data.title_ar,
              seo_description: data.excerpt,
              seo_description_ar: data.excerpt_ar,
              canonical_url: `https://aiwebcrafter.com/article/${data.slug}`,
              keywords: ['AI', 'Web Dev', 'Supabase'],
              keywords_ar: ['ذكاء اصطناعي', 'تطوير الويب'],
              noindex: false,
              created_at: data.created_at,
              updated_at: data.updated_at,
            }
          };
        }
      } catch (e) {
        console.warn('Falling back to local store for article slug:', slug);
      }
    }

    const art = this.articles.find((a) => a.slug === slug);
    if (art) {
      return {
        ...art,
        author: this.authors.find((au) => au.id === art.author_id) || SEED_AUTHORS[0],
        category: this.categories.find((c) => c.id === art.category_id) || SEED_CATEGORIES[0],
      };
    }
    return null;
  }

  public async saveArticle(
    article: Partial<Article>,
    isBackgroundSync = false
  ): Promise<{ success: boolean; data?: Article; error?: string; syncedToSupabase?: boolean }> {
    const client = getSupabaseClient();
    const nowIso = new Date().toISOString();

    const loggedUser = this.getLoggedInUser();
    if (!isBackgroundSync && loggedUser && loggedUser.role === 'author') {
      const myAuthorId = await this.getLoggedInAuthorId(loggedUser.id);
      if (myAuthorId) {
        article.author_id = myAuthorId;
      }
    }

    // Default author resolution
    if (!article.author_id && this.authors.length > 0) {
      article.author_id = this.authors[0].id;
    }

    // 🛡️ Resolve Slug & ID Conflict to eliminate duplicate key error 23505
    let targetArticleId = isValidUUID(article.id) ? (article.id as string) : null;
    let targetSlug = (article.slug || `article-${Date.now().toString(36)}`).trim();

    // Clean slug for URL safety (ASCII & Arabic letters, numbers, hyphens)
    targetSlug = targetSlug
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '') || `article-${Date.now().toString(36)}`;

    if (client) {
      try {
        let isSlugTaken = true;
        let slugAttempts = 0;
        while (isSlugTaken && slugAttempts < 5) {
          const { data: slugCheck } = await client
            .from('articles')
            .select('id, slug')
            .eq('slug', targetSlug)
            .maybeSingle();

          if (slugCheck) {
            if (!targetArticleId) {
              // If new article collides with an existing article, make this new article's slug unique
              slugAttempts++;
              targetSlug = `${targetSlug.slice(0, 35)}-${Math.random().toString(36).substring(2, 6)}-${Date.now().toString(36).slice(-3)}`;
            } else if (targetArticleId === slugCheck.id) {
              // Updating the same article, slug is fine
              isSlugTaken = false;
            } else {
              // Another article already owns this slug! Make this article's slug unique
              slugAttempts++;
              targetSlug = `${targetSlug.slice(0, 35)}-${Math.random().toString(36).substring(2, 6)}-${Date.now().toString(36).slice(-3)}`;
            }
          } else {
            isSlugTaken = false;
          }
        }
      } catch (_) {}
    }

    if (!targetArticleId) {
      const localSlugMatch = this.articles.find((a) => a && a.slug === targetSlug);
      if (localSlugMatch && (!article.id || article.id === localSlugMatch.id)) {
        targetArticleId = localSlugMatch.id;
      } else {
        targetArticleId = isValidUUID(article.id) ? (article.id as string) : generateUUID();
      }
    }

    const rawTags = Array.isArray(article.tags) ? article.tags : [];
    const sanitizedTags: Tag[] = rawTags
      .filter(Boolean)
      .map((t: any, idx: number) => {
        if (typeof t === 'string') {
          return {
            id: generateUUID(),
            name: t.trim(),
            name_ar: t.trim(),
            slug: t.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || `tag-${idx}`,
            created_at: nowIso,
          };
        }
        return {
          id: isValidUUID(t?.id) ? t.id : generateUUID(),
          name: t?.name || t?.name_ar || `Tag ${idx + 1}`,
          name_ar: t?.name_ar || t?.name || `وسم ${idx + 1}`,
          slug: t?.slug || (t?.name || '').toLowerCase().replace(/\s+/g, '-') || `tag-${idx}`,
          created_at: t?.created_at || nowIso,
        };
      });

    const formattedArticle: Article = {
      id: targetArticleId,
      title: (article.title || 'Untitled Article').trim(),
      title_ar: (article.title_ar || article.title || 'مقال بدون عنوان').trim(),
      slug: targetSlug,
      excerpt: article.excerpt || '',
      excerpt_ar: article.excerpt_ar || '',
      content: article.content || '',
      content_ar: article.content_ar || '',
      status: article.status || 'draft',
      publish_date: article.publish_date || nowIso,
      featured_image: normalizeImageUrl(article.featured_image) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      author_id: article.author_id || '',
      category_id: article.category_id || '',
      is_featured: Boolean(article.is_featured),
      reading_time_minutes: Math.max(1, Math.ceil(((article.content || '') + ' ' + (article.content_ar || '')).split(/\s+/).length / 200)),
      views_count: article.views_count || 0,
      created_at: article.created_at || nowIso,
      updated_at: nowIso,
      last_updated_at: article.last_updated_at || nowIso,
      needs_update: article.needs_update !== undefined ? Boolean(article.needs_update) : false,
      last_checked_freshness: article.last_checked_freshness || nowIso,
      project_url: article.project_url || undefined,
      tags: sanitizedTags,
      videos: (article.videos || []).filter(v => v && typeof v === 'object'),
      seo: article.seo || undefined
    };

    let supabaseSaved = false;
    let supabaseError: string | null = null;

    if (client) {
      try {
        // 1. Resolve Category Foreign Key (Ensure it exists in DB)
        let targetCategoryId: string | null = null;
        if (isValidUUID(formattedArticle.category_id)) {
          const { data: catCheck } = await client.from('categories').select('id').eq('id', formattedArticle.category_id).maybeSingle();
          if (catCheck) {
            targetCategoryId = formattedArticle.category_id;
          } else {
            // If ID doesn't exist, try to find by slug if it's one of our seed categories
            const localCat = this.categories.find(c => c && c.id === formattedArticle.category_id);
            if (localCat) {
              await client.from('categories').upsert({
                id: localCat.id,
                name: localCat.name,
                name_ar: localCat.name_ar,
                slug: localCat.slug,
                description: localCat.description,
                description_ar: localCat.description_ar,
                icon: localCat.icon
              });
              targetCategoryId = localCat.id;
            }
          }
        }

        // If still no category, pick the first one or seed them
        if (!targetCategoryId) {
          const { data: allCats } = await client.from('categories').select('id').limit(1);
          if (allCats && allCats.length > 0) {
            targetCategoryId = allCats[0].id;
          } else {
            await client.from('categories').upsert(SEED_CATEGORIES);
            targetCategoryId = SEED_CATEGORIES[0].id;
          }
        }

        // 2. Resolve Author Foreign Key
        let targetAuthorId: string | null = null;
        if (isValidUUID(formattedArticle.author_id)) {
          const { data: authCheck } = await client.from('authors').select('id').eq('id', formattedArticle.author_id).maybeSingle();
          if (authCheck) {
            targetAuthorId = formattedArticle.author_id;
          } else {
            // Seed current author if missing
            const localAuth = (this.authors || []).find(a => a && a.id === formattedArticle.author_id);
            if (localAuth) {
              await client.from('authors').upsert({
                id: localAuth.id,
                user_id: localAuth.user_id,
                name: localAuth.name,
                name_ar: localAuth.name_ar,
                slug: localAuth.slug,
                avatar_url: localAuth.avatar_url,
                bio: localAuth.bio,
                bio_ar: localAuth.bio_ar
              });
              targetAuthorId = localAuth.id;
            }
          }
        }

        if (!targetAuthorId) {
          const { data: allAuths } = await client.from('authors').select('id').limit(1);
          if (allAuths && allAuths.length > 0) {
            targetAuthorId = allAuths[0].id;
          } else if (SEED_AUTHORS && SEED_AUTHORS.length > 0) {
            // Upsert at least one seed author
            await client.from('authors').upsert({
              id: SEED_AUTHORS[0].id,
              user_id: SEED_AUTHORS[0].user_id,
              name: SEED_AUTHORS[0].name,
              name_ar: SEED_AUTHORS[0].name_ar,
              slug: SEED_AUTHORS[0].slug,
              avatar_url: SEED_AUTHORS[0].avatar_url,
              bio: SEED_AUTHORS[0].bio,
              bio_ar: SEED_AUTHORS[0].bio_ar
            });
            targetAuthorId = SEED_AUTHORS[0].id;
          }
        }

        // 3. Upsert Article with duplicate slug protection
        const articlePayload = {
          id: formattedArticle.id,
          title: formattedArticle.title,
          title_ar: formattedArticle.title_ar,
          slug: formattedArticle.slug,
          excerpt: formattedArticle.excerpt,
          excerpt_ar: formattedArticle.excerpt_ar,
          content: formattedArticle.content,
          content_ar: formattedArticle.content_ar,
          status: formattedArticle.status,
          publish_date: formattedArticle.publish_date,
          featured_image: formattedArticle.featured_image,
          author_id: targetAuthorId,
          category_id: targetCategoryId,
          is_featured: formattedArticle.is_featured,
          reading_time_minutes: formattedArticle.reading_time_minutes,
          views_count: formattedArticle.views_count,
          updated_at: formattedArticle.updated_at,
          last_updated_at: formattedArticle.last_updated_at,
          needs_update: formattedArticle.needs_update,
          last_checked_freshness: formattedArticle.last_checked_freshness,
          project_url: formattedArticle.project_url
        };

        let { error: articleError } = await client.from('articles').upsert(articlePayload);

        // 🛡️ Auto-resolve unique constraint violation on slug (Error 23505) with multi-retry resilience
        let retryAttempts = 0;
        while (articleError && (articleError.code === '23505' || articleError.message?.includes('articles_slug_key')) && retryAttempts < 5) {
          retryAttempts++;
          console.warn(`Duplicate slug constraint hit in Supabase (Attempt ${retryAttempts}/5). Generating resilient unique slug and retrying...`);
          const baseSlug = (formattedArticle.slug || 'article')
            .replace(/[^\w-]/g, '')
            .slice(0, 25)
            .replace(/^-+|-+$/g, '') || 'art';
          const resilientSlug = `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
          formattedArticle.slug = resilientSlug;
          articlePayload.slug = resilientSlug;

          const retryRes = await client.from('articles').upsert(articlePayload);
          articleError = retryRes.error;
        }

        if (articleError) {
          supabaseError = articleError.message;
          console.error('Supabase Articles Error:', articleError);
        } else {
          supabaseSaved = true;

          // 4. Upsert SEO
          const seoData = formattedArticle.seo || {
            id: generateUUID(),
            entity_type: 'article',
            entity_id: formattedArticle.id,
            seo_title: formattedArticle.title,
            seo_title_ar: formattedArticle.title_ar,
            seo_description: formattedArticle.excerpt,
            seo_description_ar: formattedArticle.excerpt_ar,
            canonical_url: `https://aiwebcrafter.com/article/${formattedArticle.slug}`,
            keywords: ['AI', 'Web Dev'],
            keywords_ar: ['ذكاء اصطناعي'],
            noindex: false,
            created_at: nowIso,
            updated_at: nowIso
          };

          const { error: seoError } = await client.from('seo_metadata').upsert({
            ...seoData,
            entity_id: formattedArticle.id, // Guarantee linkage
            updated_at: nowIso
          });

          if (seoError) console.warn('SEO metadata upsert failed:', seoError.message);

          // 5. Link Tags safely (never crash on undefined or string)
          if (formattedArticle.tags && formattedArticle.tags.length > 0) {
            for (const tag of formattedArticle.tags) {
              if (!tag) continue;
              const tagName = tag.name || tag.name_ar || '';
              if (!tagName) continue;
              const tagId = isValidUUID(tag.id) ? tag.id : generateUUID();
              const tagSlug = tag.slug || tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || `tag-${Date.now()}`;

              try {
                // Ensure tag exists in master table
                await client.from('tags').upsert({
                  id: tagId,
                  name: tagName,
                  name_ar: tag.name_ar || tagName,
                  slug: tagSlug
                }, { onConflict: 'slug' });

                // Link junction
                await client.from('article_tags').upsert({
                  article_id: formattedArticle.id,
                  tag_id: tagId
                });
              } catch (_) {}
            }
          }

          // 6. Link Videos
          if (formattedArticle.videos && formattedArticle.videos.length > 0) {
            for (let i = 0; i < formattedArticle.videos.length; i++) {
              const vid = formattedArticle.videos[i];
              if (!vid) continue;
              const videoId = isValidUUID(vid.id) ? vid.id : generateUUID();
              await client.from('videos').upsert({
                id: videoId,
                title: vid.title || '',
                title_ar: vid.title_ar || '',
                youtube_url: vid.youtube_url || '',
                youtube_id: vid.youtube_id || '',
                thumbnail_url: vid.thumbnail_url || '',
                duration: vid.duration || '',
                description: vid.description || '',
                description_ar: vid.description_ar || '',
                created_at: vid.created_at || nowIso
              });
              await client.from('article_videos').upsert({
                article_id: formattedArticle.id,
                video_id: videoId,
                display_order: i + 1
              });
            }
          }
        }
      } catch (e: any) {
        supabaseError = e?.message || 'Database connection error';
        console.error('Exception saving to Supabase:', e);
      }
    }

    // Update Local Storage as fallback/mirror
    const idx = this.articles.findIndex((a) => a.id === formattedArticle.id || a.slug === formattedArticle.slug);
    if (idx !== -1) {
      this.articles[idx] = formattedArticle;
    } else {
      this.articles.unshift(formattedArticle);
    }
    this.saveLocal();

    return {
      success: true,
      syncedToSupabase: supabaseSaved,
      data: formattedArticle,
      error: !supabaseSaved ? (supabaseError || 'Supabase disconnected') : undefined
    };
  }

  public async deleteArticle(id: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    const loggedUser = this.getLoggedInUser();

    if (loggedUser && loggedUser.role === 'author') {
      const myAuthorId = await this.getLoggedInAuthorId(loggedUser.id);
      if (!myAuthorId) {
        return { success: false, error: 'Unauthorized: Author profile not found.' };
      }

      if (client && isValidUUID(id)) {
        try {
          const { data: existingArt, error: getErr } = await client
            .from('articles')
            .select('author_id')
            .eq('id', id)
            .maybeSingle();
          if (!getErr && existingArt && existingArt.author_id !== myAuthorId) {
            return { success: false, error: 'Unauthorized: You can only delete your own articles.' };
          }
        } catch (_) {}
      }
    }

    if (client && isValidUUID(id)) {
      try {
        // Delete junction relations first
        await client.from('article_tags').delete().eq('article_id', id);
        await client.from('article_videos').delete().eq('article_id', id);
        await client.from('seo_metadata').delete().eq('entity_id', id);
        
        const { error } = await client.from('articles').delete().eq('id', id);
        if (error) {
          console.error('Supabase delete article error:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Supabase delete article exception:', e);
        return { success: false, error: e?.message || 'Delete operation failed' };
      }
    }
    this.articles = this.articles.filter((a) => a.id !== id);
    this.saveLocal();
    return { success: true };
  }

  // ==========================================================================
  // CATEGORIES CRUD
  // ==========================================================================

  public async getCategories(): Promise<Category[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('categories').select('*').order('name');
        if (!error && data && data.length > 0) {
          this.categories = data.filter((c: any) => c && typeof c === 'object' && (c.name || c.name_ar));
          return this.categories;
        }
      } catch (e) {
        console.warn('Falling back to local store for categories');
      }
    }
    return (this.categories || []).filter((c: any) => c && typeof c === 'object' && (c.name || c.name_ar));
  }

  public async addCategory(cat: Omit<Category, 'id' | 'created_at'>): Promise<{ success: boolean; data?: Category; error?: string }> {
    const newCat: Category = {
      ...cat,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('categories').insert(newCat);
        if (error) {
          console.error('Error inserting category into Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception inserting category:', e);
        return { success: false, error: e?.message || 'Failed to insert category' };
      }
    }
    this.categories.push(newCat);
    this.saveLocal();
    return { success: true, data: newCat };
  }

  public async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (client && isValidUUID(id)) {
      try {
        const { error } = await client.from('categories').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
      } catch (e: any) {
        return { success: false, error: e?.message };
      }
    }
    this.categories = this.categories.filter((c) => c.id !== id);
    this.saveLocal();
    return { success: true };
  }

  // ==========================================================================
  // TAGS CRUD
  // ==========================================================================

  public async getTags(): Promise<Tag[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('tags').select('*').order('name');
        if (!error && data && data.length > 0) {
          this.tags = data.filter((t: any) => t && typeof t === 'object' && (t.name || t.name_ar));
          return this.tags;
        }
      } catch (e) {
        console.warn('Falling back to local store for tags');
      }
    }
    return (this.tags || []).filter((t: any) => t && typeof t === 'object' && (t.name || t.name_ar));
  }

  public async addTag(tag: Omit<Tag, 'id' | 'created_at'>): Promise<{ success: boolean; data?: Tag; error?: string }> {
    const newTag: Tag = {
      ...tag,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('tags').insert(newTag);
        if (error) {
          console.error('Error inserting tag into Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception inserting tag:', e);
        return { success: false, error: e?.message || 'Failed to insert tag' };
      }
    }
    this.tags.push(newTag);
    this.saveLocal();
    return { success: true, data: newTag };
  }

  public async deleteTag(id: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (client && isValidUUID(id)) {
      try {
        const { error } = await client.from('tags').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
      } catch (e: any) {
        return { success: false, error: e?.message };
      }
    }
    this.tags = this.tags.filter((t) => t.id !== id);
    this.saveLocal();
    return { success: true };
  }

  // ==========================================================================
  // AUTHORS CRUD
  // ==========================================================================

  public async getAuthors(): Promise<Author[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('authors').select('*').order('name');
        if (!error && data && data.length > 0) {
          this.authors = data;
          return data;
        }
      } catch (e) {
        console.warn('Falling back to local store for authors');
      }
    }
    return this.authors;
  }

  public async addAuthor(author: Omit<Author, 'id' | 'created_at'>): Promise<{ success: boolean; data?: Author; error?: string }> {
    const newAuthor: Author = {
      ...author,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('authors').insert(newAuthor);
        if (error) return { success: false, error: error.message };
      } catch (e: any) {
        return { success: false, error: e?.message };
      }
    }
    this.authors.push(newAuthor);
    this.saveLocal();
    return { success: true, data: newAuthor };
  }

  // ==========================================================================
  // VIDEOS CRUD
  // ==========================================================================

  public async getVideos(): Promise<Video[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        let query = client.from('videos').select('*');
        
        const loggedUser = this.getLoggedInUser();
        if (loggedUser && loggedUser.role !== 'admin') {
          const authId = await this.getLoggedInAuthorId(loggedUser.id);
          if (authId) {
            query = query.eq('author_id', authId);
          }
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) {
          this.videos = data;
          return data;
        }
      } catch (e) {
        console.warn('Falling back to local store for videos');
      }
    }
    return this.videos;
  }

  public async addVideo(vid: Omit<Video, 'id' | 'created_at'>): Promise<{ success: boolean; data?: Video; error?: string }> {
    const loggedUser = this.getLoggedInUser();
    let authorId: string | null = null;
    if (loggedUser) {
      authorId = await this.getLoggedInAuthorId(loggedUser.id);
    }

    let ytId = vid.youtube_id || '7uKQBljhe_s';
    if (vid.youtube_url) {
      const match = vid.youtube_url.match(/(?:v=|\/embed\/|\/1.1\/|youtu\.be\/|\/v\/)([^#&?]*)/);
      if (match && match[1]) ytId = match[1];
    }

    const newVid: Video = {
      ...vid,
      id: generateUUID(),
      author_id: authorId || undefined,
      youtube_id: ytId,
      thumbnail_url: vid.thumbnail_url || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      created_at: new Date().toISOString()
    };

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('videos').insert({
          ...newVid,
          author_id: authorId // Ensure it's passed to Supabase
        });
        if (error) {
          console.error('Error inserting video into Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception inserting video into Supabase:', e);
        return { success: false, error: e?.message || 'Failed to insert video' };
      }
    }
    this.videos.unshift(newVid);
    this.saveLocal();
    return { success: true, data: newVid };
  }

  public async deleteVideo(id: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (client && isValidUUID(id)) {
      try {
        const { error } = await client.from('videos').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
      } catch (e: any) {
        return { success: false, error: e?.message };
      }
    }
    this.videos = this.videos.filter((v) => v.id !== id);
    this.saveLocal();
    return { success: true };
  }

  // ==========================================================================
  // MEDIA & SUPABASE STORAGE BUCKET CRUD
  // ==========================================================================

  public async getMedia(): Promise<Media[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        let query = client.from('media').select('*');

        const loggedUser = this.getLoggedInUser();
        if (loggedUser && loggedUser.role !== 'admin') {
          const authId = await this.getLoggedInAuthorId(loggedUser.id);
          if (authId) {
            query = query.eq('author_id', authId);
          }
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) {
          this.media = data;
          return data;
        }
      } catch (e) {
        console.warn('Falling back to local store for media');
      }
    }
    return this.media;
  }

  public async uploadMediaFile(
    file: File,
    altText?: string,
    altTextAr?: string
  ): Promise<{ success: boolean; data?: Media; error?: string }> {
    if (!file || typeof file !== 'object' || !file.name) {
      return { success: false, error: 'No valid file object provided for upload' };
    }
    const client = getSupabaseClient();
    const mediaId = generateUUID();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `uploads/${Date.now()}_${cleanFileName}`;

    const loggedUser = this.getLoggedInUser();
    let authorId: string | null = null;
    if (loggedUser) {
      authorId = await this.getLoggedInAuthorId(loggedUser.id);
    }

    if (client) {
      try {
        // 1. Upload binary file to Supabase Storage bucket 'media'
        const { error: uploadError } = await client.storage
          .from('media')
          .upload(storagePath, file, {
            contentType: file.type || 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error('Supabase Storage upload error:', uploadError);
          return { success: false, error: uploadError.message };
        }

        // 2. Get Public URL
        const { data: urlData } = client.storage.from('media').getPublicUrl(storagePath);
        const publicUrl = urlData.publicUrl;

        // 3. Store record in public.media table
        const mediaRecord: Media = {
          id: mediaId,
          author_id: authorId || undefined,
          file_name: file.name,
          file_url: publicUrl,
          storage_path: storagePath,
          mime_type: file.type || 'image/jpeg',
          file_size: file.size,
          alt_text: altText || file.name,
          alt_text_ar: altTextAr || file.name,
          created_at: new Date().toISOString()
        };

        const { error: dbError } = await client.from('media').insert({
          ...mediaRecord,
          author_id: authorId
        });
        if (dbError) {
          console.error('Error inserting media metadata to Supabase:', dbError);
          return { success: false, error: dbError.message };
        }

        this.media.unshift(mediaRecord);
        this.saveLocal();
        return { success: true, data: mediaRecord };
      } catch (e: any) {
        console.error('Exception during media upload:', e);
        return { success: false, error: e?.message || 'Storage upload failed' };
      }
    }

    // Local simulation fallback
    const fallbackMedia: Media = {
      id: mediaId,
      file_name: file.name,
      file_url: URL.createObjectURL(file),
      storage_path: storagePath,
      mime_type: file.type || 'image/jpeg',
      file_size: file.size,
      alt_text: altText || file.name,
      alt_text_ar: altTextAr || file.name,
      created_at: new Date().toISOString()
    };
    this.media.unshift(fallbackMedia);
    this.saveLocal();
    return { success: true, data: fallbackMedia };
  }

  public async deleteMedia(id: string): Promise<{ success: boolean; error?: string }> {
    const item = this.media.find((m) => m.id === id);
    const client = getSupabaseClient();

    if (client && item?.storage_path && isValidUUID(id)) {
      try {
        await client.storage.from('media').remove([item.storage_path]);
        const { error } = await client.from('media').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
      } catch (e: any) {
        console.error('Error deleting media from Supabase:', e);
        return { success: false, error: e?.message };
      }
    }

    this.media = this.media.filter((m) => m.id !== id);
    this.saveLocal();
    return { success: true };
  }

  public async fetchSiteSettings(): Promise<{
    gsc_verification_tag: string;
    adsense_publisher_id: string;
    ga_measurement_id: string;
    gsc_connected: boolean;
    gsc_report_data: any;
    encrypted_vault?: string;
  } | null> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('site_settings').select('*').eq('id', 'default').maybeSingle();
        if (!error && data) {
          return {
            gsc_verification_tag: data.gsc_verification_tag || '',
            adsense_publisher_id: data.adsense_publisher_id || '',
            ga_measurement_id: data.ga_measurement_id || '',
            gsc_connected: data.gsc_connected || false,
            gsc_report_data: data.gsc_report_data || {},
            encrypted_vault: data.encrypted_vault || ''
          };
        }
      } catch (e) {
        console.error('Error fetching site_settings from Supabase:', e);
      }
    }
    return null;
  }

  public async saveSiteSettings(settings: {
    gsc_verification_tag?: string;
    adsense_publisher_id?: string;
    ga_measurement_id?: string;
    gsc_connected?: boolean;
    gsc_report_data?: any;
    encrypted_vault?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('site_settings').upsert({
          id: 'default',
          ...settings,
          updated_at: new Date().toISOString()
        });
        if (error) {
          console.error('Error saving site_settings in Supabase:', error);
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (e: any) {
        console.error('Exception during saveSiteSettings:', e);
        return { success: false, error: e?.message };
      }
    }
    return { success: false, error: 'Supabase client not initialized' };
  }

  public async fetchEncryptedVault(): Promise<{ decrypted: any; rawCiphertext: string } | null> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('site_settings')
          .select('encrypted_vault')
          .eq('id', 'default')
          .maybeSingle();

        if (!error && data?.encrypted_vault) {
          const decrypted = decryptVaultData(data.encrypted_vault);
          return {
            decrypted,
            rawCiphertext: data.encrypted_vault
          };
        }
      } catch (e) {
        console.warn('Could not fetch encrypted vault from Supabase:', e);
      }
    }
    return null;
  }

  public async saveEncryptedVault(vaultPayload: any): Promise<{ success: boolean; ciphertext?: string; error?: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase client not connected' };
    }

    try {
      const encrypted = encryptVaultData(vaultPayload);
      if (!encrypted) {
        return { success: false, error: 'Encryption failed' };
      }

      const { error } = await client.from('site_settings').upsert({
        id: 'default',
        encrypted_vault: encrypted,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, ciphertext: encrypted };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to save encrypted vault' };
    }
  }
}

export const storeService = new StoreService();
