import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { supabase } from "@repo/db";

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
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  try {
    if (!supabase) return staticRoutes;

    // Fetch active product variants for dynamic product detail page sitemaps
    const { data: variants } = await supabase
      .from("ProductVariant")
      .select("id, updatedAt")
      .limit(100);

    if (variants && variants.length > 0) {
      const productRoutes: MetadataRoute.Sitemap = variants.map((v) => ({
        url: `${baseUrl}/products/${v.id}`,
        lastModified: v.updatedAt ? new Date(v.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

      return [...staticRoutes, ...productRoutes];
    }
  } catch (err) {
    console.error("Error generating sitemap:", err);
  }

  return staticRoutes;
}
