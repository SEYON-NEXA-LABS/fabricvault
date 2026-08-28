"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  AlertTriangle,
  ChevronRight,
  SlidersHorizontal,
  X,
  Plus,
  Minus,
  Check,
  Edit2,
  Barcode,
  RefreshCw,
  MapPin,
  Upload,
  FileDown,
  Zap,
  CheckCircle2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ProductThumbnail from "@/components/ProductThumbnail";
import { compressImageBeforeUpload } from "@/utils/imageCompressor";
import { ProductInventory, Warehouse } from "@/types/all";

export default function StockInventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSize, setSelectedSize] = useState<string>("All");
  const [selectedColor, setSelectedColor] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTargetGroup, setSelectedTargetGroup] = useState<string>("All");
  const [selectedProduct, setSelectedProduct] = useState<ProductInventory | null>(null);
  
  // Dynamic API states
  const [rawVariants, setRawVariants] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Stock Quick Edit states
  const [editVariantSku, setEditVariantSku] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [savingStock, setSavingStock] = useState(false);
  const [syncingVariantId, setSyncingVariantId] = useState<string | null>(null);

  // Manual Add/Edit Product Form states
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalMode, setProductModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [savingProduct, setSavingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    title: "",
    baseSku: "",
    category: "Top",
    targetGroup: "Adults",
    ageRange: "",
    safetyStockLimit: 5,
    imageUrl: "",
    price: 19.99,
    warehouseId: ""
  });
  const [productVariants, setProductVariants] = useState<any[]>([]);

  // Price Edit states
  const [editPriceSku, setEditPriceSku] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [savingPrice, setSavingPrice] = useState(false);

  // Bulk Matrix Edit states
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [matrixAdjustments, setMatrixAdjustments] = useState<{ [variantId: string]: number }>({});
  const [savingMatrix, setSavingMatrix] = useState(false);

  // CSV Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState("");

  // AI Copywriter Modal states
  const [showAiCopyModal, setShowAiCopyModal] = useState(false);
  const [aiProductTitle, setAiProductTitle] = useState("");
  const [aiCategory, setAiCategory] = useState("Apparel");
  const [aiBrand, setAiBrand] = useState("Seyon");
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);

  const handleGenerateAiCopy = async () => {
    if (!aiProductTitle) {
      toast.error("Please enter a product title!");
      return;
    }
    setGeneratingAi(true);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PRODUCT_COPY",
          title: aiProductTitle,
          category: aiCategory,
          brand: aiBrand
        })
      });
      const data = await res.json();
      setAiResults(data);
      toast.success("✨ AI Product Copy & SEO Meta generated!");
    } catch (err) {
      toast.error("Failed to generate AI copy");
    } finally {
      setGeneratingAi(false);
    }
  };

  const [savingSeo, setSavingSeo] = useState(false);

  const handleSaveSeoToProduct = async () => {
    if (!aiResults || !products[0]?.variants[0]?.id) {
      toast.error("No product variant selected to save SEO tags.");
      return;
    }
    setSavingSeo(true);
    try {
      const res = await fetch("/api/products/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: products[0].variants[0].id,
          metaTitle: aiResults.seoTitle,
          metaDescription: aiResults.metaDescription,
          description: aiResults.productStory,
          instagramCaption: aiResults.instagramCaption
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("✨ Successfully saved SEO Meta Tags & Product Story to Database!");
        setShowAiCopyModal(false);
      } else {
        toast.error(data.error || "Failed to save SEO fields to database.");
      }
    } catch (err) {
      toast.error("Failed to connect to SEO update API.");
    } finally {
      setSavingSeo(false);
    }
  };

  const handleOpenMatrixModal = () => {
    if (!selectedProduct) return;
    const initialAdjs: { [variantId: string]: number } = {};
    selectedProduct.variants.forEach(v => {
      initialAdjs[v.id] = v.qty;
    });
    setMatrixAdjustments(initialAdjs);
    setShowMatrixModal(true);
  };

  // CSV / JSON Import Logic
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const isJson = file.name.endsWith(".json");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        let parsed: any[] = [];
        try {
          if (isJson) {
            const rawJson = JSON.parse(text);
            parsed = Array.isArray(rawJson) ? rawJson : (rawJson.products || rawJson.items || []);
          } else {
            parsed = parseCSV(text);
          }
        } catch (err) {
          toast.error("Failed to parse file structure. Please ensure valid CSV or JSON format.");
          return;
        }

        if (parsed.length === 0) {
          toast.error("File is empty or contains no product rows.");
          return;
        }

        setParsedRows(parsed);
        toast.success(`Loaded ${parsed.length} product rows from ${file.name}. Review preview below!`);
      }
    };
    reader.readAsText(file);
  };

  const handleImportCSV = async () => {
    if (parsedRows.length === 0) {
      toast.error("No valid product data to import!");
      return;
    }

    let activeCompanyId = "";
    if (typeof window !== "undefined") {
      const storedCo = localStorage.getItem("seyon:company");
      if (storedCo) {
        try {
          const parsedCo = JSON.parse(storedCo);
          activeCompanyId = parsedCo.id || "";
        } catch (e) {
          // ignore
        }
      }
    }

    if (!activeCompanyId) {
      toast.error("Company context missing. Please refresh.");
      return;
    }

    setImporting(true);
    try {
      const targetWarehouseId = selectedWarehouseId === "All" ? warehouses[0]?.id : selectedWarehouseId;
      const res = await fetch("/api/products/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: activeCompanyId,
          warehouseId: targetWarehouseId,
          products: parsedRows
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Bulk import failed");
      }

      toast.success(`Successfully imported ${data.summary.variantsSaved} product variants across ${data.summary.productsProcessed} styles!`);
      setShowImportModal(false);
      setParsedRows([]);
      setImportFileName("");
      
      // Refresh inventory catalog view
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to process bulk import");
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleTemplate = (type: "csv" | "json") => {
    if (type === "csv") {
      const csvContent = `title,sku,price,color,size,stock,brand,description\nHandloom Cotton Saree,HCS-BLK-M,2499,Black,M,50,Seyon Handlooms,100% Pure Organic Handloom Linen Saree\nHandloom Cotton Saree,HCS-BLK-L,2499,Black,L,35,Seyon Handlooms,100% Pure Organic Handloom Linen Saree\nClassic Linen Shirt,CLS-WHT-XL,1899,White,XL,40,Wolf Cabin,Premium Linen Casual Shirt`;
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merchantvault_bulk_import_template.csv";
      a.click();
    } else {
      const jsonContent = JSON.stringify([
        {
          title: "Handloom Cotton Saree",
          sku: "HCS-BLK-M",
          price: 2499,
          color: "Black",
          size: "M",
          stock: 50,
          brand: "Seyon Handlooms",
          description: "100% Pure Organic Handloom Linen Saree"
        },
        {
          title: "Classic Linen Shirt",
          sku: "CLS-WHT-XL",
          price: 1899,
          color: "White",
          size: "XL",
          stock: 40,
          brand: "Wolf Cabin",
          description: "Premium Linen Casual Shirt"
        }
      ], null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merchantvault_bulk_import_template.json";
      a.click();
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    // Parse headers, strip extra whitespace and quotes
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const result: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Simple parser handling commas inside quotes
      const values: string[] = [];
      let currentVal = "";
      let inQuotes = false;
      
      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentVal.trim().replace(/^"|"$/g, ""));
          currentVal = "";
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim().replace(/^"|"$/g, ""));

      if (values.length < headers.length) continue;
      
      const obj: any = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = values[j];
      }
      result.push(obj);
    }
    return result;
  };

  const downloadCSVTemplate = () => {
    const headers = ["Title", "SKU", "Size", "Color", "Price", "Category", "TargetGroup", "AgeRange", "SafetyStockLimit", "Barcode", "CurrentStock", "ImageUrl"];
    const rows = [
      ["SEYON Oversized T-Shirt", "TWCT001-BLK-M", "M", "Black", "1299", "Top", "Adults", "", "5", "TWCT001BLKM", "50", "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop"],
      ["SEYON Oversized T-Shirt", "TWCT001-BLK-L", "L", "Black", "1299", "Top", "Adults", "", "5", "TWCT001BLKL", "25", "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop"],
      ["SEYON Cargo Pants", "TWCP001-OLV-32", "32", "Olive", "1999", "Bottom", "Adults", "", "5", "TWCP001OLV32", "15", "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop"]
    ];
    
    const csvRows = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ];
    const csvContent = "\uFEFF" + csvRows.join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "seyon_product_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeImport = async () => {
    if (parsedRows.length === 0) {
      toast.error("No product variants found in file.");
      return;
    }

    setImporting(true);
    try {
      const targetWarehouseId = selectedWarehouseId === "All" ? warehouses[0]?.id : selectedWarehouseId;
      const res = await fetch("/api/inventory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: parsedRows,
          warehouseId: targetWarehouseId
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.errors && data.errors.length > 0) {
          toast.warning(`Import completed with errors:\n${data.errors.slice(0, 3).join("\n")}${data.errors.length > 3 ? "\n..." : ""}`, {
            duration: 6000
          });
        } else {
          toast.success(`Successfully imported/updated ${data.importedCount.variants} product variants.`);
        }
        setShowImportModal(false);
        setParsedRows([]);
        setImportFileName("");
        await loadData();
      } else {
        toast.error(data.error || "Failed to import products.");
      }
    } catch (err) {
      toast.error("Failed to connect to the import API endpoint.");
    } finally {
      setImporting(false);
    }
  };


  // Fetch all necessary data
  const loadData = async () => {
    setLoading(true);
    try {
      let whData = [];
      const cachedWhs = localStorage.getItem("seyon:warehouses");
      if (cachedWhs) {
        whData = JSON.parse(cachedWhs);
      } else {
        const whRes = await fetch("/api/warehouses");
        whData = await whRes.json();
        if (Array.isArray(whData)) {
          localStorage.setItem("seyon:warehouses", JSON.stringify(whData));
        }
      }

      const invRes = await fetch("/api/inventory");
      const invData = await invRes.json();

      if (Array.isArray(whData)) {
        setWarehouses(whData);
        // Default to default pickup warehouse if available, else "All"
        const defaultWh = whData.find((w: any) => w.isDefaultPickup);
        if (defaultWh) {
          setSelectedWarehouseId(defaultWh.id);
        }
      }

      if (Array.isArray(invData)) {
        setRawVariants(invData);
      }
    } catch (err) {
      toast.error("Failed to load inventory data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Process variants to grouped products list based on selectedWarehouseId
  useEffect(() => {
    if (rawVariants.length === 0) {
      setProducts([]);
      return;
    }

    const grouped: { [key: string]: ProductInventory } = {};

    rawVariants.forEach((v) => {
      // Grouping logic based on title & base SKU prefix
      const parts = v.sku.split("-");
      const baseSku = parts.slice(0, Math.max(1, parts.length - 2)).join("-");
      const productName = v.title;

      // Determine stock level based on selected warehouse context
      let qty = 0;
      if (selectedWarehouseId === "All") {
        qty = v.currentStockLevel; // aggregate sum
      } else {
        const whStock = v.stocks?.find((s: any) => s.warehouseId === selectedWarehouseId);
        qty = whStock ? whStock.currentStockLevel : 0;
      }

      if (!grouped[productName]) {
        grouped[productName] = {
          id: v.id,
          name: productName,
          baseSku: baseSku || v.sku,
          category: v.category || "Top",
          targetGroup: v.targetGroup || "Adults",
          ageRange: v.ageRange,
          totalQty: 0,
          threshold: v.safetyStockLimit || 10,
          skuColor: v.color,
          thumbnailConfig: v.thumbnailConfig,
          variants: []
        };
      }

      grouped[productName].variants.push({
        id: v.id,
        size: v.size,
        color: v.color,
        sku: v.sku,
        qty: qty,
        thumbnailConfig: v.thumbnailConfig,
        price: v.price || 0,
        stocks: v.stocks || [],
        shopifyVariantId: v.shopifyVariantId
      });
    });

    // Calculate totalQty sums for each product group
    const processed = Object.values(grouped).map((prod) => {
      const totalQty = prod.variants.reduce((sum, vr) => sum + vr.qty, 0);
      return { ...prod, totalQty };
    });

    setProducts(processed);

    // Keep selected product details pane in sync
    if (selectedProduct) {
      const updatedSelected = processed.find(p => p.name === selectedProduct.name);
      if (updatedSelected) {
        setSelectedProduct(updatedSelected);
      }
    }
  }, [rawVariants, selectedWarehouseId]);

  // Reset page on filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSize, selectedColor, selectedStatus, selectedCategory, selectedTargetGroup, selectedWarehouseId]);

  // Save modified variant stock to DB
  const saveVariantStock = async (variantId: string, sku: string) => {
    if (selectedWarehouseId === "All") {
      toast.error("Please select a specific warehouse facility to adjust stock levels.");
      return;
    }

    setSavingStock(true);
    try {
      const res = await fetch("/api/warehouses/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId: selectedWarehouseId,
          variantId,
          newStockLevel: editQty,
          operatorEmail: "admin@seyon.co"
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Updated stock for ${sku} to ${editQty} units.`);
        setEditVariantSku(null);
        // Refresh catalog list
        await loadData();
      } else {
        toast.error(data.error || "Failed to update stock.");
      }
    } catch (err) {
      toast.error("Failed to connect to stock update endpoint.");
    } finally {
      setSavingStock(false);
    }
  };

  // Push variant to Shopify storefront
  const handlePushToShopify = async (variantId: string, sku: string) => {
    setSyncingVariantId(variantId);
    try {
      const res = await fetch("/api/inventory/push-shopify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Successfully synced variant ${sku} with Shopify.`);
        await loadData();
      } else {
        toast.error(data.error || "Failed to sync variant with Shopify.");
      }
    } catch (err) {
      toast.error("Failed to connect to the Shopify sync endpoint.");
    } finally {
      setSyncingVariantId(null);
    }
  };

  const handleOpenAddProduct = () => {
    setProductModalMode("ADD");
    setProductForm({
      title: "",
      baseSku: "",
      category: "Top",
      targetGroup: "Adults",
      ageRange: "",
      safetyStockLimit: 5,
      imageUrl: "",
      price: 19.99,
      warehouseId: warehouses[0]?.id || ""
    });
    setProductVariants([
      { size: "S", color: "Black", sku: "", price: 19.99, barcode: "", initialStock: 10 },
      { size: "M", color: "Black", sku: "", price: 19.99, barcode: "", initialStock: 10 },
      { size: "L", color: "Black", sku: "", price: 19.99, barcode: "", initialStock: 10 }
    ]);
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: ProductInventory) => {
    setProductModalMode("EDIT");
    let imgUrl = "";
    if (prod.thumbnailConfig) {
      try {
        const parsed = JSON.parse(prod.thumbnailConfig);
        imgUrl = parsed.images ? parsed.images.join(", ") : (parsed.imageUrl || "");
      } catch (_) {}
    }

    setProductForm({
      title: prod.name,
      baseSku: prod.baseSku,
      category: prod.category,
      targetGroup: prod.targetGroup,
      ageRange: prod.ageRange || "",
      safetyStockLimit: prod.threshold,
      imageUrl: imgUrl,
      price: prod.variants[0]?.price || 0.0,
      warehouseId: warehouses[0]?.id || ""
    });
    setProductVariants([]);
    setShowProductModal(true);
  };

  const handleBaseSkuChange = (newBaseSku: string) => {
    setProductForm(prev => ({ ...prev, baseSku: newBaseSku }));
    setProductVariants(prev => prev.map(v => {
      const sizePart = v.size ? v.size.toUpperCase() : "M";
      const colorPart = v.color ? v.color.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() : "BLK";
      const basePart = newBaseSku.trim().toUpperCase();
      return {
        ...v,
        sku: basePart ? `${basePart}-${colorPart}-${sizePart}` : ""
      };
    }));
  };

  const updateVariantValue = (index: number, key: string, value: any) => {
    setProductVariants(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };

      if (key === "size" || key === "color") {
        const sizePart = copy[index].size ? copy[index].size.toUpperCase() : "M";
        const colorPart = copy[index].color ? copy[index].color.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() : "BLK";
        const basePart = productForm.baseSku ? productForm.baseSku.trim().toUpperCase() : "SKU";
        copy[index].sku = `${basePart}-${colorPart}-${sizePart}`;
      }

      return copy;
    });
  };

  const handleAddVariantRow = () => {
    const defaultColor = productVariants[productVariants.length - 1]?.color || "Black";
    const sizeOptions = ["S", "M", "L", "XL", "XXL"];
    const lastSizeIndex = sizeOptions.indexOf(productVariants[productVariants.length - 1]?.size || "S");
    const defaultSize = sizeOptions[(lastSizeIndex + 1) % sizeOptions.length];

    const sizePart = defaultSize.toUpperCase();
    const colorPart = defaultColor.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
    const basePart = productForm.baseSku ? productForm.baseSku.trim().toUpperCase() : "SKU";
    const generatedSku = basePart ? `${basePart}-${colorPart}-${sizePart}` : "";

    setProductVariants(prev => [
      ...prev,
      {
        size: defaultSize,
        color: defaultColor,
        sku: generatedSku,
        price: productForm.price || 19.99,
        barcode: "",
        initialStock: 10
      }
    ]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setProductVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title || !productForm.baseSku) {
      toast.error("Product Title and Base SKU are required.");
      return;
    }

    setSavingProduct(true);
    try {
      if (productModalMode === "ADD") {
        if (productVariants.length === 0) {
          toast.error("Please add at least one product variant.");
          setSavingProduct(false);
          return;
        }

        const invalidVariant = productVariants.some(v => !v.sku || !v.size || !v.color);
        if (invalidVariant) {
          toast.error("All variants must have a valid SKU, Size, and Color.");
          setSavingProduct(false);
          return;
        }

        const res = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: productForm.title,
            baseSku: productForm.baseSku,
            category: productForm.category,
            targetGroup: productForm.targetGroup,
            ageRange: productForm.ageRange || null,
            safetyStockLimit: productForm.safetyStockLimit,
            imageUrl: productForm.imageUrl,
            warehouseId: productForm.warehouseId,
            variants: productVariants
          })
        });

        const data = await res.json();
        if (data.success) {
          toast.success(`Successfully created product "${productForm.title}" with ${data.variants?.length} variants.`);
          setShowProductModal(false);
          await loadData();
        } else {
          toast.error(data.error || "Failed to create product.");
        }
      } else {
        const res = await fetch("/api/inventory", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldTitle: selectedProduct?.name,
            title: productForm.title,
            category: productForm.category,
            targetGroup: productForm.targetGroup,
            ageRange: productForm.ageRange || null,
            safetyStockLimit: productForm.safetyStockLimit,
            imageUrl: productForm.imageUrl,
            variantsToAdd: productVariants.map(v => ({ ...v, warehouseId: productForm.warehouseId }))
          })
        });

        const data = await res.json();
        if (data.success) {
          toast.success(`Successfully updated product "${productForm.title}".`);
          setShowProductModal(false);
          await loadData();
        } else {
          toast.error(data.error || "Failed to update product.");
        }
      }
    } catch (err) {
      toast.error("Failed to connect to the product API endpoint.");
    } finally {
      setSavingProduct(false);
    }
  };

  // Save modified variant price to DB
  const saveVariantPrice = async (variantId: string, sku: string) => {
    setSavingPrice(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          price: editPrice
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Updated price for ${sku} to $${editPrice.toFixed(2)}.`);
        setEditPriceSku(null);
        // Refresh catalog list
        await loadData();
      } else {
        toast.error(data.error || "Failed to update price.");
      }
    } finally {
      setSavingPrice(false);
    }
  };

  // Save bulk matrix stock adjustments to DB
  const handleSaveMatrix = async () => {
    if (selectedWarehouseId === "All") {
      toast.error("Please select a specific warehouse facility to adjust stock levels.");
      return;
    }

    setSavingMatrix(true);
    try {
      const payloadItems = Object.entries(matrixAdjustments).map(([variantId, newStockLevel]) => ({
        variantId,
        newStockLevel
      }));

      const res = await fetch("/api/warehouses/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId: selectedWarehouseId,
          operatorEmail: "admin@seyon.co",
          items: payloadItems
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Bulk matrix stock adjustments saved successfully.");
        setShowMatrixModal(false);
        await loadData();
      } else {
        toast.error(data.error || "Failed to save adjustments.");
      }
    } catch (err) {
      toast.error("Failed to connect to adjustments API.");
    } finally {
      setSavingMatrix(false);
    }
  };

  // Filtering Logic
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = 
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.baseSku.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesSize = selectedSize === "All" || prod.variants.some(v => v.size === selectedSize);
    const matchesColor = selectedColor === "All" || prod.variants.some(v => v.color.toLowerCase().includes(selectedColor.toLowerCase()));
    
    const isLowStock = prod.totalQty <= prod.threshold;
    const isOutOfStock = prod.totalQty === 0;
    
    const matchesStatus = 
      selectedStatus === "All" ||
      (selectedStatus === "Low Stock" && isLowStock && !isOutOfStock) ||
      (selectedStatus === "Out of Stock" && isOutOfStock) ||
      (selectedStatus === "Healthy" && !isLowStock);

    const matchesCategory = 
      selectedCategory === "All" ||
      prod.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesTargetGroup = 
      selectedTargetGroup === "All" ||
      prod.targetGroup.toLowerCase() === selectedTargetGroup.toLowerCase();

    return matchesSearch && matchesSize && matchesColor && matchesStatus && matchesCategory && matchesTargetGroup;
  });

  const lowStockCount = products.filter(p => p.totalQty <= p.threshold).length;
  const totalStockUnits = products.reduce((sum, p) => sum + p.totalQty, 0);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-950" /> Multi-Warehouse Stock Catalog
          </h1>
          <p className="text-sm text-gray-500">
            Real-time tracking of shelf inventory across all store locations, warehouse facilities, and default fulfillment points.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenAddProduct}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer font-bold"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
          <button 
            onClick={() => {
              setAiProductTitle(products[0]?.name || "Handloom Cotton Saree");
              setAiCategory(products[0]?.category || "Apparel");
              setShowAiCopyModal(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-300" /> AI Copywriter
          </button>
          <button 
            onClick={() => {
              const confirmOpen = window.confirm("WARNING: Bulk CSV imports are critical catalog updates and must be done under supervisor supervision. Do you want to proceed?");
              if (confirmOpen) {
                setShowImportModal(true);
              }
            }}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-indigo-950 border border-gray-250 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button 
            onClick={loadData}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh Stock
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Catalog SKUs</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {products.reduce((acc, p) => acc + p.variants.length, 0)} Variants
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Low Stock Products</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900">{lowStockCount} Products</span>
              {lowStockCount > 0 && (
                <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">Alert active</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Stock Quantity</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalStockUnits.toLocaleString()} units</p>
          </div>
        </div>
      </div>

      {/* Main Stock Workspace */}
      {/* Main Inventory Layout - Full Width Table */}
      <div className="w-full">
        {/* Inventory Catalog List */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          
          {/* Warehouse Selector & Filters Bar */}
          <div className="p-5 border-b border-gray-100 space-y-4 bg-slate-50/30">
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Warehouse Context:</span>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Warehouses (Aggregate Sum)</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Product Name or Base SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label htmlFor="category-filter" className="sr-only">Filter Category</label>
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Top">Tops</option>
                  <option value="Bottom">Bottoms</option>
                  <option value="Set">Sets</option>
                </select>
              </div>

              <div>
                <label htmlFor="demographic-filter" className="sr-only">Filter Age Group</label>
                <select
                  id="demographic-filter"
                  value={selectedTargetGroup}
                  onChange={(e) => setSelectedTargetGroup(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Age Groups</option>
                  <option value="Newborn">Newborn (0-12M)</option>
                  <option value="Infants">Infants (1-3Y)</option>
                  <option value="Kids">Kids (4-12Y)</option>
                  <option value="Teens">Teens (13-19Y)</option>
                  <option value="Adults">Adults (20Y+)</option>
                </select>
              </div>

              <div>
                <label htmlFor="size-filter" className="sr-only">Filter Size</label>
                <select
                  id="size-filter"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Sizes</option>
                  <option value="S">Size S</option>
                  <option value="M">Size M</option>
                  <option value="L">Size L</option>
                  <option value="XL">Size XL</option>
                  <option value="XXL">Size XXL</option>
                </select>
              </div>

              <div>
                <label htmlFor="color-filter" className="sr-only">Filter Color</label>
                <select
                  id="color-filter"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Colors</option>
                  <option value="White">White</option>
                  <option value="Black">Black</option>
                  <option value="Blue">Blue</option>
                  <option value="Beige">Beige</option>
                  <option value="Indigo">Indigo</option>
                  <option value="Green">Green</option>
                </select>
              </div>

              <div>
                <label htmlFor="status-filter" className="sr-only">Filter Status</label>
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Healthy">Healthy Stock</option>
                  <option value="Low Stock">Low Stock Alerts</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Catalog Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-xs">Loading shelf inventories...</p>
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-xs">No catalog matches found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-medium text-xs uppercase tracking-wider">
                    <TableHead className="py-3 px-5 text-gray-500">Product Details</TableHead>
                    <TableHead className="py-3 px-5 text-gray-500">Base SKU</TableHead>
                    <TableHead className="py-3 px-5 text-center text-gray-500">Variants Count</TableHead>
                    <TableHead className="py-3 px-5 text-gray-500">Total Qty</TableHead>
                    <TableHead className="py-3 px-5 text-gray-500">Status</TableHead>
                    <TableHead className="py-3 px-5 text-right text-gray-500">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {paginatedProducts.map((prod) => {
                    const isLow = prod.totalQty <= prod.threshold;
                    return (
                      <TableRow 
                        key={prod.id} 
                        onClick={() => setSelectedProduct(prod)}
                        className={`hover:bg-slate-50/60 cursor-pointer transition-colors border-b border-gray-100 ${
                          selectedProduct?.id === prod.id ? "bg-indigo-50/40 hover:bg-indigo-50/40" : ""
                        }`}
                      >
                        <TableCell className="py-3.5 px-5 flex items-center gap-3">
                          <ProductThumbnail
                            skuTitle={prod.name}
                            skuColor={prod.skuColor || "indigo"}
                            thumbnailConfig={prod.thumbnailConfig}
                            size="sm"
                            className="border border-gray-100"
                          />
                          <div>
                            <p className="font-semibold text-gray-900 leading-snug">{prod.name}</p>
                            <p className="text-[11px] text-gray-400">{prod.category}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-5 font-mono text-xs text-gray-500">{prod.baseSku}</TableCell>
                        <TableCell className="py-3.5 px-5 text-center text-gray-700">{prod.variants.length} SKU codes</TableCell>
                        <TableCell className="py-3.5 px-5">
                          <span className="font-bold text-gray-900">{prod.totalQty}</span>
                          <span className="text-gray-400 text-xs font-normal"> / {prod.threshold} limit</span>
                        </TableCell>
                        <TableCell className="py-3.5 px-5">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            prod.totalQty === 0 ? "bg-red-50 text-red-700" :
                            isLow ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {prod.totalQty === 0 ? "Out of Stock" :
                             isLow ? "Low Stock" : "Healthy"}
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="outline"
                            size="icon-sm"
                            onClick={() => setSelectedProduct(prod)}
                            className="text-slate-700 hover:text-indigo-600 border-slate-200 hover:border-indigo-300 rounded-lg transition-colors cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
          
          {/* Pagination Footer */}
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row gap-4 sm:items-center justify-between text-xs text-gray-500 bg-gray-50/50">
            <div className="flex items-center gap-4">
              <span>
                Showing {filteredProducts.length === 0 ? 0 : startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of{" "}
                {filteredProducts.length} entries
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={3}>3</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            
            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={`cursor-pointer ${currentPage === 1 ? "pointer-events-none opacity-50" : ""}`} 
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pg = i + 1;
                  return (
                    <PaginationItem key={pg}>
                      <PaginationLink 
                        isActive={currentPage === pg} 
                        onClick={() => setCurrentPage(pg)}
                        className="cursor-pointer"
                      >
                        {pg}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={`cursor-pointer ${currentPage === totalPages || totalPages === 0 ? "pointer-events-none opacity-50" : ""}`} 
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>

      </div>

      {/* Selected Product Detail Panel as Modal Overlay */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Product Card Info */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div className="space-y-1 pr-2">
                  <h3 className="font-bold text-gray-950 text-base">{selectedProduct.name}</h3>
                  <p className="text-xs text-gray-400">Category: {selectedProduct.category} | Age Group: {selectedProduct.targetGroup}{selectedProduct.ageRange ? ` (${selectedProduct.ageRange})` : ""} | SKU: {selectedProduct.baseSku} | Limit: {selectedProduct.threshold}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleOpenEditProduct(selectedProduct)}
                    className="text-gray-500 hover:text-indigo-950 p-1.5 rounded-lg hover:bg-gray-100 border border-gray-200 bg-white transition-colors cursor-pointer"
                    title="Edit Product Details & Meta"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="text-gray-450 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Status Warning Banner */}
              {selectedProduct.totalQty <= selectedProduct.threshold && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Low Stock Alert:</span> Level is below the minimum threshold ({selectedProduct.threshold} units). Propose replenishing stock counts.
                  </div>
                </div>
              )}

              {/* Size-wise & Color-wise breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">SKU Code & Size Breakdown</h4>
                  {selectedWarehouseId === "All" ? (
                    <span className="text-[10px] text-amber-700 bg-amber-50 font-semibold px-2 py-0.5 rounded">
                      Read Only (Select WH to Edit)
                    </span>
                  ) : (
                    <button
                      onClick={handleOpenMatrixModal}
                      className="text-[10px] text-indigo-750 bg-indigo-50 hover:bg-indigo-100 font-bold px-2 py-1 rounded transition-all cursor-pointer"
                    >
                      Matrix Multi-Edit
                    </button>
                  )}
                </div>

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                  {selectedProduct.variants.map((variant) => {
                    const isEditing = editVariantSku === variant.sku;
                    return (
                      <div key={variant.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors text-xs">
                        <div className="flex items-center gap-3">
                          <ProductThumbnail 
                            thumbnailConfig={variant.thumbnailConfig || selectedProduct.thumbnailConfig} 
                            skuTitle={`${selectedProduct.name} - ${variant.size}`}
                            skuColor={selectedProduct.skuColor}
                            size="sm"
                          />
                          <div>
                            <span className="font-mono text-[11px] font-medium text-gray-700 block">{variant.sku}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-gray-400">Size: <strong className="text-gray-700 font-semibold">{variant.size}</strong></span>
                              <span className="text-gray-300">•</span>
                              <span className="text-gray-400">Color: <strong className="text-gray-700 font-semibold">{variant.color}</strong></span>
                              <span className="text-gray-300">•</span>
                              {editPriceSku === variant.sku ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-400">₹</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                                    className="w-16 text-center py-0.5 border border-gray-300 rounded text-xs bg-white"
                                  />
                                  <button
                                    onClick={() => saveVariantPrice(variant.id, variant.sku)}
                                    disabled={savingPrice}
                                    className="p-0.5 text-emerald-600 hover:text-emerald-700"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditPriceSku(null)}
                                    className="p-0.5 text-gray-400 hover:text-gray-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span 
                                  className="text-indigo-600 font-medium cursor-pointer hover:underline"
                                  onClick={() => {
                                    setEditPriceSku(variant.sku);
                                    setEditPrice(variant.price);
                                  }}
                                  title="Click to edit price"
                                >
                                  ₹{variant.price}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePushToShopify(variant.id, variant.sku)}
                            disabled={syncingVariantId === variant.id}
                            className="text-[10px] text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 border border-gray-200 rounded px-2 py-1 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Sync single variant to Shopify Storefront"
                          >
                            {syncingVariantId === variant.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                            ) : (
                              <Zap className="w-3 h-3 text-amber-500" />
                            )}
                            Sync
                          </button>

                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => setEditQty(Math.max(0, editQty - 1))}
                                className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-100"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                value={editQty}
                                onChange={(e) => setEditQty(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-12 text-center py-1 border border-gray-200 rounded bg-white focus:outline-none"
                              />
                              <button 
                                onClick={() => setEditQty(editQty + 1)}
                                className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-100"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => saveVariantStock(variant.id, variant.sku)}
                                disabled={savingStock}
                                className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                title="Save"
                              >
                                {savingStock ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className={`font-bold text-sm ${variant.qty <= 15 ? "text-amber-600" : "text-gray-900"}`}>
                                {variant.qty} <span className="text-[10px] text-gray-400 font-normal">units</span>
                              </span>
                              {selectedWarehouseId !== "All" && (
                                <button 
                                  onClick={() => {
                                    setEditVariantSku(variant.sku);
                                    setEditQty(variant.qty);
                                  }}
                                  className="text-gray-400 hover:text-indigo-950 p-1"
                                  title="Quick Adjust Stock"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BULK STOCK MATRIX ADJUSTMENT MODAL */}
      {showMatrixModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 bg-slate-50/80 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <span>📊</span> Style Matrix Adjustment: {selectedProduct.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Adjust quantities for all sizes and colors in warehouse: <strong className="text-indigo-600">{warehouses.find(w => w.id === selectedWarehouseId)?.name}</strong>
                </p>
              </div>
              <button 
                onClick={() => setShowMatrixModal(false)}
                className="p-1 h-7 w-7 text-gray-400 hover:text-gray-900 border border-gray-200 hover:bg-gray-100 rounded-full flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-gray-655 font-bold">
                      <th className="p-3">Color / Size</th>
                      <th className="p-3 text-center">S</th>
                      <th className="p-3 text-center">M</th>
                      <th className="p-3 text-center">L</th>
                      <th className="p-3 text-center">XL</th>
                      <th className="p-3 text-center">XXL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Array.from(new Set(selectedProduct.variants.map(v => v.color))).map(color => (
                      <tr key={color} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-gray-700">{color}</td>
                        {["S", "M", "L", "XL", "XXL"].map(size => {
                          const matchingVar = selectedProduct.variants.find(v => v.color === color && v.size === size);
                          if (!matchingVar) {
                            return (
                              <td key={size} className="p-3 text-center text-gray-300 font-mono">
                                --
                              </td>
                            );
                          }
                          return (
                            <td key={size} className="p-2 text-center">
                              <input
                                type="number"
                                min="0"
                                value={matrixAdjustments[matchingVar.id] ?? 0}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value) || 0);
                                  setMatrixAdjustments(prev => ({
                                    ...prev,
                                    [matchingVar.id]: val
                                  }));
                                }}
                                className="w-20 bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="px-4 py-2 bg-white border border-gray-255 hover:bg-gray-100 rounded-lg font-semibold text-gray-700 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMatrix}
                disabled={savingMatrix}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {savingMatrix && <RefreshCw className="w-3 h-3 animate-spin" />}
                Save Grid Matrix Adjustments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 bg-slate-50/80 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" /> Import Products via CSV
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Upload catalog product variants and initialize their stock levels instantly.
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setParsedRows([]);
                  setImportFileName("");
                }}
                className="p-1 h-7 w-7 text-gray-400 hover:text-gray-900 border border-gray-200 hover:bg-gray-100 rounded-full flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Instructions and Download Template */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">CSV Data Template</h4>
                  <p className="text-xs text-indigo-900/80">
                    Use our standardized CSV schema to map properties correctly. All headers are case-sensitive.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadCSVTemplate}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <FileDown className="w-4 h-4" /> Download Template
                </button>
              </div>

              {/* Upload Drop Zone */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50 hover:bg-gray-50/80 transition-all relative">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2 pointer-events-none">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                  <div className="text-sm font-semibold text-gray-700">
                    {importFileName ? (
                      <span className="text-indigo-600">{importFileName}</span>
                    ) : (
                      "Click to browse or drag your .csv file here"
                    )}
                  </div>
                  <p className="text-xs text-gray-400">Supported formats: Standard UTF-8 CSV up to 10MB</p>
                </div>
              </div>

              {/* Target Warehouse Context */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Target Warehouse Context for Stock quantities
                  </label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <select
                      value={selectedWarehouseId === "All" ? (warehouses[0]?.id || "") : selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      className="bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name} ({wh.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    If your CSV includes the "CurrentStock" column, inventory levels will be seeded under this specific warehouse facility.
                  </p>
                </div>
              )}

              {/* Preview Grid */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Preview of Parsed Data (First 5 records)</span>
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {parsedRows.length} Rows Detected
                    </span>
                  </h4>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-gray-555 font-bold">
                          <th className="p-3">Title</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3 text-center">Size</th>
                          <th className="p-3 text-right">Price</th>
                          <th className="p-3 text-center">Stock</th>
                          <th className="p-3 text-center">Import Status</th>
                          <th className="p-3">Value Discrepancies</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {parsedRows.slice(0, 5).map((row, index) => {
                          const isExists = row.status === "EXISTS";
                          return (
                            <tr key={index} className={`hover:bg-slate-50/50 ${isExists ? "bg-amber-50/20" : ""}`}>
                              <td className="p-3 font-semibold text-gray-800">{row.title || "--"}</td>
                              <td className="p-3 font-mono text-gray-600">{row.sku || "--"}</td>
                              <td className="p-3 text-center font-bold">{row.size || "--"}</td>
                              <td className="p-3 text-right font-mono font-bold">${parseFloat(row.price || 0).toFixed(2)}</td>
                              <td className="p-3 text-center font-bold text-indigo-600">{row.currentStock || "0"}</td>
                              <td className="p-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  isExists 
                                    ? "bg-amber-100 text-amber-800" 
                                    : "bg-emerald-100 text-emerald-800"
                                }`}>
                                  {isExists ? "Skip (Exists)" : "Ready (New)"}
                                </span>
                              </td>
                              <td className="p-3 text-xs text-amber-800 max-w-[250px]" title={row.discrepancies?.join(", ")}>
                                {isExists ? (
                                  row.discrepancies && row.discrepancies.length > 0 ? (
                                    <span className="flex flex-col gap-0.5">
                                      {row.discrepancies.map((disc: string, idx: number) => (
                                        <span key={idx} className="block text-[10px] text-amber-700">• {disc}</span>
                                      ))}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic text-[10px]">Identical SKU (No value changes)</span>
                                  )
                                ) : (
                                  <span className="text-gray-400 text-[10px]">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setParsedRows([]);
                  setImportFileName("");
                }}
                className="px-4 py-2 bg-white border border-gray-255 hover:bg-gray-100 rounded-lg font-semibold text-gray-700 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeImport}
                disabled={importing || parsedRows.length === 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {importing && <RefreshCw className="w-3 h-3 animate-spin" />}
                Execute Bulk Import
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MANUAL PRODUCT ADD/EDIT FORM MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 bg-slate-50/80 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <span>📦</span> {productModalMode === "ADD" ? "Create New Product Catalog Entry" : `Edit Product Catalog: ${selectedProduct?.name}`}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {productModalMode === "ADD" 
                    ? "Manually add a product and define multiple size/color stock variants."
                    : "Update metadata details globally. Add new variants to this style."}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowProductModal(false);
                  setProductVariants([]);
                }}
                className="p-1 h-7 w-7 text-gray-400 hover:text-gray-900 border border-gray-200 hover:bg-gray-100 rounded-full flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Product Metadata Section */}
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Core Metadata</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title / Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 block">Product Title / Name *</label>
                    <input
                      type="text"
                      required
                      value={productForm.title}
                      onChange={(e) => setProductForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Seyon Premium Hoodie"
                      className="w-full bg-white border border-gray-250 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  {/* Base SKU */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 block">Base SKU Prefix *</label>
                    <input
                      type="text"
                      required
                      disabled={productModalMode === "EDIT"}
                      value={productForm.baseSku}
                      onChange={(e) => handleBaseSkuChange(e.target.value)}
                      placeholder="e.g. SY-HD01"
                      className="w-full bg-white disabled:bg-gray-100 border border-gray-250 rounded-lg p-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    {productModalMode === "EDIT" && (
                      <p className="text-[10px] text-amber-600">Base SKU prefix cannot be updated once variants are active.</p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 block">Category *</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-white border border-gray-255 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="Top">Tops / Upperwear</option>
                      <option value="Bottom">Bottoms / Lowerwear</option>
                      <option value="Set">Set / Coordinate Outfit</option>
                    </select>
                  </div>

                  {/* Target Demographic Group */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 block">Target Demographic *</label>
                    <select
                      value={productForm.targetGroup}
                      onChange={(e) => setProductForm(prev => ({ ...prev, targetGroup: e.target.value }))}
                      className="w-full bg-white border border-gray-255 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="Newborn">Newborn (0-12M)</option>
                      <option value="Infants">Infants (1-3Y)</option>
                      <option value="Kids">Kids (4-12Y)</option>
                      <option value="Teens">Teens (13-19Y)</option>
                      <option value="Adults">Adults (20Y+)</option>
                    </select>
                  </div>

                  {/* Age Range Specifics */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 block">Specific Age Range (Optional)</label>
                    <input
                      type="text"
                      value={productForm.ageRange}
                      onChange={(e) => setProductForm(prev => ({ ...prev, ageRange: e.target.value }))}
                      placeholder="e.g. 6-12 Months, 10-12 Years"
                      className="w-full bg-white border border-gray-250 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  {/* Safety Stock Limit */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 block">Safety Stock Alert Limit *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={productForm.safetyStockLimit}
                      onChange={(e) => setProductForm(prev => ({ ...prev, safetyStockLimit: Math.max(1, parseInt(e.target.value) || 5) }))}
                      placeholder="5"
                      className="w-full bg-white border border-gray-250 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  {/* Image URLs & Compression File Picker */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-600 block">Product Media & Images *</label>
                    
                    <div className="flex flex-col md:flex-row gap-3 items-stretch">
                      {/* Direct File Picker with Auto-WebP Compression */}
                      <div className="flex-1 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 rounded-xl p-3 text-center flex flex-col items-center justify-center transition-colors relative cursor-pointer">
                        <Upload className="w-5 h-5 text-indigo-600 mb-1" />
                        <span className="text-xs font-bold text-slate-800">Upload & Compress Photo</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Auto-compresses to tiny WebP (Saves 95% storage)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const result = await compressImageBeforeUpload(file);
                              toast.success(`⚡ Compressed ${result.originalSizeKB}KB to ${result.compressedSizeKB}KB (${result.savingsPercentage}% saved!)`);
                              
                              // Convert blob to Data URL for instant local preview
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setProductForm(prev => ({ ...prev, imageUrl: reader.result as string }));
                              };
                              reader.readAsDataURL(result.blob);
                            } catch (err) {
                              toast.error("Failed to compress image");
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>

                      {/* Manual Image URL Input fallback */}
                      <div className="flex-1 space-y-1">
                        <span className="text-[10px] font-semibold text-gray-400 block uppercase">Or Paste Image URL</span>
                        <input
                          type="url"
                          value={productForm.imageUrl}
                          onChange={(e) => setProductForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                          placeholder="https://images.unsplash.com/...jpg"
                          className="w-full bg-white border border-gray-255 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              {/* Warehouse Inventory Seeding Settings */}
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Initial Stock Seeding Warehouse Context</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 block">Select Target Warehouse Facility</label>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <select
                        value={productForm.warehouseId}
                        onChange={(e) => setProductForm(prev => ({ ...prev, warehouseId: e.target.value }))}
                        className="bg-white border border-gray-255 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        {warehouses.map((wh) => (
                          <option key={wh.id} value={wh.id}>
                            {wh.name} ({wh.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <p className="text-[10px] text-gray-400">
                      {productModalMode === "ADD" 
                        ? "If initial stock quantities are entered in the table below, they will be seeded directly inside this warehouse."
                        : "If initial stock quantities are entered for new variants below, they will be seeded inside this warehouse."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Variants Setup Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {productModalMode === "ADD" ? "Product Variants & Combinations Matrix" : "Add New Variants to Style"}
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] px-2.5 py-1 rounded transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Variant Row
                  </button>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 text-gray-550 font-bold">
                        <th className="p-3">Size</th>
                        <th className="p-3">Color</th>
                        <th className="p-3">Generated SKU</th>
                        <th className="p-3 text-right">Price ($)</th>
                        <th className="p-3 text-center">Initial Stock</th>
                        <th className="p-3">Custom Barcode (Optional)</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {productVariants.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-450 italic">
                            {productModalMode === "ADD" 
                              ? "No variants defined. Click 'Add Variant Row' to add combinations."
                              : "No new variants staged. Define size/color combinations to append them."}
                          </td>
                        </tr>
                      ) : (
                        productVariants.map((v, index) => (
                          <tr key={index} className="hover:bg-slate-50/50">
                            {/* Size selection */}
                            <td className="p-2">
                              <select
                                value={v.size}
                                onChange={(e) => updateVariantValue(index, "size", e.target.value)}
                                className="bg-white border border-gray-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                                <option value="XXL">XXL</option>
                              </select>
                            </td>

                            {/* Color */}
                            <td className="p-2">
                              <input
                                type="text"
                                required
                                value={v.color}
                                onChange={(e) => updateVariantValue(index, "color", e.target.value)}
                                placeholder="e.g. Black, White"
                                className="w-24 bg-white border border-gray-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>

                            {/* SKU */}
                            <td className="p-2 font-mono">
                              <input
                                type="text"
                                required
                                value={v.sku}
                                onChange={(e) => updateVariantValue(index, "sku", e.target.value)}
                                placeholder="Auto Generated"
                                className="w-40 bg-white border border-gray-200 rounded-lg p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>

                            {/* Price */}
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                value={v.price}
                                onChange={(e) => updateVariantValue(index, "price", Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-20 bg-white border border-gray-200 rounded-lg p-1.5 text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>

                            {/* Initial Stock */}
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                min="0"
                                value={v.initialStock}
                                onChange={(e) => updateVariantValue(index, "initialStock", Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-16 bg-white border border-gray-200 rounded-lg p-1.5 text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>

                            {/* Barcode */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={v.barcode}
                                onChange={(e) => updateVariantValue(index, "barcode", e.target.value)}
                                placeholder="Auto Barcode"
                                className="w-32 bg-white border border-gray-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>

                            {/* Remove row */}
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveVariantRow(index)}
                                className="p-1 h-6 w-6 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-full flex items-center justify-center mx-auto transition-colors cursor-pointer"
                                title="Remove Variant Row"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="pt-4 border-t border-slate-105 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setProductVariants([]);
                  }}
                  className="px-4 py-2 bg-white border border-gray-255 hover:bg-gray-100 rounded-lg font-semibold text-gray-700 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingProduct && <RefreshCw className="w-3 h-3 animate-spin" />}
                  {productModalMode === "ADD" ? "Create Product Style" : "Save Changes"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* AI Copywriter Modal */}
      {showAiCopyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Zap className="w-5 h-5 text-amber-500" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">✨ AI Product Copy & SEO Meta Generator</h3>
                  <p className="text-xs text-slate-500">Generate Google Search SEO titles, meta descriptions, and Instagram captions.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiCopyModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Title</label>
                  <input
                    type="text"
                    value={aiProductTitle}
                    onChange={(e) => setAiProductTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                    placeholder="e.g. Pure Linen Casual Shirt"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={aiBrand}
                    onChange={(e) => setAiBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateAiCopy}
                disabled={generatingAi}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {generatingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300" />}
                Generate Copy & Meta Tags
              </button>

              {aiResults && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <span className="font-bold text-indigo-700 uppercase tracking-wider text-[10px] block">🔍 Google Search Title Tag</span>
                    <p className="font-semibold text-slate-900">{aiResults.seoTitle}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px] block">📝 Google Meta Description</span>
                    <p className="text-slate-700 leading-relaxed">{aiResults.metaDescription}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <span className="font-bold text-purple-700 uppercase tracking-wider text-[10px] block">📖 Storefront Product Story</span>
                    <p className="text-slate-700 leading-relaxed">{aiResults.productStory}</p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-1">
                    <span className="font-bold text-purple-900 uppercase tracking-wider text-[10px] block">📱 Instagram & Social Media Hook</span>
                    <p className="text-purple-900 whitespace-pre-wrap font-mono text-[11px]">{aiResults.instagramCaption}</p>
                  </div>

                  <button
                    onClick={handleSaveSeoToProduct}
                    disabled={savingSeo}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
                  >
                    {savingSeo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Save & Apply SEO Meta Tags to Database
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
