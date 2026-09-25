export type Language = 'en' | 'ar';

export type ArticleStatus = 'draft' | 'published' | 'scheduled';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'editor' | 'author';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Author {
  id: string;
  user_id?: string;
  name: string;
  name_ar: string;
  slug: string;
  avatar_url: string;
  bio: string;
  bio_ar: string;
  role_title: string;
  role_title_ar: string;
  twitter?: string;
  github?: string;
  website?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description: string;
  description_ar: string;
  icon: string;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  created_at: string;
}

export interface Video {
  id: string;
  author_id?: string;
  title: string;
  title_ar: string;
  youtube_url: string;
  youtube_id: string;
  thumbnail_url: string;
  duration: string;
  description: string;
  description_ar: string;
  created_at: string;
}

export interface Media {
  id: string;
  author_id?: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  alt_text?: string;
  alt_text_ar?: string;
  created_at: string;
}

export interface SeoMetadata {
  id: string;
  entity_type: 'article' | 'category' | 'page';
  entity_id: string;
  seo_title: string;
  seo_title_ar: string;
  seo_description: string;
  seo_description_ar: string;
  canonical_url: string;
  og_image_url?: string;
  keywords: string[];
  keywords_ar: string[];
  noindex: boolean;
  created_at: string;
  updated_at: string;
  primary_keyword?: string;
  secondary_keywords?: string[];
  search_intent?: string;
  article_outline?: string;
  internal_link_suggestions?: string; // JSON string containing suggested links with anchors
  faq_section?: string; // JSON string of FAQs
  pillar_topic?: string; // If set, defines this article as a cluster pillar
  pillar_article_id?: string; // Reference to a pillar article
}

export interface Article {
  id: string;
  title: string;
  title_ar: string;
  slug: string;
  excerpt: string;
  excerpt_ar: string;
  content: string;
  content_ar: string;
  status: ArticleStatus;
  publish_date: string;
  featured_image: string;
  author_id: string;
  category_id: string;
  is_featured: boolean;
  reading_time_minutes: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  last_updated_at?: string;
  needs_update?: boolean;
  last_checked_freshness?: string;
  project_url?: string;
  
  // Relations attached
  author?: Author;
  category?: Category;
  tags?: Tag[];
  videos?: Video[];
  seo?: SeoMetadata;
}
