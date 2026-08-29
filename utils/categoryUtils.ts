import { Listing, CategoryType } from '../types.js';

/**
 * Robust category matching that seamlessly handles variants like:
 * 'E-commerce', 'Shopify', 'E-commerce & Stores', 'WooCommerce', 'E-commerce Store', etc.
 */
export const isListingInCategory = (
  listing: Partial<Listing> | undefined | null,
  targetCategory: CategoryType
): boolean => {
  if (!listing) return false;
  if (!targetCategory || targetCategory === 'All') return true;

  const target = targetCategory.toLowerCase().trim();
  const listCat = (listing.category || '').toLowerCase().trim();
  const assetType = (
    (listing as any).asset_type ||
    (listing as any).assetType ||
    ''
  ).toLowerCase().trim();
  const platform = (listing.platform || '').toLowerCase().trim();
  const title = (listing.title || '').toLowerCase();
  const tagline = (listing.tagline || '').toLowerCase();

  // 1. Direct exact match
  if (listCat === target) return true;

  // 2. E-COMMERCE & ALL STORE PLATFORMS (Shopify, WooCommerce, Amazon FBA, Dropshipping, PrestaShop, Custom Store, etc.)
  if (
    target === 'e-commerce' ||
    target === 'shopify' ||
    target === 'e-commerce & shopify' ||
    target === 'e-commerce & stores' ||
    target === 'stores' ||
    target === 'e-commerce store' ||
    target === 'shopify store' ||
    target === 'ecommerce'
  ) {
    if (
      listCat === 'e-commerce' ||
      listCat === 'shopify' ||
      listCat === 'e-commerce & shopify' ||
      listCat === 'e-commerce & stores' ||
      listCat === 'e-commerce store' ||
      listCat === 'shopify store' ||
      listCat.includes('commerce') ||
      listCat.includes('shopify') ||
      listCat.includes('store') ||
      listCat.includes('shop')
    ) {
      return true;
    }

    if (
      assetType === 'e-commerce store' ||
      assetType === 'shopify store' ||
      assetType.includes('commerce') ||
      assetType.includes('store') ||
      assetType.includes('shop')
    ) {
      return true;
    }

    if (
      platform.includes('shopify') ||
      platform.includes('woocommerce') ||
      platform.includes('magento') ||
      platform.includes('bigcommerce') ||
      platform.includes('amazon') ||
      platform.includes('prestashop') ||
      platform.includes('opencart') ||
      platform.includes('etsy') ||
      platform.includes('store') ||
      platform.includes('dropshipping') ||
      platform.includes('commerce')
    ) {
      return true;
    }

    if (
      title.includes('shopify') ||
      title.includes('e-commerce') ||
      title.includes('ecommerce') ||
      title.includes('store') ||
      title.includes('boutique') ||
      tagline.includes('shopify') ||
      tagline.includes('e-commerce') ||
      tagline.includes('ecommerce') ||
      tagline.includes('store') ||
      tagline.includes('dropshipping')
    ) {
      return true;
    }

    return false;
  }

  // 3. AI TOOLS & AUTOMATION
  if (
    target === 'ai tools' ||
    target === 'ai & automation' ||
    target === 'ai' ||
    target === 'ai product'
  ) {
    return (
      listCat === 'ai tools' ||
      listCat === 'ai & automation' ||
      listCat.includes('ai') ||
      assetType.includes('ai') ||
      platform.includes('ai') ||
      platform.includes('openai') ||
      platform.includes('gemini') ||
      platform.includes('anthropic') ||
      title.includes('ai ') ||
      title.includes('ai-') ||
      tagline.includes('ai ') ||
      tagline.includes('gpt')
    );
  }

  // 4. SAAS
  if (
    target === 'saas' ||
    target === 'b2b & b2c saas' ||
    target === 'saas platform'
  ) {
    return (
      listCat === 'saas' ||
      listCat === 'b2b & b2c saas' ||
      listCat.includes('saas') ||
      assetType === 'saas' ||
      assetType.includes('saas')
    );
  }

  // 5. MOBILE APPS
  if (
    target === 'mobile apps' ||
    target === 'mobile app' ||
    target === 'mobile'
  ) {
    return (
      listCat === 'mobile apps' ||
      listCat === 'mobile app' ||
      listCat.includes('mobile') ||
      assetType === 'mobile app' ||
      platform.includes('ios') ||
      platform.includes('android') ||
      platform.includes('flutter') ||
      platform.includes('react native')
    );
  }

  // 6. DIGITAL CONTENT
  if (
    target === 'digital content' ||
    target === 'content & newsletters' ||
    target === 'content' ||
    target === 'newsletter'
  ) {
    return (
      listCat === 'digital content' ||
      listCat === 'content & newsletters' ||
      listCat.includes('content') ||
      listCat.includes('newsletter') ||
      assetType.includes('content') ||
      platform.includes('substack') ||
      platform.includes('beehiiv') ||
      platform.includes('ghost')
    );
  }

  // 7. BROWSER EXTENSIONS
  if (
    target === 'browser extensions' ||
    target === 'chrome extension' ||
    target === 'extension'
  ) {
    return (
      listCat === 'browser extensions' ||
      listCat.includes('extension') ||
      assetType === 'chrome extension' ||
      platform.includes('chrome') ||
      platform.includes('extension')
    );
  }

  // 8. WEBSITES & PORTALS
  if (
    target === 'websites' ||
    target === 'websites & portals' ||
    target === 'website'
  ) {
    return (
      listCat === 'websites' ||
      listCat.includes('website') ||
      assetType === 'website' ||
      platform.includes('wordpress') ||
      platform.includes('web')
    );
  }

  return listCat.includes(target) || target.includes(listCat);
};
