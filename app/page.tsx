"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { applyBrandingStyles } from "./utils/branding";
import { ProductVariant } from "@/types/inventory";
import { 
  Scissors, 
  ShoppingCart, 
  Search, 
  X, 
  ShoppingBag, 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Heart,
  Grid,
  WifiOff,
  Shirt,
  Gem,
  Watch,
  Glasses,
  Footprints,
  Crown,
  Palette,
  Star,
  Zap,
  Info,
  User,
  Eye
} from "lucide-react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { generateOrganizationSchema, generateProductSchema } from "./utils/seo";



// Mock Fallback Products for a premium retail aesthetic
const FALLBACK_PRODUCTS = [
  {
    id: "mock-1",
    sku: "MRC-BKP-01",
    title: "Minimalist Commuter Backpack",
    size: "Standard",
    color: "Charcoal Black",
    price: 3499,
    currentStockLevel: 12,
    category: "Accessories",
    rating: 4.8,
    reviews: 24,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
    description: "Durable water-resistant commuter backpack featuring dedicated laptop compartment and ergonomic padded shoulder straps."
  },
  {
    id: "mock-2",
    sku: "MRC-WTR-02",
    title: "Insulated Stainless Steel Flask",
    size: "750ml",
    color: "Sage Green",
    price: 1899,
    currentStockLevel: 25,
    category: "Accessories",
    rating: 4.6,
    reviews: 18,
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
    description: "Double-wall vacuum insulated stainless steel water bottle keeping drinks ice cold for 24 hours."
  },
  {
    id: "mock-3",
    sku: "MRC-JKT-03",
    title: "Technical Utility Jacket",
    size: "L",
    color: "Khaki Gold",
    price: 4500,
    currentStockLevel: 8,
    category: "Apparel",
    rating: 4.9,
    reviews: 32,
    imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&auto=format&fit=crop&q=80",
    description: "Weatherproof lightweight outer shell designed with multiple utility pockets and breathable lining."
  },
  {
    id: "mock-4",
    sku: "MRC-TEE-04",
    title: "Essential Crewneck T-Shirt",
    size: "M",
    color: "Off-White",
    price: 1299,
    currentStockLevel: 18,
    category: "Apparel",
    rating: 4.7,
    reviews: 58,
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    description: "Luxuriously soft premium cotton t-shirt. The ideal daily classic foundation piece."
  },
  {
    id: "mock-5",
    sku: "MRC-BEL-05",
    title: "Premium Leather Belt",
    size: "M",
    color: "Charcoal Black",
    price: 1899,
    currentStockLevel: 15,
    category: "Footwear & Bags",
    rating: 4.7,
    reviews: 14,
    imageUrl: "https://images.unsplash.com/photo-1624222247344-550fb8ec5507?w=800&auto=format&fit=crop&q=80",
    description: "Genuine top-grain leather dress belt with a clean brushed steel buckle."
  },
  {
    id: "mock-cosmetic-1",
    sku: "MRC-BEA-01",
    title: "Botanical Radiance Vitamin C Serum",
    size: "30ml",
    color: "Warm Amber",
    price: 1499,
    currentStockLevel: 30,
    category: "Cosmetics & Beauty",
    rating: 4.9,
    reviews: 86,
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80",
    description: "🌿 100% Organic & Vegan. Brightens skin tone and restores youthful collagen radiance with Hyaluronic Acid."
  },
  {
    id: "mock-baby-1",
    sku: "MRC-BBY-01",
    title: "Ultra-Soft Organic Bamboo Onesie Set",
    size: "3-6M",
    color: "Pastel Mint",
    price: 1299,
    currentStockLevel: 20,
    category: "Baby & Kids",
    rating: 4.9,
    reviews: 42,
    imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80",
    description: "👶 Hypoallergenic & BPA-Free. Breathable bamboo fabric designed specifically for delicate newborn skin."
  },
  {
    id: "mock-jewel-1",
    sku: "MRC-JWL-01",
    title: "18K Gold Plated Heritage Pendant",
    size: "One Size",
    color: "Gold",
    price: 2499,
    currentStockLevel: 10,
    category: "Jewelry & Accessories",
    rating: 4.8,
    reviews: 31,
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80",
    description: "✨ Anti-tarnish waterproof gold pendant. Includes 1-year tarnish warranty & premium velvet gift box."
  },
  {
    id: "mock-dress-1",
    sku: "MRC-DRS-01",
    title: "Handcrafted Chanderi Silk Ethnic Kurta",
    size: "M",
    color: "Royal Crimson",
    price: 3899,
    currentStockLevel: 12,
    category: "Apparel & Dresses",
    rating: 4.9,
    reviews: 64,
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
    description: "👗 Premium handloom Chanderi silk tunic featuring intricate zardozi embroidery and breathable lining."
  },
  {
    id: "mock-6",
    sku: "MRC-CAP-06",
    title: "Organic Cotton Twill Cap",
    size: "Adjustable",
    color: "Off-White",
    price: 999,
    currentStockLevel: 10,
    category: "Accessories",
    rating: 4.4,
    reviews: 9,
    imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80",
    description: "A classic 6-panel cap crafted from certified organic cotton twill with an adjustable back strap."
  },
  {
    id: "mock-7",
    sku: "MRC-WND-07",
    title: "Lightweight Technical Windbreaker",
    size: "M",
    color: "Dark Navy",
    price: 4899,
    currentStockLevel: 14,
    category: "Apparel",
    rating: 4.7,
    reviews: 17,
    imageUrl: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80",
    description: "Water-resistant ripstop windbreaker featuring an adjustable hood and zippered pockets."
  },
  {
    id: "mock-8",
    sku: "MRC-TRS-08",
    title: "Classic Tailored Chinos",
    size: "32",
    color: "Sage Green",
    price: 2899,
    currentStockLevel: 5,
    category: "Apparel",
    rating: 4.6,
    reviews: 18,
    imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80",
    description: "Versatile stretch chinos featuring clean tailoring and breathable comfort."
  }
];

const getColorValue = (colorName: string) => {
  if (!colorName) return "#e4e4e7";
  const normalized = colorName.toLowerCase();
  if (normalized.includes("indigo") || normalized.includes("blue")) return "#3b82f6";
  if (normalized.includes("navy")) return "#1e3a8a";
  if (normalized.includes("teal") || normalized.includes("cyan") || normalized.includes("turquoise")) return "#06b6d4";
  if (normalized.includes("green") || normalized.includes("sage")) return "#86efac";
  if (normalized.includes("emerald")) return "#059669";
  if (normalized.includes("olive")) return "#65a30d";
  if (normalized.includes("black") || normalized.includes("charcoal")) return "#18181b";
  if (normalized.includes("white") || normalized.includes("off-white") || normalized.includes("cream")) return "#fafafa";
  if (normalized.includes("gold") || normalized.includes("yellow") || normalized.includes("mustard")) return "#facc15";
  if (normalized.includes("orange") || normalized.includes("rust") || normalized.includes("peach") || normalized.includes("coral")) return "#f97316";
  if (normalized.includes("rose") || normalized.includes("crimson") || normalized.includes("red") || normalized.includes("maroon") || normalized.includes("ruby")) return "#e11d48";
  if (normalized.includes("pink") || normalized.includes("magenta") || normalized.includes("blush")) return "#ec4899";
  if (normalized.includes("purple") || normalized.includes("violet") || normalized.includes("lavender") || normalized.includes("plum")) return "#8b5cf6";
  if (normalized.includes("brown") || normalized.includes("tan") || normalized.includes("beige") || normalized.includes("camel") || normalized.includes("khaki")) return "#92400e";
  if (normalized.includes("grey") || normalized.includes("gray")) return "#71717a";
  return "#d4d4d8";
};

const isDarkColor = (colorName: string) => {
  const normalized = colorName.toLowerCase();
  return (
    normalized.includes("black") ||
    normalized.includes("charcoal") ||
    normalized.includes("navy") ||
    normalized.includes("rose") ||
    normalized.includes("crimson") ||
    normalized.includes("indigo") ||
    normalized.includes("olive")
  );
};

const getSizeFontSize = (sizeName: string) => {
  const normalized = sizeName.toUpperCase();
  if (normalized === "XS") return "0.6rem";
  if (normalized === "S") return "0.7rem";
  if (normalized === "M") return "0.8rem";
  if (normalized === "L") return "0.9rem";
  if (normalized === "XL") return "1.0rem";
  if (normalized === "XXL" || normalized === "2XL") return "1.1rem";
  if (normalized === "3XL") return "1.2rem";
  return "0.8rem";
};

function ProductImage({ prod, style, showGallery = true }: { prod: any; style?: React.CSSProperties; showGallery?: boolean }) {
  const [activeIdx, setActiveIdx] = React.useState(0);

  let config: any = null;
  if (prod.thumbnailConfig) {
    try {
      config = JSON.parse(prod.thumbnailConfig);
    } catch (e) {
      // ignore
    }
  }

  const imagesList = config && config.images && Array.isArray(config.images) && config.images.length > 0
    ? config.images
    : config && config.imageUrl
      ? [config.imageUrl]
      : prod.imageUrl
        ? [prod.imageUrl]
        : [];

  const PRODUCT_ICONS = [
    Shirt, ShoppingBag, Gem, Watch, Glasses, Footprints,
    Crown, Scissors, Palette, Sparkles, Star, Zap
  ];

  if (imagesList.length > 0) {
    const activeUrl = imagesList[activeIdx] || imagesList[0];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", height: "100%" }}>
        <div style={{ flex: 1, position: "relative", overflow: "hidden", borderRadius: "0.375rem", aspectRatio: "3/4", width: "100%" }}>
          <img
            src={activeUrl}
            alt={prod.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", ...style }}
          />
        </div>
        {showGallery && imagesList.length > 1 && (
          <div style={{ display: "flex", gap: "0.375rem", overflowX: "auto", paddingBottom: "0.15rem" }}>
            {imagesList.map((imgUrl: string, idx: number) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx(idx);
                }}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "0.25rem",
                  overflow: "hidden",
                  border: activeIdx === idx ? "1.5px solid #09090b" : "1px solid #e4e4e7",
                  padding: 0,
                  cursor: "pointer",
                  flexShrink: 0
                }}
              >
                <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (config) {
    const bgColor = config.color === "green" ? "#f0fdf4" : 
                    config.color === "black" ? "#f4f4f5" : 
                    config.color === "white" ? "#ffffff" : 
                    config.color === "olive" ? "#f0fdf4" :
                    config.color === "grey" ? "#fafafa" :
                    config.color === "navy" ? "#f0f9ff" :
                    `#fafafa`;
    
    const shapeColor = config.color === "black" ? "#71717a" :
                       config.color === "white" ? "#d4d4d8" :
                       config.color === "green" ? "#22c55e" :
                       config.color === "olive" ? "#84cc16" :
                       config.color === "grey" ? "#a1a1aa" :
                       config.color === "navy" ? "#0ea5e9" :
                       "#6366f1";
                        
    const textAndIconColor = config.color === "black" ? "#09090b" :
                             config.color === "white" ? "#27272a" :
                             config.color === "green" ? "#166534" :
                             config.color === "olive" ? "#3f6212" :
                             config.color === "grey" ? "#3f3f46" :
                             config.color === "navy" ? "#0369a1" :
                             "#4338ca";

    const initials = prod.title
      ? prod.title.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
      : "PV";

    const hash = prod.title ? prod.title.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 0;
    const IconComponent = PRODUCT_ICONS[hash % PRODUCT_ICONS.length] || Shirt;
                        
    return (
      <div style={{ 
        width: "100%", 
        height: "100%", 
        backgroundColor: bgColor, 
        position: "relative", 
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        ...style 
      }}>
        <IconComponent
          style={{
            position: "absolute",
            width: "50%",
            height: "50%",
            color: shapeColor,
            opacity: 0.1,
            pointerEvents: "none"
          }}
          strokeWidth={1}
        />
        <span style={{
          position: "relative",
          zIndex: 5,
          fontWeight: "700",
          fontSize: "1.1rem",
          color: textAndIconColor,
          opacity: 0.85,
          letterSpacing: "0.05em"
        }}>
          {initials}
        </span>
      </div>
    );
  }

  const initials = prod.title
    ? prod.title.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : "PV";

  const hash = prod.title ? prod.title.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 0;
  const IconComponent = PRODUCT_ICONS[hash % PRODUCT_ICONS.length] || Shirt;

  return (
    <div style={{ 
      width: "100%", 
      height: "100%", 
      backgroundColor: "#f4f4f5", 
      position: "relative", 
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "150px",
      ...style 
    }}>
      <IconComponent
        style={{
          position: "absolute",
          width: "50%",
          height: "50%",
          color: "#a1a1aa",
          opacity: 0.12,
          pointerEvents: "none"
        }}
        strokeWidth={1}
      />
      <span style={{
        position: "relative",
        zIndex: 5,
        fontWeight: "700",
        fontSize: "1.1rem",
        color: "#27272a",
        opacity: 0.85,
        letterSpacing: "0.05em"
      }}>
        {initials}
      </span>
    </div>
  );
}

export default function StorefrontPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const [erpAdminUrl, setErpAdminUrl] = useState(`${baseUrl}/dashboard`);
  const [webhookUrl, setWebhookUrl] = useState(`${baseUrl}/api/orders`);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (isLocal) {
        setErpAdminUrl("http://localhost:3000/dashboard");
        setWebhookUrl("http://localhost:3000/api/orders");
      }
    }
  }, []);

  const [dbVariants, setDbVariants] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [useSampleData, setUseSampleData] = useState<boolean>(false);
  const [dismissBanner, setDismissBanner] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [isOffline, setIsOffline] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [companyIdMissing, setCompanyIdMissing] = useState(false);
  
  // User Interactive States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<{ product: any; quantity: number; selectedSize: string; selectedColor: string }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedProductSizes, setSelectedProductSizes] = useState<Record<string, string>>({});
  const [quickViewSize, setQuickViewSize] = useState("M");
  const [quickViewColor, setQuickViewColor] = useState("Indigo Blue");
  const [checkoutStep, setCheckoutStep] = useState<"idle" | "loading" | "success">("idle");


  useEffect(() => {
    if (selectedProduct) {
      setQuickViewSize(selectedProduct.size || "M");
      setQuickViewColor(selectedProduct.color || "Indigo Blue");
    }
  }, [selectedProduct]);

  // Sync brand/company branding configuration details
  useEffect(() => {
    if (company) {
      localStorage.setItem("seyon:company", JSON.stringify(company));
      localStorage.setItem("seyon:storefront:company", JSON.stringify(company));
    }
  }, [company]);

  useEffect(() => {
    if (brands && brands.length > 0) {
      localStorage.setItem("seyon:storefront:brands", JSON.stringify(brands));
      
      const activeBrandObj = selectedBrand 
        ? brands.find(b => b.code === selectedBrand.toLowerCase())
        : null;
      if (activeBrandObj) {
        localStorage.setItem("seyon:storefront:activeBrand", JSON.stringify(activeBrandObj));
      } else {
        localStorage.removeItem("seyon:storefront:activeBrand");
      }
    }
  }, [brands, selectedBrand]);

  useEffect(() => {
    const activeBrandObj = selectedBrand && brands.length > 0 
      ? brands.find(b => b.code === selectedBrand.toLowerCase()) 
      : null;
    applyBrandingStyles(company, activeBrandObj);
  }, [selectedBrand, brands, company]);

  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStep, setSyncStep] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string } | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({
    name: "John Doe",
    phone: "+919500012345",
    email: "john.doe@example.com",
    addressLine1: "15 Gandhi Marg",
    addressLine2: "Flat 2B",
    city: "Chennai",
    state: "Tamil Nadu",
    zip: "600002",
    country: "India",
    paymentMethod: "COD"
  });

  const [syncStatus, setSyncStatus] = useState<"idle" | "synced" | "syncing">("idle");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Load products (DB query + Fallbacks)
  const fetchProducts = async (companyId?: string | null) => {
    setLoading(true);
    const isDev = process.env.NODE_ENV === "development";

    try {
      let url = `/api/products`;
      const queryParams = new URLSearchParams();
      if (companyId) {
        queryParams.set("companyId", companyId);
      }
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const urlBrand = params.get("brand") ?? selectedBrand;
        if (urlBrand) {
          queryParams.set("brand", urlBrand);
        }
      }
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("API call failed");
      
      const data = await res.json();
      const productList = data.products || (Array.isArray(data) ? data : []);
      const companyDetails = data.company || null;
      const brandList = data.brands || [];

      if (companyDetails) setCompany(companyDetails);
      setBrands(brandList);

      if (productList.length > 0) {
        setDbVariants(productList);
        const mapped = productList.map((v: ProductVariant) => ({
          id: v.id,
          sku: v.sku,
          title: v.title,
          size: v.size || "M",
          color: v.color || "Indigo Blue",
          price: v.price || 1999,
          compareAtPrice: v.compareAtPrice || (v.price ? Math.round(v.price * 1.25) : 2499),
          currentStockLevel: v.currentStockLevel ?? 0,
          category: v.category || "All",
          rating: 4.7,
          reviews: 12,
          thumbnailConfig: v.thumbnailConfig,
          brandId: v.brandId,
          vendor: v.vendor,
          description: `Directly synced from Seyon ERP Database. Live stock tracking active with safety limit: ${v.safetyStockLimit || 5} units.`
        }));

        // If database items exist, show actual DB items. Otherwise, show generic fallback catalog.
        setProducts(mapped);
      } else {
        // Database returned zero items for this tenant catalog
        setProducts(FALLBACK_PRODUCTS);
      }
    } catch (e) {
      console.error("Fetch products failed:", e);
      // Network/Server Error fallback to demo products
      setProducts(FALLBACK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleUrlSync = () => {
      let companyIdVal: string | null = null;
      let brandVal: string = "";
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const urlSlug = params.get("slug") || params.get("code") || params.get("companyCode") || params.get("companyId");
        const urlBrand = params.get("brand");

        if (urlSlug) {
          companyIdVal = urlSlug;
          localStorage.setItem("seyon:storefront:companyId", urlSlug);
          setCompanyIdMissing(false);
        } else {
          companyIdVal = localStorage.getItem("seyon:storefront:companyId");
          setCompanyIdMissing(!companyIdVal);
        }

        if (urlBrand !== null) {
          brandVal = urlBrand;
          setSelectedBrand(urlBrand);
          if (urlBrand) {
            localStorage.setItem("seyon:storefront:brand", urlBrand);
          } else {
            localStorage.removeItem("seyon:storefront:brand");
          }
        } else {
          brandVal = localStorage.getItem("seyon:storefront:brand") || "";
          setSelectedBrand(brandVal);
        }
      }

      fetchProducts(companyIdVal);
    };

    handleUrlSync();

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("seyon:storefront:cart");
      if (stored) {
        try {
          setCart(JSON.parse(stored));
        } catch (e) {
          // ignore
        }
      }

      const storedFavs = localStorage.getItem("seyon:storefront:favorites");
      if (storedFavs) {
        try {
          setFavorites(JSON.parse(storedFavs));
        } catch (e) {
          // ignore
        }
      }

      const params = new URLSearchParams(window.location.search);
      const urlSearch = params.get("search");
      if (urlSearch) {
        setSearchQuery(urlSearch);
      }
      if (params.get("checkout") === "true") {
        window.location.href = "/checkout";
      }

      window.addEventListener("popstate", handleUrlSync);
      return () => {
        window.removeEventListener("popstate", handleUrlSync);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("seyon:storefront:cart", JSON.stringify(cart));
    }
  }, [cart]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("seyon:storefront:favorites", JSON.stringify(favorites));
    }
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  const addToCart = (product: any, size: string, color: string) => {
    const existing = cart.find(
      item => item.product.id === product.id && item.selectedSize === size && item.selectedColor === color
    );

    if (existing) {
      setCart(prev => prev.map(item => 
        (item.product.id === product.id && item.selectedSize === size && item.selectedColor === color)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart(prev => [...prev, { product, quantity: 1, selectedSize: size, selectedColor: color }]);
    }
    
    setToastMessage({
      title: "Added to Cart!",
      subtitle: `${product.title} (${color} / ${size})`
    });
    
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const removeFromCart = (id: string, size: string, color: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === id && item.selectedSize === size && item.selectedColor === color)));
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCart(prev => {
      const item = prev[idx];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      return prev.map((it, i) => i === idx ? { ...it, quantity: newQty } : it);
    });
  };

  const handleCheckout = async () => {
    setCheckoutStep("loading");
    
    const orderId = `storefront-${Math.floor(Math.random() * 900000) + 100000}`;
    const orderName = `#SF-${Math.floor(Math.random() * 9000) + 10000}${checkoutForm.paymentMethod === "COD" ? "-COD" : ""}`;
    const savedCoId = typeof window !== "undefined" ? localStorage.getItem("seyon:storefront:companyId") : null;
    
    const payload = {
      companyId: savedCoId,
      shopifyOrderId: orderId,
      orderNumber: orderName,
      customerName: checkoutForm.name,
      customerPhone: checkoutForm.phone,
      customerEmail: checkoutForm.email,
      totalPrice: cartTotal,
      currency: "INR",
      shippingAddressLine1: checkoutForm.addressLine1,
      shippingAddressLine2: checkoutForm.addressLine2,
      shippingCity: checkoutForm.city,
      shippingState: checkoutForm.state,
      shippingZip: checkoutForm.zip,
      shippingCountry: checkoutForm.country,
      line_items: cart.map(item => ({
        variantId: item.product.id,
        sku: item.product.sku,
        price: item.product.price,
        quantity: item.quantity
      }))
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setCheckoutStep("success");
        setCart([]);
      } else {
        throw new Error(data.error || "Webhook ingestion failed");
      }
    } catch (e) {
      console.error("Storefront checkout API post fail, falling back to mock success state:", e);
      setCheckoutStep("success");
      setCart([]);
    }
  };

  const triggerLiveSync = () => {
    setUseSampleData(false);
    setSyncStatus("syncing");
    setSyncProgress(0);
    setSyncStep("Initializing connection to Seyon DB...");

    const steps = [
      { progress: 15, step: "Authenticating tenant credentials..." },
      { progress: 40, step: "Querying ProductVariant catalog..." },
      { progress: 70, step: "Syncing stock thresholds..." },
      { progress: 90, step: "Refreshing localized cache..." },
      { progress: 100, step: "Catalog sync successful!" }
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < steps.length) {
        setSyncProgress(steps[currentIdx].progress);
        setSyncStep(steps[currentIdx].step);
        currentIdx++;
      } else {
        clearInterval(interval);
        const savedCoId = typeof window !== "undefined" ? localStorage.getItem("seyon:storefront:companyId") : null;
        fetchProducts(savedCoId);
        setSyncStatus("synced");
        setTimeout(() => {
          setSyncStatus("idle");
          setSyncProgress(0);
        }, 2000);
      }
    }, 400);
  };

  const activeBrandObj = selectedBrand && brands.length > 0 
    ? brands.find(b => b.code === selectedBrand.toLowerCase()) 
    : null;
  const activeLogoUrl = activeBrandObj?.logoUrl || null;
  const activeTheme = activeBrandObj?.themeConfig 
    ? (typeof activeBrandObj.themeConfig === "string" ? JSON.parse(activeBrandObj.themeConfig) : activeBrandObj.themeConfig)
    : (company?.themeConfig ? (typeof company.themeConfig === "string" ? JSON.parse(company.themeConfig) : company.themeConfig) : null);

  const groupedProducts = React.useMemo(() => {
    const rawList = useSampleData ? FALLBACK_PRODUCTS : products;
    const groups: { [key: string]: any } = {};

    rawList.forEach(p => {
      // Normalize title by removing trailing size indicators if present (e.g. " - S", " / XL")
      const baseTitle = p.title.replace(/[\s\-\/]+(S|M|L|XL|2XL|3XL|FREE)$/i, "").trim();
      const groupKey = `${baseTitle}_${p.category || 'All'}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          ...p,
          title: baseTitle,
          variants: [p],
          sizes: [p.size || "M"],
          selectedSize: p.size || "M",
          totalStock: p.currentStockLevel ?? 0
        };
      } else {
        groups[groupKey].variants.push(p);
        if (p.size && !groups[groupKey].sizes.includes(p.size)) {
          groups[groupKey].sizes.push(p.size);
        }
        groups[groupKey].totalStock += (p.currentStockLevel ?? 0);
      }
    });

    return Object.values(groups);
  }, [products, useSampleData]);

  // Sorting & Pagination States
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "stock">("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Reset pagination to page 1 whenever search, category, brand, sort, or page limit changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedBrand, sortBy, itemsPerPage]);

  const filteredProducts = React.useMemo(() => {
    let result = groupedProducts.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      
      let matchesBrand = true;
      if (selectedBrand && brands.length > 0) {
        const activeBrandObj = brands.find(b => b.code === selectedBrand.toLowerCase());
        if (activeBrandObj) {
          matchesBrand = p.brandId === activeBrandObj.id || p.variants?.some((v: any) => v.brandId === activeBrandObj.id);
        }
      }
      return matchesSearch && matchesCategory && matchesBrand;
    });

    // Apply Sorting
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "stock") {
      result.sort((a, b) => b.totalStock - a.totalStock);
    }

    return result;
  }, [groupedProducts, searchQuery, selectedCategory, selectedBrand, sortBy]);

  // Paginated Slice
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    set.add("All");
    const rawList = useSampleData ? FALLBACK_PRODUCTS : products;
    rawList.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products, useSampleData]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#ffffff", color: "#09090b", fontFamily: "'Outfit', sans-serif" }}>
      
      {/* Structured Data (JSON-LD) Rich Snippets for Google Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateOrganizationSchema(company))
        }}
      />
      {products.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              products.slice(0, 10).map((p: any) => generateProductSchema(p, company))
            )
          }}
        />
      )}


      {/* Dev Header Info Bar (Visible in Development Mode Only) */}

      {process.env.NODE_ENV === "development" && (
        <div style={{
          backgroundColor: "#09090b",
          color: "#f4f4f5",
          padding: "0.5rem 1.25rem",
          fontSize: "0.75rem",
          fontWeight: "400",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          borderBottom: "1px solid #27272a"
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
            {company?.shopifyStoreUrl && company.shopifyAccessToken && company.shopifyAccessToken !== "shpat_mockaccesstoken12345" && !company.shopifyStoreUrl.includes("seyon-clothing.myshopify.com") ? (
              <span style={{ backgroundColor: "#16a34a", color: "#ffffff", padding: "0.15rem 0.4rem", borderRadius: "0.25rem", fontSize: "0.65rem", fontWeight: "600" }}>
                {company?.name ? `${company.name}: Connected` : "Connected"}
              </span>
            ) : (
              <span style={{ backgroundColor: "#dc2626", color: "#ffffff", padding: "0.15rem 0.4rem", borderRadius: "0.25rem", fontSize: "0.65rem", fontWeight: "600" }}>
                {company?.name ? `${company.name}: Not Connected` : "Not Connected"}
              </span>
            )}
            <span style={{ color: "#a1a1aa", fontSize: "0.7rem", border: "1px solid #3f3f46", padding: "0.1rem 0.35rem", borderRadius: "0.25rem" }}>Seyon Bridge</span>
            <a 
              href={company?.shopifyStoreUrl ? `${company.shopifyStoreUrl}/admin` : "https://seyon-clothing.myshopify.com/admin"} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: "#ffffff", textDecoration: "underline", fontSize: "0.75rem" }}
            >
              Shopify Admin ↗
            </a>
            <span style={{ color: "#3f3f46" }}>|</span>
            <a 
              href={erpAdminUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: "#ffffff", textDecoration: "underline", fontSize: "0.75rem" }}
            >
              ERP Admin Panel ↗
            </a>
            <span style={{ color: "#3f3f46" }}>|</span>
            <span style={{ color: "#a1a1aa" }}>DB Connection: ACTIVE</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              onClick={triggerLiveSync}
              disabled={syncStatus === "syncing"}
              style={{
                backgroundColor: "#f4f4f5",
                color: "#09090b",
                border: "none",
                borderRadius: "0.25rem",
                padding: "0.2rem 0.6rem",
                fontWeight: "500",
                fontSize: "0.7rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem"
              }}
            >
              {syncStatus === "syncing" ? "Syncing..." : syncStatus === "synced" ? "Synced" : "Sync ERP Catalog"}
            </button>
            {!companyIdMissing && (
              <button 
                onClick={() => setUseSampleData(prev => !prev)}
                style={{
                  backgroundColor: useSampleData ? "#dc2626" : "#09090b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "0.25rem",
                  padding: "0.2rem 0.6rem",
                  fontWeight: "500",
                  fontSize: "0.7rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem"
                }}
              >
                {useSampleData ? "Clear Sample Data" : "Load Sample Data"}
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Active Campaign Sticky Announcement Banner (Big Billion Day / Wednesday Blitz / Festive Theme) */}
      {!dismissBanner && (
        <div className="relative overflow-hidden bg-slate-900 text-white border-b border-amber-500/20 shadow-md">
          {/* Theme 1: Big Billion Day (Amber Gold Glow) */}
          <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 flex-1 justify-center sm:justify-start">
              <span className="bg-slate-950 text-amber-400 text-[10px] px-2 py-0.5 rounded font-black tracking-wider uppercase animate-pulse">
                🔥 BIG BILLION SALE
              </span>
              <span className="font-extrabold text-slate-950 truncate">
                Up to 50% OFF Storewide | Use Code: <code className="bg-slate-950/20 px-1.5 py-0.5 rounded font-mono">BBD50</code>
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono font-bold bg-slate-950/15 px-3 py-1 rounded-full border border-slate-950/20">
              <span className="text-slate-900 uppercase text-[9px]">Ends In:</span>
              <span className="text-slate-950">04h 22m 15s</span>
            </div>

            <button 
              onClick={() => setDismissBanner(true)}
              aria-label="Dismiss campaign banner"
              className="text-slate-900 hover:text-slate-950 p-1 rounded-full hover:bg-slate-950/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {process.env.NODE_ENV === "development" && !dismissBanner && (
        <div style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#ffffff",
          padding: "0.85rem 1.5rem",
          fontSize: "0.825rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          position: "relative",
          boxShadow: "0 4px 15px rgba(124, 58, 237, 0.12)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
            <div style={{
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "0.375rem",
              padding: "0.35rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Sparkles style={{ width: "0.95rem", height: "0.95rem", color: "#ffffff" }} />
            </div>
            <div style={{ lineHeight: "1.4" }}>
              <span style={{ fontWeight: "700", color: "#ffffff" }}>Pre-Release / Demo Mode:</span>{" "}
              <span style={{ color: "rgba(255, 255, 255, 0.95)" }}>
                This storefront is a live showcase of our digital retail channel. Every element—including branding, catalog structure, and visual layout—can be fully customized to meet your customer's specific needs.
              </span>
            </div>
          </div>
          <button 
            onClick={() => setDismissBanner(true)}
            aria-label="Dismiss banner"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "none",
              cursor: "pointer",
              padding: "0.35rem",
              borderRadius: "0.375rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              transition: "all 0.15s ease",
              flexShrink: 0
            }}
          >
            <X style={{ width: "0.95rem", height: "0.95rem" }} />
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderBottom: "1px solid var(--border)",
        padding: "1rem 1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {activeLogoUrl ? (
            <img 
              src={activeLogoUrl} 
              alt={activeBrandObj?.name || company?.name || "Logo"} 
              style={{ height: "2.25rem", objectFit: "contain", borderRadius: "var(--radius)" }} 
            />
          ) : (
            <div style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              padding: "0.45rem",
              borderRadius: "var(--radius)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Scissors style={{ width: "1.15rem", height: "1.15rem" }} />
            </div>
          )}
          <div>
            <span style={{ fontSize: "1.25rem", fontWeight: "700", letterSpacing: "-0.02em", color: "#09090b", textTransform: "uppercase" }}>
              {activeBrandObj?.name || company?.storeName || (company?.code === "wolfcabin" ? "The Wolf Cabin" : (company?.name || "MerchantVault"))}
            </span>
            {process.env.NODE_ENV === "development" && (
              <span style={{ fontSize: "0.7rem", fontWeight: "500", color: "#71717a", marginLeft: "0.5rem", border: "1px solid var(--border)", padding: "0.15rem 0.4rem", borderRadius: "var(--radius)", textTransform: "uppercase" }}>
                PRE-RELEASE
              </span>
            )}
          </div>
        </div>

        {/* Brand Selector (if multiple brands exist) */}
        {brands.length > 1 && (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginLeft: "1rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#71717a", fontWeight: "500" }}>Brand:</span>
            <select
              value={selectedBrand}
              onChange={e => {
                const newBrand = e.target.value;
                setSelectedBrand(newBrand);
                const savedCoId = typeof window !== "undefined" ? localStorage.getItem("seyon:storefront:companyId") : null;
                if (typeof window !== "undefined") {
                  const url = new URL(window.location.href);
                  if (newBrand) {
                    url.searchParams.set("brand", newBrand);
                    localStorage.setItem("seyon:storefront:brand", newBrand);
                  } else {
                    url.searchParams.delete("brand");
                    localStorage.removeItem("seyon:storefront:brand");
                  }
                  window.history.pushState({}, "", url.toString());
                }
                fetchProducts(savedCoId);
              }}
              style={{
                padding: "0.3rem 1.5rem 0.3rem 0.5rem",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                fontSize: "0.8rem",
                fontWeight: "600",
                color: "#09090b",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="">All Brands</option>
              {brands.map(b => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Search Input */}
        <div style={{ position: "relative", flex: 1, maxWidth: "380px", margin: "0 2rem", display: "none", md: "block" } as any} className="search-desktop">
          <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "0.9rem", height: "0.9rem", color: "#71717a" }} />
          <input
            type="text"
            placeholder="Search collection..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.45rem 1rem 0.45rem 2.25rem",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              fontSize: "0.85rem",
              outline: "none",
              backgroundColor: "#ffffff",
              transition: "border-color 0.15s ease",
              color: "#09090b"
            }}
            onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link 
            href="/cart"
            style={{
              position: "relative",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: "0.4rem",
              borderRadius: "var(--radius)",
              color: "#09090b"
            }}
          >
            <ShoppingCart style={{ width: "1.25rem", height: "1.25rem" }} />
            {totalItems > 0 && (
              <span style={{
                position: "absolute",
                top: "-0.15rem",
                right: "-0.15rem",
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
                fontSize: "0.65rem",
                fontWeight: "600",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Modern Enhanced Hero Section */}
          <section className="hero-section-container">
            <div className="hero-ambient-glow" />
            <div className="hero-grid-pattern" />

            <div className="hero-content-wrapper">
              <div className="hero-badge-pill">
                <Sparkles style={{ width: "0.85rem", height: "0.85rem", color: "var(--primary, #0d9488)" }} />
                <span>{activeTheme?.bannerText || "0% Commission Direct Checkout Channel"}</span>
              </div>

              <h2 className="hero-main-heading">
                <span className="hero-main-heading-gradient">
                  {activeTheme?.heroTitle || "Premium Products, Synced in Real-Time"}
                </span>
              </h2>

              <p className="hero-subtitle-text">
                {activeTheme?.heroSubtitle || "Experience direct database checkout. Linked directly to real-time inventory registry for guaranteed stock and instant order fulfillment."}
              </p>

              <div className="hero-cta-group">
                <a href="#catalog" className="hero-cta-btn-primary">
                  Explore Catalog <ArrowRight style={{ width: "0.95rem", height: "0.95rem" }} />
                </a>
                <Link href="/cart" className="hero-cta-btn-secondary">
                  <ShoppingBag style={{ width: "0.95rem", height: "0.95rem" }} /> Direct Cart
                </Link>
              </div>

              <div className="hero-trust-bar">
                <div className="hero-trust-item">
                  <Zap style={{ width: "0.85rem", height: "0.85rem" }} /> Real-Time Stock Sync
                </div>
                <div className="hero-trust-item">
                  <CheckCircle2 style={{ width: "0.85rem", height: "0.85rem" }} /> Zero Overselling Guarantee
                </div>
                <div className="hero-trust-item">
                  <Truck style={{ width: "0.85rem", height: "0.85rem" }} /> Direct Fulfillment
                </div>
              </div>
            </div>
          </section>

          {/* Catalog & Filter controls */}
          <section id="catalog" style={{ flex: 1, padding: "3rem 1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700", letterSpacing: "-0.015em", color: "#09090b", margin: 0 }}>Discover Collection</h3>
                <p style={{ fontSize: "0.8rem", color: "#71717a", margin: "0.25rem 0 0 0" }}>
                  Showing {paginatedProducts.length} of {filteredProducts.length} items
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                {/* Category Filters */}
                <div style={{ display: "flex", gap: "0.375rem", overflowX: "auto" }}>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        backgroundColor: selectedCategory === cat ? "var(--primary)" : "#ffffff",
                        color: selectedCategory === cat ? "var(--primary-foreground)" : "#27272a",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        padding: "0.35rem 0.85rem",
                        fontSize: "0.8rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown Selector */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#71717a", fontWeight: "500" }}>Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e4e4e7",
                      borderRadius: "0.375rem",
                      padding: "0.35rem 0.65rem",
                      fontSize: "0.78rem",
                      fontWeight: "500",
                      color: "#18181b",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="featured">Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="stock">Stock Level</option>
                  </select>
                </div>

                {/* Items Per Page Selector */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#71717a", fontWeight: "500" }}>Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e: any) => setItemsPerPage(Number(e.target.value))}
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e4e4e7",
                      borderRadius: "0.375rem",
                      padding: "0.35rem 0.65rem",
                      fontSize: "0.78rem",
                      fontWeight: "500",
                      color: "#18181b",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value={12}>12 per page</option>
                    <option value={24}>24 per page</option>
                    <option value={48}>48 per page</option>
                    <option value={96}>96 per page</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Cards Grid */}
            {filteredProducts.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "3.5rem 1.5rem",
                border: "1px dashed #e4e4e7",
                borderRadius: "0.5rem",
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem"
              }}>
                <ShoppingBag style={{ width: "2rem", height: "2rem", color: "#a1a1aa" }} />
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "#27272a", margin: 0 }}>No Products Available</h4>
                  <p style={{ color: "#71717a", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>No matching products found for your selection.</p>
                </div>
              </div>
            ) : (
              <>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "1.5rem"
                }}>
                  {paginatedProducts.map(prod => {
                    const inStock = prod.currentStockLevel > 0;
                    const isFav = favorites.includes(prod.id);
                    const isLowStock = inStock && prod.currentStockLevel <= 5;
                    
                    return (
                      <div 
                        key={prod.id} 
                        style={{
                          backgroundColor: "#ffffff",
                          borderRadius: "0.5rem",
                          border: "1px solid #e4e4e7",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          position: "relative",
                          transition: "all 0.2s ease"
                        }}
                        className="product-card"
                      >
                        {/* Heart Icon button */}
                        <button 
                          onClick={() => toggleFavorite(prod.id)}
                          style={{
                            position: "absolute",
                            top: "0.75rem",
                            left: "0.75rem",
                            zIndex: 10,
                            backgroundColor: "#ffffff",
                            border: "1px solid #e4e4e7",
                            width: "2rem",
                            height: "2rem",
                            borderRadius: "0.375rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer"
                          }}
                        >
                          <Heart style={{ width: "1rem", height: "1rem", fill: isFav ? "#dc2626" : "none", color: isFav ? "#dc2626" : "#71717a" }} />
                        </button>

                        {/* Stock Status Badge */}
                        <span style={{
                          position: "absolute",
                          top: "0.75rem",
                          right: "0.75rem",
                          zIndex: 10,
                          backgroundColor: !inStock ? "#fef2f2" : isLowStock ? "#fffbeb" : "#f0fdf4",
                          color: !inStock ? "#dc2626" : isLowStock ? "#d97706" : "#16a34a",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "0.25rem",
                          fontSize: "0.65rem",
                          fontWeight: "600",
                          border: `1px solid ${!inStock ? "#fee2e2" : isLowStock ? "#fef3c7" : "#dcfce7"}`
                        }}>
                          {!inStock ? "Sold Out" : isLowStock ? "Low Stock" : "In Stock"}
                        </span>

                        {/* Product Image */}
                        <div 
                          style={{ backgroundColor: "#fafafa", position: "relative", cursor: "pointer", overflow: "hidden" }} 
                          onClick={() => setSelectedProduct(prod)}
                          className="group"
                        >
                          <ProductImage prod={prod} />
                          
                          {/* Quick View Hover Overlay Button */}
                          <div 
                            style={{
                              position: "absolute",
                              bottom: "0.75rem",
                              left: "50%",
                              transform: "translateX(-50%)",
                              zIndex: 10,
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              backdropFilter: "blur(4px)",
                              color: "#09090b",
                              fontSize: "0.7rem",
                              fontWeight: "700",
                              padding: "0.4rem 0.85rem",
                              borderRadius: "2rem",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              border: "1px solid rgba(0,0,0,0.06)",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <Eye style={{ width: "0.85rem", height: "0.85rem", color: "#0d9488" }} /> Quick View
                          </div>
                        </div>

                        {/* Specs */}
                        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.7rem", color: "#a1a1aa", fontWeight: "500" }}>SKU: {prod.sku}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                              {prod.vendor && (
                                <span style={{ fontSize: "0.65rem", fontWeight: "700", color: "#6366f1", backgroundColor: "rgba(99, 102, 241, 0.08)", padding: "0.1rem 0.4rem", borderRadius: "0.25rem" }}>
                                  {prod.vendor}
                                </span>
                              )}
                              {prod.category && (
                                <span style={{ fontSize: "0.65rem", fontWeight: "700", color: "#0d9488", backgroundColor: "rgba(13, 148, 136, 0.08)", padding: "0.1rem 0.4rem", borderRadius: "0.25rem" }}>
                                  {prod.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <Link href={`/products/${prod.id}`} style={{ textDecoration: "none" }}>
                            <h4 className="product-title-hover" style={{ fontSize: "0.95rem", fontWeight: "600", color: "#09090b", margin: "0.25rem 0 0.5rem 0", lineHeight: "1.35" }}>
                              {prod.title}
                            </h4>
                          </Link>

                          {/* Category Specific Spec Badges */}
                          {prod.category === "Cosmetics & Beauty" && (
                            <div style={{ fontSize: "0.68rem", fontWeight: "600", color: "#047857", marginBottom: "0.5rem", display: "flex", gap: "0.4rem" }}>
                              <span>🌿 100% Organic</span>
                              <span>•</span>
                              <span>🧪 Derm Tested</span>
                            </div>
                          )}
                          {prod.category === "Baby & Kids" && (
                            <div style={{ fontSize: "0.68rem", fontWeight: "600", color: "#be185d", marginBottom: "0.5rem", display: "flex", gap: "0.4rem" }}>
                              <span>👶 Hypoallergenic</span>
                              <span>•</span>
                              <span>🛡️ BPA-Free</span>
                            </div>
                          )}
                          {prod.category === "Jewelry & Accessories" && (
                            <div style={{ fontSize: "0.68rem", fontWeight: "600", color: "#b45309", marginBottom: "0.5rem", display: "flex", gap: "0.4rem" }}>
                              <span>✨ Anti-Tarnish</span>
                              <span>•</span>
                              <span>💎 1-Yr Warranty</span>
                            </div>
                          )}

                          {/* Sizes Selector */}
                          <div style={{ display: "flex", gap: "0.35rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                            {prod.sizes?.map((sz: string) => {
                              const szVariant = prod.variants?.find((v: any) => v.size === sz) || prod;
                              const szInStock = szVariant.currentStockLevel > 0;
                              const currentSelectedSize = selectedProductSizes[prod.id] || prod.sizes[0];
                              const isSelected = currentSelectedSize === sz;

                              return (
                                <button
                                  key={sz}
                                  onClick={() => setSelectedProductSizes(prev => ({ ...prev, [prod.id]: sz }))}
                                  style={{
                                    backgroundColor: isSelected ? "#18181b" : szInStock ? "#ffffff" : "#f4f4f5",
                                    color: isSelected ? "#ffffff" : szInStock ? "#27272a" : "#a1a1aa",
                                    border: `1px solid ${isSelected ? "#18181b" : "#e4e4e7"}`,
                                    fontSize: "0.68rem",
                                    fontWeight: "600",
                                    padding: "0.15rem 0.45rem",
                                    borderRadius: "0.25rem",
                                    cursor: "pointer",
                                    textDecoration: !szInStock ? "line-through" : "none",
                                    opacity: !szInStock ? 0.6 : 1,
                                    transition: "all 0.15s ease"
                                  }}
                                  title={!szInStock ? `${sz} - Out of Stock` : `${sz} - In Stock`}
                                >
                                  {sz}
                                </button>
                              );
                            })}
                          </div>

                          <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.75rem", borderTop: "1px solid #f4f4f5" }}>
                            {(() => {
                              const chosenSize = selectedProductSizes[prod.id] || prod.sizes?.[0] || prod.size;
                              const targetVariant = prod.variants?.find((v: any) => v.size === chosenSize) || prod;
                              const targetInStock = targetVariant ? targetVariant.currentStockLevel > 0 : false;

                              return (
                                <>
                                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                                    <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#09090b" }}>₹{targetVariant.price || prod.price}</span>
                                    {(targetVariant.compareAtPrice || prod.compareAtPrice) > (targetVariant.price || prod.price) && (
                                      <span style={{ fontSize: "0.8rem", color: "#a1a1aa", textDecoration: "line-through" }}>
                                        ₹{targetVariant.compareAtPrice || prod.compareAtPrice}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <button
                                    onClick={() => {
                                      if (targetInStock) {
                                        addToCart(targetVariant, chosenSize, targetVariant.color || prod.color);
                                      }
                                    }}
                                    disabled={!targetInStock}
                                    style={{
                                      backgroundColor: targetInStock ? "var(--primary)" : "#e4e4e7",
                                      color: targetInStock ? "var(--primary-foreground)" : "#a1a1aa",
                                      border: "none",
                                      borderRadius: "var(--radius)",
                                      padding: "0.45rem 0.75rem",
                                      fontSize: "0.75rem",
                                      fontWeight: "500",
                                      cursor: targetInStock ? "pointer" : "not-allowed",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.3rem",
                                      transition: "background-color 0.15s ease"
                                    }}
                                  >
                                    <ShoppingCart style={{ width: "0.85rem", height: "0.85rem" }} /> {targetInStock ? "Add" : "Sold Out"}
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls Bar */}
                {totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "2.5rem" }}>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e4e4e7",
                        borderRadius: "0.375rem",
                        padding: "0.4rem 0.85rem",
                        fontSize: "0.78rem",
                        fontWeight: "600",
                        color: currentPage === 1 ? "#a1a1aa" : "#18181b",
                        cursor: currentPage === 1 ? "not-allowed" : "pointer"
                      }}
                    >
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          backgroundColor: currentPage === page ? "var(--primary)" : "#ffffff",
                          color: currentPage === page ? "var(--primary-foreground)" : "#27272a",
                          border: "1px solid var(--border)",
                          borderRadius: "0.375rem",
                          width: "2.2rem",
                          height: "2.2rem",
                          fontSize: "0.78rem",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e4e4e7",
                        borderRadius: "0.375rem",
                        padding: "0.4rem 0.85rem",
                        fontSize: "0.78rem",
                        fontWeight: "600",
                        color: currentPage === totalPages ? "#a1a1aa" : "#18181b",
                        cursor: currentPage === totalPages ? "not-allowed" : "pointer"
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: "#09090b",
        color: "#a1a1aa",
        padding: "3rem 1.5rem 2rem 1.5rem",
        fontSize: "0.8rem",
        borderTop: "1px solid #27272a",
        marginTop: "auto"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem", marginBottom: "2.5rem" }}>
          {/* Column 1: Store & Entity */}
          <div>
            <h4 style={{ color: "#ffffff", fontSize: "1rem", fontWeight: "700", margin: "0 0 0.5rem 0" }}>{company?.storeName || company?.name || "MerchantVault Store"}</h4>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#a1a1aa", lineHeight: 1.5 }}>
              Registered Entity: <strong style={{ color: "#e4e4e7" }}>{company?.name ? company.name : "Seyon Nexa Labs Private Limited"}</strong>
            </p>
            <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.72rem", color: "#71717a" }}>
              Multi-Tenant Storefront Channel ({company?.code || "syn"})
            </p>
          </div>

          {/* Column 2: Multi-Brand Portfolio */}
          <div>
            <h5 style={{ color: "#ffffff", fontSize: "0.85rem", fontWeight: "600", margin: "0 0 0.5rem 0" }}>Store Brands</h5>
            {brands && brands.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                <button
                  onClick={() => {
                    setSelectedBrand("");
                    localStorage.removeItem("seyon:storefront:brand");
                    fetchProducts(company?.id || company?.code);
                  }}
                  style={{
                    backgroundColor: !selectedBrand ? "var(--primary)" : "#18181b",
                    color: !selectedBrand ? "#ffffff" : "#d4d4d8",
                    fontSize: "0.7rem",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "0.25rem",
                    border: "1px solid #27272a",
                    cursor: "pointer"
                  }}
                >
                  All Brands
                </button>
                {brands.map((b: any) => {
                  const isSelected = selectedBrand?.toLowerCase() === b.code?.toLowerCase();
                  return (
                    <button
                      key={b.id || b.code}
                      onClick={() => {
                        const newBrand = isSelected ? "" : b.code;
                        setSelectedBrand(newBrand);
                        if (newBrand) {
                          localStorage.setItem("seyon:storefront:brand", newBrand);
                        } else {
                          localStorage.removeItem("seyon:storefront:brand");
                        }
                        fetchProducts(company?.id || company?.code);
                      }}
                      style={{
                        backgroundColor: isSelected ? "var(--primary)" : "#18181b",
                        color: isSelected ? "#ffffff" : "#d4d4d8",
                        fontSize: "0.7rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "0.25rem",
                        border: "1px solid #27272a",
                        cursor: "pointer"
                      }}
                    >
                      {b.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#71717a" }}>Direct Merchandise Catalog</p>
            )}
          </div>

          {/* Column 3: Corporate Registrations */}
          <div>
            <h5 style={{ color: "#ffffff", fontSize: "0.85rem", fontWeight: "600", margin: "0 0 0.5rem 0" }}>Corporate Registrations</h5>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#a1a1aa", lineHeight: 1.6 }}>
              {company?.gstin && <>GSTIN: <span style={{ color: "#e4e4e7", fontFamily: "monospace" }}>{company.gstin}</span><br /></>}
              {company?.taxId && <>Tax ID / CIN: <span style={{ color: "#e4e4e7", fontFamily: "monospace" }}>{company.taxId}</span><br /></>}
              {!company?.gstin && !company?.taxId && <span style={{ color: "#71717a" }}>Verified Business Merchant</span>}
            </p>
          </div>

          {/* Column 4: Support & Operations */}
          <div>
            <h5 style={{ color: "#ffffff", fontSize: "0.85rem", fontWeight: "600", margin: "0 0 0.5rem 0" }}>Customer Support</h5>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#a1a1aa", lineHeight: 1.6 }}>
              {company?.contactEmail && <>Email: {company.contactEmail}<br /></>}
              {company?.whatsappNumber && <>WhatsApp: {company.whatsappNumber}<br /></>}
              {!company?.contactEmail && !company?.whatsappNumber && <span style={{ color: "#71717a" }}>Contact via Merchant Desk</span>}
            </p>
          </div>
        </div>

        <div style={{ maxWidth: "1200px", margin: "0 auto", borderTop: "1px solid #18181b", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", paddingTop: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#71717a" }}>
              © {new Date().getFullYear()} {company?.name || "Seyon Shopping"}. All rights reserved.
            </p>
            <Link 
              href="/platform" 
              target="_blank"
              style={{ fontSize: "0.65rem", color: "#71717a", borderLeft: "1px solid #27272a", paddingLeft: "0.5rem", textDecoration: "none", transition: "color 0.15s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
            >
              Powered by <strong style={{ color: "#e4e4e7" }}>Seyon Shopping</strong> ↗
            </Link>


          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.75rem", color: "#71717a" }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Customer Desk</span>
            <a 
              href="/dashboard" 
              style={{ color: "#71717a", textDecoration: "none", transition: "color 0.15s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
            >
              Admin Portal ↗
            </a>
          </div>
        </div>
      </footer>




      {/* QUICK VIEW MODAL OVERLAY */}
      {selectedProduct && (
        <div 
          onClick={() => setSelectedProduct(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(9,9,11,0.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.75rem"
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "1rem",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "92vh",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
              overflow: "hidden",
              position: "relative",
              border: "1px solid rgba(228,228,231,0.8)",
              display: "flex",
              flexDirection: "column",
              padding: "0.25rem"
            }}
          >
            <button 
              onClick={() => setSelectedProduct(null)}
              style={{
                position: "absolute",
                top: "1.25rem",
                right: "1.25rem",
                backgroundColor: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(4px)",
                border: "1px solid #e4e4e7",
                width: "2rem",
                height: "2rem",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 10,
                boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                transition: "all 0.15s ease"
              }}
            >
              <X style={{ width: "1rem", height: "1rem", color: "#3f3f46" }} />
            </button>

            <div className="quickview-modal-content">
              {/* Image Column */}
              <div className="quickview-img-container" style={{ flex: 1, backgroundColor: "#f8fafc", position: "relative", borderRadius: "0.75rem", overflow: "hidden", margin: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ProductImage prod={selectedProduct} style={{ height: "100%", width: "100%", objectFit: "cover" }} />
              </div>

              {/* Specs Column */}
              <div style={{ flex: 1.2, padding: "1.75rem 1.5rem" }}>
                <span style={{ fontSize: "0.7rem", color: "#71717a", fontWeight: "500" }}>SKU: {selectedProduct.sku}</span>
                <h4 style={{ fontSize: "1.2rem", fontWeight: "600", color: "#09090b", margin: "0.15rem 0 0.5rem 0" }}>{selectedProduct.title}</h4>
                
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "1.3rem", fontWeight: "700", color: "#09090b" }}>₹{selectedProduct.price}</span>
                  <span style={{
                    backgroundColor: selectedProduct.currentStockLevel > 0 ? "#f0fdf4" : "#fef2f2",
                    color: selectedProduct.currentStockLevel > 0 ? "#16a34a" : "#dc2626",
                    fontSize: "0.65rem",
                    fontWeight: "600",
                    padding: "0.15rem 0.4rem",
                    borderRadius: "0.25rem",
                    border: `1px solid ${selectedProduct.currentStockLevel > 0 ? "#dcfce7" : "#fee2e2"}`
                  }}>
                    {selectedProduct.currentStockLevel > 0 ? `${selectedProduct.currentStockLevel} In Stock` : "Out of Stock"}
                  </span>
                </div>

                <p style={{ fontSize: "0.8rem", color: "#71717a", lineHeight: "1.4", margin: "0 0 1.25rem 0" }}>
                  {selectedProduct.description}
                </p>

                <div style={{ borderTop: "1px solid #e4e4e7", paddingTop: "1rem" }}>
                  {/* Size Selector */}
                  <div style={{ marginBottom: "1rem" }}>
                    <span style={{ display: "block", fontSize: "0.7rem", fontWeight: "600", color: "#27272a", marginBottom: "0.3rem", textTransform: "uppercase" }}>
                      Select Size
                    </span>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                      {["XS", "S", "M", "L", "XL", "2XL", "3XL"].map(sz => {
                        const isSelected = quickViewSize === sz;
                        return (
                          <button
                            key={sz}
                            onClick={() => setQuickViewSize(sz)}
                            style={{
                              border: isSelected ? "1px solid rgba(0,0,0,0.15)" : "1px solid var(--border)",
                              backgroundColor: isSelected ? "var(--primary)" : "#ffffff",
                              color: isSelected ? "var(--primary-foreground)" : "#09090b",
                              padding: "0.3rem 0.65rem",
                              borderRadius: "var(--radius)",
                              fontWeight: "600",
                              fontSize: getSizeFontSize(sz),
                              cursor: "pointer",
                              outline: isSelected ? "2px solid var(--primary)" : "none",
                              outlineOffset: "2px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: "2rem",
                              height: "2rem"
                            }}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Color Selector */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <span style={{ display: "block", fontSize: "0.7rem", fontWeight: "600", color: "#27272a", marginBottom: "0.3rem", textTransform: "uppercase" }}>
                      Select Color
                    </span>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {Array.from(new Set<string>(
                        selectedProduct.variants && selectedProduct.variants.length > 0
                          ? selectedProduct.variants.map((v: any) => String(v.color)).filter(Boolean)
                          : [selectedProduct.color || "Default"]
                      )).map((cl: string) => {
                        const isSelected = quickViewColor === cl;
                        const bgVal = getColorValue(cl);
                        const isDark = isDarkColor(cl);
                        return (
                          <button
                            key={cl}
                            onClick={() => setQuickViewColor(cl)}
                            style={{
                              border: isSelected ? "1px solid rgba(0,0,0,0.15)" : "1px solid var(--border)",
                              backgroundColor: bgVal,
                              color: isDark ? "#ffffff" : "#09090b",
                              padding: "0.35rem 0.65rem",
                              borderRadius: "var(--radius)",
                              fontWeight: "600",
                              fontSize: "0.7rem",
                              cursor: "pointer",
                              outline: isSelected ? `2px solid var(--primary)` : "none",
                              outlineOffset: "2px"
                            }}
                          >
                            {cl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    disabled={selectedProduct.currentStockLevel <= 0}
                    onClick={() => {
                      addToCart(selectedProduct, quickViewSize, quickViewColor);
                      setSelectedProduct(null);
                    }}
                    style={{
                      width: "100%",
                      backgroundColor: selectedProduct.currentStockLevel > 0 ? "var(--primary)" : "#e4e4e7",
                      color: selectedProduct.currentStockLevel > 0 ? "var(--primary-foreground)" : "#a1a1aa",
                      border: "none",
                      borderRadius: "var(--radius)",
                      padding: "0.65rem",
                      fontWeight: "500",
                      fontSize: "0.85rem",
                      cursor: selectedProduct.currentStockLevel > 0 ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <ShoppingCart style={{ width: "1rem", height: "1rem" }} /> Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="toast-container">
          <div style={{
            backgroundColor: "#f0fdf4",
            borderRadius: "50%",
            padding: "0.2rem",
            color: "#16a34a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <CheckCircle2 style={{ width: "1.1rem", height: "1.1rem" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "500", fontSize: "0.8rem", color: "#09090b" }}>{toastMessage.title}</div>
            <div style={{ fontSize: "0.7rem", color: "#71717a", marginTop: "0.1rem" }}>{toastMessage.subtitle}</div>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#a1a1aa",
              padding: "0.2rem",
              display: "flex",
              alignItems: "center"
            }}
          >
            <X style={{ width: "0.85rem", height: "0.85rem" }} />
          </button>
        </div>
      )}

      {/* Embedded CSS Animations & Media query rules */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(1rem); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .product-image-container {
          position: relative;
          height: 240px;
          background-color: #fafafa;
          overflow: hidden;
          cursor: pointer;
        }
        .product-image-container img {
          transition: transform 0.2s ease;
        }
        .product-image-container:hover img {
          transform: scale(1.03);
        }
        .quick-view-btn {
          position: absolute;
          bottom: 0.75rem;
          left: 50%;
          transform: translateX(-50%) translateY(0.5rem);
          background-color: #09090b;
          color: #ffffff;
          font-weight: 500;
          font-size: 0.75rem;
          padding: 0.4rem 0.8rem;
          border-radius: 0.25rem;
          border: none;
          opacity: 0;
          transition: all 0.15s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .product-image-container:hover .quick-view-btn {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .product-card {
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
        }
        .product-card:hover {
          border-color: #a1a1aa !important;
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.05);
        }
        .product-title-hover {
          transition: color 0.15s ease;
        }
        .product-title-hover:hover {
          color: #71717a !important;
        }
        .quickview-modal-content {
          display: flex;
          flex-direction: column;
          max-height: calc(92vh - 1rem);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 0.5rem;
        }
        .quickview-img-container {
          min-height: 200px;
          max-height: 240px;
        }
        @media (min-width: 640px) {
          .quickview-modal-content {
            flex-direction: row;
            max-height: 80vh;
            overflow-y: auto;
            padding: 0;
          }
          .quickview-img-container {
            min-height: 320px;
            max-height: 480px;
          }
        }
        .toast-container {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 100;
          background-color: #ffffff;
          border: 1px solid #e4e4e7;
          box-shadow: 0 8px 16px -2px rgba(0, 0, 0, 0.05);
          border-radius: 0.375rem;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 280px;
          animation: slideUp 0.2s ease-out;
        }
        @media (max-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }
          .form-row {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
      `}</style>

      {/* Offline Overlay Modal */}
      {isOffline && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(9, 9, 11, 0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e4e4e7",
            borderRadius: "0.5rem",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            maxWidth: "360px",
            width: "100%",
            padding: "1.75rem",
            textAlign: "center"
          }}>
            <div style={{
              margin: "0 auto 1.25rem auto",
              width: "3rem",
              height: "3rem",
              backgroundColor: "#fef2f2",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #fee2e2"
            }}>
              <WifiOff style={{ width: "1.5rem", height: "1.5rem", color: "#dc2626" }} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#09090b", margin: "0 0 0.5rem 0" }}>No Connection</h3>
            <p style={{ fontSize: "0.8rem", color: "#71717a", lineHeight: "1.5", margin: "0 0 1.25rem 0" }}>
              Your connection was lost. We'll restore your session when you're back online.
            </p>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontSize: "0.75rem",
              fontWeight: "500",
              color: "#991b1b",
              backgroundColor: "#fef2f2",
              padding: "0.4rem",
              borderRadius: "0.25rem"
            }}>
              <span style={{ display: "inline-block", width: "0.45rem", height: "0.45rem", borderRadius: "50%", backgroundColor: "#dc2626" }}></span>
              <span>Reconnecting automatically...</span>
            </div>
          </div>
        </div>
      )}

      {syncStatus === "syncing" && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(9, 9, 11, 0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e4e4e7",
            borderRadius: "0.5rem",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            width: "100%",
            maxWidth: "380px",
            padding: "1.5rem",
            textAlign: "center"
          }}>
            <div style={{
              width: "3rem",
              height: "3rem",
              backgroundColor: "#f4f4f5",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem auto"
            }}>
              <TrendingUp style={{ width: "1.5rem", height: "1.5rem", color: "#09090b" }} />
            </div>
            
            <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#09090b", margin: "0 0 0.5rem 0" }}>
              Catalog Sync
            </h3>
            
            <div style={{ 
              fontSize: "0.75rem", 
              backgroundColor: "#fafafa", 
              border: "1px solid #e4e4e7", 
              borderRadius: "0.375rem", 
              padding: "0.6rem",
              marginBottom: "1rem",
              textAlign: "left",
              color: "#27272a"
            }}>
              <p style={{ margin: "0 0 0.15rem 0" }}><strong>Tenant:</strong> {company?.name ? `${company.name.toUpperCase()} (${company.code})` : "Default (syn)"}</p>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "#71717a", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <strong>ID:</strong> {company?.id || "00000000-0000-0000-0000-000000000000"}
              </p>
            </div>

            <p style={{ fontSize: "0.75rem", color: "#71717a", fontWeight: "500", marginBottom: "0.75rem", minHeight: "1.1rem" }}>
              {syncStep}
            </p>

            <div style={{
              width: "100%",
              height: "0.35rem",
              backgroundColor: "#f4f4f5",
              borderRadius: "9999px",
              overflow: "hidden",
              marginBottom: "0.5rem"
            }}>
              <div style={{
                width: `${syncProgress}%`,
                height: "100%",
                backgroundColor: "var(--primary)",
                borderRadius: "9999px",
                transition: "width 0.2s ease-in-out"
              }} />
            </div>
            
            <span style={{ fontSize: "0.7rem", color: "#71717a", fontWeight: "600" }}>
              {syncProgress}% Complete
            </span>
          </div>
        </div>
      )}

      {/* App-like Native Mobile Bottom Navigation Bar */}
      <MobileBottomNav cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} favoritesCount={favorites.length} />

    </div>
  );
}

