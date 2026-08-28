import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { BookOpen, Calendar, User, ArrowRight, Sparkles, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog & Fashion Articles | Seyon Shopping",
  description: "Read the latest handloom fashion trends, D2C styling guides, fabric maintenance tips, and retail insights curated by Seyon Shopping.",
};

async function getBlogPosts() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${appUrl}/api/blogs`, { cache: "no-store" });
    const data = await res.json();
    return data.posts || [];
  } catch (err) {
    return [];
  }
}

export default async function BlogListingPage() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-extrabold uppercase tracking-widest border border-indigo-500/30">
            <BookOpen className="w-3.5 h-3.5" /> Seyon Editorial & Journal
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">Fashion, Trends & Retail Journal</h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Discover expert styling advice, fabric care routines, and trends curated by our fashion editors.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        {posts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No blog posts published yet</h3>
            <p className="text-xs text-slate-500">Check back soon for new fashion articles and styling guides!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => (
              <article
                key={post.id || post.slug}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
              >
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={post.featuredImage || "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&auto=format&fit=crop"}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-600" />
                        {new Date(post.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-indigo-600" />
                        {post.author || "Editorial"}
                      </span>
                    </div>

                    <h2 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {post.excerpt || post.content?.slice(0, 140)}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                    >
                      Read Full Article <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
