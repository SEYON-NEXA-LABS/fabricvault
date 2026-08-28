import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Calendar, User, ArrowLeft, Share2, Sparkles, ShoppingBag } from "lucide-react";

async function getArticle(slug: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${appUrl}/api/blogs?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
    const data = await res.json();
    return data.post || null;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: "Article Not Found | Seyon Shopping",
    };
  }

  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.excerpt,
      images: [article.featuredImage],
      type: "article",
    },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  // Schema.org Article Structured Data (JSON-LD) for Google Rich Snippets
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.metaDescription || article.excerpt,
    "image": [article.featuredImage],
    "author": {
      "@type": "Organization",
      "name": article.author || "Seyon Shopping Editorial"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Seyon Shopping",
      "logo": {
        "@type": "ImageObject",
        "url": "https://merchantvault.vercel.app/logo.png"
      }
    },
    "datePublished": article.createdAt,
    "dateModified": article.updatedAt || article.createdAt
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Article Schema Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Top Header Navigation */}
      <div className="bg-white border-b border-slate-200 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/blog" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Journal
          </Link>
          <span className="text-xs font-extrabold text-indigo-600 tracking-wide uppercase">Seyon Shopping Journal</span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 pt-10 space-y-8">
        {/* Title & Metadata */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              {new Date(article.createdAt).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              {article.author || "Editorial Team"}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {article.title}
          </h1>

          <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {article.excerpt}
          </p>
        </div>

        {/* Featured Hero Image */}
        {article.featuredImage && (
          <div className="rounded-3xl overflow-hidden shadow-md border border-slate-200 h-[380px] bg-slate-100">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Body Text */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-2xs space-y-6 max-w-3xl mx-auto">
          <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm md:text-base space-y-4 whitespace-pre-wrap">
            {article.content}
          </div>

          {/* Call-to-action Store Banner */}
          <div className="mt-10 pt-8 border-t border-slate-100 bg-indigo-50/50 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-extrabold text-sm text-slate-900 block">Inspired by this read?</span>
              <p className="text-xs text-slate-600">Explore our handcrafted apparel collections available for instant delivery.</p>
            </div>
            <Link
              href="/"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <ShoppingBag className="w-4 h-4" /> Shop Storefront
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
