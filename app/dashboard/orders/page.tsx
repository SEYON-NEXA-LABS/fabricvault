"use client";

import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  ArrowRight, 
  FileCheck, 
  Sparkles,
  ChevronRight,
  ShieldAlert,
  MapPin,
  RefreshCw,
  CornerDownRight,
  Boxes,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { Order, Warehouse } from "@/types/all";



interface StockTransfer {
  id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  variantId: string;
  quantity: number;
  status: "PENDING" | "SENT" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  variant: { sku: string; title: string; size: string; color: string } | null;
  fromWarehouse: { name: string; code: string } | null;
  toWarehouse: { name: string; code: string } | null;
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "DELIVERED" | "RETURNS">("ACTIVE");
  
  // Tab-specific cached lists
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [returnedOrders, setReturnedOrders] = useState<Order[]>([]);
  
  const [tabCounts, setTabCounts] = useState({ active: 0, delivered: 0, returns: 0 });
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simulatingRefund, setSimulatingRefund] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Multiple filters
  const [codFilter, setCodFilter] = useState("All");
  const [courierFilter, setCourierFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Selected Order for detail view / fulfillment
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Reset page when filters or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, codFilter, courierFilter, riskFilter, activeTab]);
  
  // Fulfillment Wizard state
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [fulfillmentStep, setFulfillmentStep] = useState(1);
  const [scannedSku, setScannedSku] = useState("");
  const [targetVariant, setTargetVariant] = useState<any>({ id: "", sku: "TSH-COT-01-W-S", name: "Seyon Classic Cotton Tee (White/S)", currentStockLevel: 0, stocks: [] });
  const [selectedCourier, setSelectedCourier] = useState("Delhivery");
  const [awbNumber, setAwbNumber] = useState("");

  // Warehouse context & Stock Transfer states
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  
  // Split Fulfillment & Transfer wizard inputs
  const [showSplitAlert, setShowSplitAlert] = useState(false);
  const [splitQuantities, setSplitQuantities] = useState<{ [whId: string]: number }>({});
  
  const [transferSourceWh, setTransferSourceWh] = useState("");
  const [transferDestWh, setTransferDestWh] = useState("");
  const [transferQty, setTransferQty] = useState(1);
  const [processingTransfer, setProcessingTransfer] = useState(false);

  // Load basic configurations
  const loadConfig = async () => {
    try {
      let whs = [];
      const cachedWhs = localStorage.getItem("seyon:warehouses");
      if (cachedWhs) {
        whs = JSON.parse(cachedWhs);
      } else {
        const res = await fetch("/api/warehouses");
        whs = await res.json();
        if (Array.isArray(whs)) {
          localStorage.setItem("seyon:warehouses", JSON.stringify(whs));
        }
      }

      if (Array.isArray(whs)) {
        setWarehouses(whs);
        if (whs.length > 0) {
          const defaultWh = whs.find(w => w.isDefaultPickup) || whs[0];
          setTransferDestWh(defaultWh.id);
          // Set a default source different from destination if possible
          const otherWh = whs.find(w => w.id !== defaultWh.id) || whs[0];
          setTransferSourceWh(otherWh.id);
        }
      }
    } catch (err) {
      console.error("Failed to load warehouses");
    }
  };

  const fetchCounts = async () => {
    try {
      const res = await fetch("/api/orders/counts");
      const data = await res.json();
      if (data && typeof data.active === "number") {
        setTabCounts(data);
      }
    } catch (err) {
      console.error("Failed to load order counts", err);
    }
  };

  const fetchOrders = async (type: "active" | "delivered" | "returns") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?type=${type}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        if (type === "active") setActiveOrders(data);
        else if (type === "delivered") setDeliveredOrders(data);
        else if (type === "returns") setReturnedOrders(data);
      }
    } catch (error) {
      toast.error(`Failed to load ${type} orders`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransfers = async () => {
    setLoadingTransfers(true);
    try {
      const res = await fetch("/api/warehouses/transfers");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTransfers(data);
      }
    } catch (error) {
      console.error("Failed to load transfers");
    } finally {
      setLoadingTransfers(false);
    }
  };

  const refreshCurrentTab = (tab: "ACTIVE" | "DELIVERED" | "RETURNS") => {
    fetchCounts();
    if (tab === "ACTIVE") fetchOrders("active");
    else if (tab === "DELIVERED") fetchOrders("delivered");
    else if (tab === "RETURNS") fetchOrders("returns");
  };

  useEffect(() => {
    loadConfig();
    fetchCounts();
    fetchOrders("active");
    fetchTransfers();
  }, []);

  const handleTabChange = (newTab: "ACTIVE" | "DELIVERED" | "RETURNS") => {
    setActiveTab(newTab);
    if (newTab === "ACTIVE" && activeOrders.length === 0) {
      fetchOrders("active");
    } else if (newTab === "DELIVERED" && deliveredOrders.length === 0) {
      fetchOrders("delivered");
    } else if (newTab === "RETURNS" && returnedOrders.length === 0) {
      fetchOrders("returns");
    }
  };  const simulateOrder = async () => {
    setSimulating(true);
    try {
      const res = await fetch("/api/orders?simulate=true");
      const data = await res.json();
      if (data.success) {
        toast.success(`New order ${data.order.orderNumber} ingested!`);
        refreshCurrentTab(activeTab);
      } else {
        toast.error("Failed to ingest mock order");
      }
    } catch (err) {
      toast.error("Error simulating order creation");
    } finally {
      setSimulating(false);
    }
  };

  const simulateRefund = async () => {
    setSimulatingRefund(true);
    try {
      const res = await fetch("/api/webhooks/shopify/refunds-create");
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Shopify Return Simulated! Inventory restocked.");
        refreshCurrentTab(activeTab);
      } else {
        toast.error(data.error || "Failed to simulate Shopify refund");
      }
    } catch (err) {
      toast.error("Error simulating Shopify refund");
    } finally {
      setSimulatingRefund(false);
    }
  };

  const handleCodVerify = async (orderId: string, status: string) => {
    try {
      const res = await fetch("/api/orders/cod-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`COD status updated to ${status}`);
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev: Order | null) => prev ? { ...prev, codVerificationStatus: status } : null);
        }

        refreshCurrentTab(activeTab);
      } else {
        toast.error(data.error || "Failed to update COD verification");
      }
    } catch (err) {
      toast.error("Error updating COD verification");
    }
  };

  // Generate random AWB number
  const autoGenerateAwb = () => {
    const carrierCode = selectedCourier.slice(0, 3).toUpperCase();
    const randNum = Math.floor(100000000 + Math.random() * 900000000);
    setAwbNumber(`${carrierCode}${randNum}`);
  };

  // Check stocks for the selected item
  const checkItemStocks = async () => {
    try {
      const res = await fetch("/api/inventory");
      const variants = await res.json();
      if (Array.isArray(variants) && variants.length > 0) {
        // Choose a variant with stocks split
        const randomDbVar = variants.find(v => v.stocks && v.stocks.length > 1) || variants[0];
        setTargetVariant({
          id: randomDbVar.id,
          sku: randomDbVar.sku,
          name: `${randomDbVar.title} (${randomDbVar.color}/${randomDbVar.size})`,
          currentStockLevel: randomDbVar.currentStockLevel,
          stocks: randomDbVar.stocks
        });

        // Initialize split quantities
        const initialSplits: any = {};
        randomDbVar.stocks.forEach((s: any) => {
          initialSplits[s.warehouseId] = 0;
        });
        setSplitQuantities(initialSplits);

        // Check if stock is split and insufficient at the default warehouse
        const defaultWh = warehouses.find(w => w.id === selectedOrder?.warehouseId) || warehouses[0];
        const defaultStock = randomDbVar.stocks.find((s: any) => s.warehouseId === defaultWh?.id)?.currentStockLevel || 0;
        
        // Let's assume the order requires 3 units
        if (defaultStock < 3) {
          setShowSplitAlert(true);
        } else {
          setShowSplitAlert(false);
        }
      }
    } catch (err) {
      console.error("Failed to fetch item stocks");
    }
  };

  const handleVerifySku = () => {
    const rawInput = scannedSku.trim().toUpperCase();
    let skuToVerify = rawInput;

    // Support unique serialized QR tokens (syn:wh:sku:serial)
    if (rawInput.startsWith("syn:")) {
      const parts = rawInput.split(":");
      if (parts.length >= 3) {
        skuToVerify = parts[2];
      }
    }

    if (skuToVerify === targetVariant.sku.toUpperCase()) {
      toast.success("SKU Verified! Item match confirmed.");
      setFulfillmentStep(2);
    } else {
      toast.error("SKU Mismatch! Please verify package item.");
    }
  };

  const handleCompleteFulfillment = async () => {
    if (!awbNumber) {
      toast.error("Please provide or generate an AWB number");
      return;
    }
    
    try {
      const res = await fetch("/api/orders/fulfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder?.id,
          awbNumber,
          courierPartner: selectedCourier
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Order ${selectedOrder?.orderNumber} Dispatched & Synced with Shopify.`);
        setIsFulfilling(false);
        setFulfillmentStep(1);
        setScannedSku("");
        setAwbNumber("");
        setSelectedOrder(data.order);
        refreshCurrentTab(activeTab);
      } else {
        toast.error(data.error || "Fulfillment update failed");
      }
    } catch (err) {
      toast.error("Network error during fulfillment");
    }
  };
  // Submit Stock Transfer request between warehouses
  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSourceWh || !transferDestWh || !targetVariant.id) {
      toast.error("Please choose source and destination warehouses.");
      return;
    }
    if (transferSourceWh === transferDestWh) {
      toast.error("Source and destination warehouses must be different.");
      return;
    }

    setProcessingTransfer(true);
    try {
      const res = await fetch("/api/warehouses/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWarehouseId: transferSourceWh,
          toWarehouseId: transferDestWh,
          variantId: targetVariant.id,
          quantity: transferQty,
          operatorEmail: "dispatcher@seyon.local"
        })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Inter-Warehouse Stock Transfer request initiated!");
        fetchTransfers();
        checkItemStocks(); // Reload stock context
      }
    } catch (err) {
      toast.error("Failed to process stock transfer request.");
    } finally {
      setProcessingTransfer(false);
    }
  };

  // Simulate warehouse completing transfer request
  const handleExecuteTransferStatus = async (transferId: string, status: string) => {
    try {
      const res = await fetch("/api/warehouses/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: transferId,
          status
        })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(`Transfer status updated to ${status}!`);
        fetchTransfers();
        checkItemStocks(); // Reload stocks
      }
    } catch (err) {
      toast.error("Failed to update transfer status.");
    }
  };

  // Handle split allocation submission
  const handleConfirmSplitFulfillment = () => {
    const totalAssigned = Object.values(splitQuantities).reduce((a, b) => a + b, 0);
    // Assume 3 units ordered
    if (totalAssigned !== 3) {
      toast.error(`Please allocate exactly 3 units across warehouses. Currently allocated: ${totalAssigned} units.`);
      return;
    }
    
    // Check if each warehouse has sufficient stock for the assigned split
    let hasSufficient = true;
    Object.entries(splitQuantities).forEach(([whId, qty]) => {
      const whStock = targetVariant.stocks.find((s: any) => s.warehouseId === whId)?.currentStockLevel || 0;
      if (qty > whStock) {
        hasSufficient = false;
        const whName = warehouses.find(w => w.id === whId)?.name || "Warehouse";
        toast.error(`Insufficient stock at ${whName}. Required: ${qty}, Available: ${whStock}`);
      }
    });

    if (!hasSufficient) return;

    toast.success("Split allocation verified! Proceeding to pick items.");
    setShowSplitAlert(false);
  };

  const getOrdersForActiveTab = () => {
    if (activeTab === "ACTIVE") return activeOrders;
    if (activeTab === "DELIVERED") return deliveredOrders;
    if (activeTab === "RETURNS") return returnedOrders;
    return [];
  };

  // Reset page when filters or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, codFilter, courierFilter, riskFilter, sourceFilter, activeTab]);

  const filteredOrders = getOrdersForActiveTab().filter(ord => {
    const matchesSearch = 
      ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.awbNumber && ord.awbNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCod = codFilter === "All" || (ord.codVerificationStatus || "PENDING") === codFilter;

    let matchesCourier = true;
    if (courierFilter !== "All") {
      if (courierFilter === "UNASSIGNED") {
        matchesCourier = !ord.courierPartner;
      } else {
        matchesCourier = ord.courierPartner?.toLowerCase() === courierFilter.toLowerCase();
      }
    }

    let matchesRisk = true;
    if (riskFilter !== "All") {
      const address = ord.shippingAddressLine1 || "";
      const isShortAddress = address.length < 15;
      const isBadZip = ord.shippingZip && ord.shippingZip.trim().length !== 6;
      const codStatus = ord.codVerificationStatus || "PENDING";
      let calculatedRisk = "LOW";
      if (codStatus === "CANCELLED") {
        calculatedRisk = "CRITICAL";
      } else if (isShortAddress || isBadZip || codStatus === "UNREACHABLE") {
        calculatedRisk = "HIGH";
      } else if (codStatus === "PENDING") {
        calculatedRisk = "MEDIUM";
      }
      
      const riskScore = (ord.rtoRiskScore || calculatedRisk).toUpperCase();
      matchesRisk = riskScore === riskFilter.toUpperCase();
    }

    const effectiveSource = ord.orderSource || (ord.shopifyOrderId?.startsWith("storefront-") ? "STOREFRONT" : "SHOPIFY");
    const matchesSource = sourceFilter === "All" || effectiveSource.toUpperCase() === sourceFilter.toUpperCase();
    
    return matchesSearch && matchesCod && matchesCourier && matchesRisk && matchesSource;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" /> Orders Directory
            </span>
            <span className="text-gray-400 text-xs">•</span>
            <span className="text-xs text-gray-500 font-mono">Shopify Sales Channel Integration</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Order Fulfillment Board</h1>
          <p className="text-sm text-gray-500">
            Verify picked item SKU barcodes, assign parcel courier configurations, and dispatch tracking IDs directly back to Shopify.
          </p>
        </div>
        {process.env.NODE_ENV === "development" && (
          <div className="flex items-center gap-3">
            <button 
              onClick={simulateOrder}
              disabled={simulating}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {simulating ? "Simulating..." : "Simulate Shopify Order (3 units)"}
            </button>
            <button 
              onClick={simulateRefund}
              disabled={simulatingRefund}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${simulatingRefund ? "animate-spin" : ""}`} />
              {simulatingRefund ? "Refunding..." : "Simulate Shopify Return"}
            </button>
          </div>
        )}
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Orders Table Column */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-gray-50/50">
            <button
              onClick={() => handleTabChange("ACTIVE")}
              className={`flex-1 py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === "ACTIVE"
                  ? "border-indigo-600 text-indigo-600 bg-white font-extrabold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Active Orders
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "ACTIVE" ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-605"
              }`}>
                {tabCounts.active}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("DELIVERED")}
              className={`flex-1 py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === "DELIVERED"
                  ? "border-indigo-600 text-indigo-600 bg-white font-extrabold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Delivered
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "DELIVERED" ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-605"
              }`}>
                {tabCounts.delivered}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("RETURNS")}
              className={`flex-1 py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === "RETURNS"
                  ? "border-indigo-600 text-indigo-600 bg-white font-extrabold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Returns & RTO
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "RETURNS" ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-605"
              }`}>
                {tabCounts.returns}
              </span>
            </button>
          </div>

          {/* Filter Toolbar */}
          <div className="p-5 border-b border-gray-100 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search orders by Order #, Customer Name, or AWB..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={() => refreshCurrentTab(activeTab)}
                className="p-2 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center gap-1.5 text-xs font-semibold"
                title="Refresh current tab"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Dropdown Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order Source</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none w-full font-semibold text-gray-700"
                >
                  <option value="All">All Channels (Storefront & Shopify)</option>
                  <option value="STOREFRONT">Storefront Only</option>
                  <option value="SHOPIFY">Shopify Only</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">COD Verification</label>
                <select
                  value={codFilter}
                  onChange={(e) => setCodFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none w-full"
                >
                  <option value="All">All Verification Statuses</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="PENDING">Pending</option>
                  <option value="UNREACHABLE">Unreachable</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Courier Partner</label>
                <select
                  value={courierFilter}
                  onChange={(e) => setCourierFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none w-full"
                >
                  <option value="All">All Couriers</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="Bluedart">Bluedart</option>
                  <option value="FedEx">FedEx</option>
                  <option value="DTDC">DTDC</option>
                  <option value="UNASSIGNED">Unassigned</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">RTO Risk Score</label>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none w-full"
                >
                  <option value="All">All Risk Levels</option>
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk</option>
                  <option value="CRITICAL">Critical Risk</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-medium text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-5">Order Details</th>
                  <th className="py-3.5 px-5">Order Source</th>
                  <th className="py-3.5 px-5">Customer Info</th>
                  <th className="py-3.5 px-5">Weight</th>
                  <th className="py-3.5 px-5">AWB / Courier</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">Loading orders...</td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">No orders found. Synchronize Shopify sales channel or create manual orders.</td>
                  </tr>
                ) : (
                  paginatedOrders.map(ord => {
                    const active = selectedOrder?.id === ord.id;
                    const isShopifyId = ord.shopifyOrderId?.startsWith('sh-') || ord.shopifyOrderId?.includes('gid://shopify/');
                    const sourceVal = ord.orderSource ? ord.orderSource : (isShopifyId ? 'SHOPIFY' : 'STOREFRONT');
                    return (
                      <tr 
                        key={ord.id}
                        onClick={() => {
                          setSelectedOrder(ord);
                          setIsFulfilling(false);
                        }}
                        className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                          active ? "bg-indigo-50/40 hover:bg-indigo-50/40" : ""
                        }`}
                      >
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-gray-900">{ord.orderNumber}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{ord.shopifyOrderId}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {(() => {
                              const address = ord.shippingAddressLine1 || "";
                              const isShortAddress = address.length < 15;
                              const isBadZip = ord.shippingZip && ord.shippingZip.trim().length !== 6;
                              const codStatus = ord.codVerificationStatus || "PENDING";
                              let risk = { label: "LOW RISK", class: "bg-emerald-50 text-emerald-700 border border-emerald-250/30" };
                              
                              if (ord.paymentStatus === "PAID") {
                                risk = { label: "LOW RISK", class: "bg-emerald-55 text-emerald-850 border border-emerald-250" };
                              } else if (codStatus === "CANCELLED") {
                                risk = { label: "CRITICAL", class: "bg-red-100 text-red-800 border border-red-300 font-extrabold" };
                              } else if (isShortAddress || isBadZip || codStatus === "UNREACHABLE") {
                                risk = { label: "HIGH RISK", class: "bg-rose-50 text-rose-700 border border-rose-250/30" };
                              } else if (codStatus === "PENDING") {
                                risk = { label: "MEDIUM RISK", class: "bg-amber-50 text-amber-700 border border-amber-250/30" };
                              }
                              return (
                                <>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${risk.class}`}>
                                    {risk.label}
                                  </span>
                                  {ord.couponCode && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                                      🏷️ {ord.couponCode} (-₹{ord.discountAmount || 0})
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              ord.paymentStatus === "PAID" ? "bg-indigo-50 text-indigo-750 border-indigo-200" :
                              ord.codVerificationStatus === "VERIFIED" ? "bg-emerald-50 text-emerald-700 border-emerald-250/30" :
                              ord.codVerificationStatus === "UNREACHABLE" ? "bg-rose-50 text-rose-700 border-rose-250/30" :
                              ord.codVerificationStatus === "CANCELLED" ? "bg-red-50 text-red-700 border-red-250/30" :
                              "bg-slate-50 text-slate-600 border-slate-200"
                            }`}>
                              {ord.paymentStatus === "PAID" ? "PREPAID" : `COD: ${ord.codVerificationStatus || "PENDING"}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border tracking-wider ${
                            sourceVal === 'STOREFRONT'
                              ? 'bg-teal-50 text-teal-700 border-teal-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {sourceVal}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <p className="font-semibold text-gray-800">{ord.customerName}</p>
                          <p className="text-xs text-gray-500">{ord.customerPhone}</p>
                        </td>
                        <td className="py-3.5 px-5 font-mono text-xs text-gray-600">{ord.totalWeightKg} kg</td>
                        <td className="py-3.5 px-5">
                          {ord.awbNumber ? (
                            <div>
                              <p className="font-semibold text-gray-850 font-mono text-xs">{ord.awbNumber}</p>
                              <p className="text-[10px] text-gray-400">{ord.courierPartner}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            ord.deliveryStatus === "PROCESSING" ? "bg-indigo-50 text-indigo-700" :
                            ord.deliveryStatus === "SHIPPED" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {ord.deliveryStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button className="text-gray-400 hover:text-indigo-950 p-1">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
              <p className="text-xs text-gray-500 font-medium font-sans">
                Showing <span className="font-bold text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
                <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of{" "}
                <span className="font-bold text-gray-900">{filteredOrders.length}</span> orders
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg text-xs shadow-sm transition-all disabled:opacity-50 select-none cursor-pointer"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const active = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center select-none cursor-pointer ${
                        active 
                          ? "bg-indigo-600 text-white shadow-sm" 
                          : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg text-xs shadow-sm transition-all disabled:opacity-50 select-none cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Inter-Warehouse Transfers Audit Log */}
          <div className="border-t border-gray-200 p-5 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-600" />
              Inter-Warehouse Communications (Transfers Feed)
            </h3>
            {loadingTransfers ? (
              <div className="text-center py-6 text-xs text-gray-400">Loading transfers...</div>
            ) : transfers.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-450 border border-dashed border-gray-200 rounded-lg">
                No active inter-warehouse stock transfer requests logged.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {transfers.map((tf) => (
                  <div key={tf.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-gray-900">
                        <span>{tf.variant?.title || "Product SKU"}</span>
                        <span className="bg-gray-150 border border-gray-200 font-mono text-[9px] px-1 rounded">
                          {tf.variant?.sku}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                        <span className="font-semibold">{tf.fromWarehouse?.name}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-semibold text-indigo-700">{tf.toWarehouse?.name}</span>
                        <span>•</span>
                        <span className="font-bold text-gray-700">Qty: {tf.quantity}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tf.status === "PENDING" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                        tf.status === "SENT" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                        tf.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        "bg-red-50 text-red-700"
                      }`}>
                        {tf.status}
                      </span>
                      
                      {tf.status === "PENDING" && (
                        <button
                          onClick={() => handleExecuteTransferStatus(tf.id, "SENT")}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded text-[10px] font-semibold"
                        >
                          Ship
                        </button>
                      )}
                      {tf.status === "SENT" && (
                        <button
                          onClick={() => handleExecuteTransferStatus(tf.id, "COMPLETED")}
                          className="bg-emerald-650 hover:bg-emerald-700 text-white px-2 py-0.5 rounded text-[10px] font-semibold"
                        >
                          Receive
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Panel Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 min-h-[350px]">
            {selectedOrder ? (
              <div className="space-y-6">
                {/* Order Meta */}
                <div className="border-b border-gray-100 pb-3 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{selectedOrder.orderNumber}</h3>
                    <p className="text-[10px] text-gray-400 font-mono">{selectedOrder.shopifyOrderId}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedOrder.deliveryStatus === "PROCESSING" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                    selectedOrder.deliveryStatus === "SHIPPED" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  }`}>
                    {selectedOrder.deliveryStatus}
                  </span>
                </div>

                {/* Shipping Details */}
                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Customer</span>
                    <p className="font-semibold text-gray-900 text-sm mt-0.5">{selectedOrder.customerName}</p>
                    <p className="text-gray-500">{selectedOrder.customerPhone}</p>
                  </div>
                  
                  {selectedOrder.shippingAddressLine1 && (
                    <div>
                      <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Shipping Address</span>
                      <p className="text-gray-800 mt-0.5 font-medium leading-relaxed">
                        {selectedOrder.shippingAddressLine1}
                        {selectedOrder.shippingAddressLine2 ? `, ${selectedOrder.shippingAddressLine2}` : ""}
                        <br />
                        {selectedOrder.shippingCity}, {selectedOrder.shippingState} - {selectedOrder.shippingZip}
                        <br />
                        {selectedOrder.shippingCountry}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Package Specification</span>
                    <p className="font-mono text-gray-900 mt-0.5">{selectedOrder.totalWeightKg} kg (Standard Parcel Box)</p>
                  </div>

                  {/* Visual Tracking Timeline */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                    <span className="text-gray-900 font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 border-b border-gray-200 pb-2">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      Logistics Tracking Timeline
                    </span>

                    <div className="relative pl-6 border-l-2 border-indigo-200 space-y-5 text-xs text-gray-700 ml-2">
                      {/* Step 1: Order Ingested */}
                      <div className="relative">
                        <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-white">
                          <CheckCircle2 className="w-3 h-3" />
                        </span>
                        <div>
                          <p className="font-bold text-gray-900">Order Placed & Ingested</p>
                          <p className="text-[10px] text-gray-500">Shopify API webhook synced successfully.</p>
                          <p className="text-[9px] text-gray-400 font-mono mt-0.5">ID: {selectedOrder.shopifyOrderId}</p>
                        </div>
                      </div>

                      {/* Step 2: COD/Prepaid Verification */}
                      <div className="relative">
                        {(() => {
                          const isPrepaid = selectedOrder.paymentStatus === "PAID";
                          const codStatus = selectedOrder.codVerificationStatus || "PENDING";
                          let iconColor = "bg-amber-400";
                          let title = "COD Verification: Pending";
                          let subtitle = "Waiting for customer call validation.";
                          
                          if (isPrepaid) {
                            iconColor = "bg-emerald-500";
                            title = "Payment Confirmed (Prepaid)";
                            subtitle = "Authorized via gateway. COD confirmation bypassed.";
                          } else if (codStatus === "VERIFIED") {
                            iconColor = "bg-emerald-500";
                            title = "COD Call Verified";
                            subtitle = "Order confirmed for logistics shipment.";
                          } else if (codStatus === "UNREACHABLE") {
                            iconColor = "bg-rose-500";
                            title = "COD Unreachable";
                            subtitle = "Attempted validation, customer unreachable.";
                          } else if (codStatus === "CANCELLED") {
                            iconColor = "bg-red-650";
                            title = "Order Cancelled";
                            subtitle = "Cancelled by operator due to failed confirmation.";
                          }
                          return (
                            <>
                              <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white ring-4 ring-white ${iconColor}`}>
                                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                              </span>
                              <div>
                                <p className="font-bold text-gray-900">{title}</p>
                                <p className="text-[10px] text-gray-500">{subtitle}</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Step 3: Packing & Verification */}
                      <div className="relative">
                        {(() => {
                          const isDone = selectedOrder.deliveryStatus !== "PROCESSING";
                          let iconColor = isDone ? "bg-emerald-500" : "bg-blue-500";
                          let title = isDone ? "Items Checked & Packed" : "Picking & SKU Verification";
                          let subtitle = isDone ? "Barcode scan check passed." : "Awaiting warehouse operator scan.";
                          return (
                            <>
                              <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white ring-4 ring-white ${iconColor}`}>
                                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                              </span>
                              <div>
                                <p className="font-bold text-gray-900">{title}</p>
                                <p className="text-[10px] text-gray-500">{subtitle}</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Step 4: Dispatch */}
                      <div className="relative">
                        {(() => {
                          const isDispatched = selectedOrder.awbNumber;
                          let iconColor = isDispatched ? "bg-emerald-500" : "bg-gray-300";
                          let title = isDispatched ? `Dispatched via ${selectedOrder.courierPartner}` : "Awaiting AWB Generation";
                          let subtitle = isDispatched ? `AWB: ${selectedOrder.awbNumber}` : "AWB tracking code unassigned.";
                          return (
                            <>
                              <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white ring-4 ring-white ${iconColor}`}>
                                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                              </span>
                              <div>
                                <p className="font-bold text-gray-900">{title}</p>
                                <p className="text-[10px] text-gray-500">{subtitle}</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Step 5: Final Delivery or Return/RTO */}
                      <div className="relative">
                        {(() => {
                          const status = selectedOrder.deliveryStatus;
                          let iconColor = "bg-gray-300";
                          let title = "Transit & Delivery";
                          let subtitle = "Package in transit to customer address.";
                          if (status === "DELIVERED") {
                            iconColor = "bg-emerald-650";
                            title = "Delivered successfully";
                            subtitle = "Delivered to buyer, Shopify order closed.";
                          } else if (status === "RTO_INITIATED") {
                            iconColor = "bg-amber-500";
                            title = "RTO Initiated";
                            subtitle = "Undelivered package returning to origin.";
                          } else if (status === "RTO_RECEIVED") {
                            iconColor = "bg-rose-500";
                            title = "RTO Received (Inventory Restocked)";
                            subtitle = "Package received at warehouse. Shelf counts incremented (+3 units).";
                          }
                          return (
                            <>
                              <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white ring-4 ring-white ${iconColor}`}>
                                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                              </span>
                              <div>
                                <p className="font-bold text-gray-900">{title}</p>
                                <p className="text-[10px] text-gray-500">{subtitle}</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RTO Risk & COD Verification Panel */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-bold text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-indigo-600" />
                      RTO Risk & Pre-Dispatch
                    </span>
                    {(() => {
                      const address = selectedOrder.shippingAddressLine1 || "";
                      const isShortAddress = address.length < 15;
                      const isBadZip = selectedOrder.shippingZip && selectedOrder.shippingZip.trim().length !== 6;
                      const codStatus = selectedOrder.codVerificationStatus || "PENDING";
                      
                      let risk = { label: "LOW RISK", class: "bg-emerald-50 text-emerald-700 border border-emerald-250/30" };
                      if (codStatus === "CANCELLED") {
                        risk = { label: "CRITICAL", class: "bg-red-100 text-red-800 border border-red-300 font-extrabold" };
                      } else if (isShortAddress || isBadZip || codStatus === "UNREACHABLE") {
                        risk = { label: "HIGH RISK", class: "bg-rose-50 text-rose-700 border border-rose-250/30" };
                      } else if (codStatus === "PENDING") {
                        risk = { label: "MEDIUM RISK", class: "bg-amber-50 text-amber-700 border border-amber-250/30" };
                      }
                      
                      return (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${risk.class}`}>
                          {risk.label}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Risk Markers */}
                  <div className="text-[11px] text-gray-655 space-y-1 bg-white p-2.5 rounded-lg border border-gray-150">
                    <p className="font-semibold text-gray-700">Risk Assessment Analysis:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                      <li>Payment Method: <span className="font-bold text-slate-800">{selectedOrder.paymentStatus === "PAID" ? "Prepaid (Card/UPI)" : "Cash on Delivery (COD)"}</span></li>
                      {(selectedOrder.shippingAddressLine1 || "").length < 15 && (
                        <li className="text-rose-600 font-medium">⚠️ Short address details (High risk of delivery fail)</li>
                      )}
                      {(selectedOrder.shippingZip || "").trim().length !== 6 && (
                        <li className="text-rose-600 font-medium">⚠️ Zip code format is invalid (Expected 6 digits)</li>
                      )}
                      {(() => {
                        const email = selectedOrder.customerEmail || "";
                        const isValidEmail = email && email.includes("@") && email.includes(".");
                        return !isValidEmail && (
                          <li className="text-rose-600 font-medium">⚠️ Invalid or missing email address</li>
                        );
                      })()}
                      {(() => {
                        const cleanPhone = (selectedOrder.customerPhone || "").replace(/\D/g, "");
                        const isValidPhone = /^(91|0)?[6-9]\d{9}$/.test(cleanPhone);
                        return !isValidPhone && (
                          <li className="text-rose-600 font-medium">⚠️ Invalid phone format (Expected 10-digit Indian number)</li>
                        );
                      })()}
                      {selectedOrder.paymentStatus !== "PAID" && selectedOrder.codVerificationStatus === "UNREACHABLE" && (
                        <li className="text-amber-600 font-medium">⚠️ Customer unreachable during verification attempts</li>
                      )}
                      {selectedOrder.paymentStatus !== "PAID" && selectedOrder.codVerificationStatus === "VERIFIED" && (
                        <li className="text-emerald-600 font-medium">✅ Call verified with customer successfully</li>
                      )}
                      {selectedOrder.paymentStatus === "PAID" && (
                        <li className="text-emerald-600 font-medium font-semibold">✅ Order fully prepaid; low RTO risk</li>
                      )}
                    </ul>
                  </div>

                  {/* Verification Actions */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Call Log Verification</span>
                    {selectedOrder.paymentStatus === "PAID" ? (
                      <div className="bg-emerald-50 border border-emerald-150 rounded-lg p-3 text-[11px] text-emerald-800 font-semibold text-center leading-relaxed">
                        Prepaid Order • Verification Bypassed
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleCodVerify(selectedOrder.id, "VERIFIED")}
                          className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                            selectedOrder.codVerificationStatus === "VERIFIED"
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-emerald-50/50"
                          }`}
                        >
                          Verified
                        </button>
                        <button
                          onClick={() => handleCodVerify(selectedOrder.id, "UNREACHABLE")}
                          className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                            selectedOrder.codVerificationStatus === "UNREACHABLE"
                              ? "bg-amber-600 text-white border-amber-600"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-amber-50/50"
                          }`}
                        >
                          Unreachable
                        </button>
                        <button
                          onClick={() => handleCodVerify(selectedOrder.id, "CANCELLED")}
                          className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                            selectedOrder.codVerificationStatus === "CANCELLED"
                              ? "bg-red-650 text-white border-red-650"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-red-50/50"
                          }`}
                        >
                          Cancelled
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fulfillment workflow */}
                {selectedOrder.deliveryStatus === "PROCESSING" && (
                  <div className="pt-4 border-t border-gray-100">
                    {!isFulfilling ? (
                      <button
                        onClick={() => {
                          if (selectedOrder.paymentStatus !== "PAID" && selectedOrder.codVerificationStatus !== "VERIFIED") {
                            if (!confirm("This order has NOT been COD call verified. Do you still want to proceed with packaging & logistics dispatch?")) {
                              return;
                            }
                          }
                          setIsFulfilling(true);
                          setFulfillmentStep(1);
                          checkItemStocks();
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <FileCheck className="w-4 h-4" />
                        Fulfill and Ship Parcel
                      </button>
                    ) : (
                      <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wide">Fulfillment Wizard</h4>
                          <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            Step {fulfillmentStep} of 2
                          </span>
                        </div>

                        {fulfillmentStep === 1 && (
                          <div className="space-y-3 text-xs">
                            <div className="bg-white border border-gray-200 p-2.5 rounded-lg">
                              <p className="text-gray-400 font-semibold uppercase text-[9px]">Required Picking Item</p>
                              <p className="font-bold text-gray-900 mt-0.5">{targetVariant.name}</p>
                              <p className="font-mono text-[10px] text-indigo-600 mt-0.5">SKU: {targetVariant.sku}</p>
                            </div>

                            {/* Split stock alert option selection */}
                            {showSplitAlert && (
                              <div className="p-3 bg-amber-50 border border-amber-250 rounded-lg text-amber-900 space-y-3">
                                <p className="font-bold flex items-center gap-1">
                                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                                  Split Stock Warning
                                </p>
                                <p className="text-[10px] leading-relaxed">
                                  Stock levels are split across facilities. Total order requires **3 units**. Available stocks:
                                </p>
                                <ul className="text-[10px] list-disc list-inside space-y-0.5">
                                  {targetVariant.stocks.map((s: any) => {
                                    const whName = warehouses.find(w => w.id === s.warehouseId)?.name || "Warehouse";
                                    return (
                                      <li key={s.id}>
                                        {whName}: <span className="font-bold">{s.currentStockLevel} units</span>
                                      </li>
                                    );
                                  })}
                                </ul>

                                <div className="border-t border-amber-200/60 pt-2.5 space-y-2">
                                  <span className="font-bold text-[10px] uppercase">Option A: Split Fulfillment (Assign units)</span>
                                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    {targetVariant.stocks.map((s: any) => {
                                      const wh = warehouses.find(w => w.id === s.warehouseId);
                                      if (!wh) return null;
                                      return (
                                        <div key={s.id} className="space-y-0.5">
                                          <label className="text-gray-650">{wh.code}:</label>
                                          <input
                                            type="number"
                                            min="0"
                                            max={s.currentStockLevel}
                                            value={splitQuantities[wh.id] || 0}
                                            onChange={(e) => setSplitQuantities({
                                              ...splitQuantities,
                                              [wh.id]: Math.min(s.currentStockLevel, parseInt(e.target.value) || 0)
                                            })}
                                            className="w-full bg-white border border-gray-300 rounded p-1 text-center"
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <button
                                    onClick={handleConfirmSplitFulfillment}
                                    className="w-full bg-amber-700 hover:bg-amber-800 text-white py-1 rounded text-[10px] font-bold"
                                  >
                                    Confirm Split Allocation
                                  </button>
                                </div>

                                <form onSubmit={handleInitiateTransfer} className="border-t border-amber-200/60 pt-2.5 space-y-2">
                                  <span className="font-bold text-[10px] uppercase">Option B: Inter-Warehouse Stock Transfer</span>
                                  
                                  <div className="space-y-1 text-[10px]">
                                    <label className="text-gray-650">Source (Transfer From):</label>
                                    <select
                                      value={transferSourceWh}
                                      onChange={(e) => setTransferSourceWh(e.target.value)}
                                      className="w-full bg-white border border-gray-300 rounded p-1 text-[10px]"
                                    >
                                      {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-1 text-[10px]">
                                    <label className="text-gray-650">Destination (Fulfill At):</label>
                                    <select
                                      value={transferDestWh}
                                      onChange={(e) => setTransferDestWh(e.target.value)}
                                      className="w-full bg-white border border-gray-300 rounded p-1 text-[10px]"
                                    >
                                      {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="flex justify-between items-center text-[10px]">
                                    <label className="text-gray-650">Qty to Transfer:</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={transferQty}
                                      onChange={(e) => setTransferQty(Math.max(1, parseInt(e.target.value) || 1))}
                                      className="w-12 text-center bg-white border border-gray-300 rounded p-0.5"
                                    />
                                  </div>

                                  <button
                                    type="submit"
                                    disabled={processingTransfer}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-1 rounded text-[10px] font-bold disabled:opacity-50"
                                  >
                                    {processingTransfer ? "Processing..." : "Process Stock Transfer"}
                                  </button>
                                </form>
                              </div>
                            )}

                            {!showSplitAlert && (
                              <div className="space-y-1">
                                <label className="font-semibold text-gray-700">Scan SKU Code</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Scan barcode or enter SKU..."
                                    value={scannedSku}
                                    onChange={(e) => setScannedSku(e.target.value)}
                                    className="flex-1 bg-white border border-gray-300 rounded p-1.5 text-xs font-mono focus:outline-none"
                                  />
                                  <button
                                    onClick={handleVerifySku}
                                    className="bg-indigo-600 text-white px-2.5 py-1.5 rounded hover:bg-indigo-700 font-bold"
                                  >
                                    Verify
                                  </button>
                                </div>
                                <p className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-1">
                                  <QrCode className="w-3.5 h-3.5" />
                                  Or click: 
                                  <span 
                                    onClick={() => setScannedSku(targetVariant.sku)}
                                    className="text-indigo-600 cursor-pointer underline font-mono"
                                  >
                                    {targetVariant.sku}
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {fulfillmentStep === 2 && (
                          <div className="space-y-3.5 text-xs">
                            <div className="space-y-1">
                              <label className="font-semibold text-gray-700">Courier Partner</label>
                              <select
                                value={selectedCourier}
                                onChange={(e) => setSelectedCourier(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded p-1.5 text-xs focus:outline-none"
                              >
                                <option value="Delhivery">Delhivery</option>
                                <option value="Bluedart">Bluedart</option>
                                <option value="FedEx">FedEx</option>
                                <option value="DTDC">DTDC</option>
                              </select>
                            </div>
                            
                            <div className="space-y-1">
                              <label className="font-semibold text-gray-700">AWB Tracking Number</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="AWB code..."
                                  value={awbNumber}
                                  onChange={(e) => setAwbNumber(e.target.value)}
                                  className="flex-1 bg-white border border-gray-300 rounded p-1.5 text-xs font-mono focus:outline-none"
                                />
                                <button
                                  onClick={autoGenerateAwb}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 rounded font-semibold text-[11px]"
                                >
                                  Auto
                                </button>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => setFulfillmentStep(1)}
                                className="flex-1 py-1.5 border border-gray-300 rounded font-semibold bg-white hover:bg-gray-50 text-gray-700"
                              >
                                Back
                              </button>
                              <button
                                onClick={handleCompleteFulfillment}
                                className="flex-1 py-1.5 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700"
                              >
                                Confirm Dispatch
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400 space-y-3">
                <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 stroke-[1.5]" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">No Order Selected</p>
                  <p className="text-xs text-gray-400 max-w-[200px] mx-auto mt-1">
                    Select a synced shopify order to perform pick verification and configure logistics dispatch details.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
