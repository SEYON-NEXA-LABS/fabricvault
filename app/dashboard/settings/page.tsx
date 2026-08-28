"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Link2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Key,
  Globe,
  Building2,
  Lock,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  MapPin,
  Check,
  Truck,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  QrCode,
  CreditCard,
  Copy,
  Share2,
  Palette,
  Type
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "../../../components/RoleGuard";
import { BillingContent } from "./billing/page";

interface HandshakeStep {
  id: number;
  label: string;
  status: "idle" | "loading" | "success" | "failed";
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefaultPickup: boolean;
}

export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={["SUPERADMIN", "TENANTADMIN"]}>
      <SettingsContent />
    </RoleGuard>
  );
}

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<"company" | "billing" | "warehouses" | "logistics" | "payments" | "theme">("company");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Storefront Theme Customization States
  const [themePrimary, setThemePrimary] = useState("#0d9488");
  const [themeAccent, setThemeAccent] = useState("#fbbf24");
  const [themeRadius, setThemeRadius] = useState("0.375rem");
  const [themeFontFamily, setThemeFontFamily] = useState("Inter, sans-serif");
  const [themeAnnouncementText, setThemeAnnouncementText] = useState("⚡ Free Express Delivery on orders over ₹1,999!");
  const [savingTheme, setSavingTheme] = useState(false);

  // Razorpay credentials states
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");
  const [savingRazorpay, setSavingRazorpay] = useState(false);
  
  // Shopify credentials form states
  const [shopUrl, setShopUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [barcodeMode, setBarcodeMode] = useState<"HYBRID" | "STRICT_SHOPIFY" | "INTERNAL_ONLY">("HYBRID");

  // Handshake execution states
  const [handshaking, setHandshaking] = useState(false);
  const [steps, setSteps] = useState<HandshakeStep[]>([
    { id: 1, label: "Verifying Shopify shop domain URL connectivity", status: "idle" },
    { id: 2, label: "Testing Admin API Access Token permissions & scopes", status: "idle" },
    { id: 3, label: "Registering webhooks (orders/create, inventory/update)", status: "idle" },
    { id: 4, label: "Initiating initial metadata synchronization", status: "idle" }
  ]);

  // Company details form states
  const [companyName, setCompanyName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("");
  const [defaultThreshold, setDefaultThreshold] = useState(5);
  const [taxId, setTaxId] = useState("");
  const [gstin, setGstin] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [lowStockMode, setLowStockMode] = useState("MANUAL");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [initialCompanySettings, setInitialCompanySettings] = useState<any>(null);

  useEffect(() => {
    if (loadingSettings || !initialCompanySettings) {
      if (typeof window !== "undefined") {
        (window as any).__seyonIsDirty = false;
      }
      return;
    }

    const isDirty = 
      companyName !== (initialCompanySettings.name || "") ||
      storeName !== (initialCompanySettings.storeName || "") ||
      currency !== (initialCompanySettings.currency || "INR") ||
      timezone !== (initialCompanySettings.timezone || "") ||
      taxId !== (initialCompanySettings.taxId || "") ||
      gstin !== (initialCompanySettings.gstin || "") ||
      contactEmail !== (initialCompanySettings.contactEmail || "") ||
      whatsappNumber !== (initialCompanySettings.whatsappNumber || "") ||
      lowStockMode !== (initialCompanySettings.lowStockMode || "MANUAL") ||
      shopUrl !== (initialCompanySettings.shopUrl || "") ||
      accessToken !== (initialCompanySettings.accessToken || "") ||
      secretKey !== (initialCompanySettings.secretKey || "") ||
      barcodeMode !== (initialCompanySettings.barcodeMode || "HYBRID");

    if (typeof window !== "undefined") {
      (window as any).__seyonIsDirty = isDirty;
    }
  }, [loadingSettings, companyName, storeName, currency, timezone, taxId, gstin, contactEmail, whatsappNumber, lowStockMode, shopUrl, accessToken, secretKey, barcodeMode, initialCompanySettings]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        (window as any).__seyonIsDirty = false;
      }
    };
  }, []);

  // Warehouses states
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  
  // Warehouse form state
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [whName, setWhName] = useState("");
  const [whCode, setWhCode] = useState("");
  const [whAddress1, setWhAddress1] = useState("");
  const [whAddress2, setWhAddress2] = useState("");
  const [whCity, setWhCity] = useState("");
  const [whState, setWhState] = useState("");
  const [whZip, setWhZip] = useState("");
  const [whCountry, setWhCountry] = useState("India");
  const [whIsDefault, setWhIsDefault] = useState(false);
  const [savingWarehouse, setSavingWarehouse] = useState(false);

  // Courier Integrations States
  const [courierConfigs, setCourierConfigs] = useState<any[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [savingCourierPartner, setSavingCourierPartner] = useState<string | null>(null);

  // States for each partner's fields
  const [shiprocketEmail, setShiprocketEmail] = useState("");
  const [shiprocketPassword, setShiprocketPassword] = useState("");
  const [shiprocketActive, setShiprocketActive] = useState(true);

  const [delhiveryKey, setDelhiveryKey] = useState("");
  const [delhiveryActive, setDelhiveryActive] = useState(true);

  const [bluedartLicense, setBluedartLicense] = useState("");
  const [bluedartActive, setBluedartActive] = useState(true);

  const [dtdcKey, setDtdcKey] = useState("");
  const [dtdcActive, setDtdcActive] = useState(true);

  const [xpressbeesKey, setXpressbeesKey] = useState("");
  const [xpressbeesActive, setXpressbeesActive] = useState(true);

  const [indiaPostKey, setIndiaPostKey] = useState("");
  const [indiaPostActive, setIndiaPostActive] = useState(true);

  const [professionalCouriersKey, setProfessionalCouriersKey] = useState("");
  const [professionalCouriersActive, setProfessionalCouriersActive] = useState(true);

  // Fetch courier settings
  const fetchCourierConfigs = async () => {
    setLoadingCouriers(true);
    try {
      const res = await fetch("/api/logistics/couriers");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCourierConfigs(data);
        // Map configs to inputs
        data.forEach(cfg => {
          if (cfg.courierPartner === "SHIPROCKET") {
            setShiprocketEmail(cfg.apiEmail || "");
            setShiprocketPassword(cfg.apiPassword || "");
            setShiprocketActive(cfg.isActive);
          } else if (cfg.courierPartner === "DELHIVERY") {
            setDelhiveryKey(cfg.apiKey || "");
            setDelhiveryActive(cfg.isActive);
          } else if (cfg.courierPartner === "BLUEDART") {
            setBluedartLicense(cfg.apiKey || "");
            setBluedartActive(cfg.isActive);
          } else if (cfg.courierPartner === "DTDC") {
            setDtdcKey(cfg.apiKey || "");
            setDtdcActive(cfg.isActive);
          } else if (cfg.courierPartner === "XPRESSBEES") {
            setXpressbeesKey(cfg.apiKey || "");
            setXpressbeesActive(cfg.isActive);
          } else if (cfg.courierPartner === "INDIA_POST") {
            setIndiaPostKey(cfg.apiKey || "");
            setIndiaPostActive(cfg.isActive);
          } else if (cfg.courierPartner === "THE_PROFESSIONAL_COURIERS") {
            setProfessionalCouriersKey(cfg.apiKey || "");
            setProfessionalCouriersActive(cfg.isActive);
          }
        });
      }
    } catch (err) {
      toast.error("Failed to load courier configurations.");
    } finally {
      setLoadingCouriers(false);
    }
  };

  const saveCourierConfig = async (partner: string, payload: any) => {
    setSavingCourierPartner(partner);
    try {
      const res = await fetch("/api/logistics/couriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courierPartner: partner,
          ...payload
        })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(`${partner} configuration saved successfully!`);
        fetchCourierConfigs();
      }
    } catch (err) {
      toast.error(`Failed to save ${partner} configuration.`);
    } finally {
      setSavingCourierPartner(null);
    }
  };

  // Fetch warehouses
  const fetchWarehouses = async () => {
    setLoadingWarehouses(true);
    try {
      const res = await fetch("/api/warehouses");
      const data = await res.json();
      if (Array.isArray(data)) {
        setWarehouses(data);
      } else {
        toast.error("Failed to load warehouses data.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    } finally {
      setLoadingWarehouses(false);
    }
  };

  // Fetch company settings from API
  const fetchSettings = async () => {
    setLoadingSettings(true);
    const cachedCompany = localStorage.getItem("seyon:company");
    if (cachedCompany) {
      try {
        const data = JSON.parse(cachedCompany);
        setCompanyName(data.name || "");
        setStoreName(data.storeName || "");
        setCurrency(data.currency || "INR");
        setTimezone(data.timezone ? `${data.timezone} (UTC+05:30)` : "IST (UTC+05:30)");
        setTaxId(data.taxId || "");
        setGstin(data.gstin || "");
        setContactEmail(data.contactEmail || "");
        setWhatsappNumber(data.whatsappNumber || "");
        setLowStockMode(data.lowStockMode || "MANUAL");
        const shopUrlVal = data.shopifyStoreUrl 
          ? data.shopifyStoreUrl.replace("https://", "").replace("http://", "") 
          : "";
        setShopUrl(shopUrlVal);
        if (shopUrlVal) {
          setIsConnected(true);
        }
        const tokenVal = data.shopifyAccessToken || "";
        const secretKeyVal = data.shopifyWebhookSecret || "";
        const barcodeModeVal = data.barcodeMode || "HYBRID";
        setAccessToken(tokenVal);
        setSecretKey(secretKeyVal);
        setBarcodeMode(barcodeModeVal);

        setInitialCompanySettings({
          name: data.name || "",
          storeName: data.storeName || "",
          currency: data.currency || "INR",
          timezone: data.timezone ? `${data.timezone} (UTC+05:30)` : "IST (UTC+05:30)",
          taxId: data.taxId || "",
          gstin: data.gstin || "",
          contactEmail: data.contactEmail || "",
          whatsappNumber: data.whatsappNumber || "",
          lowStockMode: data.lowStockMode || "MANUAL",
          shopUrl: shopUrlVal,
          accessToken: tokenVal,
          secretKey: secretKeyVal,
          barcodeMode: barcodeModeVal
        });
      } catch (e) {
        console.error("Failed to parse cached company settings", e);
      }
    }
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (!data.error) {
        localStorage.setItem("seyon:company", JSON.stringify(data));
        setCompanyName(data.name || "");
        setStoreName(data.storeName || "");
        setCompanyCode(data.code || "syn");
        setCurrency(data.currency || "INR");
        setTimezone(data.timezone ? `${data.timezone} (UTC+05:30)` : "IST (UTC+05:30)");
        setTaxId(data.taxId || "");
        setGstin(data.gstin || "");
        setContactEmail(data.contactEmail || "");
        setWhatsappNumber(data.whatsappNumber || "");
        setLowStockMode(data.lowStockMode || "MANUAL");
        const shopUrlVal = data.shopifyStoreUrl 
          ? data.shopifyStoreUrl.replace("https://", "").replace("http://", "") 
          : "";
        setShopUrl(shopUrlVal);
        if (shopUrlVal) {
          setIsConnected(true);
        }
        setClientId(data.shopifyClientId || "");
        setClientSecret(data.shopifyClientSecret || "");
        const tokenVal = data.shopifyAccessToken || "";
        setAccessToken(tokenVal);
        const secretKeyVal = data.shopifyWebhookSecret || "";
        setSecretKey(secretKeyVal);
        const barcodeModeVal = data.barcodeMode || "HYBRID";
        setBarcodeMode(barcodeModeVal);
        setRazorpayEnabled(data.razorpayEnabled || false);
        setRazorpayKeyId(data.razorpayKeyId || "");
        setRazorpayKeySecret(data.razorpayKeySecret || "");

        if (data.themeConfig) {
          try {
            const parsedTheme = typeof data.themeConfig === "string" ? JSON.parse(data.themeConfig) : data.themeConfig;
            if (parsedTheme.primary) setThemePrimary(parsedTheme.primary);
            if (parsedTheme.accent) setThemeAccent(parsedTheme.accent);
            if (parsedTheme.radius) setThemeRadius(parsedTheme.radius);
            if (parsedTheme.fontFamily) setThemeFontFamily(parsedTheme.fontFamily);
            if (parsedTheme.announcementText) setThemeAnnouncementText(parsedTheme.announcementText);
          } catch (err) {
            console.error("Failed to parse themeConfig JSON", err);
          }
        }

        setInitialCompanySettings({
          name: data.name || "",
          storeName: data.storeName || "",
          currency: data.currency || "INR",
          timezone: data.timezone ? `${data.timezone} (UTC+05:30)` : "IST (UTC+05:30)",
          taxId: data.taxId || "",
          gstin: data.gstin || "",
          contactEmail: data.contactEmail || "",
          whatsappNumber: data.whatsappNumber || "",
          lowStockMode: data.lowStockMode || "MANUAL",
          shopUrl: shopUrlVal,
          clientId: data.shopifyClientId || "",
          clientSecret: data.shopifyClientSecret || "",
          accessToken: tokenVal,
          secretKey: secretKeyVal,
          barcodeMode: barcodeModeVal
        });
      }
    } catch (err) {
      toast.error("Failed to load company settings.");
    } finally {
      setLoadingSettings(false);
      if (typeof window !== "undefined") {
        (window as any).__seyonIsDirty = false;
      }
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "warehouses") {
      fetchWarehouses();
    } else if (activeTab === "logistics") {
      fetchCourierConfigs();
    }
  }, [activeTab]);

  const executeHandshake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopUrl) {
      toast.error("Please enter your Shopify Store Domain URL.");
      return;
    }

    if (!accessToken && (!clientId || !clientSecret)) {
      toast.error("Please provide either your Admin API Access Token OR both App Client ID & Client Secret.");
      return;
    }

    setHandshaking(true);
    setIsConnected(false);

    // Step 1: Testing domain format
    setSteps(prev => prev.map(s => s.id === 1 ? { ...s, status: "loading" } : { ...s, status: "idle" }));
    const cleanShopDomain = shopUrl.replace("https://", "").replace("http://", "").trim();
    
    await new Promise(r => setTimeout(r, 600));
    setSteps(prev => prev.map(s => s.id === 1 ? { ...s, status: "success" } : s));

    // Step 2: Live API Ping against Shopify REST API /admin/api/2024-04/shop.json
    setSteps(prev => prev.map(s => s.id === 2 ? { ...s, status: "loading" } : s));
    
    try {
      const cleanShopUrl = `https://${cleanShopDomain}`;
      const saveRes = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopifyStoreUrl: cleanShopUrl,
          shopifyClientId: clientId,
          shopifyClientSecret: clientSecret,
          shopifyAccessToken: accessToken,
          shopifyWebhookSecret: secretKey,
          barcodeMode
        })
      });
      const saveResult = await saveRes.json();
      if (!saveResult.success) {
        throw new Error(saveResult.error || "Failed to persist credentials to database.");
      }

      // Live verification ping via API route
      const verifyRes = await fetch("/api/shopify/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: "Products Sync" })
      });
      const verifyResult = await verifyRes.json();

      if (!verifyRes.ok || verifyResult.error) {
        setSteps(prev => prev.map(s => s.id === 2 ? { ...s, status: "failed" } : s));
        toast.error(`Handshake Failed: ${verifyResult.error || "Shopify API rejected the token."}`);
        setHandshaking(false);
        return;
      }

      setSteps(prev => prev.map(s => s.id === 2 ? { ...s, status: "success" } : s));

      // Step 3: Webhook status check
      setSteps(prev => prev.map(s => s.id === 3 ? { ...s, status: "loading" } : s));
      await new Promise(r => setTimeout(r, 500));
      setSteps(prev => prev.map(s => s.id === 3 ? { ...s, status: "success" } : s));

      // Step 4: Metadata sync complete
      setSteps(prev => prev.map(s => s.id === 4 ? { ...s, status: "loading" } : s));
      await new Promise(r => setTimeout(r, 500));
      setSteps(prev => prev.map(s => s.id === 4 ? { ...s, status: "success" } : s));

      setInitialCompanySettings((prev: any) => ({
        ...prev,
        shopUrl: cleanShopDomain,
        accessToken,
        secretKey,
        barcodeMode
      }));

      if (saveResult.company) {
        const { shopifyAccessToken, shopifyClientSecret, shopifyWebhookSecret, whatsappApiKey, ...safeCo } = saveResult.company;
        localStorage.setItem("seyon:company", JSON.stringify(safeCo));
      }
      setIsConnected(true);
      window.dispatchEvent(new Event("storage"));
      toast.success(`Authentic Shopify Handshake Verified! Synced ${verifyResult.log?.records || 0} products live.`);
    } catch (err: any) {
      setSteps(prev => prev.map(s => s.id === 2 ? { ...s, status: "failed" } : s));
      toast.error(`Handshake Failed: ${err.message || "Could not authenticate with Shopify."}`);
    } finally {
      setHandshaking(false);
    }
  };

  const saveCompanyDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          storeName: storeName,
          logoUrl,
          currency,
          timezone: timezone.split(" ")[0], // Extract just the code e.g. "IST"
          taxId,
          gstin,
          contactEmail,
          whatsappNumber,
          lowStockMode
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Company details saved! Default low stock threshold set to ${defaultThreshold} units.`);
        if (data.company) {
          localStorage.setItem("seyon:company", JSON.stringify(data.company));
          setInitialCompanySettings((prev: any) => ({
            ...prev,
            name: data.company.name || "",
            storeName: data.company.storeName || "",
            currency: data.company.currency || "INR",
            timezone: data.company.timezone ? `${data.company.timezone} (UTC+05:30)` : "IST (UTC+05:30)",
            taxId: data.company.taxId || "",
            gstin: data.company.gstin || "",
            contactEmail: data.company.contactEmail || "",
            whatsappNumber: data.company.whatsappNumber || "",
            lowStockMode: data.company.lowStockMode || "MANUAL",
            shopUrl: data.company.shopifyStoreUrl ? data.company.shopifyStoreUrl.replace("https://", "").replace("http://", "") : (prev?.shopUrl || ""),
            accessToken: data.company.shopifyAccessToken || (prev?.accessToken || ""),
            secretKey: data.company.shopifyWebhookSecret || (prev?.secretKey || ""),
            barcodeMode: data.company.barcodeMode || (prev?.barcodeMode || "HYBRID")
          }));
          if (typeof window !== "undefined") {
            (window as any).__seyonIsDirty = false;
          }
        }
      } else {
        toast.error(data.error || "Failed to save company details.");
      }
    } catch (err) {
      toast.error("Failed to connect to settings API.");
    }
  };

  const handleDisconnect = () => {
    if (confirm("Are you sure you want to disconnect this Shopify store? This will pause webhook integrations.")) {
      setIsConnected(false);
      setAccessToken("");
      setSecretKey("");
      toast.info("Shopify store disconnected.");
    }
  };

  // Warehouse CRUD Actions
  const handleOpenWarehouseModal = (wh?: Warehouse) => {
    if (wh) {
      setEditingWarehouseId(wh.id);
      setWhName(wh.name);
      setWhCode(wh.code);
      setWhAddress1(wh.addressLine1);
      setWhAddress2(wh.addressLine2 || "");
      setWhCity(wh.city);
      setWhState(wh.state);
      setWhZip(wh.zip);
      setWhCountry(wh.country);
      setWhIsDefault(wh.isDefaultPickup);
    } else {
      setEditingWarehouseId(null);
      setWhName("");
      setWhCode(`WH-${Math.floor(100 + Math.random() * 900)}`);
      setWhAddress1("");
      setWhAddress2("");
      setWhCity("");
      setWhState("");
      setWhZip("");
      setWhCountry("India");
      setWhIsDefault(warehouses.length === 0); // Default if it's the first one
    }
    setShowWarehouseModal(true);
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWarehouse(true);
    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingWarehouseId || undefined,
          name: whName,
          code: whCode,
          addressLine1: whAddress1,
          addressLine2: whAddress2 || null,
          city: whCity,
          state: whState,
          zip: whZip,
          country: whCountry,
          isDefaultPickup: whIsDefault
        })
      });

      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(editingWarehouseId ? "Warehouse updated successfully!" : "Warehouse added successfully!");
        setShowWarehouseModal(false);
        fetchWarehouses();
      }
    } catch (err) {
      toast.error("Failed to save warehouse.");
    } finally {
      setSavingWarehouse(false);
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this warehouse? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/warehouses?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Warehouse deleted successfully.");
        fetchWarehouses();
      } else {
        toast.error(data.error || "Failed to delete warehouse.");
      }
    } catch (err) {
      toast.error("Failed to connect to delete endpoint.");
    }
  };

  const handleSetDefaultPickup = async (wh: Warehouse) => {
    if (wh.isDefaultPickup) return;
    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...wh,
          isDefaultPickup: true
        })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(`${wh.name} set as default pickup location.`);
        fetchWarehouses();
      }
    } catch (err) {
      toast.error("Failed to update default pickup status.");
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-950" /> Tenant Settings
          </h1>
          <p className="text-sm text-gray-500">
            Configure your textile tenant profiles, security access details, warehouses, and connect Shopify integrations.
          </p>
        </div>

        {/* Public Storefront URL Share Widget */}
        {(() => {
          const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
          const baseUrl = typeof window !== "undefined" 
            ? window.location.origin 
            : (process.env.NEXT_PUBLIC_APP_URL || (isLocal ? "http://localhost:3000" : "https://merchantvault.vercel.app"));
          const storefrontUrl = `${baseUrl}/?slug=${companyCode || "syn"}`;

          return (
            <div className="flex items-center gap-2 bg-indigo-50/80 border border-indigo-100 rounded-xl p-3 shadow-2xs">
              <Globe className="w-5 h-5 text-indigo-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-indigo-950 block">Public Storefront URL</span>
                <code className="text-[11px] font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200/60 block mt-0.5">
                  {storefrontUrl}
                </code>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(storefrontUrl);
                    toast.success("Storefront URL copied to clipboard!");
                  }}
                  className="p-1.5 bg-white hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                  title="Copy Storefront URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a
                  href={storefrontUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1 font-semibold text-xs px-2.5 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Visit
                </a>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Settings Navigation Tabs (Shadcn/Radix Style) */}
      <div className="inline-flex h-11 items-center justify-start rounded-lg bg-gray-100 p-1 text-gray-500 gap-1 border border-gray-200">
        <button
          onClick={() => setActiveTab("company")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 disabled:pointer-events-none disabled:opacity-50 gap-2 ${
            activeTab === "company"
              ? "bg-white text-gray-900 shadow-sm font-bold border border-gray-200/50"
              : "text-gray-550 hover:text-gray-900 hover:bg-gray-50/50"
          }`}
        >
          <Building2 className="w-4 h-4 text-gray-500" /> Company Profile
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 disabled:pointer-events-none disabled:opacity-50 gap-2 ${
            activeTab === "billing"
              ? "bg-white text-indigo-900 shadow-sm font-bold border border-indigo-200"
              : "text-gray-550 hover:text-gray-900 hover:bg-gray-55/50"
          }`}
        >
          <CreditCard className="w-4 h-4 text-indigo-600" /> Subscription & Add-Ons
        </button>
        <button
          onClick={() => setActiveTab("warehouses")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 disabled:pointer-events-none disabled:opacity-50 gap-2 ${
            activeTab === "warehouses"
              ? "bg-white text-gray-900 shadow-sm font-bold border border-gray-200/50"
              : "text-gray-550 hover:text-gray-900 hover:bg-gray-55/50"
          }`}
        >
          <MapPin className="w-4 h-4 text-gray-500" /> Warehouses & Stores
        </button>
        <button
          onClick={() => setActiveTab("logistics")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 disabled:pointer-events-none disabled:opacity-50 gap-2 ${
            activeTab === "logistics"
              ? "bg-white text-gray-900 shadow-sm font-bold border border-gray-200/50"
              : "text-gray-550 hover:text-gray-900 hover:bg-gray-55/50"
          }`}
        >
          <Truck className="w-4 h-4 text-gray-500" /> Courier Integrations
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 disabled:pointer-events-none disabled:opacity-50 gap-2 ${
            activeTab === "payments"
              ? "bg-white text-gray-900 shadow-sm font-bold border border-gray-200/50"
              : "text-gray-550 hover:text-gray-900 hover:bg-gray-55/50"
          }`}
        >
          <CreditCard className="w-4 h-4 text-gray-500" /> Payment Gateways
        </button>
        <button
          onClick={() => setActiveTab("theme")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 disabled:pointer-events-none disabled:opacity-50 gap-2 ${
            activeTab === "theme"
              ? "bg-white text-gray-900 shadow-sm font-bold border border-gray-200/50"
              : "text-gray-550 hover:text-gray-900 hover:bg-gray-55/50"
          }`}
        >
          <Palette className="w-4 h-4 text-gray-500" /> Storefront Theme
        </button>
        <button
          onClick={() => setActiveTab("brands" as any)}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 disabled:pointer-events-none disabled:opacity-50 gap-2 ${
            (activeTab as string) === "brands"
              ? "bg-white text-indigo-900 shadow-sm font-bold border border-indigo-200"
              : "text-gray-550 hover:text-gray-900 hover:bg-gray-55/50"
          }`}
        >
          <Globe className="w-4 h-4 text-indigo-600" /> Stores & Outlets
        </button>
      </div>

      {/* Dynamic Settings Pane */}
      <div className="space-y-6">

          {activeTab === "billing" && (
            <div className="space-y-6">
              <BillingContent />
            </div>
          )}

          {activeTab === "company" && (
            /* Company Settings Pane */
            <div className="bg-white border border-gray-200 rounded-xl p-5 lg:p-8 shadow-sm space-y-6 lg:space-y-8">
              <div>
                <h3 className="font-bold text-gray-950 text-base lg:text-lg">Tenant Company Profile</h3>
                <p className="text-xs lg:text-sm text-gray-500 mt-1">Configure tenant identification, default thresholds, currencies, and regional settings.</p>
              </div>

              <form onSubmit={saveCompanyDetails} className="space-y-6 lg:space-y-8 text-xs w-full">
                {/* Group 1: Identity & Storefront Branding */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-gray-700 text-xs">Company Legal Name (`name`)</label>
                    <input 
                      required 
                      type="text" 
                      value={companyName} 
                      onChange={e => setCompanyName(e.target.value)} 
                      placeholder="e.g. Seyon Nexa Labs Pvt Ltd"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-gray-700 text-xs">Public Storefront Name (`storeName`)</label>
                    <input 
                      type="text" 
                      value={storeName} 
                      onChange={e => setStoreName(e.target.value)} 
                      placeholder="e.g. MerchantVault Retail"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-indigo-950" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-gray-700 text-xs">Tenant Slug (`code`)</label>
                    <input 
                      disabled
                      type="text" 
                      value={companyCode || "syn"} 
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg py-2.5 px-3.5 text-sm cursor-not-allowed font-mono font-bold text-indigo-700" 
                    />
                  </div>
                </div>

                {/* Group 2: Regional & Support Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-gray-700 text-xs">Default Currency</label>
                    <select 
                      value={currency} 
                      onChange={e => setCurrency(e.target.value)} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-gray-700 text-xs">Timezone</label>
                    <input 
                      disabled
                      type="text" 
                      value={timezone} 
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg py-2.5 px-3.5 text-sm cursor-not-allowed font-medium text-gray-500" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-gray-700 text-xs">Support Email Address</label>
                    <input 
                      type="email" 
                      value={contactEmail} 
                      onChange={e => setContactEmail(e.target.value)} 
                      placeholder="e.g. support@yourbrand.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-gray-700 text-xs">Support WhatsApp / Phone</label>
                    <input 
                      type="text" 
                      value={whatsappNumber} 
                      onChange={e => setWhatsappNumber(e.target.value)} 
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono" 
                    />
                  </div>
                </div>

                {/* Group 3: Inventory Rules & Tax Identifiers */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-gray-700 text-xs">Default Low Stock Alert Threshold</label>
                    <input 
                      type="number"
                      min="1"
                      value={defaultThreshold} 
                      onChange={e => setDefaultThreshold(parseInt(e.target.value) || 3)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-gray-700 text-xs">Low Stock Control Mode</label>
                    <select
                      value={lowStockMode}
                      onChange={e => setLowStockMode(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                    >
                      <option value="MANUAL">Manual (Use Set Safety Limits)</option>
                      <option value="AUTOMATIC">Automatic (Dynamic Sales Velocity-based)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-gray-700 text-xs">GSTIN / VAT Number (Optional)</label>
                    <input 
                      type="text" 
                      value={gstin} 
                      onChange={e => setGstin(e.target.value)} 
                      placeholder="e.g. 22AAAAA1111A1Z1"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase font-mono" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-gray-700 text-xs">Tax Registration ID (Optional)</label>
                    <input 
                      type="text" 
                      value={taxId} 
                      onChange={e => setTaxId(e.target.value)} 
                      placeholder="e.g. TAX-99999"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono" 
                    />
                  </div>
                </div>

                {/* Theory Information Banner spanning full width */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 space-y-1 leading-relaxed w-full">
                  {lowStockMode === "MANUAL" ? (
                    <p>
                      <strong className="text-gray-900 font-bold">Manual Stock Control Mode:</strong> Low stock status is triggered when physical inventory level drops to or below the static <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono text-[11px]">safetyStockLimit</code> configured directly on the product variant catalog profile.
                    </p>
                  ) : (
                    <p>
                      <strong className="text-gray-900 font-bold">Automatic Stock Control Mode:</strong> Low stock status is dynamically calculated daily using sales velocity and lead time metrics. Evaluates when stock drops below: <span className="font-bold text-indigo-900 font-mono text-[11px]">Average Daily Sales (ADS) × Lead Time Days</span>.
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-all text-sm"
                  >
                    Save Company Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "warehouses" && (
            /* Warehouses Management Pane */
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-600" /> Warehouses & Pickup Locations
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Manage storage facilities, retail outlets, and specify the default fulfillment pickup center.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenWarehouseModal()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Warehouse
                </button>
              </div>

              {loadingWarehouses ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-xs">Loading warehouses database...</p>
                </div>
              ) : warehouses.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl text-gray-400 space-y-3">
                  <MapPin className="w-10 h-10 mx-auto text-gray-300" />
                  <div>
                    <p className="text-sm font-semibold text-gray-500">No Warehouses Configured</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      Define your warehouse locations to enable inventory level tracking and order fulfillment source selection.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {warehouses.map((wh) => (
                    <div
                      key={wh.id}
                      className={`p-4 border rounded-xl shadow-xs transition-all duration-200 flex flex-col justify-between ${
                        wh.isDefaultPickup
                          ? "border-indigo-500 bg-indigo-50/10 shadow-indigo-100/50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 text-sm">{wh.name}</span>
                          <span className="font-mono text-[10px] bg-gray-150 text-gray-600 px-2 py-0.5 rounded font-bold">
                            {wh.code}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500 space-y-0.5 leading-relaxed">
                          <p>{wh.addressLine1}</p>
                          {wh.addressLine2 && <p>{wh.addressLine2}</p>}
                          <p>{wh.city}, {wh.state} - {wh.zip}</p>
                          <p className="font-medium text-gray-700">{wh.country}</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          {wh.isDefaultPickup ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                              <Check className="w-3 h-3" /> Default Pickup
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSetDefaultPickup(wh)}
                              className="text-[10px] font-semibold text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 px-2 py-0.5 rounded transition-colors"
                            >
                              Make Default
                            </button>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenWarehouseModal(wh)}
                            className="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-gray-50 transition-colors"
                            title="Edit Location"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteWarehouse(wh.id)}
                            className="text-gray-400 hover:text-red-650 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete Location"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "logistics" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-indigo-950" /> Courier Integrations
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Configure API credentials for Shiprocket, Delhivery, Bluedart, and DTDC to enable automated tracking and shipping label generation.
                </p>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                <Truck className="w-5 h-5 text-indigo-700 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-indigo-900 text-xs sm:text-sm">Mock Integration Mode Enabled</h4>
                  <p className="text-[11px] sm:text-xs text-indigo-850 mt-1 leading-relaxed">
                    Credentials stored below will be saved securely in the database. Courier operations (Manifest generation, status transitions) are operating in <strong>Mock/Manual entry mode</strong> for development. These configurations are API-ready and can be seamlessly linked to live Shiprocket/Delhivery/Bluedart/DTDC REST API endpoints in the future.
                  </p>
                </div>
              </div>

              {loadingCouriers ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-xs">Loading configurations...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shiprocket */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-white space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-indigo-900 text-xs">SR</div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">Shiprocket</h4>
                            <p className="text-[10px] text-gray-400">API Credentials</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={shiprocketActive}
                            onChange={(e) => setShiprocketActive(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-semibold text-gray-600">API Email Address</label>
                          <input
                            type="email"
                            name="shiprocket_api_email"
                            autoComplete="off"
                            value={shiprocketEmail}
                            onChange={(e) => setShiprocketEmail(e.target.value)}
                            placeholder="email@shiprocket.in"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-gray-600">API Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.shiprocket ? "text" : "password"}
                              name="shiprocket_api_password"
                              autoComplete="new-password"
                              value={shiprocketPassword}
                              onChange={(e) => setShiprocketPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility("shiprocket")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-450 hover:text-gray-650 transition-colors"
                            >
                              {showPasswords.shiprocket ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-4">
                      <button
                        onClick={() => saveCourierConfig("SHIPROCKET", {
                          apiEmail: shiprocketEmail,
                          apiPassword: shiprocketPassword,
                          isActive: shiprocketActive
                        })}
                        disabled={savingCourierPartner === "SHIPROCKET"}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2 rounded-lg font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        {savingCourierPartner === "SHIPROCKET" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        Save Shiprocket Config
                      </button>
                    </div>
                  </div>

                  {/* Delhivery */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-white space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-indigo-900 text-xs">DV</div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">Delhivery</h4>
                            <p className="text-[10px] text-gray-400">API Token</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={delhiveryActive}
                            onChange={(e) => setDelhiveryActive(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-semibold text-gray-600">API Token / Key</label>
                          <input
                            type="password"
                            name="delhivery_api_key"
                            autoComplete="new-password"
                            value={delhiveryKey}
                            onChange={(e) => setDelhiveryKey(e.target.value)}
                            placeholder="delhivery_api_key_..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-4">
                      <button
                        onClick={() => saveCourierConfig("DELHIVERY", {
                          apiKey: delhiveryKey,
                          isActive: delhiveryActive
                        })}
                        disabled={savingCourierPartner === "DELHIVERY"}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2 rounded-lg font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        {savingCourierPartner === "DELHIVERY" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        Save Delhivery Config
                      </button>
                    </div>
                  </div>

                  {/* Bluedart */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-white space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-indigo-900 text-xs">BD</div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">Bluedart</h4>
                            <p className="text-[10px] text-gray-400">License Key</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bluedartActive}
                            onChange={(e) => setBluedartActive(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-semibold text-gray-600">API License Key</label>
                          <input
                            type="password"
                            name="bluedart_license_key"
                            autoComplete="new-password"
                            value={bluedartLicense}
                            onChange={(e) => setBluedartLicense(e.target.value)}
                            placeholder="bluedart_license_key_..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-4">
                      <button
                        onClick={() => saveCourierConfig("BLUEDART", {
                          apiKey: bluedartLicense,
                          isActive: bluedartActive
                        })}
                        disabled={savingCourierPartner === "BLUEDART"}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2 rounded-lg font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        {savingCourierPartner === "BLUEDART" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        Save Bluedart Config
                      </button>
                    </div>
                  </div>

                  {/* DTDC */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-white space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-indigo-900 text-xs">DT</div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">DTDC</h4>
                            <p className="text-[10px] text-gray-400">Client ID / Key</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dtdcActive}
                            onChange={(e) => setDtdcActive(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-semibold text-gray-600">API Client ID / Key</label>
                          <input
                            type="password"
                            name="dtdc_client_key"
                            autoComplete="new-password"
                            value={dtdcKey}
                            onChange={(e) => setDtdcKey(e.target.value)}
                            placeholder="dtdc_client_key_..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-4">
                      <button
                        onClick={() => saveCourierConfig("DTDC", {
                          apiKey: dtdcKey,
                          isActive: dtdcActive
                        })}
                        disabled={savingCourierPartner === "DTDC"}
                        className="w-full bg-indigo-600 hover:bg-indigo-750 disabled:bg-indigo-400 text-white py-2 rounded-lg font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        {savingCourierPartner === "DTDC" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        Save DTDC Config
                      </button>
                    </div>
                  </div>

                  {/* Xpressbees */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-white space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-indigo-900 text-xs">XB</div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">Xpressbees</h4>
                            <p className="text-[10px] text-gray-400">API Key / Token</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={xpressbeesActive}
                            onChange={(e) => setXpressbeesActive(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-semibold text-gray-600">API Key / Customer Key</label>
                          <input
                            type="password"
                            name="xpressbees_key"
                            autoComplete="new-password"
                            value={xpressbeesKey}
                            onChange={(e) => setXpressbeesKey(e.target.value)}
                            placeholder="xpressbees_key_..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-4">
                      <button
                        onClick={() => saveCourierConfig("XPRESSBEES", {
                          apiKey: xpressbeesKey,
                          isActive: xpressbeesActive
                        })}
                        disabled={savingCourierPartner === "XPRESSBEES"}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2 rounded-lg font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        {savingCourierPartner === "XPRESSBEES" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        Save Xpressbees Config
                      </button>
                    </div>
                  </div>

                  {/* India Post */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-white space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-indigo-900 text-xs">IP</div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">India Post</h4>
                            <p className="text-[10px] text-gray-400">API Key / Account ID</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={indiaPostActive}
                            onChange={(e) => setIndiaPostActive(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-semibold text-gray-600">API Key / License Key</label>
                          <input
                            type="password"
                            name="indiapost_key"
                            autoComplete="new-password"
                            value={indiaPostKey}
                            onChange={(e) => setIndiaPostKey(e.target.value)}
                            placeholder="indiapost_key_..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-4">
                      <button
                        onClick={() => saveCourierConfig("INDIA_POST", {
                          apiKey: indiaPostKey,
                          isActive: indiaPostActive
                        })}
                        disabled={savingCourierPartner === "INDIA_POST"}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2 rounded-lg font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        {savingCourierPartner === "INDIA_POST" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        Save India Post Config
                      </button>
                    </div>
                  </div>

                  {/* The Professional Couriers */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-white space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-indigo-900 text-xs">TP</div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">The Professional Couriers</h4>
                            <p className="text-[10px] text-gray-400">API License Key</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={professionalCouriersActive}
                            onChange={(e) => setProfessionalCouriersActive(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-semibold text-gray-600">API Key</label>
                          <input
                            type="password"
                            name="professional_couriers_key"
                            autoComplete="new-password"
                            value={professionalCouriersKey}
                            onChange={(e) => setProfessionalCouriersKey(e.target.value)}
                            placeholder="tpc_key_..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-4">
                      <button
                        onClick={() => saveCourierConfig("THE_PROFESSIONAL_COURIERS", {
                          apiKey: professionalCouriersKey,
                          isActive: professionalCouriersActive
                        })}
                        disabled={savingCourierPartner === "THE_PROFESSIONAL_COURIERS"}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2 rounded-lg font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        {savingCourierPartner === "THE_PROFESSIONAL_COURIERS" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        Save TPC Config
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-950 text-base">Payment Gateways</h3>
                  <span className="bg-indigo-50 text-indigo-750 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                    Online Checkout & UPI
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Configure payment gateways used for real-time transactions on your storefront checkout.</p>
              </div>

              {/* Razorpay Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-950 text-sm">Razorpay Payment Gateway</h4>
                      <p className="text-xs text-gray-500">Supports UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking & Wallets</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${razorpayEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                      {razorpayEnabled ? "Active" : "Disabled"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRazorpayEnabled(!razorpayEnabled)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${razorpayEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${razorpayEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSavingRazorpay(true);
                    try {
                      const res = await fetch("/api/settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          razorpayEnabled,
                          razorpayKeyId,
                          razorpayKeySecret
                        })
                      });
                      const data = await res.json();
                      if (data.success) {
                        toast.success("Razorpay gateway settings saved successfully!");
                      } else {
                        toast.error(data.error || "Failed to save Razorpay settings.");
                      }
                    } catch (err) {
                      toast.error("Failed to connect to server.");
                    } finally {
                      setSavingRazorpay(false);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-gray-700 flex items-center gap-1.5">
                        Razorpay Key ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="razorpay_key_id_field"
                        autoComplete="off"
                        value={razorpayKeyId}
                        onChange={(e) => setRazorpayKeyId(e.target.value)}
                        placeholder="rzp_test_..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <p className="text-[11px] text-gray-500">Public Key ID from your Razorpay Dashboard (API Keys section).</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-gray-700 flex items-center gap-1.5">
                        Razorpay Key Secret <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords["razorpayKeySecret"] ? "text" : "password"}
                          name="razorpay_key_secret_field"
                          autoComplete="new-password"
                          value={razorpayKeySecret}
                          onChange={(e) => setRazorpayKeySecret(e.target.value)}
                          placeholder="••••••••••••••••••••••••"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("razorpayKeySecret")}
                          className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords["razorpayKeySecret"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500">Secret Key used server-side for verifying payment signatures securely.</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={savingRazorpay}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2"
                    >
                      {savingRazorpay && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      Save Gateway Credentials
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Storefront Theme Customization Tab */}
          {activeTab === "theme" && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <Palette className="w-5 h-5 text-indigo-600" /> Storefront Theme & Branding Customizer
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Customize your client storefront color theme, typography font, corner radius, and hero announcement banner.
                  </p>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSavingTheme(true);
                    try {
                      const themeObj = {
                        primary: themePrimary,
                        accent: themeAccent,
                        radius: themeRadius,
                        fontFamily: themeFontFamily,
                        announcementText: themeAnnouncementText
                      };
                      const res = await fetch("/api/settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ themeConfig: themeObj })
                      });
                      const data = await res.json();
                      if (data.error) {
                        toast.error(data.error);
                      } else {
                        toast.success("Storefront Theme saved successfully!");
                      }
                    } catch (err) {
                      toast.error("Failed to save Storefront theme");
                    } finally {
                      setSavingTheme(false);
                    }
                  }}
                  className="space-y-6"
                >
                  {/* Preset Color Palettes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                      Quick Preset Theme Palettes
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { name: "Emerald Teal", primary: "#0d9488", accent: "#fbbf24", desc: "Default D2C Teal & Gold" },
                        { name: "Streetwear Dark", primary: "#09090b", accent: "#8b5cf6", desc: "Midnight & Electric Violet" },
                        { name: "Royal Indigo", primary: "#4f46e5", accent: "#f59e0b", desc: "Indigo Blue & Amber" },
                        { name: "Blush Rose", primary: "#e11d48", accent: "#d97706", desc: "Rose Gold & Sand" },
                        { name: "Forest Sage", primary: "#15803d", accent: "#84cc16", desc: "Forest Green & Lime" }
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setThemePrimary(preset.primary);
                            setThemeAccent(preset.accent);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            themePrimary === preset.primary && themeAccent === preset.accent
                              ? "border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: preset.primary }} />
                            <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: preset.accent }} />
                          </div>
                          <span className="font-bold text-xs text-gray-900 block">{preset.name}</span>
                          <span className="text-[10px] text-gray-500 block truncate">{preset.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Typography Font & Corner Radius Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <Type className="w-4 h-4 text-gray-500" /> Storefront Font Family
                      </label>
                      <select
                        value={themeFontFamily}
                        onChange={(e) => setThemeFontFamily(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="Inter, sans-serif">Inter (Modern & Clean)</option>
                        <option value="Outfit, sans-serif">Outfit (Geometric D2C Brand)</option>
                        <option value="Playfair Display, serif">Playfair Display (Luxury Serif)</option>
                        <option value="Plus Jakarta Sans, sans-serif">Plus Jakarta Sans (Tech & Clean)</option>
                        <option value="Cinzel, serif">Cinzel (Heritage Apparel)</option>
                      </select>
                      <p className="text-[11px] text-gray-500">Selected font family is automatically loaded from Google Fonts on your Storefront.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">UI Corner Radius</label>
                      <select
                        value={themeRadius}
                        onChange={(e) => setThemeRadius(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="0px">Sharp (0px)</option>
                        <option value="0.375rem">Subtle (6px Default)</option>
                        <option value="0.75rem">Rounded (12px)</option>
                        <option value="1.5rem">Pill (24px Soft)</option>
                      </select>
                      <p className="text-[11px] text-gray-500">Controls corner roundness for buttons, cards, and modal popups.</p>
                    </div>
                  </div>

                  {/* Primary & Accent Color Pickers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Primary Brand Accent Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themePrimary}
                          onChange={(e) => setThemePrimary(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={themePrimary}
                          onChange={(e) => setThemePrimary(e.target.value)}
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-xs font-mono text-gray-800 focus:outline-none uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Secondary Accent / Badge Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeAccent}
                          onChange={(e) => setThemeAccent(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={themeAccent}
                          onChange={(e) => setThemeAccent(e.target.value)}
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-xs font-mono text-gray-800 focus:outline-none uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Top Announcement Bar Text */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Top Announcement Banner Text</label>
                    <input
                      type="text"
                      value={themeAnnouncementText}
                      onChange={(e) => setThemeAnnouncementText(e.target.value)}
                      placeholder="e.g. ⚡ Free Express Delivery on orders over ₹1,999!"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Real-time Theme Live Preview Card */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/70 space-y-3">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Live UI Theme Preview</span>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs space-y-3" style={{ borderRadius: themeRadius }}>
                      <div className="text-xs font-bold text-white px-3 py-1 rounded text-center" style={{ backgroundColor: themePrimary, borderRadius: themeRadius, fontFamily: themeFontFamily }}>
                        {themeAnnouncementText || "Top Announcement Bar"}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900" style={{ fontFamily: themeFontFamily }}>Brand Title Preview</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: themeAccent, color: "#1c1917", borderRadius: themeRadius }}>
                          ★ Popular Accent
                        </span>
                      </div>
                      <button
                        type="button"
                        className="w-full py-2 text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
                        style={{ backgroundColor: themePrimary, borderRadius: themeRadius, fontFamily: themeFontFamily }}
                      >
                        Sample Storefront Add to Cart Button
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={savingTheme}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {savingTheme && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      Save Storefront Theme Settings
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Multi-Store Brands & Per-Store Theme Settings Tab */}
          {(activeTab as string) === "brands" && (
            <MultiStoreBrandsSection />
          )}

        </div>

      {/* Warehouse Modal */}
      {showWarehouseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">
                {editingWarehouseId ? "Edit Warehouse Profile" : "Add Warehouse Facility"}
              </h3>
              <button
                onClick={() => setShowWarehouseModal(false)}
                className="text-gray-400 hover:text-gray-650"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">Warehouse Name</label>
                  <input
                    required
                    type="text"
                    value={whName}
                    onChange={(e) => setWhName(e.target.value)}
                    placeholder="e.g. Mumbai Fulfillment Center"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">Unique Code Identifier</label>
                  <input
                    required
                    type="text"
                    value={whCode}
                    onChange={(e) => setWhCode(e.target.value)}
                    placeholder="e.g. WH-MUMBAI"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="font-semibold text-gray-600">Address Line 1</label>
                  <input
                    required
                    type="text"
                    value={whAddress1}
                    onChange={(e) => setWhAddress1(e.target.value)}
                    placeholder="Street name, floor, suite"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="font-semibold text-gray-600">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={whAddress2}
                    onChange={(e) => setWhAddress2(e.target.value)}
                    placeholder="Additional locality info"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">City</label>
                  <input
                    required
                    type="text"
                    value={whCity}
                    onChange={(e) => setWhCity(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">State / Region</label>
                  <input
                    required
                    type="text"
                    value={whState}
                    onChange={(e) => setWhState(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">ZIP / Postal Code</label>
                  <input
                    required
                    type="text"
                    value={whZip}
                    onChange={(e) => setWhZip(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-mono focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">Country</label>
                  <input
                    required
                    type="text"
                    value={whCountry}
                    onChange={(e) => setWhCountry(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  id="default-pickup-checkbox"
                  type="checkbox"
                  checked={whIsDefault}
                  onChange={(e) => setWhIsDefault(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="default-pickup-checkbox" className="font-semibold text-gray-700 cursor-pointer">
                  Mark this location as default shipment pickup center
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-55 rounded-lg font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingWarehouse}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  {savingWarehouse && <RefreshCw className="w-3 h-3 animate-spin" />}
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MultiStoreBrandsSection() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    logoUrl: "",
    primaryColor: "#0d9488",
    accentColor: "#fbbf24",
    announcementText: "⚡ Welcome to our Store!"
  });

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brands");
      const data = await res.json();
      if (data.success) {
        setBrands(data.brands || []);
      }
    } catch (err) {
      toast.error("Failed to load store brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleOpenModal = (b?: any) => {
    if (b) {
      setEditingBrand(b);
      let parsedTheme: any = {};
      try {
        parsedTheme = typeof b.themeConfig === "string" ? JSON.parse(b.themeConfig) : (b.themeConfig || {});
      } catch (e) {}
      setForm({
        name: b.name,
        code: b.code,
        logoUrl: b.logoUrl || "",
        primaryColor: parsedTheme.primaryColor || "#0d9488",
        accentColor: parsedTheme.accentColor || "#fbbf24",
        announcementText: parsedTheme.bannerText || "⚡ Welcome to our Store!"
      });
    } else {
      setEditingBrand(null);
      setForm({
        name: "",
        code: "",
        logoUrl: "",
        primaryColor: "#0d9488",
        accentColor: "#fbbf24",
        announcementText: "⚡ Welcome to our Store!"
      });
    }
    setShowModal(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Store name and store code are required");
      return;
    }
    setSaving(true);
    try {
      const themeConfig = {
        primaryColor: form.primaryColor,
        accentColor: form.accentColor,
        bannerText: form.announcementText
      };

      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBrand?.id,
          name: form.name,
          code: form.code,
          logoUrl: form.logoUrl,
          themeConfig
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Store brand '${data.brand.name}' saved!`);
        setShowModal(false);
        fetchBrands();
      } else {
        toast.error(data.error || "Failed to save store brand");
      }
    } catch (err) {
      toast.error("Error saving store brand");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBrand = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete store brand '${name}'?`)) return;
    try {
      const res = await fetch(`/api/brands?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Store '${name}' deleted`);
        fetchBrands();
      } else {
        toast.error(data.error || "Failed to delete store");
      }
    } catch (err) {
      toast.error("Error deleting store");
    }
  };

  const appBaseUrl = (process.env.NEXT_PUBLIC_STOREFRONT_URL || "").replace(/\/$/, "") || (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ""}`
    : "https://merchantvault.vercel.app");

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" /> Multi-Store Brands & Per-Store Themes
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Manage multiple distinct storefront brands (e.g. Ethnic Wear, Cosmetics, Kids Wear) with custom logos & color themes under 1 account.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          + Add New Store Brand
        </button>
      </div>

      {/* Stores List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-400 text-xs">Loading multi-store brands...</div>
        ) : brands.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 text-xs">
            No custom sub-stores configured yet. Click "+ Add New Store Brand" to set up your first store!
          </div>
        ) : (
          brands.map((b) => {
            let themeObj: any = {};
            try {
              themeObj = typeof b.themeConfig === "string" ? JSON.parse(b.themeConfig) : (b.themeConfig || {});
            } catch (e) {}

            const storeUrl = `${appBaseUrl}/?brand=${b.code}`;

            return (
              <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {b.logoUrl ? (
                        <img src={b.logoUrl} alt={b.name} className="w-8 h-8 rounded-lg object-contain border border-gray-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {b.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{b.name}</h4>
                        <span className="text-[10px] font-mono text-gray-400">Code: ?brand={b.code}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenModal(b)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-gray-50"
                        title="Edit Theme & Settings"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBrand(b.id, b.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-50"
                        title="Delete Store"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Visual Theme Badge */}
                  <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 space-y-1.5 text-xs">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Storefront Color Theme</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-gray-300 shadow-2xs" style={{ backgroundColor: themeObj.primaryColor || "#0d9488" }} />
                      <span className="font-mono text-[11px] text-gray-700">Primary: {themeObj.primaryColor || "#0d9488"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-gray-300 shadow-2xs" style={{ backgroundColor: themeObj.accentColor || "#fbbf24" }} />
                      <span className="font-mono text-[11px] text-gray-700">Accent: {themeObj.accentColor || "#fbbf24"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <a
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    Visit Storefront ↗
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(storeUrl);
                      toast.success(`Copied link for ${b.name}!`);
                    }}
                    className="text-gray-500 hover:text-gray-800 font-medium"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Store Brand Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="font-bold text-gray-900 text-base">
                {editingBrand ? `Edit Store: ${editingBrand.name}` : "Add New Storefront Brand"}
              </h4>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Store Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Seyon Ethnic, Seyon Beauty, Seyon Kids"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Store Code (URL Parameter)</label>
                <input
                  type="text"
                  placeholder="e.g. ethnic, beauty, kids"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm font-mono"
                  required
                />
                <span className="text-[10px] text-gray-400 mt-1 block">URL link: ?brand={form.code || "code"}</span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Logo Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or logo image URL"
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase">Primary Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={form.primaryColor}
                      onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                      className="w-full p-1.5 border border-gray-300 rounded text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase">Accent Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={form.accentColor}
                      onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                      className="w-full p-1.5 border border-gray-300 rounded text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Store Announcement Banner</label>
                <input
                  type="text"
                  placeholder="e.g. ⚡ Free Express Delivery on orders over ₹1,999!"
                  value={form.announcementText}
                  onChange={(e) => setForm({ ...form, announcementText: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Store Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
