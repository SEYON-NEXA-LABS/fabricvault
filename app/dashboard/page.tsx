"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import { 
  ShoppingBag, 
  IndianRupee, 
  Users, 
  CalendarClock, 
  PackageX, 
  Wallet,
  Settings2,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  RefreshCw,
  MapPin,
  Package
} from "lucide-react";
import { RecentOrderItem, RegionSalesHeatmap } from "@/types/all";

interface DashboardData {
  kpis: {
    totalOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    totalRto: number;
    rtoPercentage: string;
    totalVariants: number;
    totalStockUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  salesData: Array<{ name: string; revenue: number; orders: number }>;
  inventoryData: Array<{ name: string; value: number; fill: string }>;
  rtoData: Array<{ name: string; value: number; fill: string }>;
  topProducts: Array<{ id: number; name: string; sku: string; variants: number; totalStock: number }>;
  recentOrders: RecentOrderItem[];
  lowStockAlerts: Array<{ name: string; sku: string; qty: number; imageUrl?: string }>;
  regionSales: RegionSalesHeatmap[];
}



export default function DashboardPage() {
  const formatDate = (d: Date) => {
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(formatDate(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(formatDate(today));
  const [activePreset, setActivePreset] = useState("Last 30 Days");
  const [showDatePicker, setShowDatePicker] = useState(false);


  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/dashboard?${params.toString()}`);
      const json = await res.json();
      if (json.error) {
        console.error("Dashboard API error:", json.error);
      } else {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [startDate, endDate]);


  const todayStr = formatDate(new Date());


  const presetOptions = [
    "Today", "Yesterday", "Last 7 Days", "Last 30 Days",
    "Q1", "Q2", "Q3", "Q4",
    "Previous Year", "Previous Financial Year"
  ];

  const handlePresetSelect = (presetLabel: string) => {
    setActivePreset(presetLabel);
    const today = new Date();
    const currentYear = today.getFullYear();
    let start = new Date();
    let end = new Date();

    switch (presetLabel) {
      case "Today":
        start = new Date(today);
        end = new Date(today);
        break;
      case "Yesterday":
        start = new Date(today);
        start.setDate(today.getDate() - 1);
        end = new Date(today);
        end.setDate(today.getDate() - 1);
        break;
      case "Last 7 Days":
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        end = new Date(today);
        break;
      case "Last 30 Days":
        start = new Date(today);
        start.setDate(today.getDate() - 30);
        end = new Date(today);
        break;
      case "Q1":
        start = new Date(currentYear, 0, 1);
        end = new Date(currentYear, 2, 31);
        break;
      case "Q2":
        start = new Date(currentYear, 3, 1);
        end = new Date(currentYear, 5, 30);
        break;
      case "Q3":
        start = new Date(currentYear, 6, 1);
        end = new Date(currentYear, 8, 30);
        break;
      case "Q4":
        start = new Date(currentYear, 9, 1);
        end = new Date(currentYear, 11, 31);
        break;
      case "Previous Year":
        start = new Date(currentYear - 1, 0, 1);
        end = new Date(currentYear - 1, 11, 31);
        break;
      case "Previous Financial Year":
        const startYear = today.getMonth() >= 3 ? currentYear - 1 : currentYear - 2;
        start = new Date(startYear, 3, 1);
        end = new Date(startYear + 1, 2, 31);
        break;
      default:
        return;
    }

    // Limit to current date to avoid future entries
    const maxDate = new Date();
    if (start > maxDate) start = new Date(maxDate);
    if (end > maxDate) end = new Date(maxDate);

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
    setShowDatePicker(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Derived values from API data
  const kpis = data?.kpis;
  const salesData = data?.salesData || [];
  const inventoryData = data?.inventoryData || [];
  const rtoData = data?.rtoData || [];
  const topProducts = data?.topProducts || [];
  const recentOrders = data?.recentOrders || [];
  const lowStockAlerts = data?.lowStockAlerts || [];
  const regionSales = data?.regionSales || [];

  const totalInventorySKUs = inventoryData.reduce((sum, d) => sum + d.value, 0);

  const totalRtoValue = rtoData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto relative">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Hello Admin, here's what's happening with your business today.</p>
        </div>
        <div className="flex gap-3 relative">
          <div className="relative">
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="bg-white border border-gray-200 rounded-md px-3 py-1.5 flex items-center text-sm text-gray-600 font-semibold cursor-pointer shadow-sm hover:bg-gray-50 select-none"
            >
              <CalendarClock className="w-4 h-4 mr-2 text-indigo-600" />
              <span>
                {activePreset === "Custom" 
                  ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
                  : activePreset
                }
              </span>
              <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
            </button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 min-w-[340px] space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Preset Ranges</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {presetOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handlePresetSelect(opt)}
                        className={`text-left text-xs px-2.5 py-1.5 rounded transition-colors ${
                          activePreset === opt
                            ? "bg-indigo-50 text-indigo-700 font-bold"
                            : "hover:bg-slate-50 text-gray-700"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                    <button
                      onClick={() => setActivePreset("Custom")}
                      className={`text-left text-xs col-span-2 px-2.5 py-1.5 rounded transition-colors text-center ${
                        activePreset === "Custom"
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "hover:bg-slate-50 text-gray-700 border border-dashed border-gray-200"
                      }`}
                    >
                      Custom Date Range
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Custom Dates</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1 font-semibold">Start Date</label>
                      <input 
                        type="date" 
                        value={startDate}
                        max={todayStr}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val <= todayStr) {
                            setStartDate(val);
                            setActivePreset("Custom");
                          }
                        }}
                        className="w-full bg-slate-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1 font-semibold">End Date</label>
                      <input 
                        type="date" 
                        value={endDate}
                        max={todayStr}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val <= todayStr) {
                            setEndDate(val);
                            setActivePreset("Custom");
                          }
                        }}
                        className="w-full bg-slate-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                  <button 
                    onClick={() => setShowDatePicker(false)}
                    className="text-[11px] font-bold text-gray-500 hover:text-gray-700 px-2.5 py-1"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (startDate > endDate) {
                        alert("Start date cannot be after end date.");
                        return;
                      }
                      setShowDatePicker(false);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1 rounded shadow-sm"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className="bg-white border border-gray-200 rounded-md px-3 py-1.5 flex items-center text-sm text-gray-600 font-semibold shadow-sm hover:bg-gray-50 transition-colors">
            <Settings2 className="w-4 h-4 mr-2 text-gray-400" />
            Customize
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium">Loading dashboard data...</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { title: "Total Orders", value: kpis?.totalOrders?.toString() || "0", icon: ShoppingBag, iconBg: "bg-indigo-100 text-indigo-600", trend: `${kpis?.processingOrders || 0} pending`, trendUp: true, sparklineColor: "#6366f1" },
              { title: "Delivered", value: kpis?.deliveredOrders?.toString() || "0", icon: IndianRupee, iconBg: "bg-emerald-100 text-emerald-600", trend: "completed", trendUp: true, sparklineColor: "#10b981" },
              { title: "Total SKUs", value: kpis?.totalVariants?.toString() || "0", icon: Users, iconBg: "bg-blue-100 text-blue-600", trend: `${kpis?.totalStockUnits || 0} units`, trendUp: true, sparklineColor: "#3b82f6" },
              { title: "Low Stock Alerts", value: kpis?.lowStockCount?.toString() || "0", icon: CalendarClock, iconBg: "bg-orange-100 text-orange-600", trend: "variants below threshold", trendUp: false, sparklineColor: "#f97316" },
              { title: "RTO Percentage", value: `${kpis?.rtoPercentage || "0.00"}%`, icon: PackageX, iconBg: "bg-rose-100 text-rose-600", trend: `${kpis?.totalRto || 0} returns`, trendUp: false, sparklineColor: "#f43f5e" },
              { title: "Shipped In Transit", value: kpis?.shippedOrders?.toString() || "0", icon: Wallet, iconBg: "bg-purple-100 text-purple-600", trend: "parcels en route", trendUp: true, sparklineColor: "#a855f7" },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-2 rounded-lg ${kpi.iconBg}`}>
                    <kpi.icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-1">{kpi.title}</p>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{kpi.value}</h3>
                <div className="flex items-center text-xs font-medium mt-auto">
                  <span className={`flex items-center ${kpi.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {kpi.trendUp ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                    {kpi.trend}
                  </span>
                </div>
                {/* Sparkline SVG */}
                <svg className="absolute bottom-0 left-0 w-full h-10 opacity-30 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 30">
                   <path d="M0,30 Q10,25 20,20 T40,15 T60,25 T80,10 T100,5" fill="none" stroke={kpi.sparklineColor} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            ))}
          </div>

          {/* TOP SECTION: Fulfillment & Operational Alerts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Low Stock Alerts (Priority Operational Card) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                    Low Stock Critical Alerts
                  </h3>
                  <Link href="/dashboard/inventory" className="text-xs font-semibold text-indigo-600 hover:underline">
                    View Catalog →
                  </Link>
                </div>
                <div className="space-y-3">
                  {lowStockAlerts.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center font-bold text-sm">✓</div>
                      <p className="text-xs text-gray-500 font-medium">All warehouse SKUs fully stocked.</p>
                    </div>
                  ) : lowStockAlerts.map((alert, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 shadow-2xs hover:bg-amber-50 transition-colors">
                      <div className="flex items-center gap-3.5">
                        {/* BIGGER EXACT PRODUCT IMAGE (56x56 px) */}
                        <div className="w-14 h-14 bg-white rounded-lg border border-amber-200 shadow-2xs overflow-hidden flex items-center justify-center shrink-0">
                          {alert.imageUrl ? (
                            <img src={alert.imageUrl} className="w-full h-full object-cover" alt={alert.name} />
                          ) : (
                            <Package className="w-7 h-7 text-amber-500/80" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-snug mb-1">{alert.name}</p>
                          <p className="text-[11px] text-gray-500 font-mono">SKU: {alert.sku}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 shadow-2xs">
                          {alert.qty} Pcs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Incoming Orders & Dispatch Status */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-indigo-600" />
                  Recent Customer Orders
                </h3>
                <Link href="/dashboard/orders" className="text-xs font-semibold text-indigo-600 hover:underline">
                  Manage All →
                </Link>
              </div>

              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No incoming orders registered.</p>
                ) : recentOrders.map((order, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-none mb-1">{order.id}</p>
                        <p className="text-[11px] text-gray-500">{order.customer}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-gray-400">{order.time}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${order.statusColor}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs font-extrabold text-gray-900">₹ {order.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RTO Risk Overview */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-gray-900">RTO Risk Overview</h3>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{kpis?.rtoPercentage || "0.00"}% Rate</span>
              </div>
              <div className="flex flex-col items-center justify-center h-48 relative">
                {/* SVG RTO Donut */}
                <svg viewBox="0 0 36 36" className="w-32 h-32 transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f43f5e" strokeWidth="4" strokeDasharray="60 40" strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#fda4af" strokeWidth="4" strokeDasharray="40 60" strokeDashoffset="-60" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total RTO</p>
                  <p className="text-xl font-extrabold text-gray-900">{totalRtoValue}</p>
                </div>
              </div>
            </div>

          </div>

          {/* SECONDARY SECTION: Sales Analytics & Inventory Health Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sales Overview Bar Chart */}
            <div className="lg:col-span-6 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-gray-900">Sales & Revenue Trend</h3>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
                  Synced with Top Range Filter ({activePreset})
                </span>
              </div>

              <div className="flex gap-4 mb-4 text-xs font-medium">
                <div className="flex items-center"><div className="w-3 h-3 bg-indigo-600 rounded-sm mr-2"></div>Revenue (₹)</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-sky-400 rounded-full mr-2"></div>Orders</div>
              </div>
              
              {/* Native Flexbar Micro-Chart */}
              <div className="h-52 w-full flex items-end gap-2 pt-6 pb-2 border-b border-gray-100 relative">
                {salesData.map((item, idx) => {
                  const maxRev = Math.max(...salesData.map((d) => d.revenue), 1000);
                  const heightPercent = Math.max(Math.round((item.revenue / maxRev) * 100), 8);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                      <div className="absolute -top-10 hidden group-hover:flex bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-md font-mono z-30 whitespace-nowrap shadow-xl">
                        ₹{item.revenue.toLocaleString('en-IN')} | {item.orders} orders
                      </div>
                      <div 
                        className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-t-md transition-all duration-300 relative" 
                        style={{ height: `${heightPercent}%` }}
                      >
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sky-400 border border-white" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">{item.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inventory Distribution Donut */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-gray-900">Inventory Status</h3>
              </div>
              <div className="flex flex-col items-center justify-center h-48 relative">
                <svg viewBox="0 0 36 36" className="w-32 h-32 transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="75 25" strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="18 82" strokeDashoffset="-75" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="7 93" strokeDashoffset="-93" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total SKUs</p>
                  <p className="text-xl font-extrabold text-gray-900">{totalInventorySKUs}</p>
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-gray-900">Top Moving SKUs</h3>
                <Link href="/dashboard/inventory" className="text-xs font-semibold text-indigo-600 hover:underline">
                  View All →
                </Link>
              </div>

              <div className="space-y-3">
                {topProducts.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No products found.</p>
                ) : topProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-3">{product.id}</span>
                      <div className="w-8 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                        <img src={`https://picsum.photos/seed/${product.id}/40/40`} className="w-full h-full object-cover mix-blend-multiply opacity-80" alt="" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 leading-none mb-1">{product.name}</p>
                        <p className="text-[10px] text-gray-500">{product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900 leading-none mb-1">{product.totalStock} units</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* TERTIARY SECTION: Regional State & City Sales Heatmap */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  State & City Sales Regional Heatmap
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Geographic order volume and revenue contribution across Indian retail hubs</p>
              </div>
              <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100">
                Pan-India Logistics Active
              </span>
            </div>

            {regionSales.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No regional order data available for selected period.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {regionSales.map((region, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-150/80 space-y-2.5 hover:shadow-sm transition-all relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-900">{region.state}</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded text-white font-mono" style={{ backgroundColor: region.color }}>
                        {region.percentage}%
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">{region.city}</p>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${region.percentage}%`, backgroundColor: region.color }} 
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] pt-1">
                      <span className="text-gray-500 font-mono">{region.orders} Orders</span>
                      <span className="font-bold text-gray-900">{region.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>


        </>
      )}
    </div>
  );
}
