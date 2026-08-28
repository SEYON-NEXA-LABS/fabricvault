import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, title, category, color, size, brand, price, segmentType } = body;

    // Mode 1: Product Copy & SEO Meta Generator
    if (type === "PRODUCT_COPY") {
      const productName = title || "Product Item";
      const productCategory = category || "Apparel";
      const productBrand = brand || "Seyon";

      const seoTitle = `${productName} | Premium ${productCategory} - ${productBrand}`;
      const metaDescription = `Shop ${productName} by ${productBrand}. Crafted with premium quality materials, comfortable fit, and modern styling. Enjoy fast shipping & easy returns across India.`;
      
      const productStory = `Elevate your everyday wardrobe with the ${productName}. Meticulously designed for modern comfort and effortless style, this piece blends premium craftsmanship with soft, durable fabric tailored for year-round versatility. Whether dressed up for evening occasions or paired casually for daywear, it delivers a refined silhouette and all-day comfort.`;

      const instagramCaption = `✨ Style Upgrade Alert: Presenting the all-new ${productName} by ${productBrand}! 🔥 Designed for effortless elegance and unmatched comfort. Available now on our store. Tap link in bio to shop! 🛍️✨\n\n#${productBrand.replace(/\s+/g, "")} #${productCategory.replace(/\s+/g, "")} #D2CFashion #IndianRetail #NewArrivals`;

      return NextResponse.json({
        seoTitle,
        metaDescription,
        productStory,
        instagramCaption,
        bullets: [
          `Premium breathable fabric blend for all-day comfort`,
          `Precision tailoring & reinforced stitching`,
          `Easy machine-wash care with minimal shrinkage`,
          `100% Quality Inspected & Fast Express Delivery`
        ]
      });
    }

    // Mode 2: CRM WhatsApp Campaign Broadcast Assistant
    if (type === "WHATSAPP_CAMPAIGN") {
      if (segmentType === "VIP") {
        return NextResponse.json({
          segmentName: "👑 VIP High LTV Customers",
          couponCode: "VIPPREVIEW15",
          discountText: "15% Exclusive VIP Discount",
          message: `Hello {{customer_name}}! 🌟 As one of our valued VIP members at {{store_name}}, we're giving you exclusive early access to our new catalog drop! Use code *VIPPREVIEW15* at checkout for a flat 15% OFF your order. Shop now: {{store_url}}`
        });
      }

      if (segmentType === "WINBACK") {
        return NextResponse.json({
          segmentName: "🔄 Inactive Customer Win-Back",
          couponCode: "WE-MISS-YOU",
          discountText: "Flat ₹200 OFF on your next order",
          message: `Hey {{customer_name}}! We miss seeing you at {{store_name}}. 🎁 Here's a special ₹200 gift voucher for your next order! Use code *WE-MISS-YOU* today. Explore new arrivals: {{store_url}}`
        });
      }

      // Default: First-Time Welcome Segment
      return NextResponse.json({
        segmentName: "🎁 First-Time Customer Onboarding",
        couponCode: "WELCOME10",
        discountText: "10% First Order Discount",
        message: `Welcome to {{store_name}}, {{customer_name}}! 🎉 Thank you for joining us. Use code *WELCOME10* on your first purchase today for 10% OFF. Happy shopping: {{store_url}}`
      });
    }

    return NextResponse.json({ error: "Invalid copy generation type" }, { status: 400 });
  } catch (error: any) {
    console.error("AI Copy Generator API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate AI copy" }, { status: 500 });
  }
}
