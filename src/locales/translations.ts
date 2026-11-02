export type Language = 'en' | 'ar';

export const TRANSLATIONS = {
  en: {
    platformTitle: "AIWebCrafter Platform",
    platformSubtitle: "Private Cloud Database, Encryption & Storage Infrastructure",
    storeConnected: "Connected Store",
    logout: "Log Out",
    quickAction: "Quick Action",
    languageToggle: "العربية (RTL)",
    zeroCostNotice: "Zero-Cost Permanent Storage Protected",
    
    // Sidebar sections
    sections: {
      overview: "Overview Dashboard",
      database: "Database Management",
      products: "Products Data Storage",
      media: "Images & Media Storage",
      categories: "Categories Management",
      orders: "Orders Database",
      customers: "Customers Database",
      api: "Secure API Management",
      encryption: "Encryption & Security Center",
      backup: "Backup Center",
      restore: "Restore Center",
      storage_monitor: "Storage Monitoring",
      logs: "Activity Logs",
      settings: "Account & Settings"
    },

    // Overview
    overview: {
      heroTitle: "Private Store Cloud Infrastructure",
      heroDesc: "Dedicated central database, object storage, and AES-256-GCM encryption pipeline serving your external online store.",
      databaseStatus: "Relational Database Engine",
      storageStatus: "Cloud Object Storage (R2)",
      apiStatus: "External Store API Gateway",
      securityStatus: "Cryptographic Protection",
      activeProducts: "Stored Products",
      totalOrders: "Orders Ingested",
      registeredCustomers: "Customer Records",
      dbHealth: "Health & Schema Status",
      quickActionsTitle: "Infrastructure Quick Actions",
      openSqlEditor: "Execute SQL Query",
      uploadMedia: "Upload Store Images",
      generateBackup: "Generate Full Backup",
      inspectApi: "Inspect API Gateway",
      recentOrders: "Recent Orders from Existing Store",
      recentActivity: "Infrastructure Audit Events"
    },

    // Common
    actions: {
      search: "Search records...",
      filter: "Filter",
      export: "Export",
      download: "Download",
      upload: "Upload",
      create: "Create New",
      edit: "Edit",
      delete: "Delete",
      save: "Save Changes",
      cancel: "Cancel",
      confirm: "Confirm",
      refresh: "Refresh",
      view: "View Details",
      copy: "Copy Link",
      copied: "Copied!"
    },

    // Login
    login: {
      badge: "RESTRICTED PRIVATE ACCESS",
      title: "AIWebCrafter.com Private Platform",
      subtitle: "Authorized Store Owner Authentication Gateway",
      description: "Dedicated encrypted database and object storage infrastructure for your existing store. Public shopping interface is intentionally disabled.",
      emailLabel: "Owner Administrator Email",
      passwordLabel: "Master Access Key / Password",
      rememberMe: "Maintain 12-Hour Encrypted Session",
      submitButton: "Authenticate & Open Console",
      demoCredentialsNotice: "Authorized Owner: aiwebcraft6@gmail.com",
      quickFill: "Use Owner Credentials",
      securityBadge: "AES-256-GCM · PBKDF2 Web Crypto · Zero-Cost Permanent Storage Tier"
    }
  },

  ar: {
    platformTitle: "منصة AIWebCrafter الخاصة",
    platformSubtitle: "قاعدة بيانات سحابية خاصة، تخزين مشفر وبنية تحتية للمتجر",
    storeConnected: "المتجر المتصل",
    logout: "تسجيل الخروج",
    quickAction: "إجراء سريع",
    languageToggle: "English (LTR)",
    zeroCostNotice: "حماية مجانية صارمة (0 درهم)",
    
    // Sidebar sections
    sections: {
      overview: "لوحة التحكم العامة",
      database: "إدارة قاعدة البيانات",
      products: "مخزن بيانات المنتجات",
      media: "تخزين الصور والوسائط",
      categories: "إدارة التصنيفات",
      orders: "قاعدة بيانات الطلبات",
      customers: "سجلات الزبائن",
      api: "إدارة واجهات برمجة التطبيقات (API)",
      encryption: "مركز التشفير والأمان",
      backup: "مركز النسخ الاحتياطي",
      restore: "مركز الاستعادة",
      storage_monitor: "مراقبة مساحة التخزين",
      logs: "سجل النشاطات والأمان",
      settings: "الحساب والإعدادات"
    },

    // Overview
    overview: {
      heroTitle: "البنية السحابية الخاصة بمتجرك الإلكتروني",
      heroDesc: "نظام مركزي آمن لتخزين المنتجات، الصور، والطلبات مشفر بـ AES-256-GCM مخصص لربط متجرك الحالي دون المساس بتصميمه.",
      databaseStatus: "محرك قاعدة البيانات العلائقية",
      storageStatus: "تخزين الوسائط السحابي (R2)",
      apiStatus: "بوابة الربط البرمجي للمتجر",
      securityStatus: "مستوى الحماية والتشفير",
      activeProducts: "منتج مسجل بالقاعدة",
      totalOrders: "طلب تم استلامه",
      registeredCustomers: "سجل زبون محفوظ",
      dbHealth: "حالة سلامة البيانات",
      quickActionsTitle: "إجراءات سريعة للبنية التحتية",
      openSqlEditor: "تشغيل استعلام SQL",
      uploadMedia: "رفع صور للمتجر",
      generateBackup: "إنشاء نسخة احتياطية كاملة",
      inspectApi: "فحص بوابة API",
      recentOrders: "أحدث الطلبات الواردة من المتجر",
      recentActivity: "أحدث أحداث الأمان والتدقيق"
    },

    // Common
    actions: {
      search: "البحث في السجلات...",
      filter: "تصفية",
      export: "تصدير",
      download: "تحميل",
      upload: "رفع",
      create: "إضافة جديد",
      edit: "تعديل",
      delete: "حذف",
      save: "حفظ التغييرات",
      cancel: "إلغاء",
      confirm: "تأكيد",
      refresh: "تحديث",
      view: "عرض التفاصيل",
      copy: "نسخ الرابط",
      copied: "تم النسخ!"
    },

    // Login
    login: {
      badge: "دخول خاص ومحمي",
      title: "منصة AIWebCrafter الخاصة",
      subtitle: "بوابة تسجيل دخول مالك المتجر المعتمد",
      description: "بنية تحتية سحابية مشفرة لحفظ قواعد بيانات متجرك وصوره. واجهة الشراء العامة ملغاة هنا ومخصصة لمتجرك الخارجي.",
      emailLabel: "البريد الإلكتروني للمالك",
      passwordLabel: "مفتاح الأمان / كلمة المرور",
      rememberMe: "الاحتفاظ بجلسة مشفرة لمدة 12 ساعة",
      submitButton: "تسجيل الدخول وفتح لوحة الإدارة",
      demoCredentialsNotice: "بيانات المالك المصرح له: aiwebcraft6@gmail.com",
      quickFill: "ملء تلقائي للمالك",
      securityBadge: "تشفير AES-256-GCM · مكتبة Web Crypto · باقة تخزين دائم مجانية (0 درهم)"
    }
  }
};
