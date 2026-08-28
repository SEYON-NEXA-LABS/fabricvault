"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Zap,
  RefreshCw,
  Search,
  Globe,
  ExternalLink,
  Edit2,
  CheckCircle2,
  FileText,
  Sparkles,
  Calendar,
  User,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  featuredImage: string;
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  createdAt: string;
}

export default function BlogCMSPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: "",
    slug: "",
    topic: "Sustainable Fashion & Handloom Care",
    category: "Apparel",
    excerpt: "",
    content: "",
    author: "Editorial Team",
    featuredImage: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&auto=format&fit=crop",
    metaTitle: "",
    metaDescription: "",
    published: true
  });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blogs");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      toast.error("Failed to load blog articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // One-Click AI Article Generator
  const handleGenerateAiArticle = async () => {
    setGeneratingAi(true);
    try {
      const res = await fetch("/api/ai/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: form.topic || "Handloom Fashion Trends 2026",
          brandName: "Seyon Shopping",
          targetCategory: form.category
        })
      });
      const data = await res.json();

      setForm((prev) => ({
        ...prev,
        title: data.title,
        slug: data.slug,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        excerpt: data.excerpt,
        content: data.content,
        author: data.author
      }));

      toast.success("✨ AI Article & SEO Meta Tags generated!");
    } catch (err) {
      toast.error("Failed to generate AI article");
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error("Title and article content are required!");
      return;
    }

    setSavingPost(true);
    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(`Blog post '${form.title}' published successfully!`);
        setShowEditorModal(false);
        fetchPosts();
      }
    } catch (err) {
      toast.error("Failed to publish blog post");
    } finally {
      setSavingPost(false);
    }
  };

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Blog & Content Marketing CMS</h1>
            <p className="text-xs text-slate-500">
              Publish SEO-optimized articles, target long-tail search keywords, and boost your storefront Google Search authority.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/blog"
            target="_blank"
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Globe className="w-4 h-4 text-slate-500" /> View Live Blog <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={() => {
              setForm({
                title: "",
                slug: "",
                topic: "Handloom Fashion Trends 2026",
                category: "Apparel",
                excerpt: "",
                content: "",
                author: "Seyon Editorial",
                featuredImage: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&auto=format&fit=crop",
                metaTitle: "",
                metaDescription: "",
                published: true
              });
              setShowEditorModal(true);
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create New Article
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search published articles..."
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100">
            {posts.length} Published Articles
          </span>
        </div>
      </div>

      {/* Blog Cards Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Loading Blog Articles...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No blog articles found</h3>
          <p className="text-xs text-slate-500">Click "Create New Article" to write or generate an AI blog post!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div
              key={post.id || post.slug}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs space-y-3 flex flex-col justify-between p-5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>{new Date(post.createdAt).toLocaleDateString("en-IN")}</span>
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">Published</span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2">{post.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-3">{post.excerpt || post.content}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">/{post.slug}</span>
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  View Live <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Write or Generate Blog Article</h3>
                  <p className="text-xs text-slate-500">Draft rich SEO content & meta descriptions for search engines.</p>
                </div>
              </div>
              <button onClick={() => setShowEditorModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            {/* AI Generator Bar */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-xl p-4 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-300" /> 1-Click AI Article Generator
                </span>
                <span className="text-[10px] bg-white/20 text-purple-100 px-2 py-0.5 rounded font-mono">SEO Optimized</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={form.topic}
                  onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
                  placeholder="Article Topic (e.g. Handloom Saree Trends)"
                  className="bg-white/10 border border-white/20 rounded-lg p-2 text-xs text-white placeholder-purple-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleGenerateAiArticle}
                  disabled={generatingAi}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-lg py-2 px-3 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {generatingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate AI Article & SEO Meta
                </button>
              </div>
            </div>

            {/* Article Form */}
            <form onSubmit={handleSavePost} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Article Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="e.g. Top 5 Handloom Fabric Trends for 2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Google Title Tag (`metaTitle`)</label>
                  <input
                    type="text"
                    value={form.metaTitle}
                    onChange={(e) => setForm((prev) => ({ ...prev, metaTitle: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Google Meta Description</label>
                <textarea
                  value={form.metaDescription}
                  onChange={(e) => setForm((prev) => ({ ...prev, metaDescription: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Article Content (Markdown / Text) *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  required
                  rows={8}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPost}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingPost && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
