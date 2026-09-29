import { Article, ArticleStatus, Author, Category, Media, SeoMetadata, Tag, User, Video } from '../types/blog';
import { getSupabaseClient, getSupabaseDiagnostics, checkSupabaseConnection } from '../lib/supabase';
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
    email: 'aiwebcraft6@gmail.com',
    full_name: 'AIWebCrafter Team',
    role: 'admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'sara@aiwebcrafter.com',
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
    name: 'AIWebCrafter Team',
    name_ar: 'فريق AIWebCrafter',
    slug: 'aiwebcrafter-team',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Certified Sports Nutritionist & Biomechanics Coach specializing in female body recomposition, natural glute & curve development, healthy calorie surplus, and weight management.',
    bio_ar: 'أخصائي معتمد في التغذية الرياضية والتدريب البدني، متخصص في برامج نحت الجسم، ضبط الوزن (تخسيس أو زيادة)، التمارين البيوميكانيكية لعضلات الأرداف، وتغذية القوام المتناسق للمرأة.',
    role_title: 'Certified Sports Nutritionist & Body Sculpting Coach',
    role_title_ar: 'أخصائي تغذية رياضية ومدرب نحت القوام وزيادة الوزن الطبيعي',
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
    bio: 'Doctor of Clinical Nutrition & Natural Herbal Medicine specializing in authentic Sahrawi recipes, natural phytoestrogens, healthy curve enhancement, hormonal balance, and safe weight gain.',
    bio_ar: 'طبيبة وأخصائية تغذية علاجية متخصصة في الوصفات والخلطات الصحراوية الطبيعية، توازن الهرمونات والأنوثة، تعزيز الكتلة العضلية والامتلاء المتناسق للأرداف والصدر بطرق طبيعية 100% بدون أي مواد ضارة.',
    role_title: "Clinical Herbal Nutritionist & Women's Health Specialist",
    role_title_ar: 'دكتورة في التغذية العلاجية والأعشاب وصحة ورشاقة المرأة',
    twitter: 'https://twitter.com',
    github: 'https://github.com',
    website: 'https://aiwebcrafter.com',
    created_at: '2026-09-01T00:00:00.000Z'
  }
];

// Seed Categories
export const SEED_CATEGORIES: Category[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    name: 'Authentic Sahrawi Recipes',
    name_ar: 'الخلطات والوصفات الصحراوية',
    slug: 'sahrawi-recipes',
    description: 'Traditional Sahrawi herbal recipes, natural Lahsa, tiger nuts, sesame, and healthy curves nutrition.',
    description_ar: 'الخلطات والوصفات الصحراوية الطبيعية، اللحسة الأصلية، حب العزيز، بذور الصويا والسمسم لزيادة الوزن وتكبير الأرداف والصدر بأمان.',
    icon: 'Sparkles',
    created_at: '2026-09-01T00:00:00.000Z'
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    name: 'Natural Curves & Nutrition',
    name_ar: 'التغذية وزيادة الوزن الطبيعية',
    slug: 'natural-curves-nutrition',
    description: 'Caloric density, natural phytoestrogens, healthy fats, and evidence-based body shaping nutrition.',
    description_ar: 'الأغذية الغنية بالسعرات النظيفة، الإستروجينات النباتية، والزيوت الطبيعية لنحت وتكبير المعالم الأنثوية.',
    icon: 'Apple',
    created_at: '2026-09-01T00:00:00.000Z'
  }
];

// Seed Tags
export const SEED_TAGS: Tag[] = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    name: 'الخلطات الصحراوية',
    name_ar: 'الخلطات الصحراوية',
    slug: 'sahrawi-blends',
    created_at: '2026-09-01T00:00:00.000Z'
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    name: 'تكبير الأرداف والمؤخرة',
    name_ar: 'تكبير الأرداف والمؤخرة',
    slug: 'glutes-curves',
    created_at: '2026-09-01T00:00:00.000Z'
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    name: 'تكبير الثدي طبيعياً',
    name_ar: 'تكبير الثدي طبيعياً',
    slug: 'breast-fullness',
    created_at: '2026-09-01T00:00:00.000Z'
  },
  {
    id: '30000000-0000-4000-8000-000000000004',
    name: 'اللحسة الصحراوية',
    name_ar: 'اللحسة الصحراوية',
    slug: 'lahsa-sahrawiya',
    created_at: '2026-09-01T00:00:00.000Z'
  },
  {
    id: '30000000-0000-4000-8000-000000000005',
    name: 'حب العزيز والمكسرات',
    name_ar: 'حب العزيز والمكسرات',
    slug: 'tiger-nuts-nuts',
    created_at: '2026-09-01T00:00:00.000Z'
  }
];

// Seed Videos
export const SEED_VIDEOS: Video[] = [
  {
    id: '80000000-0000-4000-8000-000000000001',
    author_id: '10000000-0000-4000-8000-000000000001',
    title: 'How to Prepare Authentic Moroccan Sahrawi Lahsa at Home (Full Recipe & Proportions)',
    title_ar: 'طريقة تحضير اللحسة الصحراوية الأصلية 100% في المنزل: المكونات والمقادير بالتفصيل',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube_id: 'dQw4w9WgXcQ',
    thumbnail_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    duration: '14:20',
    description: 'Complete video guide on selecting pure ingredients, light roasting, blending, and dosing authentic Sahrawi Lahsa for healthy curves.',
    description_ar: 'فيديو تطبيقي شامل يشرح خطوات اختيار المكونات الطبيعية، التحميص الهادئ، الطحن والمزج مع العسل الحر للحصول على لحسة صحراوية آمنة لزيادة الوزن والأنوثة.',
    created_at: '2026-09-27T19:30:00.000Z'
  },
  {
    id: '80000000-0000-4000-8000-000000000002',
    author_id: '10000000-0000-4000-8000-000000000002',
    title: 'Top 5 Home Glute & Hip Resistance Band Exercises for Women (Scientific Form)',
    title_ar: 'أفضل 5 تمارين منزلية بالأشرطة المطاطية لتكبير وشد الأرداف والمؤخرة للنساء',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube_id: 'dQw4w9WgXcQ',
    thumbnail_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
    duration: '18:45',
    description: 'Targeted glute hypertrophy workout at home using resistance bands. Step-by-step biomechanical cues for maximum gluteus medius activation.',
    description_ar: 'روتين تدريبي منزلي متكامل باستخدام أشرطة المقاومة لتركيز الضغط على عضلات الأرداف والمؤخرة مع شرح التكنيك الصحيح لتفادي إجهاد أسفل الظهر.',
    created_at: '2026-09-24T15:00:00.000Z'
  },
  {
    id: '80000000-0000-4000-8000-000000000003',
    author_id: '10000000-0000-4000-8000-000000000001',
    title: 'Tiger Nuts & Sesame Secret Drink for Natural Estrogen Balance & Curves',
    title_ar: 'مشروب حب العزيز والسمسم وحليب الصويا لتعزيز هرمونات الأنوثة وامتلاء الأرداف',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube_id: 'dQw4w9WgXcQ',
    thumbnail_url: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80',
    duration: '11:10',
    description: 'Detailed preparation of high-calorie phytoestrogen shake with roasted tiger nuts, sesame seeds, and plant milk for natural weight gain.',
    description_ar: 'طريقة إعداد سموذي عالي السعرات وغني بالإستروجينات النباتية والدهون الأحادية غير المشبعة لفتح الشهية وتوجيه الوزن للمناطق المستهدفة.',
    created_at: '2026-09-20T11:30:00.000Z'
  },
  {
    id: '80000000-0000-4000-8000-000000000004',
    author_id: '10000000-0000-4000-8000-000000000002',
    title: 'Mastering Barbell Hip Thrusts: Alignment, Foot Position & Pelvic Lockout Guide',
    title_ar: 'تمرين الهيب ثرست بالبار: الوضعية الصحيحة، ضبط مسافة القدمين، وحماية أسفل الظهر',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube_id: 'dQw4w9WgXcQ',
    thumbnail_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    duration: '16:05',
    description: 'Complete coaching masterclass on hip thrust setup, chin tuck, ribcage alignment, and progressive loading for maximum glute development.',
    description_ar: 'شرح تحليلي شامل لأهم تمرين لبناء عضلات الجزء السفلي: تجنب الأخطاء الشائعة، قفل الحوض الصحيح، وزيادة الأوزان تدريجياً بأمان.',
    created_at: '2026-09-14T14:15:00.000Z'
  }
];

// Seed Articles
export const SEED_ARTICLES: Article[] = [
  {
    id: '70000000-0000-4000-8000-000000000001',
    title: 'Natural Glute Growth: The Comprehensive Scientific Guide to Nutrition and Training',
    title_ar: 'تكبير الأرداف طبيعياً: الدليل العلمي الشامل للتغذية والتمارين',
    slug: 'natural-glute-growth-scientific-nutrition-training-guide',
    excerpt: 'An evidence-based masterclass on natural glute hypertrophy: muscle anatomy, progressive overload, macronutrient balance, and weekly workout programming.',
    excerpt_ar: 'الدليل العلمي المتكامل لبناء وتكبير عضلات الأرداف طبيعياً: تشريح العضلات، أقوى التمارين المركبة، استراتيجيات التغذية وحساب البروتين، مع خطة تدريبية مثبتة علمياً.',
    content: `# Natural Glute Growth: The Comprehensive Scientific Guide to Nutrition and Training

Building and sculpting the gluteal muscles naturally requires an evidence-based synthesis of biomechanics, progressive overload, and strategic caloric surplus nutrition.

---

## 1. The Triad of Muscle Hypertrophy
Scientific research confirms that muscle hypertrophy is driven by three primary mechanisms:
1. **Mechanical Tension:** Lifting challenging weights through a full range of motion.
2. **Metabolic Stress:** Pumping blood and metabolites into the muscle via moderate to high rep ranges (8–15 reps).
3. **Controlled Muscle Damage:** Focused eccentric (lowering) contractions that stimulate myofibrillar repair.

---

## 2. Key Compound Movements for Glute Activation
- **Barbell Hip Thrust:** Maximum peak contraction at the top of hip extension.
- **Romanian Deadlift (RDL):** Stretches the gluteus maximus under high mechanical load.
- **Bulgarian Split Squats:** Unilateral stability eliminating strength imbalances.
- **Deep Back Squats:** Full hip flexion and quadriceps-glute co-activation.

---

## 3. Nutrition: The Fuel for Hypertrophy
- **Caloric Surplus:** Aim for 250–350 kcal above maintenance to facilitate muscle synthesis without excessive fat gain.
- **Protein Intake:** 1.6 to 2.2 grams of high-quality protein per kilogram of body weight daily.
- **Hydration:** Minimum 3 liters of water daily to maintain cellular hydration and glycogen storage.`,
    content_ar: `# تكبير الأرداف طبيعياً: الدليل العلمي الشامل للتغذية والتمارين

يُعد بناء وتكبير عضلات الأرداف (الألوية) بطريقة طبيعية وآمنة هدفاً يعتمد في جوهره على القوانين العلمية للنمو العضلي (Hypertrophy)، والميكانيكا الحيوية للحركة، والتغذية الرياضية المحسوبة بدقة بعيداً عن الخرافات والوعود الزائفة.

---

## 🧠 1. ركائز النمو والتضخيم العضلي الثلاث المثبتة علمياً

لكي تستجيب الألياف العضلية للنمو، يجب توفير ثلاثة محفزات رئيسية خلال الحصص التدريبية:

1. **التوتر الميكانيكي (Mechanical Tension):** وهو العامل الأهم، ويتحقق برفع أوزان تشكل تحدياً حقيقياً مع الحفاظ على المدى الحركي الكامل والتحكم في مسار الوزن.
2. **الإجهاد الأيضي (Metabolic Stress):** يتحقق عبر التكرارات المتوسطة إلى العالية (8 إلى 15 تكراراً) مع فترات راحة مضبوطة لضخ الدم وحبس المستقلبات داخل النسيج العضلي (The Pump).
3. **التلف العضلي المسيطر عليه (Muscle Damage):** ويحدث خصوصاً أثناء مرحلة الهبوط والنزول البطيء للوزن (Eccentric Phase)، مما يرسل إشارات بيولوجية لإعادة بناء الألياف بحجم وكثافة أكبر.

---

## 🏋️‍♀️ 2. أقوى 4 تمارين مركبة مثبتة بالدراسات الكهربائية العضلية (EMG)

| التمرين | التركيز الأساسي | زاوية المدى الحركي | التكرارات المقترحة |
| :--- | :--- | :--- | :--- |
| **الهيب ثرست (Barbell Hip Thrust)** | الألوية الكبرى (Peak Contraction) | بسط الورك الأفقي | 4 مجموعات × 8-12 تكرار |
| **الديدلفت الروماني (Romanian Deadlift)** | الألوية السفلية وأوتار الركبة | إطالة واستطالة تحت حمل | 3 مجموعات × 8-10 تكرارات |
| **السكوات البلغاري (Bulgarian Split Squat)** | توازن الحوض وعزل كل ساق | حركة أحادية عميقة | 3 مجموعات × 10-12 لكل ساق |
| **السكوات العميق (Deep Squat)** | القوة الشاملة وقاعدة الحوض | ثني كامل للورك والركبة | 3 مجموعات × 6-8 تكرارات |

---

## 🥗 3. التغذية الرياضية وحساب الماكروز

العضلات لا تنمو في الفراغ؛ بل تحتاج إلى طاقة ومواد بناء حيوية:

- **الفائض الحراري النظيف (Clean Caloric Surplus):** إضافة **250 إلى 350 سعرة حرارية** يومياً فوق معدل الحرق اليومي (TDEE) لتوفير طاقة البناء دون تراكم دهون زائدة.
- **كمية البروتين اليومية:** تناول **1.6 إلى 2.2 غرام من البروتين** لكل كيلوغرام من وزن الجسم (مثال: وزن 60 كغ يحتاج بين 96 إلى 132 غرام بروتين يومياً من البيض، صدر الدجاج، السمك، والزبادي اليوناني).
- **الكربوهيدرات المعقدة:** مثل الشوفان، البطاطا الحلوة، والأرز البني لتعبئة مخازن الجليكوجين وتوفير القوة لرفع الأوزان.
- **الدهون الصحية:** كزيت الزيتون والمكسرات والأفوكادو لدعم الهرمونات البنائية الطبيعية.

---

## 💤 4. سر الاستشفاء والنوم
النمو العضلي الفعلي لا يحدث في الصالة الرياضية، بل أثناء النوم العميق (7 إلى 9 ساعات) عندما يفرز الجسم هرمون النمو (HGH). احرصي على ترك 48 إلى 72 ساعة راحة بين حصص تمارين الجزء السفلي.`,
    status: 'published',
    publish_date: '2026-09-12T15:45:00.000Z',
    featured_image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=80',
    author_id: '10000000-0000-4000-8000-000000000001',
    category_id: '20000000-0000-4000-8000-000000000001',
    is_featured: false,
    reading_time_minutes: 8,
    views_count: 2450,
    created_at: '2026-09-12T15:45:00.000Z',
    updated_at: '2026-09-12T15:45:00.000Z'
  },
  {
    id: '70000000-0000-4000-8000-000000000002',
    title: 'Glute Anatomy & Biomechanics: How to Target Every Fiber for Maximum Muscle Growth',
    title_ar: 'تشريح عضلات الأرداف (Glute Anatomy): كيف تستهدف كل زاوية لتحقيق أقصى استجابة عضلية',
    slug: 'glute-anatomy-biomechanics-muscle-growth-guide',
    excerpt: 'Deep dive into the three gluteal muscles: gluteus maximus, medius, and minimus, and how directional plane training shapes rounder, stronger glutes.',
    excerpt_ar: 'شرح مفصل لتشريح العضلة الألوية الكبرى، الوسطى، والصغرى، وكيفية توجيه زوايا الحركة والإبعاد لاستهداف كامل الألياف وتحقيق استدارة وتناسق مثالي.',
    content: `# Glute Anatomy & Biomechanics: Targeting Every Muscle Fiber

To optimize glute growth, you must understand the anatomy and directional fibers of the gluteal complex.

## 1. The Gluteus Maximus
The largest and most powerful muscle in the human body. Responsible for hip extension, external rotation, and posterior pelvic tilt.
- **Top Exercises:** Barbell Hip Thrusts, Romanian Deadlifts, Heavy Squats.

## 2. The Gluteus Medius & Minimus
Situated on the upper-outer side of the pelvis. Responsible for hip abduction, pelvic stabilization during single-leg stance, and creating the rounded upper shelf appearance.
- **Top Exercises:** Cable Kickbacks, Banded Abductions, Lateral Lunges.

## 3. Mind-Muscle Connection
Consciously squeezing the glutes at peak contraction increases motor unit recruitment by up to 25%.`,
    content_ar: `# تشريح عضلات الأرداف (Glute Anatomy): كيف تستهدف كل زاوية لتحقيق أقصى استجابة عضلية

من أجل الحصول على أفضل النتائج في أقل وقت، يجب فهم التركيب التشريحي لمنطقة الألوية؛ فالعضلة ليست كتلة واحدة، بل تتكون من ثلاث عضلات رئيسية لكل منها وظيفة حركية فريدة:

---

## 🔍 1. العضلة الألوية الكبرى (Gluteus Maximus)
- **الموقع والأهمية:** هي أكبر وأقوى عضلة في جسم الإنسان وتشكل الجزء الأكبر من الحجم الظاهري.
- **وظيفتها الحركية:** بسط مفصل الورك (Hip Extension) والدوران الخارجي للفخذ.
- **أفضل التمارين لاستهدافها:** الهيب ثرست (Hip Thrust)، الديدلفت الروماني (RDL)، والسكوات العميق.

---

## 🔍 2. العضلة الألوية الوسطى (Gluteus Medius)
- **الموقع والأهمية:** تقع في الجزء العلوي والجانبي من الحوض، وهي المسؤولة عن المظهر المرتفع والمستدير من الجوانب (The Upper Shelf).
- **وظيفتها الحركية:** إبعاد الفخذ إلى الخارج (Hip Abduction) وتثبيت الحوض أثناء المشي والوقوف على ساق واحدة.
- **أفضل التمارين لاستهدافها:** ركلات الكيبل الجانبية (Cable Kickbacks at 45°)، المشي الجانبي بالمطاط (Banded Crab Walks)، وجهاز الإبعاد (Hip Abduction Machine).

---

## 🔍 3. العضلة الألوية الصغرى (Gluteus Minimus)
- **الموقع والأهمية:** تقع تحت العضلة الوسطى وتعمل بالتكامل معها في دعم مفصل الفخذ ومنع ميلان الحوض.
- **أفضل التمارين لاستهدافها:** تمرين المحار (Clamshells) وتمارين التوازن بساق واحدة (Single-Leg Romanian Deadlifts).

---

## 💡 نصيحة تدريبية: الاتصال العصبي العضلي (Mind-Muscle Connection)
قبل بدء التمرين بوزن ثقيل، قومي بعمل مجموعتين إحماء بتكرار عالٍ ومطاط خفيف للتركيز على عصر العضلة ذهنياً؛ الدراسات تشير إلى أن هذا يزيد من استدعاء الألياف العضلية بنسبة تصل إلى 20%.`,
    status: 'published',
    publish_date: '2026-09-08T10:00:00.000Z',
    featured_image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    author_id: '10000000-0000-4000-8000-000000000002',
    category_id: '20000000-0000-4000-8000-000000000001',
    is_featured: false,
    reading_time_minutes: 7,
    views_count: 1890,
    created_at: '2026-09-08T10:00:00.000Z',
    updated_at: '2026-09-08T10:00:00.000Z'
  },
  {
    id: '70000000-0000-4000-8000-000000000003',
    title: 'Nutrition for Glute Growth: Calculating Caloric Surplus, Protein Ratios & Meal Plans',
    title_ar: 'التغذية لتكبير الأرداف: الفائض الحراري، حساب البروتين، وأفضل الوجبات لبناء العضلات',
    slug: 'nutrition-glute-growth-caloric-surplus-protein-meal-plans',
    excerpt: 'How to calculate your exact caloric surplus (Lean Bulking), optimal protein distribution across meals, and evidence-based sample meal plans.',
    excerpt_ar: 'دليل حساب السعرات الحرارية بدقة، تحديد الفائض النظيف (Lean Bulk)، وجدول وجبات يومي غني بالبروتين والمغذيات الأساسية لتضخيم العضلات دون زيادة الدهون.',
    content: `# Nutrition for Glute Hypertrophy: Caloric Surplus & Meal Planning

Without adequate nutritional fuel, the best training program in the world will yield minimal muscle growth.

## 1. The Lean Bulk Strategy
- Maintain a slight caloric surplus of +250 to +300 calories over maintenance.
- This provides sufficient energy for muscle protein synthesis (MPS) while minimizing fat accumulation.

## 2. Macronutrient Breakdown
- **Protein:** 1.8–2.2g per kg body weight.
- **Carbohydrates:** 3–5g per kg body weight to fuel high-intensity training.
- **Fats:** 0.8–1.0g per kg body weight for hormone production.

## 3. Sample Daily Meal Plan
- **Breakfast:** Oats with whey protein, chia seeds, and berries.
- **Lunch:** Grilled chicken breast with brown rice and olive oil steamed veggies.
- **Pre-Workout:** Banana with peanut butter on rice cakes.
- **Dinner:** Salmon fillet, baked sweet potato, and green salad.`,
    content_ar: `# التغذية لتكبير الأرداف: الفائض الحراري، حساب البروتين، وأفضل الوجبات لبناء العضلات

بدون توفير العناصر الغذائية الكافية، لن يتمكن الجسم من بناء خلايا عضلية جديدة مهما كانت جودة وقوة التمارين في النادي أو المنزل.

---

## 📊 1. معادلة الفائض الحراري الذكي (Lean Bulking)
الهدف هو زيادة الحجم العضلي النقي دون زيادة غير مرغوبة في نسبة الدهون:
- **احسبي سعرات الثبات (Maintenance Calories):** عبر ضرب الوزن ومعدل النشاط اليومي.
- **أضيفي 250 إلى 300 سعرة حرارية يومياً:** هذا المقدار كافٍ تماماً لتحفيز تخليق البروتين العضلي (Muscle Protein Synthesis).

---

## 🥩 2. توزيع العناصر الكبرى (Macronutrients)

1. **البروتين (حجر الأساس):**
   - المعدل: 1.8 إلى 2.2 غرام لكل كيلوغرام من وزن الجسم.
   - المصادر: صدور الدجاج، سمك السلمون والتونة، البيض الكامل، الجبن القريش، العدس والحمص، وبروتين مصل اللبن (Whey Protein).

2. **الكربوهيدرات (طاقة التدريب وتعبئة الجليكوجين):**
   - المعدل: 3 إلى 4 غرام لكل كيلوغرام.
   - المصادر: الأرز الأبيض والبسمتي، الشوفان، البطاطا الحلوة والبطاطس المسلوقة، الكينوا والفواكه.

3. **الدهون الصحية (التوازن الهرموني):**
   - المعدل: 0.8 إلى 1 غرام لكل كيلوغرام.
   - المصادر: زيت الزيتون البكر، الأفوكادو، المكسرات النيئة، وبذور الشيا والكتان.

---

## 🍽️ 3. نموذج يومي متكامل للوجبات (Sample Meal Plan)

- **الفطور:** 3 بيضات (2 كاملة + 1 بياض) مع 60 غرام شوفان مطبوخ بحليب اللوز وتوت ومكسرات.
- **الغداء:** 150 غرام صدر دجاج مشوي + 150 غرام أرز بني مطبوخ + صحن خضار بزيت الزيتون.
- **وجبة خفيفة قبل التمرين (بساعة ونصف):** موزة + ملعقة زبدة فول سوداني طبيعية + كوب قهوة خالية من السكر.
- **وجبة بعد التمرين:** سكوب واي بروتين مع ماء أو حليب + تمر أو كعك أرز.
- **العشاء:** 150 غرام سمك سلمون مشوي أو جبن قريش + بطاطا حلوة مشوية وسلطة خضراء.`,
    status: 'published',
    publish_date: '2026-09-02T16:30:00.000Z',
    featured_image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
    author_id: '10000000-0000-4000-8000-000000000001',
    category_id: '20000000-0000-4000-8000-000000000002',
    is_featured: false,
    reading_time_minutes: 8,
    views_count: 1720,
    created_at: '2026-09-02T16:30:00.000Z',
    updated_at: '2026-09-02T16:30:00.000Z'
  },
  {
    id: '70000000-0000-4000-8000-000000000004',
    title: 'Mastering the Barbell Hip Thrust: Form, Cues, Setup & Lower Back Protection',
    title_ar: 'تمرين الهيب ثرست (Hip Thrust): الدليل الشامل للأداء الصحيح، التكنيك، وحماية أسفل الظهر',
    slug: 'mastering-barbell-hip-thrust-form-cues-safety',
    excerpt: 'Everything you need to master the king of glute exercises: bench height, shin angles, pelvic tuck, and preventing lower back strain.',
    excerpt_ar: 'أسرار تمرين الهيب ثرست (ملك تمارين الأرداف): ضبط موضع المقعد والبار، زاوية الساق القائمة، قفل الحوض، وحماية أسفل الظهر من التقوس المؤلم.',
    content: `# Mastering the Barbell Hip Thrust: The Ultimate Guide

The barbell hip thrust is scientifically proven to produce the highest mean and peak gluteus maximus EMG activity compared to squats and deadlifts.

## 1. Optimal Setup
- **Bench Height:** Bench should sit just below the shoulder blades (scapulae), roughly 14–16 inches high.
- **Shin Angle:** At the top of the movement, shins should be completely vertical (90 degrees to the floor).
- **Foot Placement:** Shoulder-width apart, toes slightly flared outward at 15–30 degrees.

## 2. Key Execution Cues
- Tuck the chin towards the chest throughout the entire lift.
- Initiate the movement by driving through the midfoot and heels.
- Achieve a full posterior pelvic tilt (PPT) at the top and pause for 1–2 seconds.
- Avoid hyperextending the lumbar spine.`,
    content_ar: `# تمرين الهيب ثرست (Hip Thrust): الدليل الشامل للأداء الصحيح، التكنيك، وحماية أسفل الظهر

أثبتت دراسات التخطيط العضلي الكهربائي (EMG) أن تمرين **الهيب ثرست بالبار (Barbell Hip Thrust)** يحقق أعلى معدل تفعيل لعضلة الألوية الكبرى مقارنة بالسكوات والديدلفت، لأنه يضع العضلة تحت أقصى توتر ميكانيكي في نقطة الانقباض الكامل (Peak Contraction).

---

## 📐 1. الضبط الهندسي الصحيح للتمرين (The Setup)

1. **ارتفاع المقعد (Bench Height):**
   - يجب أن يستقر المقعد أو الصندوق تحت عظام لوحي الكتف مباشرة (حوالي 35 إلى 40 سم من الأرض).
   - إذا كان المقعد مرتفعاً جداً، فإنه يسبب ضغطاً على أسفل الظهر.

2. **زاوية الساق والقدمين (Shin & Foot Angle):**
   - في أعلى نقطة عند رفع الحوض، يجب أن تكون الساق في وضع **عمودي تماماً مع الأرض بزاوية 90 درجة**.
   - إذا كانت القدمان بعيدتين جداً، سينتقل الجهد لأوتار الركبة الخلفية (Hamstrings).
   - إذا كانت القدمان قريبتين جداً، سينتقل الجهد لمقدمة الفخذ (Quads).

3. **وضعية الرأس والذقن (Chin Tuck):**
   - حافظي على تثبيت الذقن باتجاه الصدر والنظر إلى الأمام طوال مسار الحركة، وتجنبي النظر إلى السقف لمنع تقوس أسفل الظهر.

---

## 🚫 2. أخطاء شائعة يجب تجنبها

- **التقوس القطني المفرط (Lumbar Hyperextension):** دفع الوزن بالعمود الفقري بدلاً من عصر الأرداف؛ الحل هو قفل الحوض للخلف (Posterior Pelvic Tilt).
- **رفع الأوزان دون تثبيت في القمة:** احرصي على التوقف لمدة **1 إلى 2 ثانية في القمة** مع عصر العضلة بقوة قبل النزول البطيء.
- **عدم استخدام وسادة حماية للبار (Barbell Pad):** استخدمي وسادة إسفنجية سميكة لحماية عظام الحوض من الضغط.`,
    status: 'published',
    publish_date: '2026-08-25T14:00:00.000Z',
    featured_image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    author_id: '10000000-0000-4000-8000-000000000002',
    category_id: '20000000-0000-4000-8000-000000000001',
    is_featured: false,
    reading_time_minutes: 7,
    views_count: 2150,
    created_at: '2026-08-25T14:00:00.000Z',
    updated_at: '2026-08-25T14:00:00.000Z'
  },
  {
    id: '70000000-0000-4000-8000-000000000005',
    title: 'Progressive Overload for Lower Body: The True Driver of Continuous Muscle Hypertrophy',
    title_ar: 'الزيادة التدريجية للأحمال (Progressive Overload): السر الحقيقي لاستمرار نمو العضلات دون توقف',
    slug: 'progressive-overload-lower-body-hypertrophy-science',
    excerpt: 'Learn the scientific principles of progressive overload: why muscles stop growing, and 5 practical methods to continuously trigger hypertrophy.',
    excerpt_ar: 'لماذا يتوقف نمو العضلات بعد بضعة أسابيع؟ وكيف تطبقين الطرق الخمس لمبدأ الزيادة التدريجية لكسر ثبات الحجم العضلي وضمان استمرار التطور.',
    content: `# Progressive Overload: The Ultimate Driver of Muscle Growth

Progressive overload states that in order for a muscle to grow, it must be subjected to an increasing stimulus over time.

## The 5 Methods of Progressive Overload
1. **Adding Weight:** Increasing the load on the bar while maintaining strict form.
2. **Adding Repetitions:** Performing more reps with the same weight (e.g., advancing from 8 to 12 reps).
3. **Increasing Sets / Volume:** Adding an additional working set to key exercises.
4. **Slowing the Tempo (Time Under Tension):** Extending the eccentric phase to 3–4 seconds.
5. **Shortening Rest Intervals:** Improving metabolic efficiency with controlled rest.`,
    content_ar: `# الزيادة التدريجية للأحمال (Progressive Overload): السر الحقيقي لاستمرار نمو العضلات دون توقف

السبب الأول وراء توقف نمو وتطور عضلات الجزء السفلي بعد فترة من الحماس الأولي هو تكرار نفس التمارين بنفس الأوزان والتكرارات لشهور متتالية. الجسم كائن متكيف بامتياز؛ إذا لم يجد تحدياً جديداً، فلن يبني أليافاً عضلية إضافية!

---

## 📈 الطرق الـ 5 لتطبيق الزيادة التدريجية بذكاء

### 1. زيادة الوزن المحمول (Increasing Weight)
- إذا استطعت أداء 12 تكراراً في تمرين الهيب ثرست بوزن 50 كغ بأداء نظيف، قومي في الحصة التالية برفع الوزن إلى 52.5 كغ أو 55 كغ وهبوط التكرارات إلى 8، ثم التدرج حتى 12 مجدداً.

### 2. زيادة التكرارات بنفس الوزن (Increasing Repetitions)
- البقاء على نفس الوزن وزيادة تكرار أو تكرارين كل أسبوع (مثال: الانتقال من 8 تكرارات إلى 10 ثم 12 تكراراً بنفس الوزن).

### 3. تحسين جودة وتيرة الحركة (Controlling Tempo & Time Under Tension)
- تنفيذ مرحلة النزول (Eccentric Phase) ببطء شديد (3 إلى 4 ثوانٍ)، مما يزيد التوتر الميكانيكي على الألياف بشكل مضاعف دون الحاجة لأوزان خطيرة.

### 4. زيادة المجموعات والحجم التدريبي (Adding Volume)
- زيادة مجموعة إضافية للتمارين الرئيسية (من 3 مجموعات إلى 4 مجموعات).

### 5. تقليل فترات الراحة المنضبطة
- تقليل الراحة بين المجموعات من 90 ثانية إلى 60 ثانية لزيادة الإجهاد الأيضي.

---

## 📝 أهمية تدوين التدريب
احتفظي بمذكرة على هاتفك لتدوين الأوزان والتكرارات في كل حصة تدريبية؛ ما لا يمكن قياسه، لا يمكن تحسينه!`,
    status: 'published',
    publish_date: '2026-08-16T11:20:00.000Z',
    featured_image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80',
    author_id: '10000000-0000-4000-8000-000000000001',
    category_id: '20000000-0000-4000-8000-000000000001',
    is_featured: false,
    reading_time_minutes: 6,
    views_count: 1640,
    created_at: '2026-08-16T11:20:00.000Z',
    updated_at: '2026-08-16T11:20:00.000Z'
  },
  {
    id: '70000000-0000-4000-8000-000000000006',
    title: 'Best Home Glute Workouts Using Resistance Bands and Bodyweight',
    title_ar: 'أفضل تمارين بناء وتدوير الأرداف في المنزل باستخدام أشرطة المقاومة ووزن الجسم',
    slug: 'best-home-glute-workouts-resistance-bands-bodyweight',
    excerpt: 'How to build firm and sculpted glutes at home using smart resistance band angles, single-leg variations, and high-tension pause reps.',
    excerpt_ar: 'طريقة بناء ونحت عضلات الأرداف في المنزل باستخدام أشرطة المقاومة (Resistance Bands) ووزن الجسم، مع حيل زيادة المقاومة الموضعية والتكرارات الثابتة.',
    content: `# Best Home Glute Workouts with Resistance Bands

You don't need a commercial gym to achieve significant glute activation. Strategic bodyweight and resistance band variations can produce effective hypertrophy when performed with high time-under-tension.

## Top Home Exercises
1. **Single-Leg Glute Bridge:** Excellent unilateral gluteus maximus engagement.
2. **Banded Bulgarian Split Squat:** Deep stretch and quads/glute loading.
3. **Banded Frog Pumps:** Continuous metabolic burn with high reps (20–30 reps).
4. **Banded Clamshells & Fire Hydrants:** Isolating the gluteus medius for hip width.`,
    content_ar: `# أفضل تمارين بناء وتدوير الأرداف في المنزل باستخدام أشرطة المقاومة ووزن الجسم

لا يشترط دائماً التواجد في صالة رياضية متطورة لبدء بناء عضلات الأرداف؛ عند فهم الميكانيكا الحيوية واستخدام أشرطة المقاومة القماشية (Fabric Resistance Bands)، يمكنك تحقيق استجابة عضلية قوية من المنزل.

---

## 🏠 أفضل 5 تمارين منزلية فعالة

1. **جسر الحوض بساق واحدة (Single-Leg Glute Bridge):**
   - الاستلقاء على الظهر ورفع الحوض بساق واحدة مع عصر الألوية في القمة لمدة ثانيتين.
   - *التكرار:* 3 مجموعات × 12-15 تكراراً لكل ساق.

2. **السكوات البلغاري بوزن الجسم أو مطاط (Bulgarian Split Squat):**
   - وضع ساق خلفية على أريكة أو كرسي منزلي والنزول عميقاً مع ميل الجذع قليلاً للأمام (20 درجة) لنقل الضغط بالكامل للأرداف.
   - *التكرار:* 3 مجموعات × 10-12 تكراراً لكل ساق.

3. **تمرين الضفدع الحوضي بالمطاط (Banded Frog Pumps):**
   - وضع باطن القدمين في مواجهة بعضهما مع فتح الركبتين ورفع الحوض بسرعة مع عصر مستمر.
   - *التكرار:* 3 مجموعات × 20-30 تكراراً لضخ الدم الأيضي.

4. **ركلات الحمار بالمطاط (Banded Donkey Kicks):**
   - الركوع على أربع ركلات ساق للخلف وللأعلى بزاوية قائمة.
   - *التكرار:* 3 مجموعات × 15 تكراراً لكل ساق.

5. **المشي الجانبي بالمطاط (Banded Crab Walks):**
   - وضع المطاط فوق الركبتين والنزول في نصف سكوات والمشي جانبياً لتفعيل الألوية الوسطى.`,
    status: 'published',
    publish_date: '2026-08-05T09:15:00.000Z',
    featured_image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
    author_id: '10000000-0000-4000-8000-000000000002',
    category_id: '20000000-0000-4000-8000-000000000001',
    is_featured: false,
    reading_time_minutes: 6,
    views_count: 1480,
    created_at: '2026-08-05T09:15:00.000Z',
    updated_at: '2026-08-05T09:15:00.000Z'
  },
  {
    id: '70000000-0000-4000-8000-000000000007',
    title: 'Muscle Recovery, Sleep Quality & Glute Growth: The Crucial Science of Tissue Repair',
    title_ar: 'الاستشفاء العضلي والنوم: العامل الحاسم لنمو عضلات الأرداف وتجديد الأنسجة',
    slug: 'muscle-recovery-sleep-quality-glute-growth-science',
    excerpt: 'Why training every day destroys your gains: deep sleep stages, cortisol control, optimal rest periods between leg sessions, and tissue repair science.',
    excerpt_ar: 'العضلات تنمو أثناء الراحة وليس في النادي؛ دور النوم العميق في إفراز هرمون النمو، فترات الراحة الضرورية بين الحصص، وكيف تتجنبين الهدم العضلي والإجهاد.',
    content: `# Muscle Recovery and Sleep: The Science of Glute Hypertrophy

Training provides the stimulus, but muscle tissue growth strictly occurs during deep rest and biological recovery.

## 1. Deep Sleep & Growth Hormone (HGH)
During stage 3 and 4 non-REM deep sleep, blood supply to muscles increases significantly, facilitating protein synthesis and tissue regeneration.

## 2. Rest Intervals Between Sessions
- Glute muscles require **48 to 72 hours** of complete recovery between high-intensity training sessions.
- Training the same muscle group daily halts myofibrillar rebuilding and leads to chronic overtraining.

## 3. Stress & Cortisol Management
Elevated cortisol levels break down muscle tissue and promote abdominal fat storage. Prioritize stress reduction, hydration, and magnesium supplementation.`,
    content_ar: `# الاستشفاء العضلي والنوم: العامل الحاسم لنمو عضلات الأرداف وتجديد الأنسجة

من أكبر الأخطاء الشائعة بين المبتدئين الاعتقاد بأن تمرين الأرداف يومياً سيؤدي لنتائج أسرع. في الواقع، التمرين يسبب تمزقات مجهرية في الألياف العضلية، والنمو الحقيقي لا يحدث إلا عندما يقوم الجسم بإصلاح هذه التمزقات أثناء الراحة والتغذية.

---

## 🌙 1. النوم العميق وإفراز هرمون النمو (HGH)
- أثناء مراحل النوم العميق (خصوصاً Stage 3 NREM)، يفرز الجسم **أكثر من 70% من هرمون النمو البشري اليومي**.
- قلة النوم (أقل من 6 ساعات) ترفع هرمون الكورتيزول (هرمون التوتر والهدم العضلي) وتخفض حساسية الخلايا للأنسولين بنسبة تصل إلى 30%.

---

## ⏳ 2. الفاصل الزمني الذهبي بين حصص التمارين
- تحتاج عضلات الجزء السفلي الكبيرة ما بين **48 إلى 72 ساعة كاملة** للاستشفاء بعد حصة تدريبية مكثفة.
- التردد المثالي: تمرين عضلات الأرداف **2 إلى 3 مرات أسبوعياً كحد أقصى** مع أيام راحة أو تمارين جزء علوي بينها.

---

## 💧 3. أدوات تسريع الاستشفاء المنزلي
1. **الترطيب اليومي:** شرب ما لا يقل عن 2.5 إلى 3 لترات ماء لنقل الأحماض الأمينية إلى الخلايا.
2. **معدن المغنيسيوم:** تناول المغنيسيوم (Glycinate أو Citrate) قبل النوم لتحسين جودة النوم واسترخاء العضلات.
3. **المشي الخفيف (Active Recovery):** المشي لمدة 20 دقيقة في أيام الراحة يحسن تدفق الدورة الدموية ويزيل حمض اللاكتيك المتراكم.`,
    status: 'published',
    publish_date: '2026-07-22T16:40:00.000Z',
    featured_image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=80',
    author_id: '10000000-0000-4000-8000-000000000001',
    category_id: '20000000-0000-4000-8000-000000000002',
    is_featured: false,
    reading_time_minutes: 7,
    views_count: 1390,
    created_at: '2026-07-22T16:40:00.000Z',
    updated_at: '2026-07-22T16:40:00.000Z'
  },
  {
    id: '70000000-0000-4000-8000-000000000008',
    title: 'Complete 4-Day Weekly Workout Routine for Glutes and Legs with Warm-Up Protocol',
    title_ar: 'جدول تدريبي أسبوعي متكامل (3 إلى 4 أيام) لتكبير ونحت الأرداف مع روتين الإحماء',
    slug: 'complete-4-day-glutes-legs-workout-routine-schedule',
    excerpt: 'A ready-to-use 4-day workout schedule engineered for optimal volume, exercise rotation, sets, reps, and dynamic warm-up drills.',
    excerpt_ar: 'خطة تدريبية أسبوعية جاهزة ومدروسة (4 أيام): تقسيم التمارين، المجموعات، التكرارات، وروتين إحماء حركي لتفعيل العضلات وتحقيق أقصى استجابة.',
    content: `# Complete 4-Day Glute Hypertrophy Workout Routine

This structured 4-day split balances heavy mechanical tension with metabolic stress and proper recovery intervals.

## Dynamic Warm-Up (5 Minutes)
- Glute Bridges (Bodyweight): 2 sets x 15 reps
- Banded Crab Walks: 2 sets x 20 steps
- Leg Swings (Front & Lateral): 10 reps each

## Weekly Schedule
- **Day 1 (Monday):** Heavy Glute & Hamstring Focus (Hip Thrusts, RDLs, Cable Kickbacks)
- **Day 2 (Tuesday):** Upper Body & Core
- **Day 3 (Wednesday):** Active Rest & Recovery Walk
- **Day 4 (Thursday):** Glute & Quad Focus (Squats, Bulgarian Split Squats, Abductions)
- **Day 5 (Friday):** Upper Body & Abs
- **Day 6 (Saturday):** Glute Pump & Isolation (Hip Thrusts, Step-ups, Band Burnouts)
- **Day 7 (Sunday):** Full Rest`,
    content_ar: `# جدول تدريبي أسبوعي متكامل (3 إلى 4 أيام) لتكبير ونحت الأرداف مع روتين الإحماء

لتحقيق أفضل نتائج مستدامة، يقدم هذا الجدول تصميماً تدريبياً متوازناً يجمع بين تمارين القوة الثقيلة (Heavy Compound)، التمارين الأحادية (Unilateral)، وتمارين العزل الأيضي (Isolation Pump).

---

## 🔥 روتين الإحماء الحركي الإلزامي (5 دقائق قبل التمرين)
1. **جسر الحوض بوزن الجسم:** مجموعتان × 15 تكراراً مع عصر في القمة.
2. **المشي الجانبي بالمطاط (Banded Walks):** مجموعتان × 20 خطوة.
3. **أرجحة الساق الحركية (Leg Swings):** 10 تكرارات أمامية و10 جانبية لكل ساق لمرونة مفصل الورك.

---

## 📅 الجدول التدريبي الأسبوعي

### 🟢 اليوم الأول (الإثنين): قوة وتركيز ألوية + عضلات خلفية
- **الهيب ثرست بالبار (Barbell Hip Thrust):** 4 مجموعات × 8-10 تكرارات (أوزان ثقيلة وراحة دقيقتين).
- **الديدلفت الروماني بالدمبلز (Dumbbell RDL):** 3 مجموعات × 10 تكرارات.
- **ركلات الكيبل الخلفية بزاوية 45 (Cable Kickbacks):** 3 مجموعات × 12-15 تكراراً لكل ساق.
- **جهاز الإبعاد (Seated Hip Abduction):** 3 مجموعات × 15 تكراراً مع ثبات في آخر تكرار.

### 🟡 اليوم الثاني (الثلاثاء): الجزء العلوي والبطن (أو راحة)

### 🔵 اليوم الثالث (الخميس): تركيز ألوية + عضلات أمامية وحركة أحادية
- **السكوات البلغاري بالدمبلز (Bulgarian Split Squat):** 3 مجموعات × 10 تكرارات لكل ساق.
- **السكوات العميق (Goblet Squat or Barbell Squat):** 3 مجموعات × 8-10 تكرارات.
- **صعود الصندوق مع التركيز على الكعب (Step-Ups):** 3 مجموعات × 12 تكراراً لكل ساق.
- **طحن الفخذ الخلفي (Lying Hamstring Curl):** 3 مجموعات × 12 تكراراً.

### 🟣 اليوم الرابع (السبت): ضخ الدم والتكرارات العالية (Glute Burnout)
- **الهيب ثرست بالمطاط والبار الخفيف (Banded Hip Thrust):** 3 مجموعات × 15 تكراراً (مع توقف ثانيتين في القمة).
- **الرفعة الميتة الرومانية بساق واحدة (Single-Leg RDL):** 3 مجموعات × 12 تكراراً.
- **المشي بالمطاط + تمرين المحار (Super-Set):** 3 مجموعات × 20 تكراراً.

### ⚪ الأحد والأربعاء والجمعة: راحة واستشفاء وتغذية صحية.`,
    status: 'published',
    publish_date: '2026-07-08T12:00:00.000Z',
    featured_image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80',
    author_id: '10000000-0000-4000-8000-000000000001',
    category_id: '20000000-0000-4000-8000-000000000001',
    is_featured: false,
    reading_time_minutes: 8,
    views_count: 1980,
    created_at: '2026-07-08T12:00:00.000Z',
    updated_at: '2026-07-08T12:00:00.000Z'
  }
];

// Helper to guarantee 100% unique IDs and unique slugs across all article arrays
export function deduplicateArticles(list: Article[]): Article[] {
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const result: Article[] = [];

  for (const art of list) {
    if (!art) continue;
    let id = art.id || generateUUID();
    let slug = art.slug || `article-${Date.now()}-${Math.random()}`;

    // If slug already in list, skip this duplicate
    if (seenSlugs.has(slug)) {
      continue;
    }
    // If ID already seen, generate a new clean UUID
    if (seenIds.has(id)) {
      id = generateUUID();
    }

    seenIds.add(id);
    seenSlugs.add(slug);
    result.push({ ...art, id, slug });
  }

  return result;
}

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
      // Clear legacy storage versions to prevent stale or duplicate records
      const legacyKeys = [
        'aiwebcrafter_articles', 'aiwebcrafter_categories', 'aiwebcrafter_tags', 'aiwebcrafter_videos', 'aiwebcrafter_media', 'aiwebcrafter_authors',
        'blog_v2_articles', 'blog_v2_categories', 'blog_v2_tags', 'blog_v2_videos', 'blog_v2_media', 'blog_v2_authors',
        'blog_v3_articles', 'blog_v3_categories', 'blog_v3_tags', 'blog_v3_videos', 'blog_v3_media', 'blog_v3_authors',
        'blog_v4_articles', 'blog_v4_categories', 'blog_v4_tags', 'blog_v4_videos', 'blog_v4_media', 'blog_v4_authors',
        'blog_v5_articles', 'blog_v5_categories', 'blog_v5_tags', 'blog_v5_videos', 'blog_v5_media', 'blog_v5_authors',
        'blog_v6_articles', 'blog_v6_categories', 'blog_v6_tags', 'blog_v6_videos', 'blog_v6_media', 'blog_v6_authors',
        'blog_v7_articles', 'blog_v7_categories', 'blog_v7_tags', 'blog_v7_videos', 'blog_v7_media', 'blog_v7_authors',
        'blog_v8_articles', 'blog_v8_categories', 'blog_v8_tags', 'blog_v8_videos', 'blog_v8_media', 'blog_v8_authors',
        'blog_v9_articles', 'blog_v9_categories', 'blog_v9_tags', 'blog_v9_videos', 'blog_v9_media', 'blog_v9_authors',
      ];
      legacyKeys.forEach((k) => localStorage.removeItem(k));

      const storedArticles = localStorage.getItem('blog_v10_articles');
      const storedCats = localStorage.getItem('blog_v10_categories');
      const storedTags = localStorage.getItem('blog_v10_tags');
      const storedVideos = localStorage.getItem('blog_v10_videos');
      const storedMedia = localStorage.getItem('blog_v10_media');
      const storedAuthors = localStorage.getItem('blog_v10_authors');

      const parsedArticles: Article[] = storedArticles ? JSON.parse(storedArticles) : [];
      const parsedCats: Category[] = storedCats ? JSON.parse(storedCats) : [];
      const parsedTags: Tag[] = storedTags ? JSON.parse(storedTags) : [];
      const parsedVideos: Video[] = storedVideos ? JSON.parse(storedVideos) : [];
      const parsedMedia: Media[] = storedMedia ? JSON.parse(storedMedia) : [];
      const parsedAuthors: Author[] = storedAuthors ? JSON.parse(storedAuthors) : [];

      // Guarantee all seed articles are present, clean, and deduplicated
      const combined = parsedArticles.length > 0 ? [...parsedArticles, ...SEED_ARTICLES] : SEED_ARTICLES;
      this.articles = deduplicateArticles(combined);

      this.categories = parsedCats.length >= SEED_CATEGORIES.length ? parsedCats : SEED_CATEGORIES;
      this.tags = parsedTags.length >= SEED_TAGS.length ? parsedTags : SEED_TAGS;
      this.videos = parsedVideos.length > 0 ? parsedVideos : SEED_VIDEOS;
      this.media = parsedMedia.length > 0 ? parsedMedia : SEED_MEDIA;
      this.authors = parsedAuthors.length > 0 ? parsedAuthors : SEED_AUTHORS;

      localStorage.setItem('blog_v10_articles', JSON.stringify(this.articles));
      localStorage.setItem('blog_v10_categories', JSON.stringify(this.categories));
      localStorage.setItem('blog_v10_tags', JSON.stringify(this.tags));
      localStorage.setItem('blog_v10_videos', JSON.stringify(this.videos));
      localStorage.setItem('blog_v10_authors', JSON.stringify(this.authors));
    } else {
      this.articles = deduplicateArticles(SEED_ARTICLES);
      this.categories = SEED_CATEGORIES;
      this.tags = SEED_TAGS;
      this.videos = SEED_VIDEOS;
      this.media = SEED_MEDIA;
      this.authors = SEED_AUTHORS;
    }
  }

  private saveLocal() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('blog_v10_articles', JSON.stringify(this.articles));
      localStorage.setItem('blog_v10_categories', JSON.stringify(this.categories));
      localStorage.setItem('blog_v10_tags', JSON.stringify(this.tags));
      localStorage.setItem('blog_v10_videos', JSON.stringify(this.videos));
      localStorage.setItem('blog_v10_media', JSON.stringify(this.media));
      localStorage.setItem('blog_v10_authors', JSON.stringify(this.authors));
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
    const loggedUser = this.getLoggedInUser();

    if (client) {
      try {
        const { data, error } = await client
          .from('authors')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        if (!error && data?.id) {
          return data.id;
        }

        // If not found by user_id, check if there is an author matching by slug/email
        if (loggedUser?.email) {
          const userSlug = loggedUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
          const { data: bySlug } = await client
            .from('authors')
            .select('id')
            .or(`slug.eq.${userSlug},slug.eq.aiwebcrafter-team`)
            .limit(1)
            .maybeSingle();

          if (bySlug?.id) {
            await client.from('authors').update({ user_id: userId }).eq('id', bySlug.id);
            return bySlug.id;
          }

          // Auto-create author record in Supabase so user is linked
          const newAuthorId = generateUUID();
          const authorRecord = {
            id: newAuthorId,
            user_id: userId,
            name: loggedUser.full_name || loggedUser.email.split('@')[0],
            name_ar: loggedUser.full_name || loggedUser.email.split('@')[0],
            slug: userSlug || `author-${Date.now().toString(36)}`,
            avatar_url: loggedUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${loggedUser.email}`,
            bio: 'كاتب ومحرر معتمد في المنصة',
            bio_ar: 'كاتب ومحرر معتمد في المنصة',
            role_title: 'محرر وكاتب محتوى',
            role_title_ar: 'محرر وكاتب محتوى',
            created_at: new Date().toISOString()
          };

          const { error: insertErr } = await client.from('authors').upsert(authorRecord, { onConflict: 'id' });
          if (!insertErr) {
            this.authors.push(authorRecord as any);
            this.saveLocal();
            return newAuthorId;
          }
        }
      } catch (_) {}
    }

    const foundLocal = this.authors.find((a) => a.user_id === userId);
    if (foundLocal) return foundLocal.id;

    // Fallback to first existing author so user is never blocked
    if (this.authors && this.authors.length > 0) {
      return this.authors[0].id;
    }

    return null;
  }

  // ==========================================================================
  // AUTO SUPABASE SEEDING & SYNC
  // ==========================================================================

  private lastSeedTimestamp = 0;

  public async ensureSupabaseSeededAndSynced(): Promise<{ success: boolean; message: string; count?: number; details?: any }> {
    const diag = getSupabaseDiagnostics();

    if (!diag.hasUrl || !diag.hasKey) {
      return {
        success: false,
        message: 'لم يتم العثور على بيانات Supabase. يرجى إدخال الرابط (Project URL) ومفتاح (Anon Key) في نافذة الربط.'
      };
    }

    if (!diag.isUrlValid) {
      return {
        success: false,
        message: `رابط Supabase غير صالح: "${diag.url}". يجب أن يبدأ بـ https://`
      };
    }

    const client = getSupabaseClient();
    if (!client) {
      return {
        success: false,
        message: 'تعذر تهيئة عميل Supabase. يرجى التحقق من صحة المفتاح والرابط المدخلين.'
      };
    }

    // Protection against stuck state (timeout after 20 seconds)
    const now = Date.now();
    if (this.isSeedingSupabase && (now - this.lastSeedTimestamp < 20000)) {
      return { success: false, message: 'عملية المزامنة قيد التشغيل حالياً، يرجى الانتظار بضع ثوانٍ...' };
    }

    this.isSeedingSupabase = true;
    this.lastSeedTimestamp = now;

    try {
      // Step 0: Test connection
      const connTest = await checkSupabaseConnection();
      if (!connTest.success) {
        return {
          success: false,
          message: connTest.message || 'فشل الاتصال بقاعدة بيانات Supabase.'
        };
      }

      // 1. Ensure users exist
      try {
        if (SEED_USERS && SEED_USERS.length > 0) {
          await client.from('users').upsert(SEED_USERS, { onConflict: 'email' });
        }
      } catch (uErr: any) {
        console.warn('Notice seeding users table:', uErr?.message || uErr);
      }

      // 2. Ensure categories exist
      try {
        await client.from('categories').upsert(SEED_CATEGORIES, { onConflict: 'slug' });
      } catch (cErr: any) {
        console.warn('Notice seeding categories table:', cErr?.message || cErr);
      }

      // 3. Ensure tags exist
      try {
        await client.from('tags').upsert(SEED_TAGS, { onConflict: 'slug' });
      } catch (tErr: any) {
        console.warn('Notice seeding tags table:', tErr?.message || tErr);
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
      } catch (aErr: any) {
        console.warn('Notice seeding authors table:', aErr?.message || aErr);
      }

      // 5. Sync all articles to Supabase
      let syncedCount = 0;
      let lastError: string | null = null;
      for (const art of this.articles) {
        try {
          const res = await this.saveArticle(art, true);
          if (res.syncedToSupabase) {
            syncedCount++;
          } else if (res.error) {
            lastError = res.error;
          }
        } catch (artErr: any) {
          lastError = artErr?.message || String(artErr);
        }
      }

      if (syncedCount > 0 || this.articles.length === 0) {
        return {
          success: true,
          message: `تمت مزامنة وحفظ ${syncedCount} مقال وتصنيف ومؤلف بنجاح وبشكل دائم في Supabase!`,
          count: syncedCount
        };
      } else {
        if (connTest.schemaNeeded || (lastError && (lastError.includes('does not exist') || lastError.includes('42P01')))) {
          return {
            success: false,
            message: 'تم الاتصال بـ Supabase بنجاح ولكن جداول قاعدة البيانات لم تنشأ بعد. يرجى فتح تبويب Supabase SQL Editor ولصق كود SQL لإنشاء الجداول.'
          };
        }
        return {
          success: false,
          message: `تعذر حفظ المقالات في Supabase: ${lastError || 'يرجى التحقق من صلاحيات وصيغة الجداول في Supabase'}`
        };
      }
    } catch (e: any) {
      console.error('Sync failed:', e);
      return { success: false, message: `فشلت المزامنة: ${e?.message || 'خطأ غير متوقع أثناء المزامنة'}` };
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
          query = query.eq('status', 'published');
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

          // Merge with seed articles to ensure rich experience
          const combined = [...mappedArticles, ...SEED_ARTICLES];
          const allArticles = deduplicateArticles(combined);

          // In-memory filter for category / tag / search if relations queried
          let result = allArticles;
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
                (a.title || '').toLowerCase().includes(q) ||
                (a.title_ar || '').toLowerCase().includes(q) ||
                (a.excerpt || '').toLowerCase().includes(q) ||
                (a.excerpt_ar || '').toLowerCase().includes(q)
            );
          }

          this.articles = allArticles;
          this.saveLocal();
          return result;
        } else if (error) {
          console.warn('Supabase getArticles query notice:', error.message);
        }
      } catch (e) {
        console.warn('Supabase article fetch exception, using local store fallback:', e);
      }
    }

    // Local fallback - always ensure articles are populated
    if (!this.articles || this.articles.length === 0) {
      this.articles = deduplicateArticles(SEED_ARTICLES);
    }

    let filtered = [...this.articles];

    if (options?.status && options.status !== 'all') {
      filtered = filtered.filter((a) => a.status === options.status);
    } else if (!options?.status) {
      filtered = filtered.filter((a) => a.status === 'published');
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
        const { data, error } = await client
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });

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
        const { data, error } = await client
          .from('media')
          .select('*')
          .order('created_at', { ascending: false });

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
