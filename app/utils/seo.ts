/**
 * SEO & Structured Data (JSON-LD) Utility for Multi-Tenant Merchants
 */

export interface CompanySeoData {
  id?: string;
  name: string;
  code: string;
  storeName?: string | null;
  gstin?: string | null;
  contactEmail?: string | null;
  whatsappNumber?: string | null;
  logoUrl?: string | null;
  customDomain?: string | null;
}

export interface ProductSeoData {
  id: string;
  sku: string;
  title: string;
  description?: string | null;
  price: number;
  currentStockLevel: number;
  category?: string | null;
  color?: string | null;
  size?: string | null;
  imageUrl?: string | null;
  rating?: number;
  reviews?: number;
}

export function getBaseDomain(company?: CompanySeoData | null, currentHost?: string | null): string {
  // 1. If explicit host is provided from Next.js request headers
  if (currentHost && !currentHost.includes("localhost") && !currentHost.includes("127.0.0.1")) {
    return currentHost.startsWith("http") ? currentHost : `https://${currentHost}`;
  }

  // 2. Custom Domain Priority (e.g., wolfcabin.in)
  if (company?.customDomain) {
    return company.customDomain.startsWith("http") ? company.customDomain : `https://${company.customDomain}`;
  }

  // 3. Environment Fallback
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://merchantvault.vercel.app";
  let host = "merchantvault.vercel.app";
  try { host = new URL(appUrl).hostname; } catch (e) {}
  return company?.code ? `https://${company.code}.${host}` : appUrl;
}


/**
 * Generate Organization & LocalBusiness JSON-LD Schema for Google Rich Snippets
 */
export function generateOrganizationSchema(company?: CompanySeoData | null) {
  const companyName = company?.storeName || company?.name || "Seyon Shopping Store";
  const domain = getBaseDomain(company);


  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": `${domain}#organization`,
    "name": companyName,
    "url": domain,
    "logo": company?.logoUrl || `${domain}/logo.png`,
    ...(company?.gstin ? { "vatID": company.gstin } : {}),
    ...(company?.contactEmail ? { "email": company.contactEmail } : {}),
    ...(company?.whatsappNumber ? { "telephone": company.whatsappNumber } : {}),
    "priceRange": "₹₹",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN"
    }
  };
}

/**
 * Generate Product JSON-LD Schema with Offer details for Google Search Product Badges
 */
export function generateProductSchema(product: ProductSeoData, company?: CompanySeoData | null) {
  const domain = getBaseDomain(company);
  const companyName = company?.storeName || company?.name || "Seyon Shopping Store";



  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "image": product.imageUrl || `${domain}/placeholder.png`,
    "description": product.description || `${product.title} available at ${companyName}.`,
    "sku": product.sku,
    "brand": {
      "@type": "Brand",
      "name": companyName
    },
    "offers": {
      "@type": "Offer",
      "url": `${domain}/?sku=${product.sku}`,
      "priceCurrency": "INR",
      "price": product.price,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.currentStockLevel > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": companyName
      }
    },
    ...(product.rating ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.reviews || 12
      }
    } : {})
  };
}

/**
 * Generate OpenGraph & Twitter Card Metadata for WhatsApp / iMessage / Social Share Thumbnails
 */
export function generateProductOpenGraphMetadata(product: ProductSeoData, company?: CompanySeoData | null, currentHost?: string | null) {
  const companyName = company?.storeName || company?.name || "Seyon Shopping";
  const domain = getBaseDomain(company, currentHost);


  
  const title = `${product.title} — ${companyName}`;
  const description = `Buy ${product.title} for ₹${product.price.toLocaleString("en-IN")}. ${product.description || `In Stock at ${companyName}. Fast delivery across India.`}`;
  const imageUrl = product.imageUrl || `${domain}/logo.png`;
  const productUrl = `${domain}/products/${product.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: productUrl,
      siteName: companyName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.title
        }
      ],
      type: "website",
      locale: "en_IN"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl]
    }
  };
}

/**
 * Generate BlogPosting JSON-LD Schema for Google Search News & Blog Rich Snippets
 */
export function generateBlogArticleSchema(
  article: { title: string; slug: string; excerpt?: string; content?: string; author?: string; featuredImage?: string; createdAt?: string },
  company?: CompanySeoData | null
) {
  const domain = getBaseDomain(company);
  const companyName = company?.storeName || company?.name || "Seyon Shopping";

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "image": article.featuredImage || `${domain}/logo.png`,
    "description": article.excerpt || article.title,
    "url": `${domain}/blog/${article.slug}`,
    "datePublished": article.createdAt || new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": article.author || `${companyName} Editorial Team`
    },
    "publisher": {
      "@type": "Organization",
      "name": companyName,
      "logo": {
        "@type": "ImageObject",
        "url": company?.logoUrl || `${domain}/logo.png`
      }
    }
  };
}

/**
 * Generate BreadcrumbList JSON-LD Schema for Google Search Navigation Snippets
 */
export function generateBreadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((it, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": it.name,
      "item": it.item
    }))
  };
}

