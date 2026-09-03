"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { applyBrandingStyles } from "../../utils/branding";
import { 
  Scissors, 
  ShoppingCart, 
  X, 
  ShoppingBag, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Heart,
  Grid,
  WifiOff,
  ArrowLeft,
  Star,
  Check,
  Shirt,
  Gem,
  Watch,
  Glasses,
  Footprints,
  Crown,
  Palette,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  User,
  Barcode,
  Printer,
  Scan
} from "lucide-react";

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
  if (normalized === "XS") return "0.65rem";
  if (normalized === "S") return "0.75rem";
  if (normalized === "M") return "0.85rem";
  if (normalized === "L") return "0.95rem";
  if (normalized === "XL") return "1.05rem";
  if (normalized === "XXL" || normalized === "2XL") return "1.15rem";
  if (normalized === "3XL") return "1.25rem";
  return "0.85rem";
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
        <div style={{ flex: 1, position: "relative", overflow: "hidden", borderRadius: "0.375rem" }}>
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
                  width: "38px",
                  height: "38px",
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
          fontWeight: "750",
          fontSize: "2rem",
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
      minHeight: "300px",
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
        fontSize: "2rem",
        color: "#27272a",
        opacity: 0.85,
        letterSpacing: "0.05em"
      }}>
        {initials}
      </span>
    </div>
  );
}

export default function ProductDetailPage() {
  const [erpAdminUrl, setErpAdminUrl] = useState(() => {
    return process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` : "http://localhost:3000/dashboard";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (isLocal) {
        setErpAdminUrl("http://localhost:3000/dashboard");
      }
    }
  }, []);

  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<any | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [brand, setBrand] = useState<any>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  // Cart & interactive states
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState("Indigo Blue");
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Specs Accordions
  const [openAccordion, setOpenAccordion] = useState<string | null>("specs");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      const storedBrand = localStorage.getItem("seyon:storefront:brand") || "";
      setSelectedBrand(storedBrand);

      // Load cart
      const storedCart = localStorage.getItem("seyon:storefront:cart");
      if (storedCart) {
        try {
          setCart(JSON.parse(storedCart));
        } catch (e) {
          // ignore
        }
      }

      // Load favorites
      const storedFavs = localStorage.getItem("seyon:storefront:favorites");
      if (storedFavs) {
        try {
          const favs = JSON.parse(storedFavs);
          if (Array.isArray(favs)) {
            setIsFavorite(favs.includes(id));
          }
        } catch (e) {
          // ignore
        }
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [id]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("seyon:storefront:cart", JSON.stringify(cart));
    }
  }, [cart]);

  useEffect(() => {
    applyBrandingStyles(company, brand);
  }, [company, brand]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          throw new Error("Product not found");
        }
        const data = await res.json();
        setProduct(data.product);
        if (data.company) {
          setCompany(data.company);
        }
        if (data.brand) {
          setBrand(data.brand);
        }
        if (data.product) {
          setSelectedSize(data.product.size || "M");
          setSelectedColor(data.product.color || "Indigo Blue");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Derive sizes dynamically from product attributes
  const sizes = React.useMemo(() => {
    if (!product) return ["S", "M", "L", "XL"];
    if (Array.isArray(product.availableSizes) && product.availableSizes.length > 0) {
      return product.availableSizes;
    }
    const s = product.size || "M";
    if (s === "Standard" || s.includes("ml") || s.includes("mm") || s === "Free Size" || s.startsWith("UK") || s.startsWith("US") || s.startsWith("EU")) {
      return [s];
    }
    if (!isNaN(Number(s))) {
      const num = Number(s);
      return [String(num - 2), String(num), String(num + 2), String(num + 4)];
    }
    return ["S", "M", "L", "XL"];
  }, [product]);

  // Derive colors dynamically matching the actual product item
  const colors = React.useMemo(() => {
    if (!product) return ["Default Color"];
    if (Array.isArray(product.availableColors) && product.availableColors.length > 0) {
      return product.availableColors;
    }
    return [product.color || "Default Color"];
  }, [product]);

  const toggleFavorite = () => {
    const nextVal = !isFavorite;
    setIsFavorite(nextVal);
    if (typeof window !== "undefined") {
      const storedFavs = localStorage.getItem("seyon:storefront:favorites");
      let favs: string[] = [];
      if (storedFavs) {
        try {
          favs = JSON.parse(storedFavs);
        } catch (e) {
          // ignore
        }
      }
      if (favs.includes(id)) {
        favs = favs.filter(f => f !== id);
      } else {
        favs.push(id);
      }
      localStorage.setItem("seyon:storefront:favorites", JSON.stringify(favs));
    }
  };

  const addToCart = (prod: any, size: string, color: string) => {
    const existing = cart.find(
      item => item.product.id === prod.id && item.selectedSize === size && item.selectedColor === color
    );

    if (existing) {
      setCart(prev => prev.map(item => 
        (item.product.id === prod.id && item.selectedSize === size && item.selectedColor === color)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart(prev => [...prev, { product: prod, quantity: 1, selectedSize: size, selectedColor: color }]);
    }

    setToastMessage({
      title: "Added to Shopping Bag",
      subtitle: `${prod.title} (${size} / ${color})`
    });

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleBuyNow = (prod: any, size: string, color: string) => {
    addToCart(prod, size, color);
    router.push("/checkout");
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

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "2rem",
            height: "2rem",
            border: "2.5px solid #e4e4e7",
            borderTopColor: "#09090b",
            borderRadius: "50%",
            margin: "0 auto 1rem auto",
            animation: "spin 0.8s linear infinite"
          }} />
          <p style={{ color: "#71717a", fontSize: "0.85rem" }}>Loading specifications...</p>
        </div>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div style={{ display: "flex", height: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", gap: "1rem" }}>
        <AlertCircle style={{ width: "2.5rem", height: "2.5rem", color: "#dc2626" }} />
        <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#09090b" }}>Product Not Found</h3>
        <p style={{ color: "#71717a", fontSize: "0.85rem" }}>{errorMsg || "The requested item could not be retrieved."}</p>
        <Link href="/" style={{
          backgroundColor: "#09090b",
          color: "#ffffff",
          textDecoration: "none",
          padding: "0.5rem 1rem",
          borderRadius: "0.375rem",
          fontWeight: "500",
          fontSize: "0.85rem"
        }}>
          Return to Catalog
        </Link>
      </div>
    );
  }

  const inStock = product.currentStockLevel > 0;
  const isLowStock = inStock && product.currentStockLevel <= 5;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": product.imageUrl || [],
    "description": product.description || `Buy ${product.title} online. Premium apparel crafted for durability and comfort.`,
    "sku": product.sku,
    "offers": {
      "@type": "Offer",
      "url": typeof window !== "undefined" ? window.location.href : "",
      "priceCurrency": "INR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": company?.name || "MERCHANT VAULT"
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#ffffff", color: "#09090b", fontFamily: "'Outfit', sans-serif" }}>
      {/* Product JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {/* Header */}
      <header style={{
        position: "sticky",
        top: 0,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderBottom: "1px solid #e4e4e7",
        zIndex: 40,
        padding: "1rem 1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <Link href={`/?companyId=${company?.id || ""}${selectedBrand ? `&brand=${selectedBrand}` : ""}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", color: "#09090b" }}>
          {brand?.logoUrl ? (
            <img 
              src={brand.logoUrl} 
              alt={brand?.name || company?.name || "Logo"} 
              style={{ height: "2.25rem", objectFit: "contain", borderRadius: "var(--radius)" }} 
            />
          ) : (
            <div style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              width: "2rem",
              height: "2rem",
              borderRadius: "var(--radius)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "1rem"
            }}>{(brand?.name ? brand.name[0] : (company?.code === "wolfcabin" ? "W" : (company?.name ? company.name[0] : "S"))).toUpperCase()}</div>
          )}
          <div>
            <span style={{ fontSize: "1.15rem", fontWeight: "700", letterSpacing: "-0.025em", textTransform: "uppercase" }}>
              {brand?.name || (company?.code === "wolfcabin" ? "The Wolf Cabin" : (company?.name || "SEYON"))}
            </span>
            <span style={{ fontSize: "0.7rem", fontWeight: "500", color: "#71717a", marginLeft: "0.5rem", border: "1px solid var(--border)", padding: "0.1rem 0.35rem", borderRadius: "var(--radius)", textTransform: "uppercase" }}>
              PRE-RELEASE
            </span>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <a 
            href={erpAdminUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#71717a", fontSize: "0.75rem", fontWeight: "500", textDecoration: "none" }}
          >
            ERP Panel ↗
          </a>
          
          <Link 
            href="/cart"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              position: "relative",
              color: "#09090b",
              padding: "0.4rem",
              display: "flex",
              alignItems: "center"
            }}
          >
            <ShoppingCart style={{ width: "1.25rem", height: "1.25rem" }} />
            {cartCount > 0 && (
              <span style={{
                position: "absolute",
                top: "0px",
                right: "0px",
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
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Main product area */}
      <main style={{ flex: 1, maxWidth: "1000px", margin: "2rem auto", padding: "0 1.5rem", width: "100%" }}>
        {/* Interactive Breadcrumb Navigation Trail */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: "1.25rem" }}>
          <ol style={{ display: "flex", alignItems: "center", gap: "0.4rem", listStyle: "none", padding: 0, margin: 0, fontSize: "0.8rem", color: "#71717a", flexWrap: "wrap" }}>
            <li>
              <Link href="/" style={{ textDecoration: "none", color: "#71717a", fontWeight: "500", transition: "color 0.15s ease" }} className="hover:text-slate-900">
                Home
              </Link>
            </li>
            <li><ChevronRight style={{ width: "0.8rem", height: "0.8rem", color: "#a1a1aa" }} /></li>
            <li>
              <Link href={`/?category=${encodeURIComponent(product.category || "Apparel")}`} style={{ textDecoration: "none", color: "#71717a", fontWeight: "500" }}>
                {product.category || "Apparel"}
              </Link>
            </li>
            <li><ChevronRight style={{ width: "0.8rem", height: "0.8rem", color: "#a1a1aa" }} /></li>
            <li style={{ color: "#09090b", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "320px" }}>
              {product.title}
            </li>
          </ol>
        </nav>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "2.5rem",
          backgroundColor: "#ffffff",
          borderRadius: "0.5rem",
          border: "1px solid #e4e4e7",
          padding: "2rem",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.02)"
        }} className="product-layout-grid">
          
          {/* Left Column: Product Image Preview */}
          <div style={{ 
            borderRadius: "0.375rem", 
            overflow: "hidden", 
            border: "1px solid #e4e4e7", 
            aspectRatio: "1",
            maxHeight: "480px",
            backgroundColor: "#fafafa"
          }}>
            <ProductImage prod={product} />
          </div>

          {/* Right Column: Specifications Form */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ 
                border: "1px solid #e4e4e7", 
                color: "#71717a", 
                fontSize: "0.65rem", 
                padding: "0.2rem 0.5rem", 
                borderRadius: "0.25rem", 
                fontWeight: "500",
                textTransform: "uppercase"
              }}>
                {product.category || "Apparel"}
              </span>
              <span style={{ fontSize: "0.7rem", color: "#a1a1aa", fontWeight: "500" }}>
                SKU: {product.sku}
              </span>
            </div>

            <h1 style={{ fontSize: "1.6rem", fontWeight: "700", color: "#09090b", margin: "0.6rem 0 0.4rem 0", lineHeight: "1.2" }}>
              {product.title}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", color: "#f59e0b" }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} style={{ width: "0.9rem", height: "0.9rem", fill: "currentColor" }} />
                ))}
              </div>
              <span style={{ fontSize: "0.75rem", color: "#71717a", fontWeight: "500" }}>4.8 (24 reviews)</span>
            </div>

            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              flexWrap: "wrap",
              gap: "0.75rem", 
              paddingBottom: "1.25rem", 
              borderBottom: "1px solid #e4e4e7",
              marginBottom: "1.25rem"
            }}>
              <span style={{ fontSize: "1.75rem", fontWeight: "700", color: "#09090b" }}>₹{product.price}</span>
              
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <>
                  <span style={{ fontSize: "1.1rem", color: "#a1a1aa", textDecoration: "line-through" }}>
                    ₹{product.compareAtPrice}
                  </span>
                  <span style={{
                    backgroundColor: "#fef2f2",
                    color: "#dc2626",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "0.25rem",
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    border: "1px solid #fee2e2"
                  }}>
                    SAVE {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                  </span>
                </>
              )}

              <span style={{
                backgroundColor: !inStock ? "#fef2f2" : isLowStock ? "#fffbeb" : "#f0fdf4",
                color: !inStock ? "#dc2626" : isLowStock ? "#d97706" : "#16a34a",
                padding: "0.25rem 0.6rem",
                borderRadius: "0.25rem",
                fontSize: "0.7rem",
                fontWeight: "600",
                border: `1px solid ${!inStock ? "#fee2e2" : isLowStock ? "#fef3c7" : "#dcfce7"}`
              }}>
                {!inStock ? "OUT OF STOCK" : isLowStock ? `Only ${product.currentStockLevel} remaining` : `In Stock: ${product.currentStockLevel} units`}
              </span>
            </div>

            <p style={{ color: "#71717a", fontSize: "0.85rem", lineHeight: "1.5", margin: "0 0 1.25rem 0" }}>
              {product.description || "Directly synced from Seyon ERP Database. Live stock tracking active."}
            </p>

            {/* Size Selector */}
            <div style={{ marginBottom: "1.25rem" }}>
              <span style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#27272a", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Select Size
              </span>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                {sizes.map((size: string) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={{
                        border: isSelected ? "1px solid rgba(0,0,0,0.15)" : "1px solid var(--border)",
                        backgroundColor: isSelected ? "var(--primary)" : "#ffffff",
                        color: isSelected ? "var(--primary-foreground)" : "#09090b",
                        padding: "0.45rem 0.9rem",
                        borderRadius: "var(--radius)",
                        fontWeight: "600",
                        fontSize: getSizeFontSize(size),
                        cursor: "pointer",
                        outline: isSelected ? "2px solid var(--primary)" : "none",
                        outlineOffset: "2px",
                        transition: "all 0.15s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "2.25rem",
                        height: "2.25rem"
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Selector */}
            <div style={{ marginBottom: "1.75rem" }}>
              <span style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#27272a", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Select Color
              </span>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                {colors.map((color: string) => {
                  const isSelected = selectedColor === color;
                  const bgVal = getColorValue(color);
                  const isDark = isDarkColor(color);
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        border: isSelected ? "1px solid rgba(0,0,0,0.15)" : "1px solid var(--border)",
                        backgroundColor: bgVal,
                        color: isDark ? "#ffffff" : "#09090b",
                        padding: "0.45rem 0.85rem",
                        borderRadius: "var(--radius)",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        outline: isSelected ? `2px solid var(--primary)` : "none",
                        outlineOffset: "2px",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "auto" }}>
              <button
                onClick={() => addToCart(product, selectedSize, selectedColor)}
                disabled={!inStock}
                style={{
                  flex: 1,
                  backgroundColor: "#ffffff",
                  border: "1.5px solid var(--primary)",
                  color: "var(--primary)",
                  borderRadius: "var(--radius)",
                  padding: "0.75rem",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  cursor: inStock ? "pointer" : "not-allowed",
                  opacity: inStock ? 1 : 0.5,
                  transition: "background-color 0.15s ease"
                }}
                onMouseOver={(e) => { if (inStock) e.currentTarget.style.backgroundColor = "rgba(13, 148, 136, 0.05)"; }}
                onMouseOut={(e) => { if (inStock) e.currentTarget.style.backgroundColor = "#ffffff"; }}
              >
                Add to Cart
              </button>

              <button
                onClick={() => handleBuyNow(product, selectedSize, selectedColor)}
                disabled={!inStock}
                style={{
                  flex: 1.5,
                  backgroundColor: inStock ? "var(--primary)" : "#e4e4e7",
                  border: "none",
                  color: inStock ? "var(--primary-foreground)" : "#a1a1aa",
                  borderRadius: "var(--radius)",
                  padding: "0.75rem",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  cursor: inStock ? "pointer" : "not-allowed",
                  transition: "background-color 0.15s ease"
                }}
                onMouseOver={(e) => { if (inStock) e.currentTarget.style.backgroundColor = "rgba(13, 148, 136, 0.9)"; }}
                onMouseOut={(e) => { if (inStock) e.currentTarget.style.backgroundColor = "var(--primary)"; }}
              >
                Buy Now
              </button>

              <button
                onClick={toggleFavorite}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e4e4e7",
                  borderRadius: "0.375rem",
                  padding: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                <Heart style={{ width: "1.1rem", height: "1.1rem", fill: isFavorite ? "#dc2626" : "none", color: isFavorite ? "#dc2626" : "#71717a" }} />
              </button>
            </div>

            {/* Spec Accordions */}
            <div style={{ marginTop: "1.5rem", borderTop: "1px solid #e4e4e7" }}>
              {/* Technical specs */}
              <div style={{ borderBottom: "1px solid #e4e4e7" }}>
                <button
                  onClick={() => setOpenAccordion(openAccordion === "specs" ? null : "specs")}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem 0",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    color: "#09090b"
                  }}
                >
                  <span>Product Specifications</span>
                  {openAccordion === "specs" ? <ChevronUp style={{ width: "0.9rem", height: "0.9rem" }} /> : <ChevronDown style={{ width: "0.9rem", height: "0.9rem" }} />}
                </button>
                {openAccordion === "specs" && (
                  <div style={{ paddingBottom: "0.75rem", fontSize: "0.75rem", color: "#71717a", lineHeight: "1.6" }}>
                    <p style={{ margin: "0 0 0.35rem 0" }}><strong>Item SKU:</strong> <code style={{ backgroundColor: "#f4f4f5", padding: "0.15rem 0.4rem", borderRadius: "0.25rem", fontFamily: "monospace" }}>{product.sku}</code></p>
                    <p style={{ margin: "0 0 0.35rem 0" }}><strong>Category:</strong> {product.category || "Apparel"}</p>
                    <p style={{ margin: "0 0 0.35rem 0" }}><strong>Material & Care:</strong> 100% Premium Natural Weave — Gentle Hand Wash / Dry Clean</p>
                    <p style={{ margin: 0 }}><strong>Availability:</strong> {product.currentStockLevel > 0 ? "In Stock (Dispatched within 24 Hours)" : "Out of Stock"}</p>
                  </div>
                )}
              </div>

              {/* Shipping & returns */}
              <div style={{ borderBottom: "1px solid #e4e4e7" }}>
                <button
                  onClick={() => setOpenAccordion(openAccordion === "shipping" ? null : "shipping")}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem 0",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    color: "#09090b"
                  }}
                >
                  <span>Shipping & Returns</span>
                  {openAccordion === "shipping" ? <ChevronUp style={{ width: "0.9rem", height: "0.9rem" }} /> : <ChevronDown style={{ width: "0.9rem", height: "0.9rem" }} />}
                </button>
                {openAccordion === "shipping" && (
                  <div style={{ paddingBottom: "0.75rem", fontSize: "0.75rem", color: "#71717a", lineHeight: "1.4" }}>
                    <p style={{ margin: "0 0 0.25rem 0" }}>✓ Free standard shipping on all orders.</p>
                    <p style={{ margin: "0 0 0.25rem 0" }}>✓ Cash on Delivery (COD) eligible across major pin codes.</p>
                    <p style={{ margin: 0 }}>✓ 7-day hassle-free returns synced automatically with ERP panel updates.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Free shipping banner */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "#f0fdf4",
              border: "1px solid #dcfce7",
              color: "#166534",
              borderRadius: "0.375rem",
              padding: "0.6rem 0.85rem",
              marginTop: "1.25rem",
              fontSize: "0.75rem",
              fontWeight: "500"
            }}>
              <Truck style={{ width: "1rem", height: "1rem" }} /> Free delivery & Cash on Delivery eligible.
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: "#ffffff",
        color: "#71717a",
        padding: "2.5rem 1.5rem",
        fontSize: "0.8rem",
        borderTop: "1px solid #e4e4e7",
        marginTop: "4rem"
      }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <p style={{ margin: 0, color: "#09090b", fontWeight: "600" }}>Seyon Storefront Demo Channel</p>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#a1a1aa" }}>Connected via direct PostgreSQL connection pool</p>
          </div>
          <div>
            <p style={{ margin: 0 }}>© {new Date().getFullYear()} MerchantVault by SEYON NEXA LABS. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* CART DRAWER SLIDE-OUT OVERLAY */}
      {isCartOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(9, 9, 11, 0.4)",
          backdropFilter: "blur(2px)",
          zIndex: 50,
          display: "flex",
          justifyContent: "flex-end"
        }} onClick={() => setIsCartOpen(false)}>
          <div style={{
            backgroundColor: "#ffffff",
            width: "100%",
            maxWidth: "380px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            boxShadow: "-4px 0 20px rgba(0,0,0,0.08)",
            animation: "slideIn 0.2s ease-out"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e4e4e7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ fontSize: "1rem", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShoppingBag style={{ width: "1.1rem", height: "1.1rem" }} /> Shopping Cart ({cartCount})
              </h4>
              <button 
                onClick={() => setIsCartOpen(false)}
                style={{ backgroundColor: "transparent", border: "none", cursor: "pointer", color: "#71717a", padding: "0.25rem" }}
              >
                <X style={{ width: "1.2rem", height: "1.2rem" }} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem 0", color: "#71717a" }}>
                  <ShoppingBag style={{ width: "2rem", height: "2rem", margin: "0 auto 1rem auto", opacity: 0.5 }} />
                  <p style={{ fontWeight: "500", fontSize: "0.85rem", margin: 0 }}>Your bag is empty.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "0.75rem", paddingBottom: "1rem", borderBottom: "1px solid #f4f4f5" }}>
                      <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "0.25rem", overflow: "hidden", border: "1px solid #e4e4e7", flexShrink: 0 }}>
                        <ProductImage prod={item.product} style={{ fontSize: "0.8rem" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                          <h4 style={{ margin: 0, fontSize: "0.8rem", fontWeight: "600", color: "#09090b" }}>{item.product.title}</h4>
                          <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>₹{item.product.price * item.quantity}</span>
                        </div>
                        <p style={{ margin: "0.15rem 0 0.4rem 0", fontSize: "0.7rem", color: "#71717a" }}>
                          Size: {item.selectedSize} | Color: {item.selectedColor}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <button 
                            onClick={() => updateCartQty(idx, -1)}
                            style={{ width: "1.25rem", height: "1.25rem", borderRadius: "0.25rem", border: "1px solid #e4e4e7", backgroundColor: "#ffffff", cursor: "pointer", fontWeight: "500", fontSize: "0.75rem", color: "#09090b" }}
                          >-</button>
                          <span style={{ fontSize: "0.75rem", fontWeight: "600", minWidth: "1rem", textAlign: "center" }}>{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQty(idx, 1)}
                            style={{ width: "1.25rem", height: "1.25rem", borderRadius: "0.25rem", border: "1px solid #e4e4e7", backgroundColor: "#ffffff", cursor: "pointer", fontWeight: "500", fontSize: "0.75rem", color: "#09090b" }}
                          >+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid #e4e4e7", backgroundColor: "#ffffff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                  <span style={{ color: "#71717a" }}>Subtotal</span>
                  <span style={{ fontWeight: "600", color: "#09090b" }}>₹{cartTotal}</span>
                </div>
                <button 
                  onClick={() => router.push("/?checkout=true")}
                  style={{
                    width: "100%",
                    backgroundColor: "#09090b",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "0.375rem",
                    padding: "0.75rem",
                    fontWeight: "500",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="toast-container">
          <div style={{
            backgroundColor: "#f0fdf4",
            color: "#16a34a",
            width: "1.75rem",
            height: "1.75rem",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <CheckCircle2 style={{ width: "1rem", height: "1rem" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: "600", fontSize: "0.8rem", color: "#09090b" }}>{toastMessage.title}</p>
            <p style={{ margin: "0.1rem 0 0 0", fontSize: "0.7rem", color: "#71717a", fontWeight: "500" }}>{toastMessage.subtitle}</p>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            style={{
              backgroundColor: "#f4f4f5",
              border: "1px solid #e4e4e7",
              borderRadius: "0.25rem",
              padding: "0.3rem 0.5rem",
              fontSize: "0.7rem",
              fontWeight: "500",
              cursor: "pointer",
              color: "#09090b"
            }}
          >
            Open Cart
          </button>
        </div>
      )}

      {/* Embedded CSS Animations */}
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
        .back-link:hover {
          color: #09090b !important;
        }
        .product-layout-grid {
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 768px) {
          .product-layout-grid {
            grid-template-columns: 1fr;
            padding: 1.25rem;
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
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#09090b", margin: "0 0 0.5rem 0" }}>No Internet Connection</h3>
            <p style={{ fontSize: "0.8rem", color: "#71717a", lineHeight: "1.5", margin: "0 0 1.25rem 0" }}>
              Your connection was lost. session will auto-restore when you're back online.
            </p>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              fontSize: "0.75rem",
              fontWeight: "500",
              padding: "0.4rem 0.8rem",
              borderRadius: "9999px"
            }}>
              <span>Attempting to reconnect...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
