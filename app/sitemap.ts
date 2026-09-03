import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get("host") || (process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).host : "localhost:3000");
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/platform`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.4,
    },
  ];

  try {
    const [variantsRes, blogsRes, categoriesRes] = await Promise.all([
      supabase.from("ProductVariant").select("id, updatedAt").limit(500),
      supabase.from("BlogPost").select("slug, updatedAt").eq("published", true).limit(100),
      supabase.from("Category").select("id, updatedAt").limit(100)
    ]);

    const productRoutes: MetadataRoute.Sitemap = (variantsRes.data || []).map((v) => ({
      url: `${baseUrl}/products/${v.id}`,
      lastModified: v.updatedAt ? new Date(v.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const blogRoutes: MetadataRoute.Sitemap = (blogsRes.data || []).map((b) => ({
      url: `${baseUrl}/blog/${b.slug}`,
      lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = (categoriesRes.data || []).map((c) => ({
      url: `${baseUrl}/category/${c.id}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...productRoutes, ...blogRoutes, ...categoryRoutes];
  } catch (err) {
    console.error("Error generating sitemap:", err);
  }

  return staticRoutes;
}
