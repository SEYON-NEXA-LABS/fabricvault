import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getContextCompanyId } from "@/lib/session";

// GET: Fetch published blog posts for active company
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const companyId = await getContextCompanyId();

    if (slug) {
      const { data, error } = await supabase
        .from("BlogPost")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ post: data });
    }

    let listQuery = supabase.from("BlogPost").select("*").order("createdAt", { ascending: false });
    if (companyId) {
      listQuery = listQuery.eq("companyId", companyId);
    }
    const { data: posts, error } = await listQuery;

    if (error) {
      // Mock fallback if table not yet migrated
      return NextResponse.json({
        posts: [
          {
            id: "mock-1",
            title: "Top 5 Handloom Fabric Trends for Festive Season 2026",
            slug: "top-5-handloom-fabric-trends-2026",
            excerpt: "Explore the resurgence of organic chanderi silk and linen handloom fashion crafted for modern celebrations.",
            content: "Handloom fabrics have taken center stage in contemporary Indian fashion. From pure organic linen sarees to hand-block printed cotton shirts, discovering authentic handloom garments brings timeless elegance to your wardrobe...",
            author: "Seyon Fashion Editorial",
            featuredImage: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&auto=format&fit=crop",
            metaTitle: "Top 5 Handloom Fabric Trends for Festive Season 2026",
            metaDescription: "Discover handloom chanderi silk and linen fashion trends for 2026.",
            published: true,
            createdAt: new Date().toISOString()
          }
        ]
      });
    }

    return NextResponse.json({ posts: posts || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch blog posts" }, { status: 500 });
  }
}

// POST: Create or update blog post
export async function POST(request: Request) {
  try {
    const companyId = await getContextCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Company context not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, slug, content, excerpt, author, featuredImage, metaTitle, metaDescription, published } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const postPayload = {
      companyId,
      title,
      slug: generatedSlug,
      content,
      excerpt: excerpt || content.slice(0, 150) + "...",
      author: author || "Editorial Team",
      featuredImage: featuredImage || "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&auto=format&fit=crop",
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt || title,
      published: published !== undefined ? published : true,
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("BlogPost")
      .upsert(postPayload, { onConflict: "companyId,slug" })
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("BlogPost save error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: data || postPayload });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save blog post" }, { status: 500 });
  }
}
