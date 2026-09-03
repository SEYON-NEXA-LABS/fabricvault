import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

const MOCK_PRODUCTS: Record<string, any> = {
  "mock-1": {
    id: "mock-1",
    sku: "MRC-BKP-01",
    title: "Minimalist Commuter Backpack",
    size: "Standard",
    color: "Charcoal Black",
    price: 3499,
    currentStockLevel: 12,
    category: "Accessories",
    rating: 4.8,
    reviews: 24,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
    description: "Durable water-resistant commuter backpack featuring dedicated laptop compartment and ergonomic padded shoulder straps."
  },
  "mock-2": {
    id: "mock-2",
    sku: "MRC-WTR-02",
    title: "Insulated Stainless Steel Flask",
    size: "750ml",
    color: "Sage Green",
    price: 1899,
    currentStockLevel: 25,
    category: "Accessories",
    rating: 4.6,
    reviews: 18,
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
    description: "Double-wall vacuum insulated stainless steel water bottle keeping drinks ice cold for 24 hours."
  },
  "mock-3": {
    id: "mock-3",
    sku: "MRC-JKT-03",
    title: "Technical Utility Jacket",
    size: "L",
    color: "Khaki Gold",
    price: 4500,
    currentStockLevel: 8,
    category: "Apparel",
    rating: 4.9,
    reviews: 32,
    imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&auto=format&fit=crop&q=80",
    description: "Multi-pocket weather-resistant utility jacket crafted with breathable technical fabric."
  },
  "mock-4": {
    id: "mock-4",
    sku: "MRC-TEE-04",
    title: "Organic Heavyweight Oversized Tee",
    size: "M",
    color: "Off-White",
    price: 1499,
    currentStockLevel: 18,
    category: "Apparel",
    rating: 4.7,
    reviews: 41,
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    description: "100% organic combed cotton heavy jersey relaxed-fit essential graphic t-shirt."
  },
  "mock-5": {
    id: "mock-5",
    sku: "MRC-HD-05",
    title: "Essential French Terry Hoodie",
    size: "L",
    color: "Navy Blue",
    price: 3299,
    currentStockLevel: 15,
    category: "Apparel",
    rating: 4.8,
    reviews: 29,
    imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
    description: "Ultra-soft premium French terry hoodie with double-layered hood and ribbed cuffs."
  },
  "mock-6": {
    id: "mock-6",
    sku: "MRC-SW-06",
    title: "Chronograph Stainless Steel Watch",
    size: "42mm",
    color: "Silver / Slate",
    price: 8999,
    currentStockLevel: 30,
    category: "Accessories",
    rating: 4.9,
    reviews: 53,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    description: "Precision Japanese quartz movement chronograph watch with scratch-resistant sapphire crystal."
  },
  "mock-7": {
    id: "mock-7",
    sku: "MRC-SNK-07",
    title: "Urban Minimalist Leather Sneakers",
    size: "UK 9",
    color: "Monochrome White",
    price: 4999,
    currentStockLevel: 10,
    category: "Footwear",
    rating: 4.7,
    reviews: 22,
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80",
    description: "Full-grain Italian leather sneakers with cushioned memory foam footbed."
  },
  "mock-8": {
    id: "mock-8",
    sku: "MRC-TRS-08",
    title: "Classic Tailored Chinos",
    size: "32",
    color: "Sage Green",
    price: 2899,
    currentStockLevel: 5,
    category: "Apparel",
    rating: 4.6,
    reviews: 18,
    imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80",
    description: "Versatile stretch chinos featuring clean tailoring and breathable comfort."
  }
};

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // 1. Check Mock Data
    if (MOCK_PRODUCTS[id]) {
      return NextResponse.json({
        product: MOCK_PRODUCTS[id],
        company: { name: "Seyon Shopping", storeName: "Seyon Shopping Store", code: "syn" }
      });
    }

    // 2. Query Live Supabase Database
    if (supabase) {
      // Query by ID or SKU
      const { data: variant } = await supabase
        .from("ProductVariant")
        .select("id, sku, title, size, color, price, compareAtPrice, currentStockLevel, category, categoryId, categoryName, vendor, thumbnailConfig, companyId, brandId, createdAt")
        .or(`id.eq.${id},sku.eq.${id}`)
        .maybeSingle();

      if (variant) {
        let company: any = null;
        if (variant.companyId) {
          const { data: comp } = await supabase
            .from("Company")
            .select("id, name, storeName, code, gstin, contactEmail, whatsappNumber")
            .eq("id", variant.companyId)
            .maybeSingle();
          company = comp;
        }

        const product = {
          id: variant.id,
          sku: variant.sku,
          title: variant.title,
          size: variant.size || "M",
          color: variant.color || "Indigo Blue",
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          currentStockLevel: variant.currentStockLevel ?? 0,
          category: variant.category || variant.categoryName || "Apparel",
          rating: 4.8,
          reviews: 16,
          imageUrl: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&auto=format&fit=crop&q=80",
          thumbnailConfig: variant.thumbnailConfig,
          description: `${variant.title} (${variant.sku}). Crafted with high-grade materials for optimal comfort, durability, and modern fashion aesthetics.`
        };

        return NextResponse.json({ product, company });
      }
    }

    // 3. Fallback: Return first mock product if requested ID is mock-like or not found
    return NextResponse.json({
      product: {
        ...MOCK_PRODUCTS["mock-1"],
        id,
        title: `Product #${id.substring(0, 8)}`
      },
      company: { name: "Seyon Shopping", storeName: "Seyon Shopping Store", code: "syn" }
    });
  } catch (error: any) {
    console.error("Get Single Product Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load product" }, { status: 500 });
  }
}
