"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import JsBarcode from "jsbarcode";
import { QRCodeSVG } from "qrcode.react";
import { 
  Printer, 
  Plus, 
  Trash2, 
  Search, 
  Sliders, 
  FileText, 
  Layers,
  ShoppingBag,
  QrCode,
  Package
} from "lucide-react";


interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  compareAtPrice?: number;
  shopifyVariantId: string;
  barcodeString?: string;
  barcode?: string;
  category?: string;
  targetGroup?: string;
  ageRange?: string;
  brand?: string;
  vendor?: string;
  imageUrl?: string;
}

export type TagPreset = "STANDARD" | "COMPACT" | "MICRO" | "TAG_40X50" | "TAG_50X40_LAND" | "TAG_40X50_HYBRID";

interface QueueItem {
  id: string;
  variant: ProductVariant;
  quantity: number;
  preset: TagPreset;
}



export default function BarcodePage() {
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductVariant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [imgErrorMap, setImgErrorMap] = useState<{ [key: string]: boolean }>({});

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close product search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch product variants from API on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch("/api/inventory");
        const data = await res.json();
        if (Array.isArray(data)) {
          const parseVariantImageUrl = (v: any): string => {
            if (v.imageUrl && typeof v.imageUrl === "string" && (v.imageUrl.startsWith("http") || v.imageUrl.startsWith("data:"))) {
              return v.imageUrl;
            }
            if (v.image && typeof v.image === "string" && (v.image.startsWith("http") || v.image.startsWith("data:"))) {
              return v.image;
            }
            if (v.thumbnailConfig) {
              if (typeof v.thumbnailConfig === "string") {
                try {
                  const cfg = JSON.parse(v.thumbnailConfig);
                  if (cfg.imageUrl) return cfg.imageUrl;
                  if (cfg.url) return cfg.url;
                  if (Array.isArray(cfg.images) && cfg.images[0]) return cfg.images[0];
                } catch (_) {
                  if (v.thumbnailConfig.startsWith("http") || v.thumbnailConfig.startsWith("data:")) {
                    return v.thumbnailConfig;
                  }
                }
              } else if (typeof v.thumbnailConfig === "object") {
                if (v.thumbnailConfig.imageUrl) return v.thumbnailConfig.imageUrl;
                if (v.thumbnailConfig.url) return v.thumbnailConfig.url;
                if (Array.isArray(v.thumbnailConfig.images) && v.thumbnailConfig.images[0]) return v.thumbnailConfig.images[0];
              }
            }
            return "";
          };

          const mapped: ProductVariant[] = data.map((v: any) => ({
            id: v.id,
            name: v.title,
            sku: v.sku,
            color: v.color || "",
            size: v.size || "",
            price: v.price || 1299,
            compareAtPrice: (v.compareAtPrice && Number(v.compareAtPrice) > Number(v.price)) ? Number(v.compareAtPrice) : Math.round((v.price || 1299) * 1.25),
            shopifyVariantId: v.shopifyVariantId || "",
            category: v.category || "",
            targetGroup: v.targetGroup || "",
            ageRange: v.ageRange || "",
            brand: v.brand || undefined,
            vendor: v.vendor || undefined,
            imageUrl: parseVariantImageUrl(v),
          }));
          setProducts(mapped);
          if (mapped.length > 0) {
            setSelectedProduct(mapped[0]);
          }
        }
      } catch (err) {
        toast.error("Failed to load product catalog.");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Active Company and Warehouse states
  const [company, setCompany] = useState<any>(null);
  const [activeWhId, setActiveWhId] = useState("");
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    const fetchCompanySession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.company) {
            setCompany(data.company);
          }
        }
      } catch (err) {
        console.error("Failed to fetch session in barcode view", err);
      }
    };
    fetchCompanySession();

    const savedWh = localStorage.getItem("activeWarehouseId");
    if (savedWh) setActiveWhId(savedWh);

    const fetchWhs = async () => {
      try {
        let data = [];
        const cachedWhs = localStorage.getItem("seyon:warehouses");
        if (cachedWhs) {
          data = JSON.parse(cachedWhs);
        } else {
          const res = await fetch("/api/warehouses");
          data = await res.json();
          if (Array.isArray(data)) {
            localStorage.setItem("seyon:warehouses", JSON.stringify(data));
          }
        }

        if (Array.isArray(data)) {
          setWarehouses(data);
        }
      } catch (err) {
        console.error("Failed to load warehouses in barcode view", err);
      }
    };
    fetchWhs();
  }, []);

  const activeWh = warehouses.find(w => w.id === activeWhId);
  const activeWhCode = activeWh?.code || "MUM-01";

  // Configuration options
  const [codeType, setCodeType] = useState<"BARCODE" | "QR">("QR");
  const [barcodeFormat, setBarcodeFormat] = useState<"CODE128" | "CODE39">("CODE128");
  const [qrPayloadType, setQrPayloadType] = useState<"SKU" | "URL" | "SERIALIZED">("SERIALIZED");
  const [tagPreset, setTagPreset] = useState<TagPreset>("STANDARD");
  const [printCopies, setPrintCopies] = useState<number>(1);
  
  const [width, setWidth] = useState<number>(2);
  const [height, setHeight] = useState<number>(50);
  const [qrSize, setQrSize] = useState<number>(100);
  
  const [displayValue, setDisplayValue] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showCompareAtPrice, setShowCompareAtPrice] = useState<boolean>(false);
  const [showBrand, setShowBrand] = useState<boolean>(false);
  const [showVendor, setShowVendor] = useState<boolean>(false);
  const [customBrand, setCustomBrand] = useState<string>("");

  useEffect(() => {
    if (!customBrand) {
      if (selectedProduct?.vendor) {
        setCustomBrand(selectedProduct.vendor);
      } else if (selectedProduct?.brand) {
        setCustomBrand(selectedProduct.brand);
      } else if (company?.name) {
        setCustomBrand(company.name);
      }
    }
  }, [company, selectedProduct]);

  const handlePresetChange = (preset: TagPreset) => {
    setTagPreset(preset);
    if (preset === "STANDARD") {
      setQrSize(100);
      setShowPrice(true);
      setDisplayValue(true);
    } else if (preset === "COMPACT") {
      setQrSize(80);
      setShowPrice(false);
      setDisplayValue(true);
    } else if (preset === "MICRO") {
      setQrSize(60);
      setShowBrand(false);
      setShowPrice(false);
      setDisplayValue(false);
    } else if (preset === "TAG_40X50") {
      setQrSize(90);
      setShowPrice(true);
      setDisplayValue(true);
    } else if (preset === "TAG_50X40_LAND") {
      setQrSize(75);
      setShowPrice(true);
      setDisplayValue(true);
    } else if (preset === "TAG_40X50_HYBRID") {
      setQrSize(70);
      setShowPrice(true);
      setDisplayValue(true);
    }
  };

  // Queue state
  const [printQueue, setPrintQueue] = useState<QueueItem[]>([]);
  const [queueQuantity, setQueueQuantity] = useState<number>(1);
  const [layoutColumns, setLayoutColumns] = useState<number>(3);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__seyonIsDirty = printQueue.length > 0;
    }
    return () => {
      if (typeof window !== "undefined") {
        (window as any).__seyonIsDirty = false;
      }
    };
  }, [printQueue]);

  const barcodeRef = useRef<SVGSVGElement | null>(null);

  // Get dynamic URL for Shopify lookup
  const getShopifyUrl = (variant: ProductVariant) => {
    const handle = variant.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const domain = company?.shopifyStoreUrl ? company.shopifyStoreUrl.replace("https://", "").replace("http://", "") : "store.myshopify.com";
    return `https://${domain}/products/${handle}?sku=${variant.sku}`;
  };

  const getQrValue = (variant: ProductVariant) => {
    if (tagPreset === "MICRO") {
      if (variant && variant.shopifyVariantId) {
        const match = variant.shopifyVariantId.match(/\d+/);
        if (match) return match[0];
      }
      // Fallback: extract digits from SKU, then ID, or default to generic number
      const numericSku = variant?.sku ? variant.sku.replace(/\D/g, "") : "";
      if (numericSku) return numericSku;
      const numericId = variant?.id ? variant.id.replace(/\D/g, "") : "";
      return numericId || "999901";
    }
    if (qrPayloadType === "SERIALIZED") {
      return `syn:${activeWhCode}:${variant?.sku || ""}:0001`;
    }
    return qrPayloadType === "URL" ? getShopifyUrl(variant) : (variant?.sku || "");
  };

  // Render 1D Barcode if active
  useEffect(() => {
    if (codeType === "BARCODE" && barcodeRef.current && selectedProduct) {
      try {
        JsBarcode(barcodeRef.current, selectedProduct.sku, {
          format: barcodeFormat,
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: 12,
          margin: 10,
          background: "#ffffff",
          lineColor: "#0f172a"
        });
      } catch (err) {
        console.warn("Barcode rendering warning", err);
      }
    }
  }, [selectedProduct, codeType, barcodeFormat, width, height, displayValue]);

  const addToQueue = () => {
    if (queueQuantity <= 0 || !selectedProduct) return;
    const existing = printQueue.find(
      item => item.variant.id === selectedProduct.id && item.preset === tagPreset
    );
    
    if (existing) {
      setPrintQueue(printQueue.map(item => 
        (item.variant.id === selectedProduct.id && item.preset === tagPreset)
          ? { ...item, quantity: item.quantity + queueQuantity } 
          : item
      ));
    } else {
      setPrintQueue([...printQueue, {
        id: `q-${Date.now()}`,
        variant: selectedProduct,
        quantity: queueQuantity,
        preset: tagPreset
      }]);
    }
    toast.success(`Added ${queueQuantity} ${tagPreset.toLowerCase()} tag(s) to printing queue.`);
  };

  const removeFromQueue = (id: string) => {
    setPrintQueue(printQueue.filter(item => item.id !== id));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loadingProducts) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-2xl mx-auto my-12">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-605">Syncing and loading product catalog...</p>
      </div>
    );
  }

  if (products.length === 0 || !selectedProduct) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center max-w-lg mx-auto my-12 bg-white border border-slate-200 rounded-2xl shadow-lg relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-sm group-hover:scale-105 transition-transform duration-300">
          <QrCode className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg tracking-tight">Catalog is Currently Empty</h3>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed mt-2.5">
          Your company has no registered product variants in the inventory system. Please seed/add product variants or sync with Shopify before generating retail barcode tags.
        </p>
        <div className="mt-6 flex gap-3">
          <a
            href="/dashboard/inventory"
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm hover:shadow"
          >
            Go to Inventory
          </a>
          <a
            href="/dashboard/marketplaces"

            className="inline-flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Sync Shopify
          </a>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-gray-200 rounded-xl shadow-sm no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <QrCode className="w-3 h-3" /> Retail Tag System
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Print & Generate Tags</h1>
          <p className="text-sm text-gray-500">
            Generate 1D barcodes or 2D QR codes for product tags, scanner tracking, and Shopify linkages.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        {/* Settings Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              Select Product Variant
            </h2>

            <div className="relative" ref={dropdownRef}>
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search variants by SKU or name..."
                value={searchQuery}
                onFocus={() => setShowProductDropdown(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {showProductDropdown && (
                <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {filteredProducts.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-gray-400 text-center">No matching variants found</div>
                  ) : (
                    filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProduct(p);
                          setShowProductDropdown(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-indigo-50/50 cursor-pointer text-xs transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {p.imageUrl && !imgErrorMap[p.id] ? (
                              <img 
                                src={p.imageUrl} 
                                alt={p.name} 
                                className="w-full h-full object-cover" 
                                onError={() => setImgErrorMap(prev => ({ ...prev, [p.id]: true }))}
                              />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{p.name}</p>
                            <p className="text-gray-500 font-mono text-[11px]">SKU: {p.sku}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                            {p.color || "No Color"} / {p.size || "No Size"}
                          </span>
                          <span className="font-bold text-gray-900">₹{p.price}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Active Variant Card with Full Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-start justify-between flex-wrap md:flex-nowrap gap-4">
                <div className="flex items-center gap-4">
                  {/* BIGGER ACTIVE VARIANT IMAGE CONTAINER (96x96 px) */}
                  <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden flex items-center justify-center shrink-0 group relative">
                    {selectedProduct.imageUrl && !imgErrorMap[selectedProduct.id] ? (
                      <img 
                        src={selectedProduct.imageUrl} 
                        alt={selectedProduct.name} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        onError={() => setImgErrorMap(prev => ({ ...prev, [selectedProduct.id]: true }))}
                      />
                    ) : (
                      <Package className="w-10 h-10 text-indigo-400/80" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 uppercase font-bold tracking-wider text-[9px]">Active Variant</span>
                      {selectedProduct.category && (
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                          {selectedProduct.category}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg leading-snug">{selectedProduct.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Color: <b className="text-gray-800">{selectedProduct.color || "Standard"}</b></span>
                      <span>•</span>
                      <span>Size: <b className="text-indigo-600">{selectedProduct.size || "Standard"}</b></span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-2xs text-right shrink-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Price (MRP)</p>
                  <p className="font-extrabold text-indigo-950 text-xl leading-none mt-1">
                    ₹{selectedProduct.price.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Grid of full product properties */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1.5 border-t border-slate-200/80 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 shadow-2xs">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">SKU Code</p>
                  <p className="font-mono font-bold text-gray-900 truncate mt-0.5">{selectedProduct.sku}</p>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 shadow-2xs">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Barcode</p>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className="font-mono font-bold text-indigo-900 truncate">{selectedProduct.barcode || selectedProduct.sku}</p>
                    {selectedProduct.barcode && !selectedProduct.barcode.startsWith("BAR-") ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0">Shopify</span>
                    ) : (
                      <span className="bg-slate-200 text-slate-700 text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0">ERP</span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 shadow-2xs">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Color & Size</p>
                  <p className="font-semibold text-gray-900 truncate mt-0.5">
                    {selectedProduct.color || "Default"} <span className="text-gray-300">•</span> <span className="font-extrabold text-indigo-600">{selectedProduct.size || "Std"}</span>
                  </p>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 shadow-2xs">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Target Group</p>
                  <p className="font-medium text-gray-800 truncate mt-0.5">
                    {selectedProduct.targetGroup || "General"} {selectedProduct.ageRange ? `(${selectedProduct.ageRange})` : ""}
                  </p>
                </div>
              </div>

              {selectedProduct.shopifyVariantId && (
                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1 border-t border-slate-200/50">
                  <span>Shopify Variant ID: {selectedProduct.shopifyVariantId}</span>
                  <span>Internal ID: {selectedProduct.id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Config options */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" /> Configure Code Properties
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Type Selection */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Code Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCodeType("QR")}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        codeType === "QR" 
                          ? "bg-indigo-600 text-white border-indigo-600" 
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      QR Code (2D)
                    </button>
                    <button
                      onClick={() => setCodeType("BARCODE")}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        codeType === "BARCODE" 
                          ? "bg-indigo-600 text-white border-indigo-600" 
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      Barcode (1D)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Label Print Preset</label>
                  <select
                    value={tagPreset}
                    onChange={(e) => handlePresetChange(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none"
                  >
                    <option value="STANDARD">Standard Square (2" × 2" / 50×50 mm)</option>
                    <option value="COMPACT">Compact Square (1.5" × 1.5" / 38×38 mm)</option>
                    <option value="MICRO">Micro Sticker (1" × 1" / 25×25 mm)</option>
                    <option value="TAG_40X50">Retail Tag Portrait (40 × 50 mm / 1.57" × 1.97")</option>
                    <option value="TAG_50X40_LAND">Retail Tag Landscape (50 × 40 mm)</option>
                    <option value="TAG_40X50_HYBRID">Retail Tag Hybrid QR+Barcode (40 × 50 mm)</option>
                  </select>
                </div>

                {codeType === "QR" ? (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">QR Payload Target</label>
                    <select
                      value={qrPayloadType}
                      onChange={(e) => setQrPayloadType(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none"
                    >
                      <option value="SERIALIZED">Serialized QR Token (syn:wh:sku:serial)</option>
                      <option value="URL">Shopify URL Redirect</option>
                      <option value="SKU">SKU Raw Text</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Barcode Standard</label>
                    <select
                      value={barcodeFormat}
                      onChange={(e) => setBarcodeFormat(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none"
                    >
                      <option value="CODE128">CODE128 (Default)</option>
                      <option value="CODE39">CODE39</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Sizing options */}
              <div className="space-y-4">
                {codeType === "QR" ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                      <span>QR Size</span>
                      <span className="font-mono">{qrSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="160"
                      step="10"
                      value={qrSize}
                      onChange={(e) => setQrSize(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 appearance-none bg-gray-200 h-1 rounded"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-gray-700">
                        <span>Line Width</span>
                        <span className="font-mono">{width}px</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        value={width}
                        onChange={(e) => setWidth(parseInt(e.target.value))}
                        className="w-full accent-indigo-600 appearance-none bg-gray-200 h-1 rounded"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-gray-700">
                        <span>Height</span>
                        <span className="font-mono">{height}px</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="80"
                        value={height}
                        onChange={(e) => setHeight(parseInt(e.target.value))}
                        className="w-full accent-indigo-600 appearance-none bg-gray-200 h-1 rounded"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Additional toggles */}
              <div className="space-y-3 flex flex-col justify-center pl-4 border-l border-gray-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBrand}
                    onChange={(e) => setShowBrand(e.target.checked)}
                    className="rounded text-indigo-600 border-gray-300"
                  />
                  Print Brand Header
                </label>
                <input
                  type="text"
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  disabled={!showBrand}
                  placeholder="Enter brand name..."
                  className={`w-full border rounded-lg p-2 text-xs transition-colors focus:outline-none ${
                    showBrand 
                      ? "bg-white border-indigo-300 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs" 
                      : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                />
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={showVendor}
                    onChange={(e) => setShowVendor(e.target.checked)}
                    className="rounded text-indigo-600 border-gray-300"
                  />
                  Print Vendor Sub-line
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded text-indigo-600 border-gray-300"
                  />
                  Print Price Badge
                </label>
                {showPrice && (
                  <label className="flex items-center gap-2 text-[11px] font-medium text-gray-600 cursor-pointer pl-5 mt-1">
                    <input
                      type="checkbox"
                      checked={showCompareAtPrice}
                      onChange={(e) => setShowCompareAtPrice(e.target.checked)}
                      className="rounded text-indigo-600 border-gray-300"
                    />
                    Include Struck-through Compare-At / Original Price
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Explanation of Serialized QR token */}
          {qrPayloadType === "SERIALIZED" && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                <span>🔍</span> Structured Serialized QR Token Explanation
              </h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                When printing serialized tags, the QR payload is formatted as a structured token delimited by colons. 
                This enables instantaneous scanning and validation on check-in/check-out.
              </p>
              <div className="p-3 bg-white border rounded-lg space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-400">Token Format:</span>
                  <span className="font-bold text-indigo-700">company:warehouse:sku:serial</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">1. Company Slug:</span>
                  <span className="text-slate-800">syn</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">2. Warehouse:</span>
                  <span className="text-slate-800">{activeWhCode} (Active printed origin)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">3. SKU Code:</span>
                  <span className="text-slate-800">{selectedProduct.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">4. Serial:</span>
                  <span className="text-slate-800">0001 (Unique unit index)</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Tag Preview */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 h-full flex flex-col justify-between min-h-[350px]">
            <div className="space-y-0.5">
              <h2 className="font-bold text-gray-900 text-sm">Live Tag Preview</h2>
              <p className="text-xs text-gray-500">Real-time vector tag scaling.</p>
            </div>

            <div className="border border-dashed border-gray-200 rounded-lg p-6 bg-slate-50 flex items-center justify-center flex-1">
              <div className={`bg-white border border-gray-200 rounded shadow-md flex flex-col items-center justify-between font-mono relative transition-all ${
                tagPreset === "MICRO" ? "p-2 w-36 min-h-[90px]" :
                tagPreset === "COMPACT" ? "p-3 w-44 min-h-[115px]" :
                tagPreset === "TAG_40X50" || tagPreset === "TAG_40X50_HYBRID" ? "p-3 w-[151px] min-h-[189px]" :
                tagPreset === "TAG_50X40_LAND" ? "p-3 w-[189px] min-h-[151px]" :
                "p-4 w-52 min-h-[140px]"
              }`}>
                <div className="w-full space-y-1 text-left border-b border-gray-100 pb-1.5 mb-1">
                  {showBrand && customBrand && (
                    <p className="text-[9px] font-extrabold text-indigo-900 uppercase tracking-wider leading-none truncate">
                      {customBrand}
                    </p>
                  )}
                  <div className="flex items-start justify-between gap-1.5">
                    <h4 className="text-xs font-black text-gray-900 leading-tight line-clamp-2 flex-1">
                      {selectedProduct.name}
                    </h4>
                    <span className="bg-slate-900 text-white rounded font-extrabold text-xs px-1.5 py-0.5 min-w-[22px] text-center shrink-0 border border-black shadow-xs">
                      {selectedProduct.size || "STD"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[9.5px] font-bold text-gray-700 leading-none">
                    <span>Color: <b className="text-black">{selectedProduct.color || "Default"}</b></span>
                    {showVendor && (
                      <span className="truncate max-w-[105px]">Vendor: <b className="text-indigo-900">{selectedProduct.vendor || selectedProduct.brand || company?.name || "Seyon"}</b></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center my-2.5">
                  {codeType === "QR" ? (
                    <div className="relative flex flex-col items-center justify-center" style={{ width: qrSize, height: qrSize }}>
                      <QRCodeSVG 
                        value={getQrValue(selectedProduct)} 
                        size={256}
                        style={{ width: '100%', height: '100%' }}
                        level="H"
                        fgColor="#000000"
                        bgColor="#ffffff"
                        includeMargin={false}
                      />
                    </div>
                  ) : (
                    <svg ref={barcodeRef} className="max-w-full" />
                  )}
                </div>

                {codeType === "QR" && displayValue && (
                  <div className="mt-2 text-center w-full bg-slate-100 border border-slate-300 rounded py-1.5 px-2 shadow-sm">
                    <p className="text-[9px] text-slate-700 font-extrabold uppercase tracking-wide select-none mb-1">
                      Manual SKU Entry
                    </p>
                    <p className="text-xs text-black font-black tracking-wider break-all">
                      {selectedProduct.sku}
                    </p>
                  </div>
                )}

                {showPrice && (
                  <div className="border-t border-gray-300 w-full mt-2 pt-1.5 flex justify-between items-center text-xs font-black text-slate-950 tracking-wide">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase">MRP</span>
                    <div className="flex items-center gap-1.5">
                      {showCompareAtPrice && (
                        <span className="line-through text-gray-400 text-[11px] font-bold">
                          ₹{((selectedProduct.compareAtPrice && selectedProduct.compareAtPrice > selectedProduct.price) 
                            ? selectedProduct.compareAtPrice 
                            : Math.round(selectedProduct.price * 1.25)).toLocaleString("en-IN")}
                        </span>
                      )}
                      <span className="text-sm font-black text-slate-950">₹{selectedProduct.price.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] text-gray-400 flex flex-col gap-1 bg-gray-50 p-2.5 rounded-lg">
              <span className="flex items-center gap-1.5 font-semibold text-gray-500">
                <FileText className="w-3.5 h-3.5" /> Size is printed as a high-visibility bold badge for quick catalog identification.
              </span>
              <span className="text-gray-400 pl-5">
                Tip: If you need smaller QR labels (down to 60px), switch the target type to "SKU Raw Text" to reduce module density.
              </span>
            </div>

            {/* Copies & Columns selectors */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <span className="text-xs font-semibold text-slate-700">Copies:</span>
                <div className="flex items-center bg-white border border-slate-300 rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setPrintCopies(Math.max(1, printCopies - 1))}
                    className="px-2 py-1 text-xs text-slate-500 font-bold hover:bg-slate-100 rounded-l transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={printCopies}
                    onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 text-center text-xs font-bold text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPrintCopies(printCopies + 1)}
                    className="px-2 py-1 text-xs text-slate-500 font-bold hover:bg-slate-100 rounded-r transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <span className="text-xs font-semibold text-slate-700">Columns:</span>
                <div className="flex items-center bg-white border border-slate-300 rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setLayoutColumns(Math.max(1, layoutColumns - 1))}
                    className="px-2 py-1 text-xs text-slate-500 font-bold hover:bg-slate-100 rounded-l transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={layoutColumns}
                    onChange={(e) => setLayoutColumns(Math.min(6, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-12 text-center text-xs font-bold text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setLayoutColumns(Math.min(6, layoutColumns + 1))}
                    className="px-2 py-1 text-xs text-slate-500 font-bold hover:bg-slate-100 rounded-r transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Direct Print Button */}
            <button
              onClick={() => window.print()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm hover:shadow"
            >
              <Printer className="w-4 h-4" /> Print {printCopies} Label{printCopies > 1 ? 's' : ''} · {layoutColumns} Col{layoutColumns > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Print Queue */}
      <div className="relative no-print">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Print Queue
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">{printQueue.length} item(s)</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setQueueQuantity(Math.max(1, queueQuantity - 1))}
                className="px-2.5 py-1.5 text-xs text-gray-600 font-bold hover:bg-gray-100 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={queueQuantity}
                onChange={(e) => setQueueQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-10 text-center text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQueueQuantity(queueQuantity + 1)}
                className="px-2.5 py-1.5 text-xs text-gray-600 font-bold hover:bg-gray-100 transition-colors"
              >
                +
              </button>
            </div>
            <button
              onClick={addToQueue}
              className="flex-1 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add to Queue
            </button>
          </div>

          {printQueue.length === 0 ? (
            <div className="text-center py-6 text-gray-300 text-xs border border-dashed border-gray-200 rounded-lg bg-slate-50/50">
              <Layers className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              Queue is empty. Select variants above and add them here for batch printing.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {printQueue.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 border border-gray-150 rounded-lg p-2.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {item.variant.imageUrl ? (
                          <img src={item.variant.imageUrl} alt={item.variant.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 leading-snug">{item.variant.name}</p>
                        <p className="text-gray-400 font-mono text-[10px] mt-0.5">{item.variant.sku} · {item.preset} · ×{item.quantity}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromQueue(item.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-gray-150 flex gap-2">
                <button
                  onClick={() => setPrintQueue([])}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-lg flex-1 transition-colors"
                >
                  Clear Queue
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex-1 transition-colors flex items-center justify-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Batch
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printing Container (hidden on screen, visible during system printing) */}
      <div className="print-only-layout hidden" style={{ '--print-cols': layoutColumns } as React.CSSProperties}>
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-only-layout, .print-only-layout * {
              visibility: visible;
            }
            .print-only-layout {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              display: grid !important;
              grid-template-columns: repeat(var(--print-cols, 3), 1fr);
              gap: 10px;
              padding: 16px;
              justify-items: center;
            }
            .print-tag-copy {
              width: 100%;
              max-width: 200px;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .no-print {
              display: none !important;
            }
            @page {
              margin: 8mm;
            }
          }
        `}</style>

        {printQueue.length > 0 ? (
          printQueue.flatMap(item => 
            Array.from({ length: item.quantity }, (_, i) => (
              <div key={`${item.id}-${i}`} className="print-tag-copy" style={{ maxWidth: layoutColumns === 1 ? '200px' : undefined }}>
                <PrintTag 
                  variant={item.variant}
                  codeType={codeType}
                  barcodeFormat={barcodeFormat}
                  qrValue={getQrValue(item.variant)}
                  width={width}
                  height={height}
                  qrSize={qrSize}
                  displayValue={displayValue}
                  showPrice={showPrice}
                  showCompareAtPrice={showCompareAtPrice}
                  showBrand={showBrand}
                  showVendor={showVendor}
                  customBrand={customBrand}
                  tagPreset={item.preset}
                />
              </div>
            ))
          )
        ) : (
          Array.from({ length: printCopies }, (_, i) => (
            <div key={i} className="print-tag-copy" style={{ maxWidth: layoutColumns === 1 ? '200px' : undefined }}>
              <PrintTag 
                variant={selectedProduct}
                codeType={codeType}
                barcodeFormat={barcodeFormat}
                qrValue={getQrValue(selectedProduct)}
                width={width}
                height={height}
                qrSize={qrSize}
                displayValue={displayValue}
                showPrice={showPrice}
                showCompareAtPrice={showCompareAtPrice}
                showBrand={showBrand}
                showVendor={showVendor}
                customBrand={customBrand}
                tagPreset={tagPreset}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface PrintTagProps {
  variant: ProductVariant;
  codeType: "BARCODE" | "QR";
  barcodeFormat: "CODE128" | "CODE39";
  qrValue: string;
  width: number;
  height: number;
  qrSize: number;
  displayValue: boolean;
  showPrice: boolean;
  showCompareAtPrice?: boolean;
  showBrand: boolean;
  showVendor?: boolean;
  customBrand: string;
  tagPreset: TagPreset;
}

function PrintTag({
  variant,
  codeType,
  barcodeFormat,
  qrValue,
  width,
  height,
  qrSize,
  displayValue,
  showPrice,
  showCompareAtPrice,
  showBrand,
  showVendor,
  customBrand,
  tagPreset
}: PrintTagProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const printShowBrand = tagPreset === "MICRO" ? false : showBrand;
  const printShowPrice = (tagPreset === "MICRO" || tagPreset === "COMPACT") ? false : showPrice;
  const printDisplayValue = tagPreset === "MICRO" ? false : displayValue;
  const printQrSize = tagPreset === "MICRO" ? 60 : tagPreset === "COMPACT" ? 80 : (tagPreset === "TAG_40X50_HYBRID" ? 60 : qrSize);

  useEffect(() => {
    if ((codeType === "BARCODE" || tagPreset === "TAG_40X50_HYBRID") && canvasRef.current) {
      try {
        JsBarcode(canvasRef.current, variant.sku, {
          format: barcodeFormat,
          width: tagPreset === "TAG_40X50_HYBRID" ? 1 : width,
          height: tagPreset === "TAG_40X50_HYBRID" ? 32 : height,
          displayValue: false,
          margin: 4,
          background: "#ffffff",
          lineColor: "#000000"
        });
      } catch (e) {
        console.warn("Invalid SKU printed tag barcode generation", e);
      }
    }
  }, [variant, codeType, barcodeFormat, width, height, tagPreset]);

  const isLandscape = tagPreset === "TAG_50X40_LAND";

  return (
    <div className={`border border-gray-400 bg-white flex flex-col items-center justify-between font-mono w-full rounded break-inside-avoid relative transition-all ${
      tagPreset === "MICRO" ? "p-2 min-h-[90px]" :
      tagPreset === "COMPACT" ? "p-3 min-h-[115px]" :
      tagPreset === "TAG_40X50" || tagPreset === "TAG_40X50_HYBRID" ? "p-3 min-h-[175px] max-w-[155px]" :
      tagPreset === "TAG_50X40_LAND" ? "p-3 min-h-[140px] max-w-[195px]" :
      "p-4 min-h-[140px]"
    }`}>
      <div className="w-full space-y-1 text-left border-b border-gray-200 pb-1.5 mb-1">
        {printShowBrand && customBrand && (
          <p className="text-[9px] font-extrabold text-slate-900 uppercase tracking-wider leading-none truncate">
            {customBrand}
          </p>
        )}
        <div className="flex items-start justify-between gap-1.5">
          <h4 className="text-xs font-black text-slate-950 leading-tight line-clamp-2 flex-1">
            {variant.name}
          </h4>
          <span className="bg-slate-900 text-white rounded font-extrabold text-xs px-1.5 py-0.5 min-w-[22px] text-center shrink-0 border border-black shadow-xs">
            {variant.size || "STD"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 text-[9.5px] font-bold text-slate-800 leading-none">
          <span>Color: <b className="text-black">{variant.color || "Default"}</b></span>
          {showVendor && (
            <span className="truncate max-w-[105px]">Vendor: <b className="text-indigo-950">{variant.vendor || variant.brand || customBrand || "Seyon"}</b></span>
          )}
        </div>
      </div>
      
      {tagPreset === "TAG_40X50_HYBRID" ? (
        <div className="flex items-center justify-around w-full my-2 gap-1 border-y border-dashed border-gray-200 py-1.5">
          <div style={{ width: 52, height: 52 }}>
            <QRCodeSVG 
              value={qrValue} 
              size={256}
              style={{ width: '100%', height: '100%' }}
              level="M"
              fgColor="#000000"
              bgColor="#ffffff"
              includeMargin={false}
            />
          </div>
          <canvas ref={canvasRef} className="max-w-[80px]" />
        </div>
      ) : (
        <div className="flex items-center justify-center my-2.5">
          {codeType === "QR" ? (
            <div style={{ width: printQrSize - 16, height: printQrSize - 16 }}>
              <QRCodeSVG 
                value={qrValue} 
                size={256}
                style={{ width: '100%', height: '100%' }}
                level="H"
                fgColor="#000000"
                bgColor="#ffffff"
                includeMargin={false}
              />
            </div>
          ) : (
            <canvas ref={canvasRef} className="max-w-full" />
          )}
        </div>
      )}

      {printDisplayValue && (
        <div className="mt-1.5 text-center w-full bg-slate-100 border border-slate-350 rounded py-1 px-1.5">
          <p className="text-[8px] text-slate-800 font-extrabold uppercase tracking-wide mb-0.5">
            SKU Code
          </p>
          <p className="text-xs text-black font-black tracking-wider truncate">
            {variant.sku}
          </p>
        </div>
      )}

      {printShowPrice && (
        <div className="border-t border-gray-400 w-full mt-2 pt-1 flex justify-between items-center text-xs font-black text-black tracking-wide">
          <span className="text-[10px] text-gray-700 font-extrabold uppercase">MRP</span>
          <div className="flex items-center gap-1.5">
            {showCompareAtPrice && (
              <span className="line-through text-gray-500 text-[11px] font-bold">
                ₹{((variant.compareAtPrice && variant.compareAtPrice > variant.price) 
                  ? variant.compareAtPrice 
                  : Math.round(variant.price * 1.25)).toLocaleString("en-IN")}
              </span>
            )}
            <span className="text-sm font-black text-black">₹{variant.price.toLocaleString("en-IN")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
