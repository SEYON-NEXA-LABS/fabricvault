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
  QrCode
} from "lucide-react";


interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  shopifyVariantId: string;
  barcodeString?: string;
  barcode?: string;
  category?: string;
  targetGroup?: string;
  ageRange?: string;
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

  // Fetch product variants from API on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch("/api/inventory");
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: ProductVariant[] = data.map((v: any) => ({
            id: v.id,
            name: v.title,
            sku: v.sku,
            color: v.color || "",
            size: v.size || "",
            price: v.price || 1299,
            shopifyVariantId: v.shopifyVariantId || "",
            category: v.category || "",
            targetGroup: v.targetGroup || "",
            ageRange: v.ageRange || "",
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
  const [showBrand, setShowBrand] = useState<boolean>(true);
  const [customBrand, setCustomBrand] = useState<string>("");

  useEffect(() => {
    if (company?.name && !customBrand) {
      setCustomBrand(company.name);
    }
  }, [company]);

  const handlePresetChange = (preset: TagPreset) => {
    setTagPreset(preset);
    if (preset === "STANDARD") {
      setQrSize(100);
      setShowBrand(true);
      setShowPrice(true);
      setDisplayValue(true);
    } else if (preset === "COMPACT") {
      setQrSize(80);
      setShowBrand(true);
      setShowPrice(false);
      setDisplayValue(true);
    } else if (preset === "MICRO") {
      setQrSize(60);
      setShowBrand(false);
      setShowPrice(false);
      setDisplayValue(false);
    } else if (preset === "TAG_40X50") {
      setQrSize(90);
      setShowBrand(true);
      setShowPrice(true);
      setDisplayValue(true);
    } else if (preset === "TAG_50X40_LAND") {
      setQrSize(75);
      setShowBrand(true);
      setShowPrice(true);
      setDisplayValue(true);
    } else if (preset === "TAG_40X50_HYBRID") {
      setQrSize(70);
      setShowBrand(true);
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

            <div className="relative">
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
                <div className="absolute z-10 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProduct(p);
                        setShowProductDropdown(false);
                        setSearchQuery("");
                      }}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-gray-500 font-mono">SKU: {p.sku}</p>
                      </div>
                      <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono">
                        {p.color} / {p.size}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-center justify-between flex-wrap gap-4 text-xs">
              <div>
                <p className="text-gray-400 uppercase font-bold tracking-wider text-[9px]">Active Variant</p>
                <h3 className="font-bold text-gray-900 text-base">{selectedProduct.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-gray-500 font-mono">SKU: {selectedProduct.sku}</p>
                  <span className="text-gray-300">•</span>
                  <p className="text-indigo-900 font-mono font-bold">Barcode: {selectedProduct.barcode || selectedProduct.sku}</p>
                  {selectedProduct.barcode && !selectedProduct.barcode.startsWith("BAR-") ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Shopify Barcode</span>
                  ) : (
                    <span className="bg-slate-200 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">Internal ERP Barcode</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <span className="bg-white border border-gray-200 px-2.5 py-1 rounded font-semibold text-gray-700">Size: {selectedProduct.size}</span>
                <span className="bg-white border border-gray-200 px-2.5 py-1 rounded font-semibold text-gray-700">Color: {selectedProduct.color}</span>
                <span className="bg-white border border-gray-200 px-2.5 py-1 rounded font-bold text-indigo-700">₹{selectedProduct.price}</span>
              </div>
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
                {showBrand && (
                  <input
                    type="text"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded p-1 text-xs focus:outline-none"
                    placeholder="Brand label"
                  />
                )}
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded text-indigo-600 border-gray-300"
                  />
                  Print Price Badge
                </label>
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
                {/* High-visibility size block at top-right */}
                <div className={`absolute bg-slate-900 text-white rounded font-extrabold flex items-center justify-center border border-black shadow-sm ${
                  tagPreset === "MICRO" 
                    ? "top-1.5 right-1.5 px-1.5 py-0.5 text-sm min-w-[24px] h-[24px]" 
                    : "top-2 right-2 px-2 py-0.5 text-base min-w-[30px] h-[30px]"
                }`}>
                  {selectedProduct.size}
                </div>

                <div className={`w-full text-left ${tagPreset === "MICRO" ? "pr-8" : "pr-12"}`}>
                  {showBrand && (
                    <p className="text-[10px] font-bold text-gray-900 tracking-wider mb-0.5 uppercase">
                      {customBrand}
                    </p>
                  )}
                  <p className="text-[9px] text-gray-900 font-bold leading-none truncate w-full mb-1">
                    {selectedProduct.name}
                  </p>
                  <p className="text-[8px] text-gray-500 leading-none truncate w-full">
                    Color: {selectedProduct.color} {selectedProduct.targetGroup ? `| Age: ${selectedProduct.targetGroup}${selectedProduct.ageRange ? ` (${selectedProduct.ageRange})` : ""}` : ""}
                  </p>
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
                  <div className="border-t border-gray-200 w-full mt-2 pt-1.5 flex justify-between text-[9px] text-gray-900 font-bold">
                    <span>MRP</span>
                    <span className="text-indigo-950">₹{selectedProduct.price}</span>
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
                    <div>
                      <p className="font-semibold text-gray-700 leading-snug">{item.variant.name}</p>
                      <p className="text-gray-400 font-mono text-[10px] mt-0.5">{item.variant.sku} · {item.preset} · ×{item.quantity}</p>
                    </div>
                    <button 
                      onClick={() => removeFromQueue(item.id)}
                      className="text-gray-450 hover:text-red-650 transition-colors"
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
                  showBrand={showBrand}
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
                showBrand={showBrand}
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
  showBrand: boolean;
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
  showBrand,
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
      {/* High-visibility size block at top-right */}
      <div className={`absolute bg-slate-900 text-white rounded font-extrabold flex items-center justify-center border border-black shadow-sm ${
        tagPreset === "MICRO" 
          ? "top-1.5 right-1.5 px-1.5 py-0.5 text-sm min-w-[24px] h-[24px]" 
          : "top-2 right-2 px-2 py-0.5 text-base min-w-[30px] h-[30px]"
      }`}>
        {variant.size}
      </div>

      <div className={`w-full text-left ${tagPreset === "MICRO" ? "pr-8" : "pr-10"}`}>
        {printShowBrand && (
          <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-0.5">
            {customBrand}
          </p>
        )}
        <p className="text-[9px] text-slate-900 font-bold leading-none truncate w-full mb-1">
          {variant.name}
        </p>
        {tagPreset !== "MICRO" && (
          <p className="text-[8px] text-slate-500 leading-none truncate w-full">
            Color: {variant.color} {variant.targetGroup ? `| Age: ${variant.targetGroup}` : ""}
          </p>
        )}
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
        <div className="border-t border-gray-200 w-full mt-1.5 pt-1 flex justify-between text-[9px] text-slate-900 font-bold">
          <span>MRP</span>
          <span>₹{variant.price}</span>
        </div>
      )}
    </div>
  );
}
