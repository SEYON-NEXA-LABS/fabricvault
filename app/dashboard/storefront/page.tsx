"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  Layout,
  Type,
  Sparkles,
  Layers,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Image as ImageIcon,
  Globe,
  ExternalLink,
  Store,
  Tag,
  Monitor,
  Smartphone,
  Check
} from "lucide-react";
import { toast } from "sonner";

interface ThemeConfig {
  primary: string;
  accent: string;
  radius: string;
  fontFamily: string;
  announcementText: string;
  logoUrl?: string;
  heroBannerUrl?: string;
  layoutPreset: "MINIMALIST" | "LUXURY" | "STREETWEAR" | "RETAIL_GRID";
}

const LAYOUT_PRESETS = [
  {
    id: "MINIMALIST",
    title: "Modern Minimalist D2C",
    subtitle: "Clean white background, soft teal & indigo accents, 3-4 column grid, slide-over drawer cart.",
    badge: "Most Popular",
    primary: "#0d9488",
    accent: "#fbbf24",
    font: "Inter, sans-serif",
    radius: "0.5rem",
    tagline: "High-End Essentials"
  },
  {
    id: "LUXURY",
    title: "Luxury Editorial Lookbook",
    subtitle: "Dark dramatic aesthetic, serif typography, gold accents, full-bleed hero story lookbooks.",
    badge: "High Fashion",
    primary: "#18181b",
    accent: "#d97706",
    font: "Playfair Display, serif",
    radius: "0.25rem",
    tagline: "Aurora Eclipse Couture"
  },
  {
    id: "STREETWEAR",
    title: "Streetwear & Urban Tech",
    subtitle: "Dark mode default, bold hypewear typography, vibrant electric orange accents & flash tickers.",
    badge: "Trending",
    primary: "#09090b",
    accent: "#f97316",
    font: "Outfit, sans-serif",
    radius: "0rem",
    tagline: "Drop 004 // Live"
  },
  {
    id: "RETAIL_GRID",
    title: "Hyper-Retail Superstore",
    subtitle: "High-density multi-category grid, quick-add quantity counters, sticky category navigation.",
    badge: "High Volume",
    primary: "#2563eb",
    accent: "#10b981",
    font: "Plus Jakarta Sans, sans-serif",
    radius: "0.375rem",
    tagline: "Seyon Wholesale Mart"
  }
];

const PRESET_PALETTES = [
  { name: "Emerald Teal", primary: "#0d9488", accent: "#fbbf24", desc: "Default D2C Teal & Gold" },
  { name: "Streetwear Dark", primary: "#09090b", accent: "#8b5cf6", desc: "Midnight & Electric Violet" },
  { name: "Royal Indigo", primary: "#4f46e5", accent: "#f59e0b", desc: "Indigo Blue & Amber" },
  { name: "Blush Rose", primary: "#e11d48", accent: "#d97706", desc: "Rose Gold & Sand" },
  { name: "Forest Sage", primary: "#15803d", accent: "#84cc16", desc: "Forest Green & Lime" }
];

export default function StorefrontConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"layouts" | "branding" | "announcement">("layouts");
  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">("desktop");

  const [theme, setTheme] = useState<ThemeConfig>({
    primary: "#0d9488",
    accent: "#fbbf24",
    radius: "0.5rem",
    fontFamily: "Inter, sans-serif",
    announcementText: "⚡ Free Express Delivery across India on orders over ₹1,999!",
    logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop",
    heroBannerUrl: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200&auto=format&fit=crop",
    layoutPreset: "MINIMALIST"
  });

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data && data.themeConfig) {
          const parsed = typeof data.themeConfig === "string" ? JSON.parse(data.themeConfig) : data.themeConfig;
          setTheme((prev) => ({
            ...prev,
            ...parsed
          }));
        }
      } catch (err) {
        console.error("Failed to load storefront settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeConfig: theme })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Storefront configuration saved successfully!");
      }
    } catch (err) {
      toast.error("Failed to save storefront configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
        <span>Loading Storefront Configuration...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Layout className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Storefront Design & Layout Builder</h1>
              <p className="text-xs text-slate-500">
                Configure your Seyon Shopping merchant storefront design templates, color themes, fonts, and promotional banners.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Globe className="w-4 h-4 text-slate-500" /> View Live Store <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save Configuration
          </button>
        </div>
      </div>

      {/* Main Grid: Controls (Left) & Real-time Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customization Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
            <button
              onClick={() => setActiveTab("layouts")}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "layouts"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 bg-slate-100/70"
              }`}
            >
              <Layout className="w-4 h-4" /> Layout Presets
            </button>
            <button
              onClick={() => setActiveTab("branding")}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "branding"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 bg-slate-100/70"
              }`}
            >
              <Palette className="w-4 h-4" /> Colors & Fonts
            </button>
            <button
              onClick={() => setActiveTab("announcement")}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "announcement"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 bg-slate-100/70"
              }`}
            >
              <Sparkles className="w-4 h-4" /> Announcement Bar
            </button>
          </div>

          {/* TAB 1: Layout Presets */}
          {activeTab === "layouts" && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Select Storefront Layout Template</h2>
              <div className="grid grid-cols-1 gap-4">
                {LAYOUT_PRESETS.map((preset) => {
                  const isSelected = theme.layoutPreset === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() =>
                        setTheme((prev) => ({
                          ...prev,
                          layoutPreset: preset.id as any,
                          primary: preset.primary,
                          accent: preset.accent,
                          fontFamily: preset.font,
                          radius: preset.radius
                        }))
                      }
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-md"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{preset.title}</span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                              {preset.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{preset.subtitle}</p>
                        </div>
                        {isSelected && (
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4" />
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 font-mono">
                            <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: preset.primary }} /> Primary: {preset.primary}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: preset.accent }} /> Accent: {preset.accent}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-700">{preset.font.split(",")[0]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Colors & Fonts */}
          {activeTab === "branding" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
              {/* Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Quick Palette Presets
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PRESET_PALETTES.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        setTheme((prev) => ({
                          ...prev,
                          primary: preset.primary,
                          accent: preset.accent
                        }))
                      }
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        theme.primary === preset.primary && theme.accent === preset.accent
                          ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: preset.primary }} />
                        <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: preset.accent }} />
                      </div>
                      <span className="font-bold text-xs text-slate-900 block">{preset.name}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Primary Brand Accent</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.primary}
                      onChange={(e) => setTheme((prev) => ({ ...prev, primary: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={theme.primary}
                      onChange={(e) => setTheme((prev) => ({ ...prev, primary: e.target.value }))}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-mono text-slate-800 uppercase focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Secondary Accent / Badge</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.accent}
                      onChange={(e) => setTheme((prev) => ({ ...prev, accent: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={theme.accent}
                      onChange={(e) => setTheme((prev) => ({ ...prev, accent: e.target.value }))}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-mono text-slate-800 uppercase focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Typography & Radius */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-slate-500" /> Google Font Family
                  </label>
                  <select
                    value={theme.fontFamily}
                    onChange={(e) => setTheme((prev) => ({ ...prev, fontFamily: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="Inter, sans-serif">Inter (Modern Clean D2C)</option>
                    <option value="Outfit, sans-serif">Outfit (Geometric Brand)</option>
                    <option value="Playfair Display, serif">Playfair Display (Luxury Serif)</option>
                    <option value="Plus Jakarta Sans, sans-serif">Plus Jakarta Sans (Tech & Minimal)</option>
                    <option value="Cinzel, serif">Cinzel (Heritage Apparel)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">UI Corner Radius</label>
                  <select
                    value={theme.radius}
                    onChange={(e) => setTheme((prev) => ({ ...prev, radius: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="0px">Sharp (0px)</option>
                    <option value="0.375rem">Subtle (6px Default)</option>
                    <option value="0.75rem">Rounded (12px)</option>
                    <option value="1.5rem">Soft Pill (24px)</option>
                  </select>
                </div>
              </div>

              {/* Hero Banner & Logo Image URLs */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Storefront Images & Media Assets
                </label>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Hero Banner Image URL</label>
                  <input
                    type="url"
                    value={theme.heroBannerUrl || ""}
                    onChange={(e) => setTheme((prev) => ({ ...prev, heroBannerUrl: e.target.value }))}
                    placeholder="https://images.unsplash.com/... or CDN link"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-mono text-slate-800 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500">
                    High-resolution hero banner rendered at the top of your storefront homepage.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Brand Logo Image URL</label>
                  <input
                    type="url"
                    value={theme.logoUrl || ""}
                    onChange={(e) => setTheme((prev) => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="https://yourbrand.com/logo.png"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Announcement Bar */}
          {activeTab === "announcement" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
              <label className="text-xs font-semibold text-slate-700 block">Top Announcement Banner Text</label>
              <input
                type="text"
                value={theme.announcementText}
                onChange={(e) => setTheme((prev) => ({ ...prev, announcementText: e.target.value }))}
                placeholder="e.g. ⚡ Free Express Delivery on orders over ₹1,999!"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="text-[11px] text-slate-500">
                This banner sits sticky at the top of your storefront header.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Storefront Mockup Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-indigo-600" /> Interactive Live Preview
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setDevicePreview("desktop")}
                className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                  devicePreview === "desktop" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDevicePreview("mobile")}
                className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                  devicePreview === "mobile" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Device Frame */}
          <div
            className={`mx-auto transition-all border border-slate-300 rounded-2xl shadow-xl overflow-hidden bg-slate-950 ${
              devicePreview === "mobile" ? "max-w-[340px]" : "w-full"
            }`}
          >
            {/* Top Browser Bar */}
            <div className="bg-slate-900 px-3 py-2 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] font-mono text-slate-400 truncate">
                https://store.seyon.app
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">{theme.layoutPreset}</span>
            </div>

            {/* Mockup Store Body */}
            <div
              className={`p-4 space-y-4 text-slate-900 ${
                theme.layoutPreset === "LUXURY" || theme.layoutPreset === "STREETWEAR"
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-900"
              }`}
              style={{ fontFamily: theme.fontFamily }}
            >
              {/* Sticky Announcement Ticker */}
              <div
                className="text-[11px] font-bold px-3 py-1.5 text-center truncate"
                style={{ backgroundColor: theme.primary, color: "#ffffff", borderRadius: theme.radius }}
              >
                {theme.announcementText || "Top Announcement Bar"}
              </div>

              {/* Header Navigation */}
              <div className="flex items-center justify-between border-b border-slate-200/20 pb-2">
                <span className="font-extrabold text-sm tracking-tight">SEYON SHOPPING</span>
                <span
                  className="text-[9px] font-extrabold px-2 py-0.5 uppercase tracking-wider"
                  style={{ backgroundColor: theme.accent, color: "#000000", borderRadius: theme.radius }}
                >
                  CART (2)
                </span>
              </div>

              {/* Hero Banner Mock */}
              <div
                className="p-6 rounded-xl space-y-2 text-center border border-white/10 bg-cover bg-center relative overflow-hidden"
                style={{
                  backgroundImage: theme.heroBannerUrl ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${theme.heroBannerUrl})` : undefined,
                  backgroundColor: theme.layoutPreset === "STREETWEAR" ? "#18181b" : `${theme.primary}15`,
                  borderRadius: theme.radius
                }}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200 block drop-shadow-xs">NEW COLLECTION 2026</span>
                <h3 className="font-extrabold text-base text-white drop-shadow-xs">Summer Handloom Drop</h3>
                <button
                  type="button"
                  className="px-4 py-1.5 text-xs font-bold text-white shadow-sm inline-block cursor-pointer"
                  style={{ backgroundColor: theme.primary, borderRadius: theme.radius }}
                >
                  Shop Collection
                </button>
              </div>

              {/* Product Cards Grid Preview */}
              <div className={`grid ${devicePreview === "mobile" ? "grid-cols-1" : "grid-cols-2"} gap-3`}>
                {[1, 2].map((idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border space-y-2 ${
                      theme.layoutPreset === "LUXURY" || theme.layoutPreset === "STREETWEAR"
                        ? "bg-slate-900 border-slate-800"
                        : "bg-slate-50 border-slate-200"
                    }`}
                    style={{ borderRadius: theme.radius }}
                  >
                    <div className="h-24 bg-slate-200/50 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-bold">
                      PRODUCT IMAGE #{idx}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Premium Linen Shirt</span>
                      <span className="text-xs font-extrabold text-emerald-600">₹1,999</span>
                    </div>
                    <button
                      type="button"
                      className="w-full py-1.5 text-xs font-bold text-white shadow-2xs"
                      style={{ backgroundColor: theme.primary, borderRadius: theme.radius }}
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
