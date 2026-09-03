import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get("host") || (process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).host : "localhost:3000");
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/admin/", "/checkout"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
