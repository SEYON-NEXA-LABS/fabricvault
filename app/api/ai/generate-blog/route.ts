import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, brandName, targetCategory } = body;

    const blogTopic = topic || "Sustainable Fashion & Handloom Care";
    const brand = brandName || "Seyon Shopping";
    const category = targetCategory || "Apparel";

    const title = `${blogTopic}: Essential Guide by ${brand}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const metaTitle = `${blogTopic} | Complete ${category} Guide — ${brand}`;
    const metaDescription = `Discover everything about ${blogTopic}. Learn styling tips, fabric maintenance, and modern fashion trends curated by ${brand}.`;
    
    const excerpt = `In this complete guide, we dive deep into ${blogTopic}. Discover expert styling advice, sustainable fabric care routines, and how to elevate your wardrobe with timeless ${category}.`;

    const content = `
# ${title}

Fashion is evolving rapidly, but authentic craftsmanship and timeless style remain constant. In this comprehensive guide, **${brand}** explores everything you need to know about **${blogTopic}**.

---

## Why ${category} Matters in Modern Indian Fashion

Indian retail and D2C fashion have seen a massive shift towards organic textures, breathable weaves, and versatile styling. Whether you are building a capsule wardrobe or preparing for festival celebrations, understanding high-quality ${category} helps you make smarter fashion choices.

### Key Highlights:
1. **Fabric Quality & Texture**: Look for pure natural fibers like linen, cotton, and silk blends.
2. **Versatile Styling**: Pair traditional statement pieces with contemporary footwear and accessories.
3. **Care & Longevity**: Wash delicate handloom garments gently in cold water with mild liquid detergent.

---

## Styling Tips for Every Occasion

* **Workwear & Day Events**: Opt for neutral pastel tones with minimal silver jewelry.
* **Evening & Festive Celebrations**: Pair rich crimson, emerald, or indigo tones with statement metallic accents.

---

## Explore the Collection at ${brand}

Upgrade your wardrobe today with our curated selection of high-performance, handcrafted ${category}. Enjoy 100% quality guarantees, free express delivery across India, and easy returns.
    `.trim();

    return NextResponse.json({
      title,
      slug,
      metaTitle,
      metaDescription,
      excerpt,
      content,
      author: `${brand} Editorial Team`,
      featuredImage: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&auto=format&fit=crop"
    });
  } catch (error: any) {
    console.error("AI Blog Writer API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate AI blog article" }, { status: 500 });
  }
}
