"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Plus,
  Check,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Building,
  User,
  Mail,
  Loader2,
  Trash2,
  Package,
  Layers,
  ChevronRight,
  TrendingUp,
  X
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface POItem {
  id: string;
  variantId: string;
  quantityOrdered: number;
  quantityReceived: number;
  costPrice: number;
  variant: {
    id: string;
    sku: string;
    title: string;
    size: string;
    color: string;
  };
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  vendorEmail: string | null;
  status: "DRAFT" | "SENT" | "PARTIALLY_RECEIVED" | "COMPLETED" | "CANCELLED";
  warehouseId: string;
  createdAt: string;
  updatedAt: string;
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  items: POItem[];
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  size: string;
  color: string;
}

interface VendorOption {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
}

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [vendorsList, setVendorsList] = useState<VendorOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");

  // Selection & Details
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Modal / Form States for Creating PO
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPO, setNewPO] = useState({
    poNumber: "",
    vendorId: "",
    vendorName: "",
    vendorEmail: "",
    warehouseId: "",
    status: "SENT",
    items: [{ variantId: "", quantityOrdered: 10, costPrice: 0 }]
  });

  // Receiving Quantities States (mapped by variantId -> qtyToReceive)
  const [receiveQtys, setReceiveQtys] = useState<{ [variantId: string]: number }>({});
  const [isReceiving, setIsReceiving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Load POs, Warehouses, Variants
  const loadInitialData = async () => {
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

      const [poRes, varRes, vendorRes] = await Promise.all([
        fetch("/api/purchase-orders"),
        fetch("/api/inventory"),
        fetch("/api/vendors")
      ]);
      const poData = await poRes.json();
      const varData = await varRes.json();
      const vendorData = await vendorRes.json();

      if (Array.isArray(poData)) setPurchaseOrders(poData);
      if (Array.isArray(whData)) {
        setWarehouses(whData);
        if (whData.length > 0) {
          setNewPO(prev => ({ ...prev, warehouseId: whData[0].id }));
        }
      }
      if (Array.isArray(varData)) setVariants(varData);
      if (Array.isArray(vendorData)) setVendorsList(vendorData.filter((v: VendorOption) => v.isActive));
    } catch (err) {
      console.error("Failed to load PO page data:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPO.poNumber || !newPO.vendorId || !newPO.warehouseId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const filteredItems = newPO.items.filter(item => item.variantId !== "" && item.quantityOrdered > 0);
    if (filteredItems.length === 0) {
      toast.error("Please add at least one valid item");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPO,
          items: filteredItems
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success("Purchase Order created successfully");
      setShowCreateModal(false);
      // Reset form
      setNewPO({
        poNumber: "",
        vendorId: "",
        vendorName: "",
        vendorEmail: "",
        warehouseId: warehouses[0]?.id || "",
        status: "SENT",
        items: [{ variantId: "", quantityOrdered: 10, costPrice: 0 }]
      });
      loadInitialData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create PO");
    } finally {
      setIsCreating(false);
    }
  };

  const handleReceiveShipment = async () => {
    if (!selectedPO) return;

    const itemsToReceive = Object.entries(receiveQtys)
      .map(([variantId, quantityToReceive]) => ({
        variantId,
        quantityToReceive
      }))
      .filter(item => item.quantityToReceive > 0);

    if (itemsToReceive.length === 0) {
      toast.error("Please specify quantities to receive");
      return;
    }

    setIsReceiving(true);
    try {
      const res = await fetch(`/api/purchase-orders/${selectedPO.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsToReceive,
          operatorEmail: "admin@seyon.local" // Mocked active user
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success("Inventory received and updated successfully");
      setReceiveQtys({});
      
      // Reload PO details
      const detailRes = await fetch(`/api/purchase-orders/${selectedPO.id}`);
      const updatedPO = await detailRes.json();
      setSelectedPO(updatedPO);

      loadInitialData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to receive inventory");
    } finally {
      setIsReceiving(false);
    }
  };

  const handleCancelPO = async () => {
    if (!selectedPO) return;
    if (!confirm("Are you sure you want to cancel this Purchase Order? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/purchase-orders/${selectedPO.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success("Purchase Order cancelled");
      setSelectedPO(null);
      loadInitialData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to cancel PO");
    }
  };

  // Filtered list
  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || po.status === statusFilter;
    const matchesWarehouse = warehouseFilter === "ALL" || po.warehouseId === warehouseFilter;
    return matchesSearch && matchesStatus && matchesWarehouse;
  });

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
      SENT: "bg-blue-50 text-blue-700 border-blue-200",
      PARTIALLY_RECEIVED: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse",
      COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
      CANCELLED: "bg-rose-50 text-rose-700 border-rose-200"
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status] || ""}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  if (loading && purchaseOrders.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="ml-3 text-sm text-gray-500">Loading Purchase Orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Purchase Orders
          </h1>
          <p className="text-sm text-slate-500">
            Create, manage, and receive vendor inventory deliveries.
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create PO
        </Button>
      </div>

      <div className="space-y-4">
        {/* POs Directory */}
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold text-slate-900">POs Inventory Ledger</CardTitle>
            <div className="text-xs text-slate-400 font-medium">{filteredPOs.length} POs found</div>
          </CardHeader>

          {/* Filter Bar */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search PO#, Vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PARTIALLY_RECEIVED">Partially Received</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-semibold text-slate-700 text-xs">PO Number</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs">Vendor</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs">Destination WH</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs">Items (Recv / Ord)</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs">Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.length > 0 ? (
                  filteredPOs.map((po) => {
                    const totalOrdered = po.items?.reduce((sum, item) => sum + item.quantityOrdered, 0) || 0;
                    const totalReceived = po.items?.reduce((sum, item) => sum + item.quantityReceived, 0) || 0;
                    return (
                      <TableRow 
                        key={po.id} 
                        onClick={() => setSelectedPO(po)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedPO?.id === po.id ? "bg-indigo-50/40" : ""}`}
                      >
                        <TableCell className="font-bold text-slate-900 text-xs">{po.poNumber}</TableCell>
                        <TableCell className="text-slate-600 text-xs">{po.vendorName}</TableCell>
                        <TableCell className="text-slate-500 font-mono text-xs">{po.warehouse?.code || "N/A"}</TableCell>
                        <TableCell className="text-xs">{getStatusBadge(po.status)}</TableCell>
                        <TableCell className="text-slate-600 text-xs font-mono">
                          {totalReceived} / {totalOrdered}
                        </TableCell>
                        <TableCell className="text-slate-400 text-[11px]">
                          {new Date(po.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                      No purchase orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* PO DETAIL & INWARD RECEIVING MODAL */}
      {selectedPO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] relative">
            <div className="p-5 border-b border-gray-100 bg-slate-50/80 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <span>📦</span> PO Details: {selectedPO.poNumber}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  {getStatusBadge(selectedPO.status)}
                  <span className="text-xs text-gray-500 font-mono">
                    Created {new Date(selectedPO.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedPO(null)}
                className="h-8 w-8 p-0 rounded-full border-slate-300 hover:bg-slate-100 text-slate-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto">
              {/* Meta details */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="space-y-1">
                  <span className="text-slate-600 font-semibold flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-600" /> Vendor
                  </span>
                  <span className="font-bold text-slate-900 block text-sm">{selectedPO.vendorName}</span>
                  {selectedPO.vendorEmail && (
                    <span className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                      <Mail className="w-3 h-3 text-indigo-600" /> {selectedPO.vendorEmail}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-slate-600 font-semibold flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-indigo-600" /> Destination Warehouse
                  </span>
                  <span className="font-bold text-slate-900 block text-sm">{selectedPO.warehouse?.name}</span>
                  <span className="text-[11px] text-slate-600 font-mono">Code: {selectedPO.warehouse?.code}</span>
                </div>
              </div>

              {/* Items and received form */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-600" /> Order Items Ledger
                </h3>

                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {selectedPO.items?.map((item) => {
                    const fullyReceived = item.quantityReceived >= item.quantityOrdered;
                    return (
                      <div key={item.id} className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col justify-between gap-2 shadow-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-900 text-xs">{item.variant?.title}</span>
                            <span className="text-[10px] text-slate-600 font-mono block mt-0.5">{item.variant?.sku}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-1.5 py-0.5 rounded mt-1 inline-block mr-1 border border-slate-200">
                              Size: {item.variant?.size}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-1.5 py-0.5 rounded mt-1 inline-block border border-slate-200">
                              Color: {item.variant?.color}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-slate-600 font-medium block">Cost Price</span>
                            <span className="font-semibold text-slate-900 text-xs font-mono">₹{item.costPrice}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
                          <div className="text-xs">
                            <span className="text-slate-600 font-semibold">Received / Ordered:</span>{" "}
                            <span className={`font-bold font-mono ${fullyReceived ? "text-emerald-600" : "text-amber-600"}`}>
                              {item.quantityReceived} / {item.quantityOrdered}
                            </span>
                          </div>

                          {/* Qty Input if PO can still receive items */}
                          {selectedPO.status !== "COMPLETED" && selectedPO.status !== "CANCELLED" && (
                            <div className="flex items-center gap-1">
                              <label className="text-[10px] font-bold text-slate-500 mr-1">Inward Qty:</label>
                              <input
                                type="number"
                                min="0"
                                max={Math.max(0, item.quantityOrdered - item.quantityReceived)}
                                placeholder="0"
                                value={receiveQtys[item.variantId] || ""}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value) || 0);
                                  setReceiveQtys(prev => ({ ...prev, [item.variantId]: val }));
                                }}
                                className="w-20 bg-white border border-slate-300 rounded-md p-1 text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Operations Actions */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                {selectedPO.status !== "COMPLETED" && selectedPO.status !== "CANCELLED" ? (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleReceiveShipment}
                      disabled={isReceiving}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 py-2"
                    >
                      {isReceiving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Receiving Shipment...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" /> Commit Inward Quantity
                        </>
                      )}
                    </Button>

                    {selectedPO.status === "SENT" && (
                      <Button
                        onClick={handleCancelPO}
                        variant="outline"
                        className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Cancel PO
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center text-xs text-slate-400 font-medium">
                    This purchase order is locked in status {selectedPO.status}.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PURCHASE ORDER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 bg-slate-50/80 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <span>🛒</span> Create New Purchase Order
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Procure inventory from suppliers and direct them to a warehouse dock.
                </p>
              </div>
              <Button 
                onClick={() => setShowCreateModal(false)}
                variant="outline" 
                className="p-1 h-7 w-7 text-gray-400 hover:text-gray-900 border-none hover:bg-gray-100 rounded-full"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleCreatePO} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">PO Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PO-10003"
                    value={newPO.poNumber}
                    onChange={(e) => setNewPO(prev => ({ ...prev, poNumber: e.target.value }))}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Target Warehouse *</label>
                  <select
                    value={newPO.warehouseId}
                    onChange={(e) => setNewPO(prev => ({ ...prev, warehouseId: e.target.value }))}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Vendor *</label>
                  <select
                    required
                    value={newPO.vendorId}
                    onChange={(e) => {
                      const vid = e.target.value;
                      const v = vendorsList.find(x => x.id === vid);
                      setNewPO(prev => ({
                        ...prev,
                        vendorId: vid,
                        vendorName: v?.name || "",
                        vendorEmail: v?.email || ""
                      }));
                    }}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select a vendor...</option>
                    {vendorsList.map(v => (
                      <option key={v.id} value={v.id}>{v.name}{v.email ? ` (${v.email})` : ""}</option>
                    ))}
                  </select>
                  {vendorsList.length === 0 && (
                    <p className="text-[10px] text-amber-600 mt-1">No vendors found. Add vendors from the Vendor Directory first.</p>
                  )}
                </div>

              {/* Items Section */}
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-500" /> Line Items Procured
                  </h4>
                  <Button
                    type="button"
                    onClick={() => setNewPO(prev => ({
                      ...prev,
                      items: [...prev.items, { variantId: "", quantityOrdered: 10, costPrice: 0 }]
                    }))}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-none font-semibold text-[10px] px-2.5 py-1 rounded flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </Button>
                </div>

                <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                  {newPO.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex-1 space-y-0.5">
                        <select
                          required
                          value={item.variantId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewPO(prev => {
                              const list = [...prev.items];
                              list[index].variantId = val;
                              return { ...prev, items: list };
                            });
                          }}
                          className="w-full bg-white border border-gray-200 rounded-md p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">Select Variant...</option>
                          {variants.map(v => (
                            <option key={v.id} value={v.id}>{v.title} ({v.sku} - {v.color}/{v.size})</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={item.quantityOrdered}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            setNewPO(prev => {
                              const list = [...prev.items];
                              list[index].quantityOrdered = val;
                              return { ...prev, items: list };
                            });
                          }}
                          className="w-full bg-white border border-gray-200 rounded-md p-1.5 text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="w-28 flex items-center gap-1 bg-white border border-gray-200 rounded-md px-1.5 py-1">
                        <span className="text-[10px] text-gray-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="Cost"
                          value={item.costPrice || ""}
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            setNewPO(prev => {
                              const list = [...prev.items];
                              list[index].costPrice = val;
                              return { ...prev, items: list };
                            });
                          }}
                          className="w-full border-none outline-none p-0.5 text-xs text-left font-mono focus:ring-0"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={() => setNewPO(prev => {
                          if (prev.items.length === 1) return prev;
                          return { ...prev, items: prev.items.filter((_, i) => i !== index) };
                        })}
                        variant="outline"
                        className="p-1 h-8 w-8 text-rose-500 border-none hover:bg-rose-50 rounded-full"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end gap-2 -mx-5 -mb-5 mt-4">
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating PO...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Dispatch Purchase Order
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
